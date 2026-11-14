/** MAIN1054 M14: execute the actual M3 source-verified native original-photo
 * owner session functions on synthetic fixtures. No live accounts or uploads.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync('public/closet-stylist.js','utf8');
const begin=src.indexOf('function currentPhotoOwnerSession167()');
const finish=src.indexOf('async function mountOriginalPhotoPreview167()',begin);
assert.ok(begin>0&&finish>begin,'M3 native session source boundaries present');
const section=src.slice(begin,finish);
assert.match(section,/authRef:a,privateDbRef:db,operationEpoch:captureOperationEpoch/);
assert.match(section,/now\.authRef===start\.authRef/);
assert.match(section,/now\.privateDbRef===start\.privateDbRef/);
assert.match(section,/now\.operationEpoch===start\.operationEpoch/);
const owner='synthetic-A';
function sourceFixture(){
 const auth={user:{id:owner},assertCurrent(){}};
 const privateDb={name:'closet-current-user-'+owner};
 const rows=[{id:'synthetic-photo',ownerId:owner}];
 let epoch='synthetic-fixed-epoch';
 const env={
  window:{closetAuth:auth},db:privateDb,captureOperationEpoch:7,
  localStorage:{getItem:()=>JSON.stringify({epoch})},
  $:id=>id==='authGate'?{hidden:true}:id==='appShell'?{hidden:false}:null,
  readAll:async()=>structuredClone(rows),
 };
 vm.createContext(env);
 vm.runInContext(section,env);
 return {env,auth,privateDb,rows,setEpoch:value=>{epoch=value;},
  session:()=>vm.runInContext('currentPhotoOwnerSession167()',env),
  read:()=>vm.runInContext('signedOwnerSavedRows167()',env)
 };
}
test('M14 signed native session publishes exact auth/DB/capture references locally',()=>{
 const f=sourceFixture(),s=f.session();
 assert.equal(s.authenticated,true);
 assert.equal(s.ownerId,owner);
 assert.strictEqual(s.authRef,f.auth);
 assert.strictEqual(s.privateDbRef,f.privateDb);
 assert.equal(s.operationEpoch,7);
 assert.equal(s.privateDbName,'closet-current-user-'+owner);
});
test('M14 stable native signed owner permits read-only saved garment read',async()=>{
 const f=sourceFixture();
 const rows=await f.read();
 assert.equal(rows.length,1);
 assert.equal(rows[0].id,'synthetic-photo');
 assert.equal(rows[0].ownerId,owner);
});
test('M14 same-owner relogin with new auth object revokes pending private read',async()=>{
 const f=sourceFixture();
 f.env.readAll=async()=>{
  f.env.window.closetAuth={user:{id:owner},assertCurrent(){}};
  return structuredClone(f.rows);
 };
 await assert.rejects(f.read(),/Owner changed while reading/);
});
test('M14 identical owner and database NAME but replaced connection cannot publish rows',async()=>{
 const f=sourceFixture();
 f.env.readAll=async()=>{
  f.env.db={name:f.privateDb.name};
  return structuredClone(f.rows);
 };
 await assert.rejects(f.read(),/Owner changed while reading/);
});
test('M14 capture generation change after async original read revokes private access',async()=>{
 const f=sourceFixture();
 f.env.readAll=async()=>{
  f.env.captureOperationEpoch++;
  return structuredClone(f.rows);
 };
 await assert.rejects(f.read(),/Owner changed while reading/);
});
test('M14 token rotation or signed owner change prevents stale private return',async()=>{
 const f=sourceFixture();
 f.env.readAll=async()=>{f.setEpoch('replacement-token');return structuredClone(f.rows);};
 await assert.rejects(f.read(),/Owner changed while reading/);
 const g=sourceFixture();
 g.env.readAll=async()=>{g.env.window.closetAuth.user={id:'synthetic-B'};return structuredClone(g.rows);};
 await assert.rejects(g.read(),/Owner changed while reading/);
});
test('M14 original-photo private read unavailable without verified signed UI and token',async()=>{
 const f=sourceFixture();
 f.setEpoch(null);
 await assert.rejects(f.read(),/Private owner session is unavailable/);
 const g=sourceFixture();
 g.env.$=id=>id==='authGate'?{hidden:false}:id==='appShell'?{hidden:true}:null;
 await assert.rejects(g.read(),/Private owner session is unavailable/);
});
test('M14 auth currentness failure is fail-closed without reading saved items',async()=>{
 const f=sourceFixture();
 let reads=0;
 f.env.readAll=async()=>{reads++;return structuredClone(f.rows);};
 f.env.window.closetAuth.assertCurrent=()=>{throw Error('re-authentication required');};
 await assert.rejects(f.read(),/re-authentication required/);
 assert.equal(reads,0);
});
