# Closet Current — original source-anchored face and hair modeling (2026-10-19)

## Goal

Replace the near-featureless buzzcut and expressionless eyes in the two original adult 1941×3597 Blender figure review candidates with **entirely original procedural detail**, without downloading any hair meshes, faces, skin textures, identity scans, or billable AI services. This is stacked on PR #57 and remains a visual REVIEW/quality experiment only.

## Actual new geometry, not an image effect

- Exactly one female and one male original MakeHuman/Blender adult figure from pinned CC0 source files. Existing source face/body vertices, eye mesh, arm pose, original raw wardrobe photos, product classifications and previously constructed garment cuffs/hem/collars remain unchanged.
- `scripts/figure_face_hair_geometry.py` uses actual pinned source eye geometry and head mesh surface points to build **two eyebrows and two restrained upper-eyelid contours per figure**, plus 21 shortened, thin scalp fibers within the original source crown envelope rather than a completely featureless hair cap.
- The female receives 8 sparse original, shorter ear-level side framing strands, while the male retains a cropped style. These are the same two fixed adults for all users, not personalized bodies or fake identity likenesses.
- All generated curve radii are capped, curves are built locally in Blender with original project shaders, missing/unusual source geometry is rejected instead of inventing eyes/face placement. Head+eye source meshes and their licensing/cryptographic provenance remain untouched.
- Local standalone geometry tests enforce finite, repeatable hair/eye positioning on synthetic source mesh, immutable raw source, correct male/female distinction and strict fail-closed invalid geometry.
- Full native Blender CI must generate both original editable 1941×3597 masters, the existing full-res PNG/647/970/1294 lossless WebP derivatives with exact visible RGB/alpha validation, 24 Android Chromium/iPhone WebKit emulator cases and full application test suite.
- Node gate checks actual scene-reported curve counts and that production approval, photorealism proof and real-phone results remain **false**. Pipeline hashes include new source art code.

## Required visual quality check

Compare **actual images from the new CI artifact** to PR #57 at their rendered native pixel resolution, not just the source model or unit tests. Potential failures to watch: misplaced floating eyebrows, eyelids above wrong area, sculptural strands covering irises, hair hanging in detached ropes, or new hairstyle that looks worse. If those exist, revise or hold these generated assets rather than promote them.

This is a noticeable original cosmetic geometry attempt, **not** finished realistic commercial figures. Independent full-size face/hair/skin art review, source-aligned fit landmarks, true body occlusion, rights signoff and physical Android/iPhone testing remain open. No accepted real-photo cutouts/fitted customer images are established by this work.

**No GitHub merge, deployment, paid inference, vendor purchase, customer photo upload, unapproved public figure replacement or Drive Duel modifications.**
