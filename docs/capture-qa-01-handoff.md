# CLOSET CURRENT — CC-PAR-01 / CAPTURE-QA-01
## Parallel research handoff · October 31, 2026

**Repository:** https://github.com/nickhaney916-lang/Closet-Current
**Base:** `main` at `39deed987afe2e5668d64e145835ad43ad14c7be`
**Isolated head:** `research/cc-par-01-capture-source-identity-20261031`
**Restrictions:** DRAFT ONLY; no merge, production/staging deployment, family/customer photos, billing change, or modification of Drive Duel/Delta Ebb. Family Alpha issue #255 stays HOLD. This track never changes 3D garment meshes, poses, fabrics, draping, or 360° controls.

### Corrected, narrow verified defect
`public/app.js:candidate()` previously rejected only literally identical processed display JPEG strings. The same original file could yield a different image string after re-encoding and be indexed twice. A distinct photograph of a very similar garment, however, must *not* be silently discarded.

- `public/photo-import.js:sourcePhotoSha256()` derives a SHA-256 fingerprint from original selected file bytes (WebCrypto, local, no upload). Missing hashing support never deletes a valid photo.
- `public/app.js:importClothingPhotos()` obtains that SHA before placing the record into the closet. `candidate()` stores it as `sourceSha256` and skips a matching *single-item import* in the current authenticated account's existing items or draft.
- Whole-outfit pieces from the same source are explicitly exempt from source-hash collapse. The existing exact-display-image and visual-lookalike checks remain.
- The fingerprint survives taxonomy normalization because that routine preserves other record fields. Hashing original bytes **does not** mean the full-resolution photo is preserved or used for inference.

### How to reproduce
1. `node --test tests/capture-source-identity.test.cjs tests/automatic-indexing.test.cjs tests/photo-import.test.cjs`
2. Full suite: `node scripts/build.mjs && node --test tests/*.test.cjs tests/*.test.mjs`
3. Review machine-readable statuses in `benchmark/capture-qa-01-matrix.json`.
4. For real-world recognition, run existing licensed-photo evaluator using *actual* worker outputs. The mock tests intentionally cannot produce image-recognition accuracy numbers.

### Historical photographic evidence (not rerun in this task)
Existing `benchmark/manifest-reviewed-32.json` versus `benchmark/regression-reviewed-32.json` records 24 correctly auto-classified exact accepted subtypes, 1 wrong automatic subtype (jacket → blazer), and 7 nonautomatic results (6 abstentions, 1 category-only review) among 32 annotated photos.

The independent `benchmark/manifest-holdout-16.json` versus `benchmark/regression-holdout-16.json` records 3 correctly automatic accepted subtypes, 3 wrong automatic subtypes (T-shirt → sweatshirt; blouse → tunic; sneakers → ankle boots) and 10 nonautomatic results among 16 annotated photos. Some nonautomatic results are correct nonclothing rejections; this is *not* a conventional full-dataset accuracy percentage. Both result sets are historical artifacts pinned to an older run. Do not claim these were retested in CAPTURE-QA-01.

### Gate for photographed 3D readiness — proposal, not implemented in this track
Every wardrobe record retains its original-photo/2D representation by default. Never promote an item merely because `category`, `itemType`, and `color` are present. Require (a) valid per-account source binding and ideally the full native image; (b) user-confirmed garment identity/color and ownership; (c) independently inspected unmasked contour and texture quality, including straps, cuffs, hems and soles; (d) matching shape/mask and verified human visual fit on actual Android and iPhone. Missing evidence means **2D fallback**. Coordinate adoption of this contract only with MAIN, without changing existing 3D code here.

### Known blockers and next action for MAIN
- Full native uploaded JPEG and native camera pixels are **not** retained for model-first recognition: `photoToJPEG` resizes single photos to 2048px; `snap` limits camera to 2048px; outfit import limits to 3072px. Preserve original-source metadata and make an explicit privacy/storage strategy before changing inference.
- Source SHA-256 covers *individual uploaded file* imports only. Camera frame fingerprints, multi-outfit upload fingerprints, matching restored items by source, and handling intentional different crops require separate careful design.
- Real skirt/dress, sneaker/boot, dark/light pattern color and pale-garment performance remain unaccepted.
- Multi-garment recall, 3D photo-to-fabric readiness and physical handset acceptance are **NOT TESTED** here.
- Review this draft branch and full CI before any merge. Keep Family Alpha #255 HOLD.
