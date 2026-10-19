# Closet Current — in-house local garment mesh warp

**October 19, 2026 — isolated draft, no production merge or deployment.**

## Product principle
- Two commercially rights-cleared, standardized figure files, one male and one female, are reused for every outfit.
- All garment indexing must use the ORIGINAL unmasked, high-resolution user photograph **before** segmentation/clipping. Never replace or overwrite the source with preview pixels.
- Clothing is separated into conservative transparent cutouts, then displayed over the fixed figure. Tops, bottoms, jackets/coats, and dresses have simple category-specific warp profiles. Shoes remain unchanged; dresses replace trousers/layers.
- An optional selfie is a temporary, locally generated object URL and is not uploaded or persisted.
- This display pipeline runs with browser canvas and simple geometry. No paid model/API calls, retraining, cloud inference, or per-outfit generation charges.

## What was implemented in this checkpoint
`public/local-garment-warp.js` creates a deterministic 4x4 quadrilateral grid (32 affine triangles) and maps source coordinates to profile-controlled, slightly tapered garment positions. The renderer applies it to **already transparent, display-only** item previews. It cannot infer missing cloth, create folds, simulate physical materials, or guarantee fit; excessive opacity and ambiguous clipping still remain review-only. The existing original RGB metadata and user's closet item objects are not modified.

The output is only a transient PNG data URL shown in the figure. No new generated garment is saved or claimed as faithful AI output. If decoding/warping fails, it falls back to the intact transparent cutout.

The fixed coordinates are deliberately conservative. The next research steps are:
1. Independently evaluate licensed garments across categories (including white shirts and shoes), body occlusion, and front figure alignment. Do not claim real-photo fidelity from synthetic examples.
2. Introduce garment boundary/landmark mapping before stronger deformation; protect logos, stripes, seams, collars and cuffs against stretching. Unsupported clothing remains unwarped or held.
3. Validate actual phone GPU/browser memory, battery, pinch/zoom, 200% accessibility and face overlay removal on independently tested Android and iPhone hardware.
4. Acquire and review high-resolution figure art with durable, written commercial rights. Current checked-in .webp models are previews only.
5. Decide whether to fully remove the old unused paid try-on prototype after product review; the app's old paid UI remains hidden and its hosted activation constants remain false.

## QA scope
`tests/local-garment-warp.test.cjs`: mesh dimensions, category restrictions, finite exact affine mappings, shape tapering, security/no remote operations, unchanged input images, and synthetic no-network canvas output.
`scripts/test-reusable-figure-phone-browsers.mjs`: Android Chromium and iPhone WebKit emulation with two selected owned garments, local 2D warp changing the preview pixels, zero remote writes, temporary selfie add/remove and the hidden billable-generation panel. This does **not** constitute testing on two actual phones.

No paid AI, app subscription, inferred budget, deployment, user-photo upload or Drive Duel changes.
