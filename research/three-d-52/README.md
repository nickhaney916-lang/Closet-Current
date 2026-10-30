# 3D-52 — original photographed cap collision repair (DRAFT HOLD)

Exact starting point: integrated [PR #460](https://github.com/nickhaney916-lang/Closet-Current/pull/460) at `12fdd0e3b90d3c0a643db5a3ef3b22a829933873`, including real photographed collar and earlier female cap recovery. This isolated PR does not modify sibling historical PRs.

## Verified blocker
The exact-branch [3D50 CI #41100413214](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41100413214) passed both female original-denim combinations but failed both male combinations with **176 actual shirt/body triangle crossings in the original source arm pose**. This was caused by indiscriminately applying the larger 3D50 sleeve cap envelope to the male source, whose original narrower 3D47 cap already passed. Before 3D50 the male cases passed but female cases had no detached cap coverage.

## Actual correction
`research/three-d-47/upper-arm-fabric-volume.mjs` now counts the *unmodified source-pose detached cap vertices* that the original narrow 3D47 tailoring would move on the left and right independently. If a cap already has at least 10 actual narrow-window movable vertices, that side keeps the previous collision-safe narrow cap envelope. Only a cap that lacks real narrow-window coverage receives the wider 3D50 cap-only source-safe fallback. The original shirt torso always retains the narrow envelope. No gender, clothing JPEG or denim-specific hardcode drives the geometry. Multiple actual cap/torso mesh references are still moved as one shared seam group.

The original source/photo projected coordinates, texture, central chest print, UV proxy, skin weights, anatomical male/female figures, original photographed pants, default app/2D fallback and source photo SHA values are unchanged. The existing hard 0.023 model-unit movement ceiling, real cap and torso bilateral coverage, explicit positive seam witnesses, 28 genuine posed BVH triangle records and default no-release flags are kept.

## Acceptance
- CI must validate both female recovered cap sides and both male baseline cap sides, not just report zero aggregate seam gaps.
- All four source-photo figure × original-denim test cases must retain **zero true shirt/body source and intermediate-pose crossings**; do not loosen collision assertions.
- Original photographed neckline integration and 320/390/430 Chromium screenshots must be regenerated and manually reviewed.
- Passing sampled triangle tests cannot establish continuous motion, signed penetration, fabric physical realism, a human aesthetic PASS, or physical-phone acceptance.

**State:** code committed and tests queued; no CI PASS or realism approval asserted in advance. Strict DRAFT HOLD; no merge, deploy, production/staging changes, billing, paid per-outfit AI, real family/customer photos or Drive Duel. Family Alpha Issue #255 remains HOLD.
