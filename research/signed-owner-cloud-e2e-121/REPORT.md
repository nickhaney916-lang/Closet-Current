# Closet Current — Priority #121 / INDEPENDENT-SIGNED-OWNER-CLOUD-E2E-121

**Research only. Family Alpha Issue #255 remains HOLD. Never merge or deploy; production and existing staging were not accessed.**

## Branch and pinned baseline

- Research branch: `research/signed-owner-cloud-e2e-121-main-20261106-HOLD`
- Parent: Priority #120 exact verified commit `2d996a3aa1ed4f8dbad50a7a7553fb9121723c5d`, draft PR [#675](https://github.com/nickhaney916-lang/Closet-Current/pull/675).
- Scope: additive security regression coverage, a no-deploy workflow, and its technical report. No auth, cloud client, SQL migration, app runtime, customer record, credential, or photograph was changed.

## VERIFIED: repository configuration and CI

- `supabase/cloud-backup.sql` enables RLS on `closet_backups`, grants authenticated-only row operations, and uses `auth.uid()` for row visibility and write checks.
- `save_closet_backup` is `SECURITY INVOKER`, derives `owner_id` from `auth.uid()`, rejects missing authentication and checks expected revisions. It has no caller-supplied owner parameter.
- The `closet-private` bucket is configured non-public. Its four object policies bind the first storage path segment to `auth.uid()`.
- `public/auth.js` refresh handling rejects a refreshed token whose user differs from the currently expected user. Logout removes the stored session and reloads the page to tear down current in-memory app state.
- [Dedicated exact-head P121 GitHub Actions run #42324957206](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42324957206): **SUCCESS**. The lineage/scope check passed; the six P121 configuration regressions passed **6/6**; complete inherited Node app/research suite passed **1,102/1,102**; inherited real-app mobile browser acceptance passed **4/4**; evidence audit passed.
- Mobile browser acceptance inherited from P120 exercised the real app import/Adjust/reviewed-save flow in Chromium at **320, 390, 430 px** and WebKit at **390 px**. **12 screenshots** were generated and uploaded as the workflow artifact. These are emulated browser sizes, not physical phones.
- During CI setup, the initial browser run found missing Playwright binaries; the next run found container Git safe-directory setup and a mismatched evidence-field assertion. Those workflow defects were corrected. The final run passed all workflow jobs.
- No P121 runtime authorization fix is claimed. The new static checks validate source configuration; they do not independently exercise server-side authorization.

## IMPLEMENTED — NOT VERIFIED: cloud proof

The repository's `docs/CLOUD-BACKUP.md` records an earlier run using two disposable synthetic Supabase accounts (private upload/download, revision checks, cross-owner/anonymous denial and cleanup) and rollback policy checks. It also says the browser restore suite used a controlled HTTP backend and that refresh-loss-on-an-existing-session was not independently reproduced. That is inherited documentation, not fresh P121 backend evidence.

This run had no provisioned disposable local Supabase Auth/Postgres/Storage stack, local credentials, or safe test project. Credentials for the existing connected Supabase project were not used, and no paid cloud resource or external accounts were created. Therefore P121 does **not** independently verify real signed JWTs, remotely enforced RLS, signed-account photo access, two-account cloud separation, token expiry/revocation, authenticated backup/restore, corrupt/aborted restore rollback, or cross-account recovery. Earlier documentation is not represented as fresh proof.

## BLOCKED: broader acceptance

- Real signed-account/JWT/RLS and cloud recovery execution needs an isolated local Supabase environment or separately authorized disposable test project and credentials.
- Physical Android/iPhone camera capture and hardware/browser acceptance are unavailable here.
- Two synthetic owner IDs in inherited browser tests prove local IndexedDB namespace separation only.
- The existing cloud mock uses controlled route responses and cannot prove signed JWT authenticity or remote enforcement.
- Human category/type/color correction and original JPEG SHA are verified by inherited P120 browser evidence; classification truth is not.
- Local IndexedDB writes and cloud backup are separate operations. No distributed transaction across them is claimed.
- The inherited backup design documents verified downloads before atomic local mirror replacement, draft retention and revision-based stale-write rejection; P121 did not replay its interruption/corruption matrix against a real backend.
- CI artifacts contain source-only screenshots and results, with no user photos, tokens, passwords, or personal information.

## Files added

- `.github/workflows/signed-owner-cloud-e2e-121-no-deploy.yml`
- `tests/signed-owner-cloud-e2e-121.test.mjs`
- `research/signed-owner-cloud-e2e-121/REPORT.md`

**Family Alpha HOLD. Production and existing staging were never modified or deployed.**
