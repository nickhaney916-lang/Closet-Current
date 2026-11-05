# MODEL-ASSET-RELIABILITY-52 — actual pinned FashionCLIP mobile asset loading

**Research only, draft PR #610, never merge or deploy.** Parent: verified SNAPSHOT51 PR #609 final exact SHA `17d9b859252b08a763cb452804f08c717ae141cc`, dedicated no-deploy CI #41959517997 SUCCESS, Family Alpha #255 HOLD. Production, existing staging, any unrelated app, private actual customer account, and hosted cloud are unchanged.

## Reproduced evidence: genuine 512-dimensional vision encoder, not a stub

The initial no-deploy CI #41961254120 SUCCESS tested the actual `public/local-worker.mjs` against the SHA-pinned archived licensed JPEG `commons-0003` in Chromium and WebKit at 390 CSS px. Both returned a finite normalized **512-dimensional FashionCLIP Q8 ONNX feature vector** with actual `fashion-clip/whole-v1/0f99955d944c39bfd9d035a02ac273c7a44a406b` model key and **3 candidate labels** (top category Tops). There were **zero failed network requests, zero intercepted unknown model assets, and zero photo uploads** during that isolated worker test. Evidence artifact #13384803506.

The observed model resource trace had HTTP 307 from `huggingface.co/ff13/fashion-clip/resolve/<exact revision>/config.json` and `preprocessor_config.json`, leading to HTTP 200 at `huggingface.co/api/resolve-cache/models/ff13/fashion-clip/<exact revision>/...`. ONNX model weights redirected with HTTP 302 to the observed official Xet CDN; pinned JS + WASM loaded via jsDelivr. HTTP redirect statuses are **not model failures**.

## Exact root cause: a *different* SegFormer worker was deliberately blocked

We retrieved and inspected the **actual native browser acceptance artifact** from the diagnostic run #41961694799. It showed **13 failed model requests and 13 explicitly policy-blocked requests**, and every one was the same GET:

`https://huggingface.co/Xenova/segformer_b0_clothes/resolve/a2489ea8e7ec1ee912190546bad31a4906ccca76/preprocessor_config.json`

This is the *optional garment-segmentation detector*, **not** the `ff13/fashion-clip` category/subtype classifier. The test intentionally restricts external model traffic to FashionCLIP, so automatic SegFormer initialization is blocked while manual reviewed crops and actual FashionCLIP suggestions continue. The earlier report's 12–14 `huggingface.co` failed requests were therefore **incorrectly conflated with classifier failures**. The first standalone worker test independently proved 512-dimensional FashionCLIP inference with **zero failed asset requests** in Chromium and WebKit. These conclusions concern the research browser network gate, not a guarantee that every physical mobile device will cold-load reliably.

The real pinned FashionCLIP asset response chain also included normal HTTP 307 from the versioned `/resolve/<sha>/config.json` and `preprocessor_config.json` to HTTP 200 under `/api/resolve-cache/models/ff13/fashion-clip/<sha>/...`. Those cache redirects were **successful, not the recorded 13 failures**. The research-only `asset-policy.mjs` now explicitly allows the exact pinned cache redirect and normal official model CDN over GET HTTPS only. No arbitrary external model requests, unpinned model, uploads or token/query logging are allowed.

`modelAssetFamily52` and the independent audit enforce separate reporting: **FashionCLIP failed asset requests must equal zero** and all remaining blocked model requests must be exact expected SegFormer assets; unknown failures fail CI. The intentionally blocked SegFormer means **automatic multi-garment detection is NOT validated in this workflow**. It requires a separate genuine instance/IoU/recall benchmark before Family Alpha.

**Transient environment observation:** a later GitHub Actions worker probe succeeded in Chromium but hit one WebKit `model_download` worker error even though its logged CDN requests had HTTP 200 and none were policy blocked. The earlier same worker proof passed WebKit. This intermittent error is *not silently counted as successful reliability*. It could reflect ONNX/WebKit initialization under concurrent CI resource contention; its device-level cause remains unproven. Production and staging are not modified to paper over it.

## Reproducible full native acceptance

Dedicated no-deploy workflow builds the unchanged app; runs inherited Node tests plus new origin safety tests; requires real Chromium+WebKit 390 actual worker features; then runs the real original multi-garment JPEG → three reviewed individual crops → local FashionCLIP suggestion → human category/subtype/color confirmation → owner-private IndexedDB → one valid owned look → duplicate rejection → V4 backup/restore → logout/owner B isolation, at 320/390/430 CSS widths in both engines. Screenshots and their SHA-256, dimensions, visible pixels are independently audited. The browser run logs only sanitized network method/hostname/path/status without URLs' signed query values, token material or photo bytes. Any unknown external GET stays blocked; all non-GET uploads are forbidden.

## Scientific, mobile and product limits

This priority tests **model availability and execution**, not garment accuracy. An abstained crop is not itself a model download failure. Automatic category/subtype accuracy on the independent provisional 13-garment holdout remains far below 95%; experimental Work #34 PR #607's prompt ensemble regressed. No independently double-human-adjudicated 100–200-photo holdout, color-certification, native physical Android/iPhone, offline first load, cryptographic model weight attestation or new segmentation IoU is claimed. Keep the existing conservative user-confirmation gates, no merges or deployments, Family Alpha HOLD.
