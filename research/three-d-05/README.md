# Closet Current — 3D-05: anatomical arm-aligned sleeves and torso shoulder continuity (HOLD)

## Purpose

Continue the 3D—not 2D—development pivot. This is an isolated research-only candidate building directly on [3D-04 PR #394](https://github.com/nickhaney916-lang/Closet-Current/pull/394) at its verified exact head `17c3dadd30a1e4b7277935a368c26af0f120534a`. The latest licensed screenshot still shows rigid sleeve cylinders, abrupt sleeve-to-chest joins, oddly shaped shoulders, and no visible hand below the cuff. We are improving original procedural 3D anatomy without discarding the actual source-bound garment photograph.

## Genuine geometry improvement

- `research/three-d-05/swept-sleeve.mjs` introduces a **true 3D sleeve whose ring planes are perpendicular to the tilted shoulder-to-wrist centerline**, replacing the prior stack of horizontal discs. Rings transition from wide upper-arm cap through elbow to narrower cuff. Ring normals include their actual tilted Y component, so illumination responds to the swept surface rather than remaining horizontal tube lighting.
- The first actual 3D-05 screenshot exposed **spiky upper shoulders**, caused by keeping a fully perpendicular plane at the proximal sleeve opening. At the final shoulder rings we ease the cross-section tilt toward the local torso seam, retaining real arm-axis rings below the shoulder. The no-deploy geometry regression now rejects any upper sleeve ring whose vertical span exceeds 0.05 model units. This is a real screenshot-led revision, not a declaration of visual approval.
- Both left and right shoulders are source-color-only, with no fake copying of the photographed white AJ chest logo onto sleeves. Sleeve upper openings overlap the upper torso's new profile; cuffs stop near the wrist and the reusable generic humanoid gets small neutral-material hands. Hands are **not** personal likeness or inferred measurements.
- Shirt torso mesh has eight gradual rings rather than five: smooth chest → shoulder → neck transition, instead of a broad flat collar. Its *front UV* uses a consistent horizontal body-space width, preventing the same full photograph being stretched across the narrow neckline; this preserves original fabric pixels and the licensed original white AJ lettering.
- **Other outfits not rewritten.** Only the experimental 3D shirt receives the new swept sleeves; dresses and pants remain as prior research prototypes. No cloth simulation, new UV segmentation, physical fit accuracy, or true rear material can be inferred from a single camera photo.

## Source fidelity and safety

Same existing Work47 reviewed-cutout source RGB, transparency gate and exact original JPEG/PNG SHA256; same Work54 review evidence; same strict user-triggered preview, same screenshot/alpha provenance and account privacy boundaries. Original JPEG, original garment pixels, masks, category engine, source identity, storage, login and Family Alpha staging are untouched. No Cloudflare/Supabase/Resend/paid models or service calls, no family photos, no Drive Duel code.

3D-05 does **not** approve the licensed cutout as visually acceptable; 15-image independent baseline remains **0 PASS / 5 REVIEW / 10 FAIL**, and Work #53 isolation / Work #55 human acceptance are separate.

## Verification

A dedicated no-deploy source allowlist checks only seven research/test/CI files against exact parent 3D-04 head, then rebuilds the historical licensed 15-photo Work47 benchmark (including the same 9 provisional masks) and runs the entire inherited 3D01–3D04 suite plus 3D05 swept-ring/shoulder/hand/UV/owner-safety tests. The real Chromium software-WebGL2 browser test at 320/390/430 px must run the entire previous real cutout, SHA, black shirt, white lettering, true rotation, dress, unsupported pants fallback, no outside requests, and also verify **two actual swept sleeves and two neutral hand meshes** on the rendered scene. Screenshot artifacts are labelled HOLD for human inspection.

Passing tests prove geometry validity and displayed original pixels, **not** natural human-rated appearance. The owner must still review arm proportions and seam continuity, and compare against 3D-04 screenshots before accepting. Staging and production remain unchanged. Four family testers are not invited by this PR; alpha requires real-device/session, privacy, source restore and deliberate release decision.
