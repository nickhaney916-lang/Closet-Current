# Mission 90 milestone 3 — remove abandoned startup garment and measure the real bottleneck

DRAFT / NO MERGE / NO DEPLOY. Family Alpha #255 OPEN/HOLD.

Parent: exact accepted M2 `c7c351e4e08d66513450c4f082036b5951a70204`, CI #43628770767 SUCCESS. Existing M34 ancestry and immutable detached PR541 donor unchanged; no M37/P88/P89 source combination or sibling edits.

## Actual source finding and implementation

Pinned `mountAnatomicalShowroom.load()` always constructed neutral pants after loading each rig; the native panel immediately removed them with `scene.applyOutfit('none')` before presenting the explicitly selected photo-bound garment. This generated an unused mesh and setup/render work. The strict donor installer now adds an optional `emptyStartup90=false` renderer argument; **only the native research panel passes true**. Other legacy callers retain their old default. Native startup now has zero garment meshes until the existing source-admitted garment is presented.

No original garment algorithm, geometry/UV, source JPEG, bone/skeleton/weight, owner gate, private-original-byte verification, source capability, source bundle registry or save path changes. Fresh renderer per switch and all original source/owner/revision checks remain. This removes abandoned work; it does not cache or reuse an old owner's private mesh/material/permission.

Read-only phase metrics now distinguish public source-bundle preparation, scene setup, accumulated actual garment presentation, initial garment build and total rig load. Metrics contain no image bytes, credentials or new admission capability. Both rig/source identity and actual initial mesh counts are checked in browser acceptance.

## Reproducible paired experiment

`node scripts/benchmark-parallel90-startup.mjs` runs baseline → candidate → restored on the same worker and engine, fresh browser per variant. Each variant executes four saved selections on each real 163-bone rig (8 changes/variant, 24/engine). Baseline/restored retain the instrumented old pants startup; candidate uses empty startup. The normal full 16-switch/rig/engine acceptance still runs separately.

For each source/rig pair, final actual shirt/dress canvas PNGs are compared baseline/candidate and baseline/restored at operations 1 and 4: eight comparisons per engine, with PNG SHA-256, dimensions, exact changed-pixel count and maximum RGB delta. Any pixel differing by >8 fails; actual observed exact equality is reported rather than assumed. Exact source SHA and final per-mode geometry/texture counts must match. Two synthetic-pixel Node tests prove the comparator accepts identical data and refuses a changed pixel above threshold; they are not garment fidelity evidence.

All profiles and normal acceptance outputs have separate directories. `P90_COMPARE_ONLY=1` compares already produced local profiles without re-running browsers. It does not establish a new current-commit acceptance.

## Initial local Chromium result

- Baseline/candidate/restored: all 24 actual native saved selections PASS, both actual rigs and pinned public garment originals; saved board unchanged.
- **8/8 canvas comparisons PASS, exactly zero changed RGB pixels**; final source IDs, geometry and texture counts unchanged.
- Initial unused garment count: baseline/restored 1, candidate 0.

| Median phase (4 selections/rig/variant) | Female baseline | Female candidate | Female restored | Male baseline | Male candidate | Male restored |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial garment build | 236 ms | 0.55 ms | 229 ms | 325 ms | 1.0 ms | 234 ms |
| Scene setup | 548 ms | 297 ms | 569 ms | 643 ms | 307 ms | 532 ms |
| End-to-end change | 6.81 s | 7.09 s | 7.30 s | 7.30 s | 7.14 s | 7.19 s |

The eliminated work is real, but **no consistent end-to-end speedup is established**. The candidate was slower for the female aggregate in this small local run. Public source preparation remained ~1.2–1.3s and cumulative garment presentation ~3.2–3.5s median. Presentation can include an extra first male transition. These phases explain why removing ~0.2–0.3s does not solve switching latency. Do not describe this as instant switching, guaranteed percent improvement, FPS or physical-phone evidence.

Focused native/guard/comparator checks: **111/111 PASS**. Full local Node **2,675/2,675 PASS**, zero failures/skips (132.3 seconds). Exact-head Chromium/WebKit CI results must be recorded independently in PR #1178 and #1054; parent CI is not new-head acceptance.

## Remaining work and boundaries

Reduce public-source preparation and repeated garment-presentation cost without weakening owner/photo/selection revocation, forging capabilities, retaining private assets across account changes or changing Mission 89's geometry algorithms. A safe reuse design needs explicit lifetime, source/rig/pose identity and bounded memory evidence. This milestone makes that bottleneck measurable instead of skipping validation.

Independent photograph/rear/fabric fidelity, complete multilayer collision/drape, genuine private signed owner-source 3D, physical Android/iPhone/touch/landscape/GPU faults, controlled larger-sample performance, accurate device memory and complete faithful outfit switching remain unverified. Avatar base coverage is neutral presentation, not reconstructed saved clothing. Mission 90 remains incomplete; #255 OPEN/HOLD.
