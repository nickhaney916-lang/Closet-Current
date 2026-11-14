# Closet Current Mission 3 — P146 partial mount rollback and owner privacy acceptance

**RESEARCH ONLY. Family Alpha HOLD #255 OPEN. No merge, no deployment, no production/staging/hosted Supabase writes and no private user wardrobe/photo access.** Exact pinned parent verified draft [PR #1120](https://github.com/nickhaney916-lang/Closet-Current/pull/1120), HEAD `fc697635f3a3c4922136c4fe92e209073e3491ab`, [two-job no-deploy CI #43547387104](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43547387104) GREEN, inherited 2,060 / 2,060 Node and 42 / 42 synthetic Chromium/WebKit owner private preview cases.

## Source finding

The local synthetic owner-reviewed cloud review panel P146 at `research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs` inserts the private menu panel, replacement dialog and stylesheet **before** it initializes the underlying consent-bound backup and restore services and attaches session/pagehide listeners. Previously, a synchronous exception during backup factory, restore factory, cancellation handler binding or second event-listener registration could reject `mountOwnerReviewedCloud146()` without returning a revocable bridge to the caller. The inserted owner-private UI would survive the rejection even though no functional bridge existed. This is an actual source-observed failure mode, NOT evidence of an incident in a live account (P146 only activates on loopback with paired research flags and synthetic bearer tokens).

## Change

1. Hoist the stale-session revoke callback so it exists during startup and can clean partially initialized objects.
2. Wrap modal consent-button bindings and both service constructions together; on exception call the existing independent, exception-tolerant `revoke()` and rethrow the original error. Even if only backup service was created, it is revoked.
3. Wrap both global event-listener registrations; if the first was installed but the second fails, revoke the services, disable private buttons, remove all private DOM/styles, and remove the first listener. Keep original error.
4. No transport expansion, backend edits, automatic cloud merge, source JPG alteration, account permission changes or relaxed owner/consent/session guards. Existing 2D original-photo fallback and original/cutout SHA requirements stay unchanged.

## Synthetic source-executed validation

- `node --test tests/mission3-p146-failed-mount-cleanup.test.cjs`: complete actual P146 factory executed in a synthetic owner/DOM runtime: first factory failure, second factory failure, consent dialog listener failure, first global listener failure, second global listener failure, and normal explicit revoke/idempotence. Existing complete-session P146 tests also inherited.
- `node scripts/test-mission3-p146-failed-mount-browser.mjs benchmark/mission3-p146-failed-mount-browser`: **30 planned** actual-source P146 factory cases in Chromium + WebKit × CSS widths 320/390/430 × 5 modes. Assert no former owner modal/panel/style/listener, correct service revocation and no unhandled errors. This is synthetic browser testing, not a physical mobile device.
- Strict exact-parent **five-path** no-deploy workflow includes inherited full serial Node and source-original-photo→private closet→outfit, owner CAS, cloud restore and disposable signed two-owner PostgreSQL/Storage RLS tests. All claims depend on successful new exact-head CI.

## Concrete release-gate checklist (NOT TESTED / BLOCKED until real authorized evidence exists)

| Gate | Required evidence | Current status |
| --- | --- | --- |
| Software source regression | Exact-head successful no-deploy CI, Chromium/WebKit results and raw receipts | Await this PR CI |
| Real Android Chrome | Owner-authenticated device camera capture 15–20 real garments, review/correction, original JPEG SHA persistence, saved closet/outfit, interruption, offline reconnect, 2D fallback; screenshot/redacted logs | BLOCKED — no authorized physical device available here |
| Real iPhone Safari | Repeat capture, reload and memory/session interruption, photo review and original JPEG integrity, 2D fallback, one-item outfit swap, compare separate private family accounts | BLOCKED — no authorized physical device available here |
| Real owner-hosted private cloud | Separate permitted signed users, authenticated JWT issuance, RLS rejection of cross-owner read/write, owner-reviewed double-JPEG backup and restore, cancel/revision-conflict/no-merge and lossless v4 check; never use real private data in public CI | BLOCKED — no authorized hosted cloud/pilot accounts |
| Cross-mission end to end | Compatible immutable exact heads across Mission 1 dual-model owner-review, Mission 2 actual source-photo 3D quality or valid 2D fallback, Mission 3 signed photo/wardrobe/outfit/backup, checked as one artifact | BLOCKED — Mission 1/2 integration work separate |
| Human acceptance and release approval | Four independent protected family accounts, review documented physical-device and quality receipts, owner explicitly removes HOLD | BLOCKED — HOLD #255 OPEN |

### Safe execution recipe for authorized device/cloud QA

Use non-sensitive test garments or owner-approved images, make separate tester accounts, capture original SHA256 locally before upload, then compare post-save and post-restore SHA256. Record **device model, OS/browser build, UTC time, photo count, pass/fail per step, and redacted evidence**, not JWTs or private original images in a public issue. Test no cross-account data on sign-out/same-ID re-login, delayed photo recognition, storage conflict, offline reconnect, cloud backup cancel, atomic restore, and single-item outfit swap. Verify 2D original-photo fallback when unsupported 3D is refused. Do not enable staging/production/cloud or invite testers until separately approved. Report any failed gate as FAIL/BLOCKED, not complete.

**Release decision: NO-GO.** A green synthetic CI is engineering evidence, not pilot or Mission 3 final acceptance. Continue to keep P146 research-only and Family Alpha HOLD open.
