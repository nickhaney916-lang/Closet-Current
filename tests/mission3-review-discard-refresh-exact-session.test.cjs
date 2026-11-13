'use strict';
// Execute the exact My Closet public/app.js Photo results Discard and Refresh
// UI handlers with the real ownerWardrobeMutationLease function. Only synthetic
// records/login fixtures; no network, real owner photos or deployment.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const app=readFileSync('public/app.js','utf8');
function source(a,b){const i=app.indexOf(a),j=app.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Exact production source span unavailable: '+a);
 return app.slice(i,j);}
const leaseSource=source('function ownerWardrobeMutationLease(){','function writeAll(values){');
const handlerSource=source("$('refreshReview').onclick=async()=>{","$('export').onclick=async()=>{");
const pending=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {resolve,reject,promise};};
const record=(owner,id,extra={})=>({
 id,ownerId:owner,category:'Uncategorized',
 image:'data:image/jpeg;base64,/9j/'+owner+id,
 sourceSHA256:(owner==='A'?'a':'b').repeat(64),
 originalPhoto:{image:'data:image/jpeg;base64,/9j/'+owner+id,sha256:(owner==='A'?'a':'b').repeat(64)},
 notes:'owner review',...extra
});
function fixture({rows=null,confirmed=true,busy=false,scanning=false,confirmAction=null}={}){
 const list=rows||[record('A','photo-a'),record('A','photo-b')],idb={name:'closet-current-user-A'};
 const authA={user:{id:'A'},assertCurrent(){}},authB={user:{id:'B'},assertCurrent(){}};
 const gate=pending(),refGate=pending(),events=[],commits=[],controls={
  discard:{},refreshReview:{disabled:false,isConnected:true}
 };
 const ctx={
  window:{closetAuth:authA},db:idb,captureOperationEpoch:12,
  batch:list,localPending:new Set(busy?['scan']:[]),
  automaticRunning:scanning,session:2,
  sessionCapturedIds:new Set(list.map(x=>x.id)),
  failedDraftCaptures:new Set(list.map(x=>x.id)),
  structuredClone,JSON,Set,Error,
  normalizeClothing:x=>x,
  $:id=>controls[id],
  confirm:()=>{events.push('confirm');if(confirmAction)confirmAction(ctx);return confirmed;},
  message:v=>events.push('message:'+ctx.window.closetAuth?.user?.id+':'+v),
  render:()=>events.push('render:'+ctx.window.closetAuth?.user?.id),
  commitReviewedDraftCAS:async(changes,check)=>{
   commits.push({changes:structuredClone(changes),check});check();return gate.promise;
  },
  refreshOwnerDraftFromDevice:()=>{events.push('refresh-start');return refGate.promise;}
 };
 vm.createContext(ctx);
 vm.runInContext(leaseSource+'\n'+handlerSource,ctx);
 assert.equal(typeof controls.discard.onclick,'function');
 assert.equal(typeof controls.refreshReview.onclick,'function');
 return {ctx,events,commits,controls,gate,refGate,list,idb,
  discard:()=>controls.discard.onclick(),refresh:()=>controls.refreshReview.onclick(),
  switchOwner(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth=authB;
   ctx.db={name:'closet-current-user-B'};
   ctx.batch=[record('B','next-owner-private-JPEG')];
   ctx.sessionCapturedIds=new Set(['next-owner-private-JPEG']);
   ctx.failedDraftCaptures=new Set(['next-owner-private-JPEG']);
   ctx.session=99;
  },
  relogin(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'A'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-A'};
   ctx.batch=[record('A','new-session-photo')];
   ctx.sessionCapturedIds=new Set(['new-session-photo']);
   ctx.failedDraftCaptures=new Set(['new-session-photo']);
   ctx.session=19;
  }
 };
}
test('signed owner discard CAS removes only exact confirmed pending originals and in-memory receipts',async()=>{
 const f=fixture(),work=f.discard();
 assert.equal(f.commits.length,1);assert.equal(f.commits[0].changes.length,2);
 assert.ok(f.commits[0].changes.every(c=>c.after===null));
 assert.equal(f.commits[0].changes[0].before.originalPhoto.image,f.list[0].originalPhoto.image);
 f.gate.resolve(2);await work;
 assert.equal(f.ctx.batch.length,0);assert.equal(f.ctx.session,0);
 assert.equal(f.ctx.sessionCapturedIds.size,0);assert.equal(f.ctx.failedDraftCaptures.size,0);
 assert.deepEqual(f.events,['confirm','render:A']);
});
test('cancel and empty review never delete a source original',async()=>{
 const cancelled=fixture({confirmed:false});await cancelled.discard();
 assert.equal(cancelled.commits.length,0);assert.equal(cancelled.ctx.batch.length,2);
 const empty=fixture({rows:[]});await empty.discard();
 assert.deepEqual(empty.events,[]);assert.equal(empty.commits.length,0);
});
test('active scanner refuses photo discard',async()=>{
 const f=fixture({busy:true});await f.discard();
 assert.equal(f.commits.length,0);
 assert.match(f.events[0],/Finish the current photo checks/);
});
test('duplicate original IDs cannot authorize ambiguous destructive CAS',async()=>{
 const source=record('A','same');
 const f=fixture({rows:[source,record('A','same')]});await f.discard();
 assert.equal(f.commits.length,0);
 assert.match(f.events[0],/duplicate IDs/);
});
test('session changed during confirm refuses even to start durable delete',async()=>{
 let f;
 f=fixture({confirmAction:()=>f.switchOwner()});
 await f.discard();
 assert.equal(f.commits.length,0);
 assert.equal(f.ctx.batch[0].ownerId,'B');
 assert.deepEqual(f.events,['confirm']);
});
test('original row changed during confirmation refuses to start destructive CAS',async()=>{
 const f=fixture({confirmAction:ctx=>{ctx.batch[0].notes='new owner review during confirmation';}});
 await f.discard();assert.equal(f.commits.length,0);
 assert.match(f.events.join(' '),/Nothing was discarded by this action/);
});
test('successful old-owner discard ACK after account switch cannot mutate new owner photos, IDs or status',async()=>{
 const f=fixture(),work=f.discard();
 f.switchOwner();f.gate.resolve(2);await work;
 assert.equal(f.ctx.batch[0].ownerId,'B');assert.equal(f.ctx.session,99);
 assert.equal(f.ctx.sessionCapturedIds.has('next-owner-private-JPEG'),true);
 assert.equal(f.ctx.failedDraftCaptures.has('next-owner-private-JPEG'),true);
 assert.deepEqual(f.events,['confirm']);
});
test('same owner ID re-login revokes old delete finalizer and preserves current draft',async()=>{
 const f=fixture(),work=f.discard();
 f.relogin();f.gate.resolve(2);await work;
 assert.equal(f.ctx.batch[0].id,'new-session-photo');
 assert.equal(f.ctx.session,19);assert.equal(f.ctx.sessionCapturedIds.has('new-session-photo'),true);
 assert.deepEqual(f.events,['confirm']);
});
test('rejected old-owner delete cannot print error or private image text to new account',async()=>{
 const f=fixture(),work=f.discard();
 f.switchOwner();f.gate.reject(Error('owner A sensitive JPEG detail'));await work;
 assert.deepEqual(f.events,['confirm']);assert.equal(f.ctx.batch[0].ownerId,'B');
});
test('rejected old-session delete after same owner ID re-login stays silent',async()=>{
 const f=fixture(),work=f.discard();
 f.relogin();f.gate.reject(Error('old session JPEG'));await work;
 assert.deepEqual(f.events,['confirm']);
});
test('current owner failed CAS preserves originals and reports acknowledgement uncertainty rather than false rollback',async()=>{
 const f=fixture(),work=f.discard();
 f.gate.reject(Error('CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS'));await work;
 assert.equal(f.ctx.batch.length,2);assert.equal(f.ctx.sessionCapturedIds.size,2);
 assert.equal(f.events.length,2);
 assert.match(f.events[1],/Could not confirm whether those unfinished photos were discarded/);
 assert.doesNotMatch(f.events[1],/photos were preserved/);
});
test('after committed discard a newly captured photo is not deleted, reset or re-rendered',async()=>{
 const f=fixture(),work=f.discard(),fresh=record('A','new-local-original');
 f.ctx.batch.push(fresh);f.ctx.sessionCapturedIds.add(fresh.id);f.ctx.session=7;
 f.gate.resolve(2);await work;
 assert.equal(f.ctx.batch.length,3);assert.equal(f.ctx.batch[2],fresh);
 assert.equal(f.ctx.session,7);assert.equal(f.ctx.sessionCapturedIds.has(fresh.id),true);
 assert.equal(f.events.length,2);assert.match(f.events[1],/discarded from private device storage.*Photo results changed/);
});
test('changed original during pending CAS is not silently discarded from screen after commit',async()=>{
 const f=fixture(),work=f.discard();
 f.ctx.batch[0].notes='new local review';
 f.gate.resolve(2);await work;
 assert.equal(f.ctx.batch.length,2);assert.equal(f.ctx.batch[0].notes,'new local review');
 assert.equal(f.ctx.session,2);assert.match(f.events[1],/Refresh Photo results/);
});
test('CAS callback fails closed if a second account arrives before DB transaction executes',async()=>{
 const f=fixture(),work=f.discard();
 f.switchOwner();
 assert.throws(()=>f.commits[0].check(),/Private wardrobe changed accounts/);
 f.gate.reject(Error('transaction aborted'));await work;
 assert.deepEqual(f.events,['confirm']);
});
test('CAS callback fails closed when a new local original arrives before DB transaction executes',async()=>{
 const f=fixture(),work=f.discard();
 f.ctx.batch.push(record('A','later'));
 assert.throws(()=>f.commits[0].check(),/CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
 f.gate.reject(Error('transaction aborted'));await work;
 assert.match(f.events[1],/Could not confirm whether/);
});
test('normal signed owner Refresh re-enables the connected button only after read completes',async()=>{
 const f=fixture(),work=f.refresh();
 assert.equal(f.controls.refreshReview.disabled,true);
 f.refGate.resolve({changed:false});await work;
 assert.equal(f.controls.refreshReview.disabled,false);
 assert.deepEqual(f.events,['refresh-start']);
});
test('old owner Refresh cannot unlock the new signed owner button',async()=>{
 const f=fixture(),work=f.refresh();
 f.switchOwner();f.refGate.resolve({changed:true});await work;
 assert.equal(f.controls.refreshReview.disabled,true);
 assert.deepEqual(f.events,['refresh-start']);
});
test('same owner ID re-login cannot unlock stale button after refresh rejects',async()=>{
 const f=fixture(),work=f.refresh();
 f.relogin();f.refGate.reject(Error('stale refresh'));await work;
 assert.equal(f.controls.refreshReview.disabled,true);
 assert.deepEqual(f.events,['refresh-start']);
});
test('current owner Refresh failure can safely re-enable its own button',async()=>{
 const f=fixture(),work=f.refresh();
 f.refGate.reject(Error('CLOSET_DRAFT_REFRESH_HAS_UNSAVED_WORK'));await work;
 assert.equal(f.controls.refreshReview.disabled,false);
});
test('signed-out handlers never start private refresh or destructive discard',async()=>{
 const f=fixture();f.ctx.window.closetAuth.user=null;
 await f.refresh();await f.discard();
 assert.equal(f.commits.length,0);assert.deepEqual(f.events,[]);
});
test('production handlers retain exact signed session, immutable original and postcommit guard',()=>{
 assert.match(handlerSource,/ownerWardrobeMutationLease\(\)/);
 assert.match(handlerSource,/if\(button\.isConnected\)button\.disabled=false/);
 assert.match(handlerSource,/const ids=new Set\(reviewed\.map\(x=>x\.before\.id\)\)/);
 assert.match(handlerSource,/batch\.length===reviewed\.length/);
 assert.match(handlerSource,/await commitReviewedDraftCAS/);
 assert.match(handlerSource,/lease\.assertLease\(\);\s*if\(!stillReviewing\(\)\)throw/);
 assert.match(handlerSource,/lease\.assertLease\(\);\s*\/\/ The delete has committed/);
 assert.doesNotMatch(handlerSource,/Your photos were preserved\. Reload Photo results before trying again/);
 assert.match(leaseSource,/epoch!==captureOperationEpoch\|\|db!==ownerDB/);
});
