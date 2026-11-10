# Closet Current Mission 1 — P773 Review-only original-logit *unseeded* garment recovery

**FAMILY ALPHA HOLD #255. DRAFT / UNMERGED / UNDEPLOYED. Research source/test/CI only.**

## Motivation: measured new-source failures, not synthetic pixels

P772 newly selected before inference eight real Fashionpedia/Pexels publisher-polygon images, with 20 publisher human polygons. Across 16 source semantic regions, **actual unchanged SegFormer mean IoU 37.50% (Chromium), 36.38% (WebKit)**, with **5/16 zero predicted regions** in both. One photo was flagged by P769 as visually similar to older development material and is quarantined. Original P767 cross-stream [PR #767](https://github.com/nickhaney916-lang/Closet-Current/pull/767) already implements an independent *seeded* boundary-growth review proposal; it can enlarge an existing garment but **cannot find an omitted class/garment with no original seed**.

## Source-logit-only missing region proposals

New `research/mission1-unseeded-region-773/original-logit-review.mjs` takes actual raw frozen ONNX SegFormer logits, dimensions, the exact app-derived unmodified `clothingLabelMap`, and nonoverlapping existing seed/grown review groups. It recalculates the original map, refuses source mismatch/NaNs/overlapping or class-spoofed group masks, and NEVER replaces a confident original source pixel.

Only for currently unclassified original source pixels, it recovers the strongest **existing raw logit class** among semantic garment groups 4/5/6/7/9 when its original 18-way (shoe class 10 remapped to 9) softmax probability is **>=0.50** with original top-two margin **>=0.07**. Bounded 4-connected islands require at least max(12, area×0.002) pixels, mean confidence >=0.54, max 30% source area, no contact with a seeded/grown same-class garment and at most eight review candidates. Eligible candidates preserve exact source-pixel membership and report **Unknown subtype/color, `needsReview:true`, `accepted:false`, `autoIndex:false`**. No model or wardrobe modifies original photo, no owner approval is fabricated; pixels with insufficient evidence stay unknown.

The P773 browser harness is a scoped copy of original PR #767 pinned A/B harness, with **three arms on the exact same original public JPEG** in Chromium and WebKit:
1. Unchanged original SegFormer + existing wardrobe source-group masks (truth benchmark)
2. **PR #767's exact prior seeded boundary-growth** proposal (source/seed preserving)
3. PR #767 boundary growth plus P773 **new source-logit unseeded review-only candidates**.

The harness scores **independent external human polygon instance IoU >=0.5**, class region segmentation and inferred false positives across ALL photos (including missing cases), preserves all exact JPEG/worker model fingerprints and screenshot SHA evidence, and renders third illustrative purple-overlay candidates against green actual publisher human polygons. Candidate added pixels and matched human instance IDs are audited; **a failure to gain or an increase in false positives must be reported, not suppressed**.

Source selection is re-executed from verified P772 deterministic immutable algorithm, preserving the 59+six original source-history quarantine and one P772 visual-similarity flag. The eight samples are **already exposed after P772**, so P773 results are cross-stream evaluation evidence, **not an untouched held-out benchmark**. The original P767 candidate existed before P772, but the new P773 thresholds were engineered after learning the P772 baseline failures; no inference gain may be described as independent generalization. The research action does NOT change the shipped segmentation worker or deploy any feature.

Nine focused adversarial pure-Node tests ensure actual source logits, class-specific disconnected regions, no invented garment without evidence, wrong-class source protection, no automatic acceptance, adjacency to original seeds excluded, upper bound on proposed masks, spoof/tamper refusal and source immutability. Final CI must run exact-head pinned-parent five-file scope, build and full application regression tests as well as genuine two-browser P772 real-photo A/B. Unit photos/signatures do not prove independent human outcomes.

## Scientific and release limitations

Publisher polygons do not provide two blinded independently checked humans, exact subtype/primaryColor or original photographer source-page proof; Fashionpedia validation can have appeared in a pretrained SegFormer model; no physical-phone signed-owner camera/closet acceptance, independent photo-to-3D fidelity or release approval. This is a **review proposal**, not a source/mask correction automatically trusted by the app. No automatic owner photo upload/recognition/3D fitting is authorized based on a new category island. One-to-one masks and positive classes require real human review before save. NEW untouched consented human-label data will be needed AFTER any model tuning.

**The entire Mission 1 remains incomplete. Parallel PR #767 owns seeded garment boundary growth; P773 develops an independent unseeded candidate and tests them side-by-side without merging. Family Alpha HOLD #255 persists.**
