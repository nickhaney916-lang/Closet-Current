# Closet Current Mission 3 — locked import gate and exact v4 restore controller

**Research-only; Family Alpha #255 OPEN/HOLD. DRAFT, unmerged, undeployed.** No production/staging, hosted Supabase, real photos, or private owner data accessed.

## Starting point

Exact source parent: PR #1126 at `44c4a30012478f63f8a7d6d66ae20f2d93af1695` (separately verified two-job no-deploy CI #43549672864). This branch changes only the import event path in `public/app.js`, a source-executed synthetic regression test, this report and a no-deploy workflow. All other mission branches remain independent.

## Source-observed risks addressed

1. The `$('import').onchange` callback previously used `ownerWardrobeMutationLease()` to check the auth instance, DB and epoch, but **not** the `#authGate` and `#appShell` private UI state. An asynchronous selected-file read or v4 callback could proceed into confirmation after the app was locked without the principal changing first. Backup **export** already had the stricter visible-private-UI gate.
2. `restoreAtomic01Bridge.importBackup()` was captured once but not reverified at owner confirmation or completion. A replaced asynchronous recovery controller could retain a pending consent callback or publish an outdated success status in the same signed session.

## Patch

- Extend the existing private `assertImport` to check visible signed-private UI at each existing preflight / post-await / confirmation / owner-lease boundary. Suppress stale private messages after lock via the existing `importMessage` wrapper.
- Pin the exact `restoreAtomic01Bridge` identity throughout v4 owner confirmation and after asynchronous completion. Reject a detached/replaced bridge, preventing stale success publication and denying consent to old controllers before commit. A replaced controller **after** a commit cannot undo a finished transaction; the UI instead requires reopening My Closet to confirm the current result.
- Keep the existing research-only v4 gate, local legacy atomic test path, genuine photo custody, signed-owner transaction policy, and original 2D fallback unchanged.

## Test and remaining limits

`tests/mission3-private-import-locked-gate-v4-bridge.test.cjs` executes the exact production import handler and owner lease with synthetic authenticated sessions, delayed file reads, locked gates, same-ID re-login, controller replacement before/during approval, and delayed return. The no-deploy workflow runs syntax and this source regression before the inherited full serial Node, two-owner **disposable** database RLS, Chromium/WebKit and original-photo custody suites.

The first CI run exposed four inherited `tests/mission3-edit-backup-owner-lease.test.cjs` failures: its old synthetic import fixture provided only `#import` and asserted against access to any other element. The app's new required `#authGate` and `#appShell` checks therefore correctly stopped the synthetic import before it reached previous assertions. The historical test fixture now provides explicit authorized private-gate nodes, without changing its original signed-account test cases. A new exact-head no-deploy run is required before a passing claim.

**No exact-head test status is claimed until the dedicated CI jobs finish.** Unit and browser tests are not physical Android/iPhone or authorized hosted-cloud acceptance.

Release blockers remain the same as PR #1126's completion audit: independently authorized signed four-account hosted backup/restore, physical phone end-to-end, genuine human-confirmed garment recognition, source-photo 3D garment fit, integrated source-to-outfit journey, and explicit owner release decision. #255 must remain OPEN/HOLD.