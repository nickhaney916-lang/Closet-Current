# SEGMENT-EVIDENCE-SANITIZATION-50 — restrict untrusted SegFormer hints in owner-private saved wardrobe

**Main controller, RESEARCH ONLY, NEVER MERGE OR DEPLOY.** Existing production and staging untouched; Family Alpha [Issue #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) HOLD. Work Parallel #34 / [PR #607](https://github.com/nickhaney916-lang/Closet-Current/pull/607) independently owns actual classifier improvement. This priority does not change any model, thresholds, segmentation quality or photo interpretation.

## Exact verified starting source

Main-controller [PR #606](https://github.com/nickhaney916-lang/Closet-Current/pull/606) final commit `eaab0dbebca1d16b0c356cf82afde5ff334548e2`, successful [dedicated no-deploy Actions #41953432999](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41953432999): 601/601 Node, 42/42 Chromium/WebKit 320/390/430 native browser research scenarios, 73 SHA/pixel-authenticated screenshots, real FashionCLIP on licensed source and reviewed crop, source/crop hash inputs, human-owned persisted wardrobe and V4 backups.

## Confirmed source defect

Prior `research/multi-garment-capture-01/atomic-group.mjs` persisted untrusted local segmentation worker metadata **verbatim** as `segmentHint:piece.hint||null` plus `sourceSegmentationConfidence:piece.hint?.confidence??null`, and used JavaScript truthiness `maskApplied:!!piece.maskApplied`. The real SegFormer worker currently sends just `categories`, `types`, `confidence`, `clipped`, but the final owner-private atomic commit did **not enforce** this contract. An unexpected/malicious future worker result or contaminated client fixture could write arbitrary nested pixel masks, copies of photos, private arbitrary metadata, huge byte arrays, non-finite or unbounded scores, or non-boolean masks directly into an owner-private garment and its V4 backup. This creates unnecessary metadata retention and can falsely imply mask confidence, even though the user's category/type/color remains verified separately.

## Exact source guard

New pure `sanitizeSegmentHint50` in the **existing** trusted atomic module:

- Keep only current taxonomy-recognized top-level categories (`Tops, Bottoms, Dresses, Outerwear, Shoes`) and known, category-compatible garment subtype hints.
- Remove duplicates; scan at most the first 24 submitted labels for each field; cap to 5 category hints and 6 compatible subtype hints. Unsupported `Accessories`, random nested JSON, tokens, raw JPEGs/pixel maps or unknown metadata are all omitted.
- Keep `confidence` **only** if a finite actual Number between 0 and 1, inclusive. Confidence is an uncalibrated mask score and never asserts correct clothing type. Keep `clipped` only if actual boolean. Missing/invalid confidence and clipped are `null`, not forged defaults.
- If a crop was manually marked, store **no segmentation-model evidence**, even if an attacker supplies `hint`. A manually positioned crop does not prove a real SegFormer result.
- `maskApplied` is true only for literal `piece.maskApplied===true`. Strings such as `'false'`, positive integers, and objects never become true.
- Sanitize the candidate hint **before** `structuredClone` of the immutable selected-pieces snapshot and **again** at the final persisted `verifiedRecord24` boundary. Do not waste processing on oversized nested opaque hints while waiting for source SHA, owner DB or worker callbacks.
- Preserve all original bytes/source SHA, user-confirmed category/type/color, 3D readiness false, human decisions, atomic transaction, duplicate/CAS rejection, #49 crop input SHA, #47 unsafe model subtype review, #46 crop-pixel unverified color, #43 strict taxonomy validation and #44 human learning. No schema/auth/cloud write, model weights or release changes.

## Reproducible acceptance

1. Full build and entire inherited **601 Node tests** plus 10 new strict unit/owner IDB tests using actual SHA-pinned licensed archived JPEG `commons-0003`: valid SegFormer evidence; hostile photo/secret/mask injection; 0..1 finite confidence; strict mask booleans; manually marked crop false provenance; malformed/very large arrays; exact original JPEG/user Navy T-shirt unchanged; two-piece private atomic IDB and backup-compatible JSON with secrets excluded; caller post-snapshot malicious hint mutation; invalid user type rejects whole transaction.
2. Six **new actual Chromium/WebKit** × 320/390/430 owner-private local-browser IDB tests import the real `atomic-group.mjs` + source-proof module, using a genuinely decoded/cropped licensed original photo and synthetic hostile worker hint with nested masks and secret strings. Confirm sanitized exact record, original SHA/bytes and human T-shirt/Navy, duplicate rejection, second owner isolated, zero external requests, 12 independent PNG screenshot SHA/width/dimension/nonblank audits. **These six tests do not claim actual SegFormer inference.**
3. All inherited 36 browser owner/photo epoch/save finality/worker freeze/color authority/taxonomy/confirmed learning safety cases.
4. All inherited six real pinned FashionCLIP original+reviewed JPEG crop→human-confirmed owner-private wardrobe/outfit, backup/restore, owner-B fixture isolation browser tests across Chromium/WebKit 320/390/430, unchanged 73 screenshot PNG hash/dimension/pixel audit and six nonblank contacts. Thus 48 browser scenarios total if all tests pass. Also preserve frozen 35-photo provisional paired color research (11/35 whole scene vs 18/35 reviewed region), **not** a new scientific recognition result.
5. Exact parent SHA no-deploy strict touched-file whitelist, success on exact final PR HEAD, credible immutable evidence artifacts.

**Scope limits:** This prevents *unvalidated segmentation evidence retention*, not automatic garment classification errors, 95% subtype/color accuracy, better actual instance masks, full signed hosted cloud RLS, 3D fitting, physical iPhone/Android, or provider-model attestation. No newly adjudicated human labels. Scoped engineering PASS only on exact-HEAD workflow success; scientific recognition quality still NEEDS REWORK and Family Alpha remains HOLD.
