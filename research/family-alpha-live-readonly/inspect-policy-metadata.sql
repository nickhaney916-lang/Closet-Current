-- Closet Current Family Alpha v0.1 — READ-ONLY METADATA INSPECTION ONLY.
-- Run separately in *authorized* production and staging Supabase projects;
-- DO NOT run any writes, impersonate users, load user rows or list photographs.
-- Recheck the stage and production ref before executing.
-- This SQL is NOT automatically run by CI. No test identities or account data.
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
       has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
       has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select,
       has_table_privilege('authenticated',c.oid,'INSERT') AS authenticated_insert,
       has_table_privilege('authenticated',c.oid,'UPDATE') AS authenticated_update,
       has_table_privilege('authenticated',c.oid,'DELETE') AS authenticated_delete,
       has_table_privilege('authenticated',c.oid,'TRUNCATE') AS authenticated_truncate,
       has_table_privilege('authenticated',c.oid,'TRIGGER') AS authenticated_trigger,
       has_table_privilege('authenticated',c.oid,'REFERENCES') AS authenticated_references
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='closet_backups' AND c.relkind IN ('r','p');

SELECT schemaname,tablename,policyname,cmd,roles,permissive,qual,with_check
FROM pg_catalog.pg_policies
WHERE (schemaname='public' AND tablename='closet_backups')
   OR (schemaname='storage' AND tablename='objects')
ORDER BY schemaname,tablename,policyname;

SELECT id,public,file_size_limit,allowed_mime_types
FROM storage.buckets WHERE id='closet-private';

SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,pg_get_userbyid(p.proowner) AS owner,
       pg_get_functiondef(p.oid) AS definition,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE (n.nspname='public' AND p.proname='save_closet_backup')
   OR (n.nspname='closet_rpc_private' AND p.proname='save_checked');

SELECT 'authenticated' AS role,
       has_schema_privilege('authenticated','closet_rpc_private','USAGE') AS private_schema_usage
WHERE EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='closet_rpc_private');

-- After metadata review, real Auth/JWT owner A/B negative/positive tests
-- require a separately approved protected staging session. Not in this script.
