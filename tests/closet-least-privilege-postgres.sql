\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 only. Does not connect to hosted Supabase.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
CREATE FUNCTION storage.foldername(file_name text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(file_name,'/') $$;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE storage.buckets(
 id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL,
 file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE storage.objects(bucket_id text NOT NULL,name text NOT NULL,
 PRIMARY KEY(bucket_id,name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public, storage, auth TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth, storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO service_role;
-- SOURCE bootstrap: new database, table+RPC and actual private policy SQL.
\i supabase/cloud-backup.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.closet_backups TO service_role;
INSERT INTO auth.users(id) VALUES
 ('a1111111-1111-4111-8111-111111111111'),
 ('b2222222-2222-4222-8222-222222222222');

-- Simulate confirmed overly broad hosted role defaults.
GRANT ALL PRIVILEGES ON public.closet_backups TO authenticated;
DO $$
BEGIN
 IF NOT has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
 THEN RAISE EXCEPTION 'Pre-fix default-grant regression not reproduced'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='storage'
  AND tablename='objects' AND policyname='closet_photos_update'
 ) THEN RAISE EXCEPTION 'Pre-fix storage upsert policy missing'; END IF;
END $$;

\i supabase/design/closet-backup-least-privilege.DRAFT.sql

DO $$
BEGIN
 IF has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
 OR has_table_privilege('authenticated','public.closet_backups','DELETE')
 OR has_table_privilege('authenticated','public.closet_backups','TRIGGER')
 OR has_table_privilege('authenticated','public.closet_backups','REFERENCES')
 OR has_table_privilege('anon','public.closet_backups','TRUNCATE')
 THEN RAISE EXCEPTION 'Overbroad database permissions survived'; END IF;
 IF NOT has_table_privilege('service_role','public.closet_backups','DELETE')
 OR NOT has_table_privilege('service_role','public.closet_backups','SELECT')
 THEN RAISE EXCEPTION 'Server-side deletion capabilities damaged'; END IF;
END $$;

-- A real browser user's RPC still works while source role cannot bypass
-- owner RLS or the optimistic concurrent backup save.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE n bigint;
BEGIN
 n:=public.save_closet_backup(0,'{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 IF n<>1 THEN RAISE EXCEPTION 'Authenticated backup insert RPC failed'; END IF;
 n:=public.save_closet_backup(1,'{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 IF n<>2 THEN RAISE EXCEPTION 'Authenticated backup update RPC failed'; END IF;
 n:=public.save_closet_backup(1,'{"schemaVersion":1,"items":[],"state":{}}'::jsonb);
 IF n IS NOT NULL THEN RAISE EXCEPTION 'Stale cloud backup revision was accepted'; END IF;
 IF (SELECT count(*) FROM public.closet_backups)<>1
 THEN RAISE EXCEPTION 'Owner RLS blocked or leaked metadata'; END IF;
END $$;

-- Even direct SQL as the browser role cannot wipe *any* user's backups.
DO $$
DECLARE was_blocked boolean:=false;
BEGIN
 BEGIN
  EXECUTE 'TRUNCATE TABLE public.closet_backups';
 EXCEPTION WHEN insufficient_privilege THEN was_blocked:=true; END;
 IF NOT was_blocked THEN RAISE EXCEPTION 'TRUNCATE bypass still permitted'; END IF;
 was_blocked:=false;
 BEGIN
  DELETE FROM public.closet_backups;
 EXCEPTION WHEN insufficient_privilege THEN was_blocked:=true; END;
 IF NOT was_blocked THEN RAISE EXCEPTION 'Unneeded DELETE still permitted'; END IF;
END $$;

-- Owner can insert and read a new private immutable photo.
INSERT INTO storage.objects(bucket_id,name) VALUES
 ('closet-private','a1111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg');
DO $$
DECLARE row_count bigint:=0; permission_blocked boolean:=false;
BEGIN
 IF (SELECT count(*) FROM storage.objects)<>1
 THEN RAISE EXCEPTION 'Private Storage owner read failed'; END IF;
 BEGIN
  UPDATE storage.objects SET name=
    'a1111111-1111-4111-8111-111111111111/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg'
   WHERE bucket_id='closet-private';
  GET DIAGNOSTICS row_count=ROW_COUNT;
 EXCEPTION WHEN insufficient_privilege THEN permission_blocked:=true; END;
 -- PostgreSQL UPDATE RLS often silently affects zero rows rather than
 -- throwing an error. Check both the result and the original object.
 IF NOT permission_blocked AND row_count<>0 THEN
  RAISE EXCEPTION 'Immutable photo overwrite affected rows'; END IF;
 IF (SELECT count(*) FROM storage.objects WHERE name=
   'a1111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg')<>1
 THEN RAISE EXCEPTION 'Original SHA-addressed photo was changed'; END IF;
END $$;

-- Non-owner still cannot read another account or insert under its prefix.
SELECT set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 IF (SELECT count(*) FROM storage.objects)<>0
 OR (SELECT count(*) FROM public.closet_backups)<>0
 THEN RAISE EXCEPTION 'Foreign owner closet metadata or photos visible'; END IF;
 BEGIN
  INSERT INTO storage.objects(bucket_id,name) VALUES
   ('closet-private','a1111111-1111-4111-8111-111111111111/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.jpg');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-account photo insert succeeded'; END IF;
 blocked:=false;
 BEGIN
  INSERT INTO public.closet_backups(owner_id,revision,document) VALUES
   ('a1111111-1111-4111-8111-111111111111',1,'{}'::jsonb);
 EXCEPTION WHEN insufficient_privilege OR unique_violation THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-account backup insertion succeeded'; END IF;
END $$;
RESET ROLE;
-- Server owner cleanup remains possible after client revokes.
DELETE FROM public.closet_backups
 WHERE owner_id='a1111111-1111-4111-8111-111111111111';
SELECT 'CLOSET_LEAST_PRIVILEGE_DISPOSABLE_POSTGRES_PASS' AS result;
