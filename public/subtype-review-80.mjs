/** OFF-by-default research. Hypotheses never certify, save, learn or pair items. */
import { localCandidates } from "./local-catalog.mjs";
export const VERSION = "subtype80-v1";
export const POLICY = Object.freeze({
  maxCandidates: 3,
  maxRows: 100,
  maxAgeMs: 60000,
  margin: 0.15,
  minimum: 0.35,
});
export const CONFUSIONS = Object.freeze({
  bottoms: ["Bottoms:Shorts", "Bottoms:Skirt"],
  length: [
    "Dresses:Casual dress",
    "Dresses:Shirt dress",
    "Dresses:Sweater dress",
    "Bottoms:Skirt",
    "Tops:Tunic",
    "Tops:Button-down shirt",
  ],
  layers: [
    "Outerwear:Jacket",
    "Outerwear:Coat",
    "Outerwear:Cardigan",
    "Outerwear:Blazer",
    "Tops:Hoodie",
    "Tops:Sweatshirt",
  ],
  footwear: [
    "Shoes:Sneakers",
    "Shoes:Ankle boots",
    "Shoes:Tall boots",
    "Shoes:Sandals",
    "Shoes:Flats",
  ],
  tops: [
    "Tops:T-shirt",
    "Tops:Blouse",
    "Tops:Button-down shirt",
    "Tops:Sweater",
  ],
  trousers: ["Bottoms:Jeans", "Bottoms:Trousers", "Bottoms:Leggings"],
});
export const SHA = /^[a-f0-9]{64}$/;
export function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
export async function hash80(value) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export function jpeg80(value) {
  if (
    typeof value !== "string" ||
    value.length > 12000000 ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    throw Error("P80_JPEG_REQUIRED");
  const binary = atob(value.split(",")[1]);
  if (
    binary.length < 4 ||
    binary.length > 8 * 1024 * 1024 ||
    binary.charCodeAt(0) !== 255 ||
    binary.charCodeAt(1) !== 216
  )
    throw Error("P80_JPEG_REQUIRED");
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
const source = (item) =>
  item.originalPhoto?.image || item.recognitionPhoto?.image || item.image;
const recognition = (item) => item.recognitionPhoto?.image || item.image;
export function revision80(item) {
  return canonical({
    id: item.id,
    image: item.image,
    recognitionPhoto: item.recognitionPhoto || null,
    originalPhoto: item.originalPhoto || null,
    segmentHint: item.segmentHint || null,
    cropBounds: item.cropBounds || null,
    outfitSourceId: item.outfitSourceId || null,
    reconciliation70: item.reconciliation70 || null,
    reconciliation70Status: item.reconciliation70Status || null,
    shoePair: item.shoePair || null,
    combinedFragments70: item.combinedFragments70 || null,
    ownerId: item.ownerId || null,
  });
}
export async function evidence80(item, { ownerId, sessionId, live } = {}) {
  if (
    !ownerId ||
    !sessionId ||
    typeof live !== "function" ||
    !live() ||
    !item?.id ||
    (item.ownerId && item.ownerId !== ownerId)
  )
    throw Error("P80_OWNER_SCOPE_REQUIRED");
  const before = revision80(item),
    bytes = jpeg80(source(item)),
    input = jpeg80(recognition(item));
  const [sourceSha256, inputSha256, revisionSha256, maskDescriptorSha256] =
    await Promise.all([
      hash80(bytes),
      hash80(input),
      hash80(before),
      hash80(
        canonical({
          hint: item.segmentHint || null,
          bounds: item.cropBounds || null,
          unit: item.reconciliation70 || null,
        }),
      ),
    ]);
  if (!live() || revision80(item) !== before) throw Error("P80_STALE_SOURCE");
  const unit = item.reconciliation70,
    companion = item.shoePair?.companion || item.combinedFragments70?.companion;
  const segmented = Boolean(item.outfitSourceId || unit || item.segmentHint);
  if (
    segmented &&
    (!unit ||
      unit.ownerId !== ownerId ||
      unit.sourceSha256 !== sourceSha256 ||
      !SHA.test(unit.maskSha256 || "") ||
      ![
        "paired_confirmed",
        "separate_confirmed",
        "fragments_confirmed",
      ].includes(item.reconciliation70Status))
  )
    throw Error("P80_MASK_OR_PHYSICAL_UNIT_UNCONFIRMED");
  if (
    item.reconciliation70Status === "paired_confirmed" &&
    !item.shoePair?.confirmedByOwner
  )
    throw Error("P80_PAIR_OWNER_CONFIRMATION_REQUIRED");
  if (
    item.reconciliation70Status === "fragments_confirmed" &&
    !item.combinedFragments70?.confirmedByOwner
  )
    throw Error("P80_FRAGMENT_OWNER_CONFIRMATION_REQUIRED");
  if (
    ["paired_confirmed", "fragments_confirmed"].includes(
      item.reconciliation70Status,
    ) &&
    (!companion ||
      companion.reconciliation70?.ownerId !== ownerId ||
      companion.reconciliation70?.sourceSha256 !== sourceSha256 ||
      !SHA.test(companion.reconciliation70?.maskSha256 || "") ||
      companion.reconciliation70.maskSha256 === unit.maskSha256)
  )
    throw Error("P80_COMPANION_SOURCE_REQUIRED");
  if (item.segmentHint?.clipped) throw Error("P80_CLIPPED_MASK");
  return Object.freeze({
    schema: VERSION,
    ownerId,
    sessionId,
    itemId: item.id,
    sourceSha256,
    inputSha256,
    revisionSha256,
    maskDescriptorSha256,
    maskSha256: unit?.maskSha256 || null,
    unitId: item.id,
    unitStatus: item.reconciliation70Status || "single-photo-owner-reviewed",
    segmented,
  });
}
const EVIDENCE_KEYS80 = Object.freeze([
  "schema",
  "ownerId",
  "sessionId",
  "itemId",
  "sourceSha256",
  "inputSha256",
  "revisionSha256",
  "maskDescriptorSha256",
  "maskSha256",
  "unitId",
  "unitStatus",
  "segmented",
]);
export function validEvidence80(e) {
  if (
    !e ||
    typeof e !== "object" ||
    Array.isArray(e) ||
    Object.keys(e).length !== EVIDENCE_KEYS80.length ||
    !EVIDENCE_KEYS80.every(
      (k) =>
        Object.hasOwn(e, k) &&
        Object.hasOwn(Object.getOwnPropertyDescriptor(e, k), "value"),
    ) ||
    e.schema !== VERSION
  )
    return false;
  if (
    ["ownerId", "sessionId", "itemId", "unitId"].some(
      (k) => typeof e[k] !== "string" || e[k].length > 128 || !e[k].trim(),
    )
  )
    return false;
  if (
    [
      "sourceSha256",
      "inputSha256",
      "revisionSha256",
      "maskDescriptorSha256",
    ].some((k) => typeof e[k] !== "string" || !SHA.test(e[k])) ||
    typeof e.segmented !== "boolean"
  )
    return false;
  return e.segmented
    ? typeof e.maskSha256 === "string" &&
        SHA.test(e.maskSha256) &&
        [
          "paired_confirmed",
          "separate_confirmed",
          "fragments_confirmed",
        ].includes(e.unitStatus)
    : e.maskSha256 === null && e.unitStatus === "single-photo-owner-reviewed";
}
export async function validateSubtypeRequest80(request) {
  const c = request?.subtype80;
  if (
    c?.schema !== VERSION ||
    c.enabled !== true ||
    c.consent !== true ||
    c.categoryOwnerReviewed !== true ||
    !validEvidence80(c.evidence)
  )
    throw Error("P80_OPT_IN_SOURCE_REQUIRED");
  const evidence = Object.freeze({ ...c.evidence });
  if ((await hash80(jpeg80(request.image))) !== evidence.inputSha256)
    throw Error("P80_OPT_IN_SOURCE_REQUIRED");
  return evidence;
}
export function photoDetailIssue80(quality) {
  return !quality ||
    quality.detailVisible !== true ||
    quality.clipped ||
    quality.occluded ||
    quality.overlapping ||
    quality.lowLight ||
    quality.soft ||
    quality.minimumSide < 224 ||
    !Number.isFinite(quality.minimumSide)
    ? "insufficient-visible-photo-detail"
    : null;
}
export function binding80(a, b) {
  return !!a && !!b && canonical(a) === canonical(b);
}
function rankedRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > POLICY.maxRows)
    throw Error("P80_BOUNDED_FULL_VOCABULARY_REQUIRED");
  const seen = new Set();
  return rows
    .map((r) => {
      const known = localCandidates.find((x) => x.label === r.label);
      if (
        !known ||
        seen.has(r.label) ||
        !Number.isFinite(r.score) ||
        r.score < 0 ||
        r.score > 1
      )
        throw Error("P80_INVALID_MODEL_SCORE");
      seen.add(r.label);
      return { ...known, score: r.score };
    })
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}
// An approval is an in-memory, single-session capability, not a portable record.
const issued80 = new WeakMap();
function freeze80(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze80(child);
    Object.freeze(value);
  }
  return value;
}
function issue80(result) {
  const frozen = freeze80(structuredClone(result));
  issued80.set(frozen, {
    evidence: frozen.evidence,
    createdAt: frozen.receiptCreatedAt,
    types: Object.freeze([
      "Unknown",
      ...frozen.alternatives.map((c) => c.itemType),
    ]),
  });
  return frozen;
}
export function decide80({
  enabled = false,
  consent = false,
  categoryOwnerReviewed = false,
  category,
  evidence,
  current,
  model,
  receipt,
  views,
  quality,
  now = Date.now(),
} = {}) {
  const result = {
    schema: VERSION,
    status: "abstain",
    itemType: "Unknown",
    requiresOwnerConfirmation: true,
    automaticallyCertified: false,
    scoreMeaning: "uncalibrated vocabulary-relative softmax; not probability",
    alternatives: [],
    reasons: [],
    accuracy: "UNKNOWN",
  };
  const block = (reason) => ({ ...result, reasons: [reason] });
  if (!enabled) return block("research-off");
  if (!consent || !categoryOwnerReviewed)
    return block("explicit-owner-consent-required");
  if (
    !validEvidence80(evidence) ||
    !validEvidence80(current) ||
    !binding80(evidence, current)
  )
    return block("source-mask-owner-unit-revision-mismatch");
  if (
    !model ||
    model.name !== "ff13/fashion-clip" ||
    !/^[a-f0-9]{40}$/.test(model.revision || "") ||
    !SHA.test(model.vectorsSha256 || "") ||
    !SHA.test(model.sourceCodeSha256 || "") ||
    !receipt ||
    !binding80(receipt.evidence, evidence) ||
    receipt.modelKey !== canonical(model) ||
    !Number.isFinite(receipt.createdAt) ||
    now - receipt.createdAt < 0 ||
    now - receipt.createdAt > POLICY.maxAgeMs
  )
    return block("stale-or-unverified-model-receipt");
  if (
    !localCandidates.some(
      (c) => c.category === category && category !== "Uncategorized",
    )
  )
    return block("category-unknown");
  const detailIssue = photoDetailIssue80(quality);
  if (detailIssue) return block(detailIssue);
  let a, b;
  try {
    a = rankedRows(views?.whole);
    b = rankedRows(views?.confirmation);
  } catch {
    return block("missing-invalid-or-out-of-vocabulary-scores");
  }
  // Scores must use the same COMPLETE frozen vocabulary, including negatives.
  const labels = localCandidates
    .map((c) => c.label)
    .sort()
    .join("\n");
  if (
    [a, b].some(
      (v) =>
        v
          .map((c) => c.label)
          .sort()
          .join("\n") !== labels ||
        Math.abs(v.reduce((n, c) => n + c.score, 0) - 1) > 0.0001,
    )
  )
    return block("incomplete-or-renormalized-vocabulary");
  const candidates = a
    .filter((c) => c.category === category)
    .map((c) => {
      const other = b.find((x) => x.label === c.label);
      return {
        itemType: c.itemType,
        category,
        relativeScore: Math.min(c.score, other.score),
      };
    })
    .sort(
      (x, y) =>
        y.relativeScore - x.relativeScore ||
        x.itemType.localeCompare(y.itemType),
    );
  const first = candidates[0];
  if (!first || first.relativeScore <= 0) return block("no-compatible-support");
  const crossCategory =
    a[0].category !== category || b[0].category !== category;
  const disagree = a[0].itemType !== b[0].itemType;
  if (crossCategory) return block("broad-category-or-background-conflict");
  result.alternatives = candidates
    .filter((c) => c.relativeScore >= Math.max(0.02, first.relativeScore * 0.1))
    .slice(0, POLICY.maxCandidates)
    .map((c, i) => ({ ...c, rank: i + 1 }));
  result.evidence = { ...evidence };
  result.model = { ...model };
  result.receiptCreatedAt = receipt.createdAt;
  if (crossCategory)
    result.reasons.push("broad-category-or-background-conflict");
  if (disagree) result.reasons.push("same-model-framing-disagreement");
  if (
    a[0].score - (a[1]?.score || 0) < POLICY.margin ||
    b[0].score - (b[1]?.score || 0) < POLICY.margin
  )
    result.reasons.push("close-score-in-either-framing");
  if (
    first.relativeScore < POLICY.minimum ||
    first.relativeScore - (candidates[1]?.relativeScore || 0) < POLICY.margin
  )
    result.reasons.push("weak-or-close-relative-scores");
  if (!result.reasons.length) {
    result.status = "hypotheses";
    result.reasons.push(
      "owner-must-resolve-subtype; same-model-agreement-is-not-independent-proof",
    );
  }
  return issue80(result);
}
export function createReview80({
  live,
  evidence,
  decision,
  now = () => Date.now(),
} = {}) {
  const lease = issued80.get(decision);
  if (!lease || !binding80(lease.evidence, evidence))
    throw Error("P80_UNISSUED_REVIEW");
  let active = true,
    used = false;
  return {
    close() {
      active = false;
      lease.revoked = true;
    },
    async choose(itemType, { acknowledged = false } = {}) {
      if (
        !active ||
        used ||
        lease.used ||
        lease.revoked ||
        !acknowledged ||
        !lease.types.includes(itemType)
      )
        throw Error("P80_REVIEW_REQUIRED");
      const current = await live();
      const at = now();
      if (
        !active ||
        used ||
        lease.used ||
        lease.revoked ||
        !binding80(lease.evidence, current) ||
        !Number.isFinite(at) ||
        at < lease.createdAt ||
        at - lease.createdAt > POLICY.maxAgeMs
      )
        throw Error("P80_REVOKED");
      used = true;
      lease.used = true;
      active = false;
      return Object.freeze({
        itemType,
        requiresOwnerSave: true,
        ownerConfirmed: true,
        independentHumanGroundTruth: false,
        learningConsent: false,
        evidence: lease.evidence,
      });
    },
  };
}
