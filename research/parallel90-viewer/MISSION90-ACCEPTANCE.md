# CLOSET CURRENT — Parallel Mission #90: Engineering closeout and acceptance ledger

**Status at report creation:** **IMPLEMENTED IN RESEARCH / FINAL EXACT-HEAD TESTS PENDING / FAMILY ALPHA HOLD**. Not a claim of production completion. Issue [#1174](https://github.com/nickhaney916-lang/Closet-Current/issues/1174), master [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054), release gate [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255). This report deliberately separates independently passing browser evidence, pending final branch checks, and dependencies that cannot be demonstrated without genuine devices/garments/private accounts.

## Exact branch and lineage

All changes remain isolated, stacked **draft pull requests**, not merged or deployed. Genuine original donor pinned to `df6885d6011cb33fb22dceb81a08f35a0ac4dd61` (PR #541). The original anatomical avatars remain **male and female 163-bone** source rigs; garment images are SHA-pinned, legally licensed public photographic fixtures. Session/owner data in browser tests are **synthetic**. All 3D support is opt-in research; unsupported clothing remains the correct owner's original-photo 2D.

| Milestone | Draft PR | Exact committed browser no-deploy acceptance |
| --- | --- | --- |
| M14 Native source-verified viewer, keyboard controls, genuine saved outfit and 2D fallback | [#1178](https://github.com/nickhaney916-lang/Closet-Current/pull/1178) | [#43662663263](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43662663263) Chromium + WebKit SUCCESS at `1b6fb1a2019e9b1e8e5ed55cc1f847809460ced9` |
| M15 Held-pointer drag + mid-gesture old source revocation | [#1193](https://github.com/nickhaney916-lang/Closet-Current/pull/1193) | [#43664365949](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43664365949) both SUCCESS at `ad3b85f00510949252e7dbc5ced67e4fdfd74c02` |
| M16 Continuous genuinely browser-dispatched Chromium CDP touch swipe; WebKit native touch-button controls but **NOT proven WebKit continuous swipe** | [#1195](https://github.com/nickhaney916-lang/Closet-Current/pull/1195) | [#43664867314](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43664867314) both engine suites SUCCESS at `7d07dc68842501d97c1893994dbe80090a0bf132`, gesture evidence only Chromium |
| M17 Full 360° source-honest front/side/rear orbit | [#1197](https://github.com/nickhaney916-lang/Closet-Current/pull/1197) | [#43672668771](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43672668771) both SUCCESS at corrected `1378d2985e982c5759a18e1aeabc4a9c32930b5e` |
| M18 Accessible original saved photographic gallery shortcut, authenticated photo bytes SHA | [#1198](https://github.com/nickhaney916-lang/Closet-Current/pull/1198) | [#43672555571](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43672555571) both SUCCESS at `1e22d27a522167cf232a87c87f96b9ae6d5e0232` |
| M19 Touch-sized Pause rotation, real camera-motion acceptance | [#1199](https://github.com/nickhaney916-lang/Closet-Current/pull/1199) | [#43672998252](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43672998252) both SUCCESS at `afce7ad364ae6fe2f08f7893d9203de4a113867d` |
| M20 OS Reduce Motion, live-spin cancellation, explicit orbit inertia purge on reset | [#1201](https://github.com/nickhaney916-lang/Closet-Current/pull/1201) | Original `acd5e25e` Chromium **FAIL** after Node 2,696/2,696 PASS: strict gallery camera drift. Corrected current HEAD `0152094c507070b606066f3934efd12820b951aa` new exact-head [#43675488832](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43675488832) **PENDING at report creation**. Fix preserves strict <0.01-degree camera rule and uses original OrbitControls momentum flush, not a relaxed test. |
| M21 Four actual source-attested close/reopen loops, old WebGL GPU context loss, fresh canvas and session | [#1203](https://github.com/nickhaney916-lang/Closet-Current/pull/1203) | Corrected and cleanly stacked onto M20, HEAD `1971efc771a89d8217aa52d13a74fd89c22aade9`; [#43675649887](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43675649887) **PENDING** at report creation |
| M22 Unsupported WebGL2 source-safe fallback and recovery, terminal research suite | This draft | Exact head no-deploy Chromium+WebKit **PENDING** at report creation, no success claim |

## Requirements matrix

| Mission #90 assignment requirement | Evidence / disposition |
| --- | --- |
| Genuine anatomical male/female 163-bone rigs, valid saved source SHA, owner revision/session and wardrobe selection contract | **PASS for licensed public photo / synthetic account research** in M14–M19; **BLOCKED for real signed hosted owner and arbitrary owner-clothing reconstruction** |
| 360° left/right/front/side/rear, bounded zoom, keyboard, pointer, responsive 320/390/430 landscape | **PASS in desktop Chromium and WebKit emulated mobile viewports**; M16 continuous real browser touch gesture is **Chromium-only**; WebKit continuous finger gesture and physical phones **NOT TESTED** |
| Original front photo authoritative; no fictitious rear photo claim; unsupported jacket/shoes/layers photo-only | **PASS in original-source research; SOURCE PHOTO 2D maintained**, M17 warning visible |
| Original outfit selection/swap, dress-over-bottom, preserved original closet and 2D | **PASS for pinned synthetic-owner research**, repeat 16 source/identity-verified saved switches and fail-closed privacy/session checks; not an approved consumer production handoff |
| Context lost, source switch, owner logout, tab hide/freeze, renderer teardown | **PASS in inherited simulated browser tests**; M21 repeated old context-loss/canvas teardown is **PENDING new exact-head CI** |
| Missing WebGL2 => authentic original owner photo fallback (NOT blank/fake) + source-attested recovery | **New M22 cross-engine test implemented, exact-head CI PENDING**; the existing pinned donor explicitly catches unavailable WebGL2 |
| OS Reduce Motion and accessible Pause rotation; 44px-class controls | M19 2/2 SUCCESS, M20 **pending corrected exact-head CI** |
| Startup, camera latency, geometry/texture object counts, same-source BVH contact A/B and source-true frame parity | **Measured on CI browser research**; **GPU actual allocated bytes, physical FPS/thermal, real device RAM NOT TESTED** |
| Genuine owner-origin arbitrary multi-garment photo reconstruction, real source-faithful rear/cloth/drape/side, layered physical fitting | **BLOCKED by Mission #89** (source reconstruction research only, human physical fidelity not accepted). No unverified 3D admission |
| Genuine signed owner RLS, private family 4-user Alpha, integrated source capture→review→closet→outfit→3D→restore | **BLOCKED by master #1054 and Family Alpha #255**; opt-in donor branch does not replace production consumer app; no real owner credentials or private photos used |

## M22 negative test and recovery

At 390 CSS px in **both** Chromium and WebKit after original 163-bone/source-attested dress 3D:
- Close genuine owner preview and override *only* `HTMLCanvasElement.prototype.getContext('webgl2')` for this browser test. The pinned donor's actual WebGL2 probe must fail.
- Require native panel `modelReady=false`, `bones=0`, clear original-photo/2D fallback status, **four unchanged saved clothing photos**, independent WebCrypto SHA-256 of displayed original JPEG equal to admitted garment source, and signed native 2D owner + selected saved outfit unchanged.
- Restore browser prototype in `finally`, close and clear private fallback images, then reopen through real Preview button. Original native source lease, saved slot/wardrobe revision and original JPEG bytes are reattested; actual 163-bone 3D mesh, source SHA, geometry/texture counts and camera control must work again.
- Write only source-safe boolean metadata receipt `benchmark/parallel90/<engine>/390-webgl-unavailable-fallback.json`. This is a **browser-injected no-WebGL2 fault**, not a physical hardware GPU failure.

## Acceptance and release decision

**Research engineering status: IMPLEMENTATION READY FOR FINAL CI, NOT FINISHED/ACCEPTED before latest M20/M21/M22 exact heads all green.** If any run fails, repair only the source-supported behavior, retain original strict owner/source/photo/camera acceptance, re-run exact head. Never mark a failed, cancelled or queued CI as success.

**Mission #90 FULL release closure: BLOCKED** on real Android Chrome + iPhone Safari testing with measured performance, continuous WebKit finger swipe where required, signed independent real hosted accounts/RLS and original private wardrobe, and real owner-photo-sourced multi-category high-fidelity 3D clothing fit/rear/drape/layered review from Mission #89, followed by master #1054 integrated acceptance and explicit authorization. An isolated research demo, passing browser CI, or all-milestones-green cannot authorize Family Alpha.

Guardrails: **No merge, no deploy, no staging or production, no hosted Supabase, no raw private owner images, no user wardrobe writes, no commercial spending, no PR branch overwrite. Family Alpha #255 stays OPEN/HOLD.**
