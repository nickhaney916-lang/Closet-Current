# Closet Current Main Priority #188 — private owner JPEG cutout pixels on actual 163-bone blouse

**RESEARCH ONLY · Family Alpha HOLD Issue #255 · DO NOT MERGE, MODIFY OR DEPLOY production or existing staging.** Direct base P187 [draft PR #750](https://github.com/nickhaney916-lang/Closet-Current/pull/750), verified HEAD `2391c632a0b7731868bf7a1edf40415ea0e283fe`, [3/3 success run #42645596283](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42645596283).

## Blocking defect and truthful geometry provenance

P187 correctly checks owner-private P119 review + original+cutout JPEG WebCrypto before importing WebGL. But P186 historically required the owner's **JPEG crop SHA** to equal the P62 physical silhouette **PNG mask SHA**. A legitimate private JPEG cannot have the SHA of a distinct PNG; the positive preview route was unreachable. A preview of the public photo with a public mask and owner-review assertion is NOT evidence that a user's actual cutout pixels appeared on a 3D garment.

P188 deliberately separates: (1) saved ORIGINAL licensed source JPEG bytes SHA, (2) separately saved, owner-reviewed **private cutout JPEG** SHA, (3) pinned licensed Work47 **alpha PNG** SHA used to constrain P62/P185 physical fit. It does **not** certify an owner-derived segmented alpha mask or personalize front/back geometry. The reviewed JPEG texels are genuinely composited using the pinned PNG alpha on a private canvas and fed as the actual blouse candidate's `cutout` to Three.js's skinned shirt material. This is a bounded positive texture-integration step, not universal garment reconstruction. Only one exact licensed blouse source/type is supported; photos with mismatched cutout dimensions refuse to stretch to fabricated fit.

## Research-only code changes
- Add bounded photo-source/owner-derived JPEG pixel compositing helper; require independent private original+cutout byte proof, 1% matched dimension/registration, canvas `destination-in` with the pinned public alpha and explicit alternate SHA provenance.
- Add donor-only installer changing P62/P185 verified source loader to accept ephemeral owner cutout data for `commons-0016` and altering the real 3D panel to expose only provenance SHA metadata and skinned mesh/163-bone receipt. Render a visible honesty notice: private cutout JPEG texture, licensed PNG alpha, no independent human/mask/rear approval. Applies only to detached P541 research donor.
- Add private native BOARD04 callback for one-time owner/session/wardrobe/lease SHA revalidation before and after rendering; do not return images in bridge status. Preview P187 preflight remains mandatory, with P186 separate late proof and P188 actual rendered owner-texture check.
- Fix P186 positive receipt admission to allow *different* private JPEG and licensed PNG SHA only with **real skinned private pixel texture proof**. Prior simple P186 same-hash backwards-compatibility research tests remain intact.
- Add Node negative/positive cryptographic provenance test fixtures and real Chromium+WebKit 320/390/430 simulated-owner review positive tests: actual PNG→separate JPEG fixture creation, persisted native owner data, genuine 163-bone female/male material rendering, source/pixel claims, source revision closing real WebGL and original saved outfit unchanged.
- Add exact-parent full Node/build + browser workflow. 9 research/test/CI paths only; no shipping/cloud/deploy writes.

## Evidence expectations and important limitations

The automated browser fixture deliberately **simulates** the owner confirmation fields in a real native IndexedDB owner wardrobe row using licensed source image bytes. It is **not** a witnessed human confirming actual P119 capture UI, real person garment silhouette, production identity, signed hosted cloud JWT/RLS, nor arbitrary photographed clothing. Real 3D fabric pixels now reflect the saved cutout JPEG; the shape still follows the pinned public Work47 PNG, and the rear remains inferred/neutral. Independent segmentation precision, user body calibration, cloth dynamics, fabric photorealism, 10/10 appearance, actual Android/iOS hardware and accessible consumer review controls still require separate acceptance.

An independent SHA check for original JPEG and private cutout confirms byte identity, **not** that the garment crop contains the same source or visual quality. Every failure must preserve original photo/2D and wardrobe and destroy stale private 3D. Keep releaseAuthorized false and Family Alpha HOLD.

**Completion gate**: exact final head successful 3/3 dedicated no-deploy GitHub Actions jobs, full Node, real Chromium/WebKit 320/390/430 163-bone baseline, negative P187 review refusal, positive P188 actual private JPEG-to-skinned garment, SHA audited screenshots; record precise run and head in PR only after all pass.
