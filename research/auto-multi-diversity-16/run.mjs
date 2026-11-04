import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname, join} from 'node:path';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';
import {scorePhoto, summarizePhotos, verifySource} from './score.mjs';
import {partitionProposals, PRIMARY_CONFIDENCE} from './triage.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = resolve(process.env.MULTI16_OUTPUT ?? 'benchmark/auto-multi-16');
const sources = JSON.parse(await readFile(new URL('./photos.json', import.meta.url)));
const engineNames = (process.env.MULTI16_ENGINES ?? 'chromium,webkit').split(',');
const engines = {chromium, webkit};
const inputMode = process.env.MULTI16_INPUT ?? 'direct-original';
if (!['direct-original', 'app-equivalent'].includes(inputMode)) throw new Error('Unknown input mode');
const families = {4: 'upper', 5: 'skirt', 6: 'bottom', 7: 'dress', 9: 'shoes'};
if (new Set(sources.map(row => row.sha256)).size !== sources.length) {
  throw new Error('Repeated original SHA in benchmark');
}
if (engineNames.some(name => !Object.hasOwn(engines, name))) throw new Error('Unknown engine');
await mkdir(out, {recursive: true});

const sourceBytes = new Map();
const cache = process.env.MULTI16_SOURCE_CACHE;
if (cache) await mkdir(cache, {recursive: true});

async function downloadOriginal(row) {
  let problem;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await delay(Math.min(60_000, 5_000 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(row.source, {
        headers: {'user-agent': 'ClosetCurrentSegmentationQA/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'},
        signal: AbortSignal.timeout(45_000),
      });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
      await response.body?.cancel();
      problem = 'HTTP ' + response.status;
      if (response.status !== 429 && response.status < 500) break;
      const retryAfter = Number(response.headers.get('retry-after'));
      if (attempt < 4 && retryAfter > 0) await delay(Math.min(60_000, retryAfter * 1000));
    } catch (error) {
      problem = error.message;
    }
  }
  throw new Error(row.id + ' locked original unavailable: ' + problem);
}

for (const row of sources) {
  const path = row.id + '.jpg';
  let bytes, downloaded = false;
  if (process.env.MULTI16_ORIGINALS) {
    bytes = await readFile(join(process.env.MULTI16_ORIGINALS, path));
  } else {
    if (cache) {
      try {
        bytes = await readFile(join(cache, path));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (!bytes) {
      await delay(2_000);
      bytes = await downloadOriginal(row);
      downloaded = true;
    }
  }
  const image = sharp(bytes, {failOn: 'truncated'});
  verifySource(row, bytes, await image.metadata());
  await image.stats(); // Validate complete decoding before any inference.
  if (cache && downloaded) await writeFile(join(cache, path), bytes);
  sourceBytes.set(row.id, bytes);
}
console.log('Verified ' + sourceBytes.size + ' unique locked JPEGs');

const mime = {'.mjs': 'text/javascript', '.js': 'text/javascript', '.html': 'text/html'};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (req.method !== 'GET' || !/^\/(public|research)\//.test(path)) throw new Error('Invalid path');
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root)) throw new Error('Invalid path');
    res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
const reports = {};
try {
  for (const engine of engineNames) {
    const results = [], networkFailures = [], externalWrites = [], screenshots = [];
    let browser;
    try {
      const proxy = process.env.MULTI16_BROWSER_PROXY;
      browser = await engines[engine].launch(proxy ? {proxy: {server: proxy, bypass: '127.0.0.1'}} : {});
      const context = await browser.newContext({
        viewport: {width: 390, height: 920}, isMobile: true, hasTouch: true, serviceWorkers: 'block',
      });
      const downloads = new Map();
      await context.route('**/*', async route => {
        const request = route.request();
        if (!request.url().startsWith(origin + '/') && !['GET', 'HEAD'].includes(request.method())) {
          externalWrites.push(request.method());
          return route.abort();
        }
        const url = new URL(request.url());
        const allowedAsset = (url.hostname === 'cdn.jsdelivr.net' &&
          url.pathname.startsWith('/npm/@huggingface/transformers@3.8.1/dist/')) ||
          (url.hostname === 'huggingface.co' &&
          url.pathname.startsWith('/Xenova/segformer_b0_clothes/resolve/a2489ea8e7ec1ee912190546bad31a4906ccca76/'));
        if (!process.env.MULTI16_RELAY_MODEL || !allowedAsset || request.method() !== 'GET') {
          return route.continue();
        }
        if (!downloads.has(url.href)) {
          downloads.set(url.href, fetch(url, {signal: AbortSignal.timeout(90000)}).then(async response => ({
            status: response.status,
            contentType: response.headers.get('content-type') ?? 'application/octet-stream',
            body: Buffer.from(await response.arrayBuffer()),
          })));
        }
        try {
          const asset = await downloads.get(url.href);
          return await route.fulfill({...asset, headers: {
            'access-control-allow-origin': '*', 'content-type': asset.contentType,
          }});
        } catch {
          downloads.delete(url.href);
          return route.abort();
        }
      });
      const page = await context.newPage();
      const recordFailure = (url, detail) => {
        if (!/^https?:/.test(url) || url.startsWith(origin + '/')) return;
        const parsed = new URL(url);
        const failure = {resource: parsed.origin + parsed.pathname, detail};
        if (!networkFailures.some(x => x.resource === failure.resource && x.detail === detail)) {
          networkFailures.push(failure);
        }
      };
      page.on('requestfailed', request => recordFailure(request.url(), request.failure()?.errorText));
      page.on('response', response => {
        if (response.status() >= 400) recordFailure(response.url(), 'HTTP ' + response.status());
      });
      for (const row of sources) {
        const started = Date.now();
        await page.goto(origin + '/research/auto-multi-model-evidence-15/runner.html');
        const resized = await page.evaluate(async ({row, jpeg, inputMode}) => {
          document.querySelector('footer').textContent = [row.attribution.title,
            row.attribution.author, row.attribution.license, row.attribution.source,
            row.attribution.licenseUrl].filter(Boolean).join(' · ');
          let inferenceImage = jpeg;
          if (inputMode === 'app-equivalent' && Math.max(row.width, row.height) > 3072) {
            const decoded = new Image();
            decoded.src = jpeg;
            await decoded.decode();
            const scale = 3072 / Math.max(decoded.naturalWidth, decoded.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(decoded.naturalWidth * scale);
            canvas.height = Math.round(decoded.naturalHeight * scale);
            canvas.getContext('2d').drawImage(decoded, 0, 0, canvas.width, canvas.height);
            inferenceImage = canvas.toDataURL('image/jpeg', 0.9);
          }
          window.__startAutoMulti15({image: jpeg, inferenceImage, expectations: row.regions, sha256: row.sha256});
          return inferenceImage !== jpeg;
        }, {row, inputMode, jpeg: 'data:image/jpeg;base64,' + sourceBytes.get(row.id).toString('base64')});
        let inference;
        try {
          await page.waitForFunction(() => window.__autoMulti15.done, null, {timeout: 450000});
          inference = await page.evaluate(() => window.__autoMulti15.results);
        } catch {
          inference = {modelExecuted: false, error: 'browser_timeout_or_crash', proposals: []};
        }
        const proposals = inference.proposals.map(p => ({...p, family: families[p.regionId] ?? 'unknown'}));
        const score = scorePhoto(row.regions, {status: inference.modelExecuted ? 'completed' : 'failed', proposals});
        const workerRejectedOriginal = inputMode === 'direct-original' &&
          inference.error === 'worker_reported_failure' && (
            (inference.progress === 'separating' && Math.max(row.width, row.height) > 3072) ||
            (!inference.progress && 23 + 4 * Math.ceil(row.bytes / 3) > 12_000_000));
        const {primary, additional} = partitionProposals(proposals);
        const primaryScore = scorePhoto(row.regions, {status: score.status, proposals: primary});
        results.push({id: row.id, split: row.split, tags: row.tags, resized, workerRejectedOriginal,
          aboveAppImportLimit: row.bytes > 10 * 1024 * 1024, sourceSha256: row.sha256, error: inference.error,
          phase: inference.progress ?? null, elapsedMs: Date.now() - started, proposals, score,
          additionalReviewProposals: additional.length, primaryScore});
        console.log(engine, row.id, score.status, inference.progress ?? '', score.matches.length, '/', score.expectedCount);
        if (['worn-rkk', 'two-shirts', 'flatlay-outfit'].includes(row.id)) {
          const widths = row.id === 'worn-rkk' ? [320, 390, 430] : [390];
          for (const width of widths) {
            await page.setViewportSize({width, height: 920});
            const filename = [inputMode, engine, row.id, width].join('-') + '.png';
            const screenshot = await page.screenshot({path: join(out, filename), fullPage: true});
            if ((await sharp(screenshot).metadata()).width !== width) throw new Error('Screenshot width mismatch');
            screenshots.push({filename, width, sha256: createHash('sha256').update(screenshot).digest('hex')});
          }
          await page.setViewportSize({width: 390, height: 920});
        }
      }
      await context.close();
    } catch (error) {
      reports[engine] = {harnessError: error.message};
    } finally {
      await browser?.close();
    }
    const aggregate = (split, key = 'score') => summarizePhotos(results
      .filter(row => !split || row.split === split).map(row => row[key]));
    reports[engine] = {...reports[engine], results, networkFailures, externalWrites, screenshots,
      modelAssetTransport: process.env.MULTI16_RELAY_MODEL ? 'pinned asset relay' : 'browser network',
      inputMode, expectedOriginalInputRejections: results.filter(row => row.workerRejectedOriginal).length,
      all: aggregate(), development: aggregate('development'), heldOut: aggregate('held-out'),
      triage: {primaryConfidence: PRIMARY_CONFIDENCE, all: aggregate(null, 'primaryScore'),
        development: aggregate('development', 'primaryScore'), heldOut: aggregate('held-out', 'primaryScore')},
      slices: Object.fromEntries([...new Set(sources.flatMap(row => row.tags))].map(tag =>
        [tag, summarizePhotos(results.filter(row => row.tags.includes(tag)).map(row => row.score))]))};
    await writeFile(join(out, inputMode + '.json'), JSON.stringify(reports, null, 2) + '\n');
  }
} finally {
  await new Promise(done => server.close(done));
}
if (Object.values(reports).some(report => report.harnessError || report.all.photos !== sources.length ||
    report.all.failedPhotos !== report.expectedOriginalInputRejections || report.externalWrites.length)) process.exitCode = 1;
