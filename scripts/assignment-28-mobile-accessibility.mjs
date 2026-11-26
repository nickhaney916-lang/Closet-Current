import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = resolve(process.env.APP_SOURCE_ROOT ?? 'public');
const owner = 'assignment-28-owner';
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server = createServer(async (request, response) => {
 try {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  if (request.method === 'POST' && pathname === '/auth/v1/token') {
   let body = '';
   for await (const chunk of request) body += chunk;
   const credentials = JSON.parse(body);
   if (credentials.email !== owner+'@example.test' || credentials.password !== 'synthetic test password') {
    response.writeHead(401).end();
    return;
   }
   response.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify({
    access_token:'local-test-token', refresh_token:'local-test-refresh', expires_in:3600,
    user:{id:owner,email:credentials.email}
   }));
   return;
  }
  const file = resolve(root, '.'+pathname);
  assert.ok(file.startsWith(root+sep));
  let content = await readFile(file);
  // Use the ordinary sign-in form against a disposable loopback auth fixture.
  if (pathname === '/auth.js') {
   const source = content.toString();
   assert.match(source, /\bURL='[^']+'/);
   content = source.replace(/\bURL='[^']+'/, 'URL='+JSON.stringify(origin));
  }
  response.writeHead(200, {'content-type':mime[extname(file)] ?? 'application/octet-stream'}).end(content);
 } catch {
  response.writeHead(404).end();
 }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:'+server.address().port;
const specs = [
 ['blue','Blue shirt','Tops','T-shirt','Blue','commons-0001'],
 ['red','Red shirt','Tops','T-shirt','Red','commons-0002'],
 ['jeans','Blue jeans','Bottoms','Jeans','Blue','commons-0023']
];

async function seed(page) {
 const locks = JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
 const fixtures = await Promise.all(specs.map(async ([id,name,category,itemType,color,fixture]) => {
  const bytes = await readFile('benchmark/fixtures/'+fixture+'.jpg');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, locks.find(row => row.id === fixture && row.verified)?.sha256);
  const image = 'data:image/jpeg;base64,'+bytes.toString('base64');
  return {id,name,category,itemType,color,image,ownerId:owner,originalPhoto:{image,sha256},
   sourceSHA256:sha256,sourceHashVerified:true,sourcePhotoOriginal:true,
   ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true,seasons:[]};
 }));
 await page.evaluate(async rows => {
  await writeAll(rows);
  items = (await readAll()).map(normalizeClothing);
  render();
 }, fixtures);
 return fixtures;
}

async function exercise(browser, engine, width) {
 const context = await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 try {
  await context.route('**/*', route => route.request().url().startsWith(origin+'/')
   ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const locator = selector => page.locator(selector);
  const focused = target => target.evaluate(el => el === document.activeElement);
  const expectFocus = async target => {
   try { await target.and(locator(':focus')).waitFor({timeout:2000}); }
   catch (error) { throw Error('Expected '+target+' but focus is '+await page.evaluate(() => document.activeElement?.outerHTML.slice(0,160)),{cause:error}); }
   assert.equal(await focused(target), true);
  };
  const activate = async target => {
   await target.focus();
   await expectFocus(target);
   await page.keyboard.press('Enter');
  };
  await page.goto(origin+'/index.html');
  await locator('#authEmail').fill(owner+'@example.test');
  await locator('#authPassword').fill('synthetic test password');
  await activate(locator('#authSubmit'));
  await page.waitForFunction(() => boardInitialized && window.closetAuth?.user && !document.querySelector('#appShell').hidden);
  const fixtures = await seed(page);
  await page.addStyleTag({content:'html { text-size-adjust: none; }'});
  const checkReflow = async target => {
   const result = await target.evaluate(el => ({
    available:el.clientWidth, content:el.scrollWidth,
    scrollX: window.scrollX, innerWidth:window.innerWidth,
    outside: Array.from(el.querySelectorAll('*')).filter(node => {
     const box=node.getBoundingClientRect();
     return box.width && box.right > el.getBoundingClientRect().right+1;
    }).filter(node => node.checkVisibility()).slice(0,18).map(node => [node.id||node.className||node.tagName, Math.round(node.getBoundingClientRect().right)])
   }));
   assert.ok(result.content <= result.available+1, 'Horizontal overflow: '+JSON.stringify(result));
  };
  const enlarge = () => page.evaluate(() => {
   const controls = Array.from(document.querySelectorAll(
    '#appShell :is(button,summary,input,select,h2,h3,p,span,strong,small,label)'
   )).filter(el => !el.hasAttribute('data-test-enlarged'))
    .map(el => [el, getComputedStyle(el).fontSize]);
   for (const [el,size] of controls) {
    el.setAttribute('data-test-enlarged','');
    el.style.fontSize = parseFloat(size)*2+'px';
   }
  });
  await activate(locator('.tab[data-view=closet]'));
  await expectFocus(locator('#closet h2'));
  const category = locator('.closet-category-base');
  await activate(category);
  await expectFocus(locator('#closetBack'));
  await page.keyboard.press('Enter');
  await expectFocus(category);
  await activate(locator('#closetAllPieces'));
  await locator('#search').fill('Blue shirt');
  const wear = page.getByRole('button',{name:'Wear Blue shirt',exact:true});
  await activate(wear);
  await page.getByText('Blue shirt added to your look.',{exact:true}).waitFor();
  await expectFocus(wear);
  await activate(locator('.closet-refine summary'));
  await locator('#seasonFilter').selectOption('Winter');
  await page.getByText('No matching pieces.',{exact:true}).waitFor();
  await locator('#seasonFilter').selectOption('');
  await wear.waitFor();
  await activate(locator('#moreMenu summary'));
  await page.keyboard.press('Tab');
  await expectFocus(locator('#moreMenu [data-view=builder]'));
  await page.keyboard.press('Enter');
  await expectFocus(locator('#builder h2').first());
  const top = locator('.board-slot-top');
  const dialog = page.getByRole('dialog',{name:'Choose base shirt or dress'});
  await activate(top);
  await dialog.waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await expectFocus(top);
  await activate(top);
  await activate(dialog.getByRole('button',{name:/Red shirt.*Select for 2D outfit/}));
  await dialog.waitFor({state:'hidden'});
  await expectFocus(top);
  assert.match(await top.getAttribute('aria-label'), /Red shirt/);
  assert.equal(await top.locator('img').getAttribute('src'), fixtures[1].image);
  await locator('#boardName').fill('Mobile outfit');
  await activate(locator('#saveBoard'));
  const saved = locator('#savedBoards').getByRole('button',{name:'Mobile outfit',exact:true});
  await saved.waitFor();
  await activate(locator('#saveBoard'));
  await page.waitForFunction(() => !document.querySelector('#saveBoard').disabled);
  assert.equal(await saved.count(), 1);
  await locator('#savedOutfitSearch').fill('Mobile outfit');
  await activate(saved);
  await expectFocus(locator('#savedOutfitManage'));
  page.once('dialog', confirmation => confirmation.dismiss());
  await activate(locator('#removeSavedOutfit'));
  assert.equal(await saved.count(), 1);
  await activate(top);
  await activate(locator('#emptyBoardSlot'));
  await expectFocus(top);
  assert.match(await top.getAttribute('aria-label'), /empty/);
  await activate(locator('.tab[data-view=stylist]'));
  await expectFocus(locator('#stylist h2'));
  await activate(locator('#createCollectionOutfits'));
  await locator('#styledCollectionResults .styled-outfit').first().waitFor();
  await activate(locator('#styledCollectionResults .styled-outfit').first().getByRole(
   'button',{name:'Adjust on outfit board'}
  ));
  await expectFocus(locator('#builder h2').first());
  await enlarge();
  await checkReflow(locator('html'));
  await checkReflow(locator('.main-nav'));
  await activate(top);
  await dialog.waitFor();
  await enlarge();
  await checkReflow(dialog);
  await page.keyboard.press('Escape');
  await expectFocus(top);
  await activate(locator('.tab[data-view=closet]'));
  await checkReflow(locator('html'));
  assert.ok((await locator('.tab[data-view=closet]').boundingBox()).height >= 44);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({engine,width,result:'PASS'}));
 } finally {
  await context.close();
 }
}

try {
 for (const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
  if (process.env.A28_ENGINE && process.env.A28_ENGINE !== engine) continue;
  const executablePath = engine === 'chromium' ? process.env.A28_CHROMIUM_PATH : undefined;
  const browser = await type.launch({executablePath});
  try {
   for (const width of [320,390,430]) await exercise(browser,engine,width);
  } finally {
   await browser.close();
  }
 }
} finally {
 server.close();
}
