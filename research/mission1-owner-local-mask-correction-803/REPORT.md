# Closet Current Mission 1 P803 — manual pixel add/erase on ephemeral local source mask

**FAMILY ALPHA HOLD #255; DRAFT, UNMERGED, UNDEPLOYED.**

## Verified parent, distinct from human truth

Based on P802 exact green source HEAD `8a92e7878e0e8aabb658ceed653781f6e02db8f1`
([draft PR #804](https://github.com/nickhaney916-lang/Closet-Current/pull/804),
[2/2 CI jobs #42925549599](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42925549599),
1,654/1,654 Node tests). P802 produced an owner-seeded 512x512 capped
experimental connected-color source-pixel region, **NOT a verified
mask or SAM2 inference**.

## Actual change

Adds temporary, source-private **manual Add pixels / Erase pixels** in
native Adjust after P798/P800 original SHA-verified owner point+rectangle and
P802 local color preview. A mouse, touch-derived click or arrow/Enter keyboard
brush is projected to the same bounded thumbnail. The deterministic pure
correction primitive keeps brush centers and all paint inside the unchanged
owner-source rectangle, caps radius/memory and 1,024 edits, rejects
cross-source/cross-owner or stale/unapproved pixel-receipt arguments, and
copies the overlay without mutating the prior source bitmap.

The owner may discard the preview or finish the local correction. Finish is
**not** an acceptance or Save action; neither the original JPEG nor the
private draft/closet is written. No category/subtype/color is inferred or
pre-filled. A change of owner, draft, box, seed or dialog closes and wipes
the temporary preview. No cloud API, external upload or model checkpoint
is touched.

Research-only opt-in includes all prior flags plus
`mission1OwnerMaskCorrection803=research`. Normal capture and private
review behavior remain gated and unchanged.

## Required exact-head CI before saying complete

1. New five-unit tests verify original public JPEG SHA/owner point+box and
   reversible synthetic-pixel add/erase, cross-owner/source rejection,
   box clipping and mask memory/brush limits. Synthetic test pixels are
   **not** independent real-human segmentation truth.
2. Full Node tests and production-independent build must pass, with only
   seven allowlisted paths and zero release/cloud/auth/model changes.
3. Automated actual Chromium and WebKit original-JPEG SegFormer to native
   Adjust through P800 box, P798 point, P802 pixel preview, P803 manual
   **pointer and keyboard corrections**, discard, reviewed category/subtype/
   color manual input, private fixture IndexedDB save and duplicate deny.
   Simulated browser gestures, NOT genuine independent owners/physical phones.

## What remains unresolved

This manual brush still edits a weak **color-based** preview, not a trained
SAM2 original-source garment segmentation result. It is not meaningful
mask IoU acceptance, a true blind human polygon adjudication, commercial
photo license approval, signed hosted two-user cloud/physical phone
validation, or permission to merge/release. The next substantive milestone
is locally safe real original-owner-prompted SAM2-style segmentation with
measured mobile resource budget and human-corrected source-bound masks.
P799's publisher-derived oracle boxes cannot be reported as human accuracy.

**Mission 1 NOT 100% complete. Family Alpha issue #255 stays OPEN.**
