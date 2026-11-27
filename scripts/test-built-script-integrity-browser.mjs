import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium, webkit } from 'playwright';

const [engine, baseline, candidate] = process.argv.slice(2);
assert.ok(engine === 'chromium' || engine === 'webkit', 'Expected chromium or webkit');
assert.ok(baseline && candidate, 'Expected baseline and candidate build directories');

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};
const roots = { baseline: resolve(baseline), candidate: resolve(candidate) };
let originAvailable = true;
const server = createServer(async (request, response) => {
  if (!originAvailable) {
    response.destroy();
    return;
  }
  try {
    const { pathname } = new URL(request.url, 'http://localhost');
    const [, build, ...segments] = pathname.split('/');
    const root = Object.hasOwn(roots, build) && roots[build];
    const asset = root && resolve(root, segments.join('/') || 'index.html');
    if (!asset || !asset.startsWith(root + sep)) {
      response.writeHead(404).end();
      return;
    }
    const bytes = await readFile(asset);
    response.writeHead(200, {
      'Content-Type': types[extname(asset)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise(resolveListening => server.listen(0, '127.0.0.1', resolveListening));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await { chromium, webkit }[engine].launch();
  for (const width of [320, 390, 430]) {
    const viewport = { width, height: 800 };
    const faults = await browser.newContext({ viewport, serviceWorkers: 'block' });
    const page = await faults.newPage();
    const appScript = /\/app\.js\?v=[a-f0-9]+$/;
    const appendMarker = async route => {
      const original = await route.fetch();
      await route.fulfill({
        response: original,
        body: (await original.text()) + '\nwindow.integrityFixtureExecuted = true;\n',
      });
    };
    const appState = () => page.evaluate(() => ({
      appLoaded: typeof switchView === 'function',
      modifiedScriptRan: window.integrityFixtureExecuted === true,
    }));

    await page.route(appScript, appendMarker);
    await page.goto(origin + '/baseline/');
    assert.deepEqual(await appState(), { appLoaded: true, modifiedScriptRan: true });

    await page.goto(origin + '/candidate/');
    assert.deepEqual(await appState(), { appLoaded: false, modifiedScriptRan: false });
    await page.unroute(appScript, appendMarker);

    const unavailable = route => route.fulfill({ status: 404, body: '' });
    await page.route(appScript, unavailable);
    await page.reload();
    assert.deepEqual(await appState(), { appLoaded: false, modifiedScriptRan: false });
    await page.unroute(appScript, unavailable);

    await page.reload();
    assert.deepEqual(await appState(), { appLoaded: true, modifiedScriptRan: false });

    for (const path of ['', 'benchmark.html', 'phone-photo-check.html']) {
      await page.goto(origin + '/candidate/' + path);
      const scripts = await page.locator('script').evaluateAll(entries =>
        entries.map(script => [script.src, script.integrity]));
      assert.ok(scripts.length, path);
      for (const [src, integrity] of scripts) {
        const url = new URL(src);
        assert.equal(url.origin, origin);
        assert.match(url.search, /^\?v=[a-f0-9]{12}$/);
        const asset = url.pathname.slice('/candidate/'.length);
        const bytes = await readFile(resolve(candidate, asset));
        assert.equal(integrity, 'sha384-' + createHash('sha384').update(bytes).digest('base64'));
      }
    }
    await faults.close();

    const offline = await browser.newContext({ viewport });
    const offlinePage = await offline.newPage();
    await offlinePage.goto(origin + '/candidate/');
    await offlinePage.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
    originAvailable = false;
    try {
      await offlinePage.reload();
    } finally {
      originAvailable = true;
    }
    assert.equal(await offlinePage.evaluate(() => typeof switchView), 'function');
    await offline.close();
    console.log(`${engine} ${width}: baseline executes substituted script, candidate blocks it, restores startup, verifies entrypoint hashes and reloads offline`);
  }
} finally {
  await browser?.close();
  server.close();
}
