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
    body:"window.closetAuth={user:{id:'camera-picker-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
  }));
  await context.addInitScript(() => {
    const camera = window.testCamera = {attempts:0, stopped:0, fail:'NotAllowedError'};
    window.AudioContext = class { resume() { return Promise.resolve(); } };
    window.Worker = class { constructor() { throw new Error('Synthetic recognition unavailable'); } };
    Object.defineProperty(navigator, 'mediaDevices', {value:{getUserMedia() {
      camera.attempts++;
      if (camera.fail) return Promise.reject(new DOMException('Synthetic camera error', camera.fail));
      return new Promise(resolve => {
        camera.grant = () => resolve({getTracks:() => [{stop() { camera.stopped++; }}]});
      });
    }}});
  });
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(() => closetReady);
  await page.locator('.tab[data-view="scan"]').click();
  const picker = page.locator('#clothingPhotos');
  for (const failure of ['NotAllowedError','NotFoundError','NotReadableError']) {
    await page.evaluate(name => { testCamera.fail = name; }, failure);
    await page.locator('#start').click();
    await page.waitForFunction(() => !cameraOpening);
    assert.equal(await picker.isEnabled(), true);
    assert.match(await page.locator('#message').textContent(), failure === 'NotAllowedError' ? /permission was denied/ : /Synthetic camera error/);
  }
  await page.evaluate(() => { testCamera.fail = null; });
  await page.locator('#start').click();
  await page.waitForFunction(() => typeof testCamera.grant === 'function' && cameraOpening);
  assert.equal(await picker.isEnabled(), true);
  const jpeg = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const paint = canvas.getContext('2d');
    paint.fillStyle = '#061021';
    paint.fillRect(0, 0, 96, 96);
    paint.fillStyle = '#e4a440';
    paint.fillRect(20, 18, 58, 61);
    return canvas.toDataURL('image/jpeg').split(',')[1];
  });
  await picker.setInputFiles({name:'saved.jpg',mimeType:'image/jpeg',buffer:Buffer.from(jpeg,'base64')});
  await page.waitForFunction(() => batch.length === 1 && !busy && !document.getElementById('review').hidden);
  await page.evaluate(() => testCamera.grant());
  await page.waitForFunction(() => testCamera.stopped === 1);
  const result = await page.evaluate(() => ({
    attempts:testCamera.attempts, cameraActive:Boolean(stream), reviewing:!document.getElementById('review').hidden,
    image:batch[0].image, saved:items.length
  }));
  assert.equal(result.attempts, 4);
  assert.equal(result.cameraActive, false);
  assert.equal(result.reviewing, true);
  assert.match(result.image, /^data:image\/jpeg;base64,/);
  assert.equal(result.saved, 0);
  console.log(engine.name() + ' passed camera errors, explicit retry, saved-photo fallback, and late grant cleanup');
} finally {
  await browser?.close();
  server.close();
}
