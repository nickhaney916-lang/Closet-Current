# Priority #61 — Photographed dress anatomy and fabric fall

**Family Alpha #255 HOLD. Research-only draft. No production, staging, cloud data, wardrobe records, or tester changes.**

## Scope and provenance

This is a standalone dress-only branch from the verified P170 parent `76315c4c08274a510c55bade91e76f1db89a129a`. Browser rendering is performed only in a detached copy of the pinned P541 donor `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. It imports the exact verified P60 source gate from `6fe5e46b91533a96f3c0d86950ea077cb355c459`; no donor files, P172 shirt code, or app wardrobe paths are committed.

P61 is restricted to public Commons dress `commons-0053`, source SHA-256 `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`. It runs after the existing 3D24 anatomical/open-armhole fitter and 3D27 lower-skirt pass, then requires the P60 receipt against the donor's actual shared 163-bone body skeleton. Other and owner-uploaded photos remain on the existing 2D fallback.

## Physical geometry changes

- The bodice surface is pulled toward a measured anatomical cross-section target with 11 mm nominal ease and a hard 13 mm per-vertex correction limit. Blended bounds protect neckline, shoulders, waist seams, and armhole boundaries.
- The side and rear lower skirt receive asymmetric seven-pleat radial relief (maximum 18 mm) plus up to 6 mm gravity-biased hem fall. The center-front photographic panel is protected. This changes the existing skinned position buffer; it does not add a decorative shader or replace the dress photograph.
- Original texture/material identity, source SHA, `dressRest` coordinates, UVs, skin indices and weights, skeleton, topology of the already-cut armholes, and body meshes are checked after staging the geometry change.
- No fabric solver, general self-collision solver, synthetic folds in the photographed front, or reconstructed rear photograph is claimed.

## Verification status

The unit suite checks bounded and continuous fold fields, protected front, non-authorization, and fail-closed rejection before writes. The no-deploy workflow checks exact-parent/scope integrity and the full inherited repository suite, then reconstructs the pinned P541 donor and renders identical Chromium/WebGL camera/lighting conditions with only the P61 geometry switch changed. It audits before/after front, three-quarter, both sides, rear, source and relaxed poses, both figures, and 320/390/430 CSS-pixel widths. Expected displacement counts, source receipt/SHA, material and skin integrity, mobile resource counts, external requests, and actual pixel deltas are asserted.

CI and genuine screenshot inspection are **pending** until the workflow runs on the final branch commit. Until then no rendered acceptance or visual improvement claim is made. Chromium SwiftShader is research browser evidence; physical Android/iPhone and WebKit acceptance remain unverified. Exact pixel source checks verify that the approved photograph is used, not that it looks like reconstructed cloth. No 10/10 realism claim is authorized.

## Main-controller integration

This change is intentionally not wired into public app code or P171. To evaluate it, rebuild the detached P541 donor from the pinned SHA, install P60 and P61 with `scripts/install-photo-dress-anatomical-drape-61.mjs`, and opt in with `photoDressDrape61: true` in the research showroom. Promote the geometry helper only through a separately reviewed integration after this branch's exact-head tests and screenshots pass. Keep the original-photo 2D fallback and Family Alpha hold.
