# Mission 1 P818 — fail-closed owner review for disconnected same-class garment source

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Actual-model evidence driving this decision

Direct parent P817 [draft PR #844](https://github.com/nickhaney916-lang/Closet-Current/pull/844), exact fully green `457e1c2b5c29dd93f306492c2422bce5fc4f6299`, [NO DEPLOY CI #42965575888](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42965575888) ran immutable SegFormer B0 over all 10 **already exposed** real publisher original photos, all 23 original polygon garments, using true Chromium and WebKit. Actual one-to-one same broad-family model-raster IoU>=0.50 results:

| Genuine development source model arm | Chromium TP / FP / FN | WebKit TP / FP / FN |
| --- | --- | --- |
| NATIVE existing class-union grouping | **10 / 9 / 13** | **9 / 10 / 14** |
| Naive multi24 disconnected source candidates | **7 / 21 / 16** | **7 / 18 / 16** |
| Earlier bounded model-logit review growth | **8 / 20 / 15** | **8 / 17 / 15** |
| Further source-conserving P776 component proposal | **8 / 20 / 15** | **8 / 17 / 15** |

**Decision:** Source-connected pieces are **not proven to be distinct real garments**. Simply auto-splitting made model accuracy WORSE on the true original publisher masks, so we explicitly reject adoption of that algorithm as an automatic item saver. But retaining native grouped class-4 regions as a *confirmed single shirt* is also unsafe when the model separated their source pixels into two substantial disjoint islands.

## Implemented P818 product-code research changes

- `public/outfit-segmentation.mjs` preserves all existing original model class-4 union mask pixels/bounds and existing group count. It also counts retained connected original model segments with the pre-existing conservative area filter and requires manual review if there are **at least two substantial disconnected upper-clothes components**. A substantial component has >= max(12 pixels, 0.1% image raster, 8% family mask). The flag is **model source geometry only**; it never claims two human-recognized garments. Shoes, including a disconnected pair, are explicitly not flagged. Tiny fabric speckles don't produce phantom owner-review blockers. No inferred unknown body pixels.
- `public/outfit-worker.mjs` propagates `sourceDisconnectedReviewRequired:true` for this ambiguous normal-path B0 upper region, with source island count as diagnostic. It suppresses palette estimation from a likely mixed photo. Existing atomic all-or-nothing JPEG source batch integrity (P813–P815) and person detection remain unchanged.
- `public/app.js` now sets `requiresOwnershipConfirmation=true` on such a source when adding it to the review queue. Its normal `recognizeItem` early guard retains the existing original image and asks the owner to confirm whether there is one garment or several by inspecting/cropping the original, then choosing category/subtype/color manually in Adjust. It **does not automatically classify, assign color, auto-save, invent a second item, or mark this as owner-approved**. Other nonambiguous standard outfits continue their existing capture/recognition workflow.

## Tests and no-deploy acceptance

- Two source model-raster geometry tests verify a 2-island class-4 union is preserved but flagged, one full top plus a tiny spot stays unflagged, and disconnected shoes stay paired with no upper-garment warning.
- Actual existing worker source run in Node VM with two high-confidence disconnected upper regions verifies one aggregated top, no automatic color, one explicit owner-review hint, full retained pants and shoes, and exactly one successful complete `done`.
- Real `public/app.js` extracted `candidate` and `recognizeItem` source functions execute in Node's VM with mock owner capture photo, proving the ambiguous source stays queued for manual review and the classification/save callbacks are **not invoked**; ordinary unflagged garment retains the previous default.
- Dedicated NO DEPLOY GitHub workflow `.github/workflows/mission1-native-disconnected-review-818-no-deploy.yml` must pass exactly eight narrowly allowlisted source/test/CI/report paths on pinned green P817 parent; focused tests, whole native build and full Node regression. **Do not report P818 as verified before final HEAD tests finish**.
- This branch does not deploy or modify model weights, source photos, camera private uploads, hosted Supabase, auth, current staging/production, issued saved outfits, or the Family Alpha hold.

## Remaining genuinely missing Mission 1 acceptance

There is STILL NO legally independently rights-cleared truly unseen original holdout with two distinct verified blinded human annotators supplying per-garment mask/category/subtype/color, and measured model accuracy still misses at least 13 of 23 publisher source instances on this exposed development set. Source memory/latency not tested on physical Android Chrome/iPhone Safari, no true local phone SAM2 segmentation with bounded RAM, no independent signed hosted two-owner release acceptance, and no explicit owner-authorized release. Browser automation and Node fixtures are not independent human ground truth. This **cannot** be called 100% completed recognition or release-ready. Family Alpha HOLD #255 stays in force.
