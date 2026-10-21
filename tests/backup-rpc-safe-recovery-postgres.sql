\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 only: source schema -> harden -> recover.
\i tests/backup-rpc-only-writes-postgres.sql
\i supabase/design/backup-rpc-only-writes-safe-recovery.DRAFT.sql

DO $guard$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='closet_backup_writer')
  OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='closet_rpc_private')
 THEN RAISE EXCEPTION 'Private writer still installed'; END IF;
 IF has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
  OR has_table_privilege('authenticated','public.closet_backups','DELETE')
  OR has_table_privilege('authenticated','public.closet_backups','TRIGGER')
  OR has_table_privilege('authenticated','public.closet_backups','REFERENCES')
  OR has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'Recovery restored dangerous grants'; END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage'
    AND tablename='objects' AND cmd IN ('ALL','UPDATE'))
 THEN RAISE EXCEPTION 'Recovery restored mutable photo policy'; END IF;
 IF (SELECT document->'items'->0->>'id' FROM public.closet_backups
     WHERE owner_id='b2222222-2222-4222-8222-222222222222')<>'json-jwt-owner'
 THEN RAISE EXCEPTION 'Recovery lost existing owner B backup'; END IF;
END $guard$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',false);
DO $owner$
DECLARE r bigint;denied boolean;
BEGIN
 r:=public.save_closet_backup(2,
    '{"schemaVersion":1,"items":[{"id":"after-recovery"}],"state":{}}'::jsonb);
 IF r<>3 THEN RAISE EXCEPTION 'Recovered RPC cannot update own backup'; END IF;
 r:=public.save_closet_backup(2,
    '{"schemaVersion":1,"items":[{"id":"stale-after-recovery"}],"state":{}}'::jsonb);
 IF r IS NOT NULL THEN RAISE EXCEPTION 'Recovered RPC violated CAS'; END IF;
 IF (SELECT document->'items'->0->>'id' FROM public.closet_backups)
    <> 'after-recovery'
 THEN RAISE EXCEPTION 'Recovered RPC failed to preserve latest document'; END IF;
 denied:=false;
 BEGIN EXECUTE 'TRUNCATE public.closet_backups';
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'TRUNCATE escaped recovery control'; END IF;
 denied:=false;
 BEGIN DELETE FROM public.closet_backups;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'DELETE escaped recovery control'; END IF;
END $owner$;
SELECT set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',false);
DO $other$
DECLARE r bigint;
BEGIN
 IF (SELECT count(*) FROM public.closet_backups)<>0
 THEN RAISE EXCEPTION 'Recovered owner policy leaked B to A'; END IF;
 r:=public.save_closet_backup(3,
    '{"schemaVersion":1,"items":[{"id":"foreign"}],"state":{}}'::jsonb);
 IF r IS NOT NULL THEN RAISE EXCEPTION 'Cross-owner update succeeded'; END IF;
 r:=public.save_closet_backup(0,
    '{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 IF r<>1 THEN RAISE EXCEPTION 'Owner A cannot create an independent backup'; END IF;
END $other$;
RESET ROLE;
SET ROLE anon;
DO $anon$
DECLARE denied boolean:=false;rev bigint;
BEGIN
 BEGIN
  rev:=public.save_closet_backup(0,
   '{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous recovered RPC was executable'; END IF;
END $anon$;
RESET ROLE;
SELECT 'CLOSET_BACKUP_SAFE_RECOVERY_DISPOSABLE_PASS' AS result;
