'use strict';
// Execute ACTUAL generated-outfit card owner lease and callback source.
// Synthetic owner accounts and garment records only; no hosted connections.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/closet-stylist.js','utf8');
function between(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start);
 assert.ok(start>=0&&end>start,'Source callback not found '+a);
 return source.slice(start,end);
}
const lease=between('function beginStyledCollectionCardOwnerLease(result,card){','function renderStyledCollection(){');
const editCode=between('  edit.onclick=async()=>{',"  const status=node('p',null,'fine styled-save-status');");
const updateCode=between('  const updateSaveState=(phase,message)=>{','  refresh.onclick=async()=>{');
const refreshCode=between('  refresh.onclick=async()=>{','  save.onclick=async()=>{');
const saveCode=between('  save.onclick=async()=>{','  actions.append(edit,save,refresh);');
const wire=`function __wire(result,board,index,card){
 const edit={isConnected:true,disabled:false},save={isConnected:true,disabled:false},refresh={isConnected:true,disabled:false};
 const status={textContent:''},changed=false;
 const applySaveState=()=>{
  const state=styledCollectionSaveStates.get(result);
  status.textContent=state?.message||'';
  save.textContent=state?.phase==='saved'?'Saved':'Save outfit';
  save.disabled=changed||['saving','saved','wardrobe-changed'].includes(state?.phase);
  edit.disabled=changed||state?.phase==='wardrobe-changed';
  refresh.hidden=state?.phase!=='wardrobe-changed';
 };
 ${editCode}
 ${updateCode}
 ${refreshCode}
 ${saveCode}
 return {edit,save,refresh,status};
}`;
function gate(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});
 return {promise,resolve,reject};
}
function fixture(){
 const item={id:'same-id',ownerId:'owner-a',image:'synthetic-JPEG-A'};
 const result={focusItemId:item.id,context:{request:'Everyday'},board:{slots:{top:item.id}}};
 const card={isConnected:true},events=[];
 let revoked=false;
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const controls={
  authGate:{hidden:true},appShell:{hidden:false},stylist:{hidden:false},
  createCollectionOutfits:{focus(){events.push('focus:outfits')}}
 };
 const ctx={
  window:{closetAuth:auth},db:{name:'closet-current-user-owner-a'},
  items:[item],captureOperationEpoch:9,styledCollectionRequestSerial:3,
  styledCollectionResults:[result],styledCollectionSaveStates:new WeakMap(),
  savedOutfitBoards:[],outfitBoardReady:Promise.resolve(),currentBoard:{slots:{}},
  $(id){return controls[id]},
  cleanOutfitBoard(board,rows){events.push('clean:'+rows[0]?.ownerId);return board;},
  syncBoardInputs(){events.push('sync')},
  renderOutfitBoard(){events.push('render-board')},
  storeBoard:async()=>{events.push('store');return true},
  switchView(view){events.push('view:'+view)},
  saveOwnedOutfit:async board=>{events.push('save:'+board.slots.top)},
  renderSavedOutfitBoards(){events.push('render-saved')},
  refreshSavedWardrobeForOutfits:async()=>{events.push('refresh')}
 };
 vm.createContext(ctx);
 vm.runInContext(lease+wire,ctx);
 const buttons=ctx.__wire(result,result.board,0,card);
 return {
  ctx,item,result,card,auth,controls,buttons,events,
  state(){return ctx.styledCollectionSaveStates.get(result)},
  switchOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.items=[{...item,ownerId:'owner-b',image:'private-B-JPEG'}];
   ctx.captureOperationEpoch++;
  },
  relogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};
   ctx.items=[{...item,image:'different-login-JPEG'}];
   ctx.captureOperationEpoch++;
  },
  revoke(){revoked=true},
  rehydrate(){ctx.items=[{...item,name:'different same-ID garment'}]},
  replaceResults(){ctx.styledCollectionResults=[{...result}]},
  newStylingRequest(){ctx.styledCollectionRequestSerial++},
  waitBoard(){const p=gate();ctx.outfitBoardReady=p.promise;return p}
 };
}
test('active owner Save outfit persists once, shows Saved and renders saved roster',async()=>{
 const f=fixture();
 await f.buttons.save.onclick();
 assert.deepEqual(f.events,['save:same-id','render-saved']);
 assert.equal(f.state().phase,'saved');
 assert.equal(f.buttons.status.textContent,'Saved. Find it in Outfit builder → Saved outfits.');
 assert.equal(f.buttons.save.disabled,true);
});
test('old owner cannot save after account changes while board initializes',async()=>{
 const f=fixture(),p=f.waitBoard(),ongoing=f.buttons.save.onclick();
 f.switchOwner();p.resolve();await ongoing;
 assert.deepEqual(f.events,[]);
 assert.equal(f.state().phase,'saving');
});
test('same-ID new login cannot resume earlier Save outfit',async()=>{
 const f=fixture(),p=f.waitBoard(),ongoing=f.buttons.save.onclick();
 f.relogin();p.resolve();await ongoing;assert.deepEqual(f.events,[]);
});
test('revoked auth cannot complete Save outfit after board initialization',async()=>{
 const f=fixture(),p=f.waitBoard(),ongoing=f.buttons.save.onclick();
 f.revoke();p.resolve();await ongoing;assert.deepEqual(f.events,[]);
});
test('same-ID garment hydration invalidates pending old card save',async()=>{
 const f=fixture(),p=f.waitBoard(),ongoing=f.buttons.save.onclick();
 f.rehydrate();p.resolve();await ongoing;assert.deepEqual(f.events,[]);
});
test('newly generated outfits invalidate old in-flight Save outfit',async()=>{
 const f=fixture(),p=f.waitBoard(),ongoing=f.buttons.save.onclick();
 f.newStylingRequest();p.resolve();await ongoing;assert.deepEqual(f.events,[]);
});
test('replaced result object prevents stale exact-data Save outfit',async()=>{
 const f=fixture(),p=f.waitBoard(),ongoing=f.buttons.save.onclick();
 f.replaceResults();p.resolve();await ongoing;assert.deepEqual(f.events,[]);
});
test('old completion after private save starts cannot render into newer account',async()=>{
 const f=fixture(),p=gate(),started=gate();
 f.ctx.saveOwnedOutfit=()=>{f.events.push('persist-start');started.resolve();return p.promise;};
 const running=f.buttons.save.onclick();
 await started.promise;f.switchOwner();p.resolve();await running;
 assert.deepEqual(f.events,['persist-start']);assert.equal(f.state().phase,'saving');
});
test('failed old-account save cannot display private error or re-render',async()=>{
 const f=fixture(),p=gate(),started=gate();
 f.ctx.saveOwnedOutfit=()=>{started.resolve();return p.promise};
 const running=f.buttons.save.onclick();
 await started.promise;f.switchOwner();p.reject(Error('PRIVATE old-owner original JPEG'));await running;
 assert.deepEqual(f.events,[]);assert.equal(f.state().phase,'saving');
});
test('active save rejects private failure text; shows generic actionable error',async()=>{
 const f=fixture();
 f.ctx.saveOwnedOutfit=async()=>{throw Error('PRIVATE original image filename');};
 await f.buttons.save.onclick();
 assert.equal(f.state().phase,'error');
 assert.match(f.buttons.status.textContent,/Could not save this outfit/);
 assert.doesNotMatch(f.buttons.status.textContent,/PRIVATE|original image filename/);
});
test('changed original garment shows safe refresh action rather than unsafe save',async()=>{
 const f=fixture();f.ctx.saveOwnedOutfit=async()=>{const e=Error('PRIVATE file path');e.code='OUTFIT_WARDROBE_CHANGED';throw e;};
 await f.buttons.save.onclick();
 assert.equal(f.state().phase,'wardrobe-changed');
 assert.equal(f.buttons.refresh.hidden,false);
 assert.match(f.buttons.status.textContent,/Refresh your closet/);
 assert.doesNotMatch(f.buttons.status.textContent,/PRIVATE/);
});
test('stale detached card click never saves',async()=>{
 const f=fixture();f.card.isConnected=false;await f.buttons.save.onclick();
 assert.deepEqual(f.events,[]);assert.equal(f.state(),undefined);
});
test('hidden signed gate and wrong database refuse save before UI change',async()=>{
 const f=fixture();f.controls.authGate.hidden=false;await f.buttons.save.onclick();
 assert.equal(f.state(),undefined);
 f.controls.authGate.hidden=true;f.ctx.db={name:'closet-current-user-x'};
 await f.buttons.save.onclick();assert.equal(f.state(),undefined);
});
test('Save completion on detached same-owner card updates state but never rerenders',async()=>{
 const f=fixture(),p=gate(),started=gate();
 f.ctx.saveOwnedOutfit=()=>{started.resolve();return p.promise;};
 const run=f.buttons.save.onclick();await started.promise;
 f.card.isConnected=false;p.resolve();await run;
 assert.equal(f.state().phase,'saved');
 assert.deepEqual(f.events,['render-saved']);
});
test('active owner Adjust creates exact board and navigates only after successful draft save',async()=>{
 const f=fixture();await f.buttons.edit.onclick();
 assert.deepEqual(f.events,['clean:owner-a','sync','render-board','store','view:builder']);
 assert.equal(f.ctx.currentBoard.slots.top,'same-id');
});
test('Adjust while waiting for board readiness cannot mutate new account board',async()=>{
 const f=fixture(),p=f.waitBoard(),running=f.buttons.edit.onclick();
 f.switchOwner();p.resolve();await running;
 assert.deepEqual(f.events,[]);assert.equal(f.ctx.currentBoard.slots.top,undefined);
});
test('Adjust same-ID relogin while waiting does not navigate or replace board',async()=>{
 const f=fixture(),p=f.waitBoard(),running=f.buttons.edit.onclick();
 f.relogin();p.resolve();await running;assert.deepEqual(f.events,[]);
});
test('Adjust pending draft commit does not redirect after account switch',async()=>{
 const f=fixture(),started=gate(),pending=gate();
 f.ctx.storeBoard=()=>{f.events.push('store');started.resolve();return pending.promise;};
 const running=f.buttons.edit.onclick();await started.promise;
 f.switchOwner();pending.resolve(true);await running;
 assert.deepEqual(f.events,['clean:owner-a','sync','render-board','store']);
});
test('Adjust persistence conflict refuses Builder navigation',async()=>{
 const f=fixture();f.ctx.storeBoard=async()=>{f.events.push('store');return false};
 await f.buttons.edit.onclick();
 assert.deepEqual(f.events,['clean:owner-a','sync','render-board','store']);
 assert.equal(f.state().phase,'error');
});
test('Adjust does not force Builder after user left Stylist view during save',async()=>{
 const f=fixture(),started=gate(),pending=gate();
 f.ctx.storeBoard=()=>{f.events.push('store');started.resolve();return pending.promise;};
 const running=f.buttons.edit.onclick();await started.promise;
 f.controls.stylist.hidden=true;pending.resolve(true);await running;
 assert.equal(f.events.includes('view:builder'),false);
});
test('Refresh private wardrobe success focuses current form only',async()=>{
 const f=fixture();await f.buttons.refresh.onclick();
 assert.deepEqual(f.events,['refresh','focus:outfits']);
 assert.equal(f.buttons.refresh.disabled,false);
});
test('Refresh old account failure never displays stale private details',async()=>{
 const f=fixture(),started=gate(),pending=gate();
 f.ctx.refreshSavedWardrobeForOutfits=()=>{started.resolve();return pending.promise;};
 const running=f.buttons.refresh.onclick();await started.promise;
 f.switchOwner();pending.reject(Error('PRIVATE-A outfit'));await running;
 assert.equal(f.state(),undefined);
});
test('Refresh current failure uses generic message and can retry',async()=>{
 const f=fixture();f.ctx.refreshSavedWardrobeForOutfits=async()=>{throw Error('PRIVATE-JPEG')};
 await f.buttons.refresh.onclick();
 assert.equal(f.state().phase,'wardrobe-changed');
 assert.doesNotMatch(f.buttons.status.textContent,/PRIVATE|JPEG/);
 assert.equal(f.buttons.refresh.disabled,false);
});
test('Refresh success that removes old generated result does not invoke stale button',async()=>{
 const f=fixture();f.ctx.refreshSavedWardrobeForOutfits=async()=>{
  f.ctx.styledCollectionResults=[];
 };
 await f.buttons.refresh.onclick();assert.deepEqual(f.events,['focus:outfits']);
});
test('session lease source guards exact auth DB epoch roster result and request serial',()=>{
 assert.match(lease,/window\.closetAuth!==auth/);
 assert.match(lease,/ownerDB!==db/);
 assert.match(lease,/epoch!==captureOperationEpoch/);
 assert.match(lease,/serial===styledCollectionRequestSerial/);
 assert.match(lease,/styledCollectionResults\.includes\(result\)/);
 assert.match(lease,/wardrobe\.every\(\(row,i\)=>row===items\[i\]\)/);
 assert.match(editCode,/if\(!lease\.current\(\)\)return;/);
 assert.match(saveCode,/await saveOwnedOutfit\(saved\)/);
 assert.match(refreshCode,/lease\.ownsSession\(\)/);
 assert.doesNotMatch(saveCode,/error\.message\|\|/);
 assert.doesNotMatch(updateCode,/else renderStyledCollection\(\)/);
});
