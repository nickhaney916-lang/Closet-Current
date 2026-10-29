# Closet Current — 3D-27: source-preserving subtle side/back dress drape

**Status: RESEARCH / HOLD — not a photorealistic fit or Family Alpha release.**

## Why this exists

Latest verified integrated [PR #431](https://github.com/nickhaney916-lang/Closet-Current/pull/431) corrects green studio basewear showing through photographed sleeveless dress armholes on the verified adult male/female CC0 anatomical figures. Genuine WebGL screenshots at 430px show a good improvement at shoulders and armholes, but the lower skirt remains a **rigid geometric cone**, despite original fabric photos having genuine creases. The adjacent neckline/armhole Work #66 is not duplicated. The independent main-thread next focus is only the lower skirt silhouette.

## Actual bounded garment-mesh implementation

- New isolated `research/three-d-27/skirt-drape.mjs` operates on the **already source-hash-verified, source-shaped, physically separate original skinned anatomical dress**: not an HTML sticker, shader re-color, modified photo, or a separate invented dress. It runs after `fitAnatomicalDress` and **before** `finishAnatomicalOpenings`, so finished neutral opening edges follow their true original garment boundary.
**Screenshot-led correction:** The first apparently green 3D27 [run #40945331632](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40945331632) exposed a significant actual visual FAIL: horizontal black bands across the original photographed upper bodice/chest, despite all earlier geometry/browser tests passing. Investigation found that CC0 `spine04` is higher in the upper torso than the dress waist: directly using its Y unintentionally deformed the chest. This is **not acceptable**. The revised module limits motion to a separately guarded **hem-derived lower-skirt transition**, below `min(spine04 - .18m, hem + .60m, 1.28m)`. New GPU screenshot regression asserts **zero changed pixels** within the original upper photographed chest region across both actual poses and figures. Only lower-skirt silhouette changes are intended; the prior green run is not claimed as visually accepted.

- Applies a deterministic seven-panel, smoothly ramped side/rear hem ripple (outward displacement **0–18mm only**, no inward collision-promoting shrink) based on original model-space anthropometric waist and garment hem positions. Front center and front quarter of the dress are **pixel/geometry unchanged**, and all upper torso/neckline/shoulder/armhole coordinates stay exactly unchanged. Existing `dressRest` photographed source RGB/UV, skinIndices, skinWeights, source JPEG and transparent PNG, verified CC0 models, source hash and license, original fit and 3D26 underlayer all remain unedited. Original V piping on front is never moved by this modifier.
- Dresses only. Original photographed AJ shirt + pants must remain **pixel-identical** in actual browser comparisons. Failed review or source mismatch still rejects candidate, with existing atomic controller rollback.
- New opt-out `?skirtDrape=before` compares the **same** anatomical dress+actual photo+poses+camera with this single side/rear skirt drape off. All other visual improvements remain on in both modes; no suggestion that simple folds are full cloth physics.

## Exact validation requirements

- CI scoped to the 8 research-only new/edited files on exact PR431 head `e513844d8d39b57ccb294b32358ce16b494ff800`; no staging, production, user photographs, app data, or 2D algorithms changed.
- Rebuild original 15 licensed JPEG / nine original-RGB provisional masks and original SHA-locked CC0 male/female body binaries; no remote network in browser.
- Pure tests: bounded 18mm outward displacement, original front and upper body unchanged, actual male/female skeleton and garment mesh transformation, photo mapping/skin source stats preserved, rollback on unreviewed candidate, all original work26 basewear/PR25 integration invariants.
- Real Chromium WebGL2 tests for female 320px and female/male 430px in exact source and relaxed poses, front/three-quarter. Original photographed dress before/after images and quantified difference pixels. Same exact screenshot dimensions, source hashes, mesh/texture resource counts, original neutral basewear, original AJ shirt control **zero changed pixels**, zero external browser network.
- Source dress front photograph, logo, neckline/armholes stay intact. Reject if regressions or if user-visible side/hem changes don't meaningfully improve visual quality; this is a **comparison candidate**, not a verdict.

**Boundaries:** Source rear not photographed, no actual cloth physics, no collision clearance guarantee. Human visual acceptance requires separate reviewer; latest previously benchmarked 15-photo visual scores have not been rerated. PR431 and Work #66 remain untouched. Family Alpha #255 remains HOLD until actual privacy JWT/RLS, cloud restoration, real devices, all necessary CI and owner visual quality gates. No merge, staging, production, paid per-use AI, private family photos or Drive Duel edits.
