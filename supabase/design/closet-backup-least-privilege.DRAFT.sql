-- DEVELOPMENT DESIGN ONLY. NEVER automatically execute against hosted Supabase.
-- Live read-only audit 2026-10-20 found authenticated had TRUNCATE/DELETE
-- privileges on public.closet_backups; RLS does not protect TRUNCATE.
-- Prior to use: obtain explicit owner release/DB authorization, preserve
-- a verified rollback plan, and rerun owner/attacker REST + Storage HTTP tests.
BEGIN;

-- Conservative drift guard: existing table, private bucket and known RLS
-- policies must be present. Do not retrofit an unknown storage design.
DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
  WHERE n.nspname='public' AND c.relname='closet_backups' AND c.relrowsecurity
 ) THEN RAISE EXCEPTION 'Private closet backup/RLS contract missing'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM storage.buckets
  WHERE id='closet-private' AND public IS FALSE
 ) THEN RAISE EXCEPTION 'Private JPEG bucket missing or public'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
   AND policyname='closet_photos_update'
   AND cmd='UPDATE'
 ) THEN RAISE EXCEPTION 'Expected storage photo UPDATE policy changed'; END IF;
 IF EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
    AND policyname<>'closet_photos_update'
    AND cmd IN ('ALL','UPDATE')
 ) THEN RAISE EXCEPTION 'Another broad storage UPDATE policy requires security review'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
  WHERE n.nspname='public' AND p.proname='save_closet_backup'
   AND NOT p.prosecdef
 ) THEN RAISE EXCEPTION 'Security-invoker backup RPC missing or changed'; END IF;
END $$;

-- Explicitly remove inherited overly broad client grants. In particular,
-- TRUNCATE, TRIGGER, REFERENCES, MAINTAIN and DELETE have no client need.
-- Keep only SELECT/INSERT/UPDATE required by current SECURITY INVOKER RPC.
REVOKE ALL PRIVILEGES ON TABLE public.closet_backups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.closet_backups TO authenticated;

-- Photos use immutable account-id/SHA256 paths, uploaded via INSERT only.
-- A client-side upsert of an existing path can invalidate its SHA integrity.
-- Leave authenticated INSERT/SELECT and owner DELETE policies unchanged.
DROP POLICY closet_photos_update ON storage.objects;

-- Check effective privileges *after* applying both changes, fail/rollback
-- atomically if any unexpected grant still gives client a bypass.
DO $$
BEGIN
 IF has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
 OR has_table_privilege('authenticated','public.closet_backups','DELETE')
 OR has_table_privilege('authenticated','public.closet_backups','TRIGGER')
 OR has_table_privilege('authenticated','public.closet_backups','REFERENCES')
 OR has_table_privilege('anon','public.closet_backups','SELECT')
 OR has_table_privilege('anon','public.closet_backups','TRUNCATE')
 OR NOT has_table_privilege('authenticated','public.closet_backups','SELECT')
 OR NOT has_table_privilege('authenticated','public.closet_backups','INSERT')
 OR NOT has_table_privilege('authenticated','public.closet_backups','UPDATE')
 OR NOT has_function_privilege('authenticated','public.save_closet_backup(bigint,jsonb)','EXECUTE')
 OR has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'Private closet backup privilege verification failed'; END IF;
 IF EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
    AND cmd IN ('UPDATE','ALL')
 ) THEN RAISE EXCEPTION 'Storage overwrite policy still exists'; END IF;
END $$;

COMMIT;
