# Closet Current — live read-only Supabase least-privilege audit

**October 20, 2026. All hosted checks were READ ONLY. No production schema, cloud backups, photo objects, auth users, keys or billing state were modified.**

## Project and verified permissions

Supabase project: Closet Current (`hlkgymugtfbirlpunsra`). The unrelated Drive Duel project was not accessed.

Verified by read-only `pg_policies`, `has_table_privilege`, `pg_proc`, `information_schema.role_table_grants`, `storage.buckets` and Supabase Security Advisor:

- `public.closet_backups` has RLS **enabled** and one owner-specific policy using `(SELECT auth.uid()) = owner_id` for both `USING` and `WITH CHECK`.
- Its authenticated Postgres role has **TRUNCATE and DELETE** privileges in addition to the app's required SELECT/INSERT/UPDATE. Anonymous TRUNCATE was false. `TRUNCATE` bypasses RLS in PostgreSQL. Supabase's Data API does not expose a native TRUNCATE endpoint, so this is **overprivileged SQL-role/possible RPC or future-function exposure**, not proof of a reachable unauthenticated REST exploit.
- `public.save_closet_backup(bigint,jsonb)` remains **SECURITY INVOKER** with EXECUTE for authenticated and service_role, not anon. App calls it for optimistic revision writes. Switching to SECURITY DEFINER without a separate audit would be unsafe.
- The `closet-private` storage bucket is **private**, limited to JPEG files of 8,388,608 bytes. Four authenticated owner-prefix policies exist for Storage SELECT, INSERT, UPDATE and DELETE; no other Storage object policies were found. UPDATE allows existing hash-named photo metadata / upserts to be modified despite the app relying on immutable SHA256 photo paths.
- Security Advisor reported **Leaked Password Protection Disabled**. This Auth setting needs an authorized dashboard/operator change. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Live user records, photos, personal addresses, emails and tokens were intentionally **not read**. We do not claim a real user/attacker HTTP authorization test in this session.

## Safe staged security change

`supabase/design/closet-backup-least-privilege.DRAFT.sql` is **not a production migration** and was not executed in Supabase. It atomically:
1. Fails closed if the target table, private bucket, owner Storage UPDATE policy or security-invoker backup RPC differs from the inspected design, or any other Storage UPDATE policy could override the restriction.
2. REVOKEs all current client grants on `public.closet_backups` from PUBLIC, anon and authenticated; re-GRANTs only SELECT, INSERT and UPDATE to authenticated, which remain required by the existing security-invoker backup RPC.
3. Removes the owner-prefix Storage UPDATE policy, so the normal client path remains append-only; retain owner read, insert and delete policies for download, new photos and eventual lifecycle cleanup.
4. Checks effective role grants, RPC access and lack of photo-update policies; any failure aborts and rolls back the transaction.

The previously deployed `supabase/cloud-backup.sql` is deliberately left unchanged as a historical bootstrap representation until an independently approved migration is generated. The existing client relies on Storage POST without upsert; its fetch/compare-on-conflict behavior remains unchanged. The account-deletion entrypoint remains disabled with 503 and no admin key in browser code.

## Disposable integration test

`tests/closet-least-privilege-postgres.sql` builds a synthetic Supabase-style Postgres 17 schema with RLS and two fake UUIDs in an isolated GitHub runner. It confirms **pre-fix TRUNCATE exists**, applies the draft correction, then verifies:
- Authenticated can still save backups through the existing `save_closet_backup` RPC, including revision-based updates and rejection of stale versions.
- Authenticated direct TRUNCATE and DELETE are **denied**, despite having its own row; no foreign owner's backup can be read/written.
- New private photo INSERT and owner SELECT still succeed, but rewriting an existing photo is **denied** by Storage RLS.
- Other-account photo paths and closet metadata remain unreadable/non-insertable.
- Service-role access needed by a future approved account deletion remains available.

No real Supabase host, credentials, account creation, API keys, customer photo bytes or external Storage writes are used.

## Owner approval and release blockers

**Do not apply this SQL, migrate, merge or deploy** without separate approval, staged backup/rollback and a controlled two-account HTTP test of the actual hosted project or a disposable equivalent. The strongest remaining data-integrity limitation is that client SELECT/INSERT/UPDATE permissions still permit direct same-owner table updates which bypass the normal optimistic RPC. Fully preventing that needs a separate independently audited trusted RPC / least-privilege architecture; this draft only closes the unnecessarily broad TRUNCATE/DELETE rights and Storage overwrite policy.

Other blockers remain live SMTP/password reset, actual Android/iPhone camera, account deletion support/retention, independently approved garment masks, model figure licensing and customer/operator privacy commitments. Neither these tests nor a green CI run authorizes family/friends pilot enrollment.

### Current reference guidance

- Supabase API privileges: https://supabase.com/docs/guides/api/securing-your-api
- Supabase private Storage RLS: https://supabase.com/docs/guides/storage/security/access-control
- PostgreSQL TRUNCATE versus RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase security advisor warning: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
