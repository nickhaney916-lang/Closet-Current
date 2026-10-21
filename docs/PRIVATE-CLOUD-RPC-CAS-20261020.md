# Closet Current — staged protected backup revision RPC

**October 20, 2026. Not applied to hosted Supabase.** This is an additional, separately gated security design based on PR #95, not a deployed migration or an approved customer release.

## Why this is needed

Read-only live inspection confirmed the existing browser role can directly INSERT or UPDATE its own `public.closet_backups` rows, even after the first staged least-privilege design removes DELETE and TRUNCATE. Such direct same-owner writes can bypass the client’s optimistic revision comparison. Owner-specific RLS is necessary for privacy but **does not enforce a revision protocol**. Current app code uses the public PostgREST RPC `save_closet_backup(p_expected_revision,p_document)`; preserving its API avoids any browser-code changes.

## Staged design

`supabase/design/backup-rpc-only-writes.DRAFT.sql` proposes:

- Fail closed if the preceding PR #95 grant fix, RLS or public RPC is absent/drifted.
- Create `closet_backup_writer` as **NOLOGIN, NOINHERIT, NOBYPASSRLS** and grant only relation SELECT, INSERT and UPDATE. This role is not the table owner and is not granted to `authenticated`, `anon` or browser clients.
- Add an RLS policy explicitly for this role requiring `auth.uid()=owner_id` for both read and write. Because the writer does not own the table and has no BYPASSRLS attribute, normal RLS remains applicable even in the scoped privileged function.
- Implement an owner-identity-from-session and compare-and-swap JSON backup RPC in a dedicated `closet_rpc_private` schema **not exposed through the REST API**. The private function runs SECURITY DEFINER as that limited writer rather than as a superuser/table owner. It specifies an empty search path and fully qualified tables and auth helpers. It does not accept user-supplied owner IDs, editable metadata or dynamic SQL.
- Keep the existing `public.save_closet_backup(bigint,jsonb)` exact argument names and bigint return as a **SECURITY INVOKER wrapper**, with anonymous execution revoked. Authenticated clients can execute the private checked path but cannot pass a different owner ID or evade the revision requirement.
- Remove the authenticated role’s raw `INSERT` and `UPDATE` rights to `closet_backups` while retaining SELECT for owner read-back. Other service/admin data removal privileges and private JPEG permissions remain unchanged.
- Assert the full grant/RLS/function-owner arrangement before commit, aborting the draft transaction if the expected conditions are missing.

**Security review caveat:** SECURITY DEFINER remains a privileged construct even when its owner is non-bypass; it requires independent DBA review and a second opinion on session-context liveness. This design intentionally avoids making a public elevated RPC or assigning it to the table owner. The wrapper’s private schema is not a claim that authenticated users cannot call the same checked function directly through other SQL gateways; direct invocation has the same owner/revision rules.

## What can and cannot be verified without authorization

The disposable PostgreSQL 17 test creates fake two-user identities, replays the original cloud schema, applies the preceding PR #95 draft and then this draft. It tries normal RPC create/update, stale revision, malformed JSON, oversized backup, direct INSERT/UPDATE/DELETE/TRUNCATE, foreign-account access, direct private invocation, anonymous RPC access and server cleanup. A green result is **local role and protocol evidence only**—not proof of real Supabase Auth token verification or PostgREST procedure compatibility in a hosted environment.

Do not apply either draft to the active Supabase project, change Auth settings, migrate/deploy the app, send login messages, enable paid AI or use real customer content without explicit consent. After owner approval, require a separately provisioned disposable Supabase environment, live two-account HTTP access checks and SQL advisory review, plus rollback planning.

Original-camera-before-masking classification, saved wardrobe/cloud content, Work PR #91/94 and Drive Duel remain untouched.

## Outstanding go/no-go

1. DBA approval of narrow SECURITY DEFINER role, grants, nonexposed schema, RLS, and concurrency behavior; real hosted configuration may limit CREATE ROLE.
2. Auth session and JWT revocation behavior, owner-specific Storage paths and backup-owner row permissions, safe rollback.
3. Actual phone testing, email SMTP/redirects, approved account deletion and data retention, approved two-person real garment masking, verified figure licensing.
4. Explicit user approval for any hosted schema or configuration change and any pilot enrollment.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api), [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
