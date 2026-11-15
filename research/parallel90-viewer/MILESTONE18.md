# Mission #90 Milestone 18 — original-owner-photo shortcut from the actual mobile 3D controls (DRAFT / HOLD)

## Parent and independent goal

M18 is stacked **only** on the exact M17 research head `4d5cd5543657eec197e8a1bd7ddb81ab3ddfc27c` ([draft PR #1197](https://github.com/nickhaney916-lang/Closet-Current/pull/1197)) which in turn descends from M16 `7d07dc68842501d97c1893994dbe80090a0bf132` and M15 `ad3b85f00510949252e7dbc5ced67e4fdfd74c02`. M15 and M16 had **completed two-engine dedicated CI SUCCESS**, but M17 exact-head dedicated #43671950656 exposed a **single inherited structural Node-test failure**: M16 assumed its receipt was immediately adjacent to `finalCamera`, while M17 correctly inserted the `fullCycle17` receipt between them. The first M17 Chromium run reported **2,692/2,693 Node PASS**, failed only `assert.ok(browser.includes('touchSwipe16,finalCamera'))`; browser acceptance is not established for that head.

M18 repairs these brittle field-adjacency structural checks to assert each intended receipt is actually emitted inside `samples.push({...})`, without weakening any source-photo, original JPEG hash, 163-bone, resource or browser behavioral gate. M17 is NOT independently accepted until its own exact head is repaired/retested; a passing descendant does not retroactively make a red ancestor green.

## New owner-facing behavior

A direct, accessible **“View original photos”** 44px-class button appears next to the real source-attested viewer camera controls. It focuses and scrolls to **the already-rendered original saved owner-photo evidence gallery**. The button does not create photo files, fetch another account’s photographs, substitute generic fabric, save garments, promote 2D-only pieces to 3D, change garment slot identity, or modify original outfits. It calls the existing owner session check before acting and fails closed on an invalid session. The gallery receives an accessible region label on activation, and the authenticated original photos remain the same DOM elements.

## Source-specific no-deploy acceptance

At **390 CSS px**, both original **163-bone female/male rigs** in Chromium and WebKit must have a ≥43×43px accessible original-photo button and actual rendered saved photos. Clicking it must focus the pre-existing gallery, retain the precise photo count, and independently SHA-256 hash the first displayed original JPEG using browser WebCrypto to match the source-admitted dress. It must not alter the source-attested 3D outfit, camera angle, geometry/textures or the original signed-in 2D session. The existing M17 source-truth notice is still visible at 320/390/430 widths; M16 continuous Chromium touch-drag, M15 mid-pointer source-revocation, M14 button touch, original saved outfit selection/revision/bytes, source RGB parity, BVH collision parity and all inherited Node tests remain required.

**This is browser-simulated mobile with synthetic owner IDs and authentic locked-license public JPEG sources, not real private signed-hosted owner accounts, source fidelity human approval or physical devices.** Full-owner source-to-3D layered fidelity, signed RLS, GPU RAM/FPS and Android/iOS device acceptance remain BLOCKED; no Family Alpha approval is implied.

All M18 paths are isolated opt-in research installer/browser tests, full Node source guards, no-deploy CI trigger and this report. No `public/`, `supabase/`, original source JPEG/3D mesh/163-bone rig/UV/skin/cloth, production, staging, hosted owner wardrobe or other mission branches modified. No merge, no deploy. Family Alpha #255 OPEN/HOLD.

## M18 exact-head gate

**Do not accept M18 until its exact final commit passes both dedicated Chromium and WebKit no-deploy jobs, the inherited full Node suite, real source-attested browser interactions, same-source RGB/collision paired evidence, and required source guards.** Any CI FAIL must be fixed or explicitly blocked, never promoted as finished.
