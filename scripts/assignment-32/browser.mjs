import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';

const root = resolve(process.env.CC32_DIST || 'dist');
const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript',
 '.mjs':'text/javascript', '.json':'application/json'};
const server = createServer(async (req, res) => {
 try {
  const {pathname} = new URL(req.url, 'http://127.0.0.1');
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  assert.ok(file.startsWith(root + sep));
  const bytes = await readFile(file);
  res.writeHead(200, {'content-type':mime[extname(file)] ?? 'application/octet-stream'}).end(bytes);
 } catch {
  res.writeHead(404).end();
 }
});
const owner = 'assignment-32-owner';
const name = 'Cafe\u0301 d’Arcy - 東京 🧥';
const brand = 'Élan-서울';
const notes = "Ångström's scarf\n青い衣服 ✨ " + 'x'.repeat(472) + '🪡';
const outfitName = "Soire\u0301e d'Arcy - 夜 🌙";
const renamedOutfit = 'Été - 京都 ' + 'あ'.repeat(69) + '🌿';
const renamedGarment = 'Re\u0301serve - 京都 ' + '衣'.repeat(104) + '🧵';
const photos = await Promise.all(['0053','0059'].map(async number => {
 const bytes = await readFile('benchmark/fixtures/commons-' + number + '.jpg');
 return {image:'data:image/jpeg;base64,' + bytes.toString('base64'),
  sha256:createHash('sha256').update(bytes).digest('hex')};
}));
const expected = [
 {id:'garment-a', ownerId:owner, name, brand, notes, category:'Tops', color:'Blue'},
 {id:'garment-b', ownerId:owner, name, brand:'別のブランド', notes:'Second garment 🪡', category:'Tops', color:'Green'}
].map((row, i) => ({...row, itemType:'T-shirt', seasons:[i ? 'Winter' : 'Summer'],
 image:photos[i].image, originalPhoto:photos[i], sourceSHA256:photos[i].sha256,
 sourceHashVerified:true, sourcePhotoOriginal:true, ownerReviewed:true, singleGarmentVerified:true}));

async function open(browser, origin, width, account) {
 const context = await browser.newContext({viewport:{width,height:844}, isMobile:true,
  hasTouch:true, serviceWorkers:'block', acceptDownloads:true});
 context.setDefaultTimeout(7000);
 await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) return route.abort();
  if (url.pathname !== '/auth.js') return route.continue();
  return route.fulfill({contentType:'text/javascript', body:
   'window.closetAuth={user:{id:'+JSON.stringify(account)+'},ready:Promise.resolve(),assertCurrent(){}};'+
   'document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;'});
 });
 const page = await context.newPage();
 await page.goto(origin, {waitUntil:'domcontentloaded'});
 await ready(page);
 return page;
}
const ready = page => page.waitForFunction(() => typeof db !== 'undefined' && db && boardInitialized);
const view = (page, key) => page.evaluate(key => switchView(key), key);
const state = page => page.evaluate(() => new Promise((done, fail) => {
 const tx = db.transaction(['items','state']);
 const rows = tx.objectStore('items').getAll();
 const outfits = tx.objectStore('state').get('outfit-board');
 tx.oncomplete = () => done({rows:rows.result, outfits:outfits.result?.saved ?? []});
 tx.onabort = () => fail(tx.error);
}));
function assertMetadata(actual, garments, outfits) {
 assert.deepEqual(actual.rows.map(row => ({
  id:row.id, ownerId:row.ownerId, name:row.name, brand:row.brand, notes:row.notes,
  sourceSHA256:row.sourceSHA256, originalPhoto:row.originalPhoto
 })), garments.map(({id, ownerId, name, brand, notes, sourceSHA256, originalPhoto}) => ({
  id, ownerId, name, brand, notes, sourceSHA256, originalPhoto
 })));
 assert.deepEqual(actual.outfits.map(({name, slots}) => ({name, slots})), outfits);
}
async function approve(page, row) {
 await page.evaluate(async row => {
  const suggestion = {...row, ownerReviewed:false, localAnalyzed:true};
  await new Promise((done, fail) => {
   const tx = db.transaction('state','readwrite');
   tx.objectStore('state').put({id:'draft',batch:[suggestion]});
   tx.oncomplete = done;
   tx.onabort = () => fail(tx.error);
  });
  await savePiece(row, [], {expectedDraftRow:suggestion});
 }, row);
}
async function textIs(page, selector, value) {
 await page.waitForFunction(({selector, value}) =>
  document.querySelector(selector)?.textContent.includes(value), {selector, value});
}

async function run(browser, origin, width, softFailures) {
 const page = await open(browser, origin, width, owner);
 await approve(page, expected[0]);
 await approve(page, expected[1]);
 await page.reload({waitUntil:'domcontentloaded'});
 await ready(page);
 assertMetadata(await state(page), expected, []);
 console.log('PASS garment save and exact stored metadata');
 await view(page,'closet');
 const cards = page.locator('#closetGrid .card');
 async function search(query, ids, label) {
  await page.locator('#search').fill(query);
  const actual = await cards.evaluateAll(nodes => nodes.map(card => card.dataset.itemId));
  try { assert.deepEqual(actual, ids, label); }
  catch (error) { softFailures.push(error.message); }
 }
 await search("d’Arcy 東京 🧥", ['garment-a','garment-b'], 'literal punctuation, Japanese and emoji');
 await search('CAFÉ', ['garment-a','garment-b'], 'composed query for decomposed names');
 await search('E\u0301LAN-서울', ['garment-a'], 'decomposed query for composed brand');
 await search("ÅNGSTRÖM'S", ['garment-a'], 'composed query for decomposed notes');
 await search('cafe', [], 'accent-distinct negative');
 await page.getByText('Refine results',{exact:true}).click();
 await page.locator('#seasonFilter').selectOption('Summer');
 await search('東京', ['garment-a'], 'Unicode category and season filter intersection');
 await page.locator('#filter').selectOption('Bottoms');
 await search('東京', [], 'wrong-category negative');
 await page.locator('#filter').selectOption('Tops');
 await search('東京', ['garment-a'], 'correct-category intersection');
 await page.locator('#seasonFilter').selectOption('');
 await search('東京', ['garment-a','garment-b'], 'literal twin lookup');
 assertMetadata(await state(page), expected, []);

 await view(page,'builder');
 for (const row of expected) {
  assert.equal(await page.evaluate(id => selectBoardPiece('top',id), row.id), true);
  await page.locator('#boardName').fill(outfitName);
  await page.locator('#saveBoard').click();
  await textIs(page,'#boardSaveStatus','Outfit saved');
 }
 const saved = expected.map(({id}) => ({name:outfitName, slots:{top:id}}));
 assertMetadata(await state(page), expected, saved);
 await page.locator('#saveBoard').click();
 await textIs(page,'#boardSaveStatus','This exact outfit is already saved');
 const outfitSearch = page.locator('#savedOutfitSearch');
 const outfitButtonSelector = '#savedBoards > button, #savedBoards > .board-saved-wear > button:first-child';
 const outfitButtons = page.locator(outfitButtonSelector).filter({visible:true});
 async function searchOutfits(query, indices, label) {
  await outfitSearch.fill(query);
  const actual = await outfitButtons.evaluateAll(buttons =>
   buttons.map(button => {
    const grid = document.getElementById('savedBoards');
    const row = button.parentElement === grid ? button : button.parentElement;
    return [...grid.children].indexOf(row);
   }));
  try { assert.deepEqual(actual, indices, label); }
  catch (error) { softFailures.push(error.message); }
 }
 await searchOutfits('SOIRÉE', [0,1], 'composed query for decomposed outfit name');
 await searchOutfits('soire\u0301e café green 🌙', [1], 'outfit search through composed query for linked garment');
 await searchOutfits('soiree', [], 'outfit accent-distinct negative');
 await searchOutfits('夜 🌙 green', [1], 'same-name outfit selected by linked garment metadata');
 await outfitButtons.first().click();
 assert.equal(await page.evaluate(() => currentBoard.slots.top), 'garment-b');
 assert.equal(await page.locator('#boardName').inputValue(),outfitName);
 assert.equal(renamedOutfit.length, 80);
 await page.locator('#boardName').fill(renamedOutfit);
 await page.locator('#updateSavedOutfit').click();
 await textIs(page,'#savedOutfitManageStatus','Saved outfit updated.');
 saved[1] = {...saved[1], name:renamedOutfit};
 await searchOutfits('E\u0301TE\u0301 🌿', [1], 'decomposed query for composed renamed outfit');
 assertMetadata(await state(page), expected, saved);

 await view(page,'closet');
 await page.locator('#closetAllPieces').click();
 const target = page.locator('#closetGrid .card[data-item-id="garment-b"]');
 await target.getByRole('button',{name:'Adjust details'}).click();
 const dialog = page.locator('dialog.clothing-editor');
 await dialog.getByText('Brand, size & other details').click();
 assert.equal(await dialog.getByLabel('Item name').inputValue(),name);
 assert.equal(await dialog.getByLabel('Brand',{exact:true}).inputValue(),expected[1].brand);
 assert.equal(await dialog.getByLabel('Notes',{exact:true}).inputValue(),expected[1].notes);
 const edited = {...expected[1], name:renamedGarment,
  brand:'브랜드 - De\u0301jà ' + 'B'.repeat(105) + '🌱', notes};
 for (const [label, value, capacity] of [['Item name',edited.name,120],
  ['Brand',edited.brand,120], ['Notes',edited.notes,500]]) {
  const field = dialog.getByLabel(label,{exact:true});
  assert.equal(await field.evaluate(input => input.maxLength),capacity);
  assert.equal(value.length,capacity,label+' fixture exercises the supported limit');
  await field.fill(value);
 }
 await dialog.getByRole('button',{name:'Save changes'}).click();
 await dialog.waitFor({state:'detached'});
 const revised = [expected[0], edited];
 assertMetadata(await state(page), revised, saved);
 await page.reload({waitUntil:'domcontentloaded'});
 await ready(page);
 assertMetadata(await state(page), revised, saved);
 await view(page,'closet');
 await search('RÉSERVE 🧵', ['garment-b'], 'renamed garment searchable after reload');
 await view(page,'builder');
 await searchOutfits('RÉSERVE 🌿', [1], 'renamed garment remains linked and searchable after reload');
 console.log('PASS display, saved editor, duplicate-name identity, outfit rename, IDs and reload');

 await view(page,'closet');
 await page.locator('.closet-backup summary').click();
 const downloadPromise = page.waitForEvent('download', {timeout:10000});
 await page.locator('#export').click();
 const download = await downloadPromise;
 const json = await readFile(await download.path());
 const backup = JSON.parse(json);
 assert.equal(backup.version,3);
 assertMetadata({rows:backup.items, outfits:backup.outfitBoard.saved}, revised, saved);
 const restored = await open(browser, origin, width, owner);
 assertMetadata(await state(restored), [], []);
 const payload = {name:'wardrobe.json', mimeType:'application/json', buffer:json};
 restored.once('dialog', dialog => dialog.accept());
 await restored.locator('#import').setInputFiles(payload);
 await textIs(restored,'#message','Backup imported atomically');
 assertMetadata(await state(restored), revised, saved);
 await view(restored,'closet');
 await restored.locator('#search').fill('東京');
 assert.equal(await restored.locator('#closetGrid .card h3').textContent(),name);
 await view(restored,'builder');
 assert.deepEqual(await restored.locator(outfitButtonSelector).allTextContents(),
  saved.map(({name}) => name));
 const foreign = await open(browser, origin, width, owner+'-other');
 assertMetadata(await state(foreign), [], []);
 foreign.on('dialog', dialog => dialog.dismiss());
 await foreign.locator('#import').setInputFiles(payload);
 await textIs(foreign,'#message','LEGACY_ATOMIC_FOREIGN_OWNER');
 assertMetadata(await state(foreign), [], []);
 console.log('PASS v3 export, same-owner restore, original JPEGs and foreign-owner rejection');
}

let failed = false;
try {
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 const origin = 'http://127.0.0.1:' + server.address().port;
 for (const [engine, type] of Object.entries({chromium, webkit})) {
  if (process.env.CC32_ENGINE && process.env.CC32_ENGINE !== engine) continue;
  for (const width of [320,390,430]) {
   if (process.env.CC32_WIDTH && Number(process.env.CC32_WIDTH) !== width) continue;
   const failures = [];
   let browser;
   try {
    browser = await type.launch();
    await run(browser, origin, width, failures);
   } catch (error) {
    failures.push(error.stack);
   } finally {
    await browser?.close();
   }
   if (failures.length) {
    failed = true;
    console.error(engine, width, 'FAIL\n'+failures.join('\n'));
   } else {
    console.log(engine, width, 'PASS all metadata, Unicode search and identity checks');
   }
  }
 }
} finally {
 server.close();
}
if (failed) process.exitCode = 1;
