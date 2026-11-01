# CLOSET CURRENT — 3D-71: Real Anatomical Seat-to-Thigh Fabric Fall

**Priority:** Improve 3D clothing **visual naturalism**, especially the unnatural rear seat-to-thigh shelf visible in genuine 90°/180° screenshots, while keeping original skinned male/female anatomy and the user's AI wardrobe indexing central.

**Repository:** nickhaney916-lang/Closet-Current  
**Exact verified ancestor:** 3D70 draft [PR #481](https://github.com/nickhaney916-lang/Closet-Current/pull/481) SHA `92518a453fe828cc29b8942077fa87c9351846a7`; dedicated CI [#41266600158](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41266600158) SUCCESS with 72 genuine original mobile 360 images.  
**Release:** Family Alpha #255 **HOLD**. No merge/deploy/production/staging, account, billing or user photo modifications.

## Exact mission
3D70's original anatomy and real 360 camera passed, but original rear trousers still inherit a stiff glute/quadriceps shelf. Make an actual, bounded change to the original neutral skinned fabric's **rear seat-to-thigh contour**, not a CSS/screenshot/filter trick, invented reverse photograph, or altered anatomical figure. Source original CC0 male/female 163-joint GLB must remain identical. The goal is a genuine visible 3D shape improvement when rotated, not just more metadata.

### Implemented

- `research/three-d-71/seat-thigh-fabric-fall.mjs` derives source-real knee/hip posterior garment profiles from the already source-verified 3D70 neutral cloth and original body bones. At 24mm longitudinal stations, robust source z-quantiles estimate the rear silhouette. It bridges those source-measured endpoints with gentle hanging fabric ease at mid-thigh; only **rear-facing** vertices move, with bounded max 32mm and source anatomical nearest-triangle oriented clearance checking. Original body, original pantsRest, original skinIndex/skinWeight and source photograph UV/RGB all unchanged. No synthetic pockets/seams/logo/reverse image, no other figure deformation.
- Opt-in `premiumSeatThigh71` requires 3D70's neutral fairing to be enabled and applies **only to neutral, non-photographed source pants**. Explicit original research showroom `?silhouette70=after&seat71=after`. With `seat71=before`, the verified 3D70 baseline is unchanged. The actual photo-derived denim/jeans 3D69 index/swap path is never altered by this pass.
- `tests/three-d-71-seat-thigh.test.mjs`: genuine SHA-locked male/female anatomical original models, two bone chains, actual 3D cloth geometry movement, original pose source and relaxed, source skin/rest equality, guarded body contact and HOLD.
- `scripts/test-three-d-71-seat-thigh-360-browser.mjs`: 2 figures × 2 mobile widths × 2 modes × 9 angles (72 true source WebGL captures), precise 360° return and original photo integrity, before/after real screenshot difference. At most this is **automated geometric evidence**, not proof that a person perceives the improved cloth as photorealistic.
- Independent `.github/workflows/three-d-71-seat-thigh-no-deploy.yml` exact-SHA-ancestry, touched-file restrictions, source model restore + unit and visual QA, original evidence artifact.

### Release and product integrity
3D67 true 360 camera and genuine anatomical figures verified; 3D68 private original-photo AI index/category-to-slot contract and 3D69 vetted original garment swapping separate and protected. The true **10/10 product goal** remains accurate photo indexing and user-confirmed categories **combined with** natural, movable, photo-derived original clothing on believable 3D humanoids.

Never call this neutral seat/thigh pass a verified photographed denim modification, universal photo-to-3D generation, human 10/10 aesthetics, continuous/swept collision certification, or a physical Android/iPhone phone acceptance test. Keep Family Alpha HOLD and all draft PRs separate.
