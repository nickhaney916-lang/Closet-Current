# INDEX-04 — Real recognition → saved private closet safety integration (DRAFT HOLD)

Research branch based on INDEX-02 PR #537 exact head `f287ee5dd882ea202f9577a998e0b7f20b8d6c6c`. It **copies the verified INDEX-03 safety gate and its original tests** from PR #539, while preserving INDEX-01 and INDEX-02 unchanged. It does **not merge** those draft PRs, modify production, add new telemetry, change Supabase/permissions, migrate IndexedDB, or use private customer photos.

## Why this priority

The existing automatic scanner wrote strong worker predictions to the owner closet before the independent INDEX-03 source/type safety gate was consulted. INDEX-04 connects the worker result to that gate **before** automatic `saveIndexed`, and compares its metadata against the current **authenticated, actually saved IndexedDB** snapshot. The result is review vs auto-save, without touching source pixels or replacing corrected data.

## Enable for isolated evaluation

Use `/public/index.html?index02=after&index04=after` from a full repository-root research host. Normal URLs do **not** enable INDEX-04. The project build deliberately excludes `research/` from standard published `dist` assets, so this experimental page is not production-ready. The original manual **Adjust → Save changes** flow continues to work independently.

## Specific behavior

- Cryptographically compare an actual original JPEG's bytes to a previously **independently supplied**, lowercase SHA-256 identity. Do **not** trust a digest invented from the same unverified blob as independent evidence. Require explicit sourceHashVerified and singleGarmentVerified (or independently SHA-bound multi-garment segment) proof and that the bytes input to recognition equal the original source. Crops/multi-garment photos lacking source-bound segment proof go to review.
- Require current signed-in owner and exactly named account database *before* and after async processing, as well as before automatic IndexedDB write. Build private INDEX-01 source dedupe from current saved records, never image suggestions.
- Apply INDEX-03 exact catalog subtype, conflict, independent-model-confirmation and color-confirmation rules. Unknown/missing labels, ambiguous color, no independent evidence for dangerous subtypes, possible duplicate or wrong-owner data fail closed to **Adjust**, retaining the unsaved JPEG.
- Never auto-overwrite userAdjusted, user-confirmed saved category/subtype or garment color. Saved edits and cloud restores still invoke INDEX-02's existing index-refresh path. No original image bytes/source hashes are returned from the review decision.
- A verified, separately confirmed single garment with safe subtype and confirmed color is allowed to enter the already existing atomic `items` + `draft` IndexedDB transaction. The legacy scanner remains unchanged with no flag.

## Verification and limitations

- Strict PR exact-head no-deploy CI: 12 newly added INDEx-04 Node tests, existing INDEX-01/02/03 owner/source/privacy regression suites, full app test suite/build.
- Genuine mobile-size Chromium (320/390/430) on actual public app, authenticated fixture IndexedDB, actual JPEG bytes produced by real browser canvas. Browser script mocks **the worker's model decision only**, proving both unproved-original review (no save) and proved-single save, category index refresh and logout privacy. This is **not** a live neural inference benchmark or an actual phone.
- Existing INDEX-02 browser corrected-category regression runs as well. No claims of new trained-model accuracy, photo cutout IoU, 15 real consumer phone captures, original photograph provenance sourced from users, physical Android/iOS acceptance, Supabase RLS, or 10/10 3D appearance.

**HOLD**: To enable a useful automatic flow for consumer captures, camera/crop/worker must produce trusted independent source hash/segmentation proof and separately confirmed color. Until those integrations are genuinely verified, most unproven incoming photos deliberately require review; never forge sourceHashVerified just to increase auto-save count. Family Alpha issue #255 remains HOLD. No merge/deploy. Parallel denim, outfit, Drive Duel and Delta Ebb unchanged.
