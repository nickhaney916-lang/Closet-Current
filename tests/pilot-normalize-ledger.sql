\set ON_ERROR_STOP on
create role service_role nologin;
create role anon nologin;
create role authenticated nologin;
\ir ../supabase/migrations/20261017_garment_normalize_pilot_credits.sql
do $$
declare
  a uuid:='11111111-1111-4111-8111-111111111111';
  b uuid:='22222222-2222-4222-8222-222222222222';
  other uuid:='33333333-3333-4333-8333-333333333333';
  u uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  x text:=repeat('a',64);
  y text:=repeat('b',64);
  r jsonb;
begin
  if has_function_privilege('anon','public.reserve_garment_normalize_pilot(uuid,uuid,text,text)','EXECUTE')
   or has_function_privilege('authenticated','public.claim_garment_normalize_pilot(uuid,uuid,text)','EXECUTE')
   or has_function_privilege('anon','public.bind_garment_normalize_pilot(uuid,uuid,text)','EXECUTE')
  then raise exception 'Public request access exposed';end if;
  if not has_function_privilege('service_role','public.reserve_garment_normalize_pilot(uuid,uuid,text,text)','EXECUTE')
  then raise exception 'Service role unavailable';end if;
  r:=public.reserve_garment_normalize_pilot(a,u,x,'Bottoms');
  if r->>'approved'<>'true' or r->>'status'<>'reserved' then raise exception 'First credit failed';end if;
  r:=public.reserve_garment_normalize_pilot(a,u,x,'Bottoms');
  if (select count(*) from public.garment_normalize_pilot_credits)<>1
  then raise exception 'Idempotency charged twice';end if;
  begin
    perform public.reserve_garment_normalize_pilot(a,u,y,'Bottoms');
    raise exception 'Mismatched photo accepted';
  exception when raise_exception then
    if sqlerrm='Mismatched photo accepted' then raise;end if;
  end;
  if not public.claim_garment_normalize_pilot(a,u,x) then raise exception 'First claim failed';end if;
  if public.claim_garment_normalize_pilot(a,u,x) then raise exception 'Second claim must be denied';end if;
  if public.claim_garment_normalize_pilot(a,other,x) then raise exception 'Wrong owner claimed';end if;
  r:=public.reserve_garment_normalize_pilot(a,u,x,'Bottoms');
  if r->>'approved'<>'false' then raise exception 'Claimed credit reused';end if;
  if not public.bind_garment_normalize_pilot(a,u,'provider-job-123456789')
    or public.bind_garment_normalize_pilot(a,u,'provider-job-111111111') then
    raise exception 'Provider binding not single-use';
  end if;
  perform public.reserve_garment_normalize_pilot(b,u,x,'Bottoms');
  begin
    perform public.reserve_garment_normalize_pilot('44444444-4444-4444-8444-444444444444',u,x,'Bottoms');
    raise exception 'Daily cap bypassed';
  exception when raise_exception then
    if sqlerrm='Daily cap bypassed' then raise;end if;
  end;
  if (select count(*) from public.garment_normalize_pilot_credits)<>2
  then raise exception 'Daily cap did not hold';end if;
end $$;
-- Exercise global cap with a new owner each time and a unique reservation ID.
do $$
declare i integer;u uuid;x text:=repeat('c',64);
begin
 for i in 1..98 loop
   u:=(lpad(to_hex(i),8,'0')||'-0000-4000-8000-'||lpad(to_hex(i),12,'0'))::uuid;
   perform public.reserve_garment_normalize_pilot(
     (lpad(to_hex(i+400),8,'0')||'-0000-4000-8000-'||lpad(to_hex(i+400),12,'0'))::uuid,u,x,'Shoes');
 end loop;
 if (select count(*) from public.garment_normalize_pilot_credits)<>100
 then raise exception 'Global cap fixture mismatch';end if;
 begin
  perform public.reserve_garment_normalize_pilot(
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',x,'Shoes');
  raise exception 'Global monthly cap bypassed';
 exception when raise_exception then
  if sqlerrm='Global monthly cap bypassed' then raise;end if;
 end;
end $$;
select 'pilot atomic reservation, double claim, daily/monthly caps and role privileges passed' as outcome;
