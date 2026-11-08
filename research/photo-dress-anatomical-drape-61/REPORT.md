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

## Verification results (tested code: `6df29c8d2c0bb92dc7135e92298406b52c942f4f`)

Exact-head GitHub Actions run [42517511964](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42517511964) passed both independent jobs: the dress-only ancestry/scope gate and the complete inherited Node suite (1,340/1,340). The pinned P541 donor rendered 120 real Chromium WebGL screenshots and compared 60 matched before/after image pairs. Coverage: female and male figures, source and relaxed poses, front/three-quarter/both sides/rear, and 320/390/430 CSS-pixel widths. All 12 browser sessions had WebGL2, no horizontal overflow, no page errors, no outside requests, no browser-storage writes, and stable open/close resource counts.

Measured geometry results:

- Female: 3,642 bodice and 1,845 skirt vertices changed; male: 3,293 bodice and 1,839 skirt vertices changed.
- Maximum torso displacement was 12.9 mm; maximum skirt displacement was 18.64 mm (female) / 18.78 mm (male). The measured front-protected area was unchanged by skirt relief.
- Source SHA-256 remained `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`; source rest coordinates, UVs, material identity, skin indices and weights were preserved. The common skeleton remained 163 bones.
- Across matched pixels, the P61 geometry changed 0.327%–0.792% of image pixels. Renderer counts stayed at 11 geometries and 3 textures before and after; measured draw time was 0.6–0.9 ms in CI's SwiftShader environment.

Independent screenshot review confirms a modestly narrower bodice contour and softer side/rear skirt outline, with unchanged original front artwork. It does **not** establish photorealistic fabric: the dress still reads as a rigid photographic shell; the armhole/shoulder transitions remain visibly cutout-like, and skirt folds are subtle. The source photograph is front-facing only; the rear render is not an original rear photograph. The harness does not compute body-collision distances or seam continuity, and does not simulate fabric physics. These remain unresolved acceptance items, so this is a verified geometry improvement—not a photorealism acceptance.

The evidence ZIP is attached to run 42517511964 as `P61-photographed-dress-real-WebGL-evidence-HOLD`. It contains the actual source photo and cutout, all before/after views and poses, mobile screenshots, image SHA-256s, pixel-difference and runtime results. WebKit, physical Android/iPhone devices, human garment-fit review, and collision/cloth simulation were not run. No release or family tester was authorized.

## Main-controller integration

This change is intentionally not wired into public app code or P171. To evaluate it, rebuild the detached P541 donor from the pinned SHA, install P60 and P61 with `scripts/install-photo-dress-anatomical-drape-61.mjs`, and opt in with `photoDressDrape61: true` in the research showroom. Promote the geometry helper only through a separately reviewed integration after this branch's exact-head tests and screenshots pass. Keep the original-photo 2D fallback and Family Alpha hold.
