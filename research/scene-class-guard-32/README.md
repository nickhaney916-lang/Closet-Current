# SCENE-CLASS-TRUST-32 — conservative scene-aware human classification

**Research only; Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) HOLD.** Parent is immutable verified [PR #588](https://github.com/nickhaney916-lang/Closet-Current/pull/588) commit `27e7f583a2a63f99f5e59e110ec7df84bf0cd214`. NEVER MERGE OR DEPLOY. This is a safety/UX mitigation, **not improved semantic segmentation accuracy or calibrated category recognition**.

## Specific observed regression risk

Real independently re-run ONNX evidence from PR #588 shows the segmentation model returned 0/2 matched annotated shirts in an overlapping-shirt photo and 0/3 in a multi-item flat-lay, with false skirt/dress class labels. The actual native research review screen previously prefilled a category when the model returned a single category (including Dresses) regardless of `personDetected`, and prefilled the model's uncertain scene color. Although a confirmation box was required before save, a user could click through those incorrect prefilled facts.

## Exact improvement

`sceneReviewDefaults32` is now applied in the native owner-private, multi-garment review UI before any candidate is displayed. An automatic candidate receives **Uncategorized**, **Unknown** type and a **blank color** unless **all** of these conditions hold: model explicitly returns `personDetected: true`, single supported category, unclipped region, and a finite model mask score at least 0.95. The threshold is an exploratory interface-safety policy **not a statistical accuracy guarantee**. When all gates hold, the category/color are still only an unverified, reviewable suggestion and `itemType` remains Unknown.

The user must deliberately select a valid category, valid subtype and nonempty color before the confirmation checkbox becomes enabled, and the exact same policy is checked before atomic group save. A manually drawn region must also have its crop reviewed. Every uncertain region remains available to inspect, edit or remove, even when no person is present. None of the SegFormer labels, class masks, region polygons, original source JPEG bytes, SHA-256, crop pixels, owner session, private database, outfits, 3D surfaces, model weights or photo assets is modified.

## Honest verification

The new deterministic Node tests cover flat-lay false Dress, overlapping false Skirt/Bottoms, missing/invalid person evidence, clipped and ambiguous mask hints, real manual type/color confirmation and unchanged source proposal contents. A dedicated NO DEPLOY workflow runs **the entire inherited application build and all Node regression tests**. The added actual native review UI/browser tests use **two real browser engines × three mobile widths (320/390/430)**, testing synthetic JPEG source SHA and **fake proposed masks**, explicitly not calling the ONNX model. Six PNG screenshots and SHA/width audits are attached to CI. It verifies no auto-saving, source identity, withheld auto labels/colors, successful explicit human classification, previous manual flat-lay fallback, and account-switch cancellation. These browser tests do not constitute new-photo segmentation ground truth.

**Still open:** independently human-labeled true pixel masks on new original photographs, genuine instance separation of overlapping shirts, new model/evaluation candidate for wrong-class flat-lay outputs, verified category/color recall, two real hosted accounts and RLS, real iPhone/Android hardware, and true photograph-to-humanoid 3D fit. No scientific quality or pilot release gate is cleared.
