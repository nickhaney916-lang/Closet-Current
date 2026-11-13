'use strict';
// Execute the actual owner-board UI lease, draft persistence finalizers,
// draft load/retry controls, and Save Outfit button from public/outfit-board.js.
// All IDs, photos and database contents are synthetic. No hosted data accessed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'required source boundary '+start);
 return source.slice(a,b);
}
const leaseSource=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const storeSource=extract('async function storeBoard({replaceDraft=null}={}){','async function loadLatestBoardDraft(){');
const loadSource=extract('async function loadLatestBoardDraft(){','function syncBoardInputs(){');
const actionSource=extract("$('refreshOutfitWardrobe').onclick=async()=>{","$('closeBoardPicker').onclick=");
const saveSource=extract("$('saveBoard').onclick=async()=>{",'function renderTrendReferences()');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function fixture(){
 let revoked=false;
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const events=[];
 const nodes={
  authGate:{hidden:true},appShell:{hidden:false},
  retryBoardDraft:{hidden:false},boardDraftConflictActions:{hidden:true},
  boardSaveStatus:{textContent:''},refreshOutfitWardrobe:{hidden:true},
  saveBoard:{disabled:false},boardName:{focus(){events.push('focus')}},loadLatestBoardDraft:{},keepLocalBoardDraft:{}
 };
 const makeDB=owner=>({
  name:'closet-current-user-'+owner,
  transaction(){
   return {
    objectStore(){
     return {
      get(){
       const request={};
       queueMicrotask(()=>{
        request.result={current:{slots:{top:'same-id'}},saved:[]};
        request.onsuccess?.();
       });
       return request;
      }
     };
    }
   };
  }
 });
 const ctx={
  window:{closetAuth:auth},db:makeDB('owner-a'),captureOperationEpoch:3,
  nativeLossless04Active:false,boardStatusSerial:0,boardConflictDraft:null,
  boardPendingWrites:0,boardDraftTimer:null,
  boardExpectedStoredDraft:'null',boardCommittedDraft:'null',
  currentBoard:{slots:{top:'same-id'},ideas:{}},savedOutfitBoards:[],
  items:[{id:'same-id',ownerId:'owner-a',image:'synthetic-JPEG-A'}],
  $(id){return nodes[id]},queueMicrotask,
  cancelBoardDraftTimer(){events.push('cancel')},
  boardDraftStatus(message,retry=false){events.push('status:'+message);nodes.boardSaveStatus.textContent=message;nodes.retryBoardDraft.hidden=!retry},
  boardHasUnsavedDraft(){return false},
  renderSavedOutfitBoards(){events.push('render-saved')},
  persistBoardState:async()=>{events.push('persist')},
  saveOwnedOutfit:async board=>{events.push('save:'+board.slots.top)},
  refreshSavedWardrobeForOutfits:async()=>{events.push('refresh')},
  queued:fn=>fn(),
  cleanOutfitBoard:x=>x,
  syncBoardInputs(){events.push('sync')},
  renderOutfitBoard(){events.push('render-board')},
  nativeLossless04Notify(){events.push('native-notify')},
  nativeLossless04:null
 };
 vm.createContext(ctx);
 vm.runInContext(leaseSource+storeSource+loadSource+actionSource+saveSource,ctx);
 return {ctx,auth,nodes,events,
  swap(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db=makeDB('owner-b');ctx.captureOperationEpoch++;
   ctx.items=[{id:'same-id',ownerId:'owner-b',image:'private-photo-B'}];},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db=makeDB('owner-a');ctx.captureOperationEpoch++;},
  bump(){ctx.captureOperationEpoch++},
  revoke(){revoked=true},
  wrongDB(){ctx.db=makeDB('other')},
  setPersistPending(){
   const gate=deferred(),started=deferred();
   ctx.persistBoardState=()=>{events.push('persist');started.resolve();return gate.promise};
   return {...gate,started:started.promise};
  },
  setSavePending(){
   const gate=deferred(),started=deferred();
   ctx.saveOwnedOutfit=()=>{events.push('save-start');started.resolve();return gate.promise};
   return {...gate,started:started.promise};
  },
  setRefreshPending(){
   const gate=deferred(),started=deferred();
   ctx.refreshSavedWardrobeForOutfits=()=>{events.push('refresh-start');started.resolve();return gate.promise};
   return {...gate,started:started.promise};
  }
 };
}
test('current signed owner draft store preserves successful re-render and status',async()=>{
 const f=fixture();const ok=await f.ctx.storeBoard();
 assert.equal(ok,true);
 assert.deepEqual(f.events,['cancel','status:Saving outfit changes…','persist','render-saved','status:Outfit changes saved on this device.']);
});
test('account switch during draft persistence never updates new UI or saved roster',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.ctx.storeBoard();await p.started;
 f.swap();f.nodes.boardSaveStatus.textContent='Owner B screen';p.resolve();assert.equal(await job,false);
 assert.deepEqual(f.events,['cancel','status:Saving outfit changes…','persist']);
 assert.equal(f.nodes.boardSaveStatus.textContent,'Owner B screen');
});
test('same-ID new login revokes old store UI',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.ctx.storeBoard();await p.started;
 f.relogin();p.resolve();assert.equal(await job,false);assert.equal(f.events.includes('render-saved'),false);
});
test('auth revocation during draft save refuses previous account finalizer',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.ctx.storeBoard();await p.started;
 f.revoke();p.resolve();assert.equal(await job,false);assert.equal(f.events.includes('render-saved'),false);
});
test('capture epoch rotation cancels late store result in same owner',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.ctx.storeBoard();await p.started;
 f.bump();p.resolve();assert.equal(await job,false);assert.equal(f.events.includes('render-saved'),false);
});
test('stale store rejection suppresses old owner error UI',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.ctx.storeBoard();await p.started;
 f.swap();p.reject(Error('PRIVATE A photo label'));assert.equal(await job,false);
 assert.equal(f.events.some(x=>x.includes('PRIVATE')),false);
});
test('same-owner storage rejection keeps generic retry status',async()=>{
 const f=fixture();f.ctx.persistBoardState=async()=>{throw Error('PRIVATE original-JPEG A')};
 assert.equal(await f.ctx.storeBoard(),false);
 assert.match(f.nodes.boardSaveStatus.textContent,/This outfit could not be saved/);
 assert.equal(f.nodes.retryBoardDraft.hidden,false);
 assert.doesNotMatch(f.nodes.boardSaveStatus.textContent,/PRIVATE/);
});
test('same-owner conflict preserves existing helpful choice text',async()=>{
 const f=fixture();f.ctx.persistBoardState=async()=>{const e=Error('hidden');e.code='OUTFIT_DRAFT_CONFLICT';throw e;};
 assert.equal(await f.ctx.storeBoard(),false);
 assert.match(f.nodes.boardSaveStatus.textContent,/Another tab changed this outfit draft/);
});
test('newer board status serial does not get overwritten by previous save',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.ctx.storeBoard();await p.started;
 f.ctx.boardStatusSerial++;f.nodes.boardSaveStatus.textContent='Newer unsaved edit';
 p.resolve();assert.equal(await job,true);assert.equal(f.nodes.boardSaveStatus.textContent,'Newer unsaved edit');
});
test('Save Outfit current signed owner displays successful receipt and reenables button',async()=>{
 const f=fixture();await f.nodes.saveBoard.onclick();
 assert.equal(f.events.includes('save:same-id'),true);
 assert.equal(f.events.includes('render-saved'),true);
 assert.match(f.nodes.boardSaveStatus.textContent,/Outfit saved with references/);
 assert.equal(f.nodes.saveBoard.disabled,false);
});
test('Save Outfit blocked when owner signed out',async()=>{
 const f=fixture();f.nodes.authGate.hidden=false;await f.nodes.saveBoard.onclick();
 assert.deepEqual(f.events,[]);assert.equal(f.nodes.saveBoard.disabled,false);
});
test('Save Outfit blocked on private database mismatch',async()=>{
 const f=fixture();f.wrongDB();await f.nodes.saveBoard.onclick();
 assert.deepEqual(f.events,[]);
});
test('Save Outfit preserves no-clothing validation without disabling button',async()=>{
 const f=fixture();f.ctx.currentBoard.slots={};await f.nodes.saveBoard.onclick();
 assert.match(f.nodes.boardSaveStatus.textContent,/Choose at least one piece/);
 assert.equal(f.nodes.saveBoard.disabled,false);
});
test('Save Outfit respects existing fifty-saved limit',async()=>{
 const f=fixture();f.ctx.savedOutfitBoards=Array(50).fill({});
 await f.nodes.saveBoard.onclick();
 assert.match(f.nodes.boardSaveStatus.textContent,/50 outfits/);
 assert.equal(f.events.includes('save:same-id'),false);
});
test('old signed owner after Save Outfit commit never changes the next UI',async()=>{
 const f=fixture(),p=f.setSavePending(),job=f.nodes.saveBoard.onclick();await p.started;
 f.swap();f.nodes.boardSaveStatus.textContent='Owner B private screen';f.nodes.saveBoard.disabled=true;
 p.resolve();await job;
 assert.deepEqual(f.events,['cancel','save-start']);
 assert.equal(f.nodes.saveBoard.disabled,true);
 assert.equal(f.nodes.boardSaveStatus.textContent,'Owner B private screen');
});
test('same-ID relogin after Save Outfit persist cannot show stale success',async()=>{
 const f=fixture(),p=f.setSavePending(),job=f.nodes.saveBoard.onclick();await p.started;
 f.relogin();p.resolve();await job;
 assert.equal(f.events.includes('render-saved'),false);assert.equal(f.nodes.saveBoard.disabled,true);
});
test('old owner Save Outfit failure does not expose raw original metadata',async()=>{
 const f=fixture(),p=f.setSavePending(),job=f.nodes.saveBoard.onclick();await p.started;
 f.swap();p.reject(Error('PRIVATE photo A metadata'));await job;
 assert.equal(f.events.some(x=>x.includes('PRIVATE')),false);
});
test('current owner Save Outfit error generic without private disclosure',async()=>{
 const f=fixture();f.ctx.saveOwnedOutfit=async()=>{throw Error('PRIVATE source JPEG B')};
 await f.nodes.saveBoard.onclick();
 assert.equal(f.nodes.boardSaveStatus.textContent,'Could not save this outfit. Please try again.');
});
test('changed clothing error lets owner refresh with generic instruction',async()=>{
 const f=fixture();f.ctx.saveOwnedOutfit=async()=>{const e=Error('PRIVATE filename');e.code='OUTFIT_WARDROBE_CHANGED';throw e;};
 await f.nodes.saveBoard.onclick();
 assert.match(f.nodes.boardSaveStatus.textContent,/Selected clothing changed/);
 assert.equal(f.nodes.refreshOutfitWardrobe.hidden,false);
 assert.doesNotMatch(f.nodes.boardSaveStatus.textContent,/PRIVATE/);
});
test('Refresh closet success only focuses original signed owner',async()=>{
 const f=fixture();await f.nodes.refreshOutfitWardrobe.onclick();
 assert.deepEqual(f.events,['refresh','focus']);
});
test('Refresh closet late completion cannot focus new account',async()=>{
 const f=fixture(),p=f.setRefreshPending(),job=f.nodes.refreshOutfitWardrobe.onclick();await p.started;
 f.swap();p.resolve();await job;assert.deepEqual(f.events,['refresh-start']);
});
test('Refresh failure for same signed owner displays safe text',async()=>{
 const f=fixture();f.ctx.refreshSavedWardrobeForOutfits=async()=>{throw Error('PRIVATE original photo A');};
 await f.nodes.refreshOutfitWardrobe.onclick();
 assert.equal(f.nodes.boardSaveStatus.textContent,'Could not refresh your private closet. Reopen My Closet and try again.');
});
test('Refresh failure after sign-out never writes old private error',async()=>{
 const f=fixture(),p=f.setRefreshPending(),job=f.nodes.refreshOutfitWardrobe.onclick();await p.started;
 f.swap();p.reject(Error('PRIVATE'));await job;assert.deepEqual(f.events,['refresh-start']);
});
test('Retry draft success focuses same owner',async()=>{
 const f=fixture();await f.nodes.retryBoardDraft.onclick();assert.equal(f.events.includes('focus'),true);
});
test('Retry draft completion cannot focus new account',async()=>{
 const f=fixture(),p=f.setPersistPending(),job=f.nodes.retryBoardDraft.onclick();await p.started;
 f.swap();p.resolve();await job;assert.equal(f.events.includes('focus'),false);
});
test('Load latest draft can read signed-owner stored state and refocus',async()=>{
 const f=fixture();await f.nodes.loadLatestBoardDraft.onclick();
 assert.equal(f.events.includes('sync'),true);
 assert.equal(f.events.includes('render-board'),true);
 assert.equal(f.events.includes('focus'),true);
});
test('Load latest private draft refuses signed epoch switch',async()=>{
 const f=fixture(),p=deferred(),started=deferred();
 f.ctx.queued=fn=>{started.resolve();return p.promise.then(fn);};
 const run=f.nodes.loadLatestBoardDraft.onclick();await started.promise;
 f.bump();p.resolve();await run;assert.equal(f.events.includes('focus'),false);
 assert.equal(f.events.some(x=>x.includes('PRIVATE')),false);
});
test('Load latest draft raw error stays generic',async()=>{
 const f=fixture();f.ctx.queued=()=>Promise.reject(Error('PRIVATE filename'));
 await f.nodes.loadLatestBoardDraft.onclick();
 assert.equal(f.nodes.boardSaveStatus.textContent,'Could not load the latest outfit draft. Your unsaved changes are still here.');
});
test('Keep local draft uses exact initial conflict and refocuses only when saved',async()=>{
 const f=fixture();f.ctx.boardConflictDraft={stored:'old',owner:'owner-a'};
 const args=[];f.ctx.persistBoardState=async input=>{args.push(input);};
 await f.nodes.keepLocalBoardDraft.onclick();
 assert.equal(args.length,1);assert.equal(args[0].replaceDraft.owner,'owner-a');
 assert.equal(f.events.includes('focus'),true);
});
test('Keep local draft after account switch cannot focus',async()=>{
 const f=fixture(),p=f.setPersistPending();
 f.ctx.boardConflictDraft={stored:'old',owner:'owner-a'};
 const run=f.nodes.keepLocalBoardDraft.onclick();await p.started;
 f.swap();p.resolve();await run;assert.equal(f.events.includes('focus'),false);
});
test('source retains exact-session pending timer guard and original transaction assertions',()=>{
 assert.match(source,/scheduledEpoch=captureOperationEpoch/);
 assert.match(source,/captureOperationEpoch!==scheduledEpoch/);
 assert.match(leaseSource,/window\.closetAuth!==auth/);
 assert.match(leaseSource,/epoch!==captureOperationEpoch/);
 assert.match(leaseSource,/auth\.assertCurrent\?\.\(\)/);
 assert.match(loadSource,/epoch!==captureOperationEpoch/);
 assert.match(storeSource,/if\(!lease\.current\(\)\)return false;/);
 assert.doesNotMatch(saveSource,/\+error\.message/);
 assert.doesNotMatch(actionSource,/boardDraftStatus\(error\.message\)/);
 assert.match(source,/async function persistBoardState\(/);
});
