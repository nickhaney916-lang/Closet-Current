# Closet Current Mission 3 — signed-owner fence for asynchronous research native BOARD04 mounts

**Research-only, unmerged draft / no-deploy. Family Alpha issue #255 stays OPEN/HOLD.**

## Exact provenance and defect
- Parent: [verified Mission 3 PR #1079](https://github.com/nickhaney916-lang/Closet-Current/pull/1079) exact `e25ca7b9b46ae49d310c1d0e5dc2f02d0507517d`, [full 1,975/1,975 Node and all core native/browser guards GREEN](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43528023483).
- Source file: `public/outfit-board.js`. In the explicit `?nativeLossless04=research` feature gate, `createNativeConsumerBoard04` asynchronously loads an authenticated private board. Its `onChange` callback previously published to global `currentBoard`, `savedOutfitBoards`, private preview and Outfit Builder input controls without its own session verification; `onStatus` directly published status messages. A late callback from an older login, or a same-ID re-login, therefore risked overwriting the newer owner's on-screen state despite the controller's underlying DB authorization checks. During dynamic module imports, the old controller or optional native 3D/source-readiness/Style viewer could also attach to the new session. This is a source-observed potential risk, not an observed real user leak.

## Surgical source fix
- `beginNativeBoardMountLease()` captures existing exact owner auth object, user ID, owner-private DB object, capture epoch and visible authenticated gates from `beginOwnerBoardUiLease()`; its callbacks are no-ops for a later signed owner or different same-ID session.
- Before the controller finishes mounting the callbacks can execute for the initial signed owner. After mount, `bind(controller)` adds an exact controller-object check. A stale asynchronous load disposes its returned private controller rather than replacing `window.nativeLossless04Bridge`.
- Guard optional 3D, original-photo source-readiness and private Style panel dynamic imports/mounts; dispose a viewer that completes for a revoked session. Native mobile comfort attaches only while the lease remains current.
- Keep all original JPEGs, SHA-256/source identity, owner-confirmed garment corrections, original clothes, signed CAS, saved outfit records, private cloud backups and 2D fallback unchanged. No writes to production/staging/hosted Supabase or private wardrobes.
- Scope only production research feature-gated native UI callbacks. The normal non-native Outfit Builder route and backend remain unchanged.

## Reproducible quality gates
- Exact production helper extraction in `tests/mission3-native-board-mount-owner-lease.test.cjs`: real signed owner, early load, same owner revocation, cross-owner change, same-ID re-login, object/epoch/DB rotation, hidden gate, same-owner controller replacement, and static post-await disposal guards.
- Actual extracted source callbacks in `scripts/test-mission3-native-board-mount-owner-browser.mjs`: 66 synthetic Chromium/WebKit scenarios at CSS widths 320/390/430 with receipts and screenshots; no fabricated physical-phone results.
- Pinned-parent five-path no-deploy workflow inheriting the full PR #1079 Node, browser, native original JPEG, backup/restore, signed disposable two-owner PostgreSQL/Storage RLS and private 2D garment styling suites, plus this source and browser test. **Do not claim new branch PASS until both exact-head CI jobs complete SUCCESS.**

## Release gates still BLOCKED
Real authorized Android Chrome and iPhone Safari physical-device sessions; authorized hosted signed cloud accounts/Storage RLS; independent human-reviewed real-photo recognition; and actual believable source-photo-derived fitted 3D clothes. Family Alpha #255 remains HOLD; no merge/deploy without explicit authorization.
