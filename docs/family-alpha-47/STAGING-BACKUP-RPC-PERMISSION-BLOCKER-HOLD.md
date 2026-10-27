# CORRECTION — Staging cloud-backup permission blocker WAS NOT ESTABLISHED

**October 27, 2026. This document supersedes its own original finding. Retaining this file path to correct the link already posted to issue #255.**

**Earlier statement withdrawn:** It was incorrect to infer that signed-in staging users could not save cloud backups merely because `authenticated` lacks direct INSERT/UPDATE on `public.closet_backups` and the public `save_closet_backup` routine is `SECURITY INVOKER`. That inspection stopped at the public entry and **missed the private helper it invokes**. Do **not** change table grants on the basis of that previous claim.

## Correct live staging database evidence (read-only)

The actual `pg_get_functiondef` confirms the public SQL RPC body delegates with a fully qualified invocation:

```sql
SELECT closet_rpc_private.save_checked(p_expected_revision, p_document);
```

The stage catalog reports:

| Security control | Verified live staging result |
| --- | --- |
| Public entry | `public.save_closet_backup(bigint,jsonb)` |
| Entry owner / mode | `postgres` / `SECURITY INVOKER`, `search_path=''` |
| Public EXECUTE | `authenticated`: yes, `anon`: no |
| Delegated private entry | `closet_rpc_private.save_checked(bigint,jsonb)` |
| Private helper mode | `SECURITY DEFINER`, `search_path=''` |
| Helper owner | `closet_backup_writer`, a `NOLOGIN`, `NOBYPASSRLS`, non-table-owner role |
| Private helper grants | `authenticated`: schema USAGE and function EXECUTE; `anon`: neither |
| Writer table privileges | SELECT, INSERT, UPDATE, constrained by dedicated owner-scoped RLS `USING` and `WITH CHECK` |
| Helper validation | Reads the transaction's request JWT subject; checks payload structure, 5 MiB document size, revision number, matches owner on INSERT/UPDATE |
| Direct authenticated table grants | SELECT only; INSERT/UPDATE intentionally withheld |
| Real signed-in backup HTTP POST | **NOT TESTED** |

**Interpretation:** The outer invoker checks/forwards under the caller, while its private definer executes SQL with the narrow writer role's table permissions and still faces RLS. This is a deliberate privilege-boundary pattern. Missing direct `authenticated` INSERT/UPDATE grants are *consistent with the current design* and not evidence of a broken backup.

The helper's current SQL uses owner-claim and revision predicates; this is database metadata evidence, **not proof that Auth/REST, real JWT claims, retry, cloud restore and all row-level policy behaviors actually succeed**. No staging writes, credentials or private user rows/photos were accessed. The SQL checker cannot prove the private schema is excluded from PostgREST's exposed schemas; that setting also remains to verify.

Supabase security guidance advises preferring `SECURITY INVOKER` and carefully reviewing every `SECURITY DEFINER` function's owner, fixed search path and EXECUTE privileges:
https://supabase.com/docs/guides/database/functions
https://supabase.com/docs/guides/database/postgres/row-level-security

## Remaining independent release blockers

- One registered staging Auth user; two real distinct authenticated adult sessions and true write/isolation tests missing.
- Safe staged Auth/backup build deliberately disabled and not deployed; Cloudflare Access stage protection not independently proven.
- Actual cloud backup function HTTP result, concurrent revision protection and image restore not independently tested.
- Leaked-password protection advisor warning still present.
- Photo-only outfits are not human approved, 2D photo layering still fails owner-grade acceptance; no physical Android/iPhone test.

**Final decision: Family Alpha HOLD. No permission/schema/function changes recommended or made. Production, staging configuration, cloud accounts, private data, deployment and Drive Duel remain untouched.**
