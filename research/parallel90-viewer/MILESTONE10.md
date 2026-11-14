# Mission #90 Milestone 10 — attribute genuine fitted-garment pose/contact overhead

**Isolated draft research; no merge/deployment or production/hosted Supabase/private wardrobe changes. Family Alpha #255 OPEN/HOLD.**

## What was verified and what remains preliminary

- M8 exact-head [CI #43640929848](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43640929848): SUCCESS in Chromium and WebKit with 2,681/2,681 Node, original photographed research garments and unchanged final verified-frame pixels, skeletons and owner/session protections.
- M9 first head [CI #43647916254](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43647916254): browser **native owner-photo research viewer passed** and produced 16 real saved selections for each figure/engine, but overall run **FAILED** the later baseline/candidate/restored comparison because a fourth disposable donor source file had not been reset before each experiment. That issue was corrected in M9 exact-head retest [#43648937763](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43648937763), which must be checked independently. No failed-run stage receipt is final M9 acceptance.
- Genuine first-run M9 source-verified browser artifact `saved-switches.json`, eight sampled original shirt attaches per figure/engine, reveals **continuousFit** as the largest individually timed step: Chromium female/male **649/587ms**, WebKit female/male **658/659ms**. `attach` is second at Chromium **339/275ms**, WebKit **506/502ms**. `panelsAndSleeves` is third: Chromium **240/207ms**, WebKit **386/364ms**.
- Critically, approximately **35–38%** of the synchronous original `outfit.setOutfit()` wall time is *not* inside the original 20 fitted-shirt methods, after taking the median of each shirt display's `setOutfitMs - sum(stageMs)`: Chromium female/male **1168/1091ms**, WebKit female/male **2018/1909ms**. These times may include source-pose setup/restore, real body/garment contact creation and fitting, skeleton checks, previous garment release, and bookkeeping. Those unmeasured operations must be separated **before** optimizing or dropping authentic source fabric fitting.

## Non-functional M10 instrumentation

Only the detached, SHA-pinned disposable PR541 research controller `research/dress-mobile-01/dress-outfit-controller.mjs` is modified by the isolated P90 installer. The immutable upstream source version and execution order are maintained. The M9 20 original-fitting-method timings remain. Added eight more phase labels in the *same* numeric timing clock:

1. `detachPrevious` — existing removal of previous meshes before atomic replacement
2. `poseSource` — existing anatomical source-pose alignment
3. `skeletonValidate` — existing 163-bone compatible mesh skeleton gate (never bypassed)
4. `contactCreate` — unchanged genuine pose-contact/sleeve-construction creation
5. `contactPose` — original pose reapplication for contact
6. `contactFit` — existing pose-conditioned cloth contact fit
7. `poseRestore` — mandatory original `finally` pose restoration, including exception/rollback paths
8. `previousRelease` — unchanged old contact and garment resource disposal

All operations still run in their original sequence, with their original arguments, return values, exceptions, source photo identity, source 3D category admission, rig/skin, UV, original fabric and neutral rear. Each new timer wraps the original synchronous operation only. The timer returns the original operation result. A research `next.includes('shirt')` **timing-only gate** prevents dress/no-mesh operations from acquiring fictitious shirt metrics but does **not** skip running any operation. Real shirt model selections must now report at least 27 stage entries with all eight new required labels, finite nonnegative timings summing within the original M8 `setOutfit()` duration. The exact numeric stage metrics are exposed only when the owner/session/wardrobe/JPEG WebCrypto/source-identity native viewer is still active; context loss/revocation must return `null`. No raw images, private identifiers, caching, or cross-session model reuse are introduced.

The complete previous exact same-host baseline/candidate/restored source-frame pixel and SHA comparisons, 163-bone male/female tests, resources, context loss, keyboard/mobile landscape browser simulation, 2D fallback and no-deploy workflows are mandatory. The per-stage reports will permit selecting a separate, narrowly evidenced M11 performance optimization rather than removing collisions or deforming fabricated clothes.

## Acceptance limits

M10 cannot claim faster fitting, genuine photo reconstruction, photorealism, physical Android/iPhone performance, real hosted-account private 3D acceptance, full layered outfits, reliable rear source fabric, or garment collision clearance until independently tested. M9 predecessor and M10 exact-head dedicated Chromium/WebKit CI must be checked independently; earlier passed M8 checks do **not** transfer to M10. Family Alpha #255 OPEN/HOLD throughout.
