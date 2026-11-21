import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';

const engine = process.argv[2] === 'webkit' ? webkit : chromium;
const originalShell = await readFile('dist/index.html', 'utf8');
const originalWorker = await readFile('dist/local-worker.mjs', 'utf8');
const version = originalShell.match(/app\.js\?v=([a-f0-9]+)/)[1];
const nextVersion = version.replace(/^./, digit => digit === '0' ? '1' : '0');
let upgraded = false;
let offline = false;
const server = createServer(async (request, response) => {
  const {pathname} = new URL(request.url, 'http://localhost');
  if (offline) return request.socket.destroy();
  if (pathname === '/probe') return response.writeHead(200, {'Content-Type': 'text/html'}).end('');
  if (!pathname.startsWith('/app/')) return response.writeHead(404).end();
  const file = pathname === '/app/' ? '/index.html' : pathname.slice(4);
  try {
    let body = await readFile('dist' + file);
    if (upgraded && ['/index.html', '/sw.js'].includes(file)) {
      body = body.toString().replaceAll(version, nextVersion);
    }
    if (upgraded && file === '/local-worker.mjs') {
      body = Buffer.concat([body, Buffer.from('\n// Next release\n')]);
    }
    const type = /\.html$/.test(file) ? 'text/html'
      : /\.m?js$/.test(file) ? 'text/javascript' : 'application/octet-stream';
    if (['/index.html', '/sw.js'].includes(file)) {
      console.log(request.url, upgraded ? 'new release' : 'old release');
    }
    response.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-cache'});
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await engine.launch({executablePath: process.env.PWA_BROWSER_EXECUTABLE});
  const context = await browser.newContext();
  await context.route(request => request.origin !== url, route => route.abort());
  const page = await context.newPage();
  const shell = async response => assert.ok(response && (await response.text()).includes('app.js?v=' + version));
  const worker = (tab, release) => tab.evaluate(async value => {
    const response = await fetch('local-worker.mjs?v=' + value);
    return response.text();
  }, release);

  await shell(await page.goto(url + '/app/'));
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await shell(await page.reload());
  assert.equal(await worker(page, version), originalWorker);

  upgraded = true;
  offline = true;
  await shell(await page.reload());
  assert.equal(await worker(page, version), originalWorker);
  offline = false;
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(reg => reg.update()));
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
  await shell(await page.reload());
  assert.equal(await worker(page, version), originalWorker);

  const waitingShell = await page.evaluate(async expected => {
    const cache = await caches.open('closet-current-' + expected);
    const response = await cache.match(new URL('index.html?v=' + expected, location.href).href);
    return response ? (await response.text()).includes('app.js?v=' + expected) : false;
  }, nextVersion);
  assert.ok(waitingShell, 'Waiting worker installed the new shell');
  const offScope = await context.newPage();
  await offScope.goto(url + '/probe');
  await page.close();
  await offScope.waitForFunction(async expected => {
    const registration = await navigator.serviceWorker.getRegistration('/app/');
    const keys = await caches.keys();
    return registration?.active?.state === 'activated' && !registration.waiting
      && keys.length === 1 && keys[0] === 'closet-current-' + expected;
  }, nextVersion);
  const cachedRelease = await offScope.evaluate(async expected => {
    const cache = await caches.open('closet-current-' + expected);
    const response = await cache.match(new URL('/app/index.html?v=' + expected, location.href).href);
    if (!response) return (await cache.keys()).slice(0, 8).map(request => request.url);
    const body = await response.text();
    return body.match(/app\.js\?v=([a-f0-9]+)/)[1];
  }, nextVersion);
  assert.equal(cachedRelease, nextVersion, 'Activated cache contains the new shell');
  const next = await offScope.goto(url + '/app/index.html');
  assert.equal(next.status(), 200, 'Navigation after activation returns the shell');
  await offScope.waitForFunction(() => navigator.serviceWorker.controller !== null);
  assert.equal(await offScope.locator('script[src^="app.js?"]').getAttribute('src'), 'app.js?v=' + nextVersion);
  assert.equal(await worker(offScope, nextVersion), originalWorker + '\n// Next release\n');
  offline = true;
  assert.ok((await (await offScope.reload()).text()).includes('app.js?v=' + nextVersion));
  assert.equal(await worker(offScope, nextVersion), originalWorker + '\n// Next release\n');
  console.log(engine.name() + ' passed cold load, reload, offline, waiting update, and activation');
} finally {
  await browser?.close();
  server.close();
}
