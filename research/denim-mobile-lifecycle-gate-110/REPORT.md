# Closet Current — Priority #110 / DENIM-MOBILE-LIFECYCLE-GATE-110

**Research only. Family Alpha Issue #255: HOLD. NEVER merge, deploy, change production, modify existing staging or touch another project.**

## Evidence-bound source and reason for change
- Exact parent: Priority #109 draft [PR #663](https://github.com/nickhaney916-lang/Closet-Current/pull/663), SHA `c5930d200b8bbd1632b188fb5216bc233cffae8d`.
- Parent strict no-deploy [Actions run #42285949509](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42285949509): SUCCESS.
- Original researched source: two independently licensed original JPEGs, original photographed shirt, and original 163-bone male/female donors. No customer photographs, cloud account or simulated product release.
- Defect: PHOTO109 correctly invalidated a pose on pagehide, but a mobile tab-switch (`visibilitychange` to hidden), document `freeze`, or history restore (`pageshow.persisted`) could leave an already-admitted pose/session available in the same document. Changes to review/wear could clear temporary invalidation. These are real mobile lifecycle conditions and the existing behavior was not independently covered.

## PHOTO110 engineering fix
- Explicit pure, testable policy `mobileSourceLifecycleRevocation110`: hidden/prerendered tab, document/window freeze, pagehide, and BFCache pageshow with `persisted=true` revoke immediately.
- New sticky `lifecycleRevoked` admission gate refuses all trusted tap actions after revocation. Unchecking/rechecking the review box, changing the source/model, tapping wear and returning to the same tab **cannot** clear the gate.
- Revoke any current source pose record and pressed-button states, disable every pose button, and conceal the source-backed WebGL avatar (not an invented garment or a deleted original JPEG).
- A full document reload is required to create a new mobile research review session; original source/photo/SHA admission and explicit garment review/wear must pass again. No hidden replay, persistent state, telemetry or private images.
- Register and remove `visibilitychange`, document and window `freeze`, `pageshow`, and `pagehide` listeners. Initial hidden/prerender documents refuse admission.
- Preserve original denim texture/UV/skin geometry, source SHA checks, genuine photographic identity, 48px mobile controls, and 163-bone left/right/both 8°/16° pose/reset calculations unchanged. The default Closet Current app is **not** modified.

## Independent verification requested by strict no-deploy CI
1. Full inherited application build, Node suite, dedicated PHOTO110 pure policy and source wiring tests.
2. Exact pinned PR541 original 163-bone donor worktree, original P103/104/105/106/108/109 source/photo and geometry installs.
3. Existing original genuine Chromium WebGL source pose browser suite at 320/390/430 CSS px, two licensed sources, male/female 8 mobile scenarios and 24 unchanged-or-stronger original-photo 3D screenshots.
4. New real browser background-tab/foreground transition, irreversible denial on stale consent, actual source render concealment, fresh document reload/original photo review, and document freeze denial, per mobile scenario.
5. Original P103 44, P104 48, P105 60, P106 84, P108 80, P109 24 WebGL screenshot regressions + existing independent SHA/dimension/visual nonblank and pose reset audit.
6. Exact P109 parent and strict **five changed research-only paths**; no default app, production, staging, Supabase, deployment, photo storage or additional projects.

## Important limitations / release status
**The code and tests alone do not prove passing CI.** Exact-head workflow success must be checked separately before declaring research verification complete. The browser's mobile viewport and real tab lifecycle are not a physical Android/iPhone. No independent human photorealism assessment, true photographed rear, arbitrary user-camera garment fitting, signed hosted two-account RLS, general clothing-recognition model performance, continuous physical cloth or Family Alpha signoff is established.

**Family Alpha HOLD; research PR draft and unmerged.**
