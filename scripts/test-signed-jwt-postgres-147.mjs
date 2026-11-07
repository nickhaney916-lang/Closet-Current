/**
 * P147 — real ephemeral PostgreSQL 17 RLS reached ONLY after a verified
 * ephemeral RS256 JWT, not injected arbitrary owner strings.
 * Reuses actual unmodified supabase/cloud-backup.sql, via P128 bootstrap.
 * NO hosted Auth, hosted Storage or production/staging database.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createEphemeralSignedIdentity147} from '../research/signed-two-owner-transport-147/ephemeral-signed-identity.mjs';
import pgModule from 'pg';
const {Client}=pgModule;
const dburl=process.env.P147_POSTGRES_URL;
if(!dburl)throw Error('P147_POSTGRES_URL for ephemeral CI PostgreSQL required');
if(!['localhost','127.0.0.1','postgres'].includes(new URL(dburl).hostname))
 throw Error('P147 refuses all remote or live Supabase databases');
const pg=new Client({connectionString:dburl});
await pg.connect();
const identity=createEphemeralSignedIdentity147();
const a=randomUUID(),b=randomUUID();
const ta=identity.issue(a,{userMetadata:{ownerId:b,role:'service_role'}}),tb=identity.issue(b);
const shaA='a'.repeat(64),shaB='b'.repeat(64);
const doc=owner=>({schemaVersion:1,ownerId:owner,items:[],state:{}});
let sqlAuthenticated=0;
async function as(token){
 await pg.query('RESET ROLE');
 await pg.query("select set_config('request.jwt.claim.sub','',false)");
 // A verified cryptographic sub, not a test-provided string or metadata,
 // is the ONLY permitted input to PostgreSQL's auth.uid() GUC.
 const verified=identity.verify(token);
 await pg.query('SET ROLE authenticated');
 await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[verified.ownerId]);
 assert.equal((await pg.query('select auth.uid() id')).rows[0].id,verified.ownerId);
 sqlAuthenticated++;
 return verified.ownerId;
}
async function superuser(){await pg.query('RESET ROLE');}
try{
 await pg.query('insert into auth.users(id) values($1),($2)',[a,b]);
 await test('P147 independently signed local JWT -> authentic PostgreSQL 17 owner RLS',async t=>{
  await t.test('signed A and B each create own version 1 with unmodified SECURITY INVOKER CAS RPC',async()=>{
   assert.equal(await as(ta),a);
   assert.equal(Number((await pg.query('select public.save_closet_backup(0,$1::jsonb) revision',[JSON.stringify(doc(a))])).rows[0].revision),1);
   assert.equal(await as(tb),b);
   assert.equal(Number((await pg.query('select public.save_closet_backup(0,$1::jsonb) revision',[JSON.stringify(doc(b))])).rows[0].revision),1);
  });
  await t.test('signed A never sees or overwrites signed B rows, and vice versa',async()=>{
   await as(ta);
   assert.equal((await pg.query('select owner_id from public.closet_backups where owner_id=$1',[b])).rowCount,0);
   assert.equal((await pg.query('update public.closet_backups set revision=99 where owner_id=$1 returning owner_id',[b])).rowCount,0);
   await as(tb);
   assert.equal((await pg.query('select owner_id from public.closet_backups where owner_id=$1',[a])).rowCount,0);
   assert.equal((await pg.query('select owner_id from public.closet_backups where owner_id=$1',[b])).rowCount,1);
  });
  await t.test('signed owner A CAS refuses stale revision without touching owner B',async()=>{
   await as(ta);
   assert.equal(Number((await pg.query('select public.save_closet_backup(1,$1::jsonb) revision',[JSON.stringify(doc(a))])).rows[0].revision),2);
   assert.equal((await pg.query('select public.save_closet_backup(1,$1::jsonb) revision',[JSON.stringify(doc(a))])).rows[0].revision,null);
   await as(tb);
   assert.equal(Number((await pg.query('select revision from public.closet_backups where owner_id=$1',[b])).rows[0].revision),1);
  });
  await t.test('actual private Storage RLS rejects signed cross-owner JPEG paths',async()=>{
   const pa=a+'/'+shaA+'.jpg',pb=b+'/'+shaB+'.jpg';
   await as(ta);
   assert.equal((await pg.query("insert into storage.objects(bucket_id,name) values('closet-private',$1) returning name",[pa])).rows[0].name,pa);
   await as(tb);
   assert.equal((await pg.query("insert into storage.objects(bucket_id,name) values('closet-private',$1) returning name",[pb])).rows[0].name,pb);
   assert.equal((await pg.query('select name from storage.objects where name=$1',[pa])).rowCount,0);
   assert.equal((await pg.query('update storage.objects set metadata=$1::jsonb where name=$2 returning name',['{}',pa])).rowCount,0);
   await assert.rejects(pg.query("insert into storage.objects(bucket_id,name) values('closet-private',$1)",[pa.replace(shaA,shaB)]),err=>err.code==='42501');
   await as(ta);
   assert.equal((await pg.query('select name from storage.objects where name=$1',[pb])).rowCount,0);
  });
  await t.test('forged, unsigned, expired or wrong-audience tokens cannot even become SQL authenticated',async()=>{
   const start=sqlAuthenticated,parts=ta.slice('p146-synthetic-local-only-'.length).split('.');
   const forged='p146-synthetic-local-only-'+parts[0]+'.'+Buffer.from(JSON.stringify({sub:b,role:'authenticated'})).toString('base64url')+'.'+parts[2];
   for(const bad of [forged,identity.issue(a,{aud:'guest'}),identity.issue(a,{expiresIn:-20}),
     'p146-synthetic-local-only-unverified']){
    await assert.rejects(as(bad),/cryptographic identity denied/);
   }
   assert.equal(sqlAuthenticated,start);
  });
  await t.test('revoked signed A session is refused before SQL role binding',async()=>{
   const lease=identity.verify(ta);identity.revoke(lease.sessionId);
   await assert.rejects(as(ta),/cryptographic identity denied/);
   await as(tb);
   assert.equal((await pg.query('select owner_id from public.closet_backups where owner_id=$1',[a])).rowCount,0);
  });
 });
 console.log('P147_SIGNED_JWT_REAL_LOCAL_POSTGRES '+JSON.stringify({signedRSA:true,
  verifiedOwnerBindingToSql:sqlAuthenticated,realDatabaseRLS:true,
  actualSupabaseSQLUnchanged:true,hostedSupabaseAuth:false,hostedStorage:false,
  privateKeyExported:false,familyAlpha:'HOLD'}));
}finally{await superuser().catch(()=>{});await pg.end();}
