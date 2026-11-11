# Mission 1 P822 — an ambiguous source cannot regain AI confidence through Crop photo

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Pin and scope

This is a narrowly isolated native safety correction **based on the independently verified P820 exact HEAD** `3f1d13cd2916ffd67d6ed8102675963a513125aa`, [PR #849](https://github.com/nickhaney916-lang/Closet-Current/pull/849), [2/2 successful no-deploy jobs](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42969638458). Its scope is exactly four paths: `public/app.js`, a new native-handler adversarial test, this report, and a no-deploy workflow. Does not change a model, segmentation thresholds, original JPEG sources, authentication, private cloud, app release, staging or production. The separate experimental threshold study P821 [draft PR #852](https://github.com/nickhaney916-lang/Closet-Current/pull/852) remains isolated, not automatically merged here.

## Actual native bug found

P818 and P820 correctly mark disconnected model upper-clothing source pixels for original-photo human review, suppress classifier and estimated color on the initial candidate and in Adjust, and require a checkbox for one *specific* garment before private save. However, `cropClothingPhoto(item)` in the real `public/app.js` previously still called a model classifier inside its `analyze` callback and automatically applied `ClothingDetails.fillColor` and `applyLocalChoice` in `save`, even when `item.segmentHint.sourceDisconnectedReviewRequired===true`. Merely cropping a semantic *union* does not turn it into independently verified garment count, category, type or color.

## P822 correction, research-only until verified

For a flagged ambiguous original:

1. The native crop `analyze` refuses model classification altogether. The photo quality/signature can still be checked during crop save, **but no estimated/injected color is applied**.
2. `save` ignores an injected photo classifier choice. The edited crop is kept for manual review; category/type/color revert to `Uncategorized`/`Unknown`/blank instead of silently carrying inherited/injected suggestions.
3. Cropping cannot override the original owner ID, original JPEG and SHA, source hash verification flag, original outfit identifier or source-ambiguity marker using fields in the crop result.
4. Any previous owner-one-garment checkbox provenance is invalidated by a changed crop. Original Adjust must be revisited to explicitly acknowledge **this** crop, and no test or model prediction is presented as an independent human benchmark.
5. An ordinary unflagged garment keeps the existing classification/color crop behavior.

`tests/mission1-ambiguous-photo-crop-822.test.mjs` executes the **extracted actual app.js handler**, including hostile crop-result metadata, an injected classifier choice, prior-owner-confirmation invalidation, ordinary unflagged regression and failed-image atomicity. These are **synthetic unit/regression inputs, not genuine original-photo accuracy evidence**. The dedicated no-deploy workflow also runs the app build, complete Node tests and prior P818/P820 checks; exact final-head green GitHub Actions must be observed before describing P822 as verified.

## Known limitation and next engineering gate

This correction closes auto-confidence bypass during cropping; it does **not** establish that every newly cropped image passes the existing independent cutout-SHA and original-owner atomic reviewed-save contract. That end-to-end source/cutout binding must be separately exercised with genuine full-original capture, human single-garment crop, real signed owner private draft save and recovery across Android Chrome and iPhone Safari. Existing reviewed-save admission remains the authority: **do not relax its source/cutout hashes or owner/instance verification to make a crop pass**.

The published development-exposed frozen SegFormer B0 source comparison remains only **10/23 matched original garment masks (Chromium), 9/23 (WebKit)** under the normal semantic class-union algorithm, with many false candidates. Naive automatic disconnected source splitting was worse. The ten public publisher originals and 23 original polygons are NOT an independently held-out two-blind-human acceptance benchmark. Mission 1 still needs at least 100 unique rights-cleared prospective photos, 30 held-out garments and ten negative controls, two genuinely distinct blind human labelers plus adjudication, acceptable measured category/subtype/primary-color and instance/boundary IoU metrics, commercial model-license assessment, measured physical-phone model memory, hosted signed two-owner privacy, and the owner's separate release approval.

**No merge, deployment, staged or production modification is authorized. Family Alpha HOLD #255 stays OPEN.**
