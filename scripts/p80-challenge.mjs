/** Public source-integrity diagnostics ONLY. Never loads blind answers or labels. */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  verifiedSource,
  verifyOriginalBytes,
  checkOverlap,
  priorExposures,
  sourceSeriesHint,
} from "./p75-dataset-core.mjs";
const root = new URL("../", import.meta.url);
export async function challenge80({ recheck = 0, fetcher = fetch } = {}) {
  const pin = JSON.parse(
    await readFile(
      new URL(
        "research/parallel75/pinned-public-training-development-candidates.json",
        root,
      ),
      "utf8",
    ),
  );
  if (!Number.isInteger(recheck) || recheck < 0 || recheck > 3)
    throw Error("P80_BOUNDED_PUBLIC_RECHECK_REQUIRED");
  const oldNames = [
    "benchmark/locked-photo-sources.json",
    "benchmark/manifest-holdout-16.json",
    "benchmark/manifest-reviewed-32.json",
    "benchmark/manifest-fresh-11.json",
  ];
  const exposed = priorExposures(
    Object.fromEntries(
      await Promise.all(
        oldNames.map(async (n) => [
          n,
          JSON.parse(await readFile(new URL(n, root), "utf8")),
        ]),
      ),
    ),
  );
  const accepted = [];
  let duplicateFlags = 0,
    previousOverlap = 0,
    verified = 0,
    bytesTotal = 0;
  for (const s of pin.rows) {
    if (
      verifiedSource(s).length ||
      s.split !== "quarantine" ||
      s.garmentHumanVerified !== false ||
      s.labelsPublic !== false ||
      s.sourceGroupApproved !== false ||
      s.rightsReview !== "manual-review-required"
    )
      throw Error("P80_SOURCE_OR_TRUTH_CONTRACT_CHANGED");
    if (checkOverlap(s, accepted).length) {
      duplicateFlags++;
      continue;
    }
    accepted.push(s);
    if (checkOverlap(s, exposed).length) previousOverlap++;
  }
  for (const s of accepted.slice(0, recheck)) {
    const response = await fetcher(s.originalURL, {
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    if (
      !response.ok ||
      (response.headers.get("content-length") &&
        Number(response.headers.get("content-length")) > 12 * 1024 * 1024)
    )
      throw Error("P80_ORIGINAL_UNAVAILABLE");
    const chunks = [];
    let n = 0;
    for await (const part of response.body) {
      n += part.length;
      if (n > 12 * 1024 * 1024) throw Error("P80_ORIGINAL_LIMIT");
      chunks.push(Buffer.from(part));
    }
    const bytes = Buffer.concat(chunks);
    if (!verifyOriginalBytes(s, bytes))
      throw Error("P80_ORIGINAL_SHA_MISMATCH");
    const { default: sharp } = await import("sharp"),
      meta = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
    if (
      meta.width !== s.width ||
      meta.height !== s.height ||
      (meta.orientation || 1) !== s.orientation ||
      meta.format !==
        { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[
          s.mime
        ]
    )
      throw Error("P80_ORIGINAL_METADATA_MISMATCH");
    verified++;
    bytesTotal += bytes.length;
  }
  return {
    kind: "PUBLIC SOURCE INTEGRITY ONLY; NOT SUBTYPE ACCURACY",
    metadataReceipts: pin.rows.length,
    uniqueAfterMechanicalOverlapChecks: accepted.length,
    duplicateOrSeriesFlags: duplicateFlags,
    historicalOverlap: previousOverlap,
    liveOriginalsShaVerified: verified,
    bytesVerified: bytesTotal,
    rightsCuratorApprovals: 0,
    approvedHumanSubtypeLabels: 0,
    approvedMaskReceipts: 0,
    sealedBlind: 0,
    modelInferenceRuns: 0,
    top1Accuracy: null,
    candidateSetCoverage: null,
    confidentWrongRate: null,
    independentAccuracyAcceptance: "BLOCKED",
    accuracy: "UNKNOWN",
    whyBlocked:
      "P75 source-group/rights/independent human labels and correct-instance mask approvals unavailable",
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const recheck = process.argv[2] === "--recheck" ? Number(process.argv[3]) : 0;
  console.log(
    "P80_PUBLIC_SOURCE_AUDIT " + JSON.stringify(await challenge80({ recheck })),
  );
}
