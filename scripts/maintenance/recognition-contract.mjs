import { digest } from './trends.mjs';

const engines = ['chromium', 'webkit'];
const matches = (actual, expected) => ['category', 'type', 'color'].every(key => actual?.[key] === expected[key]);
const semver = /^[1-9]\d*\.\d+\.\d+$/;
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

// This admission gate consumes observations from a trusted benchmark runner.
// It has no model activation, training, telemetry, or owner-storage access.
export function validateRecognitionCandidate({ manifest, artifact, benchmark, baselineRelease, baseline, candidate, approvedMajorDigest }) {
  if (manifest?.schema_version !== 1 || !['rules', 'model'].includes(manifest.kind) ||
      !semver.test(manifest?.version ?? '') || !sha(manifest.sha256) ||
      !Buffer.isBuffer(artifact) || digest(artifact) !== manifest.sha256 ||
      !['compatible', 'major'].includes(manifest.change) ||
      (manifest.change === 'major' && approvedMajorDigest !== manifest.sha256)) {
    throw Error('recognition-manifest-rejected');
  }
  if (!semver.test(baselineRelease?.version ?? '') || !sha(baselineRelease?.sha256) ||
      (manifest.version.split('.')[0] !== baselineRelease.version.split('.')[0] && approvedMajorDigest !== manifest.sha256)) {
    throw Error('recognition-baseline-or-approval-missing');
  }
  if (benchmark?.schema_version !== 1 || !Array.isArray(benchmark.cases) || !benchmark.cases.length ||
      digest(JSON.stringify(benchmark)) !== manifest.benchmark_sha256) throw Error('recognition-benchmark-mismatch');
  const ids = new Set();
  for (const entry of benchmark.cases) {
    if (typeof entry?.id !== 'string' || !entry.id || ids.has(entry.id) ||
        !['public-licensed', 'synthetic'].includes(entry.origin) ||
        !sha(entry.original_sha256) ||
        !['category', 'type', 'color'].every(key => typeof entry.expected?.[key] === 'string' && entry.expected[key])) {
      throw Error('recognition-benchmark-case-rejected');
    }
    ids.add(entry.id);
  }
  for (const engine of engines) {
    const oldRun = baseline?.[engine];
    const newRun = candidate?.[engine];
    if (oldRun?.artifact_sha256 !== baselineRelease.sha256 || newRun?.artifact_sha256 !== manifest.sha256 ||
        oldRun.benchmark_sha256 !== manifest.benchmark_sha256 || newRun.benchmark_sha256 !== manifest.benchmark_sha256 ||
        !oldRun.initialized || !newRun.initialized ||
        ![oldRun, newRun].every(run => run.results && Object.keys(run.results).length === ids.size)) {
      throw Error('recognition-browser-evidence-missing');
    }
    let hits = 0;
    for (const entry of benchmark.cases) {
      if (!Object.hasOwn(oldRun.results, entry.id) || !Object.hasOwn(newRun.results, entry.id)) throw Error('recognition-case-evidence-missing');
      const before = oldRun.results[entry.id];
      const after = newRun.results[entry.id];
      if (after?.original_sha256 !== entry.original_sha256 || before?.original_sha256 !== entry.original_sha256 ||
          after.requires_owner_confirmation !== true || after.saved_without_confirmation !== false ||
          (matches(before, entry.expected) && !matches(after, entry.expected))) {
        throw Error('recognition-regression');
      }
      if (matches(after, entry.expected)) hits++;
    }
    if (hits === 0) throw Error('recognition-no-correct-cases');
  }
  return { validated: true, version: manifest.version, digest: manifest.sha256, cases: ids.size };
}
