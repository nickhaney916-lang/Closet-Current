// Real supabase-js SDK against isolated LOCAL Auth/PostgREST/Storage only.
// This is a CI integration test, never an account-delete endpoint or a caller
// for a hosted project. No user data or configured Supabase account is read.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createAccountDeletionCoordinator,ACCOUNT_DELETION_CONFIRMATION}
 from '../supabase/functions/account-delete/deletion-coordinator.mjs';
import {createSupabaseDeletionAdapters}
 from '../supabase/functions/account-delete/supabase-adapters.mjs';

const base=process.env.API_URL;
if(process.env.CI!=='true'||!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(base||'')||
 !process.env.ANON_KEY||!process.env.SERVICE_ROLE_KEY||
 !process.env.LOCAL_SDK_ROOT)
 throw Error('Local Supabase SDK integration requires a loopback CI stack');
const require=createRequire(resolve(process.env.LOCAL_SDK_ROOT,'cc-bootstrap.cjs'));
const {createClient}=require('@supabase/supabase-js');
const config={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(base,process.env.SERVICE_ROLE_KEY,config);
const passwordClient=createClient(base,process.env.ANON_KEY,config);
if(admin===passwordClient)throw Error('Privileged and password clients must be separate');
const adapters=createSupabaseDeletionAdapters({adminClient:admin,passwordClient});
const name=createHash('sha256').update('synthetic-photo-for-sdk-test').digest('hex')+'.jpg';
const photo=Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9','hex');
const users=[];
function data(response,step){
 if(response.error)throw Error(step+' failed: '+String(response.error?.message||'unknown').slice(0,230));
 return response.data;
}
async function makeOwner(){
 const password='Synthetic-Local-Account-Test-2026!';
 const email='closet-local-'+randomUUID()+'@example.invalid';
 const created=data(await admin.auth.admin.createUser({email,password,email_confirm:true}),
  'create local disposable user');
 const id=created.user?.id;
 assert.match(id,/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i);
 users.push(id);
 const client=createClient(base,process.env.ANON_KEY,config);
 const login=data(await client.auth.signInWithPassword({email,password}),'local user login');
 assert.equal(login.user.id,id);
 assert.equal(typeof login.session.access_token,'string');
 return {id,password,token:login.session.access_token,client};
}
try{
 const alice=await makeOwner(),bob=await makeOwner();
 const alicePath=alice.id+'/'+name,bobPath=bob.id+'/'+name;
 data(await alice.client.storage.from('closet-private').upload(alicePath,photo,
  {contentType:'image/jpeg'}),'upload user A private photo');
 data(await bob.client.storage.from('closet-private').upload(bobPath,photo,
  {contentType:'image/jpeg'}),'upload user B private photo');
 data(await alice.client.rpc('save_closet_backup',
  {p_expected_revision:0,p_document:{schemaVersion:1,items:[],state:{}}}),
  'save owner A backup');
 data(await bob.client.rpc('save_closet_backup',
  {p_expected_revision:0,p_document:{schemaVersion:1,items:[],state:{}}}),
  'save owner B backup');
 // This MUST be disabled by default and never remove data from the
 // verified temporary local database before explicitly opted-in test run.
 await assert.rejects(createAccountDeletionCoordinator(adapters).deleteAccount({
  bearer:alice.token,password:alice.password,confirmation:ACCOUNT_DELETION_CONFIRMATION
 }),/disabled/);
 // A different password must never acquire a deletion tombstone.
 await assert.rejects(createAccountDeletionCoordinator({enabled:true,...adapters})
  .deleteAccount({bearer:alice.token,password:'a-wrong-password',
   confirmation:ACCOUNT_DELETION_CONFIRMATION}));
 assert.equal(data(await admin.storage.from('closet-private').list(alice.id,
  {limit:100}),'list owner A photos').length,1);
 const outcome=await createAccountDeletionCoordinator({enabled:true,...adapters})
  .deleteAccount({bearer:alice.token,password:alice.password,
   confirmation:ACCOUNT_DELETION_CONFIRMATION});
 assert.equal(outcome.completed,true);
 assert.equal(outcome.deletedPhotoObjects,1);
 assert.equal(outcome.backupRemoved,true);
 assert.equal(outcome.authUserRemoved,true);
 // Once one server-only worker has claimed this owner, a second worker
 // cannot accidentally begin a duplicate destructive cleanup.
 const secondClaim=data(await admin.rpc('claim_closet_account_cleanup',{
  p_owner:alice.id
 }),'verify duplicate claim rejected');
 assert.equal(secondClaim,false,'Duplicate deletion worker must remain excluded');
 assert.equal(data(await admin.storage.from('closet-private').list(alice.id,{limit:100}),
  'list after successful account deletion').length,0);
 const rows=data(await admin.from('closet_backups').select('owner_id').eq('owner_id',alice.id),
  'confirm owner A backup removed');
 assert.deepEqual(rows,[]);
 const bobFiles=data(await admin.storage.from('closet-private').list(bob.id,{limit:100}),
  'confirm owner B intact');
 assert.ok(bobFiles.some(x=>x.name===name));
 const bobBackup=data(await admin.from('closet_backups').select('owner_id').eq('owner_id',bob.id),
  'confirm owner B backup intact');
 assert.equal(bobBackup.length,1);
 // Old JWT must not recreate a deleted owner's closet or photo.
 const latePhoto=await alice.client.storage.from('closet-private').upload(alicePath,photo,
  {contentType:'image/jpeg'});
 assert.ok(latePhoto.error,'A stale owner token unexpectedly uploaded after deletion');
 console.log('LOCAL_SUPABASE_SDK_ACCOUNT_DELETE '+JSON.stringify({
  actualSdkAuth:true,actualSdkStorage:true,
  secureFreshPassword:true,privatePhotoRemoved:true,backupRemoved:true,
  authUserRemoved:true,otherOwnerIntact:true,staleTokenBlocked:true,duplicateWorkerExcluded:true,
  clientSideDeletionAvailable:false,hostedSupabaseAccess:false
 }));
}finally{
 for(const id of users){
  await admin.auth.admin.deleteUser(id).catch(()=>{});
 }
}
