# CLOSET CURRENT — CC-PAR-03 MAIN THREAD HANDOFF
### Independent genuine photographed 3D dress fitting — Draft HOLD
**Date:** October 31, 2026 Pacific  
**Base PR:** [#480](https://github.com/nickhaney916-lang/Closet-Current/pull/480) exact head `d37a68faec58614f46896b50933bc6769a5977d7`  
**Isolated draft:** [#487](https://github.com/nickhaney916-lang/Closet-Current/pull/487)  
**Branch:** `research/cc-par-03-source-dress-tailoring-HOLD-20261031`  
**Family Alpha #255:** HOLD. Never merge or deploy without main-thread permission.

## Scope and actual source
Photographed licensed dress **Commons `commons-0053`**, “Dress, match (AM 2017.66.33-1)”, CC BY 4.0. Source page: https://commons.wikimedia.org/wiki/File:Dress,_match_(AM_2017.66.33-1).jpg. Pinned original JPEG SHA-256 from `benchmark/locked-photo-sources.json`: `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`. The untouched Work47 manifest and source-RGB transparent cutout are re-created locally and SHA-checked by `loadLicensedCutout`. Work47 originally marked the source **REVIEW** because the mannequin neck removal, armholes/collar fringe, and traced edges require manual acceptance. There is **no genuine original side or rear photograph**. The absent fabric is represented as source-derived neutral material, not a fabricated photograph.

## New isolated research implementation
- `research/three-d-74/source-true-dress-tailoring.mjs`: pure bounded `dress74Fold` and opt-in `tailorSourceDress74`. Applies source-neutral asymmetric pleat relief only to lower side/rear positions on the actual dress skinned mesh, with max additional radial displacement 21mm and hem drop 4mm. Nonnegative outward expansion avoids deliberately tightening the skirt through the legs, but **is not actual collision verification or cloth simulation**. Upper bodice, bust/waist fitting, neckline, armhole geometry, photographed front, `dressRest` UV/source coords, original pixels, already welded normals and skin weights remain unchanged.
- Small dress-only OFF-by-default research options to `research/three-d-15/outfit-controller.mjs` and `showroom.mjs`. The existing baseline is unchanged until explicit `dress74=true`.
- `research/three-d-15/demo.mjs` accepts local comparison `?dress74=before` / `?dress74=after`, enabling the same premium 360 camera and same licensed dress sources. This is an offline local benchmark, not an authenticated user wardrobe.
- `tests/three-d-74-source-dress.test.mjs`: deterministic finite protected-front tests, failure-closed fake-source input, actual licensed 163-joint male/female rigid source model tests, default-off regression and review rollback.
- `scripts/test-three-d-74-dress-webgl.mjs`: 2 rigs × 3 widths (320/390/430) × 9 camera headings (0,45,90,135,180,225,270,315,360) × 2 before/after states = **108 expected genuine Chromium software WebGL PNGs**, original source SHA equality, visual side/rear pixel differences, 360 return, privacy/no outbound requests, and `gallery.html` / `results.json`.
- Strict no-deploy workflow `.github/workflows/three-d-74-dress-source-no-deploy.yml`; only approved research files can change, and original assets are restored by SHA.

**Verification status:** Check exact-head GitHub Actions on PR #487 before interpreting 108-frame results. A queued or failing workflow is **NOT** evidence of complete screenshots. Real phone testing and independent human clothing photorealism acceptance are **NOT TESTED**.

## QA matrix

| Test/quality gate | Status | Grounding |
| --- | --- | --- |
| Original photo JPEG source SHA & licensed attribution | PASS (baseline contract) | Original locked source; Work47 SHA validation |
| Source-RGB/alpha remains untouched by new geometry | PASS (by design/code) | Modifier only sets position attribute; image mapping, normals and skin untouched |
| Exact both 163-joint figures functional | Pending exact-head CI | Rig tests and actual WebGL |
| 9 camera headings and 320/390/430 capture | Pending exact-head CI | 108-frame dedicated workflow |
| Genuine photographed front retained | REVIEW | Historical Work47 dress mask only REVIEW; human needed |
| Upper shoulders, bust, neck, armholes | REVIEW | Existing anatomical fitter preserved, not independently visually accepted |
| Lower-skirt motion/contact and fabric physics | REVIEW | Static 21mm bounded deformation, no dynamic sewn simulation |
| Original photographed 360° fabric realism | FAIL | No original side/back photographs; neutral nonphotographic material |
| Physical Android Chrome & iPhone Safari | NOT TESTED | Browser software WebGL cannot certify physical devices |
| Family Alpha release | HOLD | Issue #255 |

## Five prioritized remaining dress defects — for MAIN, not this track
1. **Original side/rear fabric continuity:** no original back view and conspicuous neutral regions. Require vetted supplementary photographs or transparently retain 2D; do not invent original marks, seams or texture.
2. **True shoulder, collar, V-neck, armhole sewing:** avoid rigid shell, clear actual anatomy, remove traced fringe and preserve photographed fabric around openings.
3. **Bust/waist to hip contact:** inspect female and male anatomy for mesh intersection under relaxed and intermediate poses, with triangle sampling instead of relying on fixed radial envelopes.
4. **Natural skirt drape:** replace static radial A-line/pleat proposal with source-calibrated panels, true hem edges, gravity/drape and validated motion clearance without overfitting photographs.
5. **Independent source fidelity + physical-device QA:** annotated original vs rendered color/pattern/alpha comparisons, full 360 screenshots, phone WebGL memory/latency, human review at all 320/390/430 widths; keep original-photo/2D fallback for unsupported garments.

## Boundaries verified by path scope
No direct changes to 3D-73 denim work, main/production/staging, photo recognition or indexing, authenticated accounts, family photos, billing, Drive Duel, or Delta Ebb. Do not confuse functional rendered geometry and original source SHA correctness with an owner-approved photographed 3D dress. Human photorealism, physics and actual phone acceptance remain HOLD.
