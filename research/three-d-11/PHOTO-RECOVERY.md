# Closet Current — 3D-12: Work59 drape + verified-original-photo recovery (HOLD)

**Purpose:** The newest separate skinned real-shirt natural-drape Work59 / [PR #408](https://github.com/nickhaney916-lang/Closet-Current/pull/408) has better shape and original-RGB provenance, but the independent earlier [PR #409](https://github.com/nickhaney916-lang/Closet-Current/pull/409) original-photo fallback was built on a *different* 3D10 branch. This strictly separate main-thread branch adapts its already-tested failure strategy to the **actual Work59 drape showroom**, preserving its source and pose code. Parent pinned to Work59 SHA `d09786163eb52a4a0fa05a5ffc546fc171896080`. No direct changes to garment geometry, skeleton, Work59 fitting/rendering module, original assets, or previous Work branches.

## Real behavior

The exact unmodified historical Work47 **original JPEG and provisional transparent PNG** for licensed black AJ shirt `commons-0003` must pass the existing frozen SHA256, license/category and alpha provenance checks **before attempting to initialize a WebGL renderer**. Only then can a fallback authorize the exact named original JPEG. The fallback reuses the **same-origin in-memory Blob URL produced from those exact verified bytes**, never fetching the path again after validation. This prevents a changed second HTTP response from replacing the image between its SHA-256 check and display. The tests assert exactly one JPEG fetch and no second fetch. A failure to verify the JPEG or PNG means **no photo at all**, not an unsafe placeholder. The regular Work59 reviewed independent `THREE.SkinnedMesh` shirt, existing pose, camera and cutout behavior remain unchanged on healthy browsers.

If WebGL is missing, a locked CC0 adult humanoid GLB fails to load, or the WebGL context is lost, the viewer enters **permanent photo-only HOLD** for this session: the 3D canvas is hidden, only the exact verified original licensed JPEG remains, review dialog closes, 3D/app controls are disabled including model, pose, garment, zoom and touch, and the user sees plain language: **no outfit was fitted, applied, saved or approved**. Repeated failures do not reactivate or leak a model; pending loads are invalidated and the model/shirt resources cleaned up. This recovery shows the *original garment photo*, not another 2D avatar.

## Validation

Separate strict seven-file source-only no-deploy CI checks that only Work59's experimental research showroom `index.html`, `demo.mjs`, this independently pinned fallback module, two new tests, this README and this workflow changed. It rebuilds frozen 15-photo Work47 licensed benchmark and both exact SHA-locked CC0 rigged adult GLBs; runs original Work59 nonvisual source tests and new fail-closed Node validations, then tests **four real Chromium browser scenarios** at 390px:

1. Browser WebGL unavailable, exact original verified and shown, all controls disabled.
2. Rigged source GLB intentionally blocked after source verification; original shown.
3. Original JPEG bytes corrupted in a test-only response; hash check fails and **no image shown**.
4. WebGL context lost after healthy figure initialization; original shown and already-created resources released.

The test checks a real decoded original image, no applied source/approval claim, no outside network, controls including ¾ view and zoom locked, no uncaught errors, and labelled HOLD screenshots. Additionally the existing Work59 end-to-end healthy source/relaxed 320/390/430 mobile WebGL, touch, screenshot, source hash, memory and pose tests run to detect accidental regressions. Static code/tests may pass while human visual approval is still absent.

## Release limitations

This protects mobile reliability, **not** garment fit, customer photos or real family account storage. Natural-drape fabric and collar code remains Work59's active responsibility; do not duplicate it. The prior independent human rating remains 0 PASS / 5 REVIEW / 10 FAIL until fresh real-photo evidence is graded. The four-person Family Alpha stays HOLD until actual staged JWT/RLS, save/restore, real physical Android/iPhone phones, visual acceptance, and owner go/no-go. No merging, production/staging, cloud, private user data, payment, external runtime models or Drive Duel modification. The research mock is confined to loopback and should not appear in app navigation.

## CI composition

The prior Work59 single-stage source allowlist was extended **only** for `.github/workflows/three-d-11-photo-recovery-no-deploy.yml`. The new 3D-12 workflow reciprocally permits exactly the pre-existing Work59 workflow file, with an eight-file count ceiling. No wildcards were broadened to include application, backend, original photograph, production, or cloud settings. As a stacked draft, both stages must pass at the **same exact commit** before integration can even be considered; earlier green runs are evidence for their own commit, not for the branch tip.
