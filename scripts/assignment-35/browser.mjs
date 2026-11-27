import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';

const root = resolve(process.env.APP_SOURCE_ROOT || 'dist');
const output = 'benchmark/assignment-35';
const accounts = ['quality-owner-a', 'quality-owner-b'];
const authOrigin = 'https://hlkgymugtfbirlpunsra.supabase.co';
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const listener = createServer(async (request, response) => {
 try {
  const {pathname} = new URL(request.url, 'http://127.0.0.1');
  const filename = resolve(root, '.'+(pathname === '/' ? '/index.html' : pathname));
  assert.ok(filename.startsWith(root+sep));
  const content = await readFile(filename);
  response.writeHead(200, {'content-type':mime[extname(filename)] ?? 'application/octet-stream'}).end(content);
 } catch {
  response.writeHead(404).end();
 }
});
await new Promise(done => listener.listen(0, '127.0.0.1', done));
const appOrigin = 'http://127.0.0.1:'+listener.address().port;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = JSON.parse(await readFile('benchmark/locked-photo-sources.json', 'utf8'));
async function garment(id, name, ownerId, fixture) {
 const bytes = await readFile('benchmark/fixtures/'+fixture+'.jpg');
 const sha256 = hash(bytes);
 assert.equal(sources.find(source => source.id === fixture && source.verified)?.sha256, sha256);
 const image = 'data:image/jpeg;base64,'+bytes.toString('base64');
 return {id,name,ownerId,image,category:'Tops',itemType:'T-shirt',color:'Blue',
  originalPhoto:{image,sha256},sourceSHA256:sha256,sourceHashVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true};
}
const [ownerA, ownerB] = accounts;
const [savedA, savedB] = await Promise.all([
 garment('row-000','Linen top',ownerA,'commons-0053'),
 garment('row-001','Linen top',ownerA,'commons-0064')
]);

async function readState(page) {
 return page.evaluate(() => new Promise((resolve, reject) => {
  const transaction = db.transaction(['items','state']);
  const saved = transaction.objectStore('items').getAll();
  const state = transaction.objectStore('state');
  const wear = state.get('outfit-wear-history-v1');
  const board = state.get('outfit-board');
  transaction.oncomplete = () => resolve({saved:saved.result,wear:wear.result,board:board.result});
  transaction.onabort = () => reject(transaction.error);
 }));
}

const login = async (page, owner) => {
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('synthetic test password');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(owner => window.closetAuth?.user?.id === owner &&
  db?.name === 'closet-current-user-'+owner && boardInitialized, owner);
};
const signOut = async page => {
 const confirmed = page.waitForResponse(response => response.url() === authOrigin+'/auth/v1/logout' && response.status() === 204);
 await page.evaluate(() => document.getElementById('logout').click());
 await confirmed;
 await page.locator('#authEmail').waitFor();
};
async function openMyCloset(page, backup = false) {
 await page.locator('.tab[data-view=closet]').click();
 if (backup) await page.locator('details.closet-backup > summary').click();
}
async function openBuilder(page) {
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu [data-view=builder]').click();
}
async function exercise(browser, engine, width) {
 const externalWrites = [];
 const pageErrors = [];
 const contexts = [];
 async function makeContext() {
  const context = await browser.newContext({viewport:{width,height:844},isMobile:true,
   hasTouch:true,serviceWorkers:'block',acceptDownloads:true});
  contexts.push(context);
  await context.route('**/*', async route => {
   const request = route.request();
   const target = new URL(request.url());
   if (target.origin === appOrigin) return route.continue();
   if (target.origin === authOrigin && request.method() === 'POST') {
    if (target.pathname === '/auth/v1/logout') return route.fulfill({status:204,body:''});
    if (target.pathname === '/auth/v1/token') {
     const credentials = request.postDataJSON();
     const refresh = target.searchParams.get('grant_type') === 'refresh_token';
     const username = accounts.find(id => refresh ? credentials.refresh_token === id+'-refresh' :
      credentials.email === id+'@example.test' && credentials.password === 'synthetic test password');
     if (!username) return route.fulfill({status:401,json:{error_code:'invalid_credentials'}});
     return route.fulfill({json:{access_token:username+'-token',refresh_token:username+'-refresh',
      expires_in:3600,user:{id:username,email:username+'@example.test'}}});
    }
   }
   if (request.method() !== 'GET') externalWrites.push({method:request.method(),origin:target.origin});
   return route.abort();
  });
  return context;
 }
 async function open(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => pageErrors.push(error.message));
  // The deterministic fixture issues a fixed token. Keep two tabs on the
  // same fixed expiry so a fixture refresh does not rotate the lease.
  await page.clock.setFixedTime(new Date('2026-11-26T20:00:00Z'));
  await page.goto(appOrigin, {waitUntil:'domcontentloaded'});
  return page;
 }
 try {
  const context = await makeContext();
  const page = await open(context);
  await login(page, ownerA);
  await openMyCloset(page);
  const panel = page.locator('#wardrobeQuality');
  const toggle = page.locator('#wardrobeQualityToggle');
  const filter = page.locator('#wardrobeQualityFilter');
  const list = page.locator('#wardrobeQualityRows');
  const edit = id => list.locator('[data-garment-id="'+id+'"]');
  const editor = page.getByRole('dialog',{name:'Adjust clothing details'});
  const status = text => page.waitForFunction(expected =>
   document.getElementById('wardrobeQualityStatus')?.textContent === expected,text);
  assert.equal(await toggle.count(),1,'My Closet lacks a saved-metadata review entry');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await status('No saved clothing yet.');
  assert.equal(await page.locator('#wardrobeQualityTitle').evaluate(title => document.activeElement === title),true);
  await toggle.click();
  assert.equal(await panel.isVisible(),false);

  async function seed(size,outstanding) {
   return page.evaluate(async ({size,outstanding,savedA,savedB,ownerA}) => {
    const thumb = document.createElement('canvas').toDataURL('image/jpeg');
    const complete = {name:'Linen top',category:'Tops',itemType:'Blouse',color:'Blue',
     seasons:['Summer'],ownerId:ownerA,image:thumb};
    const rows = Array.from({length:size},(_,i) => ({...complete,id:'row-'+String(i).padStart(3,'0')}));
    if (outstanding) {
     rows[0] = {...savedA,image:thumb,seasons:['Summer']};
     delete rows[0].color;
     rows[1] = {...savedB,image:thumb,seasons:['Summer'],color:'Unknown',colorSource:'user'};
     delete rows[2].category;
     delete rows[2].ownerId;
     Object.assign(rows[3],{itemType:'Legacy style',seasons:['Monsoon']});
     rows[4].category = 'Uncategorized';
     for (const row of rows.slice(5)) row.seasons = [];
    }
    await writeAll(rows);
    items = (await readAll()).map(normalizeClothing);
    render();
   },{size,outstanding,savedA,savedB,ownerA});
  }
  await seed(25,false);
  await toggle.click();
  await status('All saved pieces have these details.');
  await toggle.click();
  const timings = [];
  for (const size of [25,100,250,500]) {
   await seed(size,true);
   const before = await readState(page);
   const duration = await page.evaluate(() => new Promise((resolve,reject) => {
    const start = performance.now();
    const status = document.getElementById('wardrobeQualityStatus');
    const timeout = setTimeout(() => {observer.disconnect();reject(Error('Review did not finish'));},5000);
    const observer = new MutationObserver(() => {
     if (!status.textContent.startsWith('Showing ')) return;
     clearTimeout(timeout);
     observer.disconnect();
     requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now()-start)));
    });
    observer.observe(status,{childList:true});
    document.getElementById('wardrobeQualityToggle').click();
   }));
   timings.push({garments:size,openToFrameMs:Math.round(duration)});
   assert.deepEqual(await filter.locator('option').allTextContents(),
    ['All details ('+size+')','Category (2)','Item type (1)','Color (2)','Seasons ('+(size-4)+')']);
   assert.equal(await list.locator('li').count(),20);
   await page.locator('#wardrobeQualityMore').click();
   assert.equal(await list.locator('li').count(),Math.min(size,40));
   assert.equal(await list.locator('button').nth(20).evaluate(control => document.activeElement === control),true);
   await filter.selectOption('color');
   assert.equal(await list.locator('li').count(),2);
   await list.getByText('Color · Not set',{exact:true}).waitFor();
   await list.getByText('Color · Recorded as unknown',{exact:true}).waitFor();
   for (const row of [savedA,savedB]) {
    const data = await list.locator('li').filter({has:page.locator('[data-garment-id="'+row.id+'"]')}).locator('img').getAttribute('src');
    assert.equal(hash(Buffer.from(data.split(',')[1],'base64')),row.sourceSHA256);
   }
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
   await toggle.click();
   assert.deepEqual(await readState(page),before);
  }

  await openBuilder(page);
  await page.locator('.board-slot-top').click();
  await page.getByRole('dialog').getByRole('button',{name:/Linen top/}).first().click();
  await page.locator('#boardName').fill('Linen outfit');
  await page.locator('#saveBoard').click();
  await page.locator('#savedBoards').getByRole('button',{name:'Linen outfit',exact:true}).waitFor();
  const before = await readState(page);

  await openMyCloset(page);
  await toggle.click();
  await status('Showing 20 of 500 pieces to review. Details are optional.');
  await filter.selectOption('color');
  await edit('row-001').focus();
  await page.keyboard.press('Enter');
  await editor.waitFor();
  assert.equal(await editor.getByRole('button',{name:'Fill missing details from photo'}).count(),0);
  await editor.getByRole('textbox',{name:'Color',exact:true}).fill('Discard this');
  page.once('dialog', dialog => dialog.accept());
  await editor.getByRole('button',{name:'Cancel',exact:true}).click();
  await editor.waitFor({state:'hidden'});
  await page.waitForFunction(() => document.activeElement?.dataset.garmentId === 'row-001');
  assert.deepEqual(await readState(page),before);

  await context.setOffline(true);
  await edit('row-000').click();
  await editor.getByRole('textbox',{name:'Color',exact:true}).fill('Navy blue');
  await editor.getByRole('button',{name:'Save changes'}).click();
  await editor.waitFor({state:'hidden'});
  await status('Showing 1 of 1 pieces to review. Details are optional.');
  assert.equal(await filter.inputValue(),'color');
  assert.equal(await edit('row-000').count(),0);
  const after = await readState(page);
  assert.deepEqual(after.saved[0],{...before.saved[0],color:'Navy blue',colorSource:'user'});
  assert.deepEqual(after.saved.slice(1),before.saved.slice(1));
  assert.deepEqual(after.board,before.board);
  assert.deepEqual(after.wear,before.wear);
  await context.setOffline(false);

  await filter.selectOption('itemType');
  await list.getByText('Item type · Unsupported saved value',{exact:true}).waitFor();
  await edit('row-003').click();
  await editor.getByRole('checkbox',{name:'Fall',exact:true}).check();
  await editor.getByRole('button',{name:'Save changes'}).click();
  await editor.waitFor({state:'hidden'});
  assert.deepEqual((await readState(page)).saved[3],{...before.saved[3],seasons:['Fall']});

  await page.reload();
  await page.waitForFunction(() => boardInitialized && window.closetAuth?.user && db);
  await openMyCloset(page);
  await toggle.click();
  await filter.locator('option').first().waitFor({state:'attached'});
  await filter.selectOption('color');
  await edit('row-001').waitFor();
  await page.evaluate(() => new Promise((resolve,reject) => {
   const tx = db.transaction('items','readwrite');
   tx.objectStore('items').delete('row-001');
   tx.oncomplete = resolve;
   tx.onabort = () => reject(tx.error);
  }));
  await edit('row-001').click();
  await status('This piece changed or was removed. Reload My Closet to review current details.');
  assert.equal(await editor.count(),0);
  assert.equal((await readState(page)).saved.some(row => row.id === 'row-001'),false);

  await toggle.click();
  // Hold a native read result in a stale tab and release it after the other owner signs in.
  const stale = await open(context);
  await stale.waitForFunction(() => boardInitialized && window.closetAuth?.user && db);
  await openMyCloset(stale);
  await stale.evaluate(() => {
   const read = readAllFrom;
   readAllFrom = ownerDB => new Promise(resolve => {
    const pending = read(ownerDB);
    window.releaseQualityRead = async () => resolve(await pending);
    readAllFrom = read;
   });
   document.getElementById('wardrobeQualityToggle').click();
  });
  await signOut(page);
  await stale.waitForFunction(() => document.querySelector('#wardrobeQuality').hidden &&
   !document.querySelector('#wardrobeQualityRows li'));
  await login(page,ownerB);
  await openMyCloset(page);
  await toggle.click();
  await status('No saved clothing yet.');
  await stale.evaluate(() => window.releaseQualityRead());
  assert.equal(await stale.locator('#wardrobeQualityRows li').count(),0);
  assert.equal(await list.locator('li').count(),0);
  assert.deepEqual((await readState(page)).saved,[]);
  assert.deepEqual(pageErrors,[]);
  assert.deepEqual(externalWrites,[]);
  return {engine,width,result:'PASS',timings,originalHashesVerified:true,stableOutfit:true,
   staleIdRejected:true,staleReadRejected:true,offlineEdit:true};

 } finally {
  for (const context of contexts) await context.close();
 }
}

const results = [];
try {
 for (const [engine,type] of Object.entries({chromium,webkit})) {
  if (process.env.A35_ENGINE && process.env.A35_ENGINE !== engine) continue;
  const browser = await type.launch();
  try {
   for (const width of [320,390,430]) {
    if (process.env.A35_WIDTH && Number(process.env.A35_WIDTH) !== width) continue;
    try { results.push(await exercise(browser,engine,width)); }
    catch (error) { results.push({engine,width,result:'FAIL',error:error.stack}); }
   }
  } finally { await browser.close(); }
 }
 assert.ok(results.length, 'No requested browser cases executed');
} finally {
 await new Promise(done => listener.close(done));
 await mkdir(output, {recursive:true});
 await writeFile(output+'/quality-'+(process.env.A35_ENGINE || 'both')+'.json', JSON.stringify(results,null,2)+'\n');
 for (const result of results) console.log(JSON.stringify(result));
}
if (results.some(result => result.result !== 'PASS')) process.exitCode = 1;
