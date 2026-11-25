'use strict';

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

let source = fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs', 'utf8');
// Replay the bundled public trend document so the journey uses a fixed library.
const routeAnchor = "  if(!audit&&u.origin===authOrigin&&u.pathname.startsWith('/auth/v1/'))";
if (source.split(routeAnchor).length !== 2) throw Error('Native trend route anchor changed');
source = source.replace(routeAnchor, `
  if(u.origin==='https://raw.githubusercontent.com'&&
     u.pathname==='/nickhaney916-lang/Closet-Current/main/public/trend-data.json')
   return route.fulfill({status:200,contentType:'application/json',
    headers:{'access-control-allow-origin':'*'},path:join(root,'trend-data.json')});
` + routeAnchor);
const start = " advance('owner-private-closet-and-source-check');";
const end = '}catch(error){\n errors.push(clean(error.message';
if (source.split(start).length !== 2 || source.split(end).length !== 2) {
 throw Error('Native Stylist-to-wear journey anchors changed');
}

const journey = source.slice(0, source.indexOf(start)) + `
 const nav = (view) => page.locator('nav.main-nav button.tab[data-view="'+view+'"]').click();
 const openBuilder = async () => {
  await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 };
 const openHistory = async () => {
  const panel = page.locator('#outfitWearPanel');
  if (!await panel.evaluate(el => el.open)) await panel.locator('summary').click();
 };
 const logout = async () => {
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.locator('#authGate').waitFor();
 };
 const wearRow = () => page.evaluate(() => new Promise((resolve, reject) => {
  const request = db.transaction('state').objectStore('state').get('outfit-wear-history-v1');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
 }));
 const history = page.locator('#outfitWearHistory');
 const wearStatus = page.locator('#outfitWearStatus');
 // Use a normal trusted pointer click. Do not force, retry, dispatch or mutate
 // application state. Center after history rendering changes the layout.
 const clickWear = async (button, expected) => {
  await page.waitForFunction(() => outfitWearLoaded && !outfitWearBusy &&
   window.closetAuth.user?.id === 'p99-A');
  await button.evaluate(el => el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  await button.evaluate(el => {
   window.__main1054WearClick = { trusted:0, matched:0, busyAtClick:null, hit:null };
   document.addEventListener('click', event => {
    const receipt=window.__main1054WearClick;
    receipt.trusted=Number(event.isTrusted);
    receipt.matched=Number(event.composedPath().includes(el));
    receipt.busyAtClick=outfitWearBusy;
    receipt.hit=event.target?.tagName || null;
   }, {capture:true,once:true});
  });
  try {
   await button.click();
   await wearStatus.getByText(expected,{exact:true}).waitFor();
   const click=await page.evaluate(()=>window.__main1054WearClick);
   assert.equal(click.trusted,1,'wear click must be trusted');
   assert.equal(click.matched,1,'wear click must target the intended control');
   assert.equal(click.busyAtClick,false,'wear transaction was busy at click');
  } catch(error) {
   const diagnostic=await page.evaluate(()=>({
    click:window.__main1054WearClick,
    ownerReady:window.closetAuth.user?.id==='p99-A',
    busy:outfitWearBusy,loaded:outfitWearLoaded,
    events:outfitWearEvents.length,
    status:document.querySelector('#outfitWearStatus')?.textContent,
    historyOpen:document.querySelector('#outfitWearPanel')?.open
   })).catch(()=>({unavailable:true}));
   console.log('MAIN1054_WEAR_DIAGNOSTIC',JSON.stringify({engine,width,expected,...diagnostic}));
   throw error;
  }
 };

 advance('stylist-owned-outfit-save');
 await nav('stylist');
 await page.locator('#stylistOccasion').selectOption('Casual');
 await page.locator('#styleCollectionForm summary').click();
 await page.locator('#stylistSeason').selectOption('Fall');
 await page.locator('#createCollectionOutfits').click();
 const card = page.locator('#styledCollectionResults .styled-outfit').filter({ hasText: shirtName }).first();
 await card.waitFor();
 assert.deepEqual(await card.locator('figcaption').allTextContents(), [shirtName, jeansName]);
 const name = await card.locator('h3').innerText();
 assert.equal(await wearRow(), undefined, 'generating or viewing a look recorded wear');
 await card.getByRole('button', { name: 'Save outfit', exact: true }).click();
 await card.getByText('Saved. Find it in Outfit builder', { exact: false }).waitFor();
 assert.equal(await wearRow(), undefined, 'saving a Stylist look recorded wear');

 advance('builder-explicit-wear');
 await openBuilder();
 await openHistory();
 const saved = page.locator('#savedBoards');
 const openSaved = saved.getByRole('button', { name, exact: true });
 const wear = saved.getByRole('button', { name: 'I wore this · ' + name, exact: true });
 await history.getByText('No outfits recorded yet.', { exact: true }).waitFor();
 await openSaved.click();
 assert.equal(await page.locator('#boardName').inputValue(), name);
 assert.equal(await wearRow(), undefined, 'opening a saved Stylist look recorded wear');
 await clickWear(wear, 'Outfit recorded for today.');
 const persisted = await wearRow();
 assert.equal(persisted.owner, 'p99-A');
 assert.equal(persisted.events.length, 1);
 assert.deepEqual(await page.evaluate(slots => ({
  top: items.find(item => item.id === slots.top)?.name,
  bottom: items.find(item => item.id === slots.bottom)?.name
 }), persisted.events[0].slots), { top: shirtName, bottom: jeansName });
 await history.getByText(name, { exact: true }).waitFor();
 await clickWear(wear, 'This combination is already recorded for today.');
 assert.deepEqual(await wearRow(), persisted);

 advance('wear-history-owner-isolation');
 await logout();
 await signIn('p99-B');
 await openBuilder();
 await openHistory();
 await history.getByText('No outfits recorded yet.').waitFor();
 assert.equal(await wearRow(), undefined);
 assert.equal(await openSaved.count(), 0);
 await logout();
 await page.reload({ waitUntil: 'domcontentloaded' });
 await signIn('p99-A');
 await openBuilder();
 await openHistory();
 await history.getByText(name, { exact: true }).waitFor();
 assert.deepEqual(await wearRow(), persisted);
 await history.getByRole('button', { name: 'Open saved outfit', exact: true }).click();
 assert.equal(await page.locator('#boardName').inputValue(), name);
 await history.getByRole('button', { name: /Undo wear record/ }).click();
 await wearStatus.getByText('Wear record removed.').waitFor();
 assert.equal((await wearRow())?.events.length ?? 0, 0);
 assert.equal(await openSaved.count(), 1);
 assert.deepEqual(errors, [], 'native browser page exception');
 console.log('MAIN1054_STYLIST_WEAR_PASS', JSON.stringify({ engine, width, browserVersion: browser.version() }));
` + source.slice(source.indexOf(end));

const path = 'scripts/.main1054-stylist-wear-' + process.pid + '.mjs';
try {
 fs.writeFileSync(path, journey, { flag: 'wx' });
 const run = spawnSync(process.execPath, [path], { stdio: 'inherit' });
 if (run.error) throw run.error;
 process.exitCode = run.status ?? 1;
} finally {
 fs.rmSync(path, { force: true });
}
