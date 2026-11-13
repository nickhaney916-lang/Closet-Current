#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import {
  randomBytes,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  loadSession,
  externalPath,
  CATEGORIES,
  COLORS,
  canonical,
  DECLARATION,
  validateDraft,
  reviewHandoff,
  strictLabel,
} from "./p79-workstation-core.mjs";
import {
  verifyOriginalBytes,
  sha256,
  validateLabel,
} from "./p75-dataset-core.mjs";
const ui = fileURLToPath(
  new URL("../research/parallel79/workstation/", import.meta.url),
);
export async function createWorkstation(bundle, options = {}) {
  const loaded = await loadSession(bundle, options),
    token = randomBytes(32).toString("hex");
  const prefix = "/" + token + "/",
    assets = new Map([
      ["", "index.html"],
      ["app.js", "app.js"],
      ["style.css", "style.css"],
      ["display.mjs", "display.mjs"],
    ]);
  const server = createServer(async (req, res) => {
    const send = (code, data, type = "text/plain") => {
      res.writeHead(code, {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Permissions-Policy":
          "camera=(), microphone=(), geolocation=(), payment=()",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; font-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'",
      });
      res.end(data);
    };
    try {
      const origin = "http://127.0.0.1:" + server.address().port;
      if (
        req.method !== "GET" ||
        req.headers.host !== "127.0.0.1:" + server.address().port ||
        (req.headers.origin && req.headers.origin !== origin) ||
        ["cross-site"].includes(req.headers["sec-fetch-site"])
      )
        return send(403, "Local same-origin GET only");
      if (Date.parse(loaded.session.expiresAt) <= Date.now())
        return send(403, "Session expired; restart with registrar approval");
      const url = new URL(req.url, origin);
      if (!url.pathname.startsWith(prefix)) return send(404, "Missing");
      const name = url.pathname.slice(prefix.length);
      if (assets.has(name))
        return send(
          200,
          await readFile(resolve(ui, assets.get(name))),
          name.endsWith(".js") || name.endsWith(".mjs")
            ? "text/javascript"
            : name.endsWith(".css")
              ? "text/css"
              : "text/html",
        );
      if (name === "validator.js")
        return send(
          200,
          `const CATEGORIES=${JSON.stringify(CATEGORIES)},COLORS=${JSON.stringify(COLORS)}; const isHex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x); const validateLabel=${validateLabel.toString()}; export const strictLabel=${strictLabel.toString()};`,
          "text/javascript",
        );
      if (name === "session")
        return send(
          200,
          JSON.stringify({
            ...loaded.session,
            categories: CATEGORIES,
            colors: COLORS,
            declaration: DECLARATION,
            photos: loaded.records.map((r, i) => ({
              id: i,
              sha256: r.source.sha256,
              receiptSha256: sha256(canonical(r.source)),
              width: r.source.width,
              height: r.source.height,
              orientation: r.source.orientation,
              mime: r.source.mime,
              byteLength: r.source.byteLength,
              rights:
                r.source.license +
                "; curator-approved; " +
                r.source.consentStatus,
            })),
          }),
          "application/json",
        );
      if (/^original\/\d+$/.test(name)) {
        const r = loaded.records[Number(name.split("/")[1])];
        if (!r) return send(404, "Missing");
        if ((await stat(r.path)).size !== r.source.byteLength)
          return send(409, "Original changed");
        const bytes = await readFile(r.path);
        if (!verifyOriginalBytes(r.source, bytes))
          return send(409, "Original changed; stop and return to custodian");
        return send(200, bytes, r.source.mime);
      }
      return send(404, "Missing");
    } catch {
      return send(
        409,
        "Source unavailable or changed; stop and contact custodian",
      );
    }
  });
  await new Promise((f) => server.listen(0, "127.0.0.1", f));
  return {
    server,
    url: "http://127.0.0.1:" + server.address().port + prefix,
    loaded,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.env.CI || process.env.GITHUB_ACTIONS)
    throw Error("Private workstation is forbidden in CI");
  const [command, ...args] = process.argv.slice(2);
  if (command === "authorize") {
    if (
      process.env.P79_REGISTRAR_CONFIRMATION !==
      "I independently vetted this reviewer, source custody and session access"
    )
      throw Error("External registrar must manually approve session access");
    const requestPath = await externalPath(args[0]),
      keyPath = await externalPath(args[1]);
    // New output must be absolute, external and exclusive; its real parent is checked.
    const { dirname, basename } = await import("node:path");
    const parent = await externalPath(dirname(args[2]));
    if (!args[2]?.startsWith("/")) throw Error("Absolute new output required");
    const payload = JSON.parse(await readFile(requestPath, "utf8")),
      key = createPrivateKey(await readFile(keyPath, "utf8"));
    if (
      key.asymmetricKeyType !== "ed25519" ||
      sha256(createPublicKey(key).export({ type: "spki", format: "der" })) !==
        process.env.P75_APPROVED_REGISTRAR_FINGERPRINT
    )
      throw Error("Pinned registrar key mismatch");
    if (
      payload.schema !== "p79-v1" ||
      payload.signature ||
      !payload.sourceReceiptDigests?.length ||
      !payload.reviewerId ||
      !payload.sessionId ||
      !Number.isFinite(Date.parse(payload.expiresAt))
    )
      throw Error("Invalid authorization request");
    const signature = sign(null, Buffer.from(canonical(payload)), key).toString(
      "base64",
    );
    await writeFile(
      resolve(parent, basename(args[2])),
      canonical({ ...payload, signature }) + "\n",
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      "Local session authorization written; no labels or identities printed.",
    );
  } else if (command === "serve") {
    const path = await externalPath(args[0]);
    if ((await stat(path)).size > 5000000) throw Error("Bundle too large");
    const bundle = JSON.parse(await readFile(path, "utf8"));
    // Trust anchor must be supplied separately by custodian, never trusted from bundle.
    bundle.approvedFingerprint = process.env.P75_APPROVED_REGISTRAR_FINGERPRINT;
    const { url } = await createWorkstation(bundle);
    console.log("Local private workstation (do not share URL): " + url);
  } else if (command === "validate") {
    const [bundlePath, draftPath] = await Promise.all(
      args.map((p) => externalPath(p)),
    );
    const bundle = JSON.parse(await readFile(bundlePath, "utf8"));
    bundle.approvedFingerprint = process.env.P75_APPROVED_REGISTRAR_FINGERPRINT;
    const { session, records } = await loadSession(bundle),
      draft = JSON.parse(await readFile(draftPath, "utf8"));
    const source = records.find(
      (r) => r.source.sha256 === draft.sourceSha256,
    )?.source;
    const errors = source
      ? validateDraft(draft, session, source)
      : ["Unknown source"];
    console.log(
      JSON.stringify({
        status: errors.length
          ? "BLOCKED"
          : "UNSIGNED DRAFT VALID; P75 SIGNING AND CUSTODY REQUIRED",
        errors,
      }),
    );
    if (errors.length) process.exitCode = 3;
  } else if (command === "handoff") {
    const [input] = await Promise.all(args.map((p) => externalPath(p)));
    const b = JSON.parse(await readFile(input, "utf8"));
    const r = reviewHandoff(
      b.source,
      b.receipts,
      b.registry,
      process.env.P75_APPROVED_REGISTRAR_FINGERPRINT,
    );
    console.log(JSON.stringify(r));
    if (r.issues.length) process.exitCode = 3;
  } else
    throw Error(
      "Usage: authorize ABS_REQUEST ABS_REGISTRAR_KEY ABS_NEW_AUTH | serve ABS_BUNDLE | validate ABS_BUNDLE ABS_DRAFT | handoff ABS_PRIVATE_SIGNED_BUNDLE",
    );
}
