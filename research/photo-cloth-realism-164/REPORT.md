# Closet Current P164 — photographed cloth PBR surface integration

## Priority #60 anatomical-fit integration checkpoint

This isolated continuation adds `research/photo-garment-anatomical-fitting-60/fit-contract.mjs` and gates P164's existing material handoff in the detached P541 renderer. Before a verified photo material can be used, the gate checks the source SHA and attached original pixels, requires the garment mesh to share the loaded 163-bone body skeleton, and checks finite vertices, triangle indices, and normalized skin weights. The receipt is attached to renderer statistics without changing source geometry, UVs, material references, or saved owner data. Unknown and owner-private garment photographs remain on the original-photo 2D fallback.

This is an integrity and compatibility gate for the already-developed shirt, dress, and photographed-denim meshes. It does not claim to improve the current mesh silhouette or simulate cloth. The new unit tests pass locally (5/5); exact-head browser acceptance is pending. The P60 workflow repeats source-photo Chromium/WebKit views and the P541 shirt/dress source-mesh browser suite on the isolated research donor. The CI artifact must be inspected before reporting any visual or performance result.

**Status: research candidate; no merge, deployment, staging changes, or Family Alpha activation.** This work is stacked on verified P163 `d358e6e0ae1eaf65febf57a50a3654bf996b15a5`; full-application PR #719 was not edited.

## Implemented

P164 adds a material-only PBR pass to the detached, pinned P541 3D research donor. The controller admits only the existing source-verified CC0 shirt, the existing CC BY-SA dress, and the two licensed denim fixtures after their locked source SHA matches. It clones each existing standard photo material as a `MeshPhysicalMaterial` and retains the original map, alpha map, source-photo shader callback/cache key, vertex geometry, UVs, and 163-bone skin attributes. There are no new pattern maps, synthetic texture pixels, geometry displacement, or rear-photo claims.

Profiles give cotton jersey roughness 0.86 / low cloth sheen, the dress roughness 0.90 / low cloth sheen, and denim roughness 0.78 / very low sheen. Metallic, clearcoat, iridescence, and anisotropy are disabled. This replaces a glossy or uniform standard response with a softer physically based response while keeping the source image as the visible color. Unknown IDs, mismatched SHA values, and garments without attached source pixels remain unchanged. User-owned garment data is neither read nor written by the P164 installer or renderer pass.

The material conversion is disposed with its garment and restores the original material references before the existing garment cleanup. Tests cover source identity rejection, source map and shader preservation, PBR profiles, skin-weight/geometry immutability, and material cleanup.

## Verification gates

The exact-head no-deploy workflow repeats P163's original-source gates, instruments the donor browser, and captures matched baseline and changed 36-frame dress views in Chromium and WebKit on the original female and male 163-bone bodies at 320/390/430 CSS px. It also runs the pinned P541 browser suite on the source-verified shirt and dress at both body models, both source/relaxed poses, four viewing angles, and three mobile widths; the suite now asserts the exact material profile on each actual source-projected skinned garment. P163's photo-area/torso/hem/limb audit runs again on post-change Chromium dress frames. P164 verifies before/after PNG hashes, compares paired view pixel differences, and enforces a source-color change budget. It records browser render-loop callback CPU time and WebGL draw-call submission CPU time before and after, with a 50% median overhead ceiling. These are main-thread submission measures, **not GPU completion time or mobile FPS**. CI screenshots and audit JSON are uploaded as a no-deploy artifact.

The checkout's previous P163 report records a successful baseline of 36/36 original-source garment views and an unverified inferred rear. It does not contain captured P164 output. The P164 visual and framebuffer gates remain **pending until the exact-head Actions run passes**; the audit is not treated as passed from Node tests alone.

## Current rubric and limits

| Criterion | Current status |
|---|---|
| SHA-locked photo source preserved | Implemented; unit-covered; actual CI still required |
| Soft matte cloth lighting response | Implemented for verified shirt, dress, and denim fixtures; actual-browser source mapping acceptance covers shirt and dress, while denim's profile is unit-tested only |
| Original texture color and UV mapping | Preserved by cloned map and shader callbacks; actual screenshots pending |
| Female and male 163-bone display | Inherited P163 baseline; P164 exact-head rerun pending |
| Six angles at 320/390/430 | Inherited P163 baseline; P164 exact-head rerun pending |
| Body contact, seams, hems, wrinkles | Inherited approximate static geometry; PBR does not repair geometric defects |
| General photo-to-3D fitting | Not supported; arbitrary owner photographs retain explicit original-photo/2D fallback |
| Real fabric simulation or pose response | Not implemented by P164; static approximation preferred over unstable motion |
| Source-authentic rear photograph | Not available; rear remains inferred neutral |
| Shorts, skirts, jackets, and layered outfits | No new verified source/geometry support added in this priority |
| Chromium/WebKit physical phone performance | CI browser can run; no physical Android/iPhone available in the workflow |
| Independent human 10/10 realism acceptance | Not done and not claimed |
| Performance delta | Pending: Chromium/WebKit browser main-thread render-loop and WebGL submission CPU timings are measured; no GPU-time or FPS claim is made |
| Production/full-app integration | Not done; PR #719 remains untouched |

This is a bounded material improvement, not photorealistic reconstruction. Single front-facing photos cannot establish hidden cloth construction, true backside imagery, universal garment geometry, or physical fabric behavior. Family Alpha remains HOLD (#255).

## Integration handoff

The integration module is `research/photo-cloth-realism-164/pbr-fabric.mjs`. It exposes `applyPhotoFabricPBR164(garment)`, which returns the original garment unchanged unless the source ID, original SHA, source-pixel application, and 163-bone skinned garment contract match the four public fixture identities. A successful call returns a disposable wrapper with `stats.photoFabricPBR164` and the source-specific roughness/sheen profile. Integrators should call it only after verified source fitting succeeds and must preserve the explicit owner-photo fallback. The provided installer patches only the disposable P541 outfit controller; it is not an app deployment or production integration script.
