# Mission 1 — Real garment photographs: locked-source, disjoint-split recognition audit

**Release: FAMILY ALPHA HOLD #255. Research only. No merge or deploy.**

## Why this mission exists

The application has a real browser recognition worker and 59 licensed public JPEG fixture bytes with SHA-256 and historical category/type labels. However, the old evaluator can overstate what is actually proven: it does not cryptographically re-read the actual image bytes; scoring may conflate **top-one diagnostic suggestions with automatically accepted items**; missing result/error rows can corrupt denominators; split contamination and unaudited source licenses can go unnoticed; and no dataset supplies independently reconciled human segmentation masks or garment color labels.

This research stream does not compete with Parallel #66's segmentation/source-edge work or Parallel #67's mobile workflow. It independently audits the recognition outcome against the real source bytes.

## Implementation

- New strict CLI `scripts/audit-mission1-real-photos.mjs` reads **all 59 actual licensed JPEG files** and SHA-verifies each against `benchmark/locked-photo-sources.json` while validating attribution and license. Reject any missing, malformed, duplicated, cross-split or unverified source. The 32 curated / 16 held-out / 11 fresh sets must be **disjoint by both ID and exact image bytes**.
- Every inference row including errors is required. No missing predictions, duplicates, unexpected extra outputs, forged strong/category-review combinations, wrong owner filename, bad latency, unverified result or silent score drop permitted.
- Count **top-one category and subtype accuracy** separately from correct/incorrect **automatically indexed garments** and category-only review. Count nonclothing **negative false positives, runtime errors, abstentions** and full denominators separately. Report per-category confusion and Wilson 95% uncertainty intervals.
- The report always shows **zero new independently human-adjudicated annotations**, **zero verified pixel segmentation masks**, **zero independently labeled colors** and **zero annotated multiple-garment outfits**. Pixel IoU, boundary-F1, multi-instance recall, primary-color accuracy and photo-to-3D scores remain `null`, never fabricated 0 or 100.
- The new no-deploy CI job executes the **actual existing FashionCLIP local Web Worker** in real Chromium on all 59 byte-verified files across all three disjoint sets, stores source/worker/model SHA receipts, regression logs and the results/evidence in GitHub Actions artifacts. Earlier fixed recorded results are historical replay only, not new live inference.
- Seven unit/adversarial test cases verify that wrong-SHA JPEG, non-licensed source, split overlap, missing/duplicate outputs, runtime error with stale positive prediction, unsafe auto-indexed types and false-positive nonclothing inputs cannot be hidden.

## Honest limits and external blockers

Existing `verified:true` benchmark labels were historically curated, not supplied with two independent blind human annotator receipts. This audit may measure agreement against those labels, but **cannot certify independently human-verified accuracy**. At this time there is **no independent polygon-mask ground truth, color labels or validated full-outfit instance annotations**. The data includes licensed public Wikimedia items that are not necessarily representative of real family smartphone captures. Running 59 real classifications does NOT certify all-category real-world recognition accuracy.

A truly completed Mission 1 needs:
1. A new consented or permissively licensed, multi-source, photo-camera-realistic **held-out** dataset with locked source bytes, pre-inference independent human labels, adjudication records, per-garment polygon masks, item-level primary color, and full-outfit instance masks.
2. Real browser inference through the same production recognition path on this new dataset, with category/subtype, color, mask IoU, boundary-F1, and multi-instance precision/recall denominators.
3. Separately measured acceptance targets agreed with the owner, with strong auto-indexing precision prioritized over risky guessed category.
4. Actual authenticated capture → human review → closet save with safe owner recovery tested without production account data.
5. Independently inspected visual evidence and physical-device sampling if available.

**No fake independent-human labels may be generated merely to pass a release gate.** Do not move to Mission 2 on an evidence-free claim. Parallel #66 remains a separate effort; this scope does not overwrite it.

## Owner-decision gate

This branch and any CI success remain *research delivery*, not mission-complete release acceptance. The next step must be real independent annotation of diverse permitted photographs, not another synthetic owner approval. Family Alpha #255 stays HOLD; main/staging/Supabase unaffected.
