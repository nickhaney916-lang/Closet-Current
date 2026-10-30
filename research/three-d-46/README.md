# 3D-46 — independent clothing shoulder contour (DRAFT HOLD)

**Parent:** PR #453 head `791da0d8974116fe6e7e0cf01d879efd8101edd7`, built after real 3D45 screenshot review found a still-rounded mannequin-shaped deltoid.

## Working source code
`independent-shoulder-contour.mjs` moves the real photographed-shoot shoulder crest of both physically detached 3D45 cap meshes AND their matching original 3D shirt-yoke seam vertices using the same deterministic source-rig shoulder geometry. This reshapes original cloth, unlike merely subdividing body anatomy. Outer cloth crests and upper sleeve apex are brought inward and downward with bounded smooth radial/vertical falloff. Both figures, source photo, original front print, original UV/panel coordinates, original CC0 skeleton weights, licensed original jeans and original two-dimensional fallback remain untouched. Original open armholes, jacket layers and collar source preserve. All edits are reversible, opt-in via localhost `?construction=after&sweep=after&sleeve44=after&caps45=after&contour46=after` (compare `contour46=before`).

## Strict objective tests
1. Source photograph/UV/skin attributes byte-invariant, original body/jeans untouched, real independent cap meshes persist, bilateral physical 3D contour changes, shared seam maximum gap below 50 micrometers.
2. Previously reviewed 3D42–45 construction, neckline and 5-source/relaxed-pose tests remain green.
3. True actual skinned pose BVH intersection `benchmark/three-d-46/intermediate-triangle-audit.json` MUST EXIST with 28 records: both original anatomy figures × both licensed denim photographs × five arm positions plus repeat; zero measured cloth/body, jeans/body and shirt/jeans triangle crossing pairs. Silent no-op is a failure. No signed containment, no continuous movement proof.
4. Real Chromium original photograph 320/390/430px front/side/rear 50%/relaxed before-vs-after images; no outside network requests or real customers. Inspect actual images and make PASS/REVIEW/FAIL for aesthetic shoulder contour separately. Pixel difference is not human quality.
5. Exact-parent research-only CI scope, no merge/deploy/production/staging, no private family photos, no paid inference or Drive Duel change. Issue #255 Family Alpha HOLD.

## Limits
This is visually targeted original-garment physical mesh tailoring, not a physical sewing solver, cloth simulation, production-ready mobile fitting, complete signed collision-proof or real body size representation. All claims limited to tested source and model variants. Human visual acceptance remains REVIEW until independent actual WebGL screenshot inspection.
