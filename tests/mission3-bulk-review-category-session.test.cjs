'use strict';
// Mission 3: source-execute the exact public/app.js bulk photo category handler
// and existing ownerWardrobeMutationLease; synthetic owner data, no deployment.
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
function segment(start,end){
 const i=app.indexOf(start),j=app.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Exact live source required: '+start);
 return app.slice(i,j);
}
const leaseCode=segment('function ownerWardrobeMutationLease(){','function writeAll(values){');
const actionCode=segment("$('applyCategory').onclick=async()=>{","for(const season of clothingSchema.seasons.slice(0,4))");
const deferred=()=>{
 let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});
 promise.catch(()=>{});return {promise,resolve,reject};
};
const record=(owner,id,extra={})=>({id,ownerId:owner,
  category:'Uncategorized',itemType:'Unknown',color:'Navy',
  sourceSHA256:owner==='A'?'a'.repeat(64):'b'.repeat(64),
  originalPhoto:{image:'data:image/jpeg;base64,/9j/'+owner,sha256:owner==='A'?'a'.repeat(64):'b'.repeat(64)},
  image:'data:image/jpeg;base64,/9j/'+owner,...extra});
function fixture({chosen='Tops',rows=null,owner='A',busy=false,scanning=false}={}){
 const firstAuth={user:{id:owner},assertCurrent(){}},secondAuth={user:{id:'B'},assertCurrent(){}};
 const firstDB={name:'closet-current-user-'+owner},secondDB={name:'closet-current-user-B'};
 const initial=rows||[record(owner,'photo-one'),record(owner,'photo-two',{category:'Shoes',itemType:'Sneakers'})];
 const changedGate=deferred(),events=[],commits=[];
 const controls={applyCategory:{onclick:null},batchCategory:{value:chosen}};
 const ctx={
  window:{closetAuth:firstAuth},db:firstDB,captureOperationEpoch:0,
  batch:initial,localPending:new Set(busy?['inference']:[]),automaticRunning:scanning,
  structuredClone,JSON,Error,normalizeClothing:value=>value,
  $:id=>controls[id],
  message:value=>events.push('message:'+ctx.window.closetAuth?.user?.id+':'+value),
  render:()=>events.push('render:'+ctx.window.closetAuth?.user?.id),
  commitReviewedDraftCAS:async(changes,check)=>{
   commits.push({changes:structuredClone(changes),check});
   check();
   return changedGate.promise;
  }
 };
 vm.createContext(ctx);vm.runInContext(leaseCode+'\n'+actionCode,ctx);
 assert.equal(typeof controls.applyCategory.onclick,'function');
 return {ctx,events,commits,changedGate,firstDB,secondDB,firstAuth,secondAuth,initial,click:()=>controls.applyCategory.onclick(),
  switchOwner(){ctx.captureOperationEpoch++;ctx.window.closetAuth=secondAuth;ctx.db=secondDB;ctx.batch=[record('B','next-owner-photo')];},
  reloginSameOwner(){ctx.captureOperationEpoch++;ctx.window.closetAuth={user:{id:owner},assertCurrent(){}};ctx.db={name:'closet-current-user-'+owner};ctx.batch=[record(owner,'next-session-photo')];},
  revokeInPlace(){ctx.captureOperationEpoch++;}
 };
}
test('signed owner bulk-category commit touches only reviewed uncategorized source rows',async()=>{
 const f=fixture(),pending=f.click();
 assert.equal(f.commits.length,1);
 assert.equal(f.commits[0].changes.length,1);
 const change=f.commits[0].changes[0];
 assert.equal(change.before.id,'photo-one');
 assert.equal(change.before.category,'Uncategorized');
 assert.equal(change.after.category,'Tops');
 assert.equal(change.after.originalPhoto.image,change.before.originalPhoto.image);
 f.changedGate.resolve(1);
 await pending;
 assert.equal(f.initial[0].category,'Tops');
 assert.equal(f.initial[1].category,'Shoes');
 assert.deepEqual(f.events,['render:A','message:A:Category applied to 1 uncategorized candidates.']);
});
test('different owner login after durable category commit cannot redraw new owner photo results',async()=>{
 const f=fixture(),pending=f.click();
 f.switchOwner();f.changedGate.resolve(1);
 await pending;
 assert.equal(f.ctx.batch[0].ownerId,'B');
 assert.equal(f.ctx.batch[0].category,'Uncategorized');
 assert.equal(f.initial[0].category,'Uncategorized');
 assert.deepEqual(f.events,[]);
});
test('same-owner-ID relogin also revokes old category completion',async()=>{
 const f=fixture(),pending=f.click();
 f.reloginSameOwner();f.changedGate.resolve(1);
 await pending;
 assert.equal(f.ctx.batch[0].id,'next-session-photo');
 assert.equal(f.ctx.batch[0].category,'Uncategorized');
 assert.deepEqual(f.events,[]);
});
test('previous owner late CAS failure cannot send error message to a new owner',async()=>{
 const f=fixture(),pending=f.click();
 f.switchOwner();f.changedGate.reject(Error('private owner-A original image secret'));
 await pending;
 assert.deepEqual(f.events,[]);
});
test('same ID account re-login suppresses previous session CAS failure warning',async()=>{
 const f=fixture(),pending=f.click();
 f.reloginSameOwner();f.changedGate.reject(Error('previous login private photo'));
 await pending;
 assert.deepEqual(f.events,[]);
});
test('current owner CAS failure keeps original cards and gives truthful uncertain-ACK notice',async()=>{
 const f=fixture(),pending=f.click();
 f.changedGate.reject(Error('CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS'));
 await pending;
 assert.equal(f.initial[0].category,'Uncategorized');
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Could not confirm this category update/);
 assert.doesNotMatch(f.events[0],/were not saved/);
});
test('after commit, local in-tab photo changes are not overwritten by old bulk snapshot',async()=>{
 const f=fixture(),pending=f.click();
 f.initial[0].notes='new photo note added during commit';
 f.changedGate.resolve(1);
 await pending;
 assert.equal(f.initial[0].category,'Uncategorized');
 assert.equal(f.initial[0].notes,'new photo note added during commit');
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Categories saved in private device storage/);
});
test('after commit, a locally removed source is not resurrected into photo results',async()=>{
 const f=fixture(),pending=f.click();
 f.ctx.batch=f.ctx.batch.filter(x=>x.id!=='photo-one');
 f.changedGate.resolve(1);
 await pending;
 assert.equal(f.ctx.batch.length,1);
 assert.equal(f.ctx.batch[0].id,'photo-two');
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Photo results changed while saving/);
});
test('worker starting during commit prevents stale UI category overwrite',async()=>{
 const f=fixture(),pending=f.click();
 f.ctx.localPending.add('scanner-started');
 f.changedGate.resolve(1);
 await pending;
 assert.equal(f.initial[0].category,'Uncategorized');
 assert.match(f.events[0],/Refresh Photo results/);
});
test('native CAS callback itself rejects a changed owner before transaction commit',async()=>{
 const f=fixture(),pending=f.click();
 f.switchOwner();
 assert.throws(()=>f.commits[0].check(),/Private wardrobe changed accounts/);
 f.changedGate.reject(Error('DB transaction aborted'));
 await pending;
 assert.deepEqual(f.events,[]);
});
test('bulk category button never starts operation without selected category',async()=>{
 const f=fixture({chosen:''});
 await f.click();
 assert.equal(f.commits.length,0);
 assert.match(f.events[0],/Choose a category/);
});
test('ongoing scan prevents bulk edits of review cards',async()=>{
 const f=fixture({busy:true});
 await f.click();
 assert.equal(f.commits.length,0);
 assert.match(f.events[0],/Finish current photo checks/);
});
test('already categorized photographs are never bulk edited',async()=>{
 const f=fixture({rows:[record('A','already',{category:'Bottoms'})]});
 await f.click();
 assert.equal(f.commits.length,0);
 assert.match(f.events[0],/no uncategorized photographs/);
});
test('missing or foreign owner-private database refuses the bulk category command',async()=>{
 const f=fixture();
 f.ctx.db={name:'closet-current-user-B'};
 await f.click();
 assert.equal(f.commits.length,0);
 assert.deepEqual(f.events,[]);
});
test('the live handler captures owner lease before saving and rechecks after await',()=>{
 assert.match(actionCode,/lease=ownerWardrobeMutationLease\(\)/);
 assert.match(actionCode,/await commitReviewedDraftCAS\(/);
 assert.match(actionCode,/lease\.assertLease\(\);\s*if\(!stillReviewing\(\)\)/);
 assert.match(actionCode,/try\{lease\.assertLease\(\);\}catch\{return;\}/);
 assert.match(leaseCode,/epoch!==captureOperationEpoch\|\|db!==ownerDB/);
 assert.doesNotMatch(actionCode,/Your categories were not saved/);
});
