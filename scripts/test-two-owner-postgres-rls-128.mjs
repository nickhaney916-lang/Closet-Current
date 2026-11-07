/**
 * PHOTO128 — independent PostgreSQL 17 owner RLS test, NOT live Supabase.
 * Uses actual unmodified supabase/cloud-backup.sql against ephemeral CI DB.
 * The two auth.uid() subjects are injected as local test session GUCs;
 * they are NOT actual cryptographically verified Supabase Auth JWTs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pkg from 'pg';
const {Client}=pkg;
if(!process.env.P128_POSTGRES_URL)
 throw Error('P128_POSTGRES_URL required for disposable local PostgreSQL, NEVER live project');
const url=new URL(process.env.P128_POSTGRES_URL);
if(!['localhost','127.0.0.1','postgres'].includes(url.hostname))
 throw Error('PHOTO128 refuses non-ephemeral remote Postgres URL');
const pg=new Client({connectionString:process.env.P128_POSTGRES_URL});
await pg.connect();
const ownerA=randomUUID(),ownerB=randomUUID(),srcA='a'.repeat(64),srcB='b'.repeat(64);
const doc=owner=>({schemaVersion:1,ownerId:owner,items:[],state:{}});
const subject=async(id)=>{
 await pg.query('RESET ROLE');
 await pg.query('SET ROLE authenticated');
 const r=await pg.query("select set_config('request.jwt.claim.sub',$1,false) as sub",[id]);
 assert.equal(r.rows[0].sub,id);
 assert.equal((await pg.query('select auth.uid() as sub')).rows[0].sub,id);
};
const privileged=async()=>{await pg.query('RESET ROLE');};
try{
 await pg.query('insert into auth.users(id) values($1),($2)',[ownerA,ownerB]);
 await test('PHOTO128 exact source PostgreSQL 17 owner RLS and photo storage for TWO UUID principals',async t=>{
  await t.test('actual RLS enabled in both backup and storage objects with owner policies',async()=>{
   await privileged();
   const rows=(await pg.query("select n.nspname,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='public' and c.relname='closet_backups') or (n.nspname='storage' and c.relname='objects') order by c.relname")).rows;
   assert.equal(rows.length,2);
   assert.ok(rows.every(r=>r.relrowsecurity===true));
   const func=(await pg.query("select p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_closet_backup'")).rows;
   assert.deepEqual(func,[{prosecdef:false}]);
   const ownerPolicy=(await pg.query("select qual,with_check from pg_policies where schemaname='public' and tablename='closet_backups' and policyname='closet_backup_owner'")).rows[0];
   assert.match(ownerPolicy.qual,/auth.uid/);
   assert.match(ownerPolicy.with_check,/auth.uid/);
  });
  await t.test('owner A and owner B each create their own RPC V1 backup with actual RLS',async()=>{
   await subject(ownerA);
   const a=await pg.query('select public.save_closet_backup(0,$1::jsonb) as revision',[JSON.stringify(doc(ownerA))]);
   assert.equal(Number(a.rows[0].revision),1);
   await subject(ownerB);
   const b=await pg.query('select public.save_closet_backup(0,$1::jsonb) as revision',[JSON.stringify(doc(ownerB))]);
   assert.equal(Number(b.rows[0].revision),1);
  });
  await t.test('owner A cannot query, change, delete or insert B backup row',async()=>{
   await subject(ownerA);
   const b=await pg.query('select owner_id from public.closet_backups where owner_id=$1',[ownerB]);
   assert.equal(b.rowCount,0,'A may not enumerate B backup');
   const edit=await pg.query('update public.closet_backups set revision=revision+1 where owner_id=$1 returning owner_id',[ownerB]);
   assert.equal(edit.rowCount,0);
   const del=await pg.query('delete from public.closet_backups where owner_id=$1 returning owner_id',[ownerB]);
   assert.equal(del.rowCount,0);
   await assert.rejects(pg.query('insert into public.closet_backups(owner_id,revision,document) values($1,99,$2::jsonb)',
    [randomUUID(),JSON.stringify(doc(ownerA))]),e=>e.code==='42501');
   const own=await pg.query('select document from public.closet_backups where owner_id=$1',[ownerA]);
   assert.equal(own.rowCount,1);
   assert.equal(own.rows[0].document.ownerId,ownerA);
  });
  await t.test('actual SECURITY INVOKER RPC uses owner auth.uid and revision compare-and-swap',async()=>{
   await subject(ownerA);
   const stale=await pg.query('select public.save_closet_backup(0,$1::jsonb) as revision',[JSON.stringify(doc(ownerA))]);
   assert.equal(stale.rows[0].revision,null);
   const newer=await pg.query('select public.save_closet_backup(1,$1::jsonb) as revision',[JSON.stringify(doc(ownerA))]);
   assert.equal(Number(newer.rows[0].revision),2);
   const conflict=await pg.query('select public.save_closet_backup(1,$1::jsonb) as revision',[JSON.stringify(doc(ownerA))]);
   assert.equal(conflict.rows[0].revision,null,'stale writer rejected without overwrite');
   await subject(ownerB);
   const independent=await pg.query('select revision from public.closet_backups where owner_id=$1',[ownerB]);
   assert.equal(Number(independent.rows[0].revision),1);
   await subject(ownerA);
   await assert.rejects(pg.query('select public.save_closet_backup(-1,$1::jsonb)',[JSON.stringify(doc(ownerA))]));
  });
  await t.test('owner-private photo path checks forbid cross-owner read, insert, update and delete',async()=>{
   const aPath=ownerA+'/'+srcA+'.jpg',bPath=ownerB+'/'+srcB+'.jpg';
   await subject(ownerA);
   const a=await pg.query("insert into storage.objects(bucket_id,name) values('closet-private',$1) returning name",[aPath]);
   assert.equal(a.rows[0].name,aPath);
   await subject(ownerB);
   const b=await pg.query("insert into storage.objects(bucket_id,name) values('closet-private',$1) returning name",[bPath]);
   assert.equal(b.rows[0].name,bPath);
   const view=await pg.query('select name from storage.objects where name=$1',[aPath]);
   assert.equal(view.rowCount,0);
   const update=await pg.query('update storage.objects set metadata=$1::jsonb where name=$2 returning name',['{}',aPath]);
   assert.equal(update.rowCount,0);
   const del=await pg.query('delete from storage.objects where name=$1 returning name',[aPath]);
   assert.equal(del.rowCount,0);
   await assert.rejects(pg.query("insert into storage.objects(bucket_id,name) values('closet-private',$1)",[ownerA+'/'+srcB+'.jpg']),
    e=>e.code==='42501');
   await subject(ownerA);
   assert.equal((await pg.query('select name from storage.objects where name=$1',[bPath])).rowCount,0);
   assert.equal((await pg.query('select name from storage.objects where name=$1',[aPath])).rowCount,1);
  });
  await t.test('anon cannot read owner backup or private photo storage',async()=>{
   await privileged();await pg.query('SET ROLE anon');
   await pg.query("select set_config('request.jwt.claim.sub','',false)");
   await assert.rejects(pg.query('select owner_id from public.closet_backups'),e=>e.code==='42501');
   await assert.rejects(pg.query('select name from storage.objects'),e=>e.code==='42501');
  });
  await t.test('missing owner claim is rejected at security-invoker RPC',async()=>{
   await privileged();await pg.query('SET ROLE authenticated');
   await pg.query("select set_config('request.jwt.claim.sub','',false)");
   await assert.rejects(pg.query('select public.save_closet_backup(0,$1::jsonb)',[JSON.stringify(doc(ownerA))]),
    e=>e.code==='42501');
  });
 });
 console.log('PHOTO128_EPHEMERAL_REAL_POSTGRES_RLS '+JSON.stringify({
  twoIndependentUUIDOwners:true,postgresEngine:'postgres:17-alpine',
  unmodifiedRepositorySchema:true,backupAndStorageRLS:true,
  crossOwnerReadWriteBlocked:true,casConflictBlocked:true,
  actuallySignedJWT:false,liveSupabaseAccountTransactions:false,
  familyAlpha:'HOLD',productionDeployed:false
 }));
}finally{
 await pg.query('RESET ROLE').catch(()=>{});
 await pg.end();
}
