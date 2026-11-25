import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';

const root = resolve('dist');
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server = createServer(async (request, response) => {
 try {
  const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!path.startsWith(root + sep)) throw Error('Outside app');
  const bytes = await readFile(path);
  response.writeHead(200, {'content-type':mime[extname(path)] || 'application/octet-stream'});
  response.end(bytes);
 } catch {
  response.writeHead(404).end();
 }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const canary = 'ASSIGNMENT19_PRIVATE_CANARY';
const ownerA = 'bda39019-cafe-4871-8765-000000000019';
const ownerB = 'bda39019-cafe-4871-8765-000000000020';

try {
 for (const [engine, type] of Object.entries({chromium, webkit})) {
  if (process.env.A19_ENGINE && engine !== process.env.A19_ENGINE) continue;
  const executablePath = engine === 'chromium' ? process.env.A19_CHROMIUM : undefined;
  const browser = await type.launch({executablePath});
  try {
   for (const width of [320, 390, 430]) {
    const ctx = await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try {
     await checkOwnerFlow(ctx, engine, width);
     console.log('ASSIGNMENT_19_PASS', engine, width);
    } finally {
     await ctx.close();
    }
   }
  } finally {
   await browser.close();
  }
 }
} finally {
 await new Promise(resolve => server.close(resolve));
}

async function checkOwnerFlow(context, engine, width) {
 const requests = [];
 await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin === origin) {
   if (url.pathname === '/local-worker.mjs') return route.fulfill({contentType:'text/javascript',
    body:"onmessage = ({data}) => postMessage({id:data.id,type:'error',text:'ASSIGNMENT19_PRIVATE_CANARY'})"});
   if (url.pathname === '/maintenance/trends') return route.fulfill({status:503});
   return route.continue();
  }
  if (url.hostname === 'hlkgymugtfbirlpunsra.supabase.co') {
   if (url.pathname === '/auth/v1/logout') return route.fulfill({status:204});
   if (url.pathname === '/auth/v1/token') {
    const payload = route.request().postDataJSON();
    const id = payload.email?.split('@')[0] || payload.refresh_token;
    if ([ownerA, ownerB].includes(id)) return route.fulfill({json:{
     access_token:canary + '_JWT',refresh_token:id,expires_in:3600,user:{id,email:id+'@'+'private-canary.invalid'}
    }});
   }
  }
  return route.abort();
 });
 const page = await context.newPage();
 page.setDefaultTimeout(12000);
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('request', request => requests.push(request.url()));
 await page.goto(origin + '/index.html?' + canary);
 const signIn = async id => {
  await page.locator('#authEmail').fill(id + '@private-canary.invalid');
  await page.locator('#authPassword').fill('synthetic-fixture-password');
  await page.locator('#authSubmit').click();
  try {
   await page.waitForFunction(id => db?.name === 'closet-current-user-' + id && boardInitialized &&
    trendCheckFailed && !document.getElementById('cloudStatus').hidden, id);
  } catch (error) {
   console.error('Synthetic sign-in state', await page.evaluate(() => ({
    signedIn: !!window.closetAuth?.user, dbReady: !!db, boardInitialized, trendCheckFailed,
    authStatus: document.getElementById('authStatus').textContent,
    cloudStatus: document.getElementById('cloudStatus').textContent
   })), errors, requests.map(url => new URL(url).pathname));
   throw error;
  }
 };
 const open = async () => {
  await page.locator('.account-menu summary').tap();
  await page.locator('#openTroubleshooting').tap();
  assert.ok(await page.locator('#troubleshooting').isVisible());
 };
 await signIn(ownerA);
 await page.waitForFunction(() => document.getElementById('cloudStatus').textContent.startsWith('Cloud connection unavailable'));
 await page.locator('[data-view=scan]').tap();
 await page.locator('.saved-imports summary').tap();
 const artwork = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="white"/><path d="M20 12h24l15 12-9 10-7-5v24H21V29l-7 5-9-10z" fill="#4a60ba"/></svg>';
 const png = await sharp(Buffer.from(artwork)).png().toBuffer();
 await page.locator('#clothingPhotos').setInputFiles({
  name:canary + '.png',mimeType:'image/png',buffer:png
 });
 try {
  await page.waitForFunction(() => recognitionState.phase === 'failed');
 } catch (error) {
  console.error('Synthetic recognition state', await page.evaluate(() => ({
   phase: recognitionState.phase, photos: batch.length, message: document.getElementById('message').textContent
  })), requests.filter(url => url.includes('worker')));
  throw error;
 }
 await page.locator('[data-view=scan]').tap();
 await page.locator('#clothingPhotos').setInputFiles({
  name:canary + '.jpg',mimeType:'image/jpeg',buffer:Buffer.from('invalid JPEG')
 });
 await page.waitForFunction(() => document.getElementById('message').textContent.includes('No photos could be imported'));
 const before = await page.evaluate(async canary => {
  // Seed only an intercepted synthetic owner's local database.
  const tx = db.transaction(['items','state'], 'readwrite');
  tx.objectStore('items').put({id:'test-garment',name:canary,image:'data:image/jpeg;base64,/9j/2Q==',
   originalPhoto:{image:'data:image/jpeg;base64,/9j/2Q=='}});
  tx.objectStore('state').put({id:'outfit-wear-history-v1',owner:closetAuth.user.id,events:[{id:canary}]});
  tx.objectStore('state').put({id:'outfit-board',saved:[{name:canary,slots:{top:'test-garment'}}]});
  await new Promise((resolve,reject) => {tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  window.readDiagnosticFixture = async () => {
   const tx = db.transaction(['items','state']);
   const requests = [tx.objectStore('items').get('test-garment'),
    tx.objectStore('state').get('outfit-wear-history-v1'),tx.objectStore('state').get('outfit-board')];
   return Promise.all(requests.map(request => new Promise((resolve,reject) => {
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
   })));
  };
  return window.readDiagnosticFixture();
 }, canary);
 // Focus stays in the application. Its existing trend and cloud background
 // checks have settled, so any new request in this slice is unexpected.
 const startingRequests = requests.length;
 await open();
 await page.locator('#troubleshootingTopic').selectOption('photo-import');
 assert.match(await page.locator('#troubleshootingGuidance').innerText(), /Check Review/);
 assert.match(await page.locator('#troubleshootingStatus').innerText(), /Import needs attention/);
 assert.match(await page.locator('#troubleshootingStatus').innerText(), /Latest library check failed/);
 await page.locator('#previewTroubleshooting').focus();
 await page.keyboard.press('Enter');
 const output = page.locator('#troubleshootingReport');
 const original = await output.inputValue();
 assert.doesNotMatch(original, new RegExp(canary, 'i'));
 assert.ok(!original.includes(ownerA));
 assert.ok(Buffer.byteLength(original) < 512);
 assert.equal(JSON.parse(original).photoImport, 'failed');
 assert.equal(JSON.parse(original).recognition, 'failed');
 assert.equal(JSON.parse(original).browser, engine);
 assert.match(JSON.parse(original).assetVersion, /^[a-f0-9]{12}$/);
 assert.equal(JSON.parse(original).viewport, width < 360 ? 'compact' : 'medium');
 assert.equal(JSON.parse(original).backup, 'pending');
 assert.equal(JSON.parse(original).maintenance, 'check-failed');
 assert.ok(await page.locator('#troubleshooting').evaluate(el => {
  const rect = el.getBoundingClientRect();
  return rect.left >= 0 && rect.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
 }));
 await page.locator('#cancelTroubleshooting').tap();
 assert.equal(await output.inputValue(), '');
 assert.equal(await page.locator('#troubleshootingPreview').isVisible(), false);
 await page.locator('#troubleshootingTopic').selectOption('outfit-3d');
 assert.match(await page.locator('#troubleshootingGuidance').innerText(), /2D outfit board/);
 await page.locator('#previewTroubleshooting').tap();
 assert.equal(JSON.parse(await output.inputValue()).presentation, '2d-available');
 assert.deepEqual(requests.slice(startingRequests), []);
 await context.setOffline(true);
 await page.waitForFunction(() => navigator.onLine === false);
 const offlineRequests = requests.length;
 await page.locator('#previewTroubleshooting').tap();
 const expected = await output.inputValue();
 assert.equal(JSON.parse(expected).connection, 'offline');
 assert.doesNotMatch(expected, new RegExp(canary, 'i'));
 const [download] = await Promise.all([
  page.waitForEvent('download'),page.locator('#exportTroubleshooting').tap()
 ]);
 assert.equal(download.suggestedFilename(), 'closet-current-troubleshooting.json');
 assert.equal(await readFile(await download.path(), 'utf8'), expected);
 assert.deepEqual(await page.evaluate(() => window.readDiagnosticFixture()), before);
 assert.deepEqual(requests.slice(offlineRequests), []);
 // Replace the session in another tab while the first tab still shows the report.
 await context.setOffline(false);
 await page.locator('#previewTroubleshooting').tap();
 const second = await context.newPage();
 await second.goto(origin + '/index.html');
 await second.evaluate(() => localStorage.removeItem('closet-current-auth-v1'));
 await page.locator('#authGate').waitFor();
 assert.equal(await output.inputValue(), '');
 assert.equal(await page.locator('#troubleshooting').isVisible(), false);
 await second.close();
 await page.reload();
 await signIn(ownerB);
 await open();
 await page.locator('#previewTroubleshooting').tap();
 const fresh = await output.inputValue();
 assert.equal(JSON.parse(fresh).photoImport, 'unknown');
 assert.doesNotMatch(fresh, new RegExp(canary, 'i'));
 await page.keyboard.press('Escape');
 await page.locator('#troubleshooting').waitFor({state:'hidden'});
 assert.equal(await output.inputValue(), '');
 assert.deepEqual(errors, []);
}
