/**
 * Diagnostic for historical 32-photo development regression expectations.
 * It NEVER reclassifies a FAIL as PASS, writes a wardrobe, or certifies accuracy.
 * Manifest labels are historical development metadata, NOT independent blind truth.
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { checkRecognitionRegressions } from "./check-recognition-regressions.mjs";

export const LEGACY_TRIAGE_SCHEMA80 = "p80-legacy-review-first-triage-v1";

export function triageLegacyRegression80(manifest, results, baseline) {
  const legacy = checkRecognitionRegressions(manifest, results, baseline);
  const map = (rows, name) => {
    if (!Array.isArray(rows)) throw Error(name + " must be an array");
    const byId = new Map();
    for (const row of rows) {
      if (!row || typeof row.id !== "string" || !row.id || byId.has(row.id))
        throw Error(name + " has invalid or duplicate ID");
      byId.set(row.id, row);
    }
    return byId;
  };
  const manifestById = map(manifest, "manifest");
  const currentById = map(results, "results");
  const baselineById = map(baseline.results, "baseline");
  const groupedFailures = new Map();
  for (const failure of legacy.failures) {
    const reasons = groupedFailures.get(failure.id) || [];
    reasons.push(failure.reason);
    groupedFailures.set(failure.id, reasons);
  }
  const reviewFirst = [];
  const unresolved = [];
  for (const [id, reasons] of groupedFailures) {
    const item = manifestById.get(id);
    const before = baselineById.get(id);
    const after = currentById.get(id);
    const accepted = Array.isArray(item?.acceptedTypes)
      ? item.acceptedTypes
      : [item?.expectedType];
    const previouslySpecific =
      item?.mode === "single" &&
      before?.prediction?.category === item.expectedCategory &&
      accepted.includes(before?.prediction?.type) &&
      before?.strong === true;
    const nowNeedsOwnerReview =
      !after?.error &&
      after?.prediction?.category === item?.expectedCategory &&
      after?.prediction?.type === "Unknown" &&
      after?.strong === false &&
      after?.categoryConfirmed === true;
    const onlyHistoricalStrongTypeExpectations =
      reasons.length === 2 &&
      reasons.includes("type_regression") &&
      reasons.includes("automatic_indexing_regression");
    if (previouslySpecific && nowNeedsOwnerReview && onlyHistoricalStrongTypeExpectations)
      reviewFirst.push({ id, legacyReasons: reasons.slice().sort() });
    else unresolved.push({ id, legacyReasons: reasons.slice().sort() });
  }
  const oldStrongCount = baseline.results.filter((row) => row.strong === true).length;
  const newStrongCount = results.filter((row) => row.strong === true).length;
  return {
    schema: LEGACY_TRIAGE_SCHEMA80,
    evaluated: manifestById.size,
    legacyPassed: legacy.passed,
    legacyFailureCount: legacy.failures.length,
    legacyFailures: legacy.failures,
    historicalStrongCount: oldStrongCount,
    currentStrongCount: newStrongCount,
    ownerReviewAbstentionCases: reviewFirst,
    unresolvedFailures: unresolved,
    // A diagnostic label, never a regression waiver or a substitute for independent truth.
    independentlyHumanLabeled: false,
    independentSubtypeAccuracy: null,
    optInSubtype80ModelAccuracy: null,
    permitsAutomaticIndexing: false,
    releaseAuthorized: false,
    familyAlphaHold: true,
    verdict: !legacy.passed
      ? "LEGACY_REGRESSION_FAIL_REQUIRES_REVIEW"
      : "LEGACY_REGRESSION_PASS_NOT_INDEPENDENT_ACCURACY",
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [manifestPath, resultsPath, baselinePath] = process.argv.slice(2);
  if (!baselinePath) {
    console.error("Usage: node scripts/p80-legacy-regression-triage.mjs MANIFEST RESULTS BASELINE");
    process.exitCode = 2;
  } else {
    const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
    const report = triageLegacyRegression80(
      read(manifestPath), read(resultsPath), read(baselinePath)
    );
    console.log(JSON.stringify(report, null, 2));
    // Intentional: diagnostic cannot turn a legacy FAIL into CI green.
    if (!report.legacyPassed) process.exitCode = 1;
  }
}
