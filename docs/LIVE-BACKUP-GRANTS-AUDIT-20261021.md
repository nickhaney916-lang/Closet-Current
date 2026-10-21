# Closet Current — live read-only database privilege audit

**Date:** October 21, 2026. **Scope:** catalog metadata for live Closet Current only, no customer rows, accounts, passwords, photos or backups read. No database writes, migrations, Supabase projects, service charges or production deployment.

## Confirmed live state
Connected Supabase **Closet Current** reports owner RLS enabled on `public.closet_backups`, account-prefix photo SELECT/INSERT RLS, and private `closet-private` bucket. The exposed `public.save_closet_backup` RPC is SECURITY INVOKER and anonymous EXECUTE is denied.

**Material concern:** `authenticated` currently has direct SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES and MAINTAIN on `public.closet_backups`. Table owner RLS protects rows for ordinary DML but **Postgres TRUNCATE is outside RLS**, so an account with a direct database-level ability to exercise the authenticated role could bypass the intended per-owner row limit. This is an excessive-privilege design risk; it is **not** evidence that a web browser has successfully truncated anything or that any customer data was accessed. Hosted REST does not ordinarily expose a TRUNCATE endpoint. The direct INSERT/UPDATE grant also sidesteps the browser client's intended revision-checked backup RPC in circumstances where Data API table writes are available.

Additionally the live private Storage policy includes UPDATE, permitting account-owned photo replacement if the underlying Storage role grants allow it; the client uses immutable SHA-named photos and should not replace them. Supabase advisory reports leaked-password protection disabled (not an RLS violation; enablement may require plan changes).

## Verified corrective design already in repository (NOT applied)
- `supabase/design/closet-backup-least-privilege.DRAFT.sql`: revokes broad client table permissions and forbids Storage UPDATE.
- `supabase/design/backup-rpc-only-writes.DRAFT.sql`: restricts browser accounts to owned SELECT and RPC-only conditional writes through a narrowly scoped, NOLOGIN/NOBYPASSRLS private writer role, retaining public RPC arguments.
- `tests/backup-rpc-only-writes-postgres.sql`: tests allowed owner RPC CAS, blocked direct mutations/TRUNCATE, attacker isolation and Storage immutability on disposable PostgreSQL 17.
- **These designs are neither authorized nor tested against live hosted customer data.** An approved migration requires verified rollback, true two-account REST/Storage smoke testing, explicit owner permission and a separate hosted staging project.

## Repeatable read-only audit
Execute `supabase/audits/read-only-live-backup-grants.sql` as a single SELECT in the authorized SQL editor. It returns only 25 metadata booleans without secrets or user records. Save just the `snapshot` JSON result locally (not account data); inspect it offline with:
```
node scripts/review-live-backup-catalog.mjs ./local-security-catalog.json
```
Nonzero (code 2) means catalog privileges do not meet the intended hardened target. Even zero violations cannot approve a release: independently authenticated HTTP tests, physical-device testing, owner review and production authorization remain mandatory.

## Testing and separation
The dedicated GitHub Actions job uses invented fixtures and a temporary PostgreSQL 17 container only, verifying the existing two draft SQL designs. It never connects to hosted Supabase or publishes a website. This work does not modify customer source, live tables, hosted projects, Drive Duel, Work #148 integration, or staging branches.

## Final verified evidence from this read-only audit

- The exact new catalog-only SQL was executed against the connected live Closet Current project, without reading user rows or making any database changes. **25 booleans checked; 12 discrepancies** against the intended RPC-only hardened state: excess direct INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES and MAINTAIN permissions; Storage object UPDATE policy; absent private writer role and protected private RPC machinery.
- GitHub Actions [#39667340848](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39667340848) on source commit `3546e26596efa3598d825bc443f6a0a460835e28` completed SUCCESS. **1,486 Node tests passed, 0 failed, 3 skipped**, including five new strict metadata-audit unit tests. Disposable PostgreSQL verified both `CLOSET_LEAST_PRIVILEGE_DISPOSABLE_POSTGRES_PASS` and `CLOSET_RPC_ONLY_WRITES_DISPOSABLE_PG_PASS`. The standard camera/indexing workflow also passed at the same source SHA.
- **Completion scope:** independent metadata-only live audit + verified no-cost local corrective design. **Not completed:** production privilege migration, hosted JWT/RLS/Storage cross-account verification, physical phones, SMTP and owner release sign-off. No customer rows were inspected and no hosted writes were performed. Production promotion remains BLOCKED.

