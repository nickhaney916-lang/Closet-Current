import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountDeletionCoordinator,ACCOUNT_DELETION_CONFIRMATION as phrase}
 from '../supabase/functions/account-delete/deletion-coordinator.mjs';
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const f=n=>String(n).padStart(64,'a').slice(-64)+'.jpg';
const req={bearer:'valid-account-token-for-test',password:'a-long-synthetic-password',confirmation:phrase};
function harness(options={}){
 const calls=[];
 const files=new Map([[A,Array.from({length:options.files??205},(_,i)=>f(i))],
  [B,[f(998)]]]);
 let backup=true,user=true,lock=true;
 const api={
  enabled:options.enabled??true,
  async verifySession(){calls.push('auth');return options.tokenId??A;},
  async verifyPassword(uid){calls.push('password');return options.passwordId??uid;},
  async lockWrites(uid){calls.push('lock');return options.lock===false?false:true;},
  async claimCleanup(uid){calls.push('claim');return options.claim===false?false:true;},
  async listPhotos(uid,limit){calls.push('list');return (files.get(uid)||[]).slice(0,limit);},
  async removePhotos(uid,paths){calls.push('remove');
   if(options.failAtRemove!==undefined&&paths[0]===A+'/'+f(options.failAtRemove))throw Error('injected storage error');
   for(const p of paths){
    assert.ok(p.startsWith(uid+'/'));
    const name=p.slice(uid.length+1);
    const list=files.get(uid)||[];const i=list.indexOf(name);
    if(i<0)throw Error('unexpected removal');
    list.splice(i,1);
   }
  },
  async deleteBackup(){calls.push('deleteBackup');if(options.failBackup)throw Error('injected backup error');backup=false;},
  async hasBackup(){calls.push('verifyBackup');return backup;},
  async deleteUser(){calls.push('deleteAuth');user=false;},
  async verifyUserDeleted(){calls.push('verifyAuth');return !user;}
 };
 return {api,calls,files};
}
test('more than two photo pages are cleaned first; backup then auth; other account unchanged',async()=>{
 const h=harness();
 const result=await createAccountDeletionCoordinator(h.api).deleteAccount(req);
 assert.equal(result.completed,true);
 assert.equal(result.deletedPhotoObjects,205);
 assert.equal(h.files.get(A).length,0);
 assert.deepEqual(h.files.get(B),[f(998)]);
 const firstDel=h.calls.indexOf('remove'),backup=h.calls.indexOf('deleteBackup'),
  auth=h.calls.indexOf('deleteAuth');
 assert.ok(firstDel>=0&&backup>firstDel&&auth>backup);
 assert.ok(h.calls.filter(x=>x==='remove').length>=3);
 assert.ok(h.calls.filter(x=>x==='list').length>=6);
 assert.equal(h.calls[h.calls.length-1],'verifyAuth');
});
test('disabled even with correct password and confirmation: no account reads or deletes',async()=>{
 const h=harness({enabled:false});
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/disabled/);
 assert.deepEqual(h.calls,[]);
});
test('foreign user, wrong password, or missing confirmation never obtains lock',async()=>{
 for(const [opt,payload] of [
  [{passwordId:B},req],
  [{tokenId:'not-uuid'},req],
  [{}, {...req,confirmation:'DELETE'}],
  [{}, {...req,password:''}],
  [{}, {...req,bearer:''}]
 ]){
  const h=harness(opt);
  await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(payload));
  assert.ok(!h.calls.includes('lock'));
  assert.ok(!h.calls.includes('remove'));
 }
});
test('missing durable lock blocks all destructive operations',async()=>{
 const h=harness({lock:false});
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/write lock/);
 assert.ok(!h.calls.includes('remove'));
 assert.ok(!h.calls.includes('deleteAuth'));
});
test('an existing cleanup worker claim blocks all destructive operations',async()=>{
 const h=harness({claim:false,files:2});
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/already claimed/);
 assert.ok(h.calls.includes('lock'));
 assert.ok(h.calls.includes('claim'));
 assert.ok(!h.calls.includes('list'));
 assert.ok(!h.calls.includes('remove'));
 assert.ok(!h.calls.includes('deleteAuth'));
});
test('a missing exclusive cleanup dependency fails closed before authentication',()=>{
 const h=harness({files:2});delete h.api.claimCleanup;
 assert.throws(()=>createAccountDeletionCoordinator(h.api),/Missing server-only/);
 assert.deepEqual(h.calls,[]);
});
test('unexpected object name prevents all deletion and flags manual handling',async()=>{
 const h=harness();h.files.get(A).unshift('not-a-valid-path.jpg');
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/Unexpected file/);
 assert.ok(!h.calls.includes('remove'));
 assert.ok(!h.calls.includes('deleteAuth'));
});
test('storage failure keeps Auth and backup, permitting controlled recovery',async()=>{
 const h=harness({failAtRemove:0,files:3});
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req));
 assert.ok(!h.calls.includes('deleteBackup'));
 assert.ok(!h.calls.includes('deleteAuth'));
});
test('backup failure never removes Auth (partial storage cleanup is explicitly not success)',async()=>{
 const h=harness({failBackup:true,files:2});
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/backup error/);
 assert.equal(h.files.get(A).length,0);
 assert.ok(!h.calls.includes('deleteAuth'));
});
test('zero owned objects still verifies backup then deletes Auth',async()=>{
 const h=harness({files:0});
 const out=await createAccountDeletionCoordinator(h.api).deleteAccount(req);
 assert.equal(out.deletedPhotoObjects,0);assert.equal(out.completed,true);
 assert.equal(h.calls.filter(x=>x==='remove').length,0);
});
test('never trusts caller owner id or caller supplied metadata',async()=>{
 const h=harness();
 const out=await createAccountDeletionCoordinator(h.api).deleteAccount({...req,owner_id:B,user:{id:B}});
 assert.equal(out.completed,true);
 assert.deepEqual(h.files.get(B),[f(998)]);
});


test('a no-op Storage API never allows account or backup deletion',async()=>{
 const h=harness({files:2});
 h.api.removePhotos=async()=>{h.calls.push('remove-noop');};
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/Deleted private photos remain/);
 assert.ok(!h.calls.includes('deleteBackup'));
 assert.ok(!h.calls.includes('deleteAuth'));
 assert.equal(h.files.get(A).length,2);
});
test('a backup that still appears after deletion blocks Auth removal',async()=>{
 const h=harness({files:0});
 h.api.hasBackup=async()=>{h.calls.push('verifyBackup');return true;};
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/Private backup still exists/);
 assert.ok(!h.calls.includes('deleteAuth'));
});
test('a failed final Auth verification cannot be reported as complete deletion',async()=>{
 const h=harness({files:0});
 h.api.verifyUserDeleted=async()=>{h.calls.push('verifyAuth');return false;};
 await assert.rejects(createAccountDeletionCoordinator(h.api).deleteAccount(req),/Auth account deletion unverified/);
 assert.equal(h.calls.filter(x=>x==='deleteAuth').length,1);
});
