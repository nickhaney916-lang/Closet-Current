# Closet Current — end-to-end disposable Supabase backup security proof

**October 20, 2026. Development only, zero hosted mutations.**

## Purpose

PR #95 stages least-privilege table/Storage permissions. PR #96 stages a least-privileged private writer that preserves the existing `public.save_closet_backup(bigint,jsonb)` protocol and removes direct owner INSERT/UPDATE permissions. Those fixes passed isolated PostgreSQL 17 role tests, but PostgreSQL alone does **not** prove how Supabase Auth JWTs, PostgREST exposed functions, private Storage and the real JavaScript SDK behave together.

This successor PR adds a new isolated Docker-based integration, never connecting to hosted Supabase or reading customers' photos.

## How to reproduce

Workflow `.github/workflows/local-supabase-backup-rpc-security.yml`:

1. Checks out full history, builds the app, runs all Node tests, checks the historical camera/human-mask evidence lineage and existing release veto.
2. Starts disposable `supabase@2.121.0` Docker Auth, PostgREST, Storage, PostgreSQL **only**. Validates localhost API and loopback PostgreSQL URL before executing SQL.
3. Applies original `supabase/cloud-backup.sql`, then staged `closet-backup-least-privilege.DRAFT.sql`, then staged `backup-rpc-only-writes.DRAFT.sql` to **temporary local Postgres only**. Neither draft is a production migration.
4. Installs isolated pinned `@supabase/supabase-js@2.75.0` into the ephemeral runner's temporary directory, without altering application dependency locks.
5. Creates exactly two randomized disposable password-backed, confirmed synthetic Auth users, obtains real Auth JWTs, and exercises browser-equivalent SDK calls and raw PostgREST/Storage HTTP.
6. Cleans up their synthetic Auth users, photo objects and backup rows; disposes of Docker volumes with `supabase stop --no-backup`.

### Required assertions

- Authenticated A/B sessions successfully create and update independent backups through the **unchanged** public `save_closet_backup` RPC; stale expected revision returns NULL and does not change the saved document.
- Direct REST table INSERT, PATCH and DELETE **by a correctly signed-in owner** are denied. A cannot SELECT B's backup or alter it using the owner's API.
- `closet_rpc_private.save_checked` is not exposed via the configured REST schema; public RPC is denied to anonymous users.
- New owner-only JPEG Storage upload/download succeeds; SHA-derived path overwrite/upsert fails and the original object bytes remain unchanged. B cannot read/remove A's photo; a possible Storage HTTP 200 / empty list on denied DELETE is **not** treated as a successful deletion.
- Both owner backups, photos and immutable paths stay intact after simulated attack requests; service-role cleanup only affects disposable local test data.
- A successful run prints one anonymous JSON diagnostics line: `LOCAL_SUPABASE_BACKUP_RPC_PRIVACY`. No credentials, emails, customer photos, JWTs or actual account IDs are printed.

## Security boundaries

The source intentionally refuses any API URL other than `http://localhost:54321` or `http://127.0.0.1:54321`, rejects database hosts other than loopback on 54322/5432, and requires `CI=true` plus local SDK directory. The workflow does not authenticate to the hosted project and does not include Supabase hosted access tokens. Only generic per-case pass/fail flags are logged.

**A green local full-stack result is stronger than a mocked SDK result, but not a live-hosted production permission audit, real phone test, or a DBA approval.** The SQL still requires review of its role ownership, SECURITY DEFINER exception, Supabase migration compatibility and rollback plan. Do not apply live permissions, activate self-service deletion, deploy, invite subscribers, or merge this draft without explicit separate authorization.

The remaining customer pilot blockers include real iPhone/Android photo tests and original mask review, verified operator/privacy/retention/deletion terms, live Auth SMTP/redirect validation, and production figure licensing. Drive Duel and paid AI inference are outside this work.
