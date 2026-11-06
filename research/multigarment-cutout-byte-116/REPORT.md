# Closet Current — Priority #116 / MULTI-GARMENT-CUTOUT-BYTE-IDENTITY-116

**Independent research-only source safety · Family Alpha Issue #255 HOLD · NEVER MERGE / DEPLOY production or existing staging.**

## Verified parent and scope

Priority #114 [draft PR #668](https://github.com/nickhaney916-lang/Closet-Current/pull/668), exact parent commit `268306135eba9d49ac00e8fe9842955bec59c6bf`, verified [dedicated no-deploy CI #42308965004](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42308965004), 1,049/1,049 Node PASS. The inherited P112 true original-source mobile 3D evidence remains separate and untouched.

This research priority intentionally does **not** overlap Parallel #48's real-image recognition accuracy, acquired human mask ground truth, or actual model inference evaluation.

## Root cause

Existing opt-in INDEX-04 evaluated a multi-garment `segmentHint` as a “verified cutout” using `verified:true`, a syntactically valid `cutoutSHA256` and `originalSHA256` text, but **never read or hashed the actual cutout image bytes**. The old test passed an arbitrary 64-hex string and expected automatic closet indexing. An original JPEG SHA proves only original image identity, **not per-garment isolation, object category, genuine cutout content, or its association with the full-frame model prediction**.

## Implemented correction

1. Require a real JPEG `segmentHint.cutoutImage` carrying decodeable JPEG-marker-validated bytes; require source SHA match to the separately verified original JPEG, a different data JPEG than the original, `verified:true`, no clipping and a deliberate `ownerReviewedInstance:true` assertion. Without these, cutout identity is NOT verified.
2. Independently SHA-256 the decoded cutout JPEG bytes with `cryptoProvider.subtle.digest` and demand an **exact** comparison with `segmentHint.cutoutSHA256`. The cutout and its reference are included in P114's transient in-memory source fingerprint; after async digest, reject source mutation or account-owner change before any decision is returned.
3. Preserve the existing per-owner saved-wardrobe exact-source-and-cutout duplicate check: two distinct byte-verified cutout SHA identities from the same original are not forcibly merged; an identical verified cutout is rejected as a duplicate.
4. **For all multi-garment photographs, require human category/type review** even with a byte-verified cutout. The existing full-photo recognition result does not independently prove that a suggested “Jeans” label belongs to the particular photographed segment. Never silently auto-index it.
5. Preserve the positive verified original single-garment path, existing confirmed colors and category review, and original JPEG hash identity. No image bytes, owner IDs, SHA values or private saved items appear in output.

## Acceptance tests

- Real SHA digest of original and different cutout JPEGs; 2 cutouts in one photo; exact cutout duplicate versus distinct cutout behavior.
- Falsely asserted cutout metadata, missing raw bytes, wrong SHA, wrong original SHA, wrong source JPEG, malformed/non-JPEG, clipped or non-owner-reviewed segments and original/cutout identical bytes all force user review.
- Controlled asynchronous pause between first original SHA and second cutout SHA checks; changing image bytes or switching owner must be rejected.
- Existing opt-in INDEX-04 compatibility updated from unjustified automatic acceptance of metadata-only cutouts to actual byte proof and per-instance manual review.
- Original single-garment indexing remains eligible when independently source SHA verified.
- Full inherited application, image index, owner isolation and research Node suite; strict five-file no-deploy CI.

## What remains UNVERIFIED

Cutout JPEG SHA proves **cutout identity only**. It cannot establish pixel-level correspondence to the original, that the garment mask was produced by genuine learned instance segmentation, that the mask has acceptable IoU, that full-photo model classification belongs to this cutout, or that a human actually reviewed the instance (a flag is not independent reviewer evidence). Pending independent evidence, multi-item recognition is explicitly review-only. Automatic real-photo model accuracy, separate garment extraction on physical devices, actual signed account RLS, cloud atomic write, human 10/10 3D, WebGL and production deployment are outside this priority.

**Family Alpha HOLD · no production, existing staging, public default app, 3D renderer, personal images, deployed model or project merge.**
