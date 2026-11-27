import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';

const root = resolve('dist');
const output = 'benchmark/assignment-36';
const accounts = ['recovery-owner-a', 'recovery-owner-b'];
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
const [savedA, savedB, draftA] = await Promise.all([
 garment('same-local-id','Owner A top',ownerA,'commons-0053'),
 garment('same-local-id','Owner B top',ownerB,'commons-0064'),
 garment('pending','Owner A pending original',ownerA,'commons-0067')
]);
draftA.ownerReviewed = false;

async function readState(page) {
 return page.evaluate(() => new Promise((resolve, reject) => {
  const transaction = db.transaction(['items','state']);
  const saved = transaction.objectStore('items').getAll();
  const state = transaction.objectStore('state');
  const draft = state.get('draft');
  const board = state.get('outfit-board');
  transaction.oncomplete = () => resolve({saved:saved.result,pending:draft.result?.batch ?? [],board:board.result});
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
async function seedGarment(page, value) {
 await page.evaluate(async row => {
  await writeAll([row]);
  items = (await readAll()).map(normalizeClothing);
  render();
 }, value);
}
function verifyPhoto(row, original) {
 assert.equal(row.id, original.id);
 assert.equal(row.ownerId, original.ownerId);
 assert.equal(row.name, original.name);
 assert.equal(row.sourceSHA256, original.sourceSHA256);
 assert.equal(row.originalPhoto.sha256, original.originalPhoto.sha256);
 assert.equal(hash(Buffer.from(row.originalPhoto.image.split(',')[1], 'base64')), original.sourceSHA256);
}
async function reportStatus(page, expression) {
 await page.waitForFunction(pattern => new RegExp(pattern).test(document.getElementById('message')?.textContent), expression);
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
  const shared = await makeContext();
  const ownerTab = await open(shared);
  await login(ownerTab, ownerA);
  await seedGarment(ownerTab, savedA);
  await openBuilder(ownerTab);
  await ownerTab.locator('.board-slot-top').click();
  await ownerTab.getByRole('dialog').getByRole('button',{name:/Owner A top/}).click();
  await ownerTab.locator('#boardName').fill('Owner A named outfit');
  await ownerTab.locator('#saveBoard').click();
  const savedOutfit = ownerTab.locator('#savedBoards').getByRole('button',{name:'Owner A named outfit',exact:true});
  await savedOutfit.waitFor();
  const baseline = await readState(ownerTab);
  assert.equal(baseline.saved.length, 1);
  verifyPhoto(baseline.saved[0], savedA);
  const outfit = baseline.board.saved.find(value => value.name === 'Owner A named outfit');
  assert.deepEqual(outfit.slots, {top:savedA.id});

  await openMyCloset(ownerTab, true);
  const downloadPending = ownerTab.waitForEvent('download');
  await ownerTab.locator('#export').click();
  const chunks = [];
  const download = await downloadPending.catch(async error => {
   throw Error('Default backup failed: '+ await ownerTab.locator('#message').textContent(), {cause:error});
  });
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  const backupBytes = Buffer.concat(chunks);
  const backup = JSON.parse(backupBytes);
  assert.equal(backup.version, 3);
  verifyPhoto(backup.items[0], savedA);
  assert.deepEqual(backup.outfitBoard.saved.find(value => value.name === outfit.name), outfit);
  const backupFile = {name:'owner-backup.json',mimeType:'application/json',buffer:backupBytes};

  const stale = await open(shared);
  await stale.waitForFunction(() => window.closetAuth?.user?.id === 'recovery-owner-a' && db && boardInitialized);
  await stale.evaluate(async draft => {
   await new Promise((resolve, reject) => {
    const transaction = db.transaction('state','readwrite');
    transaction.objectStore('state').put({id:'draft',batch:[draft]});
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error);
   });
   batch = [normalizeClothing(draft)];
   render();
   writes = new Promise(resolve => { window.releasePendingSave = resolve; });
   window.pendingSaveResult = null;
   const review = {...draft,ownerReviewed:true,userAdjusted:true};
   savePiece(review, [], {expectedDraftRow:draft}).then(
    () => { window.pendingSaveResult = 'committed'; },
    error => { window.pendingSaveResult = String(error); }
   );
  }, draftA);
  assert.equal(await stale.evaluate(() => window.pendingSaveResult), null);

  await signOut(ownerTab);
  await stale.waitForFunction(() => !window.closetAuth?.user && !db && document.getElementById('appShell').hidden);
  assert.equal(await stale.locator('#appShell img[src^="data:image/"], #appShell img[src^="blob:"]').count(),0);
  await login(ownerTab, ownerB);
  assert.deepEqual((await readState(ownerTab)).saved, []);
  await seedGarment(ownerTab, savedB);
  await openMyCloset(ownerTab);
  await ownerTab.locator('#closetAllPieces').click();
  await ownerTab.locator('#closetGrid').getByText(savedB.name, {exact:true}).waitFor();
  assert.equal(await ownerTab.locator('#closetGrid').getByText(savedA.name, {exact:true}).count(),0);
  await openBuilder(ownerTab);
  assert.equal(await savedOutfit.count(), 0);
  await stale.evaluate(() => window.releasePendingSave());
  await stale.waitForFunction(() => window.pendingSaveResult !== null);
  assert.match(await stale.evaluate(() => window.pendingSaveResult), /account session changed|session ended/i);
  const otherBefore = await readState(ownerTab);
  verifyPhoto(otherBefore.saved[0], savedB);
  assert.equal(otherBefore.pending.length, 0);

  await openMyCloset(ownerTab, true);
  await ownerTab.locator('#import').setInputFiles(backupFile);
  await reportStatus(ownerTab, 'OWNER|owner|signed-in|account');
  assert.deepEqual(await readState(ownerTab), otherBefore, 'foreign backup must not alter owner B');
  await signOut(ownerTab);
  await login(ownerTab, ownerA);
  const reopened = await readState(ownerTab);
  assert.equal(reopened.saved.length, 1);
  verifyPhoto(reopened.saved[0], savedA);
  assert.equal(reopened.pending.length, 1);
  verifyPhoto(reopened.pending[0], draftA);
  assert.deepEqual(reopened.board, baseline.board);

  const disposable = await makeContext();
  const recovery = await open(disposable);
  await login(recovery, ownerA);
  assert.deepEqual((await readState(recovery)).saved, []);
  await openMyCloset(recovery, true);
  recovery.once('dialog', dialog => dialog.dismiss());
  await recovery.locator('#import').setInputFiles(backupFile);
  await reportStatus(recovery, 'Import canceled');
  assert.deepEqual((await readState(recovery)).saved, []);
  recovery.once('dialog', dialog => dialog.accept());
  await recovery.locator('#import').setInputFiles(backupFile);
  await reportStatus(recovery, 'Backup imported atomically');
  await recovery.reload({waitUntil:'domcontentloaded'});
  await recovery.waitForFunction(() => window.closetAuth?.user && db && boardInitialized);
  const recovered = await readState(recovery);
  assert.equal(recovered.saved.length, 1);
  verifyPhoto(recovered.saved[0], savedA);
  assert.deepEqual(recovered.board.saved.find(value => value.name === outfit.name), outfit);
  await openBuilder(recovery);
  await recovery.locator('#savedBoards').getByRole('button',{name:outfit.name,exact:true}).click();
  assert.equal(await recovery.locator('.board-slot-top img').getAttribute('src'), savedA.image);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(externalWrites, []);
  return {engine,width,result:'PASS',sourceA:savedA.sourceSHA256,sourceB:savedB.sourceSHA256,
   pending:draftA.sourceSHA256,stableSavedOutfit:true,staleWriteRejected:true,
   defaultV3Restored:true,foreignBackupRejected:true,fixtureHttpAuth:true};
 } finally {
  for (const context of contexts) await context.close();
 }
}

const results = [];
try {
 for (const [engine,type] of Object.entries({chromium,webkit})) {
  if (process.env.A36_ENGINE && process.env.A36_ENGINE !== engine) continue;
  const browser = await type.launch();
  try {
   for (const width of [320,390,430]) {
    if (process.env.A36_WIDTH && Number(process.env.A36_WIDTH) !== width) continue;
    try { results.push(await exercise(browser,engine,width)); }
    catch (error) { results.push({engine,width,result:'FAIL',error:error.stack}); }
   }
  } finally { await browser.close(); }
 }
 assert.ok(results.length, 'No requested browser cases executed');
} finally {
 await new Promise(done => listener.close(done));
 await mkdir(output, {recursive:true});
 await writeFile(output+'/recovery-'+(process.env.A36_ENGINE || 'both')+'.json', JSON.stringify(results,null,2)+'\n');
 for (const result of results) console.log(JSON.stringify(result));
}
if (results.some(result => result.result !== 'PASS')) process.exitCode = 1;
