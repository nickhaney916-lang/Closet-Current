'use strict';
// Executes actual research BOARD04 UI callback source with synthetic auth and
// controller data. No private wardrobes, hosted cloud or physical devices.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function slice(a,b){const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Expected production source '+a);return source.slice(i,j);}
const nativeHelpers=slice('function nativeLossless04Notify(error){','function nativeLossless04ClearPreview(){');
const exactOwner=slice('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const saveButton=slice("$('saveBoard').onclick=async()=>{",'function renderTrendReferences()');
const nativeControls=slice('   function addControl(id,label,fn){',"   $('saveBoard').after(controls);");
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function fixture(){
 const events=[],buttons={};
 let revoked=false,active=true,selected=0,confirmDelete=true;
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const form={boardSaveStatus:{textContent:''},saveBoard:{disabled:false},authGate:{hidden:true},appShell:{hidden:false}};
 const ownerController={
  status(){return {active}},
  persist:async options=>{events.push('persist:'+options.asNew);return {saved:true};},
  cancel:async()=>{events.push('cancel')},
  remove:async(index,options)=>{events.push('remove:'+index+':'+options.confirmed)},
  get selected(){return selected;}
 };
 const ctx={
  window:{closetAuth:auth},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:4,nativeLossless04Active:true,nativeLossless04:ownerController,
  $(id){return form[id];},
  node(kind,label){return {kind,textContent:label,isConnected:true,disabled:false,type:'',id:''}},
  controls:{append(button){buttons[button.id]=button}},
  confirm(){events.push('confirm');return confirmDelete},
  cancelBoardDraftTimer(){events.push('cancel-timer')},
  boardStatusSerial:0,currentBoard:{slots:{top:'one'}},savedOutfitBoards:[],
  saveOwnedOutfit:async()=>{},boardDraftStatus(){events.push('board-status')},
  renderSavedOutfitBoards(){events.push('render')},
  boardConflictDraft:null
 };
 vm.createContext(ctx);
 vm.runInContext(nativeHelpers+exactOwner+saveButton+nativeControls,ctx);
 const save=()=>form.saveBoard.onclick();
 const click=id=>buttons[id].onclick();
 return {ctx,events,form,buttons,ownerController,save,click,
  swap(){
   // Real BOARD04 status() consults the pinned native auth epoch and becomes
   // inactive after either an account switch or same-ID re-login.
   active=false;
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.captureOperationEpoch++;
  },
  relogin(){active=false;
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++;},
  revoke(){revoked=true},
  inactive(){active=false},
  detach(id){buttons[id].isConnected=false},
  setSelected(value){selected=value},
  rejectConfirm(){confirmDelete=false},
  replaceController(){ctx.nativeLossless04={...ownerController,status(){return {active:true}}}},
  setPersistPending(){
   const gate=deferred(),began=deferred();
   ownerController.persist=()=>{events.push('persist:pending');began.resolve();return gate.promise};
   return {...gate,began:began.promise};
  },
  setDeletePending(){
   const gate=deferred(),began=deferred();
   ownerController.remove=()=>{events.push('remove:pending');began.resolve();return gate.promise};
   return {...gate,began:began.promise};
  }
 };
}
test('native Save Outfit current owner invokes lossless asNew and reenables button',async()=>{
 const f=fixture();await f.save();assert.deepEqual(f.events,['persist:true']);
 assert.equal(f.form.saveBoard.disabled,false);
});
test('native Save Outfit other owner cannot begin persistence',async()=>{
 const f=fixture();f.swap();await f.save();assert.deepEqual(f.events,[]);
});
test('native Save Outfit same-ID re-login cannot act through old controller',async()=>{
 const f=fixture();f.relogin();await f.save();assert.deepEqual(f.events,[]);
});
test('native Save Outfit wrong private DB cannot start',async()=>{
 const f=fixture();f.ctx.db={name:'other-db'};await f.save();assert.deepEqual(f.events,[]);
});
test('native Save Outfit revoked auth refuses old callback',async()=>{
 const f=fixture();f.revoke();await f.save();assert.deepEqual(f.events,[]);
});
test('native Save Outfit inactive consumer does not save',async()=>{
 const f=fixture();f.inactive();await f.save();assert.deepEqual(f.events,[]);
});
test('native Save Outfit completion after owner change cannot reenable new session button',async()=>{
 const f=fixture(),p=f.setPersistPending(),run=f.save();await p.began;
 f.swap();f.form.saveBoard.disabled=true;p.resolve();await run;
 assert.deepEqual(f.events,['persist:pending']);assert.equal(f.form.saveBoard.disabled,true);
});
test('native Save Outfit rejection after switch displays no private exception',async()=>{
 const f=fixture(),p=f.setPersistPending(),run=f.save();await p.began;
 f.swap();f.form.boardSaveStatus.textContent='owner b screen';
 p.reject(Error('PRIVATE JPEG-A path'));await run;
 assert.equal(f.form.boardSaveStatus.textContent,'owner b screen');
 assert.equal(f.form.saveBoard.disabled,true);
});
test('native Save Outfit rejected by same owner displays static safe message',async()=>{
 const f=fixture();f.ownerController.persist=async()=>{throw Error('PRIVATE original JPEG-A')};
 await f.save();
 assert.match(f.form.boardSaveStatus.textContent,/The private outfit action could not finish/);
 assert.doesNotMatch(f.form.boardSaveStatus.textContent,/PRIVATE|JPEG/);
 assert.equal(f.form.saveBoard.disabled,false);
});
test('native Save Outfit old completion after consumer replacement cannot reenable UI',async()=>{
 const f=fixture(),p=f.setPersistPending(),run=f.save();await p.began;
 f.replaceController();f.form.saveBoard.disabled=true;p.resolve();await run;
 assert.equal(f.form.saveBoard.disabled,true);
});
test('native Save changes calls asNew false for initiating consumer',async()=>{
 const f=fixture();await f.click('native04SaveChanges');
 assert.deepEqual(f.events,['persist:false']);
 assert.equal(f.buttons.native04SaveChanges.disabled,false);
});
test('native Cancel changes uses initiating owner controller',async()=>{
 const f=fixture();await f.click('native04CancelChanges');
 assert.deepEqual(f.events,['cancel']);
});
test('native Delete saved outfit requires explicit confirmation',async()=>{
 const f=fixture();await f.click('native04DeleteOutfit');
 assert.deepEqual(f.events,['confirm','remove:0:true']);
});
test('native Delete outfit declined confirmation performs no removal',async()=>{
 const f=fixture();f.rejectConfirm();await f.click('native04DeleteOutfit');
 assert.deepEqual(f.events,['confirm']);
});
test('native Delete outfit without selection preserves clothing',async()=>{
 const f=fixture();f.setSelected(null);await f.click('native04DeleteOutfit');
 assert.deepEqual(f.events,[]);
 assert.match(f.form.boardSaveStatus.textContent,/Open a saved outfit/);
});
test('native controls refuse detached stale buttons',async()=>{
 const f=fixture();f.detach('native04SaveChanges');
 await f.click('native04SaveChanges');assert.deepEqual(f.events,[]);
});
test('native Delete in-flight after switch cannot reenable the next owner control',async()=>{
 const f=fixture(),p=f.setDeletePending(),run=f.click('native04DeleteOutfit');
 await p.began;f.swap();f.buttons.native04DeleteOutfit.disabled=true;p.resolve();await run;
 assert.deepEqual(f.events,['confirm','remove:pending']);
 assert.equal(f.buttons.native04DeleteOutfit.disabled,true);
});
test('native Save changes in-flight rejected after same-ID relogin does not show error',async()=>{
 const f=fixture(),p=f.setPersistPending(),run=f.click('native04SaveChanges');
 await p.began;f.relogin();f.form.boardSaveStatus.textContent='new session';
 p.reject(Error('PRIVATE-JPEG-A original'));await run;
 assert.equal(f.form.boardSaveStatus.textContent,'new session');
 assert.equal(f.buttons.native04SaveChanges.disabled,true);
});
test('native Save changes same owner rejected error is generic',async()=>{
 const f=fixture();f.ownerController.persist=async()=>{throw Error('PRIVATE original metadata')};
 await f.click('native04SaveChanges');
 assert.doesNotMatch(f.form.boardSaveStatus.textContent,/PRIVATE|metadata/);
 assert.match(f.form.boardSaveStatus.textContent,/The private outfit action could not finish/);
});
test('detached old native control is not re-enabled after pending completion',async()=>{
 const f=fixture(),p=f.setPersistPending(),run=f.click('native04SaveChanges');
 await p.began;f.detach('native04SaveChanges');f.buttons.native04SaveChanges.disabled=true;
 p.resolve();await run;assert.equal(f.buttons.native04SaveChanges.disabled,true);
});
test('native quick field edits require signed exact session',()=>{
 const f=fixture();f.swap();f.ctx.nativeLossless04Edit(()=>f.events.push('edited'));
 assert.deepEqual(f.events,[]);
});
test('native quick edit exception cannot print raw private info',()=>{
 const f=fixture();f.ctx.nativeLossless04Edit(()=>{throw Error('PRIVATE-JPEG')});
 assert.match(f.form.boardSaveStatus.textContent,/The private outfit action could not finish/);
 assert.doesNotMatch(f.form.boardSaveStatus.textContent,/PRIVATE-JPEG/);
});
test('native error display does not interpolate exception.message',()=>{
 const f=fixture();f.ctx.nativeLossless04Notify(Error('SECRET PHOTO PATH'));
 assert.doesNotMatch(f.form.boardSaveStatus.textContent,/SECRET|PATH/);
});
test('source preserves exact-session checks in native save and control closures',()=>{
 assert.match(nativeHelpers,/beginOwnerBoardUiLease/);
 assert.match(exactOwner,/captureOperationEpoch/);
 assert.match(saveButton,/nativeLossless04===consumer/);
 assert.match(nativeControls,/nativeLossless04===consumer/);
 assert.match(nativeControls,/if\(current\(\)&&button\.isConnected\)button\.disabled=false/);
 assert.match(nativeControls,/consumer\.remove\(index,\{confirmed:true\}\)/);
 assert.doesNotMatch(nativeHelpers,/String\(error\?\.message/);
});
