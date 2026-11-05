# Closet Current — SOURCE-NEAR-DUPLICATE-67

**Research only. Family Alpha Issue #255 HOLD. NO merge, production/staging modifications or deployment.** Exact independently verified starting parent: LABELSYNC66 SHA `d032e1a1957944883c7f589cd05f663d01c3f68b`, [Actions #42075383974 SUCCESS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42075383974), 696 Node tests, 12 actual mobile-browser cases and 72 SHA-audited corrected-title screenshots.

## Reproducible real defect

A manual crop from a source-verified whole-outfit photograph is assigned `manual-[round(x*1000)]-[round(y*1000)]-[round(width*1000)]-[round(height*1000)]`. The owner-private atomic writer previously rejected repeated **exact** `sourcePieceKey`s, but slightly moving the crop by 1–3 pixels creates a different key for the **same physical shirt** in the **same unchanged JPEG**, so repeated import could add a misleading duplicate row to My Closet.

## Exact narrow mitigation

1. Source-bound `nearDuplicateSourceRegions67` compares confirmed saved review rows, not detector proposals. It requires exact immutable source SHA, owner identity, stored verified original JPEG identity, true crop review and human-confirmed category/subtype/color, plus at least one manual-marked crop. No human review can be inferred from a model confidence score.
2. When the two source-relative rectangles have intersection-over-union **at least 0.98**, and all source/human identity criteria match, flag a near duplicate even if the coordinate-rounded manual keys differ. Different owners, different photos, significantly different crop rectangles, different confirmed subtype/category/color and two separately identified automatic `seg-` instances are NOT suppressed.
3. The final safeguard executes inside the existing **single IndexedDB `items` readwrite transaction**, after exact `sourcePieceKey` and ID checks. This prevents interleaved browser tabs from bypassing an earlier UI preflight. Any near duplicate aborts the *entire* new batch. The original verified photo and prior closet records remain untouched; a separate genuinely different garment can still be saved.
4. Prevent immediately submitted two near-identical manual crops within the same new batch as well. This is conservative duplicate risk mitigation, **not** proof of clothing instance equality. Two human-confirmed garments with almost identical bounds and the same subtype/color might exceptionally be distinct; in that case a person must adjust the crop to show independently distinguishable regions. No claim of eliminating every false duplicate.

## Real browser acceptance and scope

Six native original licensed 800×750 photo, true crop editor, real owner-private IndexedDB browser flows (Chromium and WebKit at widths 320, 390, 430): save three independently confirmed garment crops; reimport the **same unchanged original source JPEG**; manually shift the SAME shirt's crop left/right by approximately a few original pixels, producing a **different exact sourcePieceKey**; confirm same human garment category/subtype/color; attempt atomic save and verify an explicit **near-duplicate** rejection with exactly three existing rows, no partial new rows, preserved Style My New Clothes outfit, V4 backup/restore and second-account isolation. Compare genuine before and shifted-crop mobile screenshots and independently SHA/dimension/nonblank audit 66 new images. Rerun six inherited manual original-photo private E2E cases.

A synthetic human-completed test action is **not** an independently annotated image and does not improve FashionCLIP/SegFormer recognition accuracy. Parallel #36 learned instance separation, #37 larger real-photo independent ground truth, and #38 photorealistic cloth fitting remain separate. This branch contains no new learned model, model weights, image upload, production change, staging deployment, or actual phone hardware QA.

## Mandatory evidence

A strict allowlist exact-parent no-deploy workflow, full inherited Node regression suite, 12 new adversarial node tests, all 12 Chromium/WebKit native owner-private browser flows, SHA screenshot audit, draft PR, exact HEAD and successful GitHub Actions artifact. **Scientific automatic recognition remains NEEDS REWORK. Family Alpha HOLD.**
