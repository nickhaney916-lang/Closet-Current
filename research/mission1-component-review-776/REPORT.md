# Closet Current — Mission 1 P776 disconnected garment source review

**Research only. Family Alpha HOLD #255. Draft, unmerged, undeployed. No production/staging, Supabase, source model weights or shipping public app edits.**

The unchanged model groups separate connected components of one clothing class into one proposal; this can hide multiple garments from independent human review, but disconnected parts may also be occlusions or detached fragments of one garment. P776 implements a deliberately conservative, **review-only** original-source component alternative, not a licensed or independently verified instance segmentation model.

- Input requires original 18-class SegFormer logits, a byte-for-byte recomputed source label map and the already review-required P767 seed-grown proposals.
- Refuses overlapping source masks, changed class labels, imaginary pixels, distorted seed/uncertain pixel counts, bogus growth budgets or automatic-acceptance flags.
- Decomposes masks into four-connected regions only when at least two sufficiently large separate parts exist. Small regions force unchanged output; original footwear is never split.
- Every source selected pixel is preserved **exactly once** in the alternative set. No pixels are synthesized. All outputs remain `needsReview:true`, `accepted:false`, `autoIndex:false`, confidence null, subtype and color unknown.

An added NO DEPLOY CI arm performs real SegFormer inference in Chromium and WebKit on the **eight previously exposed SHA-verified publisher-original JPEGs** with their 20 pre-existing publisher human polygons. It compares the original grouped masks, prior seeded growth and source component alternative using the same one-to-one matching metric. It reports observed TP/FP/FN and retains all source/prediction SHA receipts and overlays, including negative findings. The evaluation photos are development-exposed, **not an unseen or new human-labeled holdout**. The code does not assume a gain and no model is automatically promoted.

**What is still required for Mission 1:** new legally cleared untouched originals, independently identity-verified and truly blind human polygons with category/subtype/primary-color consensus, better actual learned segmentation for missing garments, end-to-end camera → owner-review → private-closet evidence on physical iPhone/Android, two-account isolation, and independent sign-off. No synthetic annotation is a human, and a green CI is not a recognition release pass.
