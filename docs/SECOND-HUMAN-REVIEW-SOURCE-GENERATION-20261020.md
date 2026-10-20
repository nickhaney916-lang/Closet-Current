# Independent second reviewer — prevent stale photo and consent

October 20, 2026. Stacks on draft PR #68 and changes ONLY the offline second-person review editor plus isolated tests/workflow. No production deployment or original-photo recognition/indexing changes.

## Fixed failure mode

Previously, `approve-garment-mask-native.html` called one async `load()` on each photo/draft selection but did not associate pending `File.text()`, original-photo byte hashing or `Image.decode()` with the current pair. An earlier load could finish after a newer selection, potentially showing or approving a mask for an obsolete selected original. Also, the approval checkbox could be set while a file was still loading and then carried into the completed pair.

## Contract now

- Every new photo or first-person draft selection increments a generation, immediately clears the previous image, mask, approval eligibility, magnifier and checked consent.
- All asynchronous steps check that same generation before they publish any source pixels, physical garment ID, source hash, mask or reviewer-visible status. Previous decode object URLs are still revoked.
- New complete review-pair publication clears premature confirmation checkboxes, requiring the human to inspect and affirm the exact pair after it is ready.
- A late failure from a superseded file never rejects or wipes a current valid source.
- The exported first-person RLE is not changed. The human-reviewed reference remains a *synthetic browser test* until real independent people review a source original and legal proof is audited.

## Actual test

Mobile-size Chromium emulation deliberately holds one first-draft `File.text()`, replaces the selection, and then releases the obsolete promise. A second scenario delays old-photo `Image.decode()`, loads a newer physical item/photo, and releases the old image. It asserts latest photo and mask identity, disabled stale export, fresh per-pair confirmation, immediate revocation on wrong photo, and an internally matched native-grid export from the synthetic positive path. These tests are not physical Android/iPhone testing or independently measured real-photo segmentation quality.

**Unresolved:** Twelve original photos, zero genuine human-approved full masks, zero independent real-photo false-removal or false-inclusion measurements, unverified legal clearance and production fitting. The real second reviewer must still check physical garment category, shorts/skirt, sleeves, interior cutouts and all source pixels. No paid inference or Drive Duel changes.
