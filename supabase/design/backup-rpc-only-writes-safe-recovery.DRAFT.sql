-- CLOSET CURRENT: DRAFT RECOVERY ONLY, NOT A HOSTED MIGRATION.
-- Run only on DISPOSABLE PostgreSQL for review. Requires owner authorization,
-- a confirmed database backup, checked recovery window and live staging proof
-- before consideration for any real environment.
--
-- Recover the pre-private-writer FUNCTION contract while keeping the safer
-- least-privilege grants. NEVER reinstate DELETE/TRUNCATE/TRIGGER/REFERENCES.
-- This restores owner-scoped SECURITY INVOKER RPC with temporary direct
-- SELECT/INSERT/UPDATE table access; it is a controlled fallback, not the
-- preferred final RPC-only design.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.closet_backups IN ACCESS EXCLUSIVE MODE;
DO $guard$
DECLARE actual_private_functions bigint;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
   WHERE n.nspname='public' AND c.relname='closet_backups' AND c.relrowsecurity)
 THEN RAISE EXCEPTION 'Private owner backup table / RLS missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies
   WHERE schemaname='public' AND tablename='closet_backups'
   AND policyname='closet_backup_owner' AND cmd='ALL'
   AND roles='{authenticated}' AND qual LIKE '%auth.uid()%owner_id%'
   AND with_check LIKE '%auth.uid()%owner_id%')
 THEN RAISE EXCEPTION 'Owner policy drift: review before recovery'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='closet-private' AND public IS FALSE)
 THEN RAISE EXCEPTION 'Private photo bucket missing or public'; END IF;
 IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage'
   AND tablename='objects' AND cmd IN ('ALL','UPDATE'))
 THEN RAISE EXCEPTION 'Unexpected Storage UPDATE policy; stop recovery'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='closet_backup_writer'
   AND rolcanlogin IS FALSE AND rolbypassrls IS FALSE)
 THEN RAISE EXCEPTION 'Missing expected no-login/no-bypass writer role'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='closet_rpc_private'
   AND nspowner='closet_backup_writer'::regrole)
 THEN RAISE EXCEPTION 'Unexpected private schema ownership'; END IF;
 SELECT count(*) INTO actual_private_functions
  FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
  WHERE n.nspname='closet_rpc_private';
 IF actual_private_functions<>1 OR NOT EXISTS (
   SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
   WHERE n.nspname='closet_rpc_private' AND p.proname='save_checked'
   AND p.pronargs=2 AND p.prosecdef
   AND p.proowner='closet_backup_writer'::regrole)
 THEN RAISE EXCEPTION 'Private RPC schema has unexpected functions'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_proc
   WHERE oid='public.save_closet_backup(bigint,jsonb)'::regprocedure
     AND NOT prosecdef
     AND pg_get_functiondef(oid) LIKE '%closet_rpc_private.save_checked%')
 THEN RAISE EXCEPTION 'Public wrapper drift: recovery refused'; END IF;
 IF has_table_privilege('authenticated','public.closet_backups','INSERT')
   OR has_table_privilege('authenticated','public.closet_backups','UPDATE')
   OR has_table_privilege('authenticated','public.closet_backups','DELETE')
   OR has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
   OR NOT has_table_privilege('authenticated','public.closet_backups','SELECT')
   OR NOT has_function_privilege('authenticated',
      'public.save_closet_backup(bigint,jsonb)','EXECUTE')
   OR has_function_privilege('anon',
      'public.save_closet_backup(bigint,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'Database privileges do not match expected hardened source'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles
    WHERE rolname='closet_backup_writer' AND NOT rolcanlogin AND NOT rolbypassrls)
   OR pg_has_role('authenticated','closet_backup_writer','MEMBER')
   OR pg_has_role('anon','closet_backup_writer','MEMBER')
 THEN RAISE EXCEPTION 'Private writer leaked to a client role'; END IF;
END $guard$;

-- Restore exact original owner-checked CAS RPC. The function never accepts
-- caller-supplied user ID, and still enforces the 5 MiB document cap.
CREATE OR REPLACE FUNCTION public.save_closet_backup(
 p_expected_revision bigint,p_document jsonb
) RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $body$
DECLARE saved_revision bigint;
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING errcode = '42501';
 END IF;
 IF p_expected_revision IS NULL OR p_expected_revision < 0
  OR p_document IS NULL
  OR p_document->>'schemaVersion' IS DISTINCT FROM '1'
  OR jsonb_typeof(p_document->'items') IS DISTINCT FROM 'array'
  OR jsonb_typeof(p_document->'state') IS DISTINCT FROM 'object'
  OR octet_length(p_document::text) > 5242880
 THEN RAISE EXCEPTION 'Invalid backup'; END IF;
 IF p_expected_revision=0 THEN
  INSERT INTO public.closet_backups(owner_id,revision,document)
   VALUES(auth.uid(),1,p_document)
   ON CONFLICT(owner_id) DO NOTHING RETURNING revision INTO saved_revision;
 ELSE
  UPDATE public.closet_backups
   SET document=p_document,revision=revision+1,updated_at=now()
   WHERE owner_id=auth.uid() AND revision=p_expected_revision
   RETURNING revision INTO saved_revision;
 END IF;
 RETURN saved_revision;
END $body$;

-- Only rights needed by the SECURITY INVOKER implementation; no broad roles.
REVOKE ALL PRIVILEGES ON TABLE public.closet_backups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.closet_backups TO authenticated;
REVOKE ALL ON FUNCTION public.save_closet_backup(bigint,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_closet_backup(bigint,jsonb) TO authenticated;

-- Remove owned objects as their actual owner. Supabase postgres is not a
-- superuser; its retained ADMIN-only membership allows temporary SET ROLE.
-- Transaction rollback removes this temporary SET option on any failure.
GRANT closet_backup_writer TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
SET ROLE closet_backup_writer;
DROP FUNCTION closet_rpc_private.save_checked(bigint,jsonb);
DROP SCHEMA closet_rpc_private;
RESET ROLE;
DROP POLICY closet_backup_writer_owner ON public.closet_backups;
REVOKE SELECT, INSERT, UPDATE ON public.closet_backups FROM closet_backup_writer;
REVOKE USAGE ON SCHEMA public FROM closet_backup_writer;
DROP ROLE closet_backup_writer;

DO $proof$
BEGIN
 IF to_regnamespace('closet_rpc_private') IS NOT NULL OR
  EXISTS (SELECT 1 FROM pg_roles WHERE rolname='closet_backup_writer')
 THEN RAISE EXCEPTION 'Private writer resources survived recovery'; END IF;
 IF NOT has_table_privilege('authenticated','public.closet_backups','SELECT')
  OR NOT has_table_privilege('authenticated','public.closet_backups','INSERT')
  OR NOT has_table_privilege('authenticated','public.closet_backups','UPDATE')
  OR has_table_privilege('authenticated','public.closet_backups','DELETE')
  OR has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
  OR has_table_privilege('authenticated','public.closet_backups','TRIGGER')
  OR has_table_privilege('authenticated','public.closet_backups','REFERENCES')
  OR has_table_privilege('authenticated','public.closet_backups','MAINTAIN')
  OR has_table_privilege('anon','public.closet_backups','SELECT')
  OR has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE')
  OR NOT has_function_privilege('authenticated',
    'public.save_closet_backup(bigint,jsonb)','EXECUTE')
  OR (SELECT prosecdef FROM pg_proc
    WHERE oid='public.save_closet_backup(bigint,jsonb)'::regprocedure)
  OR EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage'
    AND tablename='objects' AND cmd IN ('ALL','UPDATE'))
 THEN RAISE EXCEPTION 'Recovery postconditions failed; transaction rolls back'; END IF;
END $proof$;
COMMIT;
