'use strict';
// Execute the actual research-only session-lock handler, native preview cleanup,
// input synchronization and pinned callbacks with synthetic signed-owner data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function slice(start,end){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing production source boundary: '+start);
 return source.slice(i,j);
}
const preview=slice('function nativeLossless04ClearPreview(){','function boardLink(');
const lease=slice('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const inputs=slice('function syncBoardInputs(){','function selectBoardPiece(');
const handler=slice("window.addEventListener('closet:session-locked',()=>{",'async function persistBoardState(');
const names=['native3D05Bridge','nativePhotoReadiness08Bridge','styleOwnedLive03Bridge','nativeMobile09Bridge','nativeLossless04Bridge'];
const inputIds=['boardName','boardOccasion','boardSeason','boardAudience','boardSize','boardBudget'];
const gridIds=['boardSlots','savedBoards','boardPickerItems','boardOwnedOptions','boardRecommendations'];
function fixture({native=true,throwOn=null,missing=[]}={}){
 const calls=[],listener={},nodes={};
 for(const name of inputIds)nodes[name]={value:'PRIVATE-A-'+name};
 for(const name of gridIds)nodes[name]={
  entries:['PRIVATE-A-'+name],
  replaceChildren(){calls.push('empty:'+name);this.entries=[]}
 };
 nodes.boardPicker={open:true,close(){this.open=false;calls.push('close-picker')}};
 nodes.boardSaveStatus={textContent:'PRIVATE-A-JPEG-SHA'};
 nodes.retryBoardDraft={hidden:false};
 nodes.boardDraftConflictActions={hidden:false};
 nodes.authGate={hidden:true};
 nodes.appShell={hidden:false};
 const auth={user:{id:'owner-a'},assertCurrent(){}};
 const ctx={
  window:{closetAuth:auth,addEventListener(name,fn){listener[name]=fn}},
  db:{name:'closet-current-user-owner-a'},captureOperationEpoch:12,
  nativeLossless04Active:native,nativeLossless04:null,
  currentBoard:{name:'PRIVATE-A-OUTFIT',slots:{top:'PRIVATE-A-GARMENT'}},
  savedOutfitBoards:[{name:'PRIVATE-A-SAVED'}],
  boardDraftTimer:3,boardStatusSerial:3,boardConflictDraft:{name:'PRIVATE-A-CONFLICT'},
  boardInitialized:true,
  $(id){if(!nodes[id])throw Error('No DOM id '+id);return nodes[id]},
  cleanOutfitBoard(){calls.push('clean');return {name:'',slots:{}}},
  cancelBoardDraftTimer(){calls.push('cancel-timer');this.boardDraftTimer=null},
  renderOutfitBoard(){calls.push('render')},
 };
 vm.createContext(ctx);
 vm.runInContext(preview+lease+inputs+handler,ctx,{timeout:1000});
 const originalConsumer={
  status(){return {active:true}},
  readOnlySnapshot(){return {saved:[{name:'PRIVATE-A-SAVED'}]}},
  dispose(){calls.push('dispose:controller');if(throwOn==='nativeLossless04Bridge')throw Error('PRIVATE-A-DISPOSE')}
 };
 ctx.nativeLossless04=originalConsumer;
 const mount=vm.runInContext('beginNativeBoardMountLease()',ctx);
 if(mount)mount.bind(originalConsumer);
 for(const key of names){
  if(missing.includes(key))continue;
  if(key==='nativeLossless04Bridge'){ctx.window[key]=originalConsumer;continue;}
  ctx.window[key]={dispose(){calls.push('dispose:'+key);
   if(throwOn===key)throw Error('PRIVATE-A-DISPOSE');
  }};
 }
 function lock(){listener['closet:session-locked']();return ctx;}
 return {ctx,calls,nodes,listener,lock,mount,originalConsumer,
  changeOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++;
  },
  sameIdRelogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++;
  }
 };
}
test('native session-lock synchronously clears original private outfit and visible fields',()=>{
 const f=fixture();f.lock();
 assert.equal(f.ctx.nativeLossless04,null);
 assert.equal(f.ctx.currentBoard.name,'');
 assert.equal(f.ctx.savedOutfitBoards.length,0);
 for(const id of inputIds)assert.equal(f.nodes[id].value,'','retained '+id);
 for(const id of gridIds)assert.equal(f.nodes[id].entries.length,0,'retained '+id);
 assert.equal(f.nodes.boardPicker.open,false);
 assert.equal(f.nodes.boardSaveStatus.textContent,'Signed-out private outfit cleared. Reopen Outfit Builder.');
 assert.equal(f.nodes.retryBoardDraft.hidden,true);
 assert.equal(f.nodes.boardDraftConflictActions.hidden,true);
 assert.equal(f.ctx.boardConflictDraft,null);
 assert.ok(f.calls.indexOf('cancel-timer')>=0);
 assert.ok(f.calls.indexOf('clean')>=0);
});
test('research native lock disposes and unpublishes all five private bridges',()=>{
 const f=fixture();f.lock();
 for(const key of names){
  assert.equal(f.ctx.window[key],null,'bridge still visible: '+key);
  assert.ok(f.calls.includes('dispose:'+(key==='nativeLossless04Bridge'?'controller':key)),'did not dispose '+key);
 }
});
test('native controller is revoked before disposal can publish a late private status',()=>{
 const f=fixture();f.originalConsumer.dispose=()=>{
  f.calls.push('dispose:controller');
  f.mount.onChange({name:'PRIVATE-A-CALLBACK',slots:{top:'PRIVATE-A-NEW'}});
  f.mount.onStatus('PRIVATE-A-ERROR-JPEG');
  assert.equal(f.ctx.nativeLossless04,null);
 };
 f.lock();
 assert.equal(f.ctx.currentBoard.name,'');
 assert.equal(f.nodes.boardSaveStatus.textContent,'Signed-out private outfit cleared. Reopen Outfit Builder.');
 assert.equal(f.ctx.savedOutfitBoards.length,0);
});
test('each optional viewer disposes independently even when another throws',()=>{
 for(const throwing of names){
  const f=fixture({throwOn:throwing});f.lock();
  for(const key of names)assert.equal(f.ctx.window[key],null);
  assert.equal(f.nodes.boardSaveStatus.textContent,'Signed-out private outfit cleared. Reopen Outfit Builder.');
  assert.equal(f.calls.filter(x=>x.startsWith('dispose:')).length,5);
 }
});
test('missing optional bridges are handled without exposing old owner data',()=>{
 const f=fixture({missing:['native3D05Bridge','styleOwnedLive03Bridge','nativeMobile09Bridge']});
 f.lock();
 for(const key of names)assert.equal(f.ctx.window[key],null);
 assert.equal(f.ctx.currentBoard.name,'');
 assert.equal(f.nodes.boardName.value,'');
});
test('repeated native session lock is idempotent and does not dispose twice',()=>{
 const f=fixture();f.lock();const first=f.calls.filter(x=>x.startsWith('dispose:')).length;
 f.lock();
 assert.equal(first,5);
 assert.equal(f.calls.filter(x=>x.startsWith('dispose:')).length,first);
 assert.equal(f.nodes.boardSaveStatus.textContent,'Signed-out private outfit cleared. Reopen Outfit Builder.');
});
test('native session lock does not make a storage write',()=>{
 const f=fixture();f.lock();
 assert.equal(f.calls.filter(x=>/persist|store|save|write|delete/i.test(x)&&!x.startsWith('empty:')).length,0);
});
test('normal non-native lock retains existing handler behavior',()=>{
 const f=fixture({native:false});f.lock();
 assert.equal(f.ctx.currentBoard.name,'PRIVATE-A-OUTFIT');
 assert.equal(f.ctx.nativeLossless04,f.originalConsumer);
 assert.equal(f.nodes.boardName.value,'PRIVATE-A-boardName');
 assert.equal(f.nodes.retryBoardDraft.hidden,true);
 assert.equal(f.nodes.boardDraftConflictActions.hidden,true);
 assert.equal(f.calls.filter(x=>x.startsWith('dispose:')).length,0);
});
test('old native controller callbacks cannot write into newly signed owner screen after lock',()=>{
 const f=fixture();f.lock();f.changeOwner();
 f.ctx.currentBoard={name:'OWNER-B-OUTFIT'};
 f.nodes.boardSaveStatus.textContent='OWNER-B-STATUS';
 f.mount.onChange({name:'PRIVATE-A-RETURN'});
 f.mount.onStatus('PRIVATE-A-RETURN');
 assert.equal(f.ctx.currentBoard.name,'OWNER-B-OUTFIT');
 assert.equal(f.nodes.boardSaveStatus.textContent,'OWNER-B-STATUS');
});
test('old native callback cannot write into same owner ID with a new auth object',()=>{
 const f=fixture();f.lock();f.sameIdRelogin();
 f.ctx.currentBoard={name:'NEW-LOGIN-OUTFIT'};
 f.mount.onChange({name:'PRIVATE-OLD-LOGIN'});
 f.mount.onStatus('PRIVATE-OLD-LOGIN');
 assert.equal(f.ctx.currentBoard.name,'NEW-LOGIN-OUTFIT');
});
test('clearing the UI requires neither a live controller nor network access',()=>{
 const f=fixture();f.ctx.nativeLossless04=null;delete f.ctx.window.nativeLossless04Bridge;
 f.lock();
 assert.equal(f.nodes.boardName.value,'');
 assert.equal(f.nodes.boardSaveStatus.textContent,'Signed-out private outfit cleared. Reopen Outfit Builder.');
});
test('production source clears private board before retiring old controller effects',()=>{
 assert.match(handler,/nativeLossless04=null;\s*currentBoard=cleanOutfitBoard\(\{\},\[\]\);\s*savedOutfitBoards=\[\];/);
 assert.match(handler,/syncBoardInputs\(\);\s*nativeLossless04ClearPreview\(\);/);
 assert.match(handler,/window\[key\]=null;\s*try\{bridge\?\.dispose\?\.\(\);\}catch\{\}/);
 assert.match(handler,/if\(!nativeLossless04Active\)return;/);
});
