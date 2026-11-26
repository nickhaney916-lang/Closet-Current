import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = resolve(process.env.APP_SOURCE_ROOT ?? 'public');
const owner = 'assignment-30-owner';
const otherOwner = 'assignment-30-other';
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server = createServer(async (request, response) => {
 try {
  const requestURL = new URL(request.url, 'http://127.0.0.1');
  const {pathname} = requestURL;
  if (pathname === '/auth/v1/logout') {
   response.writeHead(204).end();
   return;
  }
  if (request.method === 'POST' && pathname === '/auth/v1/token') {
   let body = '';
   for await (const chunk of request) body += chunk;
   const credentials = JSON.parse(body);
   const refreshing = requestURL.searchParams.get('grant_type') === 'refresh_token';
   const id = [owner,otherOwner].find(account => refreshing
    ? credentials.refresh_token === account+'-refresh'
    : credentials.email === account+'@example.test' && credentials.password === 'synthetic test password');
   if (!id) {
    response.writeHead(401).end();
    return;
   }
   response.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify({
    access_token:id+'-token', refresh_token:id+'-refresh', expires_in:3600,
    user:{id,email:id+'@example.test'}
   }));
   return;
  }
  const file = resolve(root, '.'+pathname);
  assert.ok(file.startsWith(root+sep));
  let content = await readFile(file);
  if (pathname === '/trend-data.json') {
   const library = JSON.parse(content);
   library.sources[0].title = sourceTitle;
   library.sources.push({id:'inert-canary',title:'Unusable feed source',url:'file:///inert-canary'});
   content = JSON.stringify(library);
  }
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
 ['blue','Café & <em>linen</em>','Tops','T-shirt','Blue','commons-0001'],
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

const ownerTitle = 'Café & <em>linen</em>';
const outfitTitle = 'Été & <em>layers</em>';
const sourceTitle = 'Éditorial & <em>style</em>';
const safeURL = 'https://reference.example/look?color=blue&size=m';
const misleadingURL = 'https://reference.example@destination.example/look';

async function exercise(browser, engine, width) {
 const context = await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 try {
  const unexpectedRequests = [];
  await context.route('**/*', route => {
   const url = route.request().url();
   if (url.startsWith(origin+'/')) return route.continue();
   const builtInTrend = url.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?');
   const builtInFont = url === 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500&display=swap';
   if (!builtInTrend && !builtInFont) {
    unexpectedRequests.push(url);
   }
   return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const field = id => page.locator('#'+id);
  const signIn = async (id = owner) => {
   await field('authEmail').fill(id+'@example.test');
   await field('authPassword').fill('synthetic test password');
   await field('authSubmit').click();
   await page.waitForFunction(() => boardInitialized && window.closetAuth?.user && !document.querySelector('#appShell').hidden);
  };
  const openMore = async view => {
   await page.locator('#moreMenu summary').click();
   await page.locator('#moreMenu [data-view='+view+']').click();
  };
  await page.goto(origin+'/index.html');
  await signIn();
  const fixtures = await seed(page);
  await page.locator('.tab[data-view=closet]').click();
  await field('closetAllPieces').click();
  await field('search').fill(ownerTitle);
  await page.getByRole('button',{name:'Wear '+ownerTitle,exact:true}).waitFor();
  await openMore('builder');
  await page.locator('.board-slot-top').click();
  await page.getByRole('dialog').getByRole('button',{name:new RegExp('Café')}).click();
  assert.equal(await page.locator('.board-slot-top img').getAttribute('src'), fixtures[0].image);
  await field('boardName').fill(outfitTitle);
  await field('saveBoard').click();
  await field('savedBoards').getByRole('button',{name:outfitTitle,exact:true}).waitFor();

  const feed = field('boardTrendSources');
  await feed.getByText(sourceTitle,{exact:true}).waitFor({state:'attached'});
  assert.equal(await feed.locator('em').count(),0);
  assert.equal(await feed.getByText('Unusable feed source').count(),0);

  // Exercise the production inspiration form and the restore validator with inert URLs.
  await openMore('trends');
  await field('exampleLook').click();
  await field('lookTitle').fill(sourceTitle);
  await field('lookUrl').fill(misleadingURL);
  await field('saveLook').click();
  await page.waitForFunction(() => !document.querySelector('#saveLook').disabled);
  assert.equal(await field('savedLooks').locator('a').count(),0,'Credentials must not produce a saved link');
  await field('lookUrl').fill(safeURL);
  await field('saveLook').click();
  const source = field('savedLooks').locator('a');
  await source.waitFor();
  assert.equal(await source.getAttribute('href'),safeURL);
  assert.match(await source.innerText(),/reference\.example/);
  assert.equal(await source.getAttribute('rel'),'noopener noreferrer');

  await page.evaluate(async () => {
   await importLooks([
    {id:'unsafe',title:'Restored <em>canary</em>',sourceUrl:'file:///inert-canary',pieces:[]},
    {id:'misleading',title:'Restored destination',sourceUrl:'https://reference.example@destination.example/look',pieces:[]}
   ]);
  });
  await page.reload();
  await page.waitForFunction(() => boardInitialized && window.closetAuth?.user);
  await openMore('trends');
  await field('savedLooks').getByText('Restored <em>canary</em>',{exact:true}).waitFor();
  assert.equal(await field('savedLooks').locator('a').count(),1);
  assert.equal(await field('savedLooks').locator('em').count(),0);
  await openMore('builder');
  await field('savedBoards').getByRole('button',{name:outfitTitle,exact:true}).waitFor();
  assert.equal(await field('savedBoards').locator('em').count(),0);
  assert.deepEqual(await page.evaluate(async () => {
   const row = (await readAll()).find(item => item.id === 'blue');
   return [row.name,row.originalPhoto.sha256,(await readAll()).length];
  }),[ownerTitle,fixtures[0].originalPhoto.sha256,fixtures.length]);
  await page.evaluate(() => document.getElementById('logout').click());
  await field('authEmail').waitFor();
  await signIn(otherOwner);
  await openMore('trends');
  await field('savedLooks').getByText('Save a look to build your inspiration collection.').waitFor();
  await openMore('builder');
  assert.equal(await field('savedBoards').getByRole('button',{name:outfitTitle,exact:true}).count(),0);
  assert.equal(await page.evaluate(async () => (await readAll()).length),0);
  assert.deepEqual(errors,[]);
  assert.deepEqual(unexpectedRequests,[]);
  console.log(JSON.stringify({engine,width,result:'PASS',checks:['literal wardrobe and outfit text','2D source photo','inspiration form and restore URLs','reload and original digest','network allowlist','literal feed text','owner switch']}));
 } finally {
  await context.close();
 }
}

let failures = 0;
try {
 for (const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
  if (process.env.A30_ENGINE && process.env.A30_ENGINE !== engine) continue;
  const browser = await type.launch();
  try {
   for (const width of [320,390,430]) {
    try { await exercise(browser,engine,width); }
    catch (error) {
     failures++;
     console.error(JSON.stringify({engine,width,result:'FAIL',message:error.message}));
    }
   }
  } finally {
   await browser.close();
  }
 }
} finally {
 server.close();
}
if (failures) process.exitCode = 1;
