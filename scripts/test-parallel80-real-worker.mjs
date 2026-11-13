/** REAL pinned FashionCLIP, generated geometric JPEG only. NOT accuracy evidence. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const root = resolve("public"),
  types = {
    ".mjs": "text/javascript",
    ".js": "text/javascript",
    ".json": "application/json",
    ".bin": "application/octet-stream",
  };
const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET") throw Error("GET only");
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/") {
      res.setHeader("Content-Type", "text/html");
      return res.end(
        '<!doctype html><html lang="en"><head><title>Synthetic real-worker test</title></head><body><p>Generated geometric JPEG. No human truth.</p></body></html>',
      );
    }
    const file = resolve(root, "." + decodeURIComponent(pathname));
    if (!file.startsWith(root + "/")) throw Error("Path");
    res.setHeader("Content-Type", types[extname(file)] || "text/plain");
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Missing");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage(),
    requests = [],
    errors = [];
  page.setDefaultTimeout(300000);
  page.on("request", (r) =>
    requests.push({ method: r.method(), local: r.url().startsWith(origin) }),
  );
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const { VERSION, evidence80, hash80, jpeg80, decide80, binding80 } =
      await import("/subtype-review-80.mjs");
    const { localCandidates } = await import("/local-catalog.mjs");
    const { sourceCodeHash80 } = await import("/subtype-worker-80.mjs");
    const worker = new Worker("/local-worker.mjs", { type: "module" }),
      pending = new Map();
    let seq = 0,
      progress = 0;
    const call = (payload, timeout = 60000) =>
      new Promise((resolve, reject) => {
        const id = ++seq,
          timer = setTimeout(() => {
            pending.delete(id);
            worker.terminate();
            reject(Error("P80_REAL_WORKER_TIMEOUT"));
          }, timeout);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ ...payload, id });
      });
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") {
        progress++;
        return;
      }
      const job = pending.get(data.id);
      if (!job) return;
      if (["ready", "result", "error"].includes(data.type)) {
        clearTimeout(job.timer);
        pending.delete(data.id);
        data.type === "error"
          ? job.reject(Error(data.code || "P80_REAL_WORKER_ERROR"))
          : job.resolve(data);
      }
    };
    worker.onerror = () => {
      for (const job of pending.values()) {
        clearTimeout(job.timer);
        job.reject(Error("P80_REAL_WORKER_START_FAILED"));
      }
      pending.clear();
    };
    try {
      let optInRejected = false;
      try {
        await call(
          {
            type: "subtype-candidates80",
            image: "invalid",
            subtype80: { enabled: false, consent: false },
          },
          10000,
        );
      } catch {
        optInRejected = true;
      }
      if (!optInRejected || progress !== 0)
        throw Error("Consent gate started model setup");
      await call({ type: "load" }, 240000);
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ececec";
      ctx.fillRect(0, 0, 384, 512);
      for (let n = 0; n < 9; n++) {
        ctx.fillStyle = n % 2 ? "#18559c" : "#c29b48";
        ctx.fillRect(50 + n * 3, 35 + n * 45, 270 - n * 6, 23);
      }
      const image = canvas.toDataURL("image/jpeg", 0.9),
        item = { id: "SYNTHETIC-real-worker-80", image },
        scope = {
          ownerId: "SYNTHETIC-owner",
          sessionId: "SYNTHETIC-session",
          live: () => true,
        },
        evidence = await evidence80(item, scope),
        sourceHash = await sourceCodeHash80(),
        metadata = await (await fetch("/recognition-vectors.json")).json();
      const started = performance.now(),
        output = await call({
          type: "subtype-candidates80",
          image,
          subtype80: {
            schema: VERSION,
            enabled: true,
            consent: true,
            categoryOwnerReviewed: true,
            evidence,
          },
        }),
        ms = Math.round(performance.now() - started),
        data = output.subtype80;
      if (
        output.strong !== false ||
        output.choices.length !== 0 ||
        !binding80(data.receipt.evidence, evidence) ||
        data.model.sourceCodeSha256 !== sourceHash ||
        data.model.name !== metadata.model ||
        data.model.revision !== metadata.revision ||
        data.model.vectorsSha256 !== metadata.sha256
      )
        throw Error("Actual worker provenance/result contract mismatch");
      for (const view of [data.views.whole, data.views.confirmation]) {
        if (
          view.length !== localCandidates.length ||
          new Set(view.map((v) => v.label)).size !== localCandidates.length ||
          view.some(
            (v) => !Number.isFinite(v.score) || v.score < 0 || v.score > 1,
          ) ||
          Math.abs(view.reduce((s, v) => s + v.score, 0) - 1) > 0.0001
        )
          throw Error("Actual worker scores are incomplete or invalid");
      }
      const current = await evidence80(item, scope),
        decision = decide80({
          enabled: true,
          consent: true,
          categoryOwnerReviewed: true,
          category: "Bottoms",
          evidence,
          current,
          model: data.model,
          receipt: data.receipt,
          views: data.views,
          quality: { detailVisible: false, minimumSide: 384 },
        });
      if (
        decision.status !== "abstain" ||
        decision.itemType !== "Unknown" ||
        decision.automaticallyCertified !== false ||
        evidence.sourceSha256 !== (await hash80(jpeg80(image)))
      )
        throw Error("Generated geometric input cannot certify a garment");
      let mismatchRejected = false;
      try {
        await call({
          type: "subtype-candidates80",
          image,
          subtype80: {
            schema: VERSION,
            enabled: true,
            consent: true,
            categoryOwnerReviewed: true,
            evidence: { ...evidence, inputSha256: "0".repeat(64) },
          },
        });
      } catch {
        mismatchRejected = true;
      }
      if (!mismatchRejected) throw Error("Wrong input digest accepted");
      return {
        kind: "REAL MODEL / GENERATED GEOMETRIC INPUT ONLY",
        model: data.model.name,
        modelRevision: data.model.revision,
        vectorsSha256: data.model.vectorsSha256,
        sourceCodeSha256: sourceHash,
        actualSubtypeWorkerResults: 1,
        generatedImages: 1,
        scoreRowsPerView: localCandidates.length,
        fullVocabularyViews: 2,
        workerInferenceMs: ms,
        progressEvents: progress,
        optInRejectedBeforeSetup: optInRejected,
        inputMismatchRejected: mismatchRejected,
        originalBytesUnchanged: true,
        automaticSubtypeCertificates: 0,
        approvedHumanLabels: 0,
        photographicAccuracy: "UNKNOWN",
        physicalDevices: 0,
      };
    } finally {
      worker.terminate();
      for (const job of pending.values()) clearTimeout(job.timer);
    }
  });
  assert.deepEqual(errors, []);
  assert.ok(
    requests.every((r) => r.method === "GET" || r.method === "HEAD"),
    "no image/network uploads",
  );
  assert.ok(
    requests.some((r) => !r.local),
    "actual model/runtime fetched, not a test scorer",
  );
  console.log(
    "P80_REAL_WORKER_SYNTHETIC_INPUT " +
      JSON.stringify({ ...result, networkUploads: 0 }),
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
