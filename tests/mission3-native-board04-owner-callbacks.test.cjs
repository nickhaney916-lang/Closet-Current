'use strict';
// Actual BOARD04 callback/lease source executed with synthetic owner accounts.
// No live Auth, hosted database, private photo or real device is used.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function extract(start,end){const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Expected source '+start);return source.slice(i,j);}
const leaseSource=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const lockSource=extract("window.addEventListener('closet:session-locked',()=>{",'async function persistBoardState(');
const initSource=extract('const outfitBoardReady=(async()=>{','const TREND_DATA_URL=');
function fixture(){
 const events=[],listener={},nodes={
  authGate:{hidden:true},appShell:{hidden:false},boardSaveStatus:{textContent:'idle'},
  retryBoardDraft:{hidden:false},boardDraftConflictActions:{hidden:false}
 };
 let revoked=false;
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked')}};
 const owner={name:'closet-current-user-owner-a'};
 const ctx={
  window:{closetAuth:auth,addEventListener(name,fn){listener[name]=fn},
   nativePhotoReadiness08Bridge:{clear(){events.push('clear-readiness')}}},
  db:owner,captureOperationEpoch:3,
  nativeLossless04:null,nativeLossless04Active:true,
  boardInitialized:true,boardStatusSerial:0,
  boardConflictDraft:{owner:'a'},
  savedOutfitBoards:[{name:'owner-a'}],currentBoard:{slots:{top:'a'}},
  $(id){return nodes[id]},
  cleanOutfitBoard(board){events.push('clean');return {...board}},
  nativeLossless04ClearPreview(){events.push('clear-preview')},
  syncBoardInputs(){events.push('sync')},
  renderOutfitBoard(){events.push('render')},
  cancelBoardDraftTimer(){events.push('cancel-timer')}
 };
 vm.createContext(ctx);
 vm.runInContext(leaseSource+lockSource,ctx);
 const consumer={
  status(){return {active:true}},
  readOnlySnapshot(){return {saved:[{name:'saved-a'}]}},
  dispose(){events.push('dispose')}
 };
 const callbacks=ctx.beginNativeBoard04OwnerCallbacks();
 return {ctx,events,nodes,consumer,callbacks,
  swap(){ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};},
  relogin(){ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};},
  rotate(){ctx.captureOperationEpoch++},
  revoke(){revoked=true},
  attach(){return callbacks.attach(consumer)},
  lock(){listener['closet:session-locked']?.()}
 };
}
test('active exact owner callback lease created',()=>{
 const f=fixture();assert.ok(f.callbacks);assert.equal(f.callbacks.current(),true);
});
test('owner status string shown in initiating owner session',()=>{
 const f=fixture();f.callbacks.onStatus('Private owner-a loaded');
 assert.equal(f.nodes.boardSaveStatus.textContent,'Private owner-a loaded');
});
test('non-string status becomes generic message, never raw object',()=>{
 const f=fixture();f.callbacks.onStatus({message:'PRIVATE original A'});
 assert.equal(f.nodes.boardSaveStatus.textContent,'Private outfit status is unavailable. Reopen Outfit Builder.');
});
test('pre-attach load callback sets current board but does not render stale records',()=>{
 const f=fixture();const row={slots:{top:'original-a'}};
 f.callbacks.onChange(row);assert.equal(f.ctx.currentBoard,row);
 assert.deepEqual(f.events,['clear-readiness']);
});
test('attach binds the exact originating native controller',()=>{
 const f=fixture();assert.equal(f.attach(),true);assert.equal(f.ctx.nativeLossless04,f.consumer);
});
test('current attached controller change renders original owner private roster',()=>{
 const f=fixture();f.attach();const row={slots:{top:'garment-a'}};
 f.callbacks.onChange(row);assert.equal(f.ctx.currentBoard,row);
 assert.equal(f.ctx.savedOutfitBoards[0].name,'saved-a');
 assert.deepEqual(f.events,['clear-readiness','sync','render']);
});
test('revocation under same authorized owner clears owned preview',()=>{
 const f=fixture();f.attach();f.callbacks.onChange(null,{revoked:true});
 assert.deepEqual(f.events,['clear-readiness','clean','clear-preview']);
 assert.equal(f.ctx.savedOutfitBoards.length,0);
});
test('owner switch invalidates attached callback status and row',()=>{
 const f=fixture();f.attach();f.swap();f.nodes.boardSaveStatus.textContent='owner B';
 const before=f.ctx.currentBoard;
 f.callbacks.onStatus('PRIVATE owner A');
 f.callbacks.onChange({slots:{top:'owner-a'}});
 assert.equal(f.nodes.boardSaveStatus.textContent,'owner B');
 assert.equal(f.ctx.currentBoard,before);assert.deepEqual(f.events,[]);
});
test('old controller revoke after account switch must not erase new owner board',()=>{
 const f=fixture();f.attach();f.swap();
 f.ctx.currentBoard={slots:{top:'owner-b'}};f.callbacks.onChange(null,{revoked:true});
 assert.equal(f.ctx.currentBoard.slots.top,'owner-b');
 assert.equal(f.events.includes('clear-preview'),false);
});
test('same ID relogin revokes callbacks despite matching owner ID',()=>{
 const f=fixture();f.attach();f.relogin();f.callbacks.onStatus('PRIVATE');
 assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
});
test('same auth object after epoch rotation invalidates stale callbacks',()=>{
 const f=fixture();f.attach();f.rotate();f.callbacks.onStatus('stale');
 assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
});
test('revoked signed Auth blocks callback and change',()=>{
 const f=fixture();f.attach();f.revoke();
 f.callbacks.onChange({slots:{top:'A'}});assert.deepEqual(f.events,[]);
});
test('hidden app shell or visible auth gate blocks callbacks',()=>{
 const f=fixture();f.attach();f.nodes.authGate.hidden=false;
 f.callbacks.onStatus('A');assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
 f.nodes.authGate.hidden=true;f.nodes.appShell.hidden=true;
 f.callbacks.onStatus('A');assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
});
test('wrong private IndexedDB name refuses callback lease',()=>{
 const f=fixture();f.ctx.db={name:'not-private'};f.callbacks.onStatus('owner-a');
 assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
});
test('old controller replaced in same signed account cannot mutate current UI',()=>{
 const f=fixture();f.attach();f.ctx.nativeLossless04={status(){return {active:true}}};
 f.callbacks.onStatus('old');f.callbacks.onChange({slots:{top:'old'}});
 assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
 assert.deepEqual(f.events,[]);
});
test('controller obtained after account switch is disposed, never exposed',()=>{
 const f=fixture();f.swap();assert.equal(f.attach(),false);
 assert.equal(f.ctx.nativeLossless04,null);
 assert.deepEqual(f.events,['dispose']);
});
test('controller obtained after same-ID relogin is disposed',()=>{
 const f=fixture();f.relogin();assert.equal(f.attach(),false);
 assert.deepEqual(f.events,['dispose']);
});
test('consumer dispose failure on revoked session is harmless',()=>{
 const f=fixture();f.consumer.dispose=()=>{throw Error('PRIVATE a')};
 f.swap();assert.doesNotThrow(()=>f.attach());
 assert.equal(f.ctx.nativeLossless04,null);
});
test('session lock immediately clears former owner preview and old draft conflict',()=>{
 const f=fixture();f.attach();f.lock();
 assert.equal(f.ctx.currentBoard.slots?.top,undefined);
 assert.equal(f.ctx.savedOutfitBoards.length,0);
 assert.equal(f.ctx.boardConflictDraft,null);
 assert.deepEqual(f.events,['cancel-timer','clean','clear-preview']);
});
test('old revoke after switch cannot re-clear a new preview; lock remains authoritative',()=>{
 const f=fixture();f.attach();f.lock();f.swap();
 f.ctx.currentBoard={slots:{top:'new-B'}};
 f.callbacks.onChange(null,{revoked:true});
 assert.equal(f.ctx.currentBoard.slots.top,'new-B');
 assert.equal(f.events.filter(x=>x==='clear-preview').length,1);
});
test('status callback can be scheduled asynchronously then revoked before execution',async()=>{
 const f=fixture();f.attach();
 const pending=Promise.resolve().then(()=>f.callbacks.onStatus('PRIVATE delayed A'));
 f.swap();await pending;assert.equal(f.nodes.boardSaveStatus.textContent,'idle');
});
test('initialization uses signed callback lease after awaits and before publishing bridge',()=>{
 assert.match(initSource,/const callbacks=beginNativeBoard04OwnerCallbacks\(\)/);
 assert.match(initSource,/if\(!callbacks\.current\(\)\)return/);
 assert.match(initSource,/onChange:callbacks\.onChange/);
 assert.match(initSource,/onStatus:callbacks\.onStatus/);
 assert.match(initSource,/if\(!callbacks\.attach\(created\)\)return/);
 const attach=initSource.indexOf('if(!callbacks.attach(created))return');
 const bridge=initSource.indexOf('window.nativeLossless04Bridge=nativeLossless04');
 assert.ok(bridge>attach);
});
test('optional 3D and original-photo panel status use owner-bound callbacks',()=>{
 assert.match(initSource,/mountNative3D05\([\s\S]*?onStatus:callbacks\.onStatus/);
 assert.match(initSource,/mountNativeReadiness08\([\s\S]*?onStatus:callbacks\.onStatus/);
});
test('stale initialization errors never clear a newer owner preview',()=>{
 assert.match(initSource,/if\(callbacks\?\.current\(\)\)\{nativeLossless04Notify\(error\);nativeLossless04ClearPreview\(\);\}/);
});
