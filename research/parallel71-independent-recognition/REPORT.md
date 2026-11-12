# Closet Current Parallel #71 — independent recognition evidence and no-wrong-save acceptance

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED.** Tracking issue [#929](https://github.com/nickhaney916-lang/Closet-Current/issues/929). No main/staging/production, hosted Supabase, private wardrobe, model weights, photo uploads, or account mutation.

**Pinned verified baseline:** Mission 1 P841 draft PR #926 `899f1962d53546ec15ff62e8af3a1bcbf937dbdb`; source CI [#43283565709](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43283565709) succeeded. Parallel #70's pairing PR #928 is a **sibling**, not merged into this study. Its human shoe-pair ownership labels are also missing.

## Research question and honest boundaries

Goal: identify why a photo can produce an erroneous inventory unit despite a visible review state, and establish source-SHA-preserving, license-checked, reproducible numeric diagnostic acceptance. Source cohort is **16 genuine original public Commons photos** in `benchmark/manifest-holdout-16.json`, with 13 garment categories and 3 negatives, original byte SHA-256, publisher attribution and licenses in `benchmark/locked-photo-sources.json`.

The historical annotations are publisher-reviewed and **development-exposed**. They are not a new genuinely blind source-disjoint human-held-out cohort. No independently verified ground-truth colors, pixel masks, disconnected small-component labels, owned shoe pairs, or full outfit wardrobe-unit counts are present for these 16. It is scientifically invalid to compute a value for those metrics or tune confidence thresholds on this cohort. We intentionally make **zero** confidence threshold or ML score change. Do not count an abstention as a correct recognition.

### Previously verified real-photo baseline (P834, not newly measured in #71)

[P834 draft PR #888](https://github.com/nickhaney916-lang/Closet-Current/pull/888) at exact head `beb7f27b18f70faa32c94ca2ac5d4260e83f0f0f` ran [six-job no-deploy Actions #43144750475](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43144750475). **Chromium:** correct accepted broad category **8/13**, automatic correct broad category **7/13**, wrong automatic broad category **0/13**, exact known type **4/10**, accepted broad type **4/13**, wrong automatic subtype **3**, negatives rejected **3/3**, runtime failures **0**. **WebKit:** corresponding category **7/13**, auto correct **7/13**, wrong auto category **0/13**, exact type **4/10**, accepted broad type **4/13**, wrong auto subtype **3**, negatives **3/3**, runtime failures **0**. Both engines confidently confused `commons-0003` T-shirt as sweatshirt, `commons-0014` blouse as tunic, and `commons-0078` sneakers as ankle boots. The 16 photos are historical development diagnostics, not real users' future photo accuracy.

**Baseline-vs-candidate:** The #71 code diff deliberately leaves `public/recognition-engine.mjs`, `public/local-worker.mjs`, recognition vectors and the SegFormer worker untouched. Recognition quality is therefore **not claimed improved**. The CI re-runs actual FashionCLIP on 16 publisher originals for regression diagnostics only. A new independent blinded score remains **BLOCKED/UNKNOWN**, not silently copied from P834. Color, mask IoU/boundary and footwear pair count are **UNKNOWN (0 valid human-labeled truth cases)**.

## Concrete safety defect and containment

The P841 `adjustPhoto()` editor used a disabled Save button but did not reject another script-generated `submit` event while `savePiece()` awaited storage. A second event can pass the photo-checked category/type/color state and execute a **second storage write for one already reviewed pending image**. This threatens one-source-one-owned-item integrity; a disabled button is not a re-entrancy guard.

The #71 `?recognitionAcceptance71=1` research-only flag adds a per-dialog pending-save lease checked at the start of the actual submit handler, acquired before the first asynchronous storage write and released on failure for a legitimate retry. Default application behavior is unchanged because the flag is **OFF by default**. The editor still requires owner's photo acknowledgement and rejects unknown category/color from P841. No automatic approval or inferred photo truth is added.

`scripts/test-parallel71-repeat-submit.mjs` extracts the **actual `app.js` functions** and in genuine Chromium and WebKit dispatches two synchronous submits before the first mocked private save settles. It must show **2 attempted writes in the unchanged P841 parent** versus **1 attempted write in the opt-in #71 candidate** at 320, 390, 430 CSS widths. This test uses a **synthetic JPEG-free 1px fixture and simulated storage** (not real model inference nor actual signed two-owner cloud). Parent failure is deliberately expected and verified; candidate block is required.

## Reproducible source and metric provenance

- `scripts/parallel71-evidence.mjs` verifies 16 unique original SHA-256 identities, publisher URLs, source/manifest alignment, per-photo Commons license record, exact independent browser/partition receipt SHA and all source ID order. It consumes the existing unchanged P834 **actual FashionCLIP** numeric browser receipts and independently calls `aggregateReal16Audit834` to reject missing/forged source or count information.
- Four real original-photo partitions (Chromium/WebKit × fixed eight-photo a/b halves) use `scripts/download-reviewed-photos.mjs` to verify each original downloaded JPEG SHA-256. Files are passed into the actual signed/pinned no-account browser worker; no photos or private account data enter artifacts. One final numeric ledger contains per-source category/type mismatches and confusion counts, explicit denominators, evidence source index hashes, and **UNKNOWN** fields for unmeasured components.
- `tests/parallel71-evidence.test.mjs` adversarially rejects absent license, substituted image/hash, duplicate source, fake publisher truth, moved/duplicate partition IDs and altered manifest SHA. Existing P834 conservation tests run inside the full Node suite.
- Dedicated strict-parent **NO DEPLOY** CI checks exactly six scoped files, builds the app/no-account trial, runs full Node regressions, actual extracted-source browser before/after, all four original-worker real-photo halves, and final fail-closed numeric aggregation. Never commit publisher JPEGs, log owner's data, or upload original photos.

## Independent acceptance gates

| Gate | Current research outcome |
|---|---|
| Real historic publisher photo identity, permission and SHA | Verifiable in source manifests and runtime SHA checks; must pass exact-head CI |
| Browser parent duplicate-submit reproduction | Must pass before/after CI; synthetic photo, actual source |
| New independently human-labeled source-disjoint acceptance photos | **BLOCKED — 0** |
| Independently annotated primary color | **UNKNOWN — 0** |
| SegFormer mask IoU / boundary / orphan recall | **UNKNOWN — missing matched human masks in this complete workflow** |
| Shoe-pair owned unit count and overmerge/undersplit | **UNKNOWN — 0 human ownership labels** |
| Raw probability calibration / ECE / safe threshold | **UNKNOWN — no blind validation and numeric score receipts for calibration** |
| Real camera → actual worker → owner review → signed private closet | **BLOCKED — no authorized genuine two-account photo acceptance** |
| Android Chrome / iPhone Safari physical devices | **NOT RUN; scripted desktop Chromium/WebKit is not physical-phone certification** |
| Family Alpha invitation / release | **HOLD #255 — NOT AUTHORIZED** |

## Required continuation

Do not use these 16 previously exposed photographs to choose thresholds. Obtain fresh permitted, independent human category/subtype/color/mask/pair labels, freeze source SHA and splits **before** scoring, and then run held-out real segmentation/FashionCLIP + actual authenticated local-save acceptance on isolated permitted accounts and physical Android/iPhone. Until then **recognition accuracy and final end-to-end acceptance are incomplete**, regardless of green tests.

## Verified genuine-original and browser-safety checkpoint — November 12, 2026

[NO DEPLOY Actions #43294058433](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43294058433), exact research HEAD `934c751c52c18f5560e1f585e895cfbf57f294f4`: **7/7 jobs SUCCESS** (native evidence/scope/build/full Node suite; extracted-source browser test; four genuine-original FashionCLIP browser partitions; fail-closed numeric aggregate). **305/305 full Node tests passed, zero failures/skips**, plus targeted three adversarial provenance tests. Camera/indexing branch checks are tracked separately and do not authorize release.

**Actual new #71 re-run on the same 16 historic original public JPEGs**, same immutable original manifest and human publisher label definitions, P841 recognition model/worker unchanged:

| Metric (actual #71 current branch) | Chromium | WebKit |
| --- | ---: | ---: |
| Garment originals / nonclothing originals | 13 / 3 | 13 / 3 |
| Correct accepted broad category (auto or conservative category review) | **8/13** | **7/13** |
| Correct automatic category | **4/13** | **4/13** |
| Wrong automatic category | **0/13** | **0/13** |
| Known exact-type matches / truth-supported exact-type labels | **4/10** | **4/10** |
| Predeclared accepted broad-type matches / garment records | **4/13** | **4/13** |
| Wrong automatic subtype | **0** | **0** |
| Entirely unresolved/abstained garment category | **5/13** | **6/13** |
| Nonclothing correctly rejected | **3/3** | **3/3** |
| Runtime exceptions | **0** | **0** |

**Real-photo failure ledger:** earlier confidently wrong `commons-0003` (T-shirt→Sweatshirt), `commons-0014` (Blouse→Tunic), `commons-0078` (Sneakers→Ankle boots) were now safely **category-only review / subtype Unknown**, not automatically wrong saved types. Five unclassified garments in both engines are `commons-0016` (Blouse), `commons-0036` (Skirt), `commons-0059` (Dress), `commons-0062` (Jacket), `commons-0095` (Boots). `commons-0049` (Dress) had a Chromium-only category-review result and was unresolved in WebKit. This is **reduced unsafe admission but not improved exact subtype accuracy**.

**Baseline comparison:** P834 historical same original cohort (an earlier code checkpoint) automatically categorized **7/13** correctly in each engine but produced **3 automatic wrong subtype** predictions. P841 inherited intervening P837/P838 confidence safeguards, and #71 itself did **not** alter a model, worker, subtype rule or threshold. Therefore the **7→4 automatic acceptance and 3→0 wrong automatic type changes cannot be attributed to #71's model-quality work**, nor accepted as blind held-out improvement. The #71 isolated safety improvement is the actual repeated-save event admission described below.

**Real-browser failure-before/pass-after:** in both Chromium and WebKit at **320, 390 and 430 CSS px**, the actual P841 parent handler attempted **2/2 storage writes per paired synchronous submits**, whereas the #71 opt-in handler attempted **1/2**. **Six parental baseline exposures and six candidate containment checks passed**, with zero page exceptions; six additional P839/P841 reviewed-photo editor browser cases passed. Test fixture uses synthetic 1px photo data and controlled in-memory save, **not actual model detections/hosted accounts/physical phones**.

**Source and archival receipts:** manifest SHA-256 `05d6604566dad006221d643c55df24ce719e83652c424046e043851d6534dc27`; Commons original source-index SHA-256 `6064df4fafe5633313f9825d349746332ae14ecf4d32f3a058b56131e7b234f3`; all 16 individual original JPEG SHA-256 checked at inference. Downloadable numerical-only [ledger artifact #13977837910](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43294058433/artifacts/13977837910), ZIP SHA-256 `6ce182f1619bb8aa0b2ab6cb3247697118df3bd551f0e560fd21a97b3c175d14`. No JPEG, photo bytes or private user data were uploaded to evidence artifacts. The public-domain `commons-0086` legitimately has license text without a Creative Commons license URL; fail-closed provenance now allows only that exact licensed/public-domain form, not missing attribution.

**Next exact-head requirement:** any subsequent report or log-format-only research commit must receive its own full seven-job no-deploy verification; see the draft PR's final HEAD/status. This verified checkpoint does **not** fulfill independent new human source labels, color, masks, pair ownership, real signed private closet or physical phones. **Family Alpha HOLD #255 remains OPEN; no merge/deploy.**
