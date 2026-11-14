'use strict';
// P146: execute REAL source for owner-guarded private counts, status and consent.
// Synthetic local UI only. Never accesses private wardrobes or hosted cloud.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
function slice(a,b){const i=src.indexOf(a),j=src.indexOf(b,i);
 assert.ok(i>=0&&j>i,'real source anchor '+a);return src.slice(i,j);}
const source=[
 slice(' const status=(message)=>',' function decide(info,type){'),
 slice(' function settle(answer){'," by('owner146Cancel').onclick"),
 slice(' function revoke(){',' const onLocked=()=>revoke();'),
 'const onLocked=()=>revoke();',
 'globalThis.runStatus=status;'
].join('\n');
const sample={
 localReviewedGarments:2,remoteReviewedGarments:9,localSavedOutfits:1,
 remoteSavedOutfits:7,remoteRevision:4
};
function fixture(){
 const actions=[],owner={active:true};
 const buttons=Object.fromEntries(['owner146Preview','owner146Backup','owner146Restore']
  .map(k=>[k,{disabled:false,onclick:()=>{}}]));
 const nodes={
  owner146Status:{textContent:'Current-owner status'},
  owner146Counts:{textContent:'',hidden:true},
  owner146LocalItems:{textContent:'—'},owner146RemoteItems:{textContent:'—'},
  owner146LocalLooks:{textContent:'—'},owner146RemoteLooks:{textContent:'—'}
 };
 const panel={removed:false,remove(){this.removed=true;actions.push('remove panel')}};
 const dialog={open:true,removed:false,close(){this.open=false},
  remove(){this.removed=true;actions.push('remove dialog')}};
 const style={removed:false,remove(){this.removed=true;actions.push('remove style')}};
 let answer;
 const ctx={revoked:false,pending:null,panel,dialog,style,
  buttonIds:Object.keys(buttons),
  by(id){return nodes[id]||buttons[id]||null},
  assertLocalOwner(){if(!owner.active||this.revoked)throw Error('owner-session-revoked')},
  backupService:{revoke(){actions.push('backup revoked')}},
  restoreService:{revoke(){actions.push('restore revoked')}},
  window:{removeEventListener(){}},globalThis:null
 };
 // The function under test closes over module variables (not this).
 ctx.assertLocalOwner=()=>{if(!owner.active||ctx.revoked)throw Error('owner-session-revoked')};
 ctx.globalThis=ctx;
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,nodes,owner,panel,dialog,style,buttons,actions,
  consent(){ctx.pending=v=>{answer=v};return ()=>answer}
 };
}
function removed(f){
 assert.equal(f.ctx.revoked,true);assert.equal(f.panel.removed,true);
 assert.equal(f.dialog.removed,true);assert.equal(f.style.removed,true);
 for(const button of Object.values(f.buttons)){
  assert.equal(button.disabled,true);assert.equal(button.onclick,null);
 }
 assert.ok(f.actions.includes('backup revoked'));
 assert.ok(f.actions.includes('restore revoked'));
}
test('source shows count-only preview for same live owner',()=>{
 const f=fixture();f.ctx.showCounts(sample);
 assert.equal(f.nodes.owner146LocalItems.textContent,'2');
 assert.equal(f.nodes.owner146RemoteItems.textContent,'9');
 assert.equal(f.nodes.owner146Counts.hidden,false);
 assert.equal(f.ctx.revoked,false);
});
test('stale asynchronous count preview checks owner before any private DOM write',()=>{
 const f=fixture(),answer=f.consent();
 f.owner.active=false;
 assert.throws(()=>f.ctx.showCounts(sample),/owner-session-revoked/);
 removed(f);assert.equal(answer(),false);
 assert.equal(f.nodes.owner146LocalItems.textContent,'—');
 assert.equal(f.nodes.owner146RemoteItems.textContent,'—');
 assert.equal(f.nodes.owner146Counts.hidden,true);
});
test('late status message cannot appear on a replacement owner session',()=>{
 const f=fixture();f.owner.active=false;
 assert.doesNotThrow(()=>f.ctx.runStatus('PRIVATE OLD OWNER CLOSET'));
 removed(f);assert.equal(f.nodes.owner146Status.textContent,'Current-owner status');
});
test('approval after auth switch without event is denied and stale UI revoked',()=>{
 const f=fixture(),answer=f.consent();f.owner.active=false;
 f.ctx.settle(true);
 assert.equal(answer(),false);removed(f);
});
test('approval remains possible for same authenticated owner',()=>{
 const f=fixture(),answer=f.consent();
 f.ctx.settle(true);
 assert.equal(answer(),true);assert.equal(f.ctx.revoked,false);
 assert.equal(f.dialog.open,false);
});
test('explicit cancel always denies without treating missing auth as approval',()=>{
 const f=fixture(),answer=f.consent();f.owner.active=false;
 f.ctx.settle(false);
 assert.equal(answer(),false);assert.equal(f.ctx.revoked,false);
});
test('actual P146 origin principal check rejects same-ID relogin without a lock event',()=>{
 const actualGuard=slice(' function assertLocalOwner(){',' const localAuth={');
 const id='00000000-0000-4000-8000-000000000001';
 const initial={id};
 const auth={user:initial,assertCurrent(){}};
 const ctx={auth,ownerAtMount:id,ownerPrincipalAtMount:initial,
  db:{name:'closet-current-user-'+id},loc:{},revoked:false,
  ownerReviewedMode146:()=>true,fail(msg){throw Error(msg)}};
 vm.createContext(ctx);vm.runInContext(actualGuard,ctx);
 assert.doesNotThrow(()=>ctx.assertLocalOwner());
 auth.user={id}; // different verified signed session, same user ID
 assert.throws(()=>ctx.assertLocalOwner(),/owner session changed/);
});
test('source retains synthetic localhost gate and does not introduce cloud writes',()=>{
 for(const required of [
  "ownerReview145')==='research'","ownerReview146')==='research'",
  "const SYNTHETIC_TOKEN_PREFIX=","redirect:'error',credentials:'omit'",
  "try{assertLocalOwner();}catch(error){revoke();throw error;}",
  "if(answer===true&&!approved&&!revoked)revoke();",
  "auth.user!==ownerPrincipalAtMount",
  "if(approved){try{assertLocalOwner();}catch{approved=false;}}"
 ])assert.ok(src.includes(required),required);
});
