# Mission 2 — Parallel #85 | independent source-faithful photo dress clearance (HOLD)

## Scope and immutable provenance
- Assignment: [#1121](https://github.com/nickhaney916-lang/Closet-Current/issues/1121).
- Exact donor parent: C61 [PR #1111](https://github.com/nickhaney916-lang/Closet-Current/pull/1111) commit `cd18e9225d35373d076b4bd9775bba36cdb3368a`; C61's original analysis uses strict C52/C58 source triangles and source-surface strain C61.
- Original licensed photo mesh provenance: Commons-0053/P61/P175, SHA-256 `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`. 3,836 source triangles, authenticated 163-bone anatomical rig.
- Actual new raw photo bytes **not redistributed**, no owner photos, no production/staging, no hosted Supabase, no source mesh changes, no private wardrobes.
- Historic verified genuine-source baseline (C59): 196 strict body/dress crossing pairs per neutral + two articulated pose samples. C60 disposable 6mm (C61 confirmed) removes crossings in three samples, but 178 face triangles exceed 5% edge strain, 90 exceed 10% area drift, max 13.0429% edge strain and 14.5618% area change. **C60 fails** provisional quality gate.
- P85 source tested **only when** `PHOTO_DRESS_ALTERNATIVE85=1` in same detached genuine-photo 3D research donor. Off by default.

## Experimental methods, not fitted-garment approvals
A. **Quintic-envelope radial relief**: preserve radial anatomical direction, try 4.5mm and 6mm with higher-order height feather. This differs from C60's cubic height envelope while retaining source geometry and the bounded displacement.
B. **Welded-position edge-strain projection**: initialize with the unchanged C60 proposal at 4.5mm/6mm; group original coincident skinned-world vertices only in temporary memory; impose bounded 3% per-edge target strain through iterative position corrections and a soft source-proposal spring. Preserve original source triangles/indexing and UV, restore outer-height anchors, clamp displacement; measure any duplicate-coordinate seam divergence. Does **not** imply genuine UV-seam identity, textile mechanics or reliable body clearance.

Four numerical candidates are compared to unmodified original and exact C60 6mm on each authentic source pose. The same unchanged C52/C53, C58 and C61 analyzers are used. All changed vertex buffers are temporary, discarded after aggregate receipts; do not export source coordinates, face IDs or owner RGB. A full reported row includes strict body/body near-or-zero, strict self, edge strain max and 2%/5% counts, max angle and >10° count, area max and >10% count, flipped/degenerate faces, displacement, duplicate-coordinate gap and all source-budget completion.

## Acceptance logic
A candidate may satisfy the *sampled numerical guard* only with exhaustive C52/C53/C58 source sweeps, zero body strict crossings, no introduced self-crossings, C61 unchanged face-quality pass (no source faces >5% strain, >10% face area or >10° normal, no inversions/collapses) and measured duplicate-coordinate divergence below 2 micrometers. This is NOT a human visual, photo RGB, actual UV seam, continuous pose, male/female, physical phone, fabric physics or release approval. Even a sampled numerical pass leaves Family Alpha #255 **HOLD**.

## Actual-source execution (GitHub no-deploy CI)
```bash
node --test tests/mission2-p85-clearance.test.mjs
# In exact authenticated P541/P60/P172 detached source donor:
PHOTO_DRESS_MOTION36=1 PHOTO_DRESS_CONTACT52=1 PHOTO_DRESS_DISTANCE53=1 PHOTO_DRESS_TOPOLOGY54=1 PHOTO_DRESS_EDGES55=1 PHOTO_DRESS_BOUNDARIES56=1 PHOTO_DRESS_LANDMARKS57=1 PHOTO_DRESS_CONTACT58=1 PHOTO_DRESS_BODY_BANDS59=1 PHOTO_DRESS_TORSO_TRIAL60=1 PHOTO_DRESS_STRAIN61=1 PHOTO_DRESS_ALTERNATIVE85=1 PHOTO_DRESS_MOTION_PHASE36=0.25 node scripts/test-native-3d-05-browser.mjs
PHOTO_DRESS_DISTANCE53=1 PHOTO_DRESS_TOPOLOGY54=1 PHOTO_DRESS_EDGES55=1 PHOTO_DRESS_BOUNDARIES56=1 PHOTO_DRESS_LANDMARKS57=1 PHOTO_DRESS_CONTACT58=1 PHOTO_DRESS_BODY_BANDS59=1 PHOTO_DRESS_TORSO_TRIAL60=1 PHOTO_DRESS_STRAIN61=1 PHOTO_DRESS_ALTERNATIVE85=1 node scripts/audit-mission2-actual-dress-contact52.mjs
```
Expected anonymized output: `benchmark/mission2-source-dress-motion/live-source-alternative-clearance85.json`, generated only after genuine-source native WebGL runs. Exclude original photo image, texture and geometry bytes from uploaded artifacts.

## Evidence ledger / handoff
- Before/after P85 genuine-source *numerical* counts: **PENDING exact-HEAD native source CI**; never copy C59–C61 numbers and relabel them as new trial outcomes.
- P85 isolated automated and full suite: **PENDING CI**.
- True candidate-rendered front/side/rear original-photo RGB A/B: **BLOCKED — these alternatives currently produce only disposable world coordinates; no true original-photo shader rendering or photo pixel-difference pipeline has been constructed.** Existing authentic screenshots of the *original* do not show proposed geometry.
- Source-projection texture/UV seam and newly introduced holes: immutable source rest and UV enforced; **visual verification NOT TESTED**. Position-coincident group gap is a numerical diagnostic, not proof of seam continuity.
- Continuous cloth self-penetration, real male and female fit, physical iPhone/Android acceptance, independent human photorealism: **NOT TESTED**, do not infer from three body poses.
- Numerical Pareto decision: **PENDING**. Do not integrate without original-source full green CI and independent visual/continuous source evidence.
- Parallel #84 and main Mission 2: read-only donor information only. This branch must not be merged automatically. Family Alpha #255 stays open/HOLD; production and original 2D fallback unchanged.
