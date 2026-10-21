# Independent CLIP subtype classification experiment — October 20, 2026 Pacific

**Decision: REJECT model-agreement auto-save policy; do not modify customer recognition.** This is an actual free local independently trained encoder comparison on original garment photos, not another cropped view of the current FashionCLIP recognizer.

## Source verification and execution

GitHub Actions [#39536012914](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39536012914) reran all **59 SHA-256-verified original RGB photographs** (48 Commons sources shared between 32 reviewed and 16 holdout sets, plus 11 independently locked validation sources) using **Xenova/clip-vit-base-patch32** model revision `d15189d`, independently pretrained from the existing FashionCLIP model. Original FashionCLIP predictions are immutable artifacts from verified [PR #107 Actions #39534184672](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39534184672), never re-created from ground-truth labels. Output artifact contains all independent original-photo predictions and a per-photo comparison.

The candidate labels are the existing complete garment catalog, supplied with one frozen generic image prompt; they are never dynamically based on the photo's known type. Each row validates original photo byte checksum and original manifest label. This benchmark-only second encoder does not run in the customer browser or save customer garments, is not paid AI, and is not an allowed production classification substitute.

## Actual measured result

| Cohort | Original correct autosaves | Original wrong autosaves | Wrong autosaves caught by requiring 2-model agreement | Correct autosaves sent to review | Wrong autosaves still silently accepted |
|---|---:|---:|---:|---:|---:|
| Reviewed-32 | 30 | 1 | 1 | 7 | 0 |
| Holdout-16 | 4 | 3 | 0 | 2 | 3 |
| Fresh-11 | 9 | 0 | 0 | 3 | 0 |
| **Total** | **43** | **4** | **1** | **12** | **3** |

**Result: two-model agreement is not a solution** for the four known subtype mistakes. The model can independently disagree when FashionCLIP is correct and agree when it is wrong. Mere algorithm independence is **not proof** of human physical-article ground truth. There is no statistically sound basis to ship this second model or add a review requirement for all garment types. Avoid changing the wardrobe's current capture, mask, category, outfit rules or automatic-save thresholds.

## Test evidence and limits

Focused tests explicitly audit source-byte identity, invalid/missing predictions, second-model classification labels, source manifest integrity, and **both false review referrals and prevented incorrect autosaves**. Source-diff CI ensures no customer recognition code, vectors, masks or hosted cloud/auth data changed. Initial working branch [Actions #39536012914](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39536012914) **passed both jobs**, including **1,260 Node tests passed / 0 failed / 3 skipped** and **20 focused passes**, actual local free second-model execution, production-build and original-camera/human review source gates.

Model-specific limitations: This is a generic CLIP encoder using a small, already scrutinized garment vocabulary. It is not an independently validated garment-specific specialist, does not establish physical-mask ground truth, does not prove generalized accuracy or on-phone inference speed, and has no new untouched holdout sample. Its model revision and node package version were fixed to aid repeatability. External model weights were fetched in GitHub Actions, not customer devices.

## Next quality strategy

Focus on **independent garment-form labels** and a genuinely new, untouched test set rather than additional whole-photo crops, CLIP prompt tuning to known IDs or piling on stricter generic acceptance thresholds. Consider different physical evidence (length of boot shaft, garment seams/collars, continuity between skirt and bodice, and multiple visible layers) before classifying a source as a specific subtype. Any suggested new model must be tested on independent sources and must maintain zero new wrong auto-saves. Never insert known-photo ID overrides or claim a high broad-category score proves accurate garment indexing.

No deployment, merge, Supabase settings modifications, customer wardrobe reads, paid models or Drive Duel edits occurred. The real-photo accuracy blocker remains open.
