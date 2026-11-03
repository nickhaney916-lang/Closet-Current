# CLOUD-RLS-01 — Live Supabase backup/storage SECURITY METADATA read-only acceptance

**Main-controller independent priority, November 3, 2026. No deployment, config change, cloud customer record read, customer photo read, migration, auth-user enumeration or account login. All findings are read-only Supabase catalog inspection.**

## Scope and source

- Connected Supabase account project **Closet Current** (production), plus separate project **Closet Current Staging**. Live projects identified by matching original app's existing `public/auth.js` Supabase URL with the connected project (do not print secret keys in artifacts).
- Independently queried `public.closet_backups` RLS via `pg_policies` and `pg_class`; Postgres role grants, `save_closet_backup` RPC/procedure definitions; private staging writer function & role; `storage.objects` policies and `storage.buckets` metadata. Invoked Supabase security advisors in both. No table payload, email, profile, garment or photo bytes were read.
- Supabase official Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Leaked-password protection remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Reproducible SELECT-only metadata queries: `READ_ONLY_CATALOG_QUERIES.sql`. Sanitized catalog snapshot: `attested-catalog-2026-11-03.json`. Exact live timestamp-specific results cannot be guaranteed unchanged after this review.

## LIVE production metadata observed (not test JWT traffic)

1. Only `public.closet_backups` in `public`; primary key `owner_id` UUID, RLS enabled. `anon` SELECT/INSERT denied. Authenticated has SELECT/INSERT/UPDATE/DELETE SQL grants **but** sole authenticated owner RLS policy for ALL with `auth.uid() = owner_id` as both USING and WITH CHECK.
2. `public.save_closet_backup` SECURITY INVOKER PL/pgSQL; authenticated EXECUTE allowed, anon EXECUTE denied. It rejects unauthenticated `auth.uid()`, checks JSON schema 1 and 5 MiB size limit, uses `owner_id = auth.uid()` on insert/update and optimistic revision match. **Static review does not prove live JWT A/B enforcement.**
3. `closet-private` bucket is nonpublic, JPEG-only, 8 MiB file ceiling. Exactly four object policies SELECT/INSERT/UPDATE/DELETE for authenticated, each scoped to bucket and `storage.foldername(name)[1] = auth.uid()`; INSERT and UPDATE use WITH CHECK. No broad anon/photo-read policy was seen.

## LIVE staging metadata observed (not production semantics)

1. `public.closet_backups` RLS enabled, same owner `auth.uid()=owner_id` policy. `anon` denied. **Ordinary authenticated has SELECT only**, not direct INSERT/UPDATE/DELETE. Do not mistake this for production CRUD parity.
2. Separate `closet_backup_writer` role exists, no LOGIN, no BYPASSRLS, not a member of `anon` or `authenticated`; table SELECT/INSERT/UPDATE true, DELETE false. A second role-specific owner RLS policy is present on the table.
3. Public wrapper `public.save_closet_backup` is SECURITY INVOKER, authenticated EXECUTE yes, anon EXECUTE no. It invokes `closet_rpc_private.save_checked`, a private-schema SECURITY DEFINER with empty search_path. Private routine reads the request's JWT `sub`, rejects missing identity, enforces JSON/5 MiB checks, and writes only `owner_id=request_owner` under revision precondition. **Definer semantics require a separate live user-auth authorization test before Family Alpha.** No changes were made.
4. Private `closet-private` JPEG-only bucket has owner-path SELECT/INSERT/DELETE policies; **no UPDATE policy** observed, unlike production. Current original client uploads new SHA-addressed immutable files with POST and verifies conflict originals by GET; staged UPDATE/upsert flow is not certified.

## Security advisor warning: both environments

Supabase security advisor reports **Leaked Password Protection Disabled** (WARN) on both. This is a password-reuse screening hardening opportunity, **not evidence of a data breach**. Recommend enabling through authorized Supabase Auth Settings after user approval and testing sign-in compatibility. THIS research changed nothing.

## Research code and acceptance

- `read-only-policy-gate.mjs` never accesses a DB and fails closed on missing owner RLS, broad anon grants, public file bucket, unsafe photo owner paths, missing authenticated owner WITH CHECK, dangerously public/definer RPC, altered staging writer membership, and absent JWT owner-bound compare-and-swap.
- 8+ hermetic Node tests inject regressions (RLS disabled, path wrong, public bucket, anon table access, RPC privileges, unsafe writer role). The source client `public/cloud-backup.js` is inspected for signed-in token, owner check, hash path and CAS RPC. These are **code/static catalog** checks, not requests made with real account tokens.
- `scripts/audit-cloud-rls-01.mjs` reports `benchmark/cloud-rls-01/acceptance.json` with exact catalog SHA, metadata-control outcomes and explicit unperformed live A/B flags.
- No staging/production config or customer data changed. The test workflow is CI read-only and must pass on exact final SHA before accepting research. The catalog snapshot may grow stale; re-run SELECT-only catalog queries for future release review.

## BLOCKED release gates (truthful)

1. Authenticated USER A vs USER B and unauthenticated caller **real Data API** read/write/delete rejection with server-verified distinct JWTs (using test accounts only, no customer records).
2. Actual authenticated USER A/B **Storage** object read/insert/delete cross-owner rejection and upload source byte SHA, preferably within approved isolated staging tests.
3. Full negative test of staging private SECURITY DEFINER under unprivileged real accounts, with read-only metadata review now done but no forged identity traffic.
4. Supabase leaked-password protection warning hardening (requires approval; do not silently change).
5. Physical Android/iPhone, arbitrary consumer source recognition, standalone 10/10 3D appearance and Family Alpha #255 HOLD.

**CLOUD01 metadata PASS does not authorize merging PR #550/#551, parallel #18, changing RLS, enabling Family Alpha or releasing.** 
