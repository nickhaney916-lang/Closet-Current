-- DESIGN CANDIDATE ONLY — DO NOT APPLY TO LIVE SUPABASE.
-- Closet Current account deletion write barrier.
-- Separate review, migration generation, and disposable-project approval
-- are required before this can become a deployed migration.
-- Durable tombstones deliberately survive Auth deletion: old JWTs can live
-- until expiry, so NEVER FK these locks to auth.users ON DELETE CASCADE.
create schema if not exists closet_internal;
revoke all on schema closet_internal from public, anon, authenticated;
grant usage on schema closet_internal to service_role;

create table if not exists closet_internal.deletion_locks (
 owner_id uuid primary key,
 locked_at timestamptz not null default now()
);
revoke all on closet_internal.deletion_locks from public, anon, authenticated;
grant select, insert on closet_internal.deletion_locks to service_role;

-- Serialize the beginning of deletion with any in-flight backup write and
-- Storage object metadata INSERT / UPDATE for exactly this owner.
-- Hash collisions only unnecessarily serialize distinct owners, not weaken
-- authorization. Must run in the SAME transaction as the protected write.
create or replace function closet_internal.assert_owner_writable(p_owner text)
returns void language plpgsql security definer set search_path = '' as $$
declare account uuid;
begin
 if p_owner is null or p_owner !~
  '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' then
  raise exception 'Invalid private closet owner' using errcode = '42501';
 end if;
 account := p_owner::uuid;
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended('closet-delete:' || account::text, 9912));
 if exists (select 1 from closet_internal.deletion_locks where owner_id = account) then
  raise exception 'Closet account deletion in progress' using errcode = '42501';
 end if;
end $$;
revoke all on function closet_internal.assert_owner_writable(text)
 from public, anon, authenticated;

-- Triggers check every database write, not just the normal browser RPC.
-- Direct INSERT/UPDATE, service-role restores, and cloud sync all hit it.
create or replace function closet_internal.guard_backup_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id then
  raise exception 'Cannot change private closet owner' using errcode = '42501';
 end if;
 perform closet_internal.assert_owner_writable(new.owner_id::text);
 return new;
end $$;
revoke all on function closet_internal.guard_backup_write()
 from public, anon, authenticated;
drop trigger if exists closet_backup_account_deletion_guard on public.closet_backups;
create trigger closet_backup_account_deletion_guard
 before insert or update on public.closet_backups
 for each row execute function closet_internal.guard_backup_write();

-- Storage can perform updates to replace or rename objects, so protect both
-- OLD and NEW account prefixes. DELETE is intentionally allowed so cleanup
-- can proceed AFTER the account has been write-locked.
create or replace function closet_internal.guard_photo_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if tg_op = 'UPDATE' and old.bucket_id = 'closet-private' then
  perform closet_internal.assert_owner_writable(
   pg_catalog.split_part(old.name, '/', 1));
 end if;
 if new.bucket_id = 'closet-private' then
  perform closet_internal.assert_owner_writable(
   pg_catalog.split_part(new.name, '/', 1));
 end if;
 return new;
end $$;
revoke all on function closet_internal.guard_photo_write()
 from public, anon, authenticated;
drop trigger if exists closet_private_account_deletion_guard on storage.objects;
create trigger closet_private_account_deletion_guard
 before insert or update on storage.objects
 for each row execute function closet_internal.guard_photo_write();

-- Admin/server-only endpoint: caller identity must already have been verified
-- from Auth token and a fresh password. No authenticated browser grant.
-- Uses same advisory transaction lock as both write triggers. Upon commit,
-- all future writes see the durable lock row. Retries are idempotent.
create or replace function closet_internal.begin_account_deletion(p_owner uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if p_owner is null then
  raise exception 'Verified account required' using errcode = '42501';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended('closet-delete:' || p_owner::text, 9912));
 insert into closet_internal.deletion_locks(owner_id)
 values(p_owner) on conflict(owner_id) do nothing;
 return true;
end $$;
revoke all on function closet_internal.begin_account_deletion(uuid)
 from public, anon, authenticated;
grant execute on function closet_internal.begin_account_deletion(uuid)
 to service_role;

-- Public PostgREST can call this *only* with server-held service_role.
-- SECURITY INVOKER: the caller must itself have USAGE/EXECUTE on private
-- internal function; no user-controlled browser role can cross this boundary.
-- This is deliberately a non-destructive lock acquisition only.
create or replace function public.begin_closet_account_deletion(p_owner uuid)
returns boolean language sql security invoker set search_path = ''
as 'select closet_internal.begin_account_deletion(p_owner)';
revoke all on function public.begin_closet_account_deletion(uuid)
 from public, anon, authenticated;
grant execute on function public.begin_closet_account_deletion(uuid) to service_role;

-- No release_account_deletion() RPC exists. Tombstones require a reviewed
-- retention/recovery strategy, not silent reactivation by session refresh.


-- SERVER-ONLY EXCLUSIVE DELETION WORKER CLAIM (UNDEPLOYED).
-- The write tombstone above is idempotent by design, so by itself two
-- simultaneous cleanup workers could both receive 'true' and concurrently
-- delete the same photo / Auth objects. One durable one-time claim prevents
-- multiple active workers without trusting an in-memory mutex.
--
-- Deliberately NO TTL, unlock RPC or automatic takeover. A crash can strand
-- an account in 'deletion in progress'; recovery requires a separately
-- approved, operator-audited process. That is safer than a stale worker
-- regaining control and deleting objects after a time-based lease expires.
create table if not exists closet_internal.deletion_cleanup_claims (
 owner_id uuid primary key,
 claimed_at timestamptz not null default now()
);
revoke all on closet_internal.deletion_cleanup_claims from public, anon, authenticated;
grant select, insert on closet_internal.deletion_cleanup_claims to service_role;

create or replace function closet_internal.claim_account_cleanup(p_owner uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare acquired uuid;
begin
 if p_owner is null then
  raise exception 'Verified account required' using errcode = '42501';
 end if;
 -- No claim is valid until the write barrier has committed. The
 -- tombstone survives Auth deletion and cannot be removed by a stale JWT.
 if not exists (select 1 from closet_internal.deletion_locks
  where owner_id = p_owner) then
  raise exception 'Durable deletion write lock required' using errcode = '42501';
 end if;
 insert into closet_internal.deletion_cleanup_claims(owner_id)
 values (p_owner) on conflict(owner_id) do nothing
 returning owner_id into acquired;
 return acquired is not null;
end $$;
revoke all on function closet_internal.claim_account_cleanup(uuid)
 from public, anon, authenticated;
grant execute on function closet_internal.claim_account_cleanup(uuid)
 to service_role;

-- Invoker privilege must be service-role only, mirroring the tombstone RPC.
create or replace function public.claim_closet_account_cleanup(p_owner uuid)
returns boolean language sql security invoker set search_path = ''
as 'select closet_internal.claim_account_cleanup(p_owner)';
revoke all on function public.claim_closet_account_cleanup(uuid)
 from public, anon, authenticated;
grant execute on function public.claim_closet_account_cleanup(uuid)
 to service_role;


-- READ-ONLY PRIVILEGED INCIDENT INSPECTION (DRAFT / NEVER DEPLOYED).
-- Operators must obtain snapshots through an approved server-only database
-- connection, never an exposed public Data API route or browser key.
-- Even if both booleans are true, the worker might STILL BE RUNNING.
create or replace function closet_internal.inspect_deletion_claim_status(p_owner uuid)
returns table(write_locked boolean, cleanup_claimed boolean)
language sql security invoker set search_path = '' as $$
 select exists (
  select 1 from closet_internal.deletion_locks where owner_id = p_owner
 ), exists (
  select 1 from closet_internal.deletion_cleanup_claims where owner_id = p_owner
 );
$$;
revoke all on function closet_internal.inspect_deletion_claim_status(uuid)
 from public, anon, authenticated;
grant execute on function closet_internal.inspect_deletion_claim_status(uuid)
 to service_role;
