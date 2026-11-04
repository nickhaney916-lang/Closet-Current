# PHOTO-FIT-3D-02 — New original photographed red T-shirt fit (DRAFT HOLD)

Parallel #22 · independent shirt research · NO PRODUCTION MERGE, DEPLOY OR FAMILY ALPHA. Base is main controller PR #562 exact 68d76e42c26e4a83866157f16f6c3435d21c0b66; immutable 163-bone donor PR #541 exact df6885d6011cb33fb22dceb81a08f35a0ac4dd61. Footwear #17, backup #19, 15-source benchmark #21, and all production/auth/RLS files unchanged.

## Original independent photograph

- New source: benchmark/fixtures/commons-0002.jpg. Red Diesel short-sleeve crew-neck T-shirt with blue front print.
- CC BY-SA 3.0; credit Diesel / Museum Rotterdam. https://commons.wikimedia.org/wiki/File:Rood_t-shirt,_merk_Diesel,_maat_M,_objectnr_86503.JPG
- Byte-locked SHA-256: fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667.
- Different from existing genuine donor commons-0003 shirt SHA cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64.
- The original JPEG is never rewritten, re-encoded, cropped or copied over. Only an independent in-memory RGBA cutout/UV material is derived from its decoded original pixels.

## Implemented research

- source-shirt.mjs: exact SHA check, conservative source-red row contour, neckline exclusion, measured sleeve and hem shape; derived original RGB preserved, no invented photographed rear; explicit read-only owner/item/outfit ID and generation guard.
- source-fit.mjs: new independent skinned garment mesh, 163-joint anatomical source skin indices and weights, separate garment collar/sleeve/hem openings and measured short sleeve cutting, actual front source print material, neutral source-derived sides/rear; no rigid photo simply painted on the body.
- index.html and preview.mjs: genuine WebGL male/female anatomical source, front/side/rear/opposite side, source JPEG side-by-side and compact mobile controls.
- tests/photo-fit-3d-02.test.mjs: original bytes and tamper protection, source nonidentity, owner-private saved metadata, foreign account rejection and no false 3D Ready.
- scripts/test-photo-fit-3d-02-browser.mjs: genuine Chromium 320/390/430 × male/female × 0/90/180/270 = 24 PNGs plus three source/render contact galleries, synthetic owner-private IndexedDB, no external network or cloud mutation.
- scripts/audit-photo-fit-3d-02.mjs: 24 screenshot byte SHA/PNG checks, gallery verification, exact A/B owner and metadata gates, immutable human/HOLD assertions.
- Dedicated no-deploy workflow pins exact donor PR541 and full current native PR562 lineage, reruns inherited regression and new browser evidence.

## Known limits / approval

This is measured source-specific new photographed T-shirt geometry research, **not** proven arbitrary-photo-to-3D fitting, body collision-free drape or accepted photorealistic clothing. Source cutout needs careful independent edge/collar/logo review and shoulder/armhole body-clearance inspection. Unphotographed rear is neutral sample, never claimed as original rear. One proven source would not authorize every other photograph.

Actual browser screenshot artifacts and independent human comparison must be reviewed before accepting the fit. No approved human visual verdict exists at this writing. No new 3D Ready receipt has been minted and the independent 15-photo existing readiness benchmark remains 0/15 newly ready. Native default Outfit Builder is not changed; read-only saved garment identity is verified in the isolated research bridge. Live signed server RLS, physical Android/iPhone, cross-device restore and human 10/10 realism remain unverified.

Family Alpha Issue #255 HOLD. NO MERGE, DEPLOY, PRODUCTION MODIFICATION OR RELEASE. Main controller decides final integration.

Manual commands after donor worktree setup: node --test tests/photo-fit-3d-02.test.mjs ; node scripts/test-photo-fit-3d-02-browser.mjs ; node scripts/audit-photo-fit-3d-02.mjs .
