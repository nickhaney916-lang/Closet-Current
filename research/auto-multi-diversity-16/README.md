# AUTO-MULTI-DIVERSITY-16 — SegFormer original-photo visible-region research (DRAFT / HOLD)

**Exact starting parent:** PR #571 SHA `0236182f72b29a7b4d4924f0b3f5754cb9956690`. **Family Alpha #255 HOLD.** No merge or deploy; production, staging, customer data, authentication, private wardrobe and all parallel subtype recognition branches must remain unchanged.

## The verified gap

Prior PR #571 succeeded in actually running SegFormer in Chromium and WebKit against **one unique public original photograph**, but approximate three-region matching is not proof of population accuracy or instance-level segmentation. The existing production `outfit-capture.js` sent the worker request without the `multi24` flag; the worker took its one-person-only fallback, so flat lays and duplicated same-semantic garments were not covered by prior model evidence. The legacy automatic saving gate allowed an owner-unconfirmed generated proposal. This research branch explicitly activates source-safe multi-piece proposals and makes every new generated piece require Adjust/confirmation before indexing.

## Reproducible licensed 15-photo cohort

`candidate-sources.json`: 15 distinct public Wikimedia Commons source pages with attribution, page URL and stated license. `scripts/discover-auto-multi-16.mjs` verifies exact JPEG bytes via SHA256, length and dimensions, runs in five rate-limit-safe three-photo CI slices, generates PREVIEW contact sheets only and never uploads raw source photographs. The fully source-locked `provisional-15-locked.json` records 58 visible regions, 57 with supported existing SegFormer families, one unsupported necktie; it was frozen **before** new SegFormer inference. These are assistant-annotated preliminary geometry boxes, **not independently validated HUMAN-reviewed bounding boxes**. Therefore no scientifically accepted garment precision/recall can be claimed from this dataset until a genuinely independent reviewer verifies and freezes the visible boxes. This distinction is enforced in tests, source schema and audit outputs.

Recommended future human-review process: inspect every unchanged original at full resolution, correct the `regions` boxes and categories by an independent person not exposed to model outputs, attach annotator/review version and independent region mask files if pixel mask IoU is desired. Then freeze a new untouched held-out cohort prior to any tuning.

## Model and algorithm

`public/outfit-worker.mjs` still loads unchanged `Xenova/segformer_b0_clothes` with identical pinned revision and runs real inference on the original (or on an explicitly disclosed downscaled COPY of a huge source required by the existing worker limit). It exposes a research `measure16` result containing TWO groupings of the **same real logits**: original `visibleGarmentGroups24` and proposed `visibleGarmentGroups16` from `visible-proposals-16.mjs`.

The new postprocessing retains disconnected instances of a semantic class; preserves two shoe subregions inside one shoe-pair wardrobe-review proposal; adds conservative Hat, Sunglasses, Belt, Bag, Scarf candidate components; preserves visible thin objects by never filling in unknown hidden pixels; and flags Upper garment as a likely layered-category review rather than inventing jacket-vs-shirt identity from the same SegFormer class. Each proposal requires human review. The implementation cannot split visually touching shirt/jacket layers if SegFormer emits one uniform `Upper garment` map, and it does not claim to. The product capture worker now uses `multi16:true`. User items originating from it are marked `requiresOwnershipConfirmation` and are never silently saved as confirmed clothing. Existing original photo, SHA256 provenance, crop editing, owner-private atomic save, V4 recovery and Style remain separate from model approval.

## Actual-model acceptance CI

Pinned no-deploy `auto-multi-diversity-16-no-deploy.yml` builds real app, runs complete inherited Node suite and new positive/negative tests, source-scope locks, exact-original 15 photo hash checks. Five matrix browser jobs run 3 unique source originals each through real Chromium **and** WebKit SegFormer with mobile screenshots at 320, 390 and 430 (90 total expected) and export sanitized per-photo baseline/updated box evidence. An independent final job checks 90 screenshot SHA-256 values and scores per-browser class-compatible one-to-one precision, recall, misses, duplicate detections, wrong categories and background/extra proposals at **bounding-box IoU >= 0.30**, not segmentation mask IoU.

Each source may have a derived JPEG model input (2048px bound) if the original exceeds existing image dimensions/size; the unchanged original is still displayed and identity SHA verified, and every derived input is explicitly recorded. The model must still execute; no fabricated predictions or fallback values count as successful inference.

All model-result percentages with this preliminary dataset are *PROVISIONAL BOX-ANNOTATION PROXY MEASUREMENTS*, not confirmed full scientific precision/recall. There are no independently reviewed pixel-level masks, hence `truePixelMaskIoU=null`.

## Unverified release and scientific claims

Physical Android/iPhone Safari/Chrome, signed two-owner Supabase RLS, arbitrary photo-to-163-bone photorealistic 3D, comprehensive original-quality shoe boundary/straps, fully automated correct instance IDs for touching layered clothes, qualified non-clothing negative controls, and genuinely independent human-labeled test boxes remain **NOT VERIFIED**. Browser-emulated mobile is never physical device testing. No private customer/family source is in CI; no upload endpoints; no changes to the user's default production or staging.

**Scientific quality verdict stays HOLD irrespective of CI infrastructure green** until actual independent human annotations and held-out instance/mask validation exist.

## Explicit Add Missed Garment and evaluator invariants

A failed or partial automatic segmentation leaves the original available in Photo results with a **Add a missed garment from this photo** button. It opens the existing drag-and-brush crop UI on the unchanged original; the result becomes a new unconfirmed owner-bound item, never an automatically verified index entry. Adding a duplicated crop fails without deleting the original; an account/session switch vetoes the action; detection may fail without losing existing proposals. Each new item still requires manual category, subtype and color confirmation via Adjust. This user-driven fallback does **not** count as an automatically detected garment in research metrics.

The headline baseline/updated model-precision and recall measurements use the **identical proposal unit** for both algorithms: one grouped wardrobe candidate per connected visible region (a pair of shoes counts once). The updated branch additionally exposes optional left/right shoe subregion geometry and independently reports shoe-part box matches, not part of the headline before/after denominator. Because there is no independent human-certified pixel mask ground truth, all true mask IoU and related measures remain NOT MEASURED.
