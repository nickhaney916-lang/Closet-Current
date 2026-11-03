-- CLOUD-RLS-01: READ-ONLY CATALOG INSPECTION. NEVER paste customer-row queries.
-- Run separately against Closet Current production and staging.
-- This file contains SELECT statements only. No migrations or test writes.

-- Public exposed relations, row-level-security and SQL role grants.
SELECT c.relname, c.relkind, c.relrowsecurity AS rls_enabled,
 has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
 has_table_privilege('anon',c.oid,'INSERT') AS anon_insert,
 has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select,
 has_table_privilege('authenticated',c.oid,'INSERT') AS authenticated_insert,
 has_table_privilege('authenticated',c.oid,'UPDATE') AS authenticated_update,
 has_table_privilege('authenticated',c.oid,'DELETE') AS authenticated_delete
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')
ORDER BY c.relname;

-- Backup per-owner USING and WITH CHECK predicates (no payload).
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_catalog.pg_policies
WHERE schemaname='public' AND tablename='closet_backups';

-- Storage object policy path ownership. NO storage object list and NO images.
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_catalog.pg_policies
WHERE schemaname='storage' AND tablename='objects'
ORDER BY policyname;

-- Bucket privacy and format-only metadata. No object keys.
SELECT id,name,public,file_size_limit,allowed_mime_types
FROM storage.buckets WHERE id='closet-private';

-- RPC authorization and function body source, not cloud data.
SELECT n.nspname,p.proname,p.prosecdef AS security_definer,p.proconfig,
 pg_get_function_identity_arguments(p.oid) AS arguments,
 left(pg_get_functiondef(p.oid),9000) AS definition,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE p.proname IN ('save_closet_backup','save_checked')
 AND n.nspname IN ('public','closet_rpc_private');

-- Staging only: verify writer role is not exposed to anon/authenticated.
SELECT rolname,rolcanlogin,rolbypassrls,
 pg_has_role('authenticated',oid,'member') AS auth_member,
 pg_has_role('anon',oid,'member') AS anon_member,
 has_table_privilege(oid,'public.closet_backups','INSERT') AS can_insert,
 has_table_privilege(oid,'public.closet_backups','UPDATE') AS can_update
FROM pg_catalog.pg_roles WHERE rolname='closet_backup_writer';

-- Security advisors run separately in the connected Supabase dashboard/plugin.
-- No signed-in A/B API proof was performed by these SELECT statements.
