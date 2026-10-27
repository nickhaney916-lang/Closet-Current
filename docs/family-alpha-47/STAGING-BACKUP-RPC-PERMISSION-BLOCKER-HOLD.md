# Family Alpha #47 — STOP: staging cloud backup writer permission mismatch

**Observed Oct 27, 2026. STAGING ONLY, read-only PostgreSQL system-catalog queries, no application content or database changes.**

## Finding — likely live cloud backup save blocker

The existing `public/cloud-backup.js` signed-in client calls `POST /rest/v1/rpc/save_closet_backup`, passing its authenticated session token. Read-only staging metadata shows:

| Check | Live staging finding |
| --- | --- |
| `public.save_closet_backup(bigint,jsonb)` exists | Yes |
| `authenticated` allowed to call function | **Yes** |
| `anon` allowed to call function | No |
| Function `SECURITY DEFINER` | **False** (`SECURITY INVOKER`) |
| Function switches to `closet_backup_writer` role | No |
| Authenticated effective table `SELECT` | Yes |
| Authenticated effective table `INSERT` | **No** |
| Authenticated effective table `UPDATE` | **No** |
| Authenticated inherits backup-writer privileges | No |
| Authenticated member of backup-writer role | No |
| Writer role login or BYPASSRLS | **No** (both disabled) |
| Backup owner-scoped RLS | Enabled, with owner-matching `USING` / `WITH CHECK` |
| Actual live `save_closet_backup` write response | **NOT TESTED** |

A standard authenticated JWT invokes a `SECURITY INVOKER` routine with the authenticated role's effective table privileges. The routine's INSERT/UPDATE should be rejected without matching effective privileges. The dedicated writer role's privileges do not reach this invocation. This makes the expected signed-in cloud save **likely unable to create or update a backup** even though the `EXECUTE` privilege exists. It is not appropriate to mark cloud-save readiness PASS based on row-level policy existence or one previously existing backup.

## Safe remediation review — do not execute automatically

Do **NOT** unconditionally grant direct INSERT/UPDATE on the backup table to `authenticated`. That could enable direct PostgREST table mutations outside `save_closet_backup` and bypass its revision-controlled optimistic concurrency and validated document expectations, even if RLS still prevents ownership theft.

The owner/security reviewer should independently evaluate a **narrow, audited function-owner/role execution design**, such as an appropriately owned restricted `SECURITY DEFINER` backup RPC that runs under a dedicated `NOLOGIN`, `NOBYPASSRLS` writer role while preserving strict owner-scoped `USING` and `WITH CHECK` policies, fully qualified objects/search path, valid JWT ownership proof, private stage-only grants and optimistic concurrency. This is a *design direction requiring review*, **not a supplied migration or permission to deploy**. Explicit tests must confirm the function owner itself does not bypass table RLS and cannot touch other owners.

Only after explicit authorization for a staging-only configuration or schema change: validate with disposable **two real, separately signed-in adult staging sessions**, positive own backup creation/update, negative cross-owner API writes, revision conflicts, retry and private photo integrity. No family user content or privileged credential should enter GitHub, logs or public issue comments. The cloud backup production implementation must not be changed or migrated unintentionally.

The new read-only stage evidence and CI release guard record `BLOCKER_PROBABLE_AUTHENTICATED_SAVE_PERMISSION_DENIAL` and `actualHttpOutcome: NOT TESTED`. **Family Alpha remains HOLD.** No changes were made to Supabase Auth, functions, roles, policies, photos, accounts, Cloudflare, deployment, production or Drive Duel.
