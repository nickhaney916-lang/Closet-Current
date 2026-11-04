import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import photoColor from '../../public/photo-color.js';

const manifest = JSON.parse(await readFile(new URL('color-manifest.json', import.meta.url)));
const hashes = new Set();
const rows = [];
for (const entry of manifest) {
  const bytes = await readFile(entry.fixture);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.id);
  assert.ok(!hashes.has(entry.sha256), 'Duplicate image');
  hashes.add(entry.sha256);
  const oriented = await sharp(bytes).rotate().ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const {width, height, channels} = oriented.info;
  const image = () => sharp(oriented.data, {raw: {width, height, channels}});
  const whole = await image().resize(16, 16, {fit: 'fill'}).raw().toBuffer();
  const [left, top, right, bottom] = entry.region.map((value, axis) =>
    Math.floor(value * (axis % 2 === 0 ? width : height)));
  const region = await image().extract({left, top, width: right - left, height: bottom - top})
    .resize(48, 48, {fit: 'fill'}).raw().toBuffer();
  const baseline = photoColor.estimate(whole, 16, 16);
  const candidate = photoColor.maskedPalette(region, 48, 48);
  rows.push({
    id: entry.id, split: entry.split, expected: entry.color,
    baseline: baseline?.color ?? null,
    baselineAuto: Boolean(baseline && !baseline.needsConfirmation),
    candidate: candidate?.primary ?? null,
    candidateSecondary: candidate?.secondary ?? null,
    candidateAuto: false
  });
}

function summarize(samples, arm) {
  const confusion = {};
  let correct = 0;
  let accepted = 0;
  let acceptedCorrect = 0;
  for (const row of samples) {
    const predicted = row[arm] ?? 'Unknown';
    const matches = predicted === row.expected;
    const expected = confusion[row.expected] ??= {};
    expected[predicted] = (expected[predicted] ?? 0) + 1;
    correct += Number(matches);
    if (row[arm + 'Auto']) {
      accepted++;
      acceptedCorrect += Number(matches);
    }
  }
  return {attempted: samples.length, correct, accepted, acceptedCorrect, confusion};
}
const splits = Object.fromEntries(['development', 'holdout'].map(split => {
  const samples = rows.filter(row => row.split === split);
  return [split, {baseline: summarize(samples, 'baseline'), candidate: summarize(samples, 'candidate')}];
}));
console.log(JSON.stringify({annotationStatus: 'provisional-visual', splits, rows}, null, 2));
