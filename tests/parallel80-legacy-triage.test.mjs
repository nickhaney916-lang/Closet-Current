import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { triageLegacyRegression80 } from "../scripts/p80-legacy-regression-triage.mjs";

const frozen = async () => {
  const manifest = JSON.parse(await readFile("benchmark/manifest-reviewed-32.json", "utf8"));
  const baseline = JSON.parse(await readFile("benchmark/regression-reviewed-32.json", "utf8"));
  const clone = (x) => structuredClone(x);
  const results = clone(baseline.results);
  return { manifest, baseline, results, clone };
};

test("unchanged historical development baseline remains PASS but does not certify independent truth", async () => {
  const { manifest, baseline, results } = await frozen();
  const r = triageLegacyRegression80(manifest, results, baseline);
  assert.equal(r.evaluated, 32);
  assert.equal(r.legacyPassed, true);
  assert.equal(r.legacyFailureCount, 0);
  assert.equal(r.independentSubtypeAccuracy, null);
  assert.equal(r.optInSubtype80ModelAccuracy, null);
  assert.equal(r.releaseAuthorized, false);
  assert.equal(r.familyAlphaHold, true);
  assert.equal(r.permitsAutomaticIndexing, false);
});

test("five historical ankle-boot strong expectations becoming Unknown are diagnosed, NOT excused", async () => {
  const { manifest, baseline, results } = await frozen();
  for (const id of ["commons-0088", "commons-0089", "commons-0092", "commons-0093", "commons-0094"]) {
    const row = results.find((x) => x.id === id);
    assert.equal(row.prediction.type, "Ankle boots");
    row.prediction.type = "Unknown";
    row.strong = false;
    row.categoryConfirmed = true;
  }
  const r = triageLegacyRegression80(manifest, results, baseline);
  assert.equal(r.legacyPassed, false);
  assert.equal(r.legacyFailureCount, 10);
  assert.equal(r.ownerReviewAbstentionCases.length, 5);
  assert.equal(r.unresolvedFailures.length, 0);
  assert.equal(r.verdict, "LEGACY_REGRESSION_FAIL_REQUIRES_REVIEW");
  assert.equal(r.currentStrongCount, r.historicalStrongCount - 5);
  assert.equal(r.releaseAuthorized, false);
});

test("confidently wrong boot predictions and non-Unknown review guesses remain unresolved FAIL", async () => {
  const { manifest, baseline, results } = await frozen();
  const wrong = results.find((x) => x.id === "commons-0088");
  wrong.prediction.type = "Sneakers";
  wrong.strong = true;
  wrong.categoryConfirmed = false;
  const guessed = results.find((x) => x.id === "commons-0089");
  guessed.prediction.type = "Sneakers";
  guessed.strong = false;
  guessed.categoryConfirmed = true;
  const r = triageLegacyRegression80(manifest, results, baseline);
  assert.equal(r.legacyPassed, false);
  assert.equal(r.ownerReviewAbstentionCases.length, 0);
  assert.equal(r.unresolvedFailures.length, 2);
  assert.ok(r.unresolvedFailures.some((x) => x.legacyReasons.includes("new_incorrect_automatic_type")));
  assert.ok(r.unresolvedFailures.some((x) => x.legacyReasons.includes("review_guesses_type")));
});

test("foreign/missing result IDs and corrupted baseline data fail safely, never silently pass", async () => {
  const { manifest, baseline, results } = await frozen();
  results.push({ ...structuredClone(results[0]), id: "foreign-record" });
  const foreign = triageLegacyRegression80(manifest, results, baseline);
  assert.equal(foreign.legacyPassed, false);
  assert.equal(foreign.unresolvedFailures.length, 1);
  assert.equal(foreign.unresolvedFailures[0].id, "foreign-record");
  assert.ok(foreign.unresolvedFailures[0].legacyReasons.includes("unexpected_result"));
  results.pop();
  results.splice(0, 1);
  const missing = triageLegacyRegression80(manifest, results, baseline);
  assert.equal(missing.legacyPassed, false);
  assert.ok(missing.unresolvedFailures.some((x) => x.legacyReasons.includes("missing_result")));
  results.push(structuredClone(results[0]));
  assert.throws(() => triageLegacyRegression80(manifest, results, baseline), /duplicate ID/);
});

test("diagnostic never uses file names as labels, accesses photos, or changes the actual regression checker", async () => {
  const { manifest, baseline, results } = await frozen();
  const before = structuredClone({ manifest, baseline, results });
  const r = triageLegacyRegression80(manifest, results, baseline);
  assert.deepEqual({ manifest, baseline, results }, before);
  assert.equal(r.independentlyHumanLabeled, false);
  assert.ok(!("image" in r));
  assert.equal(r.legacyPassed, true);
});
