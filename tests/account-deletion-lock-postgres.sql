\set ON_ERROR_STOP on
-- Disposable PG service only. DO NOT run against production Supabase.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create schema storage;
create table auth.users (id uuid primary key);
create table public.closet_backups (owner_id uuid primary key, revision bigint, document jsonb);
create table storage.objects (bucket_id text not null,name text not null,primary key(bucket_id,name));
insert into auth.users(id) values
 ('a1111111-1111-4111-8111-111111111111'),
 ('b2222222-2222-4222-8222-222222222222'),
 ('c3333333-3333-4333-8333-333333333333');
\i supabase/design/account-deletion-write-barrier.DRAFT.sql

-- The lock cannot be read or started using anonymous/authenticated grants.
do $$
begin
 if has_schema_privilege('authenticated','closet_internal','USAGE')
    or has_table_privilege('authenticated','closet_internal.deletion_locks','SELECT')
    or has_function_privilege('authenticated',
      'closet_internal.begin_account_deletion(uuid)','EXECUTE')
    or has_function_privilege('anon',
      'closet_internal.begin_account_deletion(uuid)','EXECUTE') then
   raise exception 'Deletion lock leaked to browser role';
 end if;
 if not has_function_privilege('service_role',
   'closet_internal.begin_account_deletion(uuid)','EXECUTE') then
   raise exception 'Server cannot acquire lock';
 end if;
end $$;

-- Both owners may write before lock, including the regular cloud backup.
insert into public.closet_backups(owner_id,revision,document)
values ('a1111111-1111-4111-8111-111111111111',1,'{}'::jsonb),
       ('b2222222-2222-4222-8222-222222222222',1,'{}'::jsonb);
insert into storage.objects(bucket_id,name)
values ('closet-private','a1111111-1111-4111-8111-111111111111/photo-before-lock.jpg'),
       ('closet-private','b2222222-2222-4222-8222-222222222222/photo-before-lock.jpg');
set role service_role;
select closet_internal.begin_account_deletion('a1111111-1111-4111-8111-111111111111'::uuid);
select closet_internal.begin_account_deletion('a1111111-1111-4111-8111-111111111111'::uuid);
reset role;

do $$
declare blocked boolean;
begin
 blocked:=false;
 begin
  insert into storage.objects(bucket_id,name) values
   ('closet-private','a1111111-1111-4111-8111-111111111111/another.jpg');
 exception when sqlstate '42501' then blocked:=true; end;
 if not blocked then raise exception 'Late private upload incorrectly allowed'; end if;

 blocked:=false;
 begin
  update storage.objects set name =
   'a1111111-1111-4111-8111-111111111111/rewritten.jpg'
   where bucket_id='closet-private' and name like 'a1111111%';
 exception when sqlstate '42501' then blocked:=true; end;
 if not blocked then raise exception 'Late private photo update incorrectly allowed'; end if;

 blocked:=false;
 begin
  update public.closet_backups set revision=2
   where owner_id='a1111111-1111-4111-8111-111111111111';
 exception when sqlstate '42501' then blocked:=true; end;
 if not blocked then raise exception 'Late backup update incorrectly allowed'; end if;

 blocked:=false;
 begin
  insert into public.closet_backups(owner_id,revision,document)
   values('a1111111-1111-4111-8111-111111111111',2,'{}'::jsonb)
   on conflict(owner_id) do update set revision=2;
 exception when sqlstate '42501' then blocked:=true; end;
 if not blocked then raise exception 'Backup upsert incorrectly allowed'; end if;

 blocked:=false;
 begin
  update storage.objects set bucket_id='other-bucket'
    where name='a1111111-1111-4111-8111-111111111111/photo-before-lock.jpg';
 exception when sqlstate '42501' then blocked:=true; end;
 if not blocked then raise exception 'Locked photo moved to another bucket'; end if;
end $$;

-- The second owner retains normal write access after first owner's lock.
update public.closet_backups set revision=3
 where owner_id='b2222222-2222-4222-8222-222222222222';
insert into storage.objects(bucket_id,name) values
 ('closet-private','b2222222-2222-4222-8222-222222222222/photo-after-lock.jpg');
-- The owner can still be cleaned up with DELETE after lock.
delete from storage.objects where bucket_id='closet-private'
 and name like 'a1111111-1111-4111-8111-111111111111/%';
delete from public.closet_backups
 where owner_id='a1111111-1111-4111-8111-111111111111';

-- Auth removal DOES NOT remove the lock record (old JWT safety).
delete from auth.users where id='a1111111-1111-4111-8111-111111111111';
do $$
begin
 if not exists (select 1 from closet_internal.deletion_locks
  where owner_id='a1111111-1111-4111-8111-111111111111') then
  raise exception 'Account deletion tombstone vanished when Auth user removed';
 end if;
 if (select count(*) from storage.objects where bucket_id='closet-private'
   and name like 'b2222222-2222-4222-8222-222222222222/%')<>2 then
  raise exception 'Other account storage altered';
 end if;
 if (select revision from public.closet_backups
   where owner_id='b2222222-2222-4222-8222-222222222222')<>3 then
  raise exception 'Other account metadata altered';
 end if;
end $$;

-- No privilege escalation via fake service role: role permissions are tested,
-- and the SQL draft is NOT deployed in any Supabase project.
select 'ACCOUNT_DELETION_DATABASE_GUARD: passed' as result;
