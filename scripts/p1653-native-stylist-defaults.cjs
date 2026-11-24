'use strict';

const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {randomUUID} = require('node:crypto');
const sourcePath = 'scripts/test-parallel99-normal-app-browser.mjs';
const runnerPath = 'scripts/.p1653-stylist-runner-'+randomUUID()+'.mjs';
const boundary = " advance('normal-chooser-cancel-duplicate-and-oversize-no-write');";
const source = fs.readFileSync(sourcePath, 'utf8');
const start = source.indexOf(boundary);
const end = source.lastIndexOf('}catch(error){');
if (start < 0 || end <= start) throw Error('Native journey boundary changed');

const journey = `
 advance('p1653-stylist-return-login-and-reset');
 const openStylist = () => page.locator('button.tab[data-view="stylist"]').first().click();
 const occasion = page.getByLabel('What’s the plan?');
 const audience = page.getByLabel('Style preference');
 const season = page.getByLabel('Dress for');
 const remember = page.getByRole('button', {name:'Remember these defaults'});
 const reset = page.getByRole('button', {name:'Reset defaults'});
 const defaultsStatus = page.locator('#stylistDefaultsStatus');
 const values = async () => [await occasion.inputValue(), await audience.inputValue()];
 const reload = async () => {
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => db?.name==='closet-current-user-p99-A');
  await openStylist();
 };
 const logout = async () => {
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.locator('#authGate').waitFor({state:'visible'});
 };
 const choose = async () => {
  await occasion.selectOption('Work');
  await audience.selectOption('Men');
 };
 await openStylist();
 assert.deepEqual(await values(), ['Casual','All']);
 const calendar = await season.inputValue();
 await choose();
 if (process.env.P1653_EXPECT_RED==='1') {
  await reload();
  assert.deepEqual(await values(), ['Casual','All']);
  console.log('P1653_NATIVE_RED', engine, width, '2 selections must be re-entered');
 } else {
  const rowsBefore = await page.evaluate(() => readAll());
  await page.locator('#styleCollectionForm details summary').click();
  await season.selectOption(calendar==='Spring'?'Winter':'Spring');
  await remember.click();
  await defaultsStatus.getByText('Stylist defaults remembered on this device.').waitFor();
  await reload();
  await remember.waitFor();
  await page.waitForFunction(() => document.querySelector('#rememberStylistDefaults').disabled===false);
  assert.deepEqual(await values(), ['Work','Men']);
  assert.equal(await season.inputValue(), calendar);
  await page.locator('#createCollectionOutfits').click();
  await page.waitForFunction(() => !document.querySelector('#createCollectionOutfits').disabled);
  assert.match(await page.locator('#stylistStatus').innerText(), /from your collection/);
  assert.deepEqual(await page.evaluate(() => readAll()), rowsBefore);
  await audience.selectOption('Women');
  await reload();
  await page.waitForFunction(() => document.querySelector('#rememberStylistDefaults').disabled===false);
  assert.deepEqual(await values(), ['Work','Men']);
  // Pause only the awaited trend response to make late publication observable.
  await page.evaluate(() => {
   refreshTrendLibrary=()=>new Promise(resolve=>{window.releaseP1653Trend=resolve;});
  });
  await page.locator('#createCollectionOutfits').click();
  await page.waitForFunction(() => typeof window.releaseP1653Trend==='function');
  let releaseLogout;
  const logoutReady = new Promise(resolve => {releaseLogout=resolve;});
  await context.route('**/auth/v1/logout',async route=>{
   await logoutReady;
   await route.fallback();
  },{times:1});
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  try {
   await page.locator('#appShell').waitFor({state:'hidden'});
   await page.evaluate(async () => {
    window.releaseP1653Trend();
    await new Promise(resolve => setTimeout(resolve,0));
   });
   assert.equal(await page.locator('#styledCollectionResults .styled-outfit').count(),0);
   assert.deepEqual(await values(),['Casual','All']);
  } finally {
   releaseLogout();
  }
  await page.locator('#authGate').waitFor({state:'visible'});
  await signIn('p99-B');
  await openStylist();
  assert.deepEqual(await values(), ['Casual','All']);
  assert.equal(await rowCount(), 0);
  await logout();
  await signIn('p99-A');
  await openStylist();
  await page.waitForFunction(() => document.querySelector('#rememberStylistDefaults').disabled===false);
  assert.deepEqual(await values(), ['Work','Men']);
  await reset.click();
  await defaultsStatus.getByText('Remembered stylist defaults cleared.').waitFor();
  assert.deepEqual(await values(), ['Casual','All']);
  await reload();
  await page.waitForFunction(() => document.querySelector('#rememberStylistDefaults').disabled===false);
  assert.deepEqual(await values(), ['Casual','All']);
  await page.evaluate(() => new Promise((resolve,reject) => {
   const tx = db.transaction('state','readwrite');
   tx.objectStore('state').put({id:'stylist-defaults-v1',owner:'p99-A',occasion:'unknown',audience:['Men']});
   tx.oncomplete=resolve;
   tx.onabort=()=>reject(tx.error);
  }));
  await reload();
  await page.waitForFunction(() => document.querySelector('#rememberStylistDefaults').disabled===false);
  assert.deepEqual(await values(), ['Casual','All']);
  assert.deepEqual(await page.evaluate(() => readAll()), rowsBefore);
  assert.deepEqual(errors, []);
  console.log('P1653_NATIVE_GREEN', engine, width, '2 to 0 repeat selections; explicit save/reset, calendar, owned looks, isolation, invalid data');
 }
`;

const signedIn = " assert.equal(await page.locator('#home').isVisible(),true);";
const imported = "  advance('offline-warm-session-original-preview');";
if (!source.includes(signedIn) || !source.includes(imported)) throw Error('Native restore journey boundary changed');

const restoreJourney = source.replace(signedIn, signedIn + `
 await page.locator('button.tab[data-view="stylist"]').first().click();
 await page.getByLabel('What’s the plan?').selectOption('Work');
 await page.getByLabel('Style preference').selectOption('Men');
 await page.getByRole('button',{name:'Remember these defaults'}).click();
 await page.locator('#stylistDefaultsStatus').getByText('Stylist defaults remembered on this device.').waitFor();
 await page.locator('nav.main-nav button.tab[data-view="home"]').click();
`).replace(imported, `
 assert.equal(backup.includes(Buffer.from('stylist-defaults-v1')),false);
 await page.locator('button.tab[data-view="stylist"]').first().click();
 assert.equal(await page.getByLabel('What’s the plan?').inputValue(),'Work');
 assert.equal(await page.getByLabel('Style preference').inputValue(),'Men');
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
` + imported);

try {
  const runner = process.env.P1653_RESTORE==='1' ? restoreJourney : source.slice(0, start) + journey + source.slice(end);
  fs.writeFileSync(runnerPath, runner, {flag:'wx'});
  const run = spawnSync(process.execPath, [runnerPath], {
    stdio:'inherit',
    env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'},
  });
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
} finally {
  if (fs.existsSync(runnerPath)) fs.unlinkSync(runnerPath);
}
