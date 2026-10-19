import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseDeletionAdapters} from '../supabase/functions/account-delete/supabase-adapters.mjs';
import {createAccountDeletionCoordinator,ACCOUNT_DELETION_CONFIRMATION} from '../supabase/functions/account-delete/deletion-coordinator.mjs';
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const jpeg=i=>i.toString(16).padStart(64,'0')+'.jpg';
const request={bearer:'owned-bearer-token-long-enough',password:'owner-password-strong',confirmation:ACCOUNT_DELETION_CONFIRMATION};
function mock(cfg={}){
 const calls=[];
 const photos=new Map([[A,Array.from({length:cfg.count??205},(_,i)=>jpeg(i))],[B,[jpeg(900)]]]);
 let backup=true,deleted=false,locked=false;
 const identity={id:A,email:'owner@example.invalid'};
 const adminClient={
  auth:{
   async getUser(token){calls.push('getUser');return {data:{user:token===request.bearer?identity:null},error:token===request.bearer?null:{status:401}};},
   admin:{
    async getUserById(uid){calls.push('getUserById');return deleted?
     {data:null,error:{status:cfg.postDeleteStatus??404}}:
     {data:{user:uid===A?identity:{id:B,email:'other@example.invalid'}},error:null};},
    async deleteUser(uid){calls.push('deleteUser');assert.equal(uid,A);deleted=true;return {data:{user:identity},error:null};}
   }
  },
  async rpc(name,arg){calls.push('rpc');assert.equal(name,'begin_closet_account_deletion');
   assert.equal(arg.p_owner,A);locked=cfg.lock!==false;
   return {data:locked,error:null};},
  storage:{from(bucket){assert.equal(bucket,'closet-private');return {
   async list(prefix,{limit,offset,sortBy}){calls.push('list');
    assert.equal(prefix,A);assert.equal(offset,0);assert.equal(sortBy.column,'name');
    return {data:photos.get(prefix).slice(0,limit).map(name=>({name})),error:null};},
   async remove(paths){calls.push('remove');
    if(cfg.removeError)return {data:null,error:{message:'Storage unavailable'}};
    if(!cfg.noopRemove)for(const path of paths){
     assert.ok(path.startsWith(A+'/'));const name=path.slice(A.length+1);
     photos.set(A,photos.get(A).filter(x=>x!==name));
    }
    return {data:paths.map(name=>({name})),error:null};
   }
  };}},
  from(table){assert.equal(table,'closet_backups');return {
   delete(){return {eq(col,uid){assert.equal(col,'owner_id');assert.equal(uid,A);
    return Promise.resolve({data:null,error:cfg.deleteBackupError?{message:'no'}:null}).then(v=>{
     calls.push('deleteBackup');if(!v.error)backup=false;return v;
    });}}},
   select(column){assert.equal(column,'owner_id');return {eq(col,uid){
    assert.equal(col,'owner_id');assert.equal(uid,A);return {limit(n){
     assert.equal(n,1);calls.push('hasBackup');return Promise.resolve({data:backup?[{owner_id:A}]:[],error:null});
    }};
   }}};
  }
 };
 const passwordClient={auth:{async signInWithPassword({email,password}){
  calls.push('password');assert.equal(email,identity.email);
  return password===request.password?{
   data:{user:{id:cfg.passwordUser||A},session:{access_token:'fresh-reauth-token'}},error:null
  }:{data:null,error:{message:'Invalid password'}};
 }}};
 return {adapters:createSupabaseDeletionAdapters({adminClient,passwordClient}),calls,photos,adminClient,passwordClient};
}
test('server Supabase adapter safely deletes >2 pages in correct order and preserves other account',async()=>{
 const m=mock();
 const res=await createAccountDeletionCoordinator({enabled:true,...m.adapters}).deleteAccount(request);
 assert.equal(res.completed,true);
 assert.equal(res.deletedPhotoObjects,205);
 assert.equal(m.photos.get(A).length,0);
 assert.deepEqual(m.photos.get(B),[jpeg(900)]);
 assert.deepEqual(m.calls.slice(0,4),['getUser','getUserById','password','rpc']);
 assert.ok(m.calls.lastIndexOf('remove')<m.calls.lastIndexOf('deleteBackup'));
 assert.ok(m.calls.lastIndexOf('deleteBackup')<m.calls.lastIndexOf('deleteUser'));
});
test('wrong password and a mismatched authentication account never reach deletion lock',async()=>{
 for(const cfg of [{passwordUser:B},{}]){
  const m=mock(cfg);
  await assert.rejects(createAccountDeletionCoordinator({enabled:true,...m.adapters})
   .deleteAccount({...request,password:cfg.passwordUser?request.password:'invalid-password'}));
  assert.ok(!m.calls.includes('rpc'));
  assert.ok(!m.calls.includes('remove'));
 }
});
test('missing real server lock denies destructive operations',async()=>{
 const m=mock({lock:false});
 await assert.rejects(createAccountDeletionCoordinator({enabled:true,...m.adapters}).deleteAccount(request),
  /write lock unavailable/);
 assert.ok(!m.calls.includes('list'));
});
test('Storage error and fake success cannot reach Auth deletion',async()=>{
 for(const cfg of [{removeError:true},{noopRemove:true}]){
  const m=mock({...cfg,count:1});
  await assert.rejects(createAccountDeletionCoordinator({enabled:true,...m.adapters}).deleteAccount(request));
  assert.ok(!m.calls.includes('deleteBackup'));
  assert.ok(!m.calls.includes('deleteUser'));
 }
});
test('private photo paths reject foreign owner and nested objects',async()=>{
 const m=mock({count:1});
 await assert.rejects(m.adapters.removePhotos(A,[B+'/'+jpeg(900)]));
 await assert.rejects(m.adapters.removePhotos(A,[A+'/folder/'+jpeg(1)]));
 await assert.rejects(m.adapters.removePhotos(A,[]));
 m.photos.get(A).unshift('unexpected-folder');
 await assert.rejects(m.adapters.listPhotos(A,100),/Unrecognized/);
});
test('post-delete 500 response is NOT proof that Auth deletion completed',async()=>{
 const m=mock({count:0,postDeleteStatus:500});
 await assert.rejects(createAccountDeletionCoordinator({enabled:true,...m.adapters}).deleteAccount(request),
  /Could not verify Auth deletion/);
});
test('the disabled coordinator never even checks Auth or calls Supabase',async()=>{
 const m=mock();
 await assert.rejects(createAccountDeletionCoordinator({enabled:false,...m.adapters}).deleteAccount(request),
  /disabled/);
 assert.deepEqual(m.calls,[]);
});
test('rejects missing or shared privileged clients',()=>{
 const m=mock();
 assert.throws(()=>createSupabaseDeletionAdapters({adminClient:m.adminClient,passwordClient:m.adminClient}));
 assert.throws(()=>createSupabaseDeletionAdapters({adminClient:m.adminClient}));
});
