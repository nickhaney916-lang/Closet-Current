# 3D-42 — original-shirt source/relaxed upper-back + shoulder contact (DRAFT / HOLD)

Built strictly on [PR #448](https://github.com/nickhaney916-lang/Closet-Current/pull/448) exact successful head `ff02ed1c2e978dccf8a7761004461d33d9a030f7`; no deployment, merge, staging, production, private photos or Drive Duel.

## Implementation
`posed-shoulder-clearance.mjs` constructs real **skinned** body-triangle BVHs in the original and relaxed poses, probes the actual original-source photographed shirt mesh, and applies bounded shoulder/rear corrections in its original **rest** coordinates via inverse weighted skin matrices. Duplicate photo-panel seams receive identical moves. Existing collar, front photographed central print and source-panel coordinates are protected. Non-position attributes (including original `panelPosition`, `panelNormal`, `skinIndex`, `skinWeight`) must be byte-identical. Shirt visual pixels and original JPEGs are not changed. Prior PR448 independent photographed pants and existing neutral/dress controls remain unchanged.

Opt-in in the real localhost research demo: `?sewn=after&contact42=before` vs `?sewn=after&contact42=after`. This stage is **OFF by default** (no PR448 regression until owner review).

## Exact acceptance gate
- Both anatomical figures × both licensed denim source images, source/relaxed anatomical posing.
- Real posed body/shirt triangle intersections through independent existing 3D41 BVH detector. Improvement requires after <= before for **every** audited combination, and total strictly lower; shirt/jeans and jeans/body must remain zero crossing pairs.
- Source-shaded photograph, panel data, original skin weights, original CC0 models, and separately patterned jeans unchanged.
- Genuine Chromium front, three-quarter, side and rear A/B screenshots at widths 320, 390, 430 with original sources and both poses.
- No external browser requests and no production/staging/paid services.

## Limits
This uses nearest original posed triangle normals as a bounded geometric correction; it is **not** a signed volumetric collision solver, a dynamic cloth simulation, physical body measurement, or sewn garment physics. Triangle crossing segments are a useful objective but cannot establish absence of interpenetration/containment. Report observed before/after counts and visibly inspected screenshots; do not claim a general visual PASS or family-ready state.

Family Alpha Issue #255 remains HOLD. All historical research PRs stay unmerged and source-authoritative 2D photo board remains fallback.
