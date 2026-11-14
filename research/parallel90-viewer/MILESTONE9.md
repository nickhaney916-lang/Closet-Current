# Mission 90 — M9 trace genuine photographed-shirt fitting operations (NO DEPLOY)

**Family Alpha #255 OPEN/HOLD. Isolated research draft PR #1178 only. No merge, deployment, private wardrobe/owner changes, or production/staging/Supabase writes.**

## M8 accepted exact-head evidence

Dedicated [M8 source-true CI #43640929848](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43640929848) completed **Chromium SUCCESS / WebKit SUCCESS**, Chromium full Node **2,681/2,681 PASS**. Two original anatomical 163-bone bodies, repeated source-attested saved-outfit selection, owner/wardrobe/source SHA checks, real original garment geometry and final same-host baseline/candidate/restored PNG equality were maintained.

The real original research shirt fitting latency is dominated by `outfit.setOutfit()`, **not** GPU submission, source-photo sampling, cleanup or indexed plan preparation. For the pinned shirt-only candidate (4 selections per rig/variant, of which 2 are shirts):

| Engine / rig | Total original shirt apply | Source rig `setOutfit` | Actual WebGL `draw` | Dress rig `setOutfit` |
|---|---:|---:|---:|---:|
| Chromium female | 3508 ms | **3412 ms** | 96 ms | 801 ms |
| Chromium male | 3456 ms | **3369 ms** | 86 ms | 810 ms |
| WebKit female | 7389 ms | **7173 ms** | 217 ms | 1355 ms |
| WebKit male | 7190 ms | **6977 ms** | 212 ms | 1455 ms |

*Browser CI observations, n=2 matching shirt displays per rig/variant, not a device or causal study. Neither arbitrary owner-photo 3D fidelity nor a physical mobile performance gate was tested. M8 was instrumentation and does not cause this speed reduction.*

## M9 scoped, non-mutating investigation

In the already immutable, detached **PR541 donor** research worktree, enhance the existing P90 installer to instrument only `research/dress-mobile-01/dress-outfit-controller.mjs` as a disposable **fourth source file**. The other three disposable donor writes remain panel, showroom and verified source loader. The original donor HEAD SHA is still asserted; the implementation never edits the real original commit, shared model files or production consumer.

Retain the full original `setOutfit()` operation ordering, arguments, side effects, exception/rollback behavior and geometric algorithms. Surround **20 exact original named shirt constructors/fitting/finishing calls** with a tiny synchronous `performance.now()` recorder that returns the untouched original function result. Timed operations include source-attested shirt attach, shoulders, cuff, collar, torso, neck, continuous fitting, sleeve/panel geometry, rear relief and shoulder fall/slope. No operation is skipped, cached, parallelized, simplified, made optional, or granted a new 3D source admission.

The successful source controller can return only `shirtBuildStages90` numeric milliseconds for the actual displayed garment. The original source-verified donor dialog and native bridge expose `sceneShirtStages90` **only after the existing live owner/source/wardrobe revision and JPEG byte-attested viewer gate**. On logout/context loss/source revocation the report must be `null`; it never contains image bytes, source hashes, user IDs, private original photos, model internals or textures. No cross-owner reuse.

The browser test on each actual 163-bone rig/source-attested saved outfit requires the canonical shirt path to execute all present original fitting branches (including attach, independent panels/sleeves, shoulder caps and true shoulder top), each nonnegative finite timing, at least 12 real stages and a total contained within the original measured `setOutfit` latency. Dress has zero shirt steps, and stale viewer revocation must return null. The same-host baseline/candidate/restored two-engine performance comparison reports per-stage median time by authentic shirt source and rig while comparing **original source-photo image SHA, exact canvas PNG pixel output, mesh counts, textures and source flags** to the baseline.

## Acceptance and next decision

The M9 exact-head **dedicated no-deploy** Chromium/WebKit CI must pass full Node, browser gestures, owner invalidation, context loss, 16 real outfit selections per rig in the main switch experiment where enabled, and n=4 same-host paired benchmark per rig/variant. Until both engine checks finish, the M9 timings are **not accepted**, and there is **no claimed M9 speed improvement**. Stage medians will determine which algorithm is worth a separate, measurable, source-preserving M10 optimization. Any such change must preserve original photo integrity, geometry appearance, adequate fitting, skinning and collision checks; never silently replace approved cloth with placeholder clothing.

**Still NOT TESTED / BLOCKED**: physical iPhone Safari and Android Chrome touch/performance, real signed owner with hosted RLS, arbitrary camera-photo-to-3D garment reconstruction, genuine original image back/side/folds/drape, validated collision and body clearance, fully layered original-owner outfits, hardware FPS/GPU/RAM, Family Alpha release. Keep #255 HOLD.
