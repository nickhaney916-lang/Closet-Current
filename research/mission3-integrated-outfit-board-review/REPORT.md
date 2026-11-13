# Mission 3 — unified native Outfit Board and Photo Review owner-session safeguards

Research-only, **Family Alpha HOLD #255 OPEN**, draft only. No merge, staging/production, hosted Supabase or private owner data changes.

## Exact compatibility and inherited scope
- Target: [Mission 3 PR #1069](https://github.com/nickhaney916-lang/Closet-Current/pull/1069) exact head `9a8a5fe8de82dd7ecaf8437e2a6f343cc1915066` — private Outfit Board Save, Retry draft, Load latest, Keep local, Refresh closet and autosave timer session protection. This branch inherits its seven-path source and tests unchanged.
- Donor: [previously verified combined Mission 3 PR #1067](https://github.com/nickhaney916-lang/Closet-Current/pull/1067) exact head `fb582cc42388117701ad96f25d47f1166e15a212`, [green full no-deploy CI #43514576191](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43514576191), 1,920 Node, 102 generated-outfit, 54 pending Photo Review Chromium/WebKit scenario passes.
- Exact file evidence: Target PR #1069 changed only `public/outfit-board.js`, the two old Outfit Board fixture tests, new tests/browser harness/report and CI; `public/app.js` on its current head is byte-for-byte identical to PR #1065's app, before donor PR #1067 added pending Photo Review protections. Therefore copying the donor `public/app.js` loses none of target's board changes.
- Added only five paths: donor `public/app.js`, exact donor pending Photo Review 21-case Node fixture, exact donor 54-case synthetic Chromium/WebKit 320/390/430 CSS viewport fixture, this report, and a pinned-parent no-deploy workflow.

## Source protections
- The donor reviewed Photo Discard and Refresh paths preserve original-photo rows, exact signed auth owner object, private DB, epoch, and source CAS before/after awaited work; stale or failed operations cannot clear another signed account's visible photos or receipt state.
- Target native Outfit Board Save and asynchronous draft controls retain their existing private account lease and transaction safeguards unchanged.
- Original JPEGs, source SHA-256 identities, owner correction requirements, private wardrobe, backup/restore and 2D fallback remain unchanged.

## Evidence gate
The combined branch's own exact-parent CI includes prior native Board Save/Retry/Load/Refresh, generated-outfit, saved-card, Photo Review, full serial Node, Chromium/WebKit mobile viewport, native IndexedDB, disposable two-owner PostgreSQL/Storage RLS, cloud recovery and original-photograph-to-owned-2D-outfit checks. It refuses unlisted paths; does not deploy.

**Do not call combined PASS until its exact-head workflow both jobs complete SUCCESS.** This is synthetic/mobile-viewport QA, not real physical-device, authorized live hosted cloud, independently measured recognition or genuine source-derived 3D acceptance. Family Alpha release remains BLOCKED.
