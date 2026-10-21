\set ON_ERROR_STOP on
-- Run after the positive safe-recovery test in the SAME disposable PG database.
-- Reinstall the intended private-writer design, then alter the public wrapper.
-- The safe recovery guard MUST refuse this unexpected function definition.
\i supabase/design/backup-rpc-only-writes.DRAFT.sql
CREATE OR REPLACE FUNCTION public.save_closet_backup(
 p_expected_revision bigint,p_document jsonb
) RETURNS bigint
LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $drift$ SELECT NULL::bigint $drift$;
SELECT 'DISPOSABLE_BACKUP_WRAPPER_DRIFT_INJECTED' AS result;
