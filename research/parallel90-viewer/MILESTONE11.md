# Mission #90 — Milestone 11: one anatomical-body BVH per actual pose-contact fit

**EXPERIMENTAL RESEARCH ONLY. Isolated draft PR #1178, no merge/deploy or production/hosted database/private wardrobe changes. Family Alpha #255 OPEN/HOLD.**

## Exact-head verified evidence from prerequisite M9 and M10

Corrected [M9 CI #43648937763](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43648937763) **COMPLETED SUCCESS in Chromium and WebKit**, full Chromium Node **2,683/2,683 PASS**, both original 163-bone anatomical rigs and original source-frame/pixel/owner/session comparisons. [M10 CI #43649723977](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43649723977) **COMPLETED SUCCESS in Chromium and WebKit**, full Chromium Node **2,684/2,684 PASS**; its 28 stage timers cover authentic shirt construction plus original body-pose, skeleton validation, cloth-contact and teardown.

M10 same-host **candidate** median original `contactFit` (n=2 shirts per figure, per engine): Chromium female **1,839.9 ms**, male **1,731.2 ms**; WebKit female **2,062.5 ms**, male **1,921.5 ms**. During those same measured selections, original continuous body fitting took Chromium female/male **881.1/953.7 ms**, WebKit female/male **660.5/679.5 ms**. Contact fitting is the dominant isolated garment stage. **This is CI-host research, not physical Android/iOS performance or user-approved cloth realism.**

## Identified redundant work

The original independently sourced `research/three-d-42/posed-contact.mjs` `createPoseContact().fit(pose)` constructs a posed **body** mesh once per pose, then tests up to **12 successive shirt-body collision passes plus a final recheck**. Each call to `triangleContacts(garment,body)` previously performed `new MeshBVH(body)`, even though the original posed body's geometry is unchanged during all passes. The garment geometry *does change*, so its own `new MeshBVH(garment)` must still be built freshly **every pass**. Lowering the pass count, skipping triangle-pair detection or weakening real-photo/pose collision safeguards is prohibited.

## Candidate-only optimization: preserve all collisions

Only within the already detached SHA-pinned PR541 research donor, the P90 installer now additionally edits **one fifth disposable source file**, `research/three-d-42/posed-contact.mjs`. It applies five exact pinned source replacements **only for `P90_PROFILE_VARIANT=candidate`**:

1. Add optional `bodyTree90=null` to `triangleContacts` (external/default calls still construct an original body BVH normally).
2. Use `bodyTree90 || new MeshBVH(body)` for the body, **always** constructing `new MeshBVH(garment)` for the changing shirt.
3. Build `const bodyTree90=new MeshBVH(body.g)` exactly once per original `fit(pose)` after the real posed body is constructed.
4. Pass this exact per-pose tree to each original pass's `triangleContacts` without removing iterations or changing any tested triangles, contact correction, disposal, owner/session checks, or snapshot handling.
5. Pass it again to the mandatory final collision recheck.

All original body/garment coordinates, photographed JPEG/UV/texture source identity, skeleton matrices, normal recalculation, signed-body pose, mesh collision correction and 2D fallback remain unchanged. The unchanged original external `triangleContacts(a,b)` behavior is preserved when no optional tree is supplied. No persistent BVH cache; the tree is scoped to one authentic pose fit and disposed with its body geometry. No new cross-owner/session reuse or image assets.

The paired browser benchmark now **restores five exact PR541 source files** before baseline, candidate and restored variants (and again before final candidate preview). The baseline and restored variants run the original collision solver; **only the candidate uses BVH reuse**. This isolates the performance effect while requiring the same actual original source-photo and skinned-geometric final-frame pixel comparisons. Full Node guards check exactly five donor writes, matching preexisting loop counts and collision termination, and two identical five-file reset calls. A structural check against the immutable original donor confirmed five matching unique transformation anchors and valid transformed JavaScript, retaining all twelve original collision passes and the final recheck. These are preliminary structural checks, **not browser acceptance**.

## Strict acceptance and safety limits

Do not call M11 accepted unless dedicated exact-head **no-deploy Chromium + WebKit** CI passes, full Node and actual repeated saved outfits using the original SHA-attested source photos and original 163-bone male/female rigs, source/owner/revision/session revocation, true context-loss, cloth-contact recorded stats, resource/mesh counts, and same-host baseline/candidate/restored final PNG/canvas pixel checks. Compare **medians of contactFit and full end-to-end time** across variants and both browsers without combining numbers from different CI hosts. If source-frame/fabric/collision output differs materially, reject the optimization and retain M10 reference instead.

The actual user-facing app, production, staging, hosted Supabase and private wardrobes are NOT touched. Physical Android/iPhone testing, arbitrary owner-photograph 3D reconstruction, back/side fabric authenticity, full layered outfits, collision certifications and visual human acceptance remain blocked. **Family Alpha #255 HOLD remains OPEN.**
