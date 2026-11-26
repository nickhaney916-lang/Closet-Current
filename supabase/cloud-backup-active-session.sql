-- Draft follow-up to cloud-backup.sql. Verify on a disposable Supabase stack.
begin;

-- Keep this schema outside the exposed PostgREST schemas.
create schema closet_authz;
revoke all on schema closet_authz from public, anon, authenticated;
grant usage on schema closet_authz to authenticated;

-- Expose a boolean about the current caller's session only.
create function closet_authz.active_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions as session
    where session.id = case
      when claims.session_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then claims.session_id::uuid
    end
      and session.user_id = auth.uid()
      and (session.not_after is null or session.not_after > statement_timestamp())
  )
  from (select auth.jwt()->>'session_id' as session_id) as claims
$$;
revoke all on function closet_authz.active_session() from public, anon, authenticated;
grant execute on function closet_authz.active_session() to authenticated;

-- Restrictive policies compose with the existing permissive owner policies.
-- Uncorrelated subqueries allow Postgres to evaluate the session check once
-- per policy expression, rather than once per row in a photo listing.
create policy closet_backup_active_session on public.closet_backups
  as restrictive for all to authenticated
  using ((select closet_authz.active_session()))
  with check ((select closet_authz.active_session()));

create policy closet_photos_active_session on storage.objects
  as restrictive for all to authenticated
  using (bucket_id <> 'closet-private' or (select closet_authz.active_session()))
  with check (bucket_id <> 'closet-private' or (select closet_authz.active_session()));

commit;
