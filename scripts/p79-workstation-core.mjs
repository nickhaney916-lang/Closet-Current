/** Research-only offline workstation. P75 remains custody/acceptance authority. */
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicKey, verify } from "node:crypto";
import {
  CATEGORIES,
  COLORS,
  canonical,
  sha256,
  verifiedSource,
  verifyOriginalBytes,
  verifyCuratorApproval,
  checkOverlap,
  validateLabel,
  independentAgreement,
  verifyHumanReceipt,
  priorExposures,
} from "./p75-dataset-core.mjs";
export { CATEGORIES, COLORS, canonical };
export const CHECKOUT = fileURLToPath(new URL("../", import.meta.url));
export const VERSION = "p79-v1";
export const DECLARATION =
  "I personally inspected this original photograph; I did not see AI predictions or another reviewer’s labels.";
export function validateDraft(d, session, source) {
  const errors = [];
  if (
    d?.workstationVersion !== VERSION ||
    d?.schema !== "p75-v1" ||
    d?.method !== "independent-human" ||
    d?.predictionsExposed !== false ||
    d?.signature
  )
    errors.push("Unsigned P79/P75 draft required");
  if (
    d?.reviewerId !== session.reviewerId ||
    d?.sessionId !== session.sessionId
  )
    errors.push("Wrong reviewer session");
  if (
    d?.sourceSha256 !== source.sha256 ||
    d?.sourceReceiptSha256 !== sha256(canonical(source))
  )
    errors.push("Original or source receipt changed");
  if (d?.coordinateSpace !== "exif-upright-normalized-v1")
    errors.push("Unsupported box coordinate space");
  if (d?.declaration !== DECLARATION || d?.personallyInspected !== true)
    errors.push("Manual personal inspection acknowledgment required");
  if (
    !Number.isFinite(Date.parse(d?.reviewedAt)) ||
    Date.parse(d.reviewedAt) > Date.now() + 60000 ||
    Date.now() - Date.parse(d.reviewedAt) > 86400000
  )
    errors.push("Stale review timestamp");
  errors.push(...strictLabel(d?.labels));
  return [...new Set(errors)];
}
export function strictLabel(l) {
  if (
    !l ||
    typeof l !== "object" ||
    Array.isArray(l) ||
    !Array.isArray(l.instances) ||
    l.instances.some(
      (i) => !i || typeof i !== "object" || !Array.isArray(i.box),
    )
  )
    return ["Labels need structured region objects and boxes"];
  const errors = validateLabel(l);
  const allowed = [
    "presence",
    "category",
    "subtype",
    "primaryColor",
    "secondaryColor",
    "multicolor",
    "colorCast",
    "instanceCount",
    "instances",
    "wardrobeUnit",
    "quality",
  ];
  if (Object.keys(l).some((k) => !allowed.includes(k)))
    errors.push("Unknown label fields");
  if (
    !l.quality ||
    typeof l.quality !== "object" ||
    Object.keys(l.quality).some(
      (k) => !["lighting", "focus", "framing", "background"].includes(k),
    )
  )
    errors.push("Unknown quality fields");
  for (const i of l.instances) {
    if (
      Object.keys(i).some(
        (k) =>
          ![
            "id",
            "box",
            "clipped",
            "occluded",
            "maskSha256",
            "observed",
          ].includes(k),
      )
    )
      errors.push("Unknown region fields");
    if (i.observed) {
      const o = i.observed;
      if (
        typeof o !== "object" ||
        Object.keys(o).length !== 4 ||
        !["category", "subtype", "primaryColor", "secondaryColor"].every((k) =>
          Object.hasOwn(o, k),
        ) ||
        !["Unknown", ...Object.keys(CATEGORIES)].includes(o.category) ||
        (o.subtype !== "Unknown" &&
          !CATEGORIES[o.category]?.includes(o.subtype)) ||
        !COLORS.includes(o.primaryColor) ||
        !COLORS.includes(o.secondaryColor)
      )
        errors.push("Invalid per-region vocabulary");
    }
  }
  if ((l.instances || []).some((i) => i.box?.[2] <= 0 || i.box?.[3] <= 0))
    errors.push("Boxes need positive width and height");
  if (
    new Set((l.instances || []).map((i) => i.id)).size !==
    (l.instances || []).length
  )
    errors.push("Duplicate region ID");
  if (
    l.presence === "nonclothing" &&
    (l.instanceCount !== 0 ||
      l.category !== "Unknown" ||
      l.subtype !== "Unknown" ||
      l.wardrobeUnit !== "unknown")
  )
    errors.push(
      "Nonclothing must have zero regions and Unknown category/subtype/unit",
    );
  if (
    ["single-garment", "multiple-garments", "whole-outfit"].includes(
      l.presence,
    ) &&
    l.instanceCount < 1
  )
    errors.push(
      "Clothing presence requires visible regions; otherwise defer as uncertain",
    );
  if (
    ["multiple-garments", "whole-outfit"].includes(l.presence) &&
    l.instanceCount < 2
  )
    errors.push("Multiple garments/outfit require at least two regions");
  if (l.wardrobeUnit === "single-unit" && l.instanceCount !== 1)
    errors.push(
      "Single unit requires one visible region; use matching-pair for footwear",
    );
  if (l.wardrobeUnit === "separate-items" && l.instanceCount < 2)
    errors.push("Separate items require at least two regions");
  if (l.primaryColor === "Multicolor" && !l.multicolor)
    errors.push("Multicolor primary requires multicolor flag");
  if (l.presence === "single-garment" && l.instanceCount !== 1)
    errors.push("Single garment requires one region");
  if (
    ["matching-pair", "multiple-pairs"].includes(l.wardrobeUnit) &&
    l.category !== "Shoes"
  )
    errors.push("Footwear pairing requires Shoes category");
  if (l.wardrobeUnit === "matching-pair" && l.instanceCount !== 2)
    errors.push("One matching pair requires exactly two regions");
  if (l.wardrobeUnit === "multiple-pairs" && l.instanceCount % 2)
    errors.push("Multiple pairs require an even region count");
  if ((l.instances || []).some((i) => i.maskSha256 != null))
    errors.push("Masks unsupported: do not claim undrawn pixel masks");
  return [...new Set(errors)];
}
export async function externalPath(path, checkout = CHECKOUT) {
  if (!isAbsolute(path || ""))
    throw Error("Explicit absolute outside-checkout path required");
  const p = await realpath(path),
    root = await realpath(checkout),
    r = relative(root, p);
  if (p === root || (!isAbsolute(r) && r.split(/[\\/]/)[0] !== ".."))
    throw Error("Private input must be outside checkout (including symlinks)");
  return p;
}
function verifySigned(payload, signature, key) {
  try {
    return verify(
      null,
      Buffer.from(canonical(payload)),
      createPublicKey(key),
      Buffer.from(signature || "", "base64"),
    );
  } catch {
    return false;
  }
}
export async function loadSession(
  bundle,
  { checkout = CHECKOUT, now = Date.now() } = {},
) {
  const { registry, approvedFingerprint, authorization } = bundle;
  if (
    !registry ||
    sha256(
      createPublicKey(registry.registrarPublicKey).export({
        type: "spki",
        format: "der",
      }),
    ) !== approvedFingerprint
  )
    throw Error("Externally pinned registrar mismatch");
  const { signature, ...auth } = authorization || {};
  if (
    !verifySigned(auth, signature, registry.registrarPublicKey) ||
    auth.schema !== VERSION ||
    !/^[-a-zA-Z0-9_]{8,80}$/.test(auth.sessionId || "") ||
    !/^[-a-zA-Z0-9_]{1,80}$/.test(auth.reviewerId || "") ||
    !Number.isFinite(Date.parse(auth.expiresAt)) ||
    Date.parse(auth.expiresAt) <= now ||
    Date.parse(auth.expiresAt) > now + 86400000
  )
    throw Error("Missing, invalid or expired registrar session authorization");
  const reviewer = registry.reviewers?.find(
    (r) => r.reviewerId === auth.reviewerId,
  );
  if (
    !reviewer ||
    reviewer.role !== "independent-human" ||
    reviewer.identityVerified !== true ||
    !verifySigned(
      {
        reviewerId: reviewer.reviewerId,
        publicKey: reviewer.publicKey,
        role: reviewer.role,
        identityVerified: true,
      },
      reviewer.registrarSignature,
      registry.registrarPublicKey,
    )
  )
    throw Error("Independent reviewer not registrar-attested");
  if (
    !Array.isArray(bundle.sources) ||
    bundle.sources.length < 1 ||
    bundle.sources.length > 60 ||
    !Array.isArray(bundle.exposed)
  )
    throw Error("Require 1–60 sources and explicit exposure ledger");
  if (auth.access === "blind") {
    const names = [
      "benchmark/locked-photo-sources.json",
      "benchmark/manifest-holdout-16.json",
      "benchmark/manifest-reviewed-32.json",
      "benchmark/manifest-fresh-11.json",
    ];
    const old = priorExposures(
      Object.fromEntries(
        await Promise.all(
          names.map(async (n) => [
            n,
            JSON.parse(await readFile(resolve(CHECKOUT, n), "utf8")),
          ]),
        ),
      ),
    );
    if (
      !auth.sealedAccessApproved ||
      !auth.exposureLedgerApproved ||
      auth.exposureLedgerDigest !== sha256(canonical(bundle.exposed)) ||
      old.some(
        (o) =>
          !o.sha256 ||
          !bundle.exposed.some(
            (e) =>
              e.sha256 === o.sha256 &&
              e.sourcePage === o.sourcePage &&
              /^[a-f0-9]{16}$/.test(e.dhash64 || ""),
          ),
      )
    )
      throw Error(
        "Blind requires registrar-bound complete historical original/perceptual ledger",
      );
  }
  const records = [],
    seen = new Set();
  for (const item of bundle.sources) {
    const s = item.source;
    if (
      verifiedSource(s, { now: new Date(now) }).length ||
      !verifyCuratorApproval(s, registry, approvedFingerprint)
    )
      throw Error("Unapproved/stale source, rights or grouping");
    if (!auth.sourceReceiptDigests?.includes(sha256(canonical(s))))
      throw Error("Source revision not authorized for session");
    if (
      !["development", "train", "blind"].includes(s.split) ||
      auth.access !== s.split
    )
      throw Error("Wrong session access");
    if (
      s.split === "blind" &&
      auth.exposureLedgerDigest !== sha256(canonical(bundle.exposed))
    )
      throw Error("Blind exposure ledger is not registrar-bound");
    if (
      s.split === "blind" &&
      (s.previouslyExposed !== false ||
        s.modelScored !== false ||
        s.labelsPublic !== false ||
        !s.sealedByIndependentHumanAudit ||
        !auth.sealedAccessApproved ||
        !auth.exposureLedgerApproved)
    )
      throw Error("Blind exposure/access not approved");
    if (s.split === "blind" && checkOverlap(s, bundle.exposed).length)
      throw Error("Blind historical exposure");
    if (
      seen.has(s.sha256) ||
      checkOverlap(
        s,
        records.map((r) => r.source),
      ).length
    )
      throw Error(
        "Duplicate/source-series/near-duplicate needs curator correction",
      );
    seen.add(s.sha256);
    const path = await externalPath(item.path, checkout),
      info = await stat(path);
    if (
      !info.isFile() ||
      info.size !== s.byteLength ||
      info.size > 12 * 1024 * 1024 ||
      s.width * s.height > 40000000
    )
      throw Error("Original size/pixel limit");
    const bytes = await readFile(path);
    if (!verifyOriginalBytes(s, bytes))
      throw Error("Original SHA/length/SHA1 mismatch");
    const mime = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : bytes[0] === 255 && bytes[1] === 216
        ? "image/jpeg"
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP"
          ? "image/webp"
          : null;
    if (mime !== s.mime) throw Error("Original MIME magic mismatch");
    records.push({ source: s, path });
  }
  return {
    session: {
      reviewerId: auth.reviewerId,
      sessionId: auth.sessionId,
      expiresAt: auth.expiresAt,
    },
    records,
  };
}
export function reviewHandoff(source, receipts, registry, fingerprint) {
  const result = independentAgreement(source, receipts, registry, fingerprint);
  const issues = [...result.issues];
  for (const r of receipts || [])
    issues.push(
      ...verifyHumanReceipt(source, r, registry, fingerprint),
      ...strictLabel(r.labels),
    );
  if (receipts?.length !== 2)
    issues.push("Exactly two independent signed receipts required");
  if (
    receipts?.length === 2 &&
    canonical(receipts[0].labels) !== canonical(receipts[1].labels)
  )
    issues.push(
      "Geometry, color cast, framing or other label disagreement: third-party adjudication required",
    );
  return {
    status: issues.length
      ? "DISPUTED / BLOCKED"
      : "READY FOR P75 CUSTODIAN AUDIT",
    issues: [...new Set(issues)],
    acceptedHumanLabels: 0,
  };
}
