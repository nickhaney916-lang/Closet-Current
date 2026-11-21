import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';

const engine = process.argv[2] === 'webkit' ? webkit : chromium;
const types = {html:'text/html', js:'text/javascript', mjs:'text/javascript', css:'text/css'};
const server = createServer(async (request, response) => {
  const {pathname} = new URL(request.url, 'http://localhost');
  const file = pathname === '/' ? '/index.html' : pathname;
  try {
    const body = await readFile('dist' + file);
    response.writeHead(200, {'Content-Type':types[file.split('.').pop()] ?? 'application/octet-stream'});
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await engine.launch();
  const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('**/auth.js?*', route => route.fulfill({
    contentType:'text/javascript',
    body:"window.closetAuth={user:{id:'outfit-decode-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
  }));
  await context.addInitScript(() => {
    const state = window.testDecode = {created:[], revoked:[], pending:[], jobs:[], hang:true};
    const nativeDecode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function() {
      if (state.hang && this.src.startsWith('blob:')) {
        return new Promise(resolve => state.pending.push(resolve));
      }
      return nativeDecode.call(this);
    };
    const create = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = file => {
      const url = create.call(URL, file);
      state.created.push(url);
      return url;
    };
    URL.revokeObjectURL = url => {
      state.revoked.push(url);
      revoke.call(URL, url);
    };
    const schedule = window.setTimeout.bind(window);
    window.setTimeout = (fn, delay, ...args) => schedule(fn, delay === 15000 && state.hang ? 50 : delay, ...args);
    window.Worker = class {
      postMessage(data) {
        state.jobs.push(data);
        queueMicrotask(() => this.onmessage({data:{id:data.id,type:'done'}}));
      }
      terminate() {}
    };
  });
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(() => closetReady);
  await page.locator('.tab[data-view="scan"]').click();
  await page.locator('#captureOutfit').click();
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 12;
    return canvas.toDataURL('image/jpeg').split(',')[1];
  });
  const file = {name:'synthetic.jpg',mimeType:'image/jpeg',buffer:Buffer.from(image,'base64')};
  for (let i=1; i<=2; i++) {
    await page.locator('#outfitCamera').setInputFiles(file);
    await page.waitForFunction(count => testDecode.pending.length === count && !busy, i);
    assert.match(await page.locator('#outfitSplitStatus').textContent(), /Could not open/);
    assert.deepEqual(await page.evaluate(() => testDecode.revoked), await page.evaluate(() => testDecode.created));
    assert.equal(await page.evaluate(() => testDecode.jobs.length), 0);
    await page.locator('.tab[data-view="closet"]').click();
    await page.locator('.tab[data-view="scan"]').click();
  }
  await page.evaluate(() => { testDecode.hang = false; });
  await page.locator('#outfitCamera').setInputFiles(file);
  await page.waitForFunction(() => testDecode.jobs.length === 1 && !busy);
  await page.evaluate(async () => {
    testDecode.pending.forEach(resolve => resolve());
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  const observed = await page.evaluate(() => ({
    created:testDecode.created, revoked:testDecode.revoked, jobs:testDecode.jobs, batch:batch.length, saved:items.length
  }));
  assert.equal(observed.created.length, 3);
  assert.deepEqual(observed.revoked, observed.created);
  assert.equal(observed.jobs.length, 1);
  assert.match(observed.jobs[0].image, /^data:image\/jpeg;base64,/);
  assert.equal(observed.batch, 0);
  assert.equal(observed.saved, 0);
  console.log(engine.name() + ' passed repeat camera-file timeouts, navigation, fresh capture, and late decode cleanup');
} finally {
  await browser?.close();
  server.close();
}
