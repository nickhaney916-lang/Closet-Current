# Closet Current — Priority #112 / REVIEWED-COLOR-SOURCE-IDENTITY-112

**Research only / Family Alpha Issue #255 HOLD / no production, existing staging, merge or deployment.**

## Why this priority exists

Draft PR #665 / Priority #110 already binds a saved photographed shirt and jeans to an owner, session generation, original JPEG SHA-256, category/subtype, and limited publicly licensed 163-bone research donor. The saved-outfit handoff was missing the **reviewed color label** and **source record identity** in its reopening freshness comparison. Consequently, a corrected color or a newly indexed source record with exactly the same JPEG bytes could silently reopen an earlier outfit plan. No independently validated AI color-recognition result is implied by a label in a fixture.

## Implemented isolated research fix

- Require a bounded, nonempty, trimmed, control-free previously **owner-reviewed index color** for both shirt and jeans. Never derive colors from appearance, model output, hash, geometry or image filename.
- Freeze **reviewedColors.top/bottom** and **sourceIds.top/bottom** alongside the existing original source SHA-256s in the in-memory saved-look plan. The plan carries metadata only, never JPEG bytes or private customer photos.
- On reopen compare the currently owner-scoped category, subtype, source hashes, sourceIds and both reviewed color labels. A correction, new source record, missing label, unsafe label, source revision or owner change fails closed, even if the original JPEG SHA-256 is unchanged.
- The only genuine 163-bone photographic donor benchmark requires exact verified public-fixture shirt **Black** and jeans **Blue** labels in addition to existing licensed original JPEG/source IDs. Any mismatch stays on explicit original-photo/2D fallback, never fabricates a different garment's fitted mesh.
- Fix inherited P110 real WebGL browser test's untrusted-click regression: the second denim iteration already has a legitimate saved look. Assert an untrusted DOM click leaves the complete saved-look report unchanged, rather than falsely expecting no saved look.

## Independent tests / acceptance

- New Node regression cases for exact reviewed-color/sourceId retention; corrected color vs unchanged SHA; sourceId rotation vs unchanged SHA; both original-public and synthetic-private research owner; unsafe or absent label; forged/missing saved metadata; and fallback without inventing 3D.
- Preserve P110 8 public-source browser restore scenarios at female 320/390/430 CSS widths and male 390 CSS width, two licensed original denim sources, 16 before/after genuine WebGL frames and inherited parent 24 photographed-denim pose frames.
- Re-run full inherited Node suite, exact no-deploy source audit, temporary pinned public donor and original-source screenshot SHA audit in the dedicated P112 CI.

## Critical limitations

This is a **research metadata admission gate**. It does not prove actual customer photo category/color classification accuracy, independent human color annotation, genuine photographed backside, private-account JWT/RLS, cloud storage, hardware iPhone/Android acceptance, new arbitrary user-garment reconstruction, fabric simulation, or human 10/10 realism. It does not change the shipped Closet Current app.

**Current verification:** source changes and tests committed to isolated P112 branch; GitHub Actions status must be checked against exact HEAD commit after workflow run. No PASS claim without completed successful CI.

**HOLD:** GitHub Issue #255; all changes research-only. **Production and staging unchanged; do not merge/deploy.**
