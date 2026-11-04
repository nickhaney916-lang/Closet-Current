import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';

const manifest = JSON.parse(await readFile(new URL('color-manifest.json', import.meta.url)));
const algorithm = await readFile('public/photo-color.js');
const output = 'benchmark/category-color-39-output';
const evidence = [];
await mkdir(output, {recursive: true});
for (const [engine, launcher] of Object.entries({chromium, webkit})) {
  const browser = await launcher.launch();
  try {
    for (const [index, width] of [320, 390, 430].entries()) {
      const item = manifest.filter(row => row.split === 'holdout')[index];
      const bytes = await readFile(item.fixture);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
      const page = await browser.newPage({viewport: {width, height: 760}, deviceScaleFactor: 1});
      try {
        await page.route('http://localhost/**', route => {
          const path = new URL(route.request().url()).pathname;
          if (path === '/photo.jpg') return route.fulfill({contentType: 'image/jpeg', body: bytes});
          if (path === '/color.js') return route.fulfill({contentType: 'text/javascript', body: algorithm});
          return route.fulfill({contentType: 'text/html', body: `<!doctype html>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>body{font:16px system-ui;margin:16px} img,canvas{max-width:100%;max-height:280px}</style>
            <h1>Garment color review</h1><p>Archived source photograph</p><img src="/photo.jpg">
            <p>Visually selected garment region</p><canvas width="128" height="128"></canvas><p id="result"></p>
            <script src="/color.js"></script>`});
        });
        await page.goto('http://localhost/');
        const result = await page.evaluate(async ({region, sha256}) => {
          const buffer = await (await fetch('/photo.jpg')).arrayBuffer();
          const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))]
            .map(byte => byte.toString(16).padStart(2, '0')).join('');
          if (hash !== sha256) throw Error('Source bytes changed');
          const image = document.querySelector('img');
          await image.decode();
          const canvas = document.querySelector('canvas');
          const context = canvas.getContext('2d');
          const [left, top, right, bottom] = region;
          context.drawImage(image, left * image.naturalWidth, top * image.naturalHeight,
            (right - left) * image.naturalWidth, (bottom - top) * image.naturalHeight,
            0, 0, 128, 128);
          const start = performance.now();
          const palette = PhotoColor.maskedPalette(context.getImageData(0, 0, 128, 128).data, 128, 128);
          const latencyMs = performance.now() - start;
          document.querySelector('#result').textContent =
            'Suggested color: ' + (palette?.primary ?? 'Unknown') + ' · Confirm visually';
          return {hash, palette, latencyMs};
        }, item);
        assert.ok(result.palette);
        const filename = engine + '-' + width + '.png';
        const png = await page.screenshot({path: output + '/' + filename});
        const dimensions = await sharp(png).metadata();
        assert.equal(dimensions.width, width);
        assert.equal(dimensions.height, 760);
        assert.ok((await sharp(png).stats()).channels.some(channel => channel.stdev > 6));
        evidence.push({engine, width, id: item.id, ...result, filename,
          screenshotSHA256: createHash('sha256').update(png).digest('hex')});
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(output + '/browser-color.json', JSON.stringify(evidence, null, 2));
