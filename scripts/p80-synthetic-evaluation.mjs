/** SYNTHETIC programming behavior only, never photographic/human accuracy. */
import {
  localCandidates,
  clothingChoices,
  strongMatch,
} from "../public/local-catalog.mjs";
import { corroborateAmbiguousType } from "../public/recognition-confusion-guard.mjs";
import {
  VERSION,
  canonical,
  decide80,
  CONFUSIONS,
} from "../public/subtype-review-80.mjs";
export function scores80(category, type, other, top = 0.8, second = 0.1) {
  const a = localCandidates.find(
      (c) => c.category === category && c.itemType === type,
    ),
    b = localCandidates.find(
      (c) => c.category === category && c.itemType === other,
    );
  if (!a || !b || a === b) throw Error("Synthetic legal taxonomy required");
  const rest = (1 - top - second) / (localCandidates.length - 2);
  return localCandidates.map((c) => ({
    label: c.label,
    score: c === a ? top : c === b ? second : rest,
  }));
}
export function input80(
  category = "Bottoms",
  type = "Shorts",
  other = "Skirt",
) {
  const evidence = {
    schema: VERSION,
    ownerId: "SYNTHETIC-OWNER",
    sessionId: "SYNTHETIC-SESSION",
    itemId: "SYNTHETIC-ITEM",
    sourceSha256: "a".repeat(64),
    inputSha256: "b".repeat(64),
    revisionSha256: "c".repeat(64),
    maskDescriptorSha256: "d".repeat(64),
    maskSha256: null,
    unitId: "SYNTHETIC-UNIT",
    unitStatus: "single-photo-owner-reviewed",
    segmented: false,
  };
  const model = {
    name: "ff13/fashion-clip",
    revision: "e".repeat(40),
    vectorsSha256: "f".repeat(64),
    sourceCodeSha256: "9".repeat(64),
  };
  return {
    enabled: true,
    consent: true,
    categoryOwnerReviewed: true,
    category,
    evidence,
    current: structuredClone(evidence),
    model,
    receipt: {
      evidence: structuredClone(evidence),
      modelKey: canonical(model),
      createdAt: Date.now(),
    },
    views: {
      whole: scores80(category, type, other),
      confirmation: scores80(category, type, other),
    },
    quality: {
      detailVisible: true,
      minimumSide: 480,
      lowLight: false,
      clipped: false,
      occluded: false,
      overlapping: false,
      soft: false,
    },
  };
}
export async function evaluateSynthetic80() {
  const cases = [];
  for (const [category, type, other] of [
    ["Bottoms", "Shorts", "Skirt"],
    ["Dresses", "Shirt dress", "Casual dress"],
    ["Outerwear", "Jacket", "Coat"],
    ["Shoes", "Sneakers", "Ankle boots"],
    ["Tops", "T-shirt", "Blouse"],
    ["Bottoms", "Jeans", "Trousers"],
  ]) {
    for (const mode of [
      "clear",
      "tie",
      "low-light",
      "clipped",
      "wrong-source",
      "no-consent",
    ]) {
      const x = input80(category, type, other);
      if (mode === "tie")
        x.views = {
          whole: scores80(category, type, other, 0.49, 0.48),
          confirmation: scores80(category, type, other, 0.49, 0.48),
        };
      if (mode === "low-light") x.quality.lowLight = true;
      if (mode === "clipped") x.quality.clipped = true;
      if (mode === "wrong-source") x.current.inputSha256 = "0".repeat(64);
      if (mode === "no-consent") x.consent = false;
      const choices = clothingChoices(x.views.whole),
        old = await corroborateAmbiguousType({
          strong: strongMatch(choices),
          choices,
          details: {},
        }),
        next = decide80(x);
      cases.push({
        category,
        mode,
        baselineStrongSpecific:
          old.strong && old.choices[0]?.itemType !== "Unknown",
        newStatus: next.status,
        newSpecificCertificate: next.itemType !== "Unknown",
        hypotheses: next.alternatives.length,
        reasons: next.reasons,
      });
    }
  }
  return {
    kind: "SYNTHETIC ONLY: frozen score fixtures, no inference or human accuracy",
    cases: cases.length,
    families: Object.keys(CONFUSIONS).length,
    baselineStrongSpecificSuggestions: cases.filter(
      (c) => c.baselineStrongSpecific,
    ).length,
    newAutomaticSpecificCertificates: cases.filter(
      (c) => c.newSpecificCertificate,
    ).length,
    hypothesisSets: cases.filter((c) => c.hypotheses).length,
    hypothesisCoverage: cases.filter((c) => c.hypotheses).length / cases.length,
    policyAbstentions: cases.filter((c) => c.newStatus === "abstain").length,
    ownerReviewRequired: cases.length,
    verifiedHumanLabels: 0,
    accuracy: null,
    confidentWrongRate: null,
    top1Accuracy: null,
    candidateSetAccuracy: null,
    rows: cases,
  };
}
if (process.argv[1]?.endsWith("p80-synthetic-evaluation.mjs")) {
  const r = await evaluateSynthetic80();
  const { rows, ...summary } = r;
  console.log("P80_SYNTHETIC_POLICY_COMPARISON " + JSON.stringify(summary));
}
