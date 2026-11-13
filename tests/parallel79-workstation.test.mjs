import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { fixture } from "../scripts/p79-synthetic-fixtures.mjs";
import {
  loadSession,
  externalPath,
  strictLabel,
  validateDraft,
  DECLARATION,
  canonical,
  reviewHandoff,
} from "../scripts/p79-workstation-core.mjs";
import { sha256 } from "../scripts/p75-dataset-core.mjs";
import { createWorkstation } from "../scripts/p79-workstation.mjs";
test("synthetic 1/10/25/60 session loads exact originals and distinct rows", async () => {
  for (const n of [1, 10, 25, 60]) {
    const f = await fixture(n);
    try {
      const { records } = await loadSession(f.bundle);
      assert.equal(records.length, n);
    } finally {
      await f.cleanup();
    }
  }
});
test("signed source revision, identity, expired access, mismatched bytes, MIME and duplicate fail closed", async () => {
  const f = await fixture();
  try {
    const mutate = async (fn) => {
      const b = structuredClone(f.bundle);
      fn(b);
      await assert.rejects(loadSession(b));
    };
    await mutate(
      (b) => (b.sources[0].source.rightsReview = "manual-review-required"),
    );
    await mutate((b) => (b.sources[0].source.width = 200));
    await mutate((b) => (b.authorization.reviewerId = "OTHER"));
    await mutate((b) => (b.authorization.expiresAt = "2000-01-01"));
    await mutate((b) => (b.approvedFingerprint = "0".repeat(64)));
    await mutate((b) => b.sources.push(b.sources[0]));
    await mutate((b) => (b.sources[0].source.split = "blind"));
    await mutate((b) => (b.sources[0].source.byteLength = 99999999));
    await mutate((b) => (b.sources[0].source.acquiredAt = "2000-01-01"));
    await mutate((b) => (b.registry.reviewers[0].identityVerified = false));
    await mutate((b) => (b.exposed = undefined));
    await writeFile(f.bundle.sources[0].path, "corrupt");
    await assert.rejects(loadSession(f.bundle));
  } finally {
    await f.cleanup();
  }
});
test("external file gate rejects repo and symlink into repo", async () => {
  const f = await fixture();
  try {
    await assert.rejects(externalPath(join(process.cwd(), "README.md")));
    await symlink(join(process.cwd(), "README.md"), join(f.dir, "link"));
    await assert.rejects(externalPath(join(f.dir, "link")));
    await assert.rejects(externalPath("relative"));
  } finally {
    await f.cleanup();
  }
});
test("strict boxes, footwear, masks, nonclothing and duplicate region validation", async () => {
  const f = await fixture();
  try {
    const box = {
        id: "region",
        box: [0.1, 0.2, 0.3, 0.4],
        clipped: false,
        occluded: true,
        maskSha256: null,
      },
      l = {
        ...f.label,
        presence: "single-garment",
        instanceCount: 1,
        instances: [box],
      };
    assert.deepEqual(strictLabel(l), []);
    for (const b of [
      [0, 0, 0, 0.3],
      [0.8, 0, 0.4, 0.4],
      [NaN, 0, 0.2, 0.3],
      [-0.1, 0, 0.2, 0.3],
    ])
      assert.ok(strictLabel({ ...l, instances: [{ ...box, box: b }] }).length);
    assert.ok(strictLabel({ ...l, wardrobeUnit: "matching-pair" }).length);
    assert.ok(strictLabel({ ...l, presence: "nonclothing" }).length);
    assert.ok(
      strictLabel({ ...l, instances: [{ ...box, maskSha256: "1".repeat(64) }] })
        .length,
    );
    assert.ok(
      strictLabel({ ...l, instanceCount: 2, instances: [box, box] }).length,
    );
  } finally {
    await f.cleanup();
  }
});
test("P75-compatible draft binds source revision session and manual acknowledgment", async () => {
  const f = await fixture();
  try {
    const s = f.bundle.sources[0].source,
      session = f.bundle.authorization,
      d = {
        schema: "p75-v1",
        coordinateSpace: "exif-upright-normalized-v1",
        workstationVersion: "p79-v1",
        method: "independent-human",
        predictionsExposed: false,
        reviewerId: session.reviewerId,
        sessionId: session.sessionId,
        sourceSha256: s.sha256,
        sourceReceiptSha256: sha256(canonical(s)),
        reviewedAt: new Date().toISOString(),
        declaration: DECLARATION,
        personallyInspected: true,
        labels: f.label,
      };
    assert.deepEqual(validateDraft(d, session, s), []);
    for (const patch of [
      { reviewerId: "B" },
      { sessionId: "OTHER" },
      { personallyInspected: false },
      { signature: "x" },
      { reviewedAt: "2000-01-01" },
      { sourceReceiptSha256: "0".repeat(64) },
    ])
      assert.ok(validateDraft({ ...d, ...patch }, session, s).length);
  } finally {
    await f.cleanup();
  }
});
test("signed receipt handoff blocks same rater, wrong key, any geometry/color disagreement", async () => {
  const f = await fixture();
  try {
    const run = (receipts) =>
      reviewHandoff(
        f.bundle.sources[0].source,
        receipts,
        f.bundle.registry,
        f.bundle.approvedFingerprint,
      );
    assert.equal(
      run([f.receipt(0), f.receipt(1)]).status,
      "READY FOR P75 CUSTODIAN AUDIT",
    );
    assert.match(run([f.receipt(0), f.receipt(0)]).status, /BLOCKED/);
    assert.match(
      run([{ ...f.receipt(0), signature: "bad" }, f.receipt(1)]).status,
      /BLOCKED/,
    );
    assert.match(
      run([f.receipt(0), f.receipt(1, { ...f.label, colorCast: true })]).status,
      /BLOCKED/,
    );
    assert.equal(run([f.receipt(0), f.receipt(1)]).acceptedHumanLabels, 0);
  } finally {
    await f.cleanup();
  }
});
test("loopback immutable original read no public paths no writes or cross-site access", async () => {
  const f = await fixture();
  const { server, url } = await createWorkstation(f.bundle);
  try {
    const r = await fetch(url);
    assert.equal(r.status, 200);
    assert.match(
      r.headers.get("content-security-policy"),
      /form-action 'none'/,
    );
    const s = await (await fetch(url + "session")).text();
    for (const forbidden of [
      "Synthetic_",
      "sourcePage",
      "originalURL",
      "development",
      "publicKey",
      "instances",
    ])
      assert.ok(!s.includes(forbidden), forbidden);
    assert.equal(
      (await fetch(url + "session", { method: "POST", body: "x" })).status,
      403,
    );
    assert.equal(
      (
        await fetch(url + "session", {
          headers: { Origin: "https://evil.example" },
        })
      ).status,
      403,
    );
    assert.equal((await fetch(new URL("/README.md", url))).status, 404);
    assert.equal((await fetch(url + "original/0")).status, 200);
    await writeFile(f.bundle.sources[0].path, "changed");
    assert.equal((await fetch(url + "original/0")).status, 409);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await f.cleanup();
  }
});
test("malformed drafts fail with actionable errors rather than throwing", async () => {
  for (const value of [
    null,
    7,
    [],
    {},
    { instances: {} },
    { instances: [null] },
    { instances: [{ box: "bad" }] },
  ])
    assert.ok(strictLabel(value).length);
});
test("signed authorization still rejects blind without complete historical hash coverage", async () => {
  const f = await fixture();
  try {
    const b = structuredClone(f.bundle);
    b.sources[0].source.split = "blind";
    Object.assign(b.sources[0].source, {
      previouslyExposed: false,
      modelScored: false,
      labelsPublic: false,
      sealedByIndependentHumanAudit: true,
    });
    const { signature, ...auth } = b.authorization;
    Object.assign(auth, {
      access: "blind",
      sealedAccessApproved: true,
      exposureLedgerApproved: true,
      exposureLedgerDigest: sha256(canonical(b.exposed)),
      sourceReceiptDigests: b.sources.map((r) => sha256(canonical(r.source))),
    });
    b.authorization = { ...auth, signature: f.signature(auth) };
    await assert.rejects(loadSession(b), /historical/);
  } finally {
    await f.cleanup();
  }
});
test("re-signed session cannot authorize same-series or near-duplicate source rows", async () => {
  const f = await fixture(2);
  try {
    const b = structuredClone(f.bundle);
    b.sources.forEach((r) => (r.source.seriesKey = "same-series"));
    const { signature, ...auth } = b.authorization;
    auth.sourceReceiptDigests = b.sources.map((r) =>
      sha256(canonical(r.source)),
    );
    b.authorization = { ...auth, signature: f.signature(auth) };
    await assert.rejects(loadSession(b), /Duplicate/);
  } finally {
    await f.cleanup();
  }
});

test("display copies strip orientation metadata for JPEG PNG WebP without changing original", async (t) => {
  const { stripOrientationMetadata, orientationTransform } = await import(
    "../research/parallel79/workstation/display.mjs"
  );
  const decoder = await import("sharp").catch((error) => {
    if (process.env.P79_REQUIRE_DECODER) throw error;
    return null;
  });
  if (!decoder) {
    t.skip(
      "Optional cross-format decoder absent in legacy dependency-free runner; dedicated P79 CI requires and runs this check",
    );
    return;
  }
  const { default: sharp } = decoder;
  for (const format of ["png", "jpeg", "webp"])
    for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const f = await fixture(1, { format, orientation });
      try {
        const bytes = await readFile(f.bundle.sources[0].path),
          before = sha256(bytes),
          stripped = stripOrientationMetadata(bytes, "image/" + format),
          meta = await sharp(stripped).metadata();
        assert.equal(meta.orientation, undefined);
        assert.equal(meta.width, 160);
        assert.equal(meta.height, 120);
        assert.equal(sha256(bytes), before);
        assert.equal(sha256(await readFile(f.bundle.sources[0].path)), before);
        const [a, b, c, d, e, g] = orientationTransform(orientation, 160, 120),
          corners = [
            [0, 0],
            [160, 0],
            [0, 120],
            [160, 120],
          ].map(([x, y]) => [a * x + c * y + e, b * x + d * y + g]);
        assert.equal(Math.min(...corners.map((p) => p[0])), 0);
        assert.equal(Math.min(...corners.map((p) => p[1])), 0);
        assert.equal(
          Math.max(...corners.map((p) => p[0])),
          orientation >= 5 ? 120 : 160,
        );
        assert.equal(
          Math.max(...corners.map((p) => p[1])),
          orientation >= 5 ? 160 : 120,
        );
      } finally {
        await f.cleanup();
      }
    }
  for (const mime of ["image/png", "image/jpeg", "image/webp"])
    assert.throws(() => stripOrientationMetadata(new Uint8Array(10), mime));
});
