import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';

const ownerA = 'synthetic-stylist-a';
const ownerB = 'synthetic-stylist-b';
let owner = ownerA;
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript',
 '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
 try {
  const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  const file = path === root ? resolve(root, 'index.html') : path;
  if (!file.startsWith(root + '/')) throw Error('Invalid fixture path');
  let data = await readFile(file);
  if (file === resolve(root, 'index.html')) {
   // Only the synthetic account/cloud boundaries are replaced in this fixture.
   data = data.toString().replace(/(<script src="(?:auth|cloud-backup)\.js[^"]*") integrity="[^"]*"/g, '$1');
  } else if (file === resolve(root, 'auth.js')) {
   data = 'window.closetAuth={user:{id:' + JSON.stringify(owner) +
    '},ready:Promise.resolve(),getAccessToken:async()=>"synthetic",assertCurrent(){}};' +
    'document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;';
  } else if (file === resolve(root, 'cloud-backup.js')) {
   data = 'window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed(){}};';
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control':'no-store' });
  res.end(data);
 } catch {
  res.writeHead(404);res.end();
 }
});
await new Promise(ready => server.listen(0, '127.0.0.1', ready));
const origin = 'http://127.0.0.1:' + server.address().port;
const [engine = 'chromium'] = process.argv.slice(2);
const browser = await { chromium, webkit }[engine].launch();
const image = 'data:image/jpeg;base64,' + (await sharp({create:{
 width:32,height:32,channels:3,background:'#27314d'
}}).jpeg().toBuffer()).toString('base64');
try {
 for (const width of [320, 390, 430]) {
  const context = await browser.newContext({viewport:{width,height:844},isMobile:true,
   hasTouch:true,serviceWorkers:'block'});
  try {
   await context.route('**/*', route => route.request().url().startsWith(origin + '/') ?
    route.continue() : route.abort());
   const page = await context.newPage();
   const load = async () => {
    await page.goto(origin + '/');
    await page.evaluate(() => Promise.all([closetReady,outfitBoardReady]));
    await page.evaluate(() => switchView('stylist'));
    await page.locator('#stylistOccasion').selectOption('Casual');
    await page.locator('details').filter({has:page.locator('#stylistSeason')}).locator('summary').click();
    await page.locator('#stylistSeason').selectOption('Spring');
   };
   const seed = async () => {
    await page.evaluate(async ({owner,image}) => {
     const piece = (id,category,itemType) => normalizeClothing({id,ownerId:owner,
      name:id,category,itemType,image,color:'Blue'});
     const rows = [...Array.from({length:5},(_,i)=>piece('tee-'+i,'Tops','T-shirt')),
      piece('jeans','Bottoms','Jeans'),piece('shoes','Shoes','Sneakers')];
     await new Promise((done,reject)=>{
      const tx=db.transaction('items','readwrite');
      for(const row of rows)tx.objectStore('items').put(row);
      tx.oncomplete=done;tx.onabort=()=>reject(tx.error);
     });
    }, {owner,image});
   };
   const cards = page.locator('#styledCollectionResults article');
   const first = () => cards.first().locator('figcaption').allTextContents();
   const create = async () => {
    await page.locator('#createCollectionOutfits').click();
    await page.waitForFunction(()=>document.querySelectorAll('#styledCollectionResults article').length===3);
   };
   const originalPhoto = () => page.evaluate(() => ({
    pictures:items.map(item=>item.image),saved:savedOutfitBoards.length
   }));
   owner=ownerA;
   await load();await seed();await load();
   await create();
   const original = await first();
   const originalData = await originalPhoto();
   assert.match(await cards.first().textContent(),/Ranking uses recorded colors and patterns where available/);
   await cards.first().getByRole('button',{name:'Hide this combination'}).click();
   await page.waitForFunction(previous=>{
    const names=[...document.querySelectorAll('#styledCollectionResults article:first-child figcaption')].map(x=>x.textContent);
    return names.length===3&&JSON.stringify(names)!==JSON.stringify(previous);
   },original);
   assert.equal(await page.locator('#restoreStylistFeedback').isVisible(),true);
   await load();await context.setOffline(true);await create();
   assert.notDeepEqual(await first(),original);
   await context.setOffline(false);
   owner=ownerB;
   await load();await seed();await load();await create();
   assert.deepEqual(await first(),original);
   assert.equal(await page.locator('#restoreStylistFeedback').isHidden(),true);
   owner=ownerA;
   await load();await create();assert.notDeepEqual(await first(),original);
   await page.locator('#restoreStylistFeedback').click();
   await page.waitForFunction(previous=>JSON.stringify([...document.querySelectorAll(
    '#styledCollectionResults article:first-child figcaption')].map(x=>x.textContent))===JSON.stringify(previous),original);
   assert.deepEqual(await originalPhoto(),originalData);
   await load();await create();assert.deepEqual(await first(),original);
   console.log('ASSIGNMENT41_BROWSER',engine,width,'hide reload offline owner-isolation restore photo-preservation PASS');
  } finally {
   await context.close();
  }
 }
} finally {
 await browser.close();
 await new Promise(done=>server.close(done));
}
