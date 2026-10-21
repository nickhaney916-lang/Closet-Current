// Real local Supabase Auth + PostgREST + Storage + supabase-js. Runs only with
// isolated CI loopback stack, never production accounts, photos or credentials.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

const base=(process.env.API_URL||'').replace(/\/$/,'');
const db=process.env.DB_URL;
if(process.env.CI!=='true'||
 !/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(base)||
 !process.env.ANON_KEY||!process.env.SERVICE_ROLE_KEY||
 process.env.ANON_KEY===process.env.SERVICE_ROLE_KEY||
 !process.env.LOCAL_SDK_ROOT||!db)
 throw Error('Refusing non-disposable Supabase HTTP security audit');
let dbUrl;
try{dbUrl=new URL(db);}catch{throw Error('Invalid disposable DB URL');}
if(!['localhost','127.0.0.1'].includes(dbUrl.hostname)||
 !['54322','5432'].includes(dbUrl.port))
 throw Error('Refusing any non-local database destination');
const require=createRequire(resolve(process.env.LOCAL_SDK_ROOT,'cc-audit-bootstrap.cjs'));
const {createClient}=require('@supabase/supabase-js');
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(base,process.env.SERVICE_ROLE_KEY,options);
const guest=createClient(base,process.env.ANON_KEY,options);
const users=[];
const image=Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9','hex');
const name=createHash('sha256').update(image).digest('hex')+'.jpg';
function ok(result,label){
 if(result.error){
  // This CI connects to synthetic local users only; redact UUIDs, any
  // identifier resembling an email or token, and truncate the PG message.
  const detail=String(result.error.message||'unknown').replace(
    /[0-9a-f]{8}-[0-9a-f-]{27,}/gi,'[local-uuid]').replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi,'[local-email]').slice(0,170);
  throw Error(label+' failed with Supabase error code '+
    (result.error.code||result.error.status||'unknown')+': '+detail);
 }
 return result.data;
}
async function newOwner(){
 const email='cc-rpc-ci-'+randomUUID()+'@example.invalid';
 const password='synthetic-ci-only-2026-long-password!';
 const created=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'local signup');
 const id=created.user?.id;
 assert.match(id,/^[a-f0-9-]{36}$/i);
 users.push(id);
 const client=createClient(base,process.env.ANON_KEY,options);
 const logged=ok(await client.auth.signInWithPassword({email,password}),'local sign-in');
 assert.equal(logged.user?.id,id);
 return {client,id};
}
const document=tag=>({schemaVersion:1,items:[{id:tag,category:'Tops',color:'Blue'}],state:{}});
const rpc=(user,revision,tag)=>user.client.rpc('save_closet_backup',{
 p_expected_revision:revision,p_document:document(tag)});
async function rejected(result,label){
 assert.ok(result.error,label+' unexpectedly succeeded');
 assert.ok([400,401,403,404,405,406,409,422].includes(Number(result.status||result.error.status)),
  label+' returned unexpected error status '+String(result.status||result.error.status));
}
let stats={actualAuth:false,actualPostgrest:false,actualStorage:false,
 ownerCas:false,staleCASRejected:false,directOwnerInsertDenied:false,
 directOwnerUpdateDenied:false,directOwnerDeleteDenied:false,
 privateRpcNotExposed:false,anonymousRpcDenied:false,ownerIsolation:false,
 photoUpsertDenied:false,foreignPhotoDenied:false,
 otherAccountIntact:false,cleanedSyntheticUsers:false,hostedAccess:false};
try{
 const alice=await newOwner(),bob=await newOwner();stats.actualAuth=true;
 // Same exact name and request body as the production browser client.
 assert.equal(ok(await rpc(alice,0,'first'),'create private A backup'),1);
 assert.equal(ok(await rpc(bob,0,'other'),'create private B backup'),1);
 assert.equal(ok(await rpc(alice,1,'newest'),'update private A backup'),2);
 assert.equal(ok(await rpc(alice,1,'stale'),'stale CAS backup'),null);
 stats.ownerCas=true;stats.staleCASRejected=true;stats.actualPostgrest=true;

 const own=ok(await alice.client.from('closet_backups')
  .select('owner_id,revision,document'),'read owner A row');
 assert.equal(own.length,1);
 assert.equal(own[0].owner_id,alice.id);
 assert.equal(own[0].revision,2);
 assert.equal(own[0].document.items[0].id,'newest');
 const foreign=ok(await bob.client.from('closet_backups')
  .select('owner_id,revision').eq('owner_id',alice.id),'foreign read query');
 assert.deepEqual(foreign,[]);
 // Browsers can see only their own metadata, never bypass write revision
 // even with their own owner_id. Errors come from real Data REST API.
 await rejected(await alice.client.from('closet_backups').insert({
  owner_id:alice.id,revision:999,document:document('bypass-insert')}),
  'direct own-account insert');stats.directOwnerInsertDenied=true;
 await rejected(await alice.client.from('closet_backups').update({
  revision:999,document:document('bypass-update')}).eq('owner_id',alice.id),
  'direct own-account update');stats.directOwnerUpdateDenied=true;
 await rejected(await alice.client.from('closet_backups').delete()
  .eq('owner_id',alice.id),'direct own-account delete');
 stats.directOwnerDeleteDenied=true;
 // A security-definer function in a private schema is not reachable with
 // default REST exposed schema, even though direct SQL can execute safely.
 const direct=await fetch(base+'/rest/v1/rpc/save_checked',{
  method:'POST',headers:{apikey:process.env.ANON_KEY,
   Authorization:'Bearer '+process.env.ANON_KEY,
   'Content-Type':'application/json'},
  body:JSON.stringify({p_expected_revision:0,p_document:document('never')}),
  signal:AbortSignal.timeout(10000)});
 assert.ok([400,401,403,404].includes(direct.status),
  'Private RPC unexpectedly exposed to PostgREST');
 stats.privateRpcNotExposed=true;
 await rejected(await guest.rpc('save_closet_backup',{
  p_expected_revision:0,p_document:document('anonymous')}),'anonymous RPC');
 stats.anonymousRpcDenied=true;

 // New photos remain owner-only. The normal app uploads once and checks
 // existing hash objects, never uses upsert. No customer photo is used.
 const aa=alice.id+'/'+name,bb=bob.id+'/'+name;
 ok(await alice.client.storage.from('closet-private').upload(aa,image,
   {contentType:'image/jpeg'}),'owner A original JPEG upload');
 ok(await bob.client.storage.from('closet-private').upload(bb,image,
   {contentType:'image/jpeg'}),'owner B original JPEG upload');
 const stored=ok(await alice.client.storage.from('closet-private').download(aa),
   'owner A original JPEG download');
 assert.deepEqual(Buffer.from(await stored.arrayBuffer()),image);
 const overwritten=await alice.client.storage.from('closet-private').upload(aa,
  Buffer.from('overwritten synthetic bytes'),{contentType:'image/jpeg',upsert:true});
 await rejected(overwritten,'photo upsert blocked by missing UPDATE owner policy');
 const recovered=ok(await alice.client.storage.from('closet-private').download(aa),
  'private photo after denied overwrite');
 assert.deepEqual(Buffer.from(await recovered.arrayBuffer()),image);
 stats.actualStorage=true;stats.photoUpsertDenied=true;
 await rejected(await bob.client.storage.from('closet-private').download(aa),
  'foreign private photo read');
 stats.foreignPhotoDenied=true;
 // Some Storage APIs return 200 [] for unauthorized delete due to filtered
 // rows; inspect the REAL owner's file after the foreign request.
 const foreignDelete=await bob.client.storage.from('closet-private').remove([aa]);
 assert.ok(foreignDelete.error||
  (Array.isArray(foreignDelete.data)&&foreignDelete.data.length===0),
  'foreign delete did not return expected denial/no-op');
 const stillThere=ok(await alice.client.storage.from('closet-private').download(aa),
  'other-account deletion did not remove A photo');
 assert.deepEqual(Buffer.from(await stillThere.arrayBuffer()),image);
 stats.ownerIsolation=true;

 const reread=ok(await alice.client.from('closet_backups').select('revision,document'),
  'read own saved backup after bypass attempts');
 assert.equal(reread[0].revision,2);
 assert.equal(reread[0].document.items[0].id,'newest');
 const bAgain=ok(await bob.client.from('closet_backups').select('owner_id,revision'),
  'other account backup remains');
 assert.equal(bAgain.length,1);assert.equal(bAgain[0].owner_id,bob.id);
 assert.equal(bAgain[0].revision,1);
 stats.otherAccountIntact=true;
 // Destructive cleanup restricted to synthetic disposable stack.
 for(const [id,path] of [[alice.id,aa],[bob.id,bb]]){
  ok(await admin.storage.from('closet-private').remove([path]),'remove local synthetic file');
  ok(await admin.from('closet_backups').delete().eq('owner_id',id),
    'remove local synthetic backup');
 }
 stats.cleanedSyntheticUsers=true;
 console.log('LOCAL_SUPABASE_BACKUP_RPC_PRIVACY '+JSON.stringify(stats));
}finally{
 for(const id of users){
  const cleanup=await admin.auth.admin.deleteUser(id);
  if(cleanup.error)throw Error('Local synthetic Auth user cleanup failed');
 }
}
