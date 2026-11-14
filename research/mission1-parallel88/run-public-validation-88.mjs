// P88 actual SegFormer inference on independently human-polygon-labeled,
// previously EXPOSED P68 validation photos. NEVER blind/sealed acceptance.
// No owner account, cloud write, automatic garment save or private data.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
import {AutoModelForSemanticSegmentation, AutoProcessor, RawImage} from '@huggingface/transformers';
import {clothingLabelMap, clothingMaskGroups} from '../../public/outfit-segmentation.mjs';
import {clothingReviewInstances840} from '../../public/outfit-instance-review-840.mjs';

const ROOT = new URL('../../', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestFile = new URL('./frozen-public-validation-68.json', import.meta.url);
const manifestBytes = await readFile(manifestFile);
const EXPECTED_MANIFEST = 'b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd';
if (sha256(manifestBytes) !== EXPECTED_MANIFEST) throw Error('Frozen human-manifest SHA has changed');
const manifest = JSON.parse(manifestBytes);
if (manifest.split !== 'validation' || manifest.rows.length !== 16 ||
    manifest.rows.reduce((n, row) => n + row.annotations.length, 0) !== 53)
  throw Error('Frozen 16-photo, 53-instance exposed validation cohort changed');

const MODEL = 'Xenova/segformer_b0_clothes';
const REVISION = 'a2489ea8e7ec1ee912190546bad31a4906ccca76';
const OUT = new URL('../../benchmark/p88-real-validation-masks/', import.meta.url);
const JPEG = new URL('../../benchmark/p88-public-validation-jpegs/', import.meta.url);
const INDEX = new URL('real-validation-predictions-88.json', OUT);
await mkdir(OUT, {recursive: true});

const reports = Object.fromEntries(['baseline', 'p88'].map(mode => [mode, {
  schema: 'closet-current-p88-real-public-human-mask-inference/v1',
  method: mode,
  scope: 'previously exposed P68 validation only; unknown pretraining exposure',
  manifestSha256: EXPECTED_MANIFEST,
  frozenSource: 'P68 primary Flickr CC BY/BY-SA and Fashionpedia human polygon annotations',
  model: MODEL,
  revision: REVISION,
  dtype: 'fp32', device: 'cpu',
  modelAssetHashVerified: false,
  independentHumanMasks: true,
  humanSubtypeLabelsAvailable: false,
  humanColorLabelsAvailable: false,
  sourceDisjointFromP68Development: true,
  notSealedNovelAcceptance: true,
  automaticSave: false,
  physicalDevice: false,
  rows: []
}]));
const loadStarted = performance.now();
const processor = await AutoProcessor.from_pretrained(MODEL, {revision: REVISION});
const model = await AutoModelForSemanticSegmentation.from_pretrained(MODEL, {
  revision: REVISION, dtype: 'fp32', device: 'cpu',
  session_options: {intraOpNumThreads: 2, interOpNumThreads: 1}
});
const loadMs = performance.now() - loadStarted;
try {
  for (const [index, row] of manifest.rows.entries()) {
    const original = await readFile(new URL(row.image, JPEG));
    if (original.length !== row.bytes || sha256(original) !== row.sha256 ||
        original[0] !== 255 || original[1] !== 216)
      throw Error('Original official source JPEG identity mismatch: ' + row.id);

    const image = await RawImage.read(new URL(row.image, JPEG).pathname);
    if (image.width !== row.width || image.height !== row.height)
      throw Error('Source image geometry mismatch: ' + row.id);

    const start = performance.now();
    const inputs = await processor(image), output = await model(inputs);
    const map = clothingLabelMap(output.logits.data, output.logits.dims);
    const inferenceMs = performance.now() - start;
    output.logits.dispose?.();
    for (const obj of Object.values(inputs)) obj?.dispose?.();

    // Compare both methods on *identical model logits and original JPEG*.
    const groupsByMode = {
      baseline: map.personDetected ? clothingMaskGroups(map) : [],
      p88: map.personDetected ? clothingReviewInstances840(map) : []
    };
    for (const mode of ['baseline', 'p88']) {
      const groups = groupsByMode[mode], regions = [];
      for (const [ordinal, group] of groups.entries()) {
        if (!(group.selected instanceof Uint8Array) ||
            group.selected.length !== map.width * map.height)
          throw Error('Selected mask dimensions invalid');
        const full = new Uint8Array(image.width * image.height);
        let positive = 0;
        for (let y = 0; y < image.height; y++) {
          const sourceRow = Math.min(map.height - 1, Math.floor(y * map.height / image.height)) * map.width;
          for (let x = 0; x < image.width; x++) {
            const bit = group.selected[sourceRow + Math.min(map.width - 1, Math.floor(x * map.width / image.width))];
            if (bit !== 0 && bit !== 1) throw Error('Mask must be binary');
            full[y * image.width + x] = bit;
            positive += bit;
          }
        }
        const maskFile = mode + '-' + String(index).padStart(2, '0') + '-' + String(ordinal) + '.bin.gz';
        await writeFile(new URL(maskFile, OUT), gzipSync(full));
        regions.push({
          label: group.label, categories: group.categories, count: group.count,
          confidence: group.confidence, clipped: group.clipped,
          instanceMethod: group.instanceMethod || 'native_semantic_group',
          maskFile, maskSha256: sha256(full), measuredOriginalResolutionPixels: positive,
          requiresOwnerReview: true
        });
      }
      reports[mode].rows.push({
        id: row.id, sha256: row.sha256, width: image.width, height: image.height,
        sourceMatch: true, truthCount: row.annotations.length,
        predictedCount: regions.length, regions,
        inferenceMs, automaticSave: false
      });
    }
    console.log('P88_GENUINE_EXPOSED_VALIDATION', JSON.stringify({
      index: index + 1, total: manifest.rows.length, id: row.id,
      humanInstances: row.annotations.length,
      baselineMasks: groupsByMode.baseline.length,
      candidateMasks: groupsByMode.p88.length, inferenceMs: Math.round(inferenceMs)
    }));
    globalThis.gc?.();
  }
  for (const report of Object.values(reports)) {
    report.loadMs = loadMs;
    report.peakResidentBytes = process.resourceUsage().maxRSS * 1024;
  }
  await writeFile(INDEX, JSON.stringify({
    schema: 'closet-current-p88-exposed-real-photo-comparison/v1',
    baseline: reports.baseline, p88: reports.p88
  }, null, 2) + '\n');
  console.log('P88_REAL_VALIDATION_PREDICTIONS', JSON.stringify({
    rows: 16, humanInstances: 53, originalSha256Verified: true,
    output: INDEX.pathname, maskedInstanceAccuracy: 'EVALUATE_POLYGONS_SEPARATELY',
    subtypeAndColorAccuracy: 'UNAVAILABLE', independentNewBlindAcceptance: false
  }));
} finally {
  await model.dispose();
}
