# Recognition learning audit — November 23, 2026

## Decision

Retain working main `4d7c6e35ed345ead79c3e248c6eeb6429456d624`. No new model, preprocessing or confirmed-example change is justified by this audit. No application code, production/staging, private account/photo, separate Mission branch or Drive Duel change was made. The November 23 trend refresh is preserved. No main update or deployment is requested by this report.

The isolated audit branch changes only a workflow comment to trigger the existing no-deploy real-photo benchmark plus this report/evidence. All runtime bytes match main. The workflow's commands and confidence gates are unchanged. This avoids replacing historical model executions or promoting unvalidated research merely to produce a new commit.

## Current-main verification

Read latest main commits, `public/clothing-memory.js`, `public/local-worker.mjs`, the complete `public/recognition-engine.mjs`, October 14 `docs/automatic-outfit-crop-results.json` and the newer October 26/November 9 recognition reports. Main since November 9 differs only in `public/trend-data.json`.

- Current production build and **261/261** existing Node tests passed locally, zero failures/skips.
- All eight recognition/memory/preprocessing/vector/outfit assets are byte-identical to validated November 9 commit `8c3355350303399e9edc2e98beaf9de15d601282`.
- Latest-main [Node](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45213909118), [mobile capture](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45213909029), [WebKit import/persistence](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45213909065), [private backup/recovery](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45213909044) and [Cloudflare deployment](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45213909032) all completed successfully.
- [November 22 nightly run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45040681172) completed successfully: two selected mobile-emulation attempts, **14/14 category matches each**. These are licensed fixtures, not physical-phone or universal-accuracy evidence.
- Confirmed-example retrieval continues to exclude unconfirmed predictions, duplicate supporting photos/items and the query itself; subtype conflicts and stale/cross-item suggestion application are guarded. Similarity threshold 0.9 and two independent confirmed references remain unchanged. Source reference data continues to come from the signed-in account's own item list; no private item list was inspected here. Weekly model proposals remain tentative until a person accepts/saves them.

## Fresh locked-photo rerun

[November 23 actual FashionCLIP Chromium run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/45218783717), immutable audit source `3a8de933081ee5fe19272259984abcd71d79c251`: **SUCCESS**. All 59 licensed fixture hashes were verified; all per-photo regression checks passed; zero inference runtime errors. The only executable-tree difference from reviewed main is a comment in the workflow YAML.

| Frozen cohort | November 9 category matches | November 23 category matches | Prior/current exact subtype matches |
| --- | ---: | ---: | ---: |
| Reviewed 32 | 32/32 | 32/32 | 23/32 |
| Holdout garments | 8/13 | 8/13 | 4/13 |
| Fresh regression 11 | 11/11 | 11/11 | 6/11 |
| Negative controls | 3/3 rejected | 3/3 rejected | Not applicable |

Every evaluation object and every per-photo prediction, strong/review flag, reason, detail and tentative-color result matches the committed November 9 baseline. The original October 14 26/32 and 7/13 reports are historical, not the current baseline. Category counts include review-only results; strong outputs occur on 31/32, 7/13 and 9/11 garments. All three actual-feature retrieval sets still produce **zero qualifying proposals**. No image accuracy gain, automatic learning gain, neural self-training or calibrated confidence is claimed.

Known accepted subtype mismatches remain `commons-0064` Jacket→Blazer, `commons-0003` T-shirt→Sweatshirt, `commons-0014` Blouse→Tunic, `commons-0078` Sneakers→Ankle boots. Holdout abstentions remain `commons-0016`, `commons-0036`, `commons-0059`, `commons-0062`, `commons-0095`. Current provisional labels and exposed regression sets cannot justify new blind accuracy/color/mask claims or universal identification.

## Newer Mission 1 draft: current-head validation failure

Reviewed [PR #1175](https://github.com/nickhaney916-lang/Closet-Current/pull/1175), [assignment #1172](https://github.com/nickhaney916-lang/Closet-Current/issues/1172), its current source `e182b72c6ee457836251cd7aa927181f3b11c757`, full `research/mission1-parallel88/REPORT.md` and exact-head Actions. The PR body includes earlier green ancestor receipts. They do **not** validate the current head.

[Current-head no-deploy run #44556555823](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44556555823) **FAILED**:

- Source/targeted job succeeded and inherited Node/build steps passed.
- Desktop browser job **135674055253** failed in **Desktop Chromium WebKit native original photo and owner review**.
- First failing assertion: `scripts/test-m1-owner-pair-admission-846.mjs:158`, expected no failure but received **`P88_SOURCE_DRAFT_STORAGE_CHANGED`**, `writeCount:0`, `cas:null`, owner message **Could not save changes. Try again.**
- Earlier P82 Chromium/WebKit policy substeps logged success, but the following P846 owner-review case failed. Do not call the complete browser suite green or infer which engine failed from prior log lines alone.
- The genuine public-human-photo job in that run was **SKIPPED**. The separate current-head camera/Node workflow succeeded; it does not erase the failed no-deploy browser gate.

The assertion proves the exercised save was blocked; it does not by itself prove an incorrect save, determine whether the test fixture or application comparison is wrong, or diagnose the separate native ONNX/WebKit crash. The failed draft is left untouched and must not be promoted. Reproduce its draft/storage-state mismatch and rerun its complete exact-head browser suite in the already-owned Mission 1 workstream before integration. No new PR, comments or messages were sent.

The same research report contains historical **already-exposed** Fashionpedia metrics: 16 photos / 53 human instance polygons; conservative footwear split 27/53 IoU matches, 50.94% recall, 67.50% precision, 13 false positives. Unrestricted all-class splitting added six false positives without additional matches and was not promoted. These are instance-mask diagnostics on a different exposed dataset, not improvements to today's 59-photo category/type benchmark or a new sealed model evaluation. Blind label, subtype/color, physical Android/iPhone and authorized hosted-owner evidence remain blocked. Family Alpha #255 remains HOLD.

## Handoff

Keep the current working runtime. The next evidence-supported integration action is the failed Mission 1 owner-review save case; new recognition/preprocessing tuning also needs independent source-disjoint, rights-verified human labels and masks. Preserve Unknown/review, user-confirmed examples, original photos, automatic capture/crop/save behavior on main, manual corrections and private storage. No unsupported model/threshold experiment or research merge was made.

Machine-readable baseline comparison, all 59 compact outcomes, source hashes and failure coordinates: [recognition-learning-review-20261123.json](recognition-learning-review-20261123.json).
