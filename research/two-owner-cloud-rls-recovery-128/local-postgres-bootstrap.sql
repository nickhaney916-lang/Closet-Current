-- PHOTO128 / LOCAL EPHEMERAL TEST DATABASE ONLY.
-- Invoke through the GitHub Actions disposable postgres:17-alpine service.
-- NEVER run against the live Closet Current or existing staging Supabase.
-- The actual owner RLS policies + save_closet_backup SECURITY INVOKER RPC
-- are sourced unmodified from the repository's supabase/cloud-backup.sql.
\set ON_ERROR_STOP on

create role authenticated nologin;
create role anon nologin;
create schema auth;
create schema storage;
grant usage on schema auth,storage,public to authenticated,anon;

create table auth.users(id uuid primary key);
create or replace function auth.uid()
returns uuid language sql stable security invoker
as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant execute on function auth.uid() to authenticated,anon;

create table storage.buckets(
 id text primary key,name text,public boolean not null,
 file_size_limit bigint,allowed_mime_types text[]
);
create table storage.objects(
 id bigserial primary key,
 bucket_id text not null references storage.buckets(id),
 name text not null unique,
 metadata jsonb not null default '{}'::jsonb
);
create or replace function storage.foldername(name text)
returns text[] language sql stable security invoker
as $$select string_to_array(name,'/')$$;
grant execute on function storage.foldername(text) to authenticated,anon;

\i supabase/cloud-backup.sql

-- Supabase Storage enables RLS on its objects table by default; local stub must match.
alter table storage.objects enable row level security;
revoke all on storage.objects from public,anon;
grant select,insert,update,delete on storage.objects to authenticated;
grant usage,select on sequence storage.objects_id_seq to authenticated;

-- Real server PostgreSQL RLS uses role=authenticated + injected local
-- request.jwt.claim.sub. That GUC is NOT cryptographically signed; the
-- test must never claim Supabase Auth validated a live JWT or live RLS E2E.
