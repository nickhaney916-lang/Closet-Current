-- Closet Current ONLY. READ-ONLY pg_catalog/role/permission state assessment.
-- Never scans customer rows, creates a migration, changes a role or grants
-- production release authorization. Exact state is metadata-only.
WITH flags AS (
 SELECT
  (SELECT c.relrowsecurity FROM pg_class c
    WHERE c.oid=to_regclass('public.closet_backups')) AS backup_rls,
  (SELECT count(*)=1 FROM pg_policies
    WHERE schemaname='public' AND tablename='closet_backups'
    AND policyname='closet_backup_owner' AND cmd='ALL'
    AND roles='{authenticated}'
    AND qual LIKE '%auth.uid()%owner_id%'
    AND with_check LIKE '%auth.uid()%owner_id%') AS owner_policy,
  (SELECT NOT public FROM storage.buckets WHERE id='closet-private') AS private_bucket,
  (SELECT c.relrowsecurity FROM pg_class c
    WHERE c.oid=to_regclass('storage.objects')) AS storage_rls,
  (SELECT count(*)=1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='closet_photos_read' AND cmd='SELECT'
      AND roles='{authenticated}' AND qual LIKE '%closet-private%'
      AND qual LIKE '%auth.uid()%') AS photo_read,
  (SELECT count(*)=1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='closet_photos_insert' AND cmd='INSERT'
      AND roles='{authenticated}' AND with_check LIKE '%closet-private%'
      AND with_check LIKE '%auth.uid()%') AS photo_insert,
  (SELECT count(*)>0 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='closet_photos_update' AND cmd='UPDATE') AS photo_mutable,
  (SELECT count(*)>0 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname <> 'closet_photos_update' AND cmd IN ('UPDATE','ALL')) AS other_storage_update,
  has_table_privilege('authenticated','public.closet_backups','SELECT') AS auth_select,
  has_table_privilege('authenticated','public.closet_backups','INSERT') AS auth_insert,
  has_table_privilege('authenticated','public.closet_backups','UPDATE') AS auth_update,
  has_table_privilege('authenticated','public.closet_backups','DELETE') AS auth_delete,
  has_table_privilege('authenticated','public.closet_backups','TRUNCATE') AS auth_truncate,
  has_table_privilege('authenticated','public.closet_backups','TRIGGER') AS auth_trigger,
  has_table_privilege('authenticated','public.closet_backups','REFERENCES') AS auth_references,
  has_table_privilege('authenticated','public.closet_backups','MAINTAIN') AS auth_maintain,
  has_table_privilege('anon','public.closet_backups','SELECT') AS anon_select,
  has_function_privilege('authenticated','public.save_closet_backup(bigint,jsonb)','EXECUTE') AS auth_rpc,
  has_function_privilege('anon','public.save_closet_backup(bigint,jsonb)','EXECUTE') AS anon_rpc,
  (SELECT count(*)=1 FROM pg_proc p WHERE
    p.oid=to_regprocedure('public.save_closet_backup(bigint,jsonb)')
    AND NOT p.prosecdef) AS public_rpc_invoker,
  (SELECT count(*)=1 FROM pg_roles r WHERE r.rolname='closet_backup_writer'
    AND NOT r.rolcanlogin AND NOT r.rolbypassrls) AS private_role,
  (SELECT count(*)=1 FROM pg_namespace n JOIN pg_roles r ON r.oid=n.nspowner
    WHERE n.nspname='closet_rpc_private' AND r.rolname='closet_backup_writer') AS private_schema,
  (SELECT count(*)=1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    JOIN pg_roles r ON p.proowner=r.oid
    WHERE n.nspname='closet_rpc_private' AND p.proname='save_checked'
      AND p.pronargs=2 AND p.prosecdef AND r.rolname='closet_backup_writer') AS private_function,
  (SELECT count(*)=0 FROM pg_roles r WHERE r.rolname='closet_backup_writer'
    AND (pg_has_role('authenticated',r.oid,'MEMBER')
     OR pg_has_role('anon',r.oid,'MEMBER'))) AS no_client_writer_member,
  (SELECT count(*)=0 FROM pg_roles r WHERE r.rolname='closet_backup_writer'
    AND (pg_has_role('authenticated',r.oid,'SET')
     OR pg_has_role('anon',r.oid,'SET'))) AS no_client_writer_set,
  (SELECT count(*)=0 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    WHERE n.nspname='closet_rpc_private' AND p.proname='save_checked'
      AND p.pronargs=2 AND has_function_privilege('anon',p.oid,'EXECUTE')) AS no_anon_private_rpc,
  (SELECT count(*)=1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    WHERE n.nspname='closet_rpc_private' AND p.proname='save_checked'
      AND p.pronargs=2 AND has_function_privilege('authenticated',p.oid,'EXECUTE')) AS auth_private_rpc
)
SELECT CASE
 WHEN NOT (
  backup_rls AND owner_policy AND private_bucket AND storage_rls
  AND photo_read AND photo_insert AND auth_select AND NOT anon_select
  AND auth_rpc AND NOT anon_rpc AND public_rpc_invoker
  AND NOT other_storage_update
 ) THEN 'UNKNOWN_OR_UNSAFE'
 WHEN auth_truncate AND auth_delete AND auth_insert AND auth_update
  AND auth_trigger AND auth_references AND auth_maintain
  AND photo_mutable AND NOT private_role AND NOT private_schema
  AND NOT private_function
 THEN 'OVERBROAD_CLIENT_GRANTS'
 WHEN NOT auth_truncate AND NOT auth_delete AND NOT auth_trigger
  AND NOT auth_references AND NOT auth_maintain AND NOT photo_mutable
  AND auth_insert AND auth_update
  AND NOT private_role AND NOT private_schema AND NOT private_function
 THEN 'LIMITED_DIRECT_WRITES'
 WHEN NOT auth_truncate AND NOT auth_delete AND NOT auth_trigger
  AND NOT auth_references AND NOT auth_maintain AND NOT photo_mutable
  AND NOT auth_insert AND NOT auth_update
  AND private_role AND private_schema AND private_function
  AND no_client_writer_member AND no_client_writer_set
  AND no_anon_private_rpc AND auth_private_rpc
 THEN 'RPC_ONLY_EXPECTED_CATALOG'
 ELSE 'UNKNOWN_OR_UNSAFE'
 END AS migration_state,
 FALSE AS hosted_migration_authorized,
 FALSE AS production_release_approved
FROM flags;
