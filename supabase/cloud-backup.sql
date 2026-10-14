-- Closet Current only. Photos are private and metadata belongs to auth.uid().
create table public.closet_backups (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check (revision > 0),
 document jsonb not null check (jsonb_typeof(document) = 'object' and octet_length(document::text) <= 5242880),
 updated_at timestamptz not null default now()
);
alter table public.closet_backups enable row level security;
revoke all on public.closet_backups from public, anon;
grant select, insert, update on public.closet_backups to authenticated;
create policy closet_backup_owner on public.closet_backups for all to authenticated
 using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create function public.save_closet_backup(p_expected_revision bigint, p_document jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare saved_revision bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 if p_expected_revision is null or p_expected_revision < 0 or p_document is null or
    p_document->>'schemaVersion' is distinct from '1' or
    jsonb_typeof(p_document->'items') is distinct from 'array' or
    jsonb_typeof(p_document->'state') is distinct from 'object' or
    octet_length(p_document::text) > 5242880 then raise exception 'Invalid backup'; end if;
 if p_expected_revision = 0 then
  insert into public.closet_backups(owner_id,revision,document)
  values(auth.uid(),1,p_document) on conflict(owner_id) do nothing returning revision into saved_revision;
 else
  update public.closet_backups set document=p_document,revision=revision+1,updated_at=now()
  where owner_id=auth.uid() and revision=p_expected_revision returning revision into saved_revision;
 end if;
 return saved_revision;
end $$;
revoke all on function public.save_closet_backup(bigint,jsonb) from public, anon;
grant execute on function public.save_closet_backup(bigint,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('closet-private','closet-private',false,8388608,array['image/jpeg']);
create policy closet_photos_read on storage.objects for select to authenticated
 using (bucket_id='closet-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy closet_photos_insert on storage.objects for insert to authenticated
 with check (bucket_id='closet-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy closet_photos_update on storage.objects for update to authenticated
 using (bucket_id='closet-private' and (storage.foldername(name))[1]=(select auth.uid())::text)
 with check (bucket_id='closet-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy closet_photos_delete on storage.objects for delete to authenticated
 using (bucket_id='closet-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
