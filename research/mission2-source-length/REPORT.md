# Mission 2 — photographed long-garment proportion preservation

Family Alpha HOLD #255. Isolated draft; no merge/deploy. Verified parent:
349322687edb7035c321e11b54a9ed5c52476c5f (PR790, 1504 tests and 210 screenshots).

## Defect and implementation

Direct visual inspection of original commons-0016 JPEG shows a long flared
photographed garment. The current generic upper-body shell clips it at the
waist, compressing the original photograph into a short top. This new opt-in
research stage uses the source alpha's registered eight-band silhouette and
aspect ratio plus actual anatomical garment bounds to extend the lower real
mesh and preserve a bounded source-derived lower flare. It leaves original
panel/photo projection coordinates, JPEG bytes, alpha and skin weights unchanged.
Physical size and hidden construction cannot be inferred from this photograph.
Extension is capped at 38cm and does not claim exact real clothing dimensions.
The source remains pinned to one licensed garment, not arbitrary-photo support.

Before committing positions, actual posed skinned garment/body triangle meshes
are compared using BVHs. A staged extension that increases intersecting mesh
pairs is refused before mutation. This is surface-intersection nonregression at
the sampled fitting pose, not signed clearance, complete self/layer collision,
continuous pose coverage, cloth simulation or physical-phone acceptance.

## Verification

Four focused real THREE/BVH tests exercise proportion sensitivity, real mesh
extension with exact original panel/skin attributes, source/corrupt-last-cap
atomic refusal, crossing surface detection and actual bone-transformed vertices.
A dedicated NO DEPLOY workflow requires all repository Node regressions plus
actual Chromium/WebKit 320/390/430 male/female before/after screenshots, 44 PNGs
per engine and six source-bound physical length/intersection receipts per engine.
CI and actual visual acceptance remain pending until independently inspected.
Local browser launch was prevented by the execution environment's socket policy;
no local browser screenshot or physical-device claim is made.

## Remaining mission limitations

Independent source segmentation/human review, unseen garment construction,
photographed rear, natural physical cloth, body/layer swept collision, arbitrary
photos, real signed hosted owners and actual Android/iPhone acceptance remain
unverified. Original private wardrobe/2D fallback remains the source of truth.
The longer geometry must be visually inspected before any improvement claim.
