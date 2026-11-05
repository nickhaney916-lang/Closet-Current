# MODEL-ASSET-RELIABILITY-52 — actual pinned FashionCLIP mobile asset loading

**Research only, draft PR #610, never merge or deploy.** Parent: verified SNAPSHOT51 PR #609 final exact SHA `17d9b859252b08a763cb452804f08c717ae141cc`, dedicated no-deploy CI #41959517997 SUCCESS, Family Alpha #255 HOLD. Production, existing staging, any unrelated app, private actual customer account, and hosted cloud are unchanged.

## Reproduced evidence: genuine 512-dimensional vision encoder, not a stub

The initial no-deploy CI #41961254120 SUCCESS tested the actual `public/local-worker.mjs` against the SHA-pinned archived licensed JPEG `commons-0003` in Chromium and WebKit at 390 CSS px. Both returned a finite normalized **512-dimensional FashionCLIP Q8 ONNX feature vector** with actual `fashion-clip/whole-v1/0f99955d944c39bfd9d035a02ac273c7a44a406b` model key and **3 candidate labels** (top category Tops). There were **zero failed network requests, zero intercepted unknown model assets, and zero photo uploads** during that isolated worker test. Evidence artifact #13384803506.

The observed model resource trace had HTTP 307 from `huggingface.co/ff13/fashion-clip/resolve/<exact revision>/config.json` and `preprocessor_config.json`, leading to HTTP 200 at `huggingface.co/api/resolve-cache/models/ff13/fashion-clip/<exact revision>/...`. ONNX model weights redirected with HTTP 302 to the observed official Xet CDN; pinned JS + WASM loaded via jsDelivr. HTTP redirect statuses are **not model failures**.

## Source-level browser-QA defect

The inherited native browser harness allowed only direct pinned `/resolve/<sha>/` and a few binary CDN paths. It did **not** explicitly allow official `/api/resolve-cache/models/ff13/fashion-clip/<sha>/` redirects. Work #34 PR #607 had counted 12 model-related failed requests in a mobile-width browser scenario; SNAPSHOT51 PR #609 had counted 14. Neither count alone established failed FashionCLIP inference, because the same tests observed actual crop-model suggestion results and safe manual corrections. The independent worker trace proved successful actual model execution and identified the normal cache-redirect endpoint. The native browser model path must be audited without falsely interpreting HTTP redirect or a deliberately blocked QA route as a classifier outage.

`asset-policy.mjs` is **research-QA-only** and permits GET over HTTPS only from exact pinned `ff13/fashion-clip` revision `0f99955d944c39bfd9d035a02ac273c7a44a406b` direct resolve/cache routes, pinned jsDelivr Transformers.js 3.8.1 dist assets, and known Xet CDN destinations. It blocks uploads, other model versions, other repositories, deceptive hosts and insecure HTTP. No change to the deployed app, model package, model weights, production security policy or classification threshold.

## Reproducible full native acceptance

Dedicated no-deploy workflow builds the unchanged app; runs inherited Node tests plus new origin safety tests; requires real Chromium+WebKit 390 actual worker features; then runs the real original multi-garment JPEG → three reviewed individual crops → local FashionCLIP suggestion → human category/subtype/color confirmation → owner-private IndexedDB → one valid owned look → duplicate rejection → V4 backup/restore → logout/owner B isolation, at 320/390/430 CSS widths in both engines. Screenshots and their SHA-256, dimensions, visible pixels are independently audited. The browser run logs only sanitized network method/hostname/path/status without URLs' signed query values, token material or photo bytes. Any unknown external GET stays blocked; all non-GET uploads are forbidden.

## Scientific, mobile and product limits

This priority tests **model availability and execution**, not garment accuracy. An abstained crop is not itself a model download failure. Automatic category/subtype accuracy on the independent provisional 13-garment holdout remains far below 95%; experimental Work #34 PR #607's prompt ensemble regressed. No independently double-human-adjudicated 100–200-photo holdout, color-certification, native physical Android/iPhone, offline first load, cryptographic model weight attestation or new segmentation IoU is claimed. Keep the existing conservative user-confirmation gates, no merges or deployments, Family Alpha HOLD.
