/** SYNTHETIC ONLY. Ephemeral keys are test doubles, never genuine human identities. */
import {
  generateKeyPairSync,
  sign,
  createPublicKey,
  createHash,
} from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
function syntheticPNG(raw) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]),
      out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length);
    body.copy(out, 4);
    let crc = 0xffffffff;
    for (const value of body) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(160, 0);
  header.writeUInt32BE(120, 4);
  header[8] = 8;
  header[9] = 2;
  const rows = Buffer.alloc(120 * (1 + 160 * 3));
  for (let y = 0; y < 120; y++)
    raw.copy(rows, y * 481 + 1, y * 480, (y + 1) * 480);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
import { canonical, sha256 } from "./p75-dataset-core.mjs";
export async function fixture(
  count = 1,
  { orientation = 1, format = "png" } = {},
) {
  const dir = await mkdtemp(join(tmpdir(), "p79-synthetic-"));
  const registrar = generateKeyPairSync("ed25519"),
    raters = [generateKeyPairSync("ed25519"), generateKeyPairSync("ed25519")];
  const pub = (k) => k.export({ type: "spki", format: "pem" }).toString(),
    signature = (p, k = registrar.privateKey) =>
      sign(null, Buffer.from(canonical(p)), k).toString("base64");
  const registry = {
    registrarPublicKey: pub(registrar.publicKey),
    reviewers: raters.map((k, i) => {
      const p = {
        reviewerId: "SYNTHETIC-" + i,
        publicKey: pub(k.publicKey),
        role: "independent-human",
        identityVerified: true,
      };
      return { ...p, registrarSignature: signature(p) };
    }),
  };
  const sources = [];
  for (let n = 0; n < count; n++) {
    const raw = Buffer.alloc(160 * 120 * 3);
    let seed = 12345 + n;
    for (let i = 0; i < raw.length; i++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      raw[i] = seed & 255;
    }
    let bytes;
    if (format === "png" && orientation === 1) bytes = syntheticPNG(raw);
    else {
      const { default: sharp } = await import("sharp");
      let image = sharp(raw, { raw: { width: 160, height: 120, channels: 3 } });
      image =
        format === "jpeg"
          ? image.jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
          : format === "webp"
            ? image.webp({ lossless: true })
            : image.png();
      if (orientation !== 1) image = image.withMetadata({ orientation });
      bytes = await image.toBuffer();
    }
    const path = join(dir, "synthetic-" + n + "." + format);
    await writeFile(path, bytes);
    const source = {
      schema: "p75-v1",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:Synthetic_" + n + ".png",
      originalURL:
        "https://upload.wikimedia.org/wikipedia/commons/a/ab/Synthetic_" +
        n +
        ".png",
      license: "CC0",
      licenseURL: "https://creativecommons.org/publicdomain/zero/1.0/",
      artist: "SYNTHETIC ONLY",
      title: "SYNTHETIC ONLY",
      sha256: sha256(bytes),
      commonsSha1: createHash("sha1").update(bytes).digest("hex"),
      byteLength: bytes.length,
      width: 160,
      height: 120,
      orientation,
      mime: "image/" + format,
      acquiredAt: new Date().toISOString(),
      verification: "bytes-verified",
      photoContent: "human-reviewed",
      rightsReview: "curator-approved",
      sourceGroupApproved: true,
      garmentHumanVerified: true,
      dhash64: createHash("sha256")
        .update("synthetic-dhash-" + n)
        .digest("hex")
        .slice(0, 16),
      sourceGroupId: "synthetic-group-" + n,
      legalEvidenceSha256: sha256("SYNTHETIC legal placeholder"),
      consentStatus: "product-only-license-vetted",
      curatorReviewedAt: new Date().toISOString(),
      split: "development",
    };
    const payload = {
      sha256: source.sha256,
      sourceGroupId: source.sourceGroupId,
      rightsReview: source.rightsReview,
      photoContent: source.photoContent,
      garmentHumanVerified: true,
      sourceGroupApproved: true,
      legalEvidenceSha256: source.legalEvidenceSha256,
      consentStatus: source.consentStatus,
      curatorReviewedAt: source.curatorReviewedAt,
    };
    source.curatorApprovalSignature = signature(payload);
    sources.push({ source, path });
  }
  const auth = {
    schema: "p79-v1",
    sessionId: "SYNTHETIC-session-0001",
    reviewerId: "SYNTHETIC-0",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    access: "development",
    sourceReceiptDigests: sources.map((r) => sha256(canonical(r.source))),
  };
  const bundle = {
    registry,
    approvedFingerprint: sha256(
      createPublicKey(registry.registrarPublicKey).export({
        type: "spki",
        format: "der",
      }),
    ),
    authorization: { ...auth, signature: signature(auth) },
    sources,
    exposed: [],
  };
  const label = {
    presence: "uncertain",
    category: "Unknown",
    subtype: "Unknown",
    primaryColor: "Unknown",
    secondaryColor: "Unknown",
    multicolor: false,
    colorCast: false,
    instanceCount: 0,
    instances: [],
    wardrobeUnit: "unknown",
    quality: {
      lighting: "unknown",
      focus: "unknown",
      framing: "unknown",
      background: "unknown",
    },
  };
  function receipt(i = 0, labels = label) {
    const draft = {
      schema: "p75-v1",
      method: "independent-human",
      predictionsExposed: false,
      reviewerId: "SYNTHETIC-" + i,
      sourceSha256: sources[0].source.sha256,
      reviewedAt: new Date().toISOString(),
      labels,
    };
    return { ...draft, signature: signature(draft, raters[i].privateKey) };
  }
  return {
    dir,
    bundle,
    label,
    signature,
    receipt,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}
