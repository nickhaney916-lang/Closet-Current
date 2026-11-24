import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';
import {createEphemeralSignedIdentity147} from '../research/signed-two-owner-transport-147/ephemeral-signed-identity.mjs';

const [donorDirectory, candidateDirectory] = process.argv.slice(2);
assert(donorDirectory && candidateDirectory, 'Pass donor and candidate dist directories');
const [donor, candidate] = [donorDirectory, candidateDirectory].map(directory => resolve(directory));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const photos = await Promise.all(['commons-0003', 'commons-0023', 'commons-0002', 'commons-0001'].map(async id => {
 const bytes = await readFile('benchmark/fixtures/' + id + '.jpg');
 const sha = sha256(bytes);
 const source = manifest.find(photo => photo.id === id);
 assert.equal(source?.verified, true);
 assert.equal(sha, source.sha256);
 return {sha, bytes, file: {name: id + '.jpg', mimeType: 'image/jpeg', buffer: bytes}};
}));
const owners = ['a1633000-0000-4000-8000-000000000001', 'b1633000-0000-4000-8000-000000000002'];
const labels = [
 {name: 'Upgrade Black Shirt', category: 'Tops', itemType: 'T-shirt', color: 'Black'},
 {name: 'Upgrade Blue Jeans', category: 'Bottoms', itemType: 'Jeans', color: 'Blue'}
];
const outfit = 'Wardrobe from previous release';
const authOrigin = 'https://hlkgymugtfbirlpunsra.supabase.co';
const mime = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json'};
const selectRelease = async root => {
 const index = await readFile(resolve(root, 'index.html'), 'utf8');
 const tag = index.match(/app\.js\?v=([a-f0-9]+)/)?.[1];
 assert(tag, 'Build app before running the transition test');
 return {root, tag, appHash: sha256(await readFile(resolve(root, 'app.js')))};
};
const oldRelease = await selectRelease(donor);
const newRelease = await selectRelease(candidate);
assert.notEqual(oldRelease.tag, newRelease.tag);
assert.notEqual(oldRelease.appHash, newRelease.appHash);

async function run(engine, browserType, width) {
 let release = oldRelease;
 let stage = 'startup';
 const identity = createEphemeralSignedIdentity147();
 const refreshSessions = new Map();
 const ownersByEmail = new Map(owners.map((id, i) => [`owner${i}@example.test`, id]));
 let interruptUpdate = false;
 const server = createServer(async (req, res) => {
  try {
   const root = release.root;
   const path = new URL(req.url, 'http://localhost').pathname;
   if (interruptUpdate && path === '/app.js') {
    res.writeHead(503, {'cache-control':'no-store'}).end();
    return;
   }
   const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
   assert(file.startsWith(root + sep));
   const data = await readFile(file);
   res.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store'});
   res.end(data);
  } catch {
   res.writeHead(404).end();
  }
 });
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 const origin = 'http://127.0.0.1:' + server.address().port;
 let browser;
 try {
  browser = await browserType.launch();
  // Exercise production auth and local IndexedDB code with a signed disposable identity.
  // Intercept all cloud traffic. The offline transition cannot touch hosted wardrobes.
  const routeRequest = route => {
   const req = route.request();
   const url = new URL(req.url());
   if (url.origin === origin) return route.continue();
   if (url.origin !== authOrigin) return route.abort();
   const reply = (json, status = 200) => route.fulfill({json, status, headers:{'access-control-allow-origin':'*'}});
   if (url.pathname === '/auth/v1/token') {
    const body = req.postDataJSON();
    const grant = url.searchParams.get('grant_type');
    const previous = refreshSessions.get(body.refresh_token);
    const id = grant === 'password' ? ownersByEmail.get(body.email) : grant === 'refresh_token' ? previous?.ownerId : null;
    if (!id) return reply({}, 401);
    const sessionId = previous?.sessionId ?? randomUUID();
    const refreshToken = randomUUID();
    refreshSessions.delete(body.refresh_token);
    refreshSessions.set(refreshToken, {sessionId, ownerId:id});
    return reply({user:{id}, access_token:identity.issue(id, {sessionId}), refresh_token:refreshToken, expires_in:600});
   }
   if (url.pathname === '/auth/v1/logout') {
    const session = identity.verify(req.headers().authorization.slice(7));
    identity.revoke(session.sessionId);
    for (const [token, active] of refreshSessions) {
     if (active.sessionId === session.sessionId) refreshSessions.delete(token);
    }
    return reply({});
   }
   return route.abort();
  };
  const errors = [];
  const freshPage = async () => {
   const context = await browser.newContext({
    viewport:{width,height:920}, isMobile:true, hasTouch:true,
    acceptDownloads:true, serviceWorkers:'block'
   });
   await context.route('**/*', routeRequest);
   const page = await context.newPage();
   page.on('pageerror', error => { if (!interruptUpdate) errors.push(error.message); });
   page.on('dialog', dialog => dialog.accept());
   return page;
  };
  let page = await freshPage();
  const view = async name => {
   const tab = page.locator(`nav.main-nav button.tab[data-view="${name}"]`);
   if (await tab.isVisible()) return tab.click();
   const more = page.locator('#moreMenu');
   if (!await more.evaluate(element => element.open)) await more.locator('summary').click();
   await more.locator(`button.tab[data-view="${name}"]`).click();
  };
  const ready = async id => {
   await page.waitForFunction(owner => db?.name === 'closet-current-user-' + owner && !document.querySelector('#appShell').hidden, id);
   await page.evaluate(() => Promise.all([closetReady, outfitBoardReady]));
   // Startup can resume pending recognition. Let the offline attempt settle
   // before the next version change or sign-out cancels worker module loads.
   await page.waitForFunction(() => !automaticRunning && !localPending.size);
  };
  const navigate = async (next, owner) => {
   release = next;
   const appResponse = page.waitForResponse(response => response.url() === origin + '/app.js?v=' + next.tag);
   await page.goto(origin + '/', {waitUntil:'domcontentloaded'});
   assert.equal(sha256(await (await appResponse).body()), next.appHash, 'Browser must receive the selected immutable app bytes');
   if (owner) await ready(owner);
  };
  const signIn = async index => {
   await page.locator('#authEmail').fill(`owner${index}@example.test`);
   await page.locator('#authPassword').fill('synthetic version test only');
   await page.locator('#authSubmit').click();
   await ready(owners[index]);
  };
  const signOut = async () => {
   await page.locator('.account-menu summary').click();
   await page.locator('#logout').click();
   await page.locator('#authGate').waitFor({state:'visible'});
  };
  const snapshot = async () => {
   const data = await page.evaluate(() => new Promise((done, fail) => {
    const tx = db.transaction(['items', 'state'], 'readonly');
    const items = tx.objectStore('items').getAll();
    const draft = tx.objectStore('state').get('draft');
    const board = tx.objectStore('state').get('outfit-board');
    tx.oncomplete = () => done({db:db.name, version:db.version, items:items.result, draft:draft.result?.batch ?? [], board:board.result ?? null});
    tx.onabort = () => fail(tx.error);
   }));
   const item = row => ({
    id:row.id, ownerId:row.ownerId, name:row.name, category:row.category, itemType:row.itemType,
    color:row.color, colorSource:row.colorSource, ownerReviewed:row.ownerReviewed, receipt:row.sourceSHA256,
    originalSHA256:sha256(Buffer.from(row.originalPhoto.image.split(',')[1], 'base64'))
   });
   return {...data, items:data.items.map(item), draft:data.draft.map(item)};
  };
  const scan = async photo => {
   await view('home');
   await page.locator('#home button.home-action[data-go-view="scan"]').click();
   await page.locator('#clothingPhotos').setInputFiles(photo.file);
   await page.waitForFunction(() => !photoImportActive && !automaticRunning);
  };
  const review = async (photo, label, count) => {
   await scan(photo);
   assert.equal((await snapshot()).items.length, count - 1, 'Recognition cannot silently save');
   await page.locator('#reviewGrid .photo-result button:has-text("Adjust")').first().click();
   const editor = page.locator('dialog.photo-adjust');
   await editor.getByLabel('Item name').fill(label.name);
   await editor.getByLabel('Main category').selectOption(label.category);
   await editor.getByLabel('Item type').selectOption(label.itemType);
   await editor.getByLabel('Color', {exact:true}).fill(label.color);
   await editor.getByLabel('I verified the category, clothing type and color').check();
   await editor.getByLabel('I confirmed this photo shows one garment').check();
   await editor.getByRole('button',{name:'Save changes'}).click();
   await editor.waitFor({state:'hidden'});
   await page.waitForFunction(expected => items.length === expected, count);
  };
  const exportBackup = async () => {
   await view('closet');
   const backup = page.locator('details.closet-backup');
   if (!await backup.evaluate(element => element.open)) await backup.locator('summary').click();
   const download = page.waitForEvent('download');
   await page.locator('#export').click();
   return readFile(await (await download).path());
  };
  const importBackup = buffer => page.locator('#import').setInputFiles({name:'wardrobe.json', mimeType:'application/json', buffer});
  const preview = async () => {
   await view('builder');
   await page.locator('#mission4Preview1054Section button').click();
   const images = page.locator('#mission4Preview1054Photos img');
   await images.nth(1).waitFor({state:'visible'});
   const hashes = await images.evaluateAll(nodes => nodes.map(node => node.src));
   assert.deepEqual(hashes.map(source => sha256(Buffer.from(source.split(',')[1], 'base64'))).sort(), photos.slice(0,2).map(photo => photo.sha).sort());
   assert.match(await page.locator('#mission4Preview1054Status').innerText(), /2D only/);
  };

  stage = 'donor capture, owner review, saved outfit';
  await navigate(oldRelease);
  await signIn(0);
  await review(photos[0], labels[0], 1);
  await review(photos[1], labels[1], 2);
  await view('builder');
  for (const [slot, label] of [['top', labels[0]], ['bottom', labels[1]]]) {
   await page.locator('#boardSlots .board-slot-' + slot).click();
   await page.locator('#boardPickerItems button.board-pick').filter({hasText: label.name}).click();
  }
  await page.locator('#boardName').fill(outfit);
  await page.locator('#saveBoard').click();
  await page.waitForFunction(name => savedOutfitBoards.some(board => board.name === name), outfit);
  await preview();
  const legacy = await exportBackup();
  assert.equal(JSON.parse(legacy).version, 3);
  await scan(photos[2]);
  const before = await snapshot();
  assert.equal(before.version, 2);
  assert.equal(before.items.length, 2);
  for (const [index, label] of labels.entries()) {
   const row = before.items.find(item => item.name === label.name);
   assert(row);
   for (const [field, value] of Object.entries(label)) assert.equal(row[field], value);
   assert.equal(row.receipt, photos[index].sha);
   assert.equal(row.originalSHA256, photos[index].sha);
   assert.equal(row.ownerReviewed, true);
   assert.equal(row.colorSource, 'user');
   assert.equal(row.ownerId, owners[0]);
  }
  assert.equal(before.draft.length, 1);
  assert.equal(before.draft[0].originalSHA256, photos[2].sha);
  const selected = before.board.saved.find(board => board.name === outfit);
  assert.equal(selected.slots.top, before.items.find(item => item.name === labels[0].name).id);
  assert.equal(selected.slots.bottom, before.items.find(item => item.name === labels[1].name).id);

  stage = 'interrupted candidate update';
  release = newRelease;
  interruptUpdate = true;
  const unavailable = page.waitForResponse(response => response.url() === origin + '/app.js?v=' + newRelease.tag);
  await page.goto(origin + '/', {waitUntil:'domcontentloaded'});
  assert.equal((await unavailable).status(), 503);
  assert.equal(await page.evaluate(() => typeof closetReady), 'undefined');
  interruptUpdate = false;

  stage = 'candidate upgrade and original-photo preview';
  await navigate(newRelease, owners[0]);
  assert.deepEqual(await snapshot(), before);
  await view('closet');
  await page.locator('#search').fill(labels[0].name);
  await page.locator('#closetGrid').getByText(labels[0].name, {exact:true}).waitFor({state:'visible'});
  assert.equal(await page.locator('#closetGrid').getByText(labels[1].name, {exact:true}).count(), 0);
  await preview();

  stage = 'interrupted candidate photo write and reload';
  await page.evaluate(() => {
   const originalPut = IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put = function (record, ...args) {
    const request = originalPut.call(this, record, ...args);
    if (this.name === 'state' && record?.id === 'draft' && record.batch?.length === 2) {
     request.addEventListener('success', () => {
      this.transaction.abort();
      window.p1633AbortedDraftWrite = true;
     }, {once:true});
    }
    return request;
   };
  });
  await scan(photos[3]);
  await page.waitForFunction(() => window.p1633AbortedDraftWrite === true);
  await navigate(newRelease, owners[0]);
  assert.deepEqual(await snapshot(), before);

  stage = 'owner isolation and recovery';
  await signOut();
  await signIn(1);
  const other = await snapshot();
  assert.deepEqual(other, {db:'closet-current-user-' + owners[1], version:2, items:[], draft:[], board:null});
  assert.equal(await page.locator('#mission4Preview1054Photos img').count(), 0);
  await signOut();
  await signIn(0);
  assert.deepEqual(await snapshot(), before);

  stage = 'actual rollback with pending review and return to candidate';
  await navigate(oldRelease, owners[0]);
  assert.deepEqual(await snapshot(), before);
  await preview();
  await navigate(newRelease, owners[0]);
  assert.deepEqual(await snapshot(), before);

  stage = 'legacy backup round trip and future format refusal';
  await view('closet');
  await page.locator('details.closet-backup summary').click();
  await importBackup(Buffer.from(JSON.stringify({...JSON.parse(legacy), version:999})));
  await page.waitForFunction(() => /unsupported|invalid|recogniz|could not import/i.test(document.querySelector('#message').textContent));
  assert.deepEqual(await snapshot(), before);
  await importBackup(legacy);
  await page.waitForFunction(() => /restored|imported/i.test(document.querySelector('#message').textContent));
  const restored = await snapshot();
  assert.deepEqual(restored.items, before.items);
  assert.deepEqual(restored.board.saved, before.board.saved);
  assert.deepEqual(restored.draft, before.draft);
  const originalPage = page;
  stage = 'legacy backup restores into empty candidate profile';
  page = await freshPage();
  await navigate(newRelease);
  await signIn(0);
  assert.deepEqual((await snapshot()).items, []);
  await view('closet');
  await page.locator('details.closet-backup summary').click();
  await importBackup(legacy);
  await page.waitForFunction(() => /Backup imported atomically/i.test(document.querySelector('#message').textContent));
  const freshRestore = await snapshot();
  assert.deepEqual(freshRestore.items, before.items);
  assert.deepEqual(freshRestore.board.saved, before.board.saved);
  const exported = JSON.parse(await exportBackup());
  const legacyExport = JSON.parse(legacy);
  assert.deepEqual(exported.items, legacyExport.items);
  assert.deepEqual(exported.outfitBoard.saved, legacyExport.outfitBoard.saved);
  await page.context().close();
  page = originalPage;
  assert.deepEqual(await snapshot(), restored);
  assert.deepEqual(errors, []);
  console.log('P1633_PASS', JSON.stringify({
   engine, browser:browser.version(), width, from:oldRelease.tag, to:newRelease.tag,
   databaseVersion:before.version, items:before.items, pending:before.draft, outfit: selected,
   interruptedUpdateRecovered:true, interruptedWritePreserved:true, newerBackupRefused:true,
   emptyProfileRestore:true, isolatedOwner:true, rollback:true,
   genuineModelInference:false, serviceWorker:'blocked', familyAlpha:'HOLD'
  }));
 } catch (error) {
  throw new Error(`${engine} ${width}, ${stage}: ${error.message}`, {cause:error});
 } finally {
  await browser?.close();
  await new Promise(done => server.close(done));
 }
}
const engines = {chromium, webkit};
const engine = process.env.P1633_ENGINE || 'chromium';
const width = Number(process.env.P1633_WIDTH || 390);
assert(Object.hasOwn(engines, engine) && [320,390,430].includes(width));
await run(engine, engines[engine], width);
