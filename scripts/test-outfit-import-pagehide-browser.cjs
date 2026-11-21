const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { chromium, webkit } = require('playwright');

const source = readFileSync(process.env.OUTFIT_CAPTURE_SOURCE || 'public/outfit-capture.js', 'utf8');
const progressOnly = process.env.OUTFIT_PROGRESS_ONLY === '1';
const html = `
<meta charset="utf-8">
<input id="outfitUpload" type="file"><input id="outfitCamera" type="file">
<button id="outfitRetry" hidden>Retry</button>
<button id="useCapturedOutfit"></button>
<div id="outfitSplitStatus"></div><div id="outfitSaveStatus"></div>
<div id="outfitPieceSummary"></div><div id="outfitPieceActions"></div>
<div id="scan" hidden></div>
<script>
const $ = id => document.getElementById(id);
const captureProof01Active = true;
const captureProofOwner = () => 'test-owner';
const captureOperationEpoch = 0;
const recognitionAssetVersion = '';
const closetReady = Promise.resolve(), localPending = new Set();
const batch = [], items = [];
const pendingDecodes = new Map();
let busy = false, session = 0;
function stopCamera() {}
function controls(locked) { $('outfitUpload').disabled = locked; }
function captureProofFromFile(file) {
 return new Promise(resolve => pendingDecodes.set(file.name, resolve));
}
function finishDecode(name) {
 const canvas = document.createElement('canvas');
 const image = canvas.toDataURL('image/jpeg');
 pendingDecodes.get(name)({image, sourceSHA256:name, originalPhoto:{sha256:name}});
}
</script><script src="/outfit-capture.js"></script>`;

async function check(engine, browserType) {
 const browser = await browserType.launch();
 try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const workers = [];
  const errors = [];
  page.on('worker', worker => workers.push(worker));
  page.on('pageerror', error => errors.push(error.message));
  await page.route('http://localhost/**', route => {
   const path = new URL(route.request().url()).pathname;
   if (path === '/') return route.fulfill({contentType:'text/html',body:html});
   if (path === '/outfit-capture.js') return route.fulfill({contentType:'text/javascript; charset=utf-8',body:source});
   if (path === '/outfit-worker.mjs') return route.fulfill({
    contentType:'text/javascript',
    body:progressOnly ? `
     let id;
     onmessage = ({data}) => {
      if (data.id) { id = data.id; postMessage({type:'progress',id,phase:'loading',percent:25}); }
      else postMessage({...data,id});
     };
    ` : "onmessage = ({data}) => postMessage({type:'done',id:data.id,count:0});"
   });
   return route.abort();
  });
  await page.goto('http://localhost/');
  const picker = page.locator('#outfitUpload');
  const select = name => picker.setInputFiles({name,mimeType:'image/jpeg',buffer:Buffer.from('fixture')});
  if (progressOnly) {
   await select('progress.jpg');
   await page.waitForFunction(() => pendingDecodes.has('progress.jpg'));
   await page.evaluate(() => finishDecode('progress.jpg'));
   const status = page.locator('#outfitSplitStatus');
   await page.waitForFunction(() => $('outfitSplitStatus').textContent.includes('25%'));
   const send = packet => page.evaluate(packet => new Promise(resolve => {
    const worker = outfitSplitJob.worker;
    worker.addEventListener('message', () => resolve(), {once:true});
    worker.postMessage(packet);
   }), packet);
   await send({type:'progress',phase:'separating'});
   assert.equal(await status.textContent(), 'Separating clothes…');
   await send({type:'progress',phase:'loading',percent:100});
   assert.equal(await status.textContent(), 'Separating clothes…', 'late download must not replace separation status');
   await send({type:'done',count:0});
   assert.equal(await picker.isEnabled(), true);
   assert.equal(await page.locator('#outfitRetry').isVisible(), true);
   assert.deepEqual(errors, []);
   console.log(`${engine}: progress ordering regression passed`);
   return;
  }
  await select('old.jpg');
  await page.waitForFunction(() => busy && pendingDecodes.has('old.jpg'));
  // Inject the lifecycle event while the asynchronous decode is held open.
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', {persisted:true})));
  assert.equal(await picker.isEnabled(), true, 'pagehide must release the picker');
  assert.match(await page.locator('#outfitSplitStatus').textContent(), /paused/);

  await select('fresh.jpg');
  await page.waitForFunction(() => busy && pendingDecodes.has('fresh.jpg'));
  await page.evaluate(async () => {
   finishDecode('old.jpg');
   await new Promise(resolve => setTimeout(resolve, 0));
  });
  assert.equal(await picker.isEnabled(), false, 'old decode must not release the new operation');
  assert.equal(workers.length, 0);
  await page.evaluate(() => finishDecode('fresh.jpg'));
  await page.waitForFunction(() => !busy && !$('outfitRetry').hidden);
  assert.equal(workers.length, 1, 'only the fresh decode starts a Worker');
  assert.match(await page.locator('#outfitSplitStatus').textContent(), /No new clothing pieces/);
  assert.deepEqual(errors, []);
  console.log(`${engine}: lifecycle regression passed`);
 } finally {
  await browser.close();
 }
}

const engines = {chromium, webkit};
const requested = process.argv.slice(2);
Promise.allSettled((requested.length ? requested : Object.keys(engines)).map(name => check(name, engines[name])))
 .then(results => {
  for (const result of results) {
   if (result.status === 'rejected') {
    console.error(result.reason);
    process.exitCode = 1;
   }
  }
 });
