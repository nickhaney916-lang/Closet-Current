# Closet Current — Priority #121 / INDEPENDENT-SIGNED-OWNER-CLOUD-E2E-121

**Research only. Family Alpha Issue #255 remains HOLD. Never merge or deploy; production and existing staging were not accessed.**

## Branch and pinned baseline

- Research branch: `research/signed-owner-cloud-e2e-121-main-20261106-HOLD`
- Parent: Priority #120 exact verified commit `2d996a3aa1ed4f8dbad50a7a7553fb9121723c5d`, draft PR [#675](https://github.com/nickhaney916-lang/Closet-Current/pull/675).
- Scope is additive security regression coverage and a no-deploy workflow. The baseline UI integration remains in the parent; no auth, cloud client, SQL migration, app runtime, customer record, credential or photograph is changed here.

## Evidence classifications

### VERIFIED from inspected repository configuration

- `supabase/cloud-backup.sql` enables RLS on `closet_backups`, grants authenticated-only row operations, and uses `auth.uid()` for row visibility and write checks.
- `save_closet_backup` is `SECURITY INVOKER`, derives `owner_id` from `auth.uid()`, rejects missing authentication and checks expected revisions. It has no caller-supplied owner parameter.
- The `closet-private` bucket is configured non-public. Its four object policies bind the first storage path segment to `auth.uid()`.
- `public/auth.js` refresh handling rejects a refreshed token whose user differs from the currently expected user. Logout removes the stored session and reloads the page to tear down current in-memory app state.
- `docs/CLOUD-BACKUP.md` records an earlier validation using two disposable synthetic Supabase accounts (private upload/download, revision checks, cross-owner/anonymous denial and cleanup), plus rollback policy checks. It also says the browser restore suite used a controlled HTTP backend, and identifies refresh-loss-on-existing-session as not independently reproduced. This is inherited documentation, not a fresh P121 backend run.
- Existing Priority #120 evidence is real app import/Adjust/IndexedDB/mobile-browser acceptance with controlled auth and recognition fixtures. It is not real signed-account cloud proof.

### IMPLEMENTED — NOT VERIFIED

- Added `tests/signed-owner-cloud-e2e-121.test.mjs`, six built-in Node checks that pin the repository's security configuration and explicitly prevent the controlled browser cloud mock from being described as JWT/RLS evidence.
- Added a branch-scoped, read-only GitHub Actions workflow. It enforces parent lineage and a three-path research allowlist, and is configured to run the full inherited Node suite and Priority #120 actual-app Chromium/WebKit workflow with non-secret screenshot artifacts.
- Exact-head test execution was not established during this handoff. The linked GitHub Actions tools returned no run records or commit statuses for the P121 head, so no P121 test count, browser outcome, screenshot count, or CI success is claimed. The workflow itself remains available on the PR branch for execution.
- No runtime authorization logic or defect fix is claimed. Static assertions do not constitute server-side authorization testing.

### BLOCKED: isolated authenticated end-to-end execution

This run has no provisioned disposable local Supabase Auth/Postgres/Storage stack, local credentials, or safe test project. Credentials for the existing connected Supabase project were not used. No new paid cloud resource or external accounts were created. Therefore this priority does **not** independently repeat actual signed JWT, RLS, storage ownership, expiration/revocation, cloud backup/restore, or true two-account end-to-end behavior. Earlier repository documentation is inherited evidence only; it is not fresh P121 verification.

Also BLOCKED on this run: direct physical Android/iPhone camera capture and hardware acceptance. Emulated browser widths do not establish physical-device results.

## Acceptance boundaries

- Two synthetic owner IDs in the inherited P120 browser tests prove local IndexedDB namespace separation only.
- The existing cloud mock uses controlled route responses and cannot prove signed JWT authenticity or remote enforcement.
- Human category/type/color correction and original JPEG SHA are verified by inherited P120 browser evidence; classification truth is not.
- Local IndexedDB writes and cloud backup are separate operations. No distributed transaction across them is claimed.
- The inherited cloud backup design documents verifying cloud images and complete documents before atomic local mirror replacement, retaining drafts, and revision-based stale-write rejection. P121 did not reproduce its restore failure cases against a real backend.
- No user photos, access tokens, passwords, or personal information are included in the workflow artifact paths.

## Files added

- `.github/workflows/signed-owner-cloud-e2e-121-no-deploy.yml`
- `tests/signed-owner-cloud-e2e-121.test.mjs`
- `research/signed-owner-cloud-e2e-121/REPORT.md`

**Family Alpha HOLD. Production and existing staging were never modified or deployed.**
