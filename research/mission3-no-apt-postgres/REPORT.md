# Closet Current — Mission 3 disposable PostgreSQL bootstrap recovery

**FAMILY ALPHA HOLD #255. DRAFT ONLY. NO MERGE, DEPLOY, HOSTED DATA, STAGING, OR PRODUCTION.**

## Exact starting checkpoint

This isolated verification branch starts directly at Mission 3 P855 draft PR #855 exact head `fa85a88947387df3740d4dd3171bcc1421898727`. Its offline job verified ten actual capacity-function tests, but full signed-owner/browser/Node testing did not start because the Microsoft Playwright Ubuntu 24.04 container could not resolve `archive.ubuntu.com` or `security.ubuntu.com`; `apt-get install postgresql-client` failed before PostgreSQL integration began. See CI #43043936711. The last full green parent was PR #853 `ab7a60754e403ecb3881f98b5695c4340c76c18c`. P855 was **not** full-regression certified.

## Changes in this checkpoint

1. Introduce `scripts/bootstrap-mission3-disposable-postgres.mjs` to apply the **same, unchanged** PHOTO128 bootstrap and `supabase/cloud-backup.sql` through already-required pinned `pg@8.16.3`, instead of apt/psql. The sole psql-specific commands are strictly asserted, and its include must be exactly the checked-in Supabase SQL. Unexpected directives refuse execution.
2. Fail closed unless both the PostgreSQL URL and process settings identify the disposable CI service named `postgres`, port 5432, database `mission3_disposable`, and postgres role. Use a transactional bootstrap and independently check one private backup RLS policy and four Storage policies.
3. Add a new strict-parent, strict-three-file allowlisted NO DEPLOY workflow, preserving the existing full native build, 1,492+ serial Node regression, local signed RS256 two-owner PostgreSQL RLS/Storage, all inherited Chromium and WebKit 320/390/430 mobile browser suites, source edit/delete race, error response limits, private photo integrity, 1,000 *synthetic* high-resolution JPEG memory test, accessibility, and screenshot artifacts. The workflow avoids apt entirely but still requires npm's pinned dependencies.

## Verification boundaries

- `node --check` for the new bootstrap is checked by the independent offline job.
- The full test job is only verified if its exact-commit Actions run finishes successfully, including native PostgreSQL initialization, all regression commands, and browser artifacts.
- Removing the Ubuntu apt mirror dependency **does not guarantee the npm registry is reachable**; any resulting environmental failure must be reported accurately.
- No original garment recognition/3D changes, live Supabase account/storage writes, actual owner photographs, physical iPhone/Android camera or memory measurements. Do not substitute synthetic browser viewport tests for real phone acceptance.
- No other Mission 1/Mission 2 branch was modified. Issue #255 continues to block family invitations.

**Status at authoring: new workflow CI pending; not a full Mission 3 release acceptance.**
