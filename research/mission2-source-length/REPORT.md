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

Seven focused real THREE/BVH tests exercise proportion sensitivity, real mesh
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

The first genuine browser run exposed a module-resolution defect: the native
import map has no bare three-mesh-bvh mapping, so even baseline imports failed.
The research module now imports the pinned installed ESM build by an explicit
relative path (the same source works in Node and in the disposable donor).
That failed run is not visual or geometry evidence. Initial full CI Node suite
passed 1508/1508; expanded staged-intersection refusal test raises the final
suite to 1509, to be independently rerun on final code.

## Source pixel registration and sleeve fabric

The old planar photo span was sized for a short torso and explicitly removed
photographed sleeve RGB. An additional opt-in front projection uses a NEW
sourceProjectionPosition attribute registered to the actual extended garment
bounds. Original panel/photo attributes, original JPEG and alpha remain intact.
The existing source alpha, front normal/depth and neckline guards remain; rear
still uses neutral inferred fabric. A valid near-opaque owner alpha now reaches
full interior support instead of being faded twice by the legacy opacity ramp.
No new print, color, seam or hidden texture is generated. This is a planar front
projection, not recovered sewing UVs or an independently human-accepted fit.

The browser requires an actually executed original-photo shader compilation
callback, captures WebGL shader errors, and checks both humanoids after the
switch. Seven focused tests include shader registration/guard preservation and
precommit immutability. Final full suite target: 1511 tests, pending exact CI.

The second browser run passed baseline but caught an empty-viewer initialization
bug in the new installer: the optional stage tried reading a candidate before a
shirt existed. The stage is now restricted to an actual source-bound shirt and
registered contour. No unsuccessful run is counted as new rendered evidence.

The third actual browser trial exposed an incorrect shader-detection assumption:
the original projection callback is wrapped by the existing 3D22 seam stage, so
Function.toString does not contain the underlying UV expression. Preparation
now invokes the actual chained callback on THREE's real standard shader and
requires its original uPhoto Texture plus the expected final GLSL anchors.
This validation occurs before any geometry mutation. The inherited narrow
chest-only seam multiplier is removed only for registered front projection;
source-alpha/domain/normal/depth/neckline safety and inferred neutral rear stay.
Actual source-length construction duration is now recorded separately from
idle requestAnimationFrame diagnostics, with no physical-phone timing claim.
