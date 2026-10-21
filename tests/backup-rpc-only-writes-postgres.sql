\set ON_ERROR_STOP on
-- Entire test runs on GitHub disposable PostgreSQL 17 only.
-- First prove the previous least-privilege design, then harden direct writes.
\i tests/closet-least-privilege-postgres.sql
-- Real Supabase service_role has BYPASSRLS. Set it only in this disposable
-- test harness; the prior lightweight schema created it without that flag.
ALTER ROLE service_role BYPASSRLS;
\i supabase/design/backup-rpc-only-writes.DRAFT.sql

DO $pre$
BEGIN
 IF has_table_privilege('authenticated','public.closet_backups','INSERT')
 OR has_table_privilege('authenticated','public.closet_backups','UPDATE')
 OR has_table_privilege('authenticated','public.closet_backups','DELETE')
 OR has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
 OR NOT has_table_privilege('authenticated','public.closet_backups','SELECT')
 OR has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE')
 OR has_schema_privilege('anon','closet_rpc_private','USAGE')
 OR pg_has_role('authenticated','closet_backup_writer','MEMBER')
 THEN RAISE EXCEPTION 'Browser table writes or private writer grants leaked'; END IF;
 IF (SELECT rolcanlogin OR rolbypassrls FROM pg_roles WHERE rolname='closet_backup_writer')
 OR (SELECT c.relowner='closet_backup_writer'::regrole
     FROM pg_class c WHERE c.oid='public.closet_backups'::regclass)
 THEN RAISE EXCEPTION 'Private writer can bypass row-level security'; END IF;
END $pre$;

-- Reuse exactly the original browser RPC name and signature.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',false);
DO $owner$
DECLARE rev bigint;
BEGIN
 rev:=public.save_closet_backup(0,'{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 IF rev<>1 THEN RAISE EXCEPTION 'Private writer could not create backup'; END IF;
 rev:=public.save_closet_backup(1,'{"schemaVersion":1,"items":[{"id":"from-phone"}],"state":{}}'::jsonb);
 IF rev<>2 THEN RAISE EXCEPTION 'Private writer could not update backup'; END IF;
 rev:=public.save_closet_backup(1,'{"schemaVersion":1,"items":[{"id":"stale"}],"state":{}}'::jsonb);
 IF rev IS NOT NULL THEN RAISE EXCEPTION 'Stale caller overwrote latest backup'; END IF;
 IF (SELECT revision FROM public.closet_backups)<>2 THEN
  RAISE EXCEPTION 'Revision changed after stale write'; END IF;
 IF (SELECT document->'items'->0->>'id' FROM public.closet_backups)<>'from-phone'
 THEN RAISE EXCEPTION 'CAS document overwritten by stale request'; END IF;
END $owner$;

-- Every direct client table mutation must FAIL on role grants, including
-- same-owner row modification, not merely be filtered by RLS.
DO $direct$
DECLARE denied boolean;
BEGIN
 denied:=false;
 BEGIN
  UPDATE public.closet_backups SET revision=999;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Direct owner UPDATE still permitted'; END IF;

 denied:=false;
 BEGIN
  INSERT INTO public.closet_backups(owner_id,revision,document)
  VALUES ('a1111111-1111-4111-8111-111111111111',999,'{}'::jsonb);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Direct owner INSERT still permitted'; END IF;

 denied:=false;
 BEGIN
  DELETE FROM public.closet_backups;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Direct owner DELETE still permitted'; END IF;

 denied:=false;
 BEGIN
  EXECUTE 'TRUNCATE public.closet_backups';
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Direct TRUNCATE still permitted'; END IF;
END $direct$;

-- The non-exposed private function cannot allow forging another owner;
-- same RPC semantics whether called through the public wrapper or directly.
SELECT set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',false);
DO $cross$
DECLARE n bigint;
BEGIN
 IF EXISTS(SELECT 1 FROM public.closet_backups)
 THEN RAISE EXCEPTION 'Another owner backup is visible'; END IF;
 n:=closet_rpc_private.save_checked(2,
  '{"schemaVersion":1,"items":[{"id":"attacker"}],"state":{}}'::jsonb);
 IF n IS NOT NULL THEN RAISE EXCEPTION 'Cross-owner CAS by private function succeeded'; END IF;
 n:=public.save_closet_backup(0,'{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 IF n<>1 THEN RAISE EXCEPTION 'Second account could not save its own closet'; END IF;
 IF (SELECT count(*) FROM public.closet_backups)<>1 THEN
  RAISE EXCEPTION 'Second account cannot select its own backup'; END IF;
END $cross$;

-- Malformed/oversized and unauthenticated inputs never write rows.
DO $malformed$
DECLARE n bigint; refused boolean:=false;
BEGIN
 BEGIN
  n:=public.save_closet_backup(0,
   '{"schemaVersion":1,"items":null,"state":{}}'::jsonb);
 EXCEPTION WHEN others THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'Invalid backup accepted'; END IF;
 refused:=false;
 BEGIN
  n:=public.save_closet_backup(0,
   ('{"schemaVersion":1,"items":[],"state":{"oversize":"'||
    repeat('X',5242881)||'"}}')::jsonb);
 EXCEPTION WHEN others THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'Oversized backup accepted'; END IF;
END $malformed$;
RESET ROLE;

-- No anon execution even if the PostgREST RPC is discoverable.
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','',false);
DO $anon$
DECLARE refused boolean:=false; n bigint;
BEGIN
 BEGIN
  n:=public.save_closet_backup(0,'{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 EXCEPTION WHEN insufficient_privilege THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'Anonymous RPC call permitted'; END IF;
END $anon$;
RESET ROLE;

-- Modern Supabase PostgREST may supply only request.jwt.claims JSON.
-- The private writer must recognize the same verified sub that auth.uid()
-- reads, even when the legacy individual JWT GUC is empty.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT set_config('request.jwt.claims',
 '{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated"}',false);
DO $modern$
DECLARE rev bigint;
BEGIN
 rev:=public.save_closet_backup(1,
  '{"schemaVersion":1,"items":[{"id":"json-jwt-owner"}],"state":{}}'::jsonb);
 IF rev<>2 THEN RAISE EXCEPTION 'Modern JSON-only JWT owner backup failed'; END IF;
END $modern$;
RESET ROLE;
DO $modern_verify$
BEGIN
 IF (SELECT revision FROM public.closet_backups
    WHERE owner_id='b2222222-2222-4222-8222-222222222222')<>2
 THEN RAISE EXCEPTION 'Modern JWT format did not preserve revision CAS'; END IF;
END $modern_verify$;

-- Privileged administrator still has server-side ability to delete an
-- individual account backup as part of separate disabled deletion program.
SET ROLE service_role;
DELETE FROM public.closet_backups
 WHERE owner_id='a1111111-1111-4111-8111-111111111111';
RESET ROLE;
DO $server$
BEGIN
 IF EXISTS(SELECT 1 FROM public.closet_backups
  WHERE owner_id='a1111111-1111-4111-8111-111111111111')
 THEN RAISE EXCEPTION 'Server cleanup did not remove the requested backup'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.closet_backups
  WHERE owner_id='b2222222-2222-4222-8222-222222222222')
 THEN RAISE EXCEPTION 'Server cleanup harmed the other account'; END IF;
END $server$;

SELECT 'CLOSET_RPC_ONLY_WRITES_DISPOSABLE_PG_PASS' AS result;
