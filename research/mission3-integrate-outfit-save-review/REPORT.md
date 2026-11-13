# Closet Current Mission 3 — combined generated-outfit and pending Photo Review exact-owner controls

**Research-only / NO DEPLOY / DRAFT. Family Alpha #255 remains OPEN/HOLD.**

## Source chain and change proof

- Latest independent Mission 3 generated outfit Save/Adjust/Refresh safety [PR #1065](https://github.com/nickhaney916-lang/Closet-Current/pull/1065): exact immutable parent `6952312cc8ce37447452143abddc12a60baec729`.
- Independently verified pending Photo Discard/Refresh safeguards [PR #1061](https://github.com/nickhaney916-lang/Closet-Current/pull/1061): original donor head `b5d429f2aa99f93a9ff00130ec0008fe0494dea3`, GitHub [exact-head green CI #43513251502](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43513251502).
- The source `public/app.js` blob in PR #1065 is byte-for-byte the unchanged common-base app.js of #1059, which #1061 modified. PR #1065 changes only `public/closet-stylist.js` and its dedicated tests/report/CI. No overlap with donor change to `public/app.js`. This integrated branch copies only the exact donor app.js blob, **not** unrelated files.
- Carries unchanged the original 21 production-source synthetic Node cases and 54 Chromium/WebKit mobile-viewports pending Discard/Refresh cases.
- Adds a pinned-parent five-file allowlisted CI workflow that inherits #1065's complete Source/Node, native signed disposable two-owner PostgreSQL/RLS, native IndexedDB, PWA/backup, genuine-photo-to-private-board and Chromium+WebKit browser checks, and adds the pending Review tests to offline/native/browser and receipt gates.

## Owner risk addressed

A pending Photo Discard commit may acknowledge after a different account or same-ID re-login begins. The source now checks exact initiating signed-owner/auth object, DB and capture epoch, frozen original rows, duplicate IDs, and concurrent photo updates before/after IndexedDB CAS. A stale completion does not erase the new account's on-screen photos or receipt indexes. Pending Photo Refresh may only unlock the initiating account's connected control. The generated outfit Save/Adjust lease from #1065 is inherited unchanged.

## Acceptance

**Exact new combined HEAD CI must succeed before calling integration PASS.** Previously green donor tests are not a substitute for testing the combined source. Browser tests use synthetic accounts and simulated mobile viewports, not real iPhone/Android devices or hosted Supabase private wardrobes. Original source JPEGs, SHA-256, signed-owner isolation and 2D fallback are preserved. Neither production, staging nor hosted cloud was changed. Never merge or deploy without explicit release authorization. Recognition and real-photo 3D are separately gated.
