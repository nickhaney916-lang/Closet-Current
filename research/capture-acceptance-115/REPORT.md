# Closet Current — Priority #115: independent real-photo capture-to-closet acceptance

**Research only. Family Alpha Issue #255 remains HOLD. Never merge or deploy. Production and existing staging were not modified.**

## Exact source and real model evidence inspected

P115 branches directly from verified P114 commit `268306135eba9d49ac00e8fe9842955bec59c6bf` (draft PR #668). P114's no-deploy run #42308965004 passed 1,049/1,049 inherited and new Node tests, including 9 async original-JPEG race tests and 12 camera/index tests.

I downloaded and independently SHA-256 checked the actual P86 GitHub Actions artifact: **artifact #13469256263**, run [#42143014654](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42143014654), source commit `51aeeacdff675175f89a17dd64c1281e0aa7cee8`, artifact digest `65f72decb1ed6f62d4c45079520c7337c5fce643a4679a3eeb34ff9bd36c6c3b`. The archived source audit identifies 59 unique, byte-SHA-verified licensed JPEGs split 32 development / 11 validation / 16 locked evaluation.

Actual inference provenance: FashionCLIP `ff13/fashion-clip@0f99955d944c39bfd9d035a02ac273c7a44a406b`, ONNX/WASM browser execution; pinned vision and text weight hashes are in [evidence.json](./evidence.json). The source run reports inference on 59/59 originals with zero runtime failures. P115 preserves all 16 actual locked model outputs bound to their source SHA in a compact audit snapshot; it does not modify or expose image bytes or embeddings.

## Locked-split result

The reproducible audit recomputes actual output agreement against **provisional legacy labels** only:

| Measure | Observed | Denominator | Meaning |
|---|---:|---:|---|
| Category agreement | 8 | 13 | 61.54% versus unadjudicated legacy labels |
| Subtype agreement | 4 | 13 | 30.77% versus unadjudicated legacy labels |
| Model abstentions | 5 | 13 | Counted as failures in both agreement rates |
| Provisional negative controls rejected | 3 | 3 | 100%; only three controls, not a scientific estimate |

The label categories are Tops 2/3, Bottoms 2/3, Dresses 1/2, Outerwear 1/2 and Shoes 2/3. Type agreement is Tops 0/2, Bottoms 2/3, Dresses 0/2, Outerwear 1/2 and Shoes 1/3. The raw per-photo inference and provisional label rows, exact source hashes, and abstention reasons are in the snapshot.

Observed confusions include T-shirt → Sweatshirt, Blouse → Tunic, and Sneakers → Ankle boots; several items abstained, including a jacket, dress and boots. These identify likely repair targets, but labels are not independently reviewed, so these are **provisional disagreements**, not verified model errors. The 3/3 control result is similarly exploratory.

**Scientific recognition result: UNVERIFIED / NEEDS REWORK.** The artifact has zero independent source-bound human adjudications. Therefore independent category/subtype accuracy, garment precision/recall, mask IoU, primary/secondary color accuracy, safe auto-accept accuracy, review rate and post-owner-correction accuracy are **null**, not zero or estimated. No ground truth was invented.

## Multi-garment and color findings

The FashionCLIP locked snapshot is a whole-photo classifier; it cannot establish candidate counts or garment separation. P86 additionally ran the pinned SegFormer B0 Clothes model six times on three real originals in Chromium and WebKit. Its archived coarse diagnostic was 3/8 box matches, four false proposals and five missed regions per engine. These semantic/box findings are **not** instance-mask precision, recall or IoU. The converted SegFormer repository license is unspecified and remains release-blocking. No independent garment masks or validated color labels exist; straps, sleeves, hems, shoes as pairs, and overlapping items remain unaccepted.

## Capture, review, closet, and mobile evidence

P86's prior actual browser evidence reports six FashionCLIP suggestion → human-review/correction → private IndexedDB save cases and six camera → review → wardrobe cases across Chromium and WebKit at 320, 390 and 430 CSS pixels; the respective screenshot audits were 73 and 78/78. Original-photo hash binding, confirmation-before-save, cancellation, duplicate consent, reload and synthetic test-owner isolation were exercised. P114 additionally passed source/metadata stale-async race tests. P115 did not rerun physical devices or a signed cloud account: no iPhone Safari device test, Android device test, JWT/RLS proof, or production/staging database write occurred. Browser/emulated checks do not prove physical-device acceptance.

## P115 engineering change and verification

P115 adds a source-pinned snapshot of the 16 locked real outputs, a deterministic evaluator that checks provenance, unique source IDs/hashes, abstention consistency and provisional status, and tests that reproduce the denominators and keep unsupported scientific metrics null. The evaluator expressly rejects converting this snapshot into verified accuracy.

Dedicated no-deploy GitHub Actions rechecks exact P114 ancestry and the strict five-file research-only allowlist, runs the two new audit regressions and the inherited full Node suite, and preserves the Family Alpha HOLD. No app, model, customer photo, production or staging code is changed.

## Completion status

- **Completed and verified:** P114 exact parent checked; P86 artifact digest matched; actual model/split metadata and 16 locked predictions inspected; provisional arithmetic independently recomputed; source-bound audit snapshot/evaluator/tests added; no-deploy workflow configured.
- **Implemented but unverified until exact-head Actions completes:** P115 CI and the full inherited suite on the new commit.
- **Blocked / incomplete:** independent human labels and instance masks; fresh independent end-to-end real-photo inference on accepted ground truth; validated primary/secondary colors; physical Android/iPhone acceptance; signed-account cloud isolation; accuracy after real owner corrections. Family Alpha remains HOLD.
