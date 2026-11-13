# Closet Current — Mission 3 owner-private action integration (HOLD)

## Purpose and ownership
Family Alpha issue #255 remains OPEN/HOLD. This branch integrates previously separately verified Mission 3 engineering paths into one **draft, unmerged, undeployed** code line. Its strict parent is verified [PR #1042](https://github.com/nickhaney916-lang/Closet-Current/pull/1042) exact head `52e481922cf930b9fa3cf50799eaca3c55125270`, which already includes [PR #1036](https://github.com/nickhaney916-lang/Closet-Current/pull/1036) saved-card delete. This research integration preserves two divergent sibling features without merging either PR or touching its branch:

- Independently no-deploy verified [PR #1039](https://github.com/nickhaney916-lang/Closet-Current/pull/1039) exact HEAD `8aff55b81443ad8be1728d35ff956f2f03eb130c`: both signed-owner saved Photo results and My Closet Style buttons. Their previously working authenticated owner/source checks remain; new wrapper suppresses old-session success, private error content and button-state resets after account change.
- Independently no-deploy verified [PR #1043](https://github.com/nickhaney916-lang/Closet-Current/pull/1043) exact HEAD `a4581f0f8778f6c9ef1abb9b1adfb2346547bb66`: failed original photo Retry now requires exact signed auth instance, DB, owner and session epoch across JPEG re-hash and durable original draft re-save. A stale Retry cannot leak error details, show a false private save, or re-enable a detached old control.
- Verified PR #1042 bulk pending Photo results category CAS account binding and honest post-commit UI notices.
- Verified PR #1036 saved-card Delete exact source snapshot/CAS and old owner UI suppression.
- Inherited verified PR #1032 index refresh, #1026 manual reviewed photo save, #1017 full pending draft CAS, and earlier signed-owner original JPEG/backup protections remain unchanged.

## Merge mechanics and conflict resolution
A source-anchored exact GitHub compare patch from #1036→#1039 (three `public/app.js` hunks) was applied to PR #1042 app code; an exact compare patch from #1039's pinned predecessor `9439e9afd757075a2a445a6bfeac581f408a7469` → #1043 (two `public/app.js` hunks) was applied after that. Each old source-context hunk matched uniquely and was verified. Existing 2 PHOTO122/123 compatibility assertions and the original-photo retry source assertion were updated from the already verified #1043 branch. The original verified synthetic Node tests, Chromium/WebKit browser test scripts and research reports from #1039 and #1043 were imported without changing those source branches.

An additional five-source contract tests verify that saved Style, failed-source Retry, bulk category review, saved Delete and Family Alpha HOLD safeguards coexist in the **same** production app source without exposing raw old-owner errors.

## Exact-head CI acceptance gate
An isolated GitHub Actions workflow must:
1. Require the exact PR #1042 ancestor and allowlist only this review's source, tests, browser harnesses, reports and its own workflow; refuse any changed production/staging/cloud/network/config path and any unexpected file.
2. Source-run all 15 bulk category, 12 card Delete, 13 saved Style, 14 failed-source Retry, five integration tests and inherited guarded save, private original/JPEG, owner CAS and backup regressions.
3. Run *both newly imported* browser harnesses against actual Chromium and WebKit at 320, 390 and 430 mobile CSS viewport widths using synthetic user accounts, JPEGs, no hosted services. Check each harness receipt exists.
4. Preserve the extensive inherited full serial Node, mobile PWA, two-tab native IndexedDB, original photo recovery, simulated cloud, and signed disposable PostgreSQL owner isolation test suite.
5. Require all jobs SUCCESS and zero skips/failures before acceptance. Do not label an in-progress run passed.

## Genuinely outstanding work
Despite substantial no-deploy engineering evidence, the following are **not** available in this isolated GitHub environment and are NOT proven complete: actual physical Android Chrome and iPhone Safari camera/PWA repeated-capture testing; authorized hosted Supabase Auth/Storage two-account cloud restore, RLS and revocation; independent human labels and real legally usable photo recognition accuracy; reliable photo-derived 3D garment drape/fit on both human models; the full owner-accepted integrated Mission 1→2→3 flow; authorized family trial and release. Do not claim 10/10 accuracy, production-readiness, release, or mission-completion. No merge or deploy; HOLD #255 stays OPEN.
