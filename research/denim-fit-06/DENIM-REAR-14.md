# DENIM-REAR-14 — source-neutral rear thigh drape (DRAFT HOLD)

Parent: Verified PR #525 SHA 647f48633c60fb01946291075cb75ecd285535b1, Actions #41520617594 SUCCESS.

## Objective
Authentic source-photographed denim fronts remain textured, but modeled side/rear is comparatively smooth. Work only on broad existing independently sewn source-neutral rear upper thigh, using actual 163-bone original anatomical hip/knee coordinates. No invented photographic back, colors, dye, wrinkles or other source material.

## Implementation
- Research opt-in only: denimRear14=after plus exact existing denimFit/denimSilhouette/denimFairing=after.
- Keep all original photograph JPEG/RGB/source SHA, front vertex positions, pantsRest, pantsSourceUV, pantsSourceFront, skinIndex, skinWeight and actual skinned mesh identity immutable.
- Apply broad smooth relief on actual unphotographed upper-thigh original garment rows, fading to zero at hip and knee, bounded <=10 mm. Fail closed if original anatomical hip/knee, both-leg source rows, owner or source verification unavailable.
- Require real 3D77 skinned denim/body BVH triangle contact audit with zero NEW contacts after relief, no invalidated source photo.

## Strict acceptance
Compare exact F08 and R14 on authenticated synthetic account, original photographed source denim A/B, male and female true 163-bone rigs, 390px viewport, actual 180-degree rear WebGL camera. Four matched pairs / eight real WebGL screenshots, >=20 changed RGB pixels per pair, full source SHA and owner unchanged, rear explicitly labeled unphotographed. Original F08 remains untouched and retains exact reset.
Retain all earlier dress, denim, F11 pointer, F12 finger swipe and F13 32 original two-finger WebGL screenshots, privacy/collision/unit gates unchanged. Dedicated GitHub Actions must pass at exact final PR head before this research slice can be called complete.

## Release and truth
Modeled rear geometry IS NOT genuine source photography, is not ten-out-of-ten photorealism and has no physical Android/iPhone approval. No merge, production, staging, deployment, user private garments, billing, or sibling applications. Family Alpha issue #255 stays HOLD.