# Closet Current — MAIN Priority #169 · Hosted two-owner Supabase acceptance (readiness harness)

**Family Alpha #255 HOLD · Draft, unmerged, NO deployments or writes to production and existing staging.**

## Repository and cloud environment verification

Pinned exact parent: Main Priority #168 PR #726 commit `c84802685f57f17bda2b3133264e08322dc064f9`. Connected Supabase account was queried read-only on November 8, 2026. It exposed precisely two Closet Current projects: production `hlkgymugtfbirlpunsra` and staging `fbnplztkbsteuzrmbgib`. Neither is a disposable, owner-approved test environment. **No actual hosted tests, Auth account creation, Storage upload or database mutation are authorized on either one.** No third isolated project was available.

## Implemented

A five-path, no-app-change, no-deploy research assignment adds `research/hosted-two-owner-cloud-169/hosted-acceptance.mjs` and `scripts/run-hosted-two-owner-169.mjs`. The security contract requires an exact non-production HTTPS `<ref>.supabase.co` origin, a matching explicit 20-letter project reference, a publishable public client key, two distinct throwaway authenticated accounts, and the explicit environment approval `CLOSET169_ISOLATED_WRITE_APPROVAL=I_OWN_THIS_DISPOSABLE_TEST_PROJECT`. It **unconditionally denies both verified existing Closet Current project refs**, even if consent is supplied. The run script never prints credentials or bearer tokens and does not run automatically under GitHub Actions.

When a new isolated test project is independently provisioned with the unchanged owner-private `supabase/cloud-backup.sql` and two throwaway users, a manual run performs real HTTPS Auth/password login; validates issuer, JWT subject, audience, session and expiry; creates two independent revision-one backup records via actual user-bound SECURITY INVOKER RPC; reads the records using both actual owners and checks cross-owner RLS denial; rejects stale revision writes; uploads synthetic byte-exact JPEG originals to the private Storage bucket under independently SHA-256 keyed owner paths; confirms cross-owner Storage read/write denial; checks anonymous backup select denial; signs out and checks that a revoked refresh token cannot be used again. **Existing access JWTs may remain valid until expiration even after sign-out**: neither harness nor future test may claim instant revocation of access tokens without a live `auth.sessions` policy and server-side check.

An isolated local HTTP server with ephemeral cryptographically signed RSA-2048 tokens tests the hosted contract, including explicit negative policies for exposed cross-owner backups and cross-owner Storage upload, denial of forged signatures, failed second-account sign-in, and missing consent. These are simulated API and locally signed accounts, **not true Supabase-hosted authentication**.

The dedicated three-job no-deploy CI runs complete inherited app/Node regressions; the local authenticated HTTP policy contract; the unchanged real PostgreSQL 17 SQL RLS/CAS/Storage schema with cryptographically verified P147 two-owner tokens; and inherited Chromium/WebKit owner camera-photo-to-three-owned-looks app QA at 320/390/430 viewport widths, with 12 SHA-checked screenshots. No hosted URL, staging account, secret, owner photo or cloud data is used.

## Real hosted acceptance prerequisite and commands

1. The owner must approve creation or selection of a **separate disposable Supabase project**. Do not repurpose production or current staging.
2. Initialize that test project using the exact reviewed private schema `supabase/cloud-backup.sql`, creating no tables in existing projects.
3. Create two disposable Auth test users without private wardrobe content. Verify email/login configuration separately if testing email delivery.
4. Supply the environment variables documented in `scripts/run-hosted-two-owner-169.mjs` from a temporary secret store (never commit password/key files or place credentials in PR descriptions).
5. Run `node scripts/run-hosted-two-owner-169.mjs` manually in an authorized isolated environment, preserve a token-redacted result, review failures, and destroy the disposable test project after independent acceptance if requested.

**Acceptance distinction:** P169 *hosted-testing infrastructure and offline signed-policy regression* may be declared complete once exact-head CI is green. **Actual hosted signed two-owner JWT/PostgREST/Storage acceptance is NOT complete until that manual opt-in runner reports a genuine hosted PASS.**

## Boundaries

No changes to full-app Work #719, parallel photographic clothing fitting #60, main PR #725/#726, `public/`, `supabase/`, existing production/staging, real personal photos or private accounts. No automated test account creation, no project creation or cost-inducing use, no live Supabase requests, no deployment or merge. Family Alpha remains on HOLD until full separate device, visual, hosted auth/email, cloud and privacy acceptance.
