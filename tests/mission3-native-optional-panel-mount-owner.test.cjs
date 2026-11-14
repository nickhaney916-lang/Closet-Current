'use strict';
// Actual production optional native research panel publication and sign-out
// code, with synthetic signed accounts. No hosted auth, private JPEG or phones.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const src=readFileSync('public/outfit-board.js','utf8');
function sourceBetween(a,b){const i=src.indexOf(a),j=src.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Production source missing '+a);return src.slice(i,j)}
const sourceLeases=sourceBetween('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const sessionLock=sourceBetween("window.addEventListener('closet:session-locked',()=>{",'async function persistBoardState(');
const init=sourceBetween('const outfitBoardReady=(async()=>{','const TREND_DATA_URL=');
function fixture(){
 const events=[],listeners={},nodes={
  authGate:{hidden:true},appShell:{hidden:false},retryBoardDraft:{hidden:false},
  boardDraftConflictActions:{hidden:false},boardSaveStatus:{textContent:'previous-A'}
 };
 const owner={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 let revoked=false,active=true;
 const consumer={status(){return {active}},dispose(){events.push('dispose:consumer')}};
 const ctx={
  window:{closetAuth:owner,addEventListener(n,fn){listeners[n]=fn}},
  db:{name:'closet-current-user-owner-a'},captureOperationEpoch:12,
  nativeLossless04:consumer,nativeLossless04Active:true,
  currentBoard:{slots:{top:'owner-a'}},savedOutfitBoards:[{owner:'owner-a'}],
  boardConflictDraft:{owner:'owner-a'},boardStatusSerial:2,
  $(id){return nodes[id]},
  cleanOutfitBoard(v){events.push('empty-board');return {...v}},
  nativeLossless04ClearPreview(){events.push('clear-preview')},
  cancelBoardDraftTimer(){events.push('cancel-timer')},
  syncBoardInputs(){events.push('sync')},
  renderOutfitBoard(){events.push('render')},
  boardInitialized:true
 };
 vm.createContext(ctx);vm.runInContext(sourceLeases+sessionLock,ctx);
 const callbacks=ctx.beginNativeBoard04OwnerCallbacks();
 function panel(name){return {name,dispose(){events.push('dispose:'+name)}}}
 function publish(panelName='3d',key='native3D05Bridge',p=panel(panelName)){
  return ctx.publishNative04OwnerPanel(callbacks,consumer,p,key);
 }
 return {ctx,events,nodes,callbacks,consumer,panel,publish,
  swap(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++},
  revoke(){revoked=true},epoch(){ctx.captureOperationEpoch++},
  wrongDB(){ctx.db={name:'not-owner-private'}},inactive(){active=false},
  replaceConsumer(){ctx.nativeLossless04={status(){return {active:true}}}},
  signedOut(){listeners['closet:session-locked']?.()}
 };
}
const bridgeNames=['native3D05Bridge','nativePhotoReadiness08Bridge','styleOwnedLive03Bridge','nativeMobile09Bridge'];
for(const key of bridgeNames){
 test('valid owner publishes '+key+' without disposal',()=>{
  const f=fixture(),p=f.panel(key);assert.equal(f.publish(key,key,p),true);
  assert.equal(f.ctx.window[key],p);assert.deepEqual(f.events,[]);
 });
 test('account change disposes delayed '+key+' rather than publishing',()=>{
  const f=fixture(),p=f.panel(key);f.swap();
  assert.equal(f.publish(key,key,p),false);
  assert.equal(f.ctx.window[key],undefined);
  assert.deepEqual(f.events,['dispose:'+key]);
 });
}
test('same-ID new login cannot publish old original-photo readiness',()=>{
 const f=fixture();f.relogin();assert.equal(f.publish('old','nativePhotoReadiness08Bridge'),false);
 assert.deepEqual(f.events,['dispose:old']);
});
test('replaced active native consumer rejects old panel without replacing current',()=>{
 const f=fixture();f.replaceConsumer();
 assert.equal(f.publish('old','native3D05Bridge'),false);
 assert.equal(f.ctx.window.native3D05Bridge,undefined);
});
test('revoked auth prevents old panel publication',()=>{
 const f=fixture();f.revoke();assert.equal(f.publish('old'),false);
});
test('inactive private research controller prevents publication and is disposed',()=>{
 const f=fixture();f.inactive();assert.equal(f.publish('old'),false);
 assert.deepEqual(f.events,['dispose:old']);
});
test('new capture epoch blocks late panel mount from previous login',()=>{
 const f=fixture();f.epoch();assert.equal(f.publish('old'),false);
});
test('signed-out gate blocks panel publication',()=>{
 const f=fixture();f.nodes.authGate.hidden=false;assert.equal(f.publish('old'),false);
});
test('hidden app shell blocks panel publication',()=>{
 const f=fixture();f.nodes.appShell.hidden=true;assert.equal(f.publish('old'),false);
});
test('wrong signed-owner private DB refuses publication',()=>{
 const f=fixture();f.wrongDB();assert.equal(f.publish('old'),false);
});
test('stale panel dispose error never throws or leaks private contents',()=>{
 const f=fixture();f.swap();const p={dispose(){throw Error('PRIVATE original JPEG-A')}};
 assert.doesNotThrow(()=>f.publish('old','native3D05Bridge',p));
});
test('session lock immediately removes all four mounted panels plus native controller',()=>{
 const f=fixture();
 for(const key of bridgeNames){assert.equal(f.publish(key,key),true)}
 f.ctx.window.nativeLossless04Bridge=f.consumer;
 f.signedOut();
 for(const key of bridgeNames)assert.equal(f.ctx.window[key],null);
 assert.equal(f.ctx.window.nativeLossless04Bridge,null);
 assert.equal(f.ctx.nativeLossless04,null);
 assert.equal(f.ctx.savedOutfitBoards.length,0);
 assert.equal(f.ctx.currentBoard.slots?.top,undefined);
 assert.equal(f.ctx.boardConflictDraft,null);
 for(const key of bridgeNames)assert.equal(f.events.filter(x=>x==='dispose:'+key).length,1);
 assert.equal(f.events.filter(x=>x==='dispose:consumer').length,1);
});
test('session lock cleanup proceeds despite throwing disposed panel',()=>{
 const f=fixture();f.ctx.window.native3D05Bridge={dispose(){throw Error('PRIVATE old 3D')}};
 f.ctx.window.nativePhotoReadiness08Bridge={dispose(){f.events.push('cleaned-photo')}};
 f.signedOut();assert.ok(f.events.includes('cleaned-photo'));
 assert.equal(f.ctx.window.native3D05Bridge,null);
 assert.equal(f.ctx.window.nativePhotoReadiness08Bridge,null);
});
test('old panel completion after signed lock does not republish old bridge',()=>{
 const f=fixture();f.signedOut();f.swap();
 const next={dispose(){f.events.push('late-dispose')}};
 assert.equal(f.publish('late','native3D05Bridge',next),false);
 assert.equal(f.ctx.window.native3D05Bridge,null);
 assert.ok(f.events.includes('late-dispose'));
});
test('no extra clearing in default consumer mode',()=>{
 const f=fixture();f.ctx.nativeLossless04Active=false;f.signedOut();
 assert.equal(f.events.includes('clear-preview'),false);
});
test('mounts retain exact controller and check owner before/after import, after mount',()=>{
 for(const [mount,key] of [
  ['mountNative3D05','native3D05Bridge'],
  ['mountNativeReadiness08','nativePhotoReadiness08Bridge'],
  ['mountStyleOwnedLive03','styleOwnedLive03Bridge'],
  ['mountNativeMobile09','nativeMobile09Bridge']
 ]){
  const needle='publishNative04OwnerPanel(callbacks,panelConsumer,panel,'+JSON.stringify(key).replace(/"/g,"'")+')';
  assert.ok(init.includes(needle),mount+' lacks exact-owner final publishing guard');
  const ix=init.indexOf('const {'+mount+'}=await import('),next=init.indexOf('publishNative04OwnerPanel',ix);
  assert.ok(ix>=0&&next>ix&&init.slice(ix,next).includes('if(!callbacks.current())return'),
   mount+' must check owner after imported module and before panel mount');
 }
});
test('research status callback errors after session change cannot be displayed',()=>{
 assert.match(init,/catch\(error\)\{if\(callbacks\.current\(\)\)nativeLossless04Notify\(error\);\}/);
 assert.match(sourceLeases,/window\.closetAuth!==auth/);
 assert.match(sourceLeases,/epoch!==captureOperationEpoch/);
});
