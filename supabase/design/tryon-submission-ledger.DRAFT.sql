-- UNDEPLOYED DESIGN. Apply only to an empty disposable test database.
-- No images/tokens stored. No production migration or paid activation.
create schema if not exists closet_tryon_internal;
revoke all on schema closet_tryon_internal from public, anon, authenticated;
grant usage on schema closet_tryon_internal to service_role;
create table closet_tryon_internal.limits (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 per_owner_24h integer not null default 0 check(per_owner_24h between 0 and 100),
 global_24h integer not null default 0 check(global_24h between 0 and 10000)
);
insert into closet_tryon_internal.limits(singleton) values(true);
create table closet_tryon_internal.jobs (
 owner_id uuid not null, request_id uuid not null,
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 stage integer not null check(stage in(1,2)),
 figure text not null check(figure in('female','male')),
 category text not null check(category in('tops','bottoms','one-pieces')),
 parent_job text,
 state text not null default 'reserved' check(state in('reserved','accepted','unknown')),
 provider_job text unique,
 reserved_at timestamptz not null default clock_timestamp(),
 primary key(owner_id,request_id),
 unique(owner_id,parent_job),
 check((stage=1 and parent_job is null) or (stage=2 and parent_job is not null and category<>'one-pieces')),
 check((state='accepted' and provider_job is not null) or (state<>'accepted' and provider_job is null))
);
create index on closet_tryon_internal.jobs(reserved_at);
create index on closet_tryon_internal.jobs(owner_id,reserved_at);
revoke all on all tables in schema closet_tryon_internal from public,anon,authenticated;
grant select on closet_tryon_internal.limits to service_role;
grant select,insert,update on closet_tryon_internal.jobs to service_role;
alter table closet_tryon_internal.limits enable row level security;
alter table closet_tryon_internal.jobs enable row level security;
create policy tryon_limits_service on closet_tryon_internal.limits to service_role using(true);
create policy tryon_jobs_service on closet_tryon_internal.jobs to service_role using(true) with check(true);

-- All reservations serialize under one transaction lock, so both global and
-- per-owner rolling quotas remain atomic across different server instances.
-- Counts include reserved/unknown/failed attempts: never assume they were free.
create function public.reserve_closet_tryon(p_owner uuid,p_request uuid,p_fingerprint text,
 p_stage integer,p_figure text,p_category text,p_parent text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare existing closet_tryon_internal.jobs; prior closet_tryon_internal.jobs;
 limits closet_tryon_internal.limits;
begin
 if p_owner is null or p_request is null or p_fingerprint is null or
 p_fingerprint !~ '^[a-f0-9]{64}$' or p_stage is null or p_stage not in(1,2) or
 p_figure is null or p_figure not in('female','male') or p_category is null or
 p_category not in('tops','bottoms','one-pieces') or
 (p_stage=1 and p_parent is not null) or
 (p_stage=2 and (p_parent is null or p_category='one-pieces')) then
  return jsonb_build_object('disposition','invalid');
 end if;
 perform pg_catalog.pg_advisory_xact_lock(4606,122019);
 select * into existing from closet_tryon_internal.jobs
  where owner_id=p_owner and request_id=p_request;
 if not found and p_parent is not null then
  select * into existing from closet_tryon_internal.jobs
   where owner_id=p_owner and parent_job=p_parent;
 end if;
 if existing.owner_id is not null then
  if existing.fingerprint<>p_fingerprint or existing.stage<>p_stage or
   existing.figure<>p_figure or existing.category<>p_category or
   existing.parent_job is distinct from p_parent then
   return jsonb_build_object('disposition','conflict');
  end if;
  if existing.state='accepted' then
   return jsonb_build_object('disposition','accepted','providerJobId',existing.provider_job);
  end if;
  return jsonb_build_object('disposition','hold');
 end if;
 if p_stage=2 then
  select * into prior from closet_tryon_internal.jobs
   where owner_id=p_owner and provider_job=p_parent and state='accepted' and stage=1;
  if not found or prior.figure<>p_figure or prior.category not in('tops','bottoms') or
   prior.category=p_category then return jsonb_build_object('disposition','invalid');end if;
 end if;
 select * into limits from closet_tryon_internal.limits where singleton;
 if not found or not limits.enabled or limits.per_owner_24h=0 or limits.global_24h=0 then
  return jsonb_build_object('disposition','disabled');
 end if;
 if (select count(*) from closet_tryon_internal.jobs
  where reserved_at>clock_timestamp()-interval '24 hours')>=limits.global_24h or
 (select count(*) from closet_tryon_internal.jobs where owner_id=p_owner and
  reserved_at>clock_timestamp()-interval '24 hours')>=limits.per_owner_24h then
  return jsonb_build_object('disposition','quota');
 end if;
 insert into closet_tryon_internal.jobs(owner_id,request_id,fingerprint,stage,figure,category,parent_job)
 values(p_owner,p_request,p_fingerprint,p_stage,p_figure,p_category,p_parent);
 return jsonb_build_object('disposition','submit');
end $$;
create function public.finish_closet_tryon(p_owner uuid,p_request uuid,p_provider text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare job closet_tryon_internal.jobs;
begin
 if p_provider is null or p_provider !~ '^[a-zA-Z0-9-]{12,128}$' then raise exception 'Invalid provider job';end if;
 select * into job from closet_tryon_internal.jobs where owner_id=p_owner and request_id=p_request for update;
 if not found or job.state='unknown' or (job.state='accepted' and job.provider_job<>p_provider) then
  raise exception 'Reservation not available';
 end if;
 update closet_tryon_internal.jobs set state='accepted',provider_job=p_provider
  where owner_id=p_owner and request_id=p_request;
 return jsonb_build_object('accepted',true);
end $$;
create function public.hold_closet_tryon(p_owner uuid,p_request uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 update closet_tryon_internal.jobs set state='unknown'
 where owner_id=p_owner and request_id=p_request and state='reserved';
 return jsonb_build_object('held',true);
end $$;
revoke all on function public.reserve_closet_tryon(uuid,uuid,text,integer,text,text,text) from public,anon,authenticated;
revoke all on function public.finish_closet_tryon(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.hold_closet_tryon(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_closet_tryon(uuid,uuid,text,integer,text,text,text) to service_role;
grant execute on function public.finish_closet_tryon(uuid,uuid,text) to service_role;
grant execute on function public.hold_closet_tryon(uuid,uuid) to service_role;
