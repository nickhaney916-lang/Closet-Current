# Read-only Closet Current backup migration-state gate

**Status:** draft audit only, October 21, 2026. No hosted migration or customer data access.

The protected backup writer change in `supabase/design/backup-rpc-only-writes.DRAFT.sql` and its guarded recovery script already passed disposable PostgreSQL tests in PRs #149 and #151. The next risk is **misidentifying a partially changed live schema** when preparing an operator-approved migration. This catalog query identifies four metadata states without any customer IDs, emails, photos or SQL writes.

- `OVERBROAD_CLIENT_GRANTS`: original authenticated table-wide grants, including TRUNCATE and photo UPDATE, with expected owner protections still configured. **Not safe to approve release.**
- `LIMITED_DIRECT_WRITES`: least-privilege client SELECT/INSERT/UPDATE with owner RLS and no TRUNCATE/DELETE or photo UPDATE. This is also the state after the safe recovery fallback; catalog-only evidence cannot distinguish how it was reached.
- `RPC_ONLY_EXPECTED_CATALOG`: hardened private writer role/function, no direct authenticated insert/update, owner/RLS/photo protection intact, anonymous private execute excluded. It is only a **schema match**, not evidence of actual JWT/Auth/API behavior.
- `UNKNOWN_OR_UNSAFE`: any missing prerequisite, unrecognized partial configuration, role grant leak, absent policy, unexpected RLS status, or other drift. **Stop; never force a migration through the gate.**

`supabase/audits/backup-migration-state.sql` is a metadata-only read-only `SELECT`. It always returns `hosted_migration_authorized=false` and `production_release_approved=false`, including if it observes a hardened catalog.

The separate no-deployment GitHub Actions workflow uses disposable PostgreSQL 17 and asserts real transitions:
`LIMITED_DIRECT_WRITES` → `RPC_ONLY_EXPECTED_CATALOG` → `LIMITED_DIRECT_WRITES`.
It then injects an excess TRUNCATE privilege and disables RLS independently; both must result in `UNKNOWN_OR_UNSAFE` (no release). The full app regression suite still runs on the draft branch.

**Important limitations:** The actual live database remains unchanged and was previously found to have 12 security discrepancies. A successful catalog classification is not a safe hosted migration, deployed RLS test, or release approval. Prior to any live changes require explicit owner approval, separate staging capacity, full backup/rollback sign-off and disposable two-account authenticated REST/Storage tests. No paid services, Drive Duel changes, production deploy or customer data reads are included.
