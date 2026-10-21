# Closet Current backup RPC recovery rehearsal (DRAFT, local only)

**Priority:** make the proposed customer-backup least-privilege migration recoverable if its private RPC path breaks. This change is independent of Work's PR #148/150 staging integration. It is *not* approval to apply any SQL to the hosted database.

## Recovery characteristics

The existing two-stage `DRAFT.sql` design removes client direct backup writes and introduces a private, non-login writer for revision-checked RPC saves. The new `supabase/design/backup-rpc-only-writes-safe-recovery.DRAFT.sql` is a tightly guarded and transactional **controlled fallback**:

- Locks only the known backup table, with short timeout, and verifies expected hardened role, policy, schema, RPC signature, RLS and private-photo rules.
- Restores the exact owner-bound, 5 MiB limited `public.save_closet_backup(bigint,jsonb)` `SECURITY INVOKER` interface from the app's source history.
- Restores client `SELECT/INSERT/UPDATE` only as required for that invoker; **never** grants `DELETE`, `TRUNCATE`, `TRIGGER`, `REFERENCES`, or `MAINTAIN`, and never restores Storage photo `UPDATE`.
- Removes known private writer objects **without CASCADE** and checks their disappearance and surviving account-owner policy before committing.
- Refuses unexpected/missing objects or privilege drift. No customer rows, emails, account tokens or photos are copied, reinserted, or selected into a report.

**Important:** This safe fallback permits authenticated direct INSERT/UPDATE again, restricted by owner RLS, so it is less restrictive than the preferred RPC-only design. It is safer than reverting fully to the overly broad pre-hardening database grants. It is an emergency recovery candidate, not the final desired architecture.

## Local-only rehearsal

`tests/backup-rpc-safe-recovery-postgres.sql` first sets up disposable PostgreSQL 17 with two fake owners and runs both existing hardening scripts and RPC/CAS isolation tests. It then executes the fallback and checks:

- Existing owner B wardrobe remains, revision CAS resumes and stale updates stay blocked.
- Another owner cannot read/update B's wardrobe but can independently create their own.
- Anonymous RPC, direct DELETE and TRUNCATE remain denied; private writer resources are gone.
- Existing Storage photo UPDATE denial remains in place.

The GitHub Actions workflow contains no remote Supabase login, migrations, paid services, account data or production deploy commands. It tests only a local ephemeral PostgreSQL service and the complete app regression suite.

## Release barriers

A passing disposable rehearsal is **not** a rollback authorization. Before any real migration: secure an independent staging project, test both sides with disposable accounts via actual Auth/PostgREST/Storage, record a verified backup and formal recovery window, inspect current live catalog/SQL drift, confirm rollback ownership/grants under the hosted executor, and receive explicit owner authorization. Do not apply `DRAFT.sql` files to Closet Current or Drive Duel until then. No customer data has been read or modified.
