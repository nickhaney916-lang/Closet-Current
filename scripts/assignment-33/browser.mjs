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

async function run(browser,origin,width){
 const page=await open(browser,origin,width,owner);
 await approve(page,{...expected[0],id:'tee',name:'tee',category:'Tops',itemType:'T-shirt',seasons:['All seasons']});
 await approve(page,{...expected[1],id:'sweater',name:'sweater',category:'Tops',itemType:'Sweater',seasons:['All seasons']});
 await page.reload({waitUntil:'domcontentloaded'});await ready(page);
 await view(page,'stylist');
 const before=await state(page);
 await page.getByText('Today’s weather (optional)',{exact:true}).click();
 await page.locator('#stylistWeatherUnit').selectOption('C');
 await page.locator('#stylistWeatherLow').fill('34');
 await page.locator('#stylistWeatherHigh').fill('28');
 await page.locator('#stylistWeatherRain').selectOption('rain');
 await page.locator('#createCollectionOutfits').click();
 await textIs(page,'#stylistStatus','valid temperature range');
 assert.equal(await page.evaluate(()=>styledCollectionResults.length),0);
 await page.locator('#stylistWeatherLow').fill('2');
 await page.locator('#stylistWeatherHigh').fill('8');
 await page.locator('#createCollectionOutfits').click();
 await textIs(page,'#stylistStatus','outfit option');
 assert.equal(await page.evaluate(()=>styledCollectionResults[0].board.slots.top),'sweater');
 await page.locator('#stylistWeatherLow').fill('28');
 await page.locator('#stylistWeatherHigh').fill('34');
 await page.locator('#stylistWeatherRain').selectOption('dry');
 await page.locator('#createCollectionOutfits').click();
 await textIs(page,'#stylistStatus','outfit option');
 assert.equal(await page.evaluate(()=>styledCollectionResults[0].board.slots.top),'tee');
 const result=await page.evaluate(()=>{
 const rows=[['tee','Tops','T-shirt'],['sweater','Tops','Sweater'],['jeans','Bottoms','Jeans'],['boots','Shoes','Ankle boots'],['sandals','Shoes','Sandals'],['coat','Outerwear','Coat']].map(([id,category,itemType])=>({id,category,itemType,color:'Black',seasons:['All seasons']}));
 const run=(low,high,rain,wind)=>styleOwnedCollection(rows,{request:'Casual',season:'Fall',weather:{source:'manual',unit:'C',low,high,rain,wind}})[0];
 return {cold:run(2,8,'rain','windy'),hot:run(28,34,'dry','calm')};
 });
 assert.equal(result.cold.board.slots.top,'sweater');assert.equal(result.cold.board.slots.shoes,'boots');
 assert.equal(result.hot.board.slots.top,'tee');assert.equal(result.hot.board.slots.shoes,'sandals');
 assert.deepEqual(await state(page),before);
 await page.evaluate(()=>window.dispatchEvent(new Event('closet:session-locked')));
 assert.equal(await page.locator('#stylistWeatherLow').inputValue(),'');
 assert.equal(await page.locator('#stylistWeatherRain').inputValue(),'unknown');
 await page.context().close();
}
let failed=false;
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC33_ENGINE&&process.env.CC33_ENGINE!==engine)continue;
  for(const width of [320,390,430]){
   let browser;
   try{browser=await type.launch();await run(browser,origin,width);console.log(engine,width,'PASS weather context');}
   catch(error){failed=true;console.error(engine,width,error);}
   finally{await browser?.close();}
  }
 }
}finally{server.close();}
if(failed)process.exitCode=1;
