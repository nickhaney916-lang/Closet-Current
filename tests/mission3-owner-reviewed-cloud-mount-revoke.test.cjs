'use strict';
// Executes the actual P146 reviewed cloud bridge admission from the app.
// Synthetic Auth objects and deferred mounted panels: no hosted cloud calls.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/cloud-backup-bridge.js','utf8');
const module=fs.readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
const start=source.indexOf('   const bridge=await mountOwnerReviewedCloud146({');
const end=source.indexOf('   return;',start);
assert.ok(start>=0&&end>start);
const real=source.slice(start,end);
const program='async function attemptMount(){\n'+real+'\nreturn true;\n}';
function deferred(){let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});promise.catch(()=>{});return {promise,resolve,reject};}
function fixture(){
 let changed=false,revoked=false,throwOnRevoke=false;
 const firstAuth={user:{id:'owner-a'},assertCurrent(){}};
 const firstDB={name:'closet-current-user-owner-a'};
 const pending=deferred(),started=deferred(),calls=[];
 const panel={
  revoke(){calls.push('revoke');revoked=true;if(throwOnRevoke)throw Error('PRIVATE old original JPEG')},
  state(){return {mounted:!revoked}}
 };
 const ctx={
  window:{closetAuth:firstAuth,ownerReviewedCloud146:null},
  initialAuth:firstAuth,ownerDB:firstDB,db:firstDB,
  captureOperationEpoch:1,
  assertLease(){
   if(changed||ctx.window.closetAuth!==firstAuth||ctx.db!==firstDB||
      ctx.captureOperationEpoch!==1||firstAuth.user.id!=='owner-a')
    throw Error('STALE_AUTH_OWNER_LEASE');
  },
  async mountOwnerReviewedCloud146({auth,db,onRestored}){
   assert.equal(auth,firstAuth);assert.equal(db,firstDB);assert.equal(typeof onRestored,'function');
   calls.push('mount');started.resolve();return pending.promise;
  },
  restored(){calls.push('restored')}
 };
 vm.createContext(ctx);vm.runInContext(program,ctx);
 return {
  ctx,panel,pending,started:started.promise,calls,
  begin:()=>ctx.attemptMount(),complete(){pending.resolve(panel)},
  fail(){pending.reject(Error('mount failed'))},
  swap(){changed=true;ctx.window.closetAuth={user:{id:'owner-b'}};ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'}};ctx.captureOperationEpoch++},
  sameIdRef(){ctx.window.closetAuth={user:{id:'owner-a'}}},
  sameDbName(){ctx.db={name:'closet-current-user-owner-a'}},
  epoch(){ctx.captureOperationEpoch++},
  user(){firstAuth.user.id='owner-b'},
  changeLease(){changed=true},
  throwRevoke(){throwOnRevoke=true},
  isRevoked:()=>revoked
 };
}
test('valid exact owner receives reviewed cloud bridge, no premature revoke',async()=>{
 const f=fixture(),task=f.begin();await f.started;f.complete();await task;
 assert.equal(f.ctx.window.ownerReviewedCloud146,f.panel);
 assert.equal(f.isRevoked(),false);assert.deepEqual(f.calls,['mount']);
});
for(const [label,change] of [
 ['account switch',f=>f.swap()],
 ['same owner relogin',f=>f.relogin()],
 ['same owner new Auth object without token change',f=>f.sameIdRef()],
 ['same name new IndexedDB connection',f=>f.sameDbName()],
 ['capture epoch changed',f=>f.epoch()],
 ['owner user ID changed inside original auth',f=>f.user()],
 ['lease explicitly revoked',f=>f.changeLease()]
]){
 test('P146 async mounted bridge revokes on '+label,async()=>{
  const f=fixture(),task=f.begin();await f.started;change(f);f.complete();
  await assert.rejects(task,/STALE_AUTH_OWNER_LEASE/);
  assert.equal(f.ctx.window.ownerReviewedCloud146,null);
  assert.equal(f.isRevoked(),true);
  assert.deepEqual(f.calls,['mount','revoke']);
 });
}
test('P146 revoke exception does not replace stale session rejection or publish bridge',async()=>{
 const f=fixture(),task=f.begin();await f.started;f.swap();f.throwRevoke();f.complete();
 await assert.rejects(task,/STALE_AUTH_OWNER_LEASE/);
 assert.equal(f.ctx.window.ownerReviewedCloud146,null);
 assert.deepEqual(f.calls,['mount','revoke']);
});
test('fresh mount rejection cannot publish anything',async()=>{
 const f=fixture(),task=f.begin();await f.started;f.fail();
 await assert.rejects(task,/mount failed/);
 assert.equal(f.ctx.window.ownerReviewedCloud146,null);
});
test('late mount stays rejected after same owner identity returns',async()=>{
 const f=fixture(),task=f.begin();await f.started;
 f.swap();f.ctx.window.closetAuth=f.ctx.initialAuth;f.ctx.db=f.ctx.ownerDB;
 f.complete();await assert.rejects(task,/STALE_AUTH_OWNER_LEASE/);
 assert.equal(f.isRevoked(),true);
});
test('source uses P146 revoke, not unrelated Restore01 dispose',()=>{
 assert.ok(source.includes('try{bridge?.revoke?.();}catch{}'));
 assert.ok(real.indexOf('try{assertLease();}')<real.indexOf('window.ownerReviewedCloud146=bridge'));
 assert.ok(module.includes('function revoke()'));
 assert.ok(module.includes('return Object.freeze({'));
 assert.ok(module.includes('  revoke,'));
 assert.match(source,/location\.protocol==='http:'/);
 assert.match(source,/ownerReview146'\)==='research'/);
 assert.match(source,/legacy sync must be held before reviewed cloud UI/);
});
