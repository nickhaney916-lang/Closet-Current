-- Read-only catalog checks on the disposable application schema.
do $$
declare
  predicate regprocedure := 'closet_authz.active_session()'::regprocedure;
begin
  if not exists (
    select from pg_proc
    where oid = predicate and prosecdef and provolatile = 's'
      and proconfig = array['search_path=""']
  ) or has_function_privilege('anon', predicate, 'execute')
    or not has_function_privilege('authenticated', predicate, 'execute')
    or has_table_privilege('authenticated', 'auth.sessions', 'select')
    or has_schema_privilege('anon', 'closet_authz', 'usage')
  then
    raise exception 'Session predicate privilege contract failed';
  end if;

  if (select count(*) from pg_policy
      where not polpermissive and polcmd = '*'
        and polqual is not null and polwithcheck is not null
        and ((polrelid = 'public.closet_backups'::regclass and polname = 'closet_backup_active_session')
          or (polrelid = 'storage.objects'::regclass and polname = 'closet_photos_active_session'))) <> 2
  then
    raise exception 'Private data policy contract failed';
  end if;

  if (select prosecdef from pg_proc where oid = 'public.save_closet_backup(bigint,jsonb)'::regprocedure)
    or (select public from storage.buckets where id = 'closet-private')
  then
    raise exception 'Backup invoker or photo bucket contract failed';
  end if;
end
$$;

-- The session probe's lookup uses the primary key with a single UUID.
explain (costs off)
select 1 from auth.sessions
where id = '00000000-0000-0000-0000-000000000001'::uuid;
