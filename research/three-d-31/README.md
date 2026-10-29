# 3D-31 — a verifiable, actually complete source jeans photograph, not a fabricated wardrobe item

**Development source candidate:** Wikimedia Commons **File:Jeans.jpg**, author Oktaeder (uploaded by Juanmak), source-public-domain, 435×650 JPEG. Original: https://commons.wikimedia.org/wiki/File:Jeans.jpg ; direct canonical URL: https://upload.wikimedia.org/wikipedia/commons/5/5a/Jeans.jpg.

Previous Work47 source `commons-0021` has an occluded waist and no trustworthy mask; its independent 15-photo visual assessment is **FAIL**. **Do not** fake that mask or claim PR436's optional texture shader has already rendered actual trustworthy denim.

## Implemented

A pinned-origin **research-only** downloader and conservative blue-denim alpha-proposal builder. Never modifies the original JPEG; derives `cutout-proposal.png` with original RGB preserved where alpha is nonzero. Records original SHA256, PNG SHA256, pixel count, full waistband and each lower leg coverage, transparent center-leg gap, original provenance, and explicitly `ownerApproved:false` / `releaseAuthorized:false`.

Dedicated isolated no-deploy CI restores no private assets and uploads **real JPEG, mask, matte-preview and metrics.json** for human inspection. The original JPEG SHA is established from actual bytes; until source SHA is locked and the proposed alpha is judged visually acceptable, it is **not** input to PR436 real photographed pants. Even a passing automated segmentation test is not aesthetic signoff.

## Next integration gate

1. Verify real source JPEG bytes and lock exact original SHA256; reject later changes.
2. Inspect actual full-width source/mask/matte image at neckline-equivalent waistband/crotch/leg edges, correct unacceptable areas, create real pinned transparent pixels preserving original RGB; require explicit independent human source orientation review, not automatically approve on algorithm PASS.
3. Extend PR436 `PANTS_SOURCE` whitelist for this *separate* source only when pinned provenance and cutout exist, with new exact original bytes and cutout checks, non-production research preview, genuine female/male 3D original-photo screenshots. Preserve neutral rear and all original PR435 shirt/dress paths.
4. Keep four-person Family Alpha #255 HOLD until separate owner approval, JWT/RLS, backup, physical phone tests.

No merge, production, staging, accounts, customer photos, Drive Duel, paid inference, or release claims.
