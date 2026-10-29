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


## Exact-source 3D preview (research only)

**Source locked:** original JPEG SHA256 `b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c`; provisional cutout PNG SHA256 `e51ed275c6ff1c18d37dfbb821d8994576868f707c551da4fcccea1eaa4b9441`. Both hashes are verified in browser from local byte blobs before image use. The transparent PNG retains the original visible RGB. The current proposed mask is a human-REVIEW candidate: clearly removes the carpet between legs, but tiny waistband/button-edge holes and some hem clipping remain. It is not approved for release.

`research/three-d-31/index.html` is a **localhost-only, separate experimental showroom**. A user must first see both original JPEG and cutout and explicitly check the provisional review box. No synthetic DOM click or unapproved source can apply jeans. After user review, buttons allow actual original-denim-on-3D pants, neutral reference pants, or original licensed AJ shirt plus original denim on the real CC0 skinned male/female rig. Back remains neutral, and this is NOT photogrammetry or guaranteed wearable fit. Source alpha/material is drawn by the existing research-only front UV shader from PR436.

`scripts/test-three-d-31-photo-jeans-browser.mjs` captures genuine WebGL2 Chromium screenshots of 320/390/430px × original CC0 male/female × front/side/back/3⁄4 and complete original-shirt+photo-jeans combinations. It checks source hash/geometry, that actual photograph creates visible front changes relative to neutral, that synthetic click cannot approve it, and that switch-back remains neutral. Browser outside requests, original photo/model mutation, customer data and storage are prohibited.

**No blanket PASS:** automated browser or original RGB check is not user aesthetic acceptance; signed collision, authentic wardrobe support and 4-account staging privacy remain unvalidated. No deployment, no merge, no invitations.
