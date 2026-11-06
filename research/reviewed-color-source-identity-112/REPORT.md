# Closet Current — Priority #112 / REVIEWED-COLOR-SOURCE-IDENTITY-112

**Research only / Family Alpha Issue #255 HOLD / no production, existing staging, merge or deployment.**

## Why this priority exists

Draft PR #665 / Priority #110 already binds a saved photographed shirt and jeans to an owner, session generation, original JPEG SHA-256, category/subtype, and limited publicly licensed 163-bone research donor. The saved-outfit handoff was missing the **reviewed color label** and **source record identity** in its reopening freshness comparison. Consequently, a corrected color or a newly indexed source record with exactly the same JPEG bytes could silently reopen an earlier outfit plan. No independently validated AI color-recognition result is implied by a label in a fixture.

## Implemented isolated research fix

- Require a bounded, nonempty, trimmed, control-free previously **owner-reviewed index color** for both shirt and jeans. Never derive colors from appearance, model output, hash, geometry or image filename.
- Freeze **reviewedColors.top/bottom** and **sourceIds.top/bottom** alongside the existing original source SHA-256s in the in-memory saved-look plan. The plan carries metadata only, never JPEG bytes or private customer photos.
- On reopen compare the currently owner-scoped category, subtype, source hashes, sourceIds and both reviewed color labels. A correction, new source record, missing label, unsafe label, source revision or owner change fails closed, even if the original JPEG SHA-256 is unchanged.
- The only genuine 163-bone photographic donor benchmark requires exact verified public-fixture shirt **Black** and jeans **Blue** labels in addition to existing licensed original JPEG/source IDs. Any mismatch stays on explicit original-photo/2D fallback, never fabricates a different garment's fitted mesh.
- Adopt and independently retain the upstream P110 corrected untrusted-click check: the second denim iteration already has a legitimate saved look, and an untrusted DOM click must leave its saved state unchanged.
- **CI-exposed integration defect fixed:** the simulated private-photo 2D fallback fixture omitted its reviewed color fields, so the newly strict policy rejected it *before* the fallback handler could complete. Add explicit synthetic reviewed labels (Black/Blue; no real user data). Separately harden the fallback and synthetic owner-rotation visual boundary by revoking review, hiding previous 3D avatar, dispatching a change event and requiring explicit fresh review of the authentic licensed source before displaying 3D again. The original timeout alone did not prove that the old pose controls remained active once fallback completed.

## Independent tests / acceptance

- New Node regression cases for exact reviewed-color/sourceId retention; corrected color vs unchanged SHA; sourceId rotation vs unchanged SHA; both original-public and synthetic-private research owner; unsafe or absent label; forged/missing saved metadata; and fallback pose/visual concealment with explicit human re-review before 3D readmission.
- Preserve P110 8 public-source browser restore scenarios at female 320/390/430 CSS widths and male 390 CSS width, two licensed original denim sources, 16 before/after genuine WebGL frames and inherited parent 24 photographed-denim pose frames.
- Re-run full inherited Node suite, exact no-deploy source audit, temporary pinned public donor and original-source screenshot SHA audit in the dedicated P112 CI.

## Independent failure investigation and verified correction scope

The first P112 original-source real browser CI ([run #42304088934](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42304088934)) passed the strict path scope, full Node regressions, original pinned research donor assembly and 24 genuine photographed-denim mobile pose screenshots, but **FAILED** at the simulated private-photo fallback/pose assertion. Root cause: the new reviewed-color gate rejected the metadata-only private fixture because it had no `color` fields; thus the handler aborted before setting the fallback state. This was an actual integration-fixture regression, not proof of an already completed fallback leaving pose controls on. The test remains strict and unskipped.

The correction adds explicit existing synthetic reviewed color labels before invoking the owner-bound fallback gate. Defense-in-depth also explicitly revokes review on private fallback and synthetic owner rotation, visually conceals the old licensed 163-bone avatar, and denies stale saved-look reopening until the original source is reviewed again. The browser suite now asserts actual avatar concealment, pose denial, blocked stale reopen, fresh review, original licensed re-admission and 3D reopen. This is still a synthetic research boundary only, not an authenticated private wardrobe UI.

## Critical limitations

This is a **research metadata admission gate**. It does not prove actual customer photo category/color classification accuracy, independent human color annotation, genuine photographed backside, private-account JWT/RLS, cloud storage, hardware iPhone/Android acceptance, new arbitrary user-garment reconstruction, fabric simulation, or human 10/10 realism. It does not change the shipped Closet Current app.

**Current verification:** source changes and tests committed to isolated P112 branch; GitHub Actions status must be checked against exact HEAD commit after workflow run. No PASS claim without completed successful CI.

**HOLD:** GitHub Issue #255; all changes research-only. **Production and staging unchanged; do not merge/deploy.**
