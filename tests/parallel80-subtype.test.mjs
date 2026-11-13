import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { localCandidates } from "../public/local-catalog.mjs";
import {
  input80,
  scores80,
  evaluateSynthetic80,
} from "../scripts/p80-synthetic-evaluation.mjs";
import {
  VERSION,
  CONFUSIONS,
  decide80,
  binding80,
  createReview80,
  evidence80,
  hash80,
  jpeg80,
  revision80,
} from "../public/subtype-review-80.mjs";
import { subtypeModel80 } from "../public/subtype-worker-80.mjs";
import { challenge80 } from "../scripts/p80-challenge.mjs";
test("every confusion family and candidate stays in unchanged app taxonomy; skort/Boots unsupported", async () => {
  const c = vm.createContext({});
  vm.runInContext(
    (await readFile("public/taxonomy.js", "utf8")) +
      ";globalThis.types=clothingSchema.types;",
    c,
  );
  for (const group of Object.values(CONFUSIONS))
    for (const key of group) {
      const [cat, type] = key.split(":");
      assert.ok(c.types[cat]?.includes(type));
    }
  assert.ok(!c.types.Bottoms.includes("Skort"));
  const x = input80();
  x.views.whole[0] = { label: "a skort", score: 0.8 };
  assert.match(decide80(x).reasons.join(), /vocabulary/);
});
test("all six subtype families supply bounded same-category hypotheses but never a certified type", () => {
  for (const [cat, type, other] of [
    ["Bottoms", "Shorts", "Skirt"],
    ["Dresses", "Shirt dress", "Casual dress"],
    ["Outerwear", "Jacket", "Coat"],
    ["Shoes", "Sneakers", "Ankle boots"],
    ["Tops", "T-shirt", "Blouse"],
    ["Bottoms", "Jeans", "Leggings"],
  ]) {
    const r = decide80(input80(cat, type, other));
    assert.equal(r.status, "hypotheses");
    assert.equal(r.itemType, "Unknown");
    assert.ok(r.alternatives.length <= 3);
    assert.ok(r.alternatives.every((a) => a.category === cat));
    assert.equal(r.automaticallyCertified, false);
  }
});
test("ties, opposing same-model framings, cross-category/background and missing complete scores abstain", () => {
  for (const mutate of [
    (x) => (x.views.whole = scores80("Bottoms", "Shorts", "Skirt", 0.49, 0.48)),
    (x) => (x.views.confirmation = scores80("Bottoms", "Skirt", "Shorts")),
    (x) => (x.views.whole = scores80("Dresses", "Shirt dress", "Casual dress")),
    (x) => (x.views.whole = []),
    (x) => (x.views.whole = x.views.whole.slice(0, 3)),
    (x) => (x.views.whole[0].score = NaN),
    (x) => x.views.whole.push(x.views.whole[0]),
  ]) {
    const x = input80();
    mutate(x);
    assert.equal(decide80(x).status, "abstain");
  }
});
test("missing consent, owner/category review, pose/quality/scale/orientation/source/model revisions fail closed", () => {
  for (const mutate of [
    (x) => (x.enabled = false),
    (x) => (x.consent = false),
    (x) => (x.categoryOwnerReviewed = false),
    (x) => (x.category = "Uncategorized"),
    (x) => (x.quality.detailVisible = false),
    (x) => (x.quality.lowLight = true),
    (x) => (x.quality.soft = true),
    (x) => (x.quality.occluded = true),
    (x) => (x.quality.overlapping = true),
    (x) => (x.quality.minimumSide = 100),
    (x) => (x.quality.clipped = true),
    (x) => (x.current.maskSha256 = "2".repeat(64)),
    (x) => (x.current.inputSha256 = "2".repeat(64)),
    (x) => (x.current.ownerId = "other"),
    (x) => (x.current.unitId = "other"),
    (x) => (x.current.revisionSha256 = "2".repeat(64)),
    (x) => (x.model.revision = "bad"),
    (x) => (x.model.vectorsSha256 = "bad"),
    (x) => (x.model.sourceCodeSha256 = "bad"),
    (x) => (x.receipt.createdAt -= 60001),
    (x) => (x.receipt.createdAt += 60001),
  ]) {
    const x = input80();
    mutate(x);
    assert.equal(decide80(x).status, "abstain");
  }
});
test("original/crop/mask/unit/pair evidence uses actual JPEG bytes; changing source or owner revokes", async () => {
  const bytes = await readFile("benchmark/fixtures/commons-0003.jpg"),
    image = "data:image/jpeg;base64," + bytes.toString("base64"),
    item = { id: "SYNTHETIC-item", image };
  let owner = "SYNTHETIC-owner";
  const scope = {
    ownerId: owner,
    sessionId: "SYNTHETIC-session",
    live: () => owner === "SYNTHETIC-owner",
  };
  const a = await evidence80(item, scope);
  assert.equal(a.sourceSha256, await hash80(bytes));
  assert.equal(a.inputSha256, a.sourceSha256);
  assert.deepEqual(Buffer.from(jpeg80(image)), bytes);
  item.cropBounds = { x: 0.1 };
  assert.ok(!binding80(a, await evidence80(item, scope)));
  owner = "other";
  await assert.rejects(evidence80(item, scope));
  owner = "SYNTHETIC-owner";
  item.outfitSourceId = "scene";
  await assert.rejects(evidence80(item, scope));
  item.reconciliation70 = {
    ownerId: owner,
    sourceSha256: a.sourceSha256,
    maskSha256: "a".repeat(64),
  };
  item.reconciliation70Status = "paired_confirmed";
  item.shoePair = {
    confirmedByOwner: true,
    companion: {
      reconciliation70: {
        ownerId: owner,
        sourceSha256: a.sourceSha256,
        maskSha256: "b".repeat(64),
      },
    },
  };
  const pair = await evidence80(item, scope);
  assert.equal(pair.unitStatus, "paired_confirmed");
  const unchanged = revision80(item);
  item.shoePair.companion.reconciliation70.sourceSha256 = "c".repeat(64);
  await assert.rejects(evidence80(item, scope));
  assert.notEqual(revision80(item), unchanged);
});
test("explicit acknowledgment required; repeated concurrent decisions cannot commit twice or learn/save", async () => {
  const x = input80(),
    r = decide80(x),
    review = createReview80({
      live: async () => x.current,
      evidence: x.evidence,
      decision: r,
    });
  await assert.rejects(review.choose("Shorts"));
  const results = await Promise.allSettled([
    review.choose("Shorts", { acknowledged: true }),
    review.choose("Skirt", { acknowledged: true }),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  const chosen = results.find((x) => x.status === "fulfilled").value;
  assert.equal(chosen.requiresOwnerSave, true);
  assert.equal(chosen.independentHumanGroundTruth, false);
  assert.equal(chosen.learningConsent, false);
  const stale = createReview80({
    live: async () => ({ ...x.current, ownerId: "other" }),
    evidence: x.evidence,
    decision: r,
  });
  await assert.rejects(stale.choose("Unknown", { acknowledged: true }));
});
test("real worker adapter source-executes two bounded full-vocabulary model calls and rejects wrong input", async () => {
  const bytes = await readFile("benchmark/fixtures/commons-0003.jpg"),
    image = "data:image/jpeg;base64," + bytes.toString("base64"),
    x = input80();
  x.evidence.inputSha256 = await hash80(bytes);
  let calls = 0;
  const run = {
    request: {
      image,
      subtype80: {
        schema: VERSION,
        enabled: true,
        consent: true,
        categoryOwnerReviewed: true,
        evidence: x.evidence,
      },
    },
    image: {},
    whole: async (_, labels) => {
      calls++;
      assert.equal(labels.length, localCandidates.length);
      return x.views.whole;
    },
    confirmation: async () => {
      calls++;
      return x.views.confirmation;
    },
    metadata: {
      model: x.model.name,
      revision: x.model.revision,
      sha256: x.model.vectorsSha256,
    },
    sourceCodeSha256: x.model.sourceCodeSha256,
  };
  const result = await subtypeModel80(run);
  assert.equal(calls, 2);
  assert.equal(result.strong, false);
  assert.deepEqual(result.choices, []);
  assert.ok(binding80(result.subtype80.receipt.evidence, x.evidence));
  run.request.subtype80.consent = false;
  await assert.rejects(subtypeModel80(run));
  assert.equal(calls, 2);
});
test("36 synthetic before/after programming cases retain denominators and no fabricated accuracy", async () => {
  const r = await evaluateSynthetic80();
  assert.equal(r.cases, 36);
  assert.equal(r.hypothesisSets, 12);
  assert.equal(r.policyAbstentions, 30);
  assert.equal(r.newAutomaticSpecificCertificates, 0);
  assert.equal(r.verifiedHumanLabels, 0);
  assert.equal(r.accuracy, null);
});
test("public challenge loader uses P75 quarantine/rights validators, never reads blind answers", async () => {
  const r = await challenge80();
  assert.equal(r.metadataReceipts, 32);
  assert.equal(r.approvedHumanSubtypeLabels, 0);
  assert.equal(r.independentAccuracyAcceptance, "BLOCKED");
  await assert.rejects(challenge80({ recheck: 4 }));
});
test("public source HTTP retry is bounded and never bypasses unavailable originals", async () => {
  let calls = 0;
  await assert.rejects(
    challenge80({
      recheck: 1,
      waiter: async () => {},
      fetcher: async (url, options) => {
        calls++;
        assert.match(
          options.headers["User-Agent"],
          /ClosetCurrentP80SourceAudit/,
        );
        assert.equal(options.redirect, "error");
        return new Response("unavailable", { status: 503 });
      },
    }),
    /HTTP_503/,
  );
  assert.equal(calls, 3);
});
test("review decisions are immutable, cannot be reconstructed or rebound, and reject invalid clocks", async () => {
  const x = input80(),
    decision = decide80(x);
  assert.ok(Object.isFrozen(decision));
  assert.ok(Object.isFrozen(decision.alternatives));
  assert.ok(Object.isFrozen(decision.evidence));
  assert.throws(() => {
    decision.receiptCreatedAt = NaN;
  }, TypeError);
  assert.throws(() => {
    decision.alternatives.push({ itemType: "Coat" });
  }, TypeError);
  assert.throws(
    () =>
      createReview80({
        decision: structuredClone(decision),
        evidence: x.evidence,
        live: async () => x.current,
      }),
    /UNISSUED/,
  );
  assert.throws(
    () =>
      createReview80({
        decision,
        evidence: { ...x.evidence, ownerId: "OTHER" },
        live: async () => x.current,
      }),
    /UNISSUED/,
  );
  for (const now of [
    () => NaN,
    () => decision.receiptCreatedAt - 1,
    () => decision.receiptCreatedAt + 60001,
  ]) {
    const review = createReview80({
      decision,
      evidence: x.evidence,
      live: async () => x.current,
      now,
    });
    await assert.rejects(
      review.choose("Shorts", { acknowledged: true }),
      /REVOKED/,
    );
  }
  const original = structuredClone(x.current),
    review = createReview80({
      decision,
      evidence: x.evidence,
      live: async () => original,
    });
  x.evidence.ownerId = "MUTATED";
  const chosen = await review.choose("Shorts", { acknowledged: true });
  assert.equal(chosen.evidence.ownerId, original.ownerId);
  assert.ok(Object.isFrozen(chosen.evidence));
});
test("recognition source fetches have explicit deadlines and enforce byte limits before accumulation", async () => {
  const { sourceCodeHash80, SOURCE_FILES80 } = await import(
    "../public/subtype-worker-80.mjs"
  );
  let calls = 0;
  const good = await sourceCodeHash80(async (_, options) => {
    calls++;
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    return new Response("synthetic source");
  });
  assert.match(good, /^[a-f0-9]{64}$/);
  assert.equal(calls, SOURCE_FILES80.length);
  let canceled = false;
  await assert.rejects(
    sourceCodeHash80(
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new Uint8Array(250001));
            },
            cancel() {
              canceled = true;
            },
          }),
        ),
    ),
    /SOURCE_CODE_LIMIT/,
  );
  assert.equal(canceled, true);
  await assert.rejects(
    sourceCodeHash80(async () => new Response(new Uint8Array([255]))),
    /encoded data|encoding/i,
  );
});

test("one issued decision cannot be replayed through separate handles and close revokes all handles", async () => {
  const x = input80(),
    decision = decide80(x),
    args = { decision, evidence: x.evidence, live: async () => x.current };
  const a = createReview80(args),
    b = createReview80(args);
  const results = await Promise.allSettled([
    a.choose("Shorts", { acknowledged: true }),
    b.choose("Skirt", { acknowledged: true }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const y = input80(),
    other = decide80(y),
    c = createReview80({
      decision: other,
      evidence: y.evidence,
      live: async () => y.current,
    }),
    d = createReview80({
      decision: other,
      evidence: y.evidence,
      live: async () => y.current,
    });
  c.close();
  await assert.rejects(d.choose("Unknown", { acknowledged: true }));
});
