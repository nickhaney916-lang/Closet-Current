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
 nodes.boardSummary={textContent:'PRIVATE-A-OUTFIT-SUMMARY'};
 nodes.boardGapStatus={textContent:'PRIVATE-A-OWNED-CLOTHING-IDEAS'};
 nodes.boardPickerTitle={textContent:'PRIVATE-A-PICKER'};
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
  cancelBoardDraftTimer(){calls.push('cancel-timer')},
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
test('default non-native session lock scrubs previous owner from outfit memory and DOM',()=>{
 const f=fixture({native:false});f.lock();
 assert.equal(f.ctx.currentBoard.name,'');
 assert.equal(f.ctx.currentBoard.slots.top,undefined);
 assert.equal(f.ctx.savedOutfitBoards.length,0);
 for(const id of inputIds)assert.equal(f.nodes[id].value,'','retained default outfit field '+id);
 for(const id of gridIds)assert.equal(f.nodes[id].entries.length,0);
 assert.equal(f.nodes.boardPicker.open,false);
 assert.equal(f.nodes.boardSummary.textContent,'Private outfits locked · sign in again.');
 assert.equal(f.nodes.boardGapStatus.textContent,'');
 assert.equal(f.nodes.boardPickerTitle.textContent,'Choose clothing after sign-in');
 assert.equal(f.nodes.boardSaveStatus.textContent,'Signed-out private outfit cleared. Reopen Outfit Builder.');
 assert.equal(f.ctx.boardCommittedDraft,JSON.stringify(f.ctx.currentBoard));
 assert.equal(f.ctx.boardExpectedStoredDraft,'null');
 assert.equal(f.ctx.choosingSlot,'shoes');
 assert.equal(f.nodes.retryBoardDraft.hidden,true);
 assert.equal(f.nodes.boardDraftConflictActions.hidden,true);
 // Default mode does not interfere with research-only controllers/panels.
 assert.equal(f.ctx.nativeLossless04,f.originalConsumer);
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
 assert.match(handler,/if\(nativeMode\)nativeLossless04=null;\s*currentBoard=cleanOutfitBoard\(\{\},\[\]\);\s*savedOutfitBoards=\[\];/);
 assert.match(handler,/syncBoardInputs\(\);\s*nativeLossless04ClearPreview\(\);/);
 assert.match(handler,/window\[key\]=null;\s*try\{bridge\?\.dispose\?\.\(\);\}catch\{\}/);
 assert.match(handler,/const nativeMode=nativeLossless04Active;/);
 assert.match(handler,/boardCommittedDraft=JSON.stringify\(currentBoard\);\s*boardExpectedStoredDraft='null';/);
});

test('default non-native lock is idempotent and clears private draft metadata',()=>{
 const f=fixture({native:false});
 f.lock();f.lock();
 assert.equal(f.ctx.currentBoard.name,'');
 assert.equal(f.ctx.savedOutfitBoards.length,0);
 assert.equal(f.ctx.boardExpectedStoredDraft,'null');
 assert.equal(f.nodes.boardName.value,'');
 assert.equal(f.calls.filter(x=>x.startsWith('dispose:')).length,0);
});
test('default private board backups cannot return an old owner outfit after logout',()=>{
 const f=fixture({native:false});f.lock();
 const snap=JSON.parse(JSON.stringify({current:f.ctx.currentBoard,saved:f.ctx.savedOutfitBoards}));
 assert.equal(snap.current.name,'');
 assert.equal(Object.keys(snap.current.slots).length,0);
 assert.deepEqual(snap.saved,[]);
});
test('default owner scrub does not mutate persistent wardrobe data',()=>{
 const f=fixture({native:false});f.lock();
 assert.equal(f.calls.filter(x=>/persist|store|delete|write/.test(x)).length,0);
});

const startup=slice('const outfitBoardReady=(async()=>{','const TREND_DATA_URL=');
function defaultLoadFixture(){
 const events=[],request={},nodes={
  authGate:{hidden:true},appShell:{hidden:false},boardSaveStatus:{textContent:'INITIAL'}
 };
 const auth={user:{id:'owner-a'},assertCurrent(){if(this.revoked)throw Error('revoked');}};
 const originalDB={name:'closet-current-user-owner-a',
  transaction(name){events.push('read:'+name);return {objectStore(table){
   assert.equal(table,'state');return {get(key){
    assert.equal(key,'outfit-board');events.push('get');return request;
   }};
  }};}
 };
 const ctx={
  window:{closetAuth:auth},db:originalDB,closetReady:Promise.resolve(),
  captureOperationEpoch:10,nativeLossless04Active:false,
  currentBoard:{name:'',slots:{}},savedOutfitBoards:[],
  boardExpectedStoredDraft:'null',boardCommittedDraft:null,
  boardInitialized:false,items:[],
  cleanOutfitBoard:value=>JSON.parse(JSON.stringify(value||{})),
  syncBoardInputs(){events.push('sync')},
  renderOutfitBoard(){events.push('render')},
  $(id){if(!nodes[id])throw Error('missing '+id);return nodes[id]}
 };
 vm.createContext(ctx);
 vm.runInContext(lease+startup,ctx,{timeout:1000});
 async function begin(){
  // VM async continuations run in a separate realm; yield the event loop
  // rather than assuming two host Promise turns finish cross-realm scheduling.
  for(let i=0;i<24&&typeof request.onsuccess!=='function';i++)
   await new Promise(resolve=>setImmediate(resolve));
  assert.equal(typeof request.onsuccess,'function',
   'Actual default Outfit Board did not open its signed owner-private IDB read');
 }
 function release(value){
  request.result=value;
  request.onsuccess();
  return vm.runInContext('outfitBoardReady',ctx);
 }
 return {ctx,events,nodes,request,auth,originalDB,begin,release,
  switchOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++;
  },
  relogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++;
  },
  revoke(){auth.revoked=true},
  hideGate(){nodes.authGate.hidden=false},
  moveDB(){ctx.db={name:'closet-current-user-owner-a'}},
  rotate(){ctx.captureOperationEpoch++}
 };
}
const privateRead={current:{name:'PRIVATE-A-BOARD',slots:{top:'PRIVATE-A-ITEM'}},
 saved:[{name:'PRIVATE-A-SAVED'}]};
test('default owner-valid delayed IndexedDB startup can adopt its own private board',async()=>{
 const f=defaultLoadFixture();await f.begin();
 await f.release(privateRead);
 assert.equal(f.ctx.currentBoard.name,'PRIVATE-A-BOARD');
 assert.equal(f.ctx.savedOutfitBoards[0].name,'PRIVATE-A-SAVED');
 assert.equal(f.ctx.boardInitialized,true);
 assert.equal(f.events.includes('render'),true);
 assert.equal(f.events.includes('sync'),true);
});
for(const [why,change] of [
 ['account switch',f=>f.switchOwner()],
 ['same-ID re-login',f=>f.relogin()],
 ['capture epoch rotation',f=>f.rotate()],
 ['private DB handle replacement',f=>f.moveDB()],
 ['revoked session',f=>f.revoke()],
 ['locked auth gate',f=>f.hideGate()]
]){
 test('old default IndexedDB load cannot repopulate new owner after '+why,async()=>{
  const f=defaultLoadFixture();await f.begin();
  change(f);
  f.ctx.currentBoard={name:'NEW-SESSION-BOARD',slots:{top:'NEW-SESSION-GARMENT'}};
  f.ctx.savedOutfitBoards=[{name:'NEW-SESSION-SAVED'}];
  await f.release(privateRead);
  assert.equal(f.ctx.currentBoard.name,'NEW-SESSION-BOARD');
  assert.equal(f.ctx.savedOutfitBoards[0].name,'NEW-SESSION-SAVED');
  assert.equal(f.ctx.boardExpectedStoredDraft,'null');
  assert.equal(f.ctx.boardInitialized,false);
  assert.equal(f.events.includes('sync'),false);
  assert.equal(f.events.includes('render'),false);
 });
}
test('stale default IndexedDB read error cannot display private previous owner details',async()=>{
 const f=defaultLoadFixture();await f.begin();
 f.switchOwner();
 f.nodes.boardSaveStatus.textContent='NEW OWNER STATUS';
 f.request.onerror();
 await vm.runInContext('outfitBoardReady',f.ctx);
 assert.equal(f.nodes.boardSaveStatus.textContent,'NEW OWNER STATUS');
 assert.equal(f.ctx.boardInitialized,false);
});
test('default startup source binds exact owner database before and after await',()=>{
 assert.match(startup,/ordinaryBoardLease=beginOwnerBoardUiLease\(\)/);
 assert.match(startup,/const ownerDB=db;/);
 assert.match(startup,/ownerDB\.transaction\('state'\)/);
 assert.match(startup,/if\(!ordinaryBoardLease\.current\(\)\)return;/);
 assert.match(startup,/ordinaryBoardLease&&!ordinaryBoardLease\.current\(\)/);
});
