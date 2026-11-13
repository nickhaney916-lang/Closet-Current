/**
 * P80 public DEVELOPMENT photo inference, not independent recognition accuracy.
 *
 * Uses EXACT SHA-verified, previously exposed Commons benchmark JPEGs. No images,
 * private photos, human labels, screenshots, scores or source bytes are persisted.
 * Simulated owner consent/category hints are fixture inputs, NOT human review.
 * NEVER run on production/staging/signed real accounts or sealed blind sources.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, extname, join } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const IDS = Object.freeze(["commons-0033", "commons-0041", "commons-0088"]);
const root = resolve("public");
const paths = {
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".json": "application/json",
  ".bin": "application/octet-stream",
};
const sources = JSON.parse(await readFile("benchmark/locked-photo-sources.json", "utf8"));
const history = JSON.parse(await readFile("benchmark/manifest-reviewed-32.json", "utf8"));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inputs = [];
for (const id of IDS) {
  const source = sources.find((row) => row.id === id);
  const historical = history.find((row) => row.id === id);
  assert.ok(source?.verified && historical?.verified && source.image === historical.image);
  assert.ok(source.attribution?.source?.startsWith("https://commons.wikimedia.org/wiki/File:"));
  assert.ok(["CC0", "CC BY 4.0", "CC BY-SA 3.0"].includes(source.attribution.license));
  assert.ok(["Bottoms", "Shoes"].includes(historical.expectedCategory));
  const bytes = await readFile(join("benchmark/photos", source.image));
  assert.ok(bytes.length > 4 && bytes.length <= 8 * 1024 * 1024);
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
  assert.equal(digest(bytes), source.sha256);
  // Historical category hints are PUBLIC DEVELOPMENT METADATA, not independent labels.
  inputs.push({
    id,
    historicalCategoryHint: historical.expectedCategory,
    sha256: source.sha256,
    image: "data:image/jpeg;base64," + bytes.toString("base64"),
  });
}
assert.equal(inputs.length, IDS.length);

const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET") throw Error("GET only");
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/") {
      res.setHeader("Content-Type", "text/html");
      return res.end("<!doctype html><html lang=\"en\"><title>P80 public-development inference</title><p>Research only; simulated owner flags; no truth labels.</p>");
    }
    const full = resolve(root, "." + decodeURIComponent(pathname));
    if (!full.startsWith(root + "/")) throw Error("Outside public");
    res.setHeader("Content-Type", paths[extname(full)] || "text/plain");
    res.end(await readFile(full));
  } catch {
    res.statusCode = 404;
    res.end("Missing");
  }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(300000);
  const requests = [];
  const pageErrors = [];
  page.on("request", (request) =>
    requests.push({ method: request.method(), local: request.url().startsWith(origin) })
  );
  page.on("pageerror", (err) => pageErrors.push(err.message));
  await page.goto(origin);
  const report = await page.evaluate(async (cases) => {
    const { VERSION, evidence80, binding80, jpeg80, hash80, decide80 } =
      await import("/subtype-review-80.mjs");
    const { localCandidates } = await import("/local-catalog.mjs");
    const { sourceCodeHash80 } = await import("/subtype-worker-80.mjs");
    const worker = new Worker("/local-worker.mjs", { type: "module" });
    const pending = new Map();
    let seq = 0;
    let progress = 0;
    const call = (payload, timeout = 60000) =>
      new Promise((resolveCall, reject) => {
        const id = ++seq;
        const timer = setTimeout(() => {
          pending.delete(id);
          worker.terminate();
          reject(Error("P80_PUBLIC_DEV_WORKER_TIMEOUT"));
        }, timeout);
        pending.set(id, { resolveCall, reject, timer });
        worker.postMessage({ ...payload, id });
      });
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") {
        progress++;
        return;
      }
      const entry = pending.get(data.id);
      if (!entry) return;
      if (["ready", "result", "error"].includes(data.type)) {
        clearTimeout(entry.timer);
        pending.delete(data.id);
        if (data.type === "error") entry.reject(Error(data.code || "P80_WORKER_ERROR"));
        else entry.resolveCall(data);
      }
    };
    worker.onerror = () => {
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(Error("P80_WORKER_START_FAILED"));
      }
      pending.clear();
    };
    try {
      await call({ type: "load" }, 240000);
      const sourceCodeSha256 = await sourceCodeHash80();
      const metadata = await (await fetch("/recognition-vectors.json")).json();
      const observations = [];
      const variantObservations = [];
      for (const itemInput of cases) {
        const item = {
          id: "SYNTHETIC-P80-" + itemInput.id,
          image: itemInput.image,
        };
        const scope = {
          // Fixture only. Does not represent a signed human owner or consent.
          ownerId: "SYNTHETIC-TEST-OWNER",
          sessionId: "SYNTHETIC-DEV-SESSION",
          live: () => true,
        };
        const before = await evidence80(item, scope);
        if (
          before.sourceSha256 !== itemInput.sha256 ||
          before.inputSha256 !== itemInput.sha256 ||
          (await hash80(jpeg80(itemInput.image))) !== itemInput.sha256
        ) throw Error("Original JPEG bytes/source digest changed");
        const start = performance.now();
        const result = await call({
          type: "subtype-candidates80",
          image: itemInput.image,
          subtype80: {
            schema: VERSION,
            enabled: true,
            // Synthetic fixture permissions; NOT an actual owner confirmation.
            consent: true,
            categoryOwnerReviewed: true,
            evidence: before,
          },
        }, 90000);
        const ms = Math.round(performance.now() - start);
        const data = result.subtype80;
        if (
          result.type !== "result" ||
          result.strong !== false ||
          result.choices.length !== 0 ||
          !binding80(data.receipt.evidence, before) ||
          data.model.name !== metadata.model ||
          data.model.revision !== metadata.revision ||
          data.model.vectorsSha256 !== metadata.sha256 ||
          data.model.sourceCodeSha256 !== sourceCodeSha256
        ) throw Error("Real worker custody/model contract mismatch");
        for (const rows of [data.views.whole, data.views.confirmation]) {
          if (
            rows.length !== localCandidates.length ||
            new Set(rows.map((v) => v.label)).size !== localCandidates.length ||
            rows.some((v) => !Number.isFinite(v.score) || v.score < 0 || v.score > 1) ||
            Math.abs(rows.reduce((s, v) => s + v.score, 0) - 1) > 0.0001
          ) throw Error("Incomplete full-vocabulary scores");
        }
        const live = await evidence80(item, scope);
        if (!binding80(before, live)) throw Error("Original evidence changed");
        // Explicitly simulated quality/category assumption: programming behavior,
        // NOT a valid owner approval, real mask, accepted photo quality or truth.
        const decision = decide80({
          enabled: true,
          consent: true,
          categoryOwnerReviewed: true,
          category: itemInput.historicalCategoryHint,
          evidence: before,
          current: live,
          model: data.model,
          receipt: data.receipt,
          views: data.views,
          quality: { detailVisible: true, minimumSide: 224 },
        });
        if (
          decision.itemType !== "Unknown" ||
          decision.automaticallyCertified !== false ||
          decision.requiresOwnerConfirmation !== true
        ) throw Error("Real photo produced automatic subtype certificate");
        // Unknown is mandatory if photo quality has not been independently reviewed.
        const unreviewed = decide80({
          enabled: true, consent: true, categoryOwnerReviewed: true,
          category: itemInput.historicalCategoryHint,
          evidence: before, current: live, model: data.model,
          receipt: data.receipt, views: data.views,
          quality: { detailVisible: false, minimumSide: 224 },
        });
        if (
          unreviewed.status !== "abstain" ||
          unreviewed.itemType !== "Unknown" ||
          unreviewed.alternatives.length !== 0
        ) throw Error("Unreviewed real photo was not safely abstained");
        observations.push({
          sourceId: itemInput.id,
          wholeTopCategory: localCandidates.find(
            (row) => row.label === data.views.whole.reduce(
              (best, x) => x.score > best.score ? x : best
            ).label
          )?.category || "Unknown",
          confirmationTopCategory: localCandidates.find(
            (row) => row.label === data.views.confirmation.reduce(
              (best, x) => x.score > best.score ? x : best
            ).label
          )?.category || "Unknown",
          simulatedCategoryStatus: decision.status,
          simulatedReasonCount: decision.reasons.length,
          simulatedCandidateCount: decision.alternatives.length,
          unreviewedStatus: unreviewed.status,
          workerMs: ms,
        });

        // Real source JPEG remains immutable when the recognition INPUT changes.
        // These deterministic crops and dimmings are research adversarial edits,
        // NOT new photographs, labels or evidence that a garment is recognizable.
        const photo = new Image();
        photo.src = itemInput.image;
        await photo.decode();
        const variant = itemInput.id === "commons-0088" ? "central-crop" : "dimmed";
        const cv = document.createElement("canvas");
        cv.width = cv.height = 256;
        const ct = cv.getContext("2d");
        ct.fillStyle = "#121212";
        ct.fillRect(0, 0, 256, 256);
        if (variant === "central-crop") {
          ct.drawImage(
            photo, photo.naturalWidth * 0.25, photo.naturalHeight * 0.25,
            photo.naturalWidth * 0.5, photo.naturalHeight * 0.5,
            0, 0, 256, 256
          );
        } else {
          ct.filter = "brightness(0.12)";
          ct.drawImage(photo, 0, 0, 256, 256);
          ct.filter = "none";
        }
        const changedImage = cv.toDataURL("image/jpeg", 0.88);
        item.originalPhoto = { image: itemInput.image };
        item.recognitionPhoto = { image: changedImage };
        const changedEvidence = await evidence80(item, scope);
        if (
          changedEvidence.sourceSha256 !== itemInput.sha256 ||
          changedEvidence.inputSha256 === before.inputSha256 ||
          changedEvidence.inputSha256 !== await hash80(jpeg80(changedImage)) ||
          binding80(before, changedEvidence)
        ) throw Error("Crop/dim source lease failed to invalidate");
        // The old source lease MUST NOT run the model on a newly edited input.
        let oldLeaseRejected = false;
        try {
          await call({
            type: "subtype-candidates80",
            image: changedImage,
            subtype80: {
              schema: VERSION, enabled: true, consent: true,
              categoryOwnerReviewed: true, evidence: before,
            },
          }, 10000);
        } catch {
          oldLeaseRejected = true;
        }
        if (!oldLeaseRejected) throw Error("Old photo input receipt replayed");
        // Test ONLY: invoke real worker directly to inspect bounded score
        // behavior. The actual optional panel should NOT score poor images.
        const altered = await call({
          type: "subtype-candidates80",
          image: changedImage,
          subtype80: {
            schema: VERSION, enabled: true, consent: true,
            categoryOwnerReviewed: true, evidence: changedEvidence,
          },
        }, 90000);
        const alteredData = altered.subtype80;
        if (
          altered.strong !== false ||
          altered.choices.length !== 0 ||
          !binding80(alteredData.receipt.evidence, changedEvidence) ||
          alteredData.model.sourceCodeSha256 !== sourceCodeSha256 ||
          alteredData.model.name !== metadata.model ||
          alteredData.views.whole.length !== localCandidates.length ||
          alteredData.views.confirmation.length !== localCandidates.length
        ) throw Error("Altered photo model custody failed");
        const alteredDecision = decide80({
          enabled: true, consent: true, categoryOwnerReviewed: true,
          category: itemInput.historicalCategoryHint,
          evidence: changedEvidence,
          current: await evidence80(item, scope),
          model: alteredData.model,
          receipt: alteredData.receipt,
          views: alteredData.views,
          quality: {
            detailVisible: true, minimumSide: 256,
            lowLight: variant === "dimmed",
            clipped: variant === "central-crop",
          },
        });
        const oldResultNewPhoto = decide80({
          enabled: true, consent: true, categoryOwnerReviewed: true,
          category: itemInput.historicalCategoryHint,
          evidence: before,
          current: changedEvidence,
          model: data.model,
          receipt: data.receipt,
          views: data.views,
          quality: { detailVisible: true, minimumSide: 256 },
        });
        if (
          alteredDecision.status !== "abstain" ||
          alteredDecision.itemType !== "Unknown" ||
          alteredDecision.alternatives.length !== 0 ||
          alteredDecision.automaticallyCertified !== false ||
          oldResultNewPhoto.status !== "abstain" ||
          oldResultNewPhoto.itemType !== "Unknown"
        ) throw Error("Changed photo was not conservatively Unknown");
        item.ownerId = "SYNTHETIC-FOREIGN-OWNER";
        let wrongOwnerRejected = false;
        try {
          await evidence80(item, scope);
        } catch {
          wrongOwnerRejected = true;
        }
        delete item.ownerId;
        if (!wrongOwnerRejected) throw Error("Foreign owner accepted changed photo");
        variantObservations.push({
          sourceId: itemInput.id,
          transformation: variant,
          originalHashRetained: true,
          inputHashChanged: true,
          staleWorkerReceiptRejected: oldLeaseRejected,
          alteredRealWorkerFullVocabViews: 2,
          conservativeDecision: alteredDecision.status,
          staleDecision: oldResultNewPhoto.status,
          ownerSwitchRejected: wrongOwnerRejected,
        });
      }
      return {
        evidenceKind: "ACTUAL FASHIONCLIP ON PREVIOUSLY EXPOSED LICENSED PUBLIC DEVELOPMENT JPEGs",
        independentlyReviewed: false,
        signedOwnerSessions: 0,
        simulatedOwnerPermissions: cases.length,
        rightsCuratorApprovals: 0,
        actualPhotographs: cases.length,
        originalSha256Verified: cases.length,
        fullVocabularyLabelsPerView: localCandidates.length,
        model: metadata.model,
        modelRevision: metadata.revision,
        modelSourceSha256: sourceCodeSha256,
        simulatedOnly: true,
        actualOwnerConfirmations: 0,
        independentlyApprovedSubtypeLabels: 0,
        sealedBlindExamples: 0,
        photoSubtypesSaved: 0,
        automaticSubtypeCertificates: 0,
        independentAccuracy: null,
        physicalPhoneTests: 0,
        observations,
        realPhotoSourceRevisionVariants: variantObservations.length,
        realPhotoWorkerTotal: cases.length + variantObservations.length,
        stalePhotoReceiptsRejected: variantObservations.filter((v) => v.staleWorkerReceiptRejected).length,
        poorPhotoAbstentions: variantObservations.filter((v) => v.conservativeDecision === "abstain").length,
        variantObservations,
      };
    } finally {
      worker.terminate();
      for (const entry of pending.values()) clearTimeout(entry.timer);
    }
  }, inputs);
  assert.deepEqual(pageErrors, []);
  assert.ok(requests.every((r) => r.method === "GET" || r.method === "HEAD"));
  assert.ok(requests.some((r) => !r.local), "Actual runtime/model downloads required");
  assert.equal(report.actualPhotographs, IDS.length);
  assert.equal(report.photoSubtypesSaved, 0);
  assert.equal(report.realPhotoSourceRevisionVariants, IDS.length);
  assert.equal(report.realPhotoWorkerTotal, 2 * IDS.length);
  assert.equal(report.stalePhotoReceiptsRejected, IDS.length);
  assert.equal(report.poorPhotoAbstentions, IDS.length);
  assert.equal(report.independentAccuracy, null);
  console.log("P80_ACTUAL_PUBLIC_DEV_IMAGES " + JSON.stringify({
    ...report,
    noExternalPhotoUploads: true,
  }));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
}
