# SHIRT-FIT-10 — Nonzero source-photographed gravity rest equilibrium (DRAFT HOLD)

Parent isolated SHIRT-FIT-09 PR #515 SHA `58df848fc1243c20e2eb592cd271cb8ab732ad3c`, exact no-deploy CI #41387350841 SUCCESS. Source: original licensed photographed shirt on genuine male/female 163-bone mannequin.

## Why this next priority exists
F09 proves the frozen photograph garment is stable, source hash preserved and zero observed post-fit body intersections. Its F05 transient spring is damped toward **zero**, however, so it may freeze nearly the same garment shape. A fitting tool must instead converge to a **nonzero gravity-resting shape** and measurably improve geometric drape.

## Implementation (explicit research, OFF by default)
- Reuse F09 source-photo stills, all F03–F08 sewn/sleeved geometry, and true fitted pose.
- Compute bounded deterministic damped gravity equilibrium, target 7.5 mm; 1/60s steps and fail-closed stability criteria.
- Apply the result only to the actual original skinned garment *geometry* near measured lower shirt hem sides; do not fabricate photographed detail or change RGB, SHA, UV/panel attributes, bone weights, color, front artwork, or unphotographed rear.
- Re-run actual source-body triangle BVH after equilibrium. Freeze only on zero remaining contacts, with immutable original-photo proof.
- `gravityRest=after` is opt-in and additionally requires `settleFit=after`. `window.ccShirtGravityRest10(0.5)` gives evidence.
- Research viewer does not enable the feature for public users, save to accounts or modify production.

## Proof and limitations
Require inherited F09 156 actual WebGL screenshot suite plus four new same-camera, same-rig, same-pose WebGL screens comparing F09 frozen versus F10 nonzero equilibrium for male/female at 390px. Require at least ten physically changed RGB pixels per A/B; original photographic SHA and source/skin identity unchanged, zero skinned garment/body contacts, and unchanged frozen output under repeat and 360-degree view controls. This is **a bounded gravity-resting shape model**, not fully simulated cloth physics or a visual 10/10 acceptance claim. Physical phone benchmarks and independent human visual review remain missing. Family Alpha issue #255 HOLD, no merge/deploy.
