# Mission 2 — Parallel #85 | independent source-faithful photo dress clearance (HOLD)

## Scope and immutable provenance
- Assignment: [#1121](https://github.com/nickhaney916-lang/Closet-Current/issues/1121).
- Exact donor parent: C61 [PR #1111](https://github.com/nickhaney916-lang/Closet-Current/pull/1111) commit `cd18e9225d35373d076b4bd9775bba36cdb3368a`; C61's original analysis uses strict C52/C58 source triangles and source-surface strain C61.
- Original licensed photo mesh provenance: Commons-0053/P61/P175, SHA-256 `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`. 3,836 source triangles, authenticated 163-bone anatomical rig.
- Original garment photo: *Dress, match (AM 2017.66.33-1)*, [Wikimedia Commons original source](https://commons.wikimedia.org/wiki/File:Dress,_match_(AM_2017.66.33-1).jpg), license [CC BY 4.0](https://creativecommons.org/licenses/by/4.0), catalogue credit “API data Catalogue record Photo,” `author` field empty in the locked manifest. Original source/license manifest is `benchmark/locked-photo-sources.json` at C61 Git blob `5af9b4412e861d6cb6c638e4a414aedcb813f16e`. No claimed independent human provenance approval.
- Immutable donor body/photo build commits: `df6885d6011cb33fb22dceb81a08f35a0ac4dd61` (P541), `6fe5e46b91533a96f3c0d86950ea077cb355c459` (P60), `88d2fdb412f84b0498c86bfa17f4b391425e1958` (P172). All downloaded into throwaway CI worktrees only. Source C60 trial helper blob `beba29e12d7e540c7010893c2a746f77bc01499f`; unchanged C61 strain helper blob `76f5b3ec9e7fcb584829f25f6a31b9934087bdee`.
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
Measured anonymized output: `benchmark/mission2-source-dress-motion/live-source-alternative-clearance85.json`, generated only after genuine-source native WebGL runs. Exclude original photo image, texture and geometry bytes from uploaded artifacts.

## Exact genuine-source observations — NO-GO

**Successful independently executed source run:** [GitHub Actions #43549800718](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549800718), exact run HEAD `7a0103c63521f3f94cdd8072642fb20706fae0cf`: both jobs success; **1,746/1,746** inherited full Node tests pass, zero failures/skips, same consumer build; real Chromium/WebGL photographed original source at desktop CSS widths **320/390/430**, all actual source C52/C58/C61 sweep budgets complete. The subsequent receipt-logic hardening change is separate and requires its own exact-head green run. No physical-phone claims.

**Measured per original pose:** pose 0 neutral, pose 1 left-arm sample, pose 2 right-arm sample. Values are genuine licensed Commons-0053 + 163-bone source, not synthetic geometry; crossing numbers are strict triangle-pair *witnesses*, not physical piercing depth. Every candidate had zero measured garment self strict crossings, zero flipped/collapsed source triangles and zero normal-turn faces above 10° for these three samples.

| Original-photo experiment | Strict body crossings (poses 0/1/2) | Faces >5% edge strain (0/1/2) | Faces >10% area change (0/1/2) | Max edge strain all poses | Max area drift all poses | Sampled numerical guard |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Unmodified original | **196/196/196** | 0/0/0 baseline | 0/0/0 baseline | 0% | 0% | **FAIL body crossing** |
| C60 original cubic upper-torso 6mm | 0/0/0 | **178/178/178** | **90/90/90** | **13.0429%** | **14.5618%** | **FAIL strain and area** |
| P85 quintic-height radial 4.5mm | 4/4/4 | 148/148/148 | 20/20/20 | 10.0451% | 11.6013% | FAIL crossing, strain, area |
| P85 quintic-height radial 6mm | 0/0/0 | 194/194/194 | 100/100/100 | 13.4015% | 15.5681% | FAIL strain and area |
| P85 welded-edge constrained 4.5mm | 4/4/4 | **76/76/76** | **0/0/0** | **6.1823%** | **7.3033%** | FAIL crossing and strain |
| **P85 welded-edge constrained 6mm** | **0/0/0** | **151/151/153** | **0/0/0** | **8.0789%** | **9.1737%** | **FAIL strain** |

**Pareto decision:** The welded-edge 6mm candidate has the best measured combination among the intersection-free samples: strict body 0, self 0, near/zero body pairs 0; high-area-drift faces **90→0**, maximum area drift **14.56%→9.17%**, maximum edge strain **13.04%→8.08%** relative to C60, and high-strain faces **178→151/153** (14.0–15.2% fewer, but still over the absolute threshold). Its original-source position-coincident group gaps were at most ~2.8e-17 meters in the numerical buffer; this is NOT actual UV seam/winding/texture evidence. It moved 7,860 of 11,508 temporary source vertices. Geometry quality is **NO-GO** because **151–153** original source triangles still exceed 5% strain. Smaller 4.5mm candidate improves stretch more but still has **four** actual body intersections in each sampled pose. The higher-order quintic 6mm candidate is strictly worse than C60 on two deformation metrics and is rejected.

**Unresolved contacts:** Original source C58 neutral has 216 body near/zero pairs (196 strict). P85 4.5mm candidates retain 4 strict + 4 near/zero, whereas P85 6mm candidates record 0 strict + 0 near/zero in these sampled poses. None establishes continuous motion safety or clearances in unmeasured anatomy/poses. Self-contact C52/C53 completion confirmed for each candidate; source position/rest/skin/UV/indices and bone matrices unchanged.

**Performance:** The four methods' combined measurement and associated original-source contact/quality sweeps took **565–696 ms per sampled pose** in desktop Chromium at CSS 320/390/430 widths in exact green run. Per viewport/pose samples: 320px [630,613,637], 390px [637,565,656], 430px [630,578,696] milliseconds. CSS widths do NOT represent physical phone performance. Source skinned-world `Float32Array` size = **138,096 bytes**, excluding other buffers and analyzer temporaries; no peak browser heap/memory benchmark measured, so no peak memory or mobile speed claim.

## Visual acceptance and provenance integrity

Genuine original-source front/side/rear desktop Chromium screenshots exist as `chromium-*-02-genuine-163-bone-front-dress.png`, `chromium-*-03-genuine-163-bone-side-dress.png`, `chromium-*-04-genuine-163-bone-rear-neutral.png` in the [P85 actual source CI artifact](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549800718/artifacts/14095816328). **These show original garment only.** None represents a modified candidate or photographic A/B. No rendered P85 temporary buffer, source-photo pixel-difference/UV distortion screenshot, human wearability score or inferred original rear photographic authenticity is claimed. UV/rest and original projected image bytes remain unchanged, but projective image deformation on the temporary candidate has **not** been measured.

No 3D renderer fit, 2D original-photo fallback, owner wardrobe, production, staging, hosted Supabase, real private photo or physical rig source was modified. No actual owner-specific photograph-to-3D reconstruction proved.

## CI, blockers, next experimental directions

- [Initial genuine source Actions #43549334848](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549334848): 1,746/1,746 Node PASS; native measurements were computed at all three widths but the final auditor **failed** because raw wall-clock elapsed time was incorrectly included in a deterministic full C58 receipt equality. A narrow receipt-only correction excluded **only** measured timing from viewport-invariant comparison; **all** source collision/strain/normal/area/face/pose fields remain strict. The full [second run #43549800718](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549800718) passed BOTH jobs, confirming the 4-variant real source numbers above. No existing geometry guards were changed.
- **Quality release blocker:** 151–153 >5%-strain source faces on best intersection-free candidate. No solver gets both 0 source body crossings and every provisional C61 quality bound in any of 3 samples. Real B candidate rendering and photo RGB texture preservation: **BLOCKED**. Independent human cloth acceptance: **NOT TESTED**. Full continuous arm/torso motion, both truly evaluated avatar sexes and actual physical phones: **NOT TESTED**. Authenticated owner-specific photo sources/3D: **NOT TESTED**. Peak memory: **NOT TESTED**.
- **Ranked next trials:** (1) gather **actual C58 crossing witness triangle neighborhoods** and body outward surface normals *privately inside the same source audit*, rather than displacing all upper torso faces; optimize contact local-only while preserving original UV/skin data; (2) contact-constrained edge/area/normal optimization over all three poses simultaneously, with hard C61 caps and no hidden intersections/contacts rather than per-pose posthoc relaxation; (3) seam- and UV-island aware fitting with original photograph projection for true front/side/back candidate render and pixel comparison, plus dynamic pose sweep; (4) independently human review true original-photo candidate 3D at both verified avatars, then actual physical-phone acceptance.
- Maintain full no-deploy tests, exact SHA license source, and source-only room. Main Mission 2 decides whether/how to cherry-pick donor; #84 owns layered outfit/photoreal category coverage and this track does not edit its branch. **Family Alpha #255 stays OPEN/HOLD. NO MERGE. NO DEPLOY.**

## Milestone #85B — exact C58 source cloth witness neighborhoods and adaptive shape research

**Initial new green original-source verification:** [CI #43551081531](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551081531) (native genuine licensed Commons-0053 P61 dress, 3,836 triangles, 163-bone body, 320/390/430 Chromium CSS widths, neutral + both articulated arm poses; full no-deploy Node regressions). The original C58 unchanged strict crossing algorithm identified 196 body/dress pair witnesses involving **17 distinct original cloth faces per pose**. This original cloth face index set is retained solely in the trusted diagnostic's private in-memory Set, never returned as face IDs, owner RGB, XYZ, texture or bone matrices.

**First contact-local results, source verified (neutral / left-arm / right-arm):**
| Temporary exact-source variant | Body strict (3 poses) | Self strict | Faces >5% edge strain (3 poses) | Faces >10% area change (3 poses) | Faces >10-degree normals (3 poses) | Max edge strain | Acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Original 6mm global torso C60 | 0/0/0 | 0 | 178/178/178 | 90/90/90 | 0/0/0 | 13.04% | FAIL |
| Previous #85 welded 6mm global | 0/0/0 | 0 | 151/151/153 | 0/0/0 | 0/0/0 | 8.08% | FAIL |
| 12-hop source-witness-local radial | 0/0/0 | 0 | 65/65/65 | 15/15/13 | 18/18/18 | 38.04% | FAIL |
| 24-hop source-witness-local radial | 0/0/0 | 0 | 24/24/24 | 15/15/15 | 14/14/14 | 32.07% | FAIL |
| 12-hop source-witness-local edge-projected | 0/0/0 | 0 | 5/5/5 | 3/3/3 | 17/17/17 | 7.69% | FAIL |
| **24-hop source-witness-local edge-projected** | **0/0/0** | **0** | **2/2/2** | **6/6/6** | **14/14/14** | **5.21%** | **FAIL** |

These are actual native licensed-source contact and C61 per-face diagnostics, not actual rendered candidate wearability approval. Numerical source-contact progress is substantial, but the strongest candidate also has 6 excessive face area changes, 14 excessive normal changes and two faces above the provisional 5% edge strain limit. No 3D photo texture A/B or continuous pose clearance was established.

**Follow-on method under test:** source graph neighborhoods widened to 32/40 hops, plus two 18-pass displacement-shape-regularized proposals at 24/32 hops, retaining all four original local controls. The same unchanged C52/C58 and C61 analyzers must measure all **eight** witnesses. Exact-head native test outcome of the new four trials is **PENDING**; nothing has been approved for garment rendering or integration. Do not mistake desktop Chromium CSS widths for physical phones. Family Alpha #255 remains OPEN/HOLD, 2D safe fallback stays unchanged.

## Milestone #85C — measured shape-regularized 24-hop residual (exact verified CI)

[Exact-head full green original source CI #43551728583](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551728583): both NO-DEPLOY jobs **SUCCESS**, 1,751/1,751 Node tests passed, genuine licensed SHA-pinned Commons-0053 P61/P175 3,836-triangle original and anatomical 163 bones all three source poses at Chromium CSS 320/390/430 passed complete unchanged source C52/C58/C61 measurements. [Real source anonymous artifact #14096907633](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551728583/artifacts/14096907633). **No numerical candidate passed all provisional guards.**

Best original witnessed topology candidate: 24-hop **18-pass shape-regularized relief**: all three poses strict body intersections **0**, strict cloth self-intersections **0**, unresolved body near/zero **0**, original 3,836 source faces with >5% edge strain **0**, >10% area drift **0**, >10-degree normals **3** per pose; maximum original edge strain **4.61%**, largest area change **9.44%**, highest single face normal turn **21.32°**, 9,504 temporary world vertices displaced. It fails conservative C61 quality because 3 source normals rotate too far. No original garment shader rendered, no original photo UV pixel comparison, continuous motion/phone/human review. **NO 3D APPROVAL.**

Other newly sampled variants (worst across three poses): 32-hop edge projection: 4 strained, 3 high-area, 14 high-normal faces; 40-hop edge projection: 4 strained, 3 high-area, 12 high-normal; 32-hop 18-pass shape regularization: 0 strained, 1 high-area, 7 high-normal. This directs the next experiment to **24-hop neighborhood** and stronger regularization toward the remaining 3 high-normal face defects, not wider indiscriminate displacement.

**Pending next exact-source tests**: deterministic 24-hop 36/60-pass and 36-pass stronger-neighbor-blend research-only alternatives added while keeping earlier 8 candidates as controls; do not report them as measured or acceptable until exact-head CI and source audit pass. Family Alpha #255 open/HOLD; 2D fallback intact.

## Milestone #85D — post-C61 contact-local surface normal investigation

[No-deploy original source CI #43552391462](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43552391462) was **two-job GREEN**. Exact-head real licensed photographed P61/P175 body & cloth original 163-bone poses and unchanged C52/C58/C61 analysis. [Source numerical artifact #14096053478](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43552391462/artifacts/14096053478).

The best sampled numerical candidate through 11 methods is `strict-witness-local-shape-regularized`, 24 graph hops, **36 smoothing passes, neighbor blend 0.50**. It recorded on each of neutral, left-arm and right-arm source poses: body crossings **0**, self crossings **0**, >5%-edge-strain original faces **0**, >10%-area original faces **0**, >10-degree-normal original faces **2**, max normal turn **16.50 degrees**, max original edge strain **4.53%** and max face area drift **9.05%**. This is closer than 18-pass earlier but **FAILS** the C61 normal-turn guard by two faces; real source texture, photo 3D A/B, continuous fabric motion, anatomical male/female validation, physical phones and human approval remain missing. This does NOT permit wear/ship.

For comparison: 24-hop 36-pass default blend 0.35 retains 2 normal violations, max normal 19.65 degrees; 24-hop 60-pass default blend 0.35 retains 2, max ~19.14 degrees. All candidates preserve zero sampled body strict witnesses, but that never guarantees physical continuous clearance.

**Now under test, NOT VERIFIED:** 24-hop original strict witness localized edge+shape optimization with 60-pass blend 0.70, 60-pass blend 0.80, and 100-pass blend 0.80, bringing total to **14** fully source-audited candidates per neutral/left/right original anatomical pose. The original quality metric definitions are unchanged and no new source garment shader/texture or owner photo geometry is committed.
