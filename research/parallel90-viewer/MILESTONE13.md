# Mission #90 Milestone 13 — cross-engine mobile visibility and freeze source-revocation acceptance

**Isolated HOLD research only.** No production, staging, actual/private photo data, hosted Supabase, network mutation, merge, or deployment. Family Alpha #255 remains OPEN/HOLD.

## Actual previous code and gap

The existing `research/native-3d-05/native-preview-bridge.mjs` already closes active owner-original-photo 3D on browser `visibilitychange` (hidden/prerender) and `freeze`, aborts stale admissions, blocks opening while hidden, requires a fresh original-source owner lease and exact SHA, and leaves the signed owner/editor and saved 2D wardrobe unchanged. On the Mission #90 dedicated run, the previous NATIVE102 actual browser acceptance executed **only on Chromium**. WebKit already had camera, renderer context-loss and saved-wardrobe selection tests, but did not exercise the same mobile browser background/freeze transitions.

## M13 no-behavior-change cross-browser QA

The isolated dedicated P90 no-deploy workflow now sets `NATIVE102=1` for **both** Chromium and WebKit. The existing NATIVE102 real source-verified synthetic-owner, 163-bone WebGL browser test runs unchanged in semantics for both engines: 390px device-sized viewport, actual opened verified research source-photo 3D, synthetic DOM hidden/visibilitychange, synchronous source-photo removal and 3D lease revocation, blocked hidden reopen, signed owner/session still active, unchanged saved private 2D board; restore visible, explicit re-open with model/rig admission; synthetic `freeze` event again revokes 3D photo, preserves owner session and 2D wardrobe. No browser tab actually enters a mobile OS suspend and **NO physical device is tested**.

The artifact writer now chooses the existing Chromium `benchmark/native-3d-102/` or new WebKit `benchmark/native-3d-102-webkit/` so evidence never overwrites another engine. Per-engine acceptance JSON records the real browser engine, distinguishes NATIVE92 original-byte extra acceptance (only on Chromium) from generic source-attested reopen in either browser, and preserves no-photo/owner-sensitive artifact constraints. No base native session/renderer, shared source JSON, signed authentication, WebGL garment geometry, camera controls, privacy check or photo SHA gate is weakened. Explicit Node source structural tests require both engines' workflow flags, separate paths, dual events, original saved board immutability, auth preservation and original bridge listeners.

## Acceptance and limits

Dedicated exact-head Chromium+WebKit CI must pass the complete prior M11 source/collision checks, M12 same-source BVH-only A/B, and now M13 cross-engine hidden/reopen/freeze lifecycle tests. Any WebKit behavioral failure is a blocker, not grounds to skip the test. Browser-emulated 390px size cannot prove native hardware, actual iOS process pause, Android background memory reclamation, physical GPU reliability, or real hosted owner RLS. Original dress, blouse, pants and independent arbitrary user-source 3D fit/realism/layering remain unverified; coordinate with Mission #89 and master #1054. Family Alpha #255 HOLD.
