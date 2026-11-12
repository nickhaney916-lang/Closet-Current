# Closet Current — Mission 1 P840: Parallel #68 connected-footwear trial bridge

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED.** Based directly on independently green M1 P839 PR #918 exact HEAD `1a1c742d1dee34a78c39ecd52b3ca677d7a08f5f`. No account, staging/production, hosted Supabase, owner photo, classifier weights, or cloud changes.

## Why integrate this narrow researched change

The existing actual outfit capture worker `public/outfit-worker.mjs` runs pinned SegFormer and calls `clothingMaskGroups`; this creates **one region per semantic garment class**, combining physically separated shoes into one broad Shoes mask. Parallel #68 independent draft PR #919 (frozen research head `a8d90ae54fe312a08bb175555143c05f32cf9ee3`) evaluated separating disconnected semantic shoes into individual reviewable mask instances. On its **historical public-photo validation set** with **16 originals / 53 independently annotated human garment masks**, baseline native grouping matched **19/53**, and connected component grouping **27/53** at one-to-one mask IoU ≥ 0.5; this improved Shoes from **2/16 to 10/16** without a new model download. These are upstream research diagnostics, **not** yet independently repeated as real-photo inference with this M1 P840 integration. Source history and possible foundation model pretraining overlap mean it is NOT a sealed blind acceptance result. The reference remains imperfect; a pair of shoes does not automatically mean two separate closet items.

## P840 implemented

- Portable `public/outfit-instance-review-840.mjs` is a **source-equivalent port** of Parallel #68 `research/parallel68/semantic-instances.mjs` (only module import path and exported function name adapted). Non-footwear groups are kept unchanged; each sufficiently large connected footwear mask becomes an individually bounded **requiresReview:true** proposal. A mask never creates pixels outside the baseline accepted source mask.
- `public/outfit-worker.mjs` calls that module **only** if the message carries the literal boolean `instanceReview840:true`. No person detected -> no groups. Default/normal worker path still uses the original class-level grouping, without changed model logits or thresholds.
- `public/outfit-capture.js` adds explicit diagnostic URL `?outfitInstances840=1`, OFF by default; forwards the boolean only for that value. No UI rollout or hosted trial. Existing P839 always preserves split outfit garments as **owner-reviewed UNSAVED photo drafts** requiring manual photo/category/type/color confirmation.
- Worker pieces include transparent method/review metadata, but this metadata grants **no** saved-closet authority.
- Deliberately do NOT deduce two separate owned shoes from two observed shoe masks. Multiple components are *review proposals*, not independently verified wardrobe entries. The owner must resolve duplicates/pairs.

## Evidence and limits

New native test uses actual `clothingLabelMap`, `clothingMaskGroups`, `clothingReviewInstances840`, `cropClothingPhotoPixels`, `isolateClothingPixels`, `clothingColorSample` and actual `outfit-worker.mjs` event source. Synthetic full-person segmentation logits produce 3 original class groups vs 4 trial proposals; two shoes preserve every exact originally selected pixel with no overlap, independent pixel color samples are distinct, source crop JPEGs are preserved, owner review remains required. Additional capture tests prove default is off, explicit parameter equals 1 is on, and invalid values do not enable. Existing original native tests, app build, no-account preview bundle and strict direct-parent changed-path allowlist must pass.

Synthetic tests **cannot substitute for real photograph inference**. P68's model inference results are cited for motivation, NOT counted as P840's result. Before any promotion, run the exact optimized worker on newly externally human-labeled, source-disjoint multi-garment photographs in Chromium and WebKit, verify instance recall and unwanted duplication of shoes, and validate actual iPhone/Android performance. Keep in mind in wardrobe taxonomy a pair of shoes may correctly remain **one** closet item. As this is off-by-default, it has no effect on existing staging or production. Real-world 10/10 accuracy remains unproven.

**Decision: isolated integration trial only. Do not promote/merge/deploy or authorize family alpha.** Parallel #68 owns mask model acceptance; Parallel #69 owns mobile inference performance; Mission 1 owns owner-confirmed UI and integration.
