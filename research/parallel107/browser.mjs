import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { chromium, webkit } from 'playwright';
import axe from 'axe-core';
import { licensedPath, licensedSHA256, syntheticJpeg } from './fixtures.mjs';

const engine = process.env.P107_BROWSER;
assert.ok(['chromium', 'webkit'].includes(engine), 'Set P107_BROWSER=chromium or webkit');
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/capture.mjs', ['capture.mjs', 'text/javascript']],
  ['/calibration.mjs', ['calibration.mjs', 'text/javascript']],
  ['/capture.css', ['capture.css', 'text/css']],
  ['/axe.js', [null, 'text/javascript']]
]);
const server = createServer(async (request, response) => {
  const file = files.get(request.url);
  if (!file) return response.writeHead(404).end();
  const [path, type] = file;
  response.writeHead(200, { 'content-type': type });
  response.end(path ? await readFile(new URL(path, import.meta.url)) : axe.source);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
const receipts = [];
try {
  browser = await { chromium, webkit }[engine].launch();
  for (const width of [320, 390, 430]) {
    const started = performance.now();
    const page = await browser.newPage({ viewport: { width, height: 820 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.addScriptTag({ url: url + '/axe.js' });
    const scan = await page.evaluate(() => window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
    }));
    assert.deepEqual(scan.violations.map(item => item.id), []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'photo');
    const photo = page.getByLabel('Front JPEG');
    await photo.setInputFiles(licensedPath);
    await page.locator('#preview').waitFor();
    await page.getByLabel('Garment type').selectOption('dress');
    await page.getByRole('button', { name: 'Check measurement evidence' }).click();
    let receipt = JSON.parse(await page.locator('#json').textContent());
    assert.equal(receipt.input.original.sha256, licensedSHA256);
    assert.equal(receipt.result.evidence.status, 'NOT_VERIFIED');
    assert.ok(receipt.result.evidence.reasons.includes('two-measured-reference-spans-required'));
    assert.equal(receipt.result.consumer3DAdmitted, false);
    assert.equal(receipt.result.originalPhoto2DFallbackRequired, true);
    assert.equal(await page.locator('#preview').isVisible(), true);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download original JPEG' }).click();
    const downloaded = await readFile(await (await downloadEvent).path());
    assert.equal(createHash('sha256').update(downloaded).digest('hex'), licensedSHA256);

    let selection = 0;
    const loadMock = orientation => photo.setInputFiles({
      name: `synthetic-${orientation}-${++selection}.jpg`, mimeType: 'image/jpeg', buffer: mocks.get(orientation)
    });
    const mocks = new Map(await Promise.all([1, 2, 6].map(async value => [value, await syntheticJpeg(value)])));
    for (const orientation of [2, 6]) {
      await loadMock(orientation);
      await page.locator('#preview').waitFor();
      await page.getByRole('status').filter({ hasText: 'Reference placement is disabled' }).waitFor();
      assert.equal(await page.locator('#references').evaluate(fieldset => fieldset.disabled), true);
      assert.equal(await page.locator('[name=startX1]').isDisabled(), true);
      const [w, h] = await page.locator('#preview').evaluate(img => [img.naturalWidth, img.naturalHeight]);
      assert.deepEqual([w, h], orientation === 6 ? [300, 400] : [400, 300]);
    }

    await loadMock(1);
    await page.locator('#preview').waitFor();
    const synthetic = await page.evaluate(async () => {
      const { fittingHandoff, identifyOriginal } = await import('/calibration.mjs');
      const bytes = await document.querySelector('#photo').files[0].arrayBuffer();
      const original = await identifyOriginal(bytes);
      const ruler = (start, end) => ({
        start, end, distance: { kind: 'reference', value: 200, unit: 'mm', uncertainty: 1, provenance: 'owner-measured' }
      });
      const input = {
        version: 1, original, lease: null, garmentType: 'top',
        review: { singleGarment: true, completeEdges: true, overhead: true, coplanar: true },
        measurements: [{ kind: 'flatWidth', value: 12, unit: 'in', uncertainty: 0.125, provenance: 'owner-measured' }],
        references: [ruler([50, 50], [150, 50]), ruler([250, 250], [350, 250])]
      };
      return fittingHandoff(JSON.stringify(input), original, null, 'synthetic');
    });
    assert.equal(synthetic.evidence.status, 'SYNTHETIC_REFERENCE_CHECK_PASSED');
    assert.deepEqual(synthetic.evidence.localReferenceIntervalsMmPerPixel[0], { min: 199 / 104, max: 201 / 96 });
    assert.equal(synthetic.consumer3DAdmitted, false);
    await page.locator('#preview').click({ position: { x: 50, y: 50 } });
    assert.notEqual(await page.locator('[name=startX1]').inputValue(), '');
    await page.getByLabel('Garment type').selectOption('top');
    await page.getByLabel('Measured value').fill('45');
    await page.getByLabel('Uncertainty', { exact: true }).fill('0.5');
    await page.getByLabel('Unit', { exact: true }).selectOption('cm');
    await page.getByRole('button', { name: 'Check measurement evidence' }).click();
    receipt = JSON.parse(await page.locator('#json').textContent());
    assert.equal(receipt.result.evidence.manualMeasurementClaimsMm[0].mm, 450);
    assert.equal(receipt.result.evidence.status, 'NOT_VERIFIED');
    await page.getByLabel('Measured value').fill('46');
    assert.equal(await page.locator('#record').isHidden(), true);

    await page.evaluate(() => {
      const decode = HTMLImageElement.prototype.decode;
      window.releaseDecode = undefined;
      HTMLImageElement.prototype.decode = function () {
        return new Promise((resolve, reject) => {
          window.releaseDecode = () => decode.call(this).then(resolve, reject);
        });
      };
      window.restoreDecode = () => { HTMLImageElement.prototype.decode = decode; };
    });
    await loadMock(1);
    await page.waitForFunction(() => Boolean(window.releaseDecode));
    await page.getByRole('button', { name: 'Clear photo and measurements' }).click();
    await page.evaluate(async () => {
      await window.releaseDecode();
      window.restoreDecode();
    });
    assert.equal(await page.locator('#preview').isHidden(), true);
    assert.equal(await page.locator('#download').isHidden(), true);
    await photo.setInputFiles({ name: 'invalid.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a JPEG') });
    await page.getByText(/Could not load original JPEG/).waitFor();
    assert.equal(await page.locator('#preview').isHidden(), true);
    assert.equal(await page.locator('#download').isHidden(), true);
    await photo.setInputFiles(licensedPath);
    await page.locator('#preview').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.deepEqual(errors, []);
    receipts.push({
      engine, browserVersion: browser.version(), width, milliseconds: Math.round(performance.now() - started),
      licensedSHA256, axeViolations: 0, jpegDownloadIdentical: true, originalPhoto2DFallbackRequired: true
    });
    await page.close();
  }
} finally {
  await writeFile(`parallel107-${engine}.json`, JSON.stringify(receipts, null, 2));
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(JSON.stringify(receipts));
