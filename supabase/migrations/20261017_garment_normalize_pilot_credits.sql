-- Closet Current AI image-edit PILOT CREDIT LEDGER. REVIEW ONLY.
-- Deliberately NOT applied to the user's live Supabase project.
-- A transaction-scoped advisory lock serializes reservations across users.
-- Service role alone can reserve/claim; authenticated/anon cannot call RPC.
create table if not exists public.garment_normalize_pilot_credits (
  request_id uuid primary key,
  owner_id uuid not null,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  category text not null check (category in ('Tops','Bottoms','Dresses','Outerwear','Shoes')),
  status text not null default 'reserved' check (status in ('reserved','claimed','submitted')),
  credits integer not null default 1 check (credits = 1),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '10 minutes'),
  claimed_at timestamptz,
  provider_job_id text unique,
  submitted_at timestamptz,
  check (expires_at > created_at)
);
create index if not exists garment_normalize_pilot_credits_owner_created
  on public.garment_normalize_pilot_credits(owner_id,created_at desc);
create index if not exists garment_normalize_pilot_credits_created
  on public.garment_normalize_pilot_credits(created_at desc);
alter table public.garment_normalize_pilot_credits enable row level security;
revoke all on public.garment_normalize_pilot_credits from public;
revoke all on public.garment_normalize_pilot_credits from anon, authenticated;
-- Even with no permissive RLS policy, SECURITY DEFINER RPCs below can update.
-- IMPORTANT: these SECURITY DEFINER functions must be owned by migration owner,
-- not exposed as a normal client-accessible SELECT or insert.
create or replace function public.reserve_garment_normalize_pilot(
  p_request_id uuid,p_owner_id uuid,p_source_sha256 text,p_category text
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  existing public.garment_normalize_pilot_credits%rowtype;
  now_at timestamptz := clock_timestamp();
  day_start timestamptz;
  month_start timestamptz;
  daily_count integer;
  monthly_count integer;
begin
  if p_request_id is null or p_owner_id is null or
     p_source_sha256 is null or p_source_sha256 !~ '^[a-f0-9]{64}$' or
     p_category is null or p_category not in ('Tops','Bottoms','Dresses','Outerwear','Shoes') then
    raise exception 'Invalid normalization reservation inputs';
  end if;
  -- Serialize against another reserve, including other users racing the global cap.
  perform pg_catalog.pg_advisory_xact_lock(874310,21);
  select * into existing from public.garment_normalize_pilot_credits where request_id=p_request_id;
  if found then
    if existing.owner_id <> p_owner_id or existing.source_sha256 <> p_source_sha256
       or existing.category <> p_category then
      raise exception 'Normalization request idempotency mismatch';
    end if;
    return pg_catalog.jsonb_build_object('approved',existing.status='reserved' and existing.expires_at>now_at,
      'durableDbReservation',true,'costCredits',1,'maxOutputs',1,
      'requestId',p_request_id::text,'ownerId',p_owner_id::text,
      'sourceSha256',existing.source_sha256,'category',existing.category,
      'status',existing.status);
  end if;
  -- Hard-coded PILOT limits, never client-provided. Credits are never
  -- refunded after an attempted reservation, even on provider failure.
  day_start := date_trunc('day', now_at at time zone 'UTC') at time zone 'UTC';
  month_start := date_trunc('month', now_at at time zone 'UTC') at time zone 'UTC';
  select count(*) into daily_count from public.garment_normalize_pilot_credits
    where owner_id=p_owner_id and created_at >= day_start;
  select count(*) into monthly_count from public.garment_normalize_pilot_credits
    where created_at >= month_start;
  if daily_count>=2 then raise exception 'Pilot daily user limit reached'; end if;
  if monthly_count>=100 then raise exception 'Pilot global monthly credit cap reached'; end if;
  insert into public.garment_normalize_pilot_credits(request_id,owner_id,source_sha256,category,status,created_at,expires_at)
   values(p_request_id,p_owner_id,p_source_sha256,p_category,'reserved',now_at,now_at+interval '10 minutes');
  return pg_catalog.jsonb_build_object('approved',true,'durableDbReservation',true,
    'costCredits',1,'maxOutputs',1,'requestId',p_request_id::text,
    'ownerId',p_owner_id::text,'sourceSha256',p_source_sha256,'category',p_category,'status','reserved');
end;
$$;
create or replace function public.claim_garment_normalize_pilot(
  p_request_id uuid,p_owner_id uuid,p_source_sha256 text
) returns boolean language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  if p_request_id is null or p_owner_id is null or p_source_sha256 is null or
     p_source_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid normalization claim inputs';
  end if;
  -- Single-use state transition BEFORE requesting a paid provider run.
  update public.garment_normalize_pilot_credits
  set status='claimed',claimed_at=clock_timestamp()
  where request_id=p_request_id and owner_id=p_owner_id
    and source_sha256=p_source_sha256
    and status='reserved' and expires_at>clock_timestamp();
  get diagnostics n = row_count;
  return n=1;
end;
$$;
create or replace function public.bind_garment_normalize_pilot(
  p_request_id uuid,p_owner_id uuid,p_provider_job_id text
) returns boolean language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  if p_request_id is null or p_owner_id is null or p_provider_job_id is null
    or p_provider_job_id !~ '^[A-Za-z0-9-]{12,100}$' then
    raise exception 'Invalid provider job identity';
  end if;
  update public.garment_normalize_pilot_credits
  set status='submitted',provider_job_id=p_provider_job_id,submitted_at=clock_timestamp()
  where request_id=p_request_id and owner_id=p_owner_id and status='claimed'
    and provider_job_id is null;
  get diagnostics n = row_count;
  return n=1;
end;
$$;
revoke all on function public.reserve_garment_normalize_pilot(uuid,uuid,text,text) from public;
revoke all on function public.claim_garment_normalize_pilot(uuid,uuid,text) from public;
revoke all on function public.bind_garment_normalize_pilot(uuid,uuid,text) from public;
revoke all on function public.reserve_garment_normalize_pilot(uuid,uuid,text,text) from anon,authenticated;
revoke all on function public.claim_garment_normalize_pilot(uuid,uuid,text) from anon,authenticated;
revoke all on function public.bind_garment_normalize_pilot(uuid,uuid,text) from anon,authenticated;
grant execute on function public.reserve_garment_normalize_pilot(uuid,uuid,text,text) to service_role;
grant execute on function public.claim_garment_normalize_pilot(uuid,uuid,text) to service_role;
grant execute on function public.bind_garment_normalize_pilot(uuid,uuid,text) to service_role;
