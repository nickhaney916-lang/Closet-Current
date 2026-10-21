-- DEVELOPMENT DESIGN ONLY: do not apply on hosted Supabase without approval.
-- Requires the predecessor closet-backup-least-privilege.DRAFT.sql applied.
-- Keep original browser RPC signature and JSON document format unchanged.
--
-- SECURITY DEFINER EXCEPTION REVIEW:
-- This PRIVILEGED function is NOT in public/exposed schemas. It runs as a
-- dedicated NOLOGIN NOBYPASSRLS role, NOT postgres/service_role; that role is
-- NOT the table owner and has only SELECT/INSERT/UPDATE grants. RLS still
-- applies to all its writes, with a separate auth.uid() owner policy.
-- The public entrypoint remains SECURITY INVOKER and passes no owner ID.
BEGIN;

DO $guard$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
  WHERE n.nspname='public' AND c.relname='closet_backups' AND c.relrowsecurity
 ) THEN RAISE EXCEPTION 'Owner RLS table not enabled'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='public'
   AND tablename='closet_backups' AND policyname='closet_backup_owner'
   AND cmd='ALL' AND roles='{authenticated}'
   AND qual LIKE '%auth.uid()%owner_id%'
   AND with_check LIKE '%auth.uid()%owner_id%'
 ) THEN RAISE EXCEPTION 'Owner policy drift requires review'; END IF;
 IF NOT has_table_privilege('authenticated','public.closet_backups','INSERT')
 OR NOT has_table_privilege('authenticated','public.closet_backups','UPDATE')
 OR NOT has_table_privilege('authenticated','public.closet_backups','SELECT')
 OR has_table_privilege('authenticated','public.closet_backups','DELETE')
 OR has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
 THEN RAISE EXCEPTION 'Prior least-privilege migration not applied'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='save_closet_backup'
   AND p.pronargs=2 AND NOT p.prosecdef
 ) THEN RAISE EXCEPTION 'Public backup RPC signature or privilege changed'; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='closet_backup_writer')
 OR EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='closet_rpc_private')
 THEN RAISE EXCEPTION 'Private RPC identity already exists: manual review required'; END IF;
END $guard$;

-- Run as project administrator during an approved deployment only. The
-- explicit NOLOGIN/NOBYPASSRLS role is NEVER granted to browser roles.
CREATE ROLE closet_backup_writer NOLOGIN NOINHERIT NOBYPASSRLS;
-- The protected auth schema is owned by supabase_auth_admin and hosted
-- migration executors cannot GRANT it to arbitrary roles. Read the same
-- verified, PostgREST-populated JWT subject GUC used by auth.uid() instead.
-- No custom/unsigned account identifier is accepted as a function argument.
GRANT USAGE ON SCHEMA public TO closet_backup_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.closet_backups TO closet_backup_writer;
CREATE POLICY closet_backup_writer_owner
 ON public.closet_backups FOR ALL TO closet_backup_writer
 USING ((SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid)=owner_id)
 WITH CHECK ((SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid)=owner_id);

-- Supabase migration executor needs temporary SET ROLE not only to
-- transfer the function owner, but also to CREATE SCHEMA AUTHORIZATION.
-- The transactional role membership is removed immediately after ownership
-- handoff. Its grants never include authenticated or anon.
GRANT closet_backup_writer TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
CREATE SCHEMA closet_rpc_private AUTHORIZATION closet_backup_writer;
-- Migration administrator is not a superuser; become the private schema
-- owner only while creating this narrowly scoped function and its grants.
SET ROLE closet_backup_writer;
-- The schema is NOT in the configured PostgREST exposed schemas.
GRANT USAGE ON SCHEMA closet_rpc_private TO authenticated;

-- All relation/function names are schema-qualified and search_path is empty.
-- No trust is placed in user_metadata, user-supplied owner IDs or search_path.
CREATE FUNCTION closet_rpc_private.save_checked(
 p_expected_revision bigint,p_document jsonb
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE saved_revision bigint;
 request_owner uuid;
BEGIN
 request_owner := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
 IF request_owner IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING errcode='42501';
 END IF;
 IF p_expected_revision IS NULL OR p_expected_revision<0
 OR p_document IS NULL
 OR p_document->>'schemaVersion' IS DISTINCT FROM '1'
 OR jsonb_typeof(p_document->'items') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_document->'state') IS DISTINCT FROM 'object'
 OR octet_length(p_document::text)>5242880 THEN
  RAISE EXCEPTION 'Invalid backup';
 END IF;
 IF p_expected_revision=0 THEN
  INSERT INTO public.closet_backups(owner_id,revision,document)
   VALUES (request_owner,1,p_document)
   ON CONFLICT(owner_id) DO NOTHING RETURNING revision INTO saved_revision;
 ELSE
  UPDATE public.closet_backups
   SET document=p_document,revision=revision+1,updated_at=now()
   WHERE owner_id=request_owner AND revision=p_expected_revision
   RETURNING revision INTO saved_revision;
 END IF;
 RETURN saved_revision;
END $body$;
-- As the private writer, create/grant the function without relying on
-- database superuser privileges. Revoke temporary migration membership
-- immediately afterward. No browser role is ever granted writer membership.
REVOKE ALL ON FUNCTION closet_rpc_private.save_checked(bigint,jsonb)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION closet_rpc_private.save_checked(bigint,jsonb)
 TO authenticated;
RESET ROLE;
REVOKE closet_backup_writer FROM CURRENT_USER;
-- PostgreSQL 16+ may retain an implicit ADMIN membership for CREATEROLE
-- creators; this does NOT imply SET ROLE permission. Verify that the
-- migration executor cannot assume the private writer after this step.

-- Retain exact original PostgREST RPC path, argument names and JSON return.
-- A private function could also be called directly by an authenticated SQL
-- session, but performs exactly the same owned, revision-checked operation.
CREATE OR REPLACE FUNCTION public.save_closet_backup(
 p_expected_revision bigint,p_document jsonb
) RETURNS bigint
LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $wrapper$
 SELECT closet_rpc_private.save_checked(p_expected_revision,p_document);
$wrapper$;
REVOKE ALL ON FUNCTION public.save_closet_backup(bigint,jsonb)
 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_closet_backup(bigint,jsonb)
 TO authenticated;

-- Clients can now READ only their owned rows through the RLS policy.
-- They cannot POST/PATCH/DELETE the backup table directly.
REVOKE INSERT, UPDATE ON TABLE public.closet_backups FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.closet_backups FROM anon, PUBLIC;

DO $check$
BEGIN
 -- Narrow, non-PII diagnostics for privilege drift. These checks only
 -- disclose boolean grants and role identities, never customer records.
 RAISE NOTICE 'BACKUP_RPC_ROLE_FLAGS table: insert=% update=% delete=% truncate=% select=% anon_select=%',
  has_table_privilege('authenticated','public.closet_backups','INSERT'),
  has_table_privilege('authenticated','public.closet_backups','UPDATE'),
  has_table_privilege('authenticated','public.closet_backups','DELETE'),
  has_table_privilege('authenticated','public.closet_backups','TRUNCATE'),
  has_table_privilege('authenticated','public.closet_backups','SELECT'),
  has_table_privilege('anon','public.closet_backups','SELECT');
 RAISE NOTICE 'BACKUP_RPC_ROLE_FLAGS functions: anon_public=% auth_public=% anon_private=% auth_private=% writer_can_set_admin=% writer_member_auth=%',
  has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE'),
  has_function_privilege('authenticated','public.save_closet_backup(bigint,jsonb)','EXECUTE'),
  has_function_privilege('anon','closet_rpc_private.save_checked(bigint,jsonb)','EXECUTE'),
  has_function_privilege('authenticated','closet_rpc_private.save_checked(bigint,jsonb)','EXECUTE'),
  pg_has_role(CURRENT_USER,'closet_backup_writer','SET'),
  pg_has_role('authenticated','closet_backup_writer','MEMBER');
 RAISE NOTICE 'BACKUP_RPC_ROLE_FLAGS ownership: table_writer=% private_definer=% private_writer=% public_definer=%',
  (SELECT c.relowner = 'closet_backup_writer'::regrole FROM pg_class c WHERE c.oid='public.closet_backups'::regclass),
  (SELECT p.prosecdef FROM pg_proc p WHERE p.oid='closet_rpc_private.save_checked(bigint,jsonb)'::regprocedure),
  (SELECT p.proowner='closet_backup_writer'::regrole FROM pg_proc p WHERE p.oid='closet_rpc_private.save_checked(bigint,jsonb)'::regprocedure),
  (SELECT p.prosecdef FROM pg_proc p WHERE p.oid='public.save_closet_backup(bigint,jsonb)'::regprocedure);
 IF has_table_privilege('authenticated','public.closet_backups','INSERT')
 OR has_table_privilege('authenticated','public.closet_backups','UPDATE')
 OR has_table_privilege('authenticated','public.closet_backups','DELETE')
 OR has_table_privilege('authenticated','public.closet_backups','TRUNCATE')
 OR NOT has_table_privilege('authenticated','public.closet_backups','SELECT')
 OR has_table_privilege('anon','public.closet_backups','SELECT')
 OR has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.save_closet_backup(bigint,jsonb)','EXECUTE')
 OR NOT has_function_privilege('authenticated','closet_rpc_private.save_checked(bigint,jsonb)','EXECUTE')
 OR has_function_privilege('anon','closet_rpc_private.save_checked(bigint,jsonb)','EXECUTE')
 OR pg_has_role(CURRENT_USER,'closet_backup_writer','SET')
 OR pg_has_role('authenticated','closet_backup_writer','MEMBER')
 OR pg_has_role('anon','closet_backup_writer','MEMBER')
 OR (SELECT rolcanlogin OR rolbypassrls FROM pg_roles
     WHERE rolname='closet_backup_writer')
 OR (SELECT p.prosecdef FROM pg_proc p
     WHERE p.oid='public.save_closet_backup(bigint,jsonb)'::regprocedure)
 OR NOT (SELECT p.prosecdef FROM pg_proc p
     WHERE p.oid='closet_rpc_private.save_checked(bigint,jsonb)'::regprocedure)
 OR (SELECT p.proowner <> 'closet_backup_writer'::regrole FROM pg_proc p
     WHERE p.oid='closet_rpc_private.save_checked(bigint,jsonb)'::regprocedure)
 OR (SELECT c.relowner = 'closet_backup_writer'::regrole FROM pg_class c
     WHERE c.oid='public.closet_backups'::regclass)
 THEN RAISE EXCEPTION 'Backup trusted-writer permissions do not match contract'; END IF;
END $check$;
COMMIT;
