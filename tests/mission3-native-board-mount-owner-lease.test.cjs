'use strict';
// Execute exact extracted native BOARD04 mount-owner callback source in a VM.
// Controlled synthetic auth, no real photos, hosted auth or private wardrobes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function extract(start,end){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing exact source '+start);
 return source.slice(i,j);
}
const productionLease=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const mount=extract('const outfitBoardReady=(async()=>{','const TREND_DATA_URL=');
function fixture(){
 const events=[],ui={
  authGate:{hidden:true},appShell:{hidden:false},
  boardSaveStatus:{textContent:'initial'}
 };
 let revoked=false;
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const controller={
  status(){return {active:true}},
  readOnlySnapshot(){return {saved:[{id:'saved-a'}]}}
 };
 const ctx={
  window:{closetAuth:auth,nativePhotoReadiness08Bridge:{clear(){events.push('clear')}}},
  db:{name:'closet-current-user-owner-a'},captureOperationEpoch:17,
  nativeLossless04:null,currentBoard:{id:'original-owner'},
  savedOutfitBoards:[{id:'old-saved'}],boardInitialized:true,
  $(id){return ui[id];},
  cleanOutfitBoard(){events.push('clean');return {id:'blank'};},
  nativeLossless04ClearPreview(){events.push('preview-clear');},
  syncBoardInputs(){events.push('inputs');},
  renderOutfitBoard(){events.push('render');}
 };
 vm.createContext(ctx);
 vm.runInContext(productionLease,ctx,{timeout:1000});
 const lease=vm.runInContext('beginNativeBoardMountLease()',ctx,{timeout:1000});
 return {ctx,ui,events,lease,controller,auth,
  activate(){ctx.nativeLossless04=controller;lease.bind(controller);},
  switchOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.captureOperationEpoch++;
  },
  relogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};
   ctx.captureOperationEpoch++;
  },
  revoke(){revoked=true},
  emit(){lease.onChange({id:'owner-a-private-board'});lease.onStatus('PRIVATE-A STATUS');},
  mutateUI(){
   ctx.currentBoard={id:'owner-b-private-board'};
   ctx.savedOutfitBoards=[{id:'saved-b'}];
   ui.boardSaveStatus.textContent='OWNER B STATUS';
   events.length=0;
  }
 };
}
test('current signed owner receives native mount status and source board',()=>{
 const f=fixture();f.activate();f.emit();
 assert.equal(f.ctx.currentBoard.id,'owner-a-private-board');
 assert.equal(f.ui.boardSaveStatus.textContent,'PRIVATE-A STATUS');
 assert.equal(f.ctx.savedOutfitBoards[0].id,'saved-a');
 assert.deepEqual(f.events,['clear','inputs','render']);
});
test('initial native controller load may publish only to initiating owner before bind',()=>{
 const f=fixture();f.emit();
 assert.equal(f.ctx.currentBoard.id,'owner-a-private-board');
 assert.equal(f.ui.boardSaveStatus.textContent,'PRIVATE-A STATUS');
 assert.deepEqual(f.events,['clear']);
});
test('current signed owner revocation clears the same owner preview',()=>{
 const f=fixture();f.activate();f.lease.onChange(null,{revoked:true});
 assert.equal(f.ctx.currentBoard.id,'blank');
 assert.equal(f.ctx.savedOutfitBoards.length,0);
 assert.deepEqual(f.events,['clear','clean','preview-clear']);
});
const stale=[
 ['different owner',f=>f.switchOwner()],
 ['same-ID relogin',f=>f.relogin()],
 ['capture epoch rotation',f=>{f.ctx.captureOperationEpoch++;}],
 ['database object replacement',f=>{f.ctx.db={name:'closet-current-user-owner-a'};}],
 ['wrong private database',f=>{f.ctx.db.name='closet-current-user-owner-b';}],
 ['revoked current authorization',f=>f.revoke()],
 ['hidden auth gate',f=>{f.ui.authGate.hidden=false;}],
 ['hidden app shell',f=>{f.ui.appShell.hidden=true;}],
 ['replaced consumer',f=>{f.ctx.nativeLossless04={...f.controller};}]
];
for(const [name,change] of stale){
 test('old native mount cannot overwrite private status or board after '+name,()=>{
  const f=fixture();f.activate();change(f);f.mutateUI();
  f.emit();f.lease.onChange(null,{revoked:true});
  assert.equal(f.ctx.currentBoard.id,'owner-b-private-board');
  assert.equal(f.ui.boardSaveStatus.textContent,'OWNER B STATUS');
  assert.equal(f.ctx.savedOutfitBoards[0].id,'saved-b');
  assert.deepEqual(f.events,[]);
 });
}
test('old owner callback cannot clear a new owner original-photo preview bridge',()=>{
 const f=fixture();f.activate();f.switchOwner();
 f.events.length=0;
 f.lease.onChange(null,{revoked:true});
 assert.deepEqual(f.events,[]);
});
test('new login gets a separate functioning mount lease',()=>{
 const f=fixture();f.activate();f.switchOwner();
 const old=f.lease;
 const next=vm.runInContext('beginNativeBoardMountLease()',f.ctx);
 next.onStatus('OWNER B STATUS');
 assert.equal(f.ui.boardSaveStatus.textContent,'OWNER B STATUS');
 old.onStatus('PRIVATE A');
 assert.equal(f.ui.boardSaveStatus.textContent,'OWNER B STATUS');
});
test('mount refuses to create any lease while private gate locked',()=>{
 const f=fixture();f.ui.authGate.hidden=false;
 assert.equal(vm.runInContext('beginNativeBoardMountLease()',f.ctx),null);
});
test('mount refuses a wrong DB name before touching owner data',()=>{
 const f=fixture();f.ctx.db.name='shared-guest-database';
 assert.equal(vm.runInContext('beginNativeBoardMountLease()',f.ctx),null);
});
test('exact source fences async native controller before publishing bridge',()=>{
 assert.match(mount,/nativeMountLease=beginNativeBoardMountLease\(\)/);
 assert.match(mount,/if\(!nativeMountLease\.current\(\)\)return;\s+const created=await createNativeConsumerBoard04/);
 assert.match(mount,/onChange:nativeMountLease\.onChange,onStatus:nativeMountLease\.onStatus/);
 assert.match(mount,/if\(!nativeMountLease\.current\(\)\)\{created\.dispose\(\);return;\}/);
 assert.match(mount,/nativeLossless04=created;nativeMountLease\.bind\(created\)/);
 assert.match(mount,/if\(nativeMountLease&&!nativeMountLease\.current\(\)\)return;/);
});
test('real optional preview mount source disposes stale 3D, readiness and Style handles',()=>{
 for(const variable of ['viewer','readiness','style'])
  assert.ok(mount.includes('if(!nativeMountLease.current()){'+variable+'.dispose();return;}'));
 assert.match(mount,/onStatus:nativeMountLease\.onStatus/);
 assert.match(mount,/if\(!nativeMountLease\.current\(\)\)return;\s+window\.nativeMobile09Bridge/);
});
test('normal non-native Board Save, CAS and draft conflict logic are retained',()=>{
 assert.match(source,/async function persistBoardState\(/);
 assert.match(source,/expectedClothing/);
 assert.match(source,/OUTFIT_WARDROBE_CHANGED/);
 assert.match(source,/if\(nativeLossless04Active\)throw Error\('Unsafe native outfit write blocked/);
});
