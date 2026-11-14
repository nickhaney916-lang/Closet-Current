# Mission 2 P87 — original photograph SkinnedMesh pose-linked A/B (HOLD)

**INTEGRATION RESEARCH ONLY; family pilot remains blocked.** Branch `research/mission2-p87-pose-linked-photodress-HOLD`, immutable parent **P86** `2d1a62fd75b308086d841cc918d970286128b254`, tracking #1124 and master #1054. No production, staging, hosted Supabase, model changes, live account/owner data, customer imagery or public app source modifications.

## Engineering change

P86's original SHA-locked public Commons-0053 photographed dress has an existing 1.025 horizontal radial fitting hypothesis with independently reported strict pair crossing/strain tests and dual-engine **STATIC** photographed A/B evidence for both actual CC0 163-bone avatars. That static clone was **NOT SKINNED**, and could not follow the real avatar between source and relaxed positions.

P87 introduces a detached-donor **actual THREE.SkinnedMesh** preview with cloned geometry and original photograph-derived material/attributes on the **same genuine 163-bone skeleton**. It keeps the original garment rest/skin/morph/UV/projection attributes and original image/texture objects untouched. On each authenticated research source/quarter-step/relaxed pose, a bounded 2.5% radial world-space target is independently inverted through the original vertex's actual blended bone transforms (four basis samples per vertex), generating a new disposable skinned REST position. The posed clone is checked via real Three.js `applyBoneTransform` against the desired world target with a 0.05mm maximum CPU residual; a singular skin blend fails closed. Recompute is explicitly triggered by donor research `setPose`; this is *per-sample CPU re-fitting*, NOT independent real-time cloth dynamics or a continuously collision-certified animation.

The factory first re-executes P86's source P61/P175/C52/C53/C58/C61 + principal strain gate and refuses an unrelated photo SHA, missing/skipped source, wrong avatar rig, lacking original shared skeleton, wrong material, noninvertible blend, or changed original source/skin/UV arrays. Snapshot bytes of the source geometry are rechecked after updates/toggles. It keeps original source mesh visibility restorable and disposes only owned cloned geometry/material (never shared original textures). On error, fail closed, restore source photo, clear clones. No consumer 3D admission or save is implemented.

## Reproducible verification (new-head CI required)

- New pure numerical three-test fixture covers TWO actual Three.js bone influences, a singular unweighted skin case, and all 0/25/50/75/100% pose interpolation fractions. **These are synthetic math tests, not authentic photographic acceptance.**
- Disposable installer runs strictly after inherited P86 complete pinned original source modules on a detached P541 donor.
- Chromium/WebKit browser harness uses actual public CC BY 4.0 Commons-0053 original cutout, real anatomical male/female 163-bone rig, THREE WebGL and three source/quarter-step/relaxed pose positions. Planned **6 source-pose receipts** per engine and **54 original/candidate/restored source screenshots** over 2 avatars × 3 poses × 3 views × 3 visibility states; exact changed-RGB and restored-original comparison gates.
- Original immutable dress JPEG SHA-256: `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`, [public source and attribution](https://commons.wikimedia.org/wiki/File:Dress,_match_(AM_2017.66.33-1).jpg).
- Full inherited Node suite, production build only with NO deploy, public/ and hosted schema diff guards. Verify all results on exact new HEAD; `CI PENDING` until reported, no precredited pass.

## Mandatory limitations

A successful real WebGL skinned render would prove only a **particular original photographed dress research candidate** moving between explicitly sampled avatar poses. It would not certify arbitrary photo-to-3D reconstruction, source camera dimensions/depth, true cloth simulation, continuous collision clearance, all UV/photo warps, native signed-wardrobe integration, shoes/layers, blind recognition accuracy, independent human photorealism, or actual physical Android/iPhone performance. Even a visually changed image is not an independent realism rating. The source-original 2D fallback remains mandatory and unmodified.

**NO MERGE / NO DEPLOY / KEEP Family Alpha #255 OPEN/HOLD.** The authoritative owner and cross-mission tracking remains #1054.
