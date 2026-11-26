'use strict';

const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {randomUUID} = require('node:crypto');
let source = fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs', 'utf8');

function before(anchor, code) {
 if (source.split(anchor).length !== 2) throw Error('Calendar journey anchor changed: ' + anchor);
 source = source.replace(anchor, () => code + '\n' + anchor);
}

before(' context=await browser.newContext({', `
 const timezone = {320:'America/Los_Angeles',390:'Asia/Kolkata',430:'Pacific/Apia'}[width];
 async function newOwnerContext(timezoneId, storageState) {
`);
before(' page=await context.newPage();', `
  return context;
 }
 context = await newOwnerContext(timezone);
`);
source = source.replace('viewport:{width,height:920}', 'timezoneId,storageState,locale:"en-US",viewport:{width,height:920}');
source = source.replace("resolve('benchmark/parallel99-normal-journey'", "resolve('benchmark/assignment-26'");

before(" advance('default-unreviewed-source-preview-refuses');", `
 advance('calendar-boundaries');
 const checks = await page.evaluate(() => {
  const today = new Date(2012,0,28,12);
  const roster = [{id:'old',category:'Tops'},{id:'edge',category:'Tops'},{id:'future',category:'Tops'}];
  const candidates = wearRediscover(roster, [
   {day:'2011-12-29',slots:{top:'old'}},
   {day:'2011-12-30',slots:{top:'edge'}},
   {day:'2012-01-29',slots:{top:'future'}}
  ], today);
  const row = {owner:'p99-A',events:['2024-02-29','2025-02-29','2024-04-31','2024-2-29'].map(day=>({
   id:day,name:'Fixture',day,slots:{top:'fixture'},at:0
  }))};
  return {
   preserved:displayWearDay('2011-12-30'),
   earlyYear:displayWearDay('0099-01-01'),
   rediscovery:candidates.map(({item,day})=>[item.id,day??null]),
   validated:readOutfitWearEvents(row,'p99-A').map(x=>x.day),
   localDay:wearLocalDay(new Date('2026-01-01T00:15:00Z'))
  };
 });
 assert.equal(checks.preserved,'Dec 30, 2011','recorded civil date changed in '+timezone);
 assert.equal(checks.earlyYear,'Jan 1, 99','historical year changed during formatting');
 assert.deepEqual(checks.rediscovery,[['future',null],['old','2011-12-29']]);
 assert.deepEqual(checks.validated,['2024-02-29']);
 assert.equal(checks.localDay,width===320?'2025-12-31':'2026-01-01');
`);

before(" advance('source-attested-default-outfit-preview');", `
 advance('confirmed-wear-calendar');
 const wearRow = () => page.evaluate(() => new Promise((resolve,reject) => {
  const get = db.transaction('state').objectStore('state').get('outfit-wear-history-v1');
  get.onsuccess = () => resolve(get.result);
  get.onerror = () => reject(get.error);
 }));
 const openBuilder = async () => {
  await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 };
 const openHistory = async () => {
  const panel = page.locator('#outfitWearPanel');
  if (!await panel.evaluate(el=>el.open)) await panel.locator('summary').click();
 };
 const wear = page.getByRole('button',{name:'I wore this · '+outfitName,exact:true});
 const status = page.locator('#outfitWearStatus');
 const clock = (year,month,day,hour,minute) => page.evaluate(args=>new Date(...args).getTime(),
  [year,month-1,day,hour,minute]).then(ms=>page.clock.setFixedTime(new Date(ms)));
 const record = async (day,duplicate=false) => {
  const before = await wearRow();
  await wear.click();
  await status.getByText(duplicate?'This combination is already recorded for today.':'Outfit recorded for today.',
   {exact:true}).waitFor();
  const after = await wearRow();
  assert.equal(after.owner,'p99-A');
  if (duplicate) assert.deepEqual(after,before);
  else {
   assert.equal(after.events.length,(before?.events.length??0)+1);
   assert.equal(after.events[0].day,day);
   assert.deepEqual(after.events[0].slots,await page.evaluate(()=>currentBoard.slots));
  }
 };
 assert.equal(await wearRow(),undefined,'saving an outfit cannot imply wearing it');
 await clock(2023,12,31,23,59);
 assert.equal(await page.evaluate(()=>defaultStylistSeason()),'Winter');
 await record('2023-12-31');
 await clock(2024,1,1,0,1);
 await record('2024-01-01');
 await clock(2024,2,29,23,59);
 await record('2024-02-29');
 await clock(2024,3,1,0,1);
 assert.equal(await page.evaluate(()=>defaultStylistSeason()),'Spring');
 await record('2024-03-01');
 await clock(2024,3,10,1,59);
 await record('2024-03-10');
 await clock(2024,3,10,3,1);
 await record('2024-03-10',true);
 await clock(2024,11,3,1,30);
 await record('2024-11-03');
 if (width===320) {
  await page.clock.setFixedTime(new Date('2024-11-03T09:30:00Z'));
  await record('2024-11-03',true);
 }
 await clock(2024,3,1,0,1);
 await record('2024-03-01',true);
 const expectedHistory = await wearRow();
 const rediscovery = page.locator('#outfitWearRediscovery').getByRole('button',{name:'Style around '+shirtName,exact:true});
 const reopenHistory = async () => {
  await page.locator('#outfitWearPanel summary').click();
  await openHistory();
 };
 await clock(2024,12,2,12,0);
 await reopenHistory();
 assert.equal(await rediscovery.count(),0,'29 calendar days is still recent');
 await clock(2024,12,3,12,0);
 await reopenHistory();
 await rediscovery.waitFor();
 assert.deepEqual(await wearRow(),expectedHistory,'viewing rediscovery must never record wear');
 assert.equal(new Set(expectedHistory.events.map(e=>e.id)).size,6);
 await page.clock.setFixedTime(new Date());
`);

before("  await audit?.verifyObjectURLCleanup(page);", `
  assert.equal(backup.includes(Buffer.from('outfit-wear-history-v1')),false,'v3 export is wardrobe only');
  assert.ok(expectedHistory.events.every(e=>!backup.includes(Buffer.from(e.id))));
`);

before('  // Genuine file input + browser confirmation; never write IndexedDB directly.', `
  await openHistory();
  await page.locator('#outfitWearHistory strong').first().waitFor();
  assert.deepEqual(await wearRow(),expectedHistory);
`);

before("  advance('offline-warm-session-original-preview');", `
  assert.deepEqual(await wearRow(),expectedHistory,'same-context import changed local wear records');
`);

before(' const secondStorage=await audit?.storage(page,{secondOwner:true});', `
 advance('calendar-owner-switch-and-fresh-restore');
 await openHistory();
 await page.locator('#outfitWearHistory').getByText('No outfits recorded yet.').waitFor();
 assert.equal(await wearRow(),undefined);
 async function signOut() {
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>!document.querySelector('#authGate').hidden);
 }
 await signOut();
 await signIn('p99-A');
 assert.deepEqual(await wearRow(),expectedHistory);
 const originalContext = context;
 const originalPage = page;
 const destination = timezone==='Asia/Kolkata'?'America/Los_Angeles':'Asia/Kolkata';
 // Carry the existing browser storage into the new timezone, without exporting
 // it to disk or changing the saved records.
 const travelContext = await newOwnerContext(destination,await originalContext.storageState({indexedDB:true}));
 try {
  page = await travelContext.newPage();
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>db?.name==='closet-current-user-p99-A'&&window.closetAuth.user?.id==='p99-A');
  await openBuilder();
  await openHistory();
  await page.locator('#outfitWearHistory strong').first().waitFor();
  const labels = await page.locator('#outfitWearHistory li > p').allTextContents();
  assert.equal(labels.length,6);
  assert.ok(labels.some(label=>label.startsWith('Feb 29, 2024')));
  assert.ok(labels.some(label=>label.startsWith('Dec 31, 2023')));
  assert.deepEqual(await wearRow(),expectedHistory);
 } finally {
  await travelContext.close();
  context = originalContext;
  page = originalPage;
 }
 const freshContext = await newOwnerContext(destination);
 try {
  page = await freshContext.newPage();
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  await signIn('p99-A');
  assert.equal(await rowCount(),0);
  await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#import').setInputFiles({name:'calendar-v3.json',mimeType:'application/json',buffer:backup});
  await page.waitForFunction(()=>/restored|imported/i.test(document.querySelector('#message').textContent));
  await openBuilder();
  await page.locator('#savedBoards button').filter({hasText:outfitName}).first().click();
  assert.deepEqual(await page.evaluate(()=>currentBoard.slots),expectedHistory.events[0].slots);
  const restored = await page.evaluate(()=>items.map(x=>({
   owner:x.ownerId,source:x.sourceSHA256,image:x.originalPhoto.image
  })));
  assert.equal(restored.length,2);
  for (const original of originals) {
   const row = restored.find(x=>x.source===original.sha);
   assert.equal(row?.owner,'p99-A');
   assert.equal(row.image,original.url);
  }
  await openHistory();
  await page.locator('#outfitWearHistory').getByText('No outfits recorded yet.').waitFor();
  assert.equal(await wearRow(),undefined,'fresh v3 restore must honor the local-only history contract');
  const travelDate = await page.evaluate(day=>displayWearDay(day),'2011-12-30');
  assert.equal(travelDate,checks.preserved);
 } finally {
  await freshContext.close();
  context = originalContext;
  page = originalPage;
 }
 console.log('ASSIGNMENT_26_CALENDAR_PASS',JSON.stringify({engine,width,timezone,
  browser:browser.version(),confirmedDays:expectedHistory.events.map(e=>e.day),
  v3FreshRestore:'outfit and exact originals preserved; wear history device-local'}));
`);

const output = 'scripts/.assignment-26-' + randomUUID() + '.mjs';
try {
 fs.writeFileSync(output, source, {flag:'wx'});
 const run = spawnSync(process.execPath, [output], {
  stdio:'inherit', env:{...process.env,P1607_AUDIT:'0',P1607_CACHE_ONLY:'0'}
 });
 if (run.error) throw run.error;
 process.exitCode = run.status ?? 1;
} finally {
 if (fs.existsSync(output)) fs.unlinkSync(output);
}
