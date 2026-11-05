# AUTO-DETECTION-SAFETY-55 — No unreviewed SegFormer crop can enter private closet

**Research only.** Based on the exact verified Priority #52 HEAD `05107691cee5bbf7429b824aa0b1444fcb70ae5b`; parallel #35 PR #612 is independent and must not be merged into this branch. Family Alpha #255 HOLD. No production/staging deployment or merge.

## Why this is needed

Parallel #35 / PR #612 actually executed pinned SegFormer on 15 licensed photos with 24 single-annotator boxes in Chromium and WebKit: 45 model proposals, 10 correct IoU≥0.5 family-box matches, **35 false proposals**, **14 misses**, precision **22.2%**, recall **41.7%**. It is semantic segmentation, not learned object-instance segmentation; pixel-mask IoU and independently verified category/subtype/color were not measured. This is **not suitable for automatic trusted wardrobe indexing**.

## Specific verified code defect

Before SAFETY55, `addDetected(raw,session)` set `cropReviewed:true` as soon as an untrusted SegFormer region arrived, despite no person ever inspecting or adjusting that region. `canConfirmScene32` enforced `cropReviewed` only for manually drawn crops, and the final commit similarly checked `x.manual&&!x.cropReviewed`. A person still had to confirm category/subtype/color, but an incorrect detector box could be accepted **without explicitly reviewing the crop**. Model mask confidence is uncalibrated and is not a correctness score.

## Research-only mitigation

1. Auto-generated SegFormer proposals start with `cropReviewed:false`, exactly like manually suggested flatlay boxes.
2. The per-card UI visibly marks unreviewed regions, explicitly instructs opening **Adjust crop/mask**, and exposes an auditable `data-crop-reviewed55` status.
3. The existing crop editor sets `cropReviewed:true` only on the person's explicit Save crop action, without changing original JPEG source identity.
4. `canConfirmScene32` now requires `cropReviewed===true` for **all** detected/manual garments; category, valid subtype, color, and human checkbox still required.
5. Final pre-transaction save validation rechecks `cropReviewed===true`, so UI bypasses cannot trust an unreviewed detection.
6. Existing source SHA, original photo, owner isolation, atomic save, duplicate protection, backup/restore, and model evidence sanitization are unchanged.

## Evidence and limitations

Dedicated no-deploy CI runs strict parent/source allowlist, full inherited Node tests, and six real browser Chromium/WebKit × 320/390/430 original JPEG → three manually reviewed crops → owner-private saved outfit → V4 backup/restore and cross-account checks, with screenshot evidence. The new Node tests explicitly prove an unreviewed auto proposal cannot pass confirmation, even with score=1, a valid person flag, and plausible labels.

**Scientific accuracy is unchanged:** SegFormer remains 22.2% precision and 41.7% recall on the 24-box cohort; no instance separation, pixel IoU, independent label adjudication, or physical-device acceptance is claimed. This branch is a risk containment measure, not a segmentation improvement. An automated browser case that injects actual SegFormer regions and verifies the UI's unreviewed-to-reviewed transition is still a separate acceptance requirement unless explicitly verified in CI.

**Verdict:** Engineering acceptance requires the dedicated exact-HEAD CI to succeed; scientific detection NEEDS REWORK. Family Alpha stays HOLD.
