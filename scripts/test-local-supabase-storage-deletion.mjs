// Tests the actual LOCAL Supabase Auth + Storage HTTP APIs with disposable
// users and bytes. Never accepts a hosted API URL or production token.
// Run only inside isolated GitHub Actions/local Docker Supabase, never deploy.
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const base=process.env.API_URL;
const anon=process.env.ANON_KEY,admin=process.env.SERVICE_ROLE_KEY;
if(!base||!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(base)||
 !anon||!admin||anon===admin||process.env.CI!=='true')
 throw Error('Requires isolated loopback-only Supabase CLI stack in CI');
const url=base.replace(/\/$/,'');
const image=Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9','hex');
const name=createHash('sha256').update(image).digest('hex')+'.jpg';
const info={realSupabaseStorageHttp:false,realSupabaseAuthHttp:false,
 userScopedStorage:false,lockStopsUploads:false,lockStopsBackupRpc:false,
 otherOwnerPreserved:false,privatePhotoRemoved:false,
 postAuthTombstonePreserved:false,localOnly:true};
const users=[];
async function api(path,{method='GET',key=admin,body,contentType='application/json'}={}){
 const res=await fetch(url+path,{method,headers:{
  apikey:key,Authorization:'Bearer '+key,
  ... (body!==undefined?{'Content-Type':contentType}:{})
 },body:body===undefined?undefined:contentType==='application/json'?JSON.stringify(body):body,
 signal:AbortSignal.timeout(20000)});
 const text=await res.text(),json=(()=>{try{return JSON.parse(text)}catch{return text}})();
 return {status:res.status,body:json};
}
function must(response,step,accepted=[200,201,204]){
 if(!accepted.includes(response.status))
  throw Error(step+' rejected HTTP '+response.status+': '+JSON.stringify(response.body).slice(0,400));
 return response.body;
}
async function user(){
 const id=randomUUID(),email='cc-disposable-'+id+'@example.invalid';
 const password='Synthetic-Local-Only-Password-2026!';
 const created=must(await api('/auth/v1/admin/users',{method:'POST',
  body:{id,email,password,email_confirm:true}}),'create disposable user');
 const actual=created?.id||created?.user?.id;
 assert.match(actual,/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i,'missing disposable Auth user ID');
 users.push(actual);
 const signed=must(await api('/auth/v1/token?grant_type=password',{
  method:'POST',key:anon,body:{email,password}}),'sign in disposable user');
 assert.equal(signed?.user?.id,actual);
 assert.ok(signed.access_token);
 return {id:actual,access:signed.access_token};
}
const photoPath=u=>u.id+'/'+name;
const photoUrl=u=>'/storage/v1/object/closet-private/'+photoPath(u);
async function upload(u,{overwrite=false}={}){
 const response=await api(photoUrl(u),{method:overwrite?'PUT':'POST',key:u.access,
  body:image,contentType:'image/jpeg'});
 return response;
}
async function list(u){
 const rows=must(await api('/storage/v1/object/list/closet-private',{
  method:'POST',body:{prefix:u.id,limit:100,offset:0}}),'list actual private Storage');
 assert.ok(Array.isArray(rows));return rows;
}
async function backup(u){
 return api('/rest/v1/rpc/save_closet_backup',{method:'POST',key:u.access,
  body:{p_expected_revision:0,p_document:{schemaVersion:1,items:[],state:{}}}});
}
const acceptableReject=(x,step)=>{
 assert.ok(x.status>=400&&x.status<500,step+' must be denied; got '+x.status+
  ': '+JSON.stringify(x.body).slice(0,240));
};
try{
 const alice=await user(),bob=await user();
 info.realSupabaseAuthHttp=true;
 const before=await upload(alice);must(before,'upload owner A');
 must(await upload(bob),'upload owner B');
 assert.ok((await list(alice)).some(x=>x.name===name));
 info.realSupabaseStorageHttp=true;
 const otherRead=await api(photoUrl(alice),{key:bob.access});
 acceptableReject(otherRead,'foreign private photo read');
 const otherDelete=await api('/storage/v1/object/closet-private',{
  key:bob.access,method:'DELETE',body:{prefixes:[photoPath(alice)]}});
 if(otherDelete.status!==200)acceptableReject(otherDelete,'foreign private photo delete');
 else assert.deepEqual(otherDelete.body,[]);
 assert.ok((await list(alice)).some(object=>object.name===name),'owner photo missing');
 info.userScopedStorage=true;

 must(await backup(alice),'owner A backup', [200,201,204]);
 must(await backup(bob),'owner B backup', [200,201,204]);
 const forbidden=await api('/rest/v1/rpc/begin_closet_account_deletion',{
  method:'POST',key:alice.access,body:{p_owner:alice.id}});
 acceptableReject(forbidden,'signed-in browser tries service-only delete lock');

 const lock=await api('/rest/v1/rpc/begin_closet_account_deletion',{
  method:'POST',body:{p_owner:alice.id}});
 assert.equal(must(lock,'server-only deletion lock'),true);
 const tooLate=await upload(alice);
 acceptableReject(tooLate,'upload after deletion lock');
 const overwrite=await upload(alice,{overwrite:true});
 acceptableReject(overwrite,'overwrite after deletion lock');
 info.lockStopsUploads=true;
 const lateBackup=await api('/rest/v1/rpc/save_closet_backup',{method:'POST',key:alice.access,
  body:{p_expected_revision:1,p_document:{schemaVersion:1,items:[],state:{}}}});
 acceptableReject(lateBackup,'backup after lock');
 info.lockStopsBackupRpc=true;

 // Owner B must still write while A is locked.
 must(await api('/rest/v1/rpc/save_closet_backup',{method:'POST',key:bob.access,
  body:{p_expected_revision:1,p_document:{schemaVersion:1,items:[],state:{}}}}),
 'unrelated backup after deletion lock',[200,201,204]);
 must(await api('/storage/v1/object/closet-private/'+bob.id+'/'+
  createHash('sha256').update(Buffer.from('different-test-image')).digest('hex')+'.jpg',{
  method:'POST',key:bob.access,body:Buffer.from('different-test-image'),
  contentType:'image/jpeg'}),'unrelated upload after deletion lock');
 info.otherOwnerPreserved=true;

 // Delete through the ACTUAL Supabase Storage REST service, not SQL rows.
 must(await api('/storage/v1/object/closet-private',{
  method:'DELETE',body:{prefixes:[photoPath(alice)]}}),'Storage API remove locked photo');
 assert.equal((await list(alice)).length,0,'private object remains after Storage removal');
 assert.equal((await list(alice)).length,0,'private object reappeared after independent read');
 info.privatePhotoRemoved=true;
 must(await api('/rest/v1/closet_backups?owner_id=eq.'+alice.id,{
  method:'DELETE'}),'delete private backup',[200,204]);
 const rows=must(await api('/rest/v1/closet_backups?owner_id=eq.'+alice.id+
  '&select=owner_id'),'verify backup gone');assert.deepEqual(rows,[]);
 must(await api('/auth/v1/admin/users/'+alice.id,{method:'DELETE'}),
  'delete disposable Auth identity',[200,204]);
 // Tombstone stays in DB even once auth.users row is gone. Signed-in JWT
 // remains scoped to the now-blocked owner until expiration.
 const lateUser=await upload(alice);
 acceptableReject(lateUser,'pre-deletion token reused after Auth removal');
 const lockAgain=await api('/rest/v1/rpc/begin_closet_account_deletion',{
  method:'POST',body:{p_owner:alice.id}});
 assert.equal(must(lockAgain,'durable post-Auth tombstone'),true);
 info.postAuthTombstonePreserved=true;
 assert.ok((await list(bob)).some(x=>x.name===name),'other account photo disappeared');
 console.log('LOCAL_SUPABASE_STORAGE_ACCOUNT_DELETION '+JSON.stringify(info));
}finally{
 // All created identities are ephemeral inside the CI-local Auth service.
 // Cleanup never touches a hosted project.
 for(const id of users){
  await api('/auth/v1/admin/users/'+id,{method:'DELETE'}).catch(()=>{});
 }
}
