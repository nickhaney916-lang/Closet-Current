'use strict';
// Source-executed tests for default private saved-outfit and picker callbacks.
// All clothing and owners synthetic; no hosted database, photos or deployment.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function exact(a,b){
 const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Missing exact native/default source '+a);
 return source.slice(i,j);
}
const leaseSource=exact('function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const savedSource=exact('function renderSavedOutfitBoards(){','async function importBoardBackup(');
const pickerSource=exact('function openBoardPicker(slotId){','function renderOutfitBoard(){');
const ownerModes=[
 ['different account',f=>f.swap()],
 ['same-ID new login',f=>f.relogin()],
 ['replaced owner DB',f=>f.replaceDB()],
 ['rotated capture epoch',f=>f.rotate()],
 ['revoked signed session',f=>f.revoke()],
 ['locked auth gate',f=>f.lockGate()],
 ['hidden app shell',f=>f.hideShell()]
];
function fixture(){
 const calls=[],dom={},auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked');}};
 function element(id){
  if(!dom[id])dom[id]={id,hidden:id==='authGate',isConnected:true,textContent:'',
   children:[],open:false,append(...xs){this.children.push(...xs)},
   replaceChildren(){this.children=[]},
   close(){this.open=false;calls.push('picker-close')},
   showModal(){this.open=true;calls.push('picker-open')}
  };
  return dom[id];
 }
 element('authGate').hidden=true;element('appShell').hidden=false;
 const original={id:'saved-a',name:'OWNER-A-PRIVATE-SAVED',slots:{top:'owner-a-garment'}};
 const item={id:'owner-a-garment',name:'OWNER-A-PRIVATE-JPEG',itemType:'T-Shirt',
  color:'Blue',image:'data:image/jpeg;base64,/9j/AA==',category:'Tops'};
 const ctx={
  window:{closetAuth:auth},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:17,nativeLossless04Active:false,
  currentBoard:{name:'DRAFT-A',slots:{}},savedOutfitBoards:[original],
  items:[item],outfitSlots:[{id:'top',label:'Top'}],choosingSlot:'top',
  $(id){return element(id)},
  node(tag,label,className){const el={tag,label,className,isConnected:true,children:[],
   append(...xs){this.children.push(...xs)},onclick:null,type:'',id:''};
   if(tag==='button')calls.push('button:'+String(label??className));
   return el;
  },
  slotAllows(){return true},
  cleanOutfitBoard(value){return JSON.parse(JSON.stringify(value))},
  syncBoardInputs(){calls.push('sync')},
  renderOutfitBoard(){calls.push('render')},
  storeBoard(){calls.push('save');return Promise.resolve(true)},
  selectBoardPiece(slot,id){calls.push('select:'+slot+':'+id)},
  switchView(view){calls.push('view:'+view)},
  nativeLossless04Edit(){throw Error('Should not use native research path')}
 };
 vm.createContext(ctx);
 vm.runInContext(leaseSource+pickerSource+savedSource,ctx,{timeout:1000});
 return {ctx,calls,dom,original,item,auth,element,
  makeSaved(){ctx.renderSavedOutfitBoards();return dom.savedBoards.children[0]},
  makePicker(){ctx.openBoardPicker('top');return dom.boardPickerItems.children.find(x=>x.tag==='button')},
  swap(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++;},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++;},
  replaceDB(){ctx.db={name:'closet-current-user-owner-a'}},
  rotate(){ctx.captureOperationEpoch++},
  revoke(){auth.revoked=true},
  lockGate(){dom.authGate.hidden=false},
  hideShell(){dom.appShell.hidden=true},
  resetNewOwner(){ctx.currentBoard={name:'OWNER-B-DRAFT',slots:{}};ctx.savedOutfitBoards=[{name:'OWNER-B-SAVED'}];calls.length=0;}
 };
}
test('real default saved outfit card selects and saves only while signed owner is current',()=>{
 const f=fixture(),button=f.makeSaved();button.onclick();
 assert.equal(f.ctx.currentBoard.name,'OWNER-A-PRIVATE-SAVED');
 assert.deepEqual(f.calls.slice(-3),['sync','render','save']);
});
test('real default photo picker allows originating owner to select source',()=>{
 const f=fixture(),button=f.makePicker();f.calls.length=0;
 button.onclick();assert.deepEqual(f.calls,['select:top:owner-a-garment','picker-close']);
});
for(const [reason,mutation] of ownerModes){
 test('former owner saved outfit card cannot touch new session after '+reason,()=>{
  const f=fixture(),b=f.makeSaved();mutation(f);f.resetNewOwner();b.onclick();
  assert.equal(f.ctx.currentBoard.name,'OWNER-B-DRAFT');
  assert.equal(f.ctx.savedOutfitBoards[0].name,'OWNER-B-SAVED');
  assert.deepEqual(f.calls,[]);
 });
 test('former owner source-photo picker cannot select or close after '+reason,()=>{
  const f=fixture(),b=f.makePicker();mutation(f);f.resetNewOwner();
  f.element('boardPicker').open=true;b.onclick();
  assert.equal(f.element('boardPicker').open,true);assert.deepEqual(f.calls,[]);
 });
}
test('detached saved outfit button refuses writes even for unchanged owner',()=>{
 const f=fixture(),b=f.makeSaved();b.isConnected=false;f.calls.length=0;
 b.onclick();assert.deepEqual(f.calls,[]);
});
test('detached picker item refuses source selection for unchanged owner',()=>{
 const f=fixture(),b=f.makePicker();b.isConnected=false;f.calls.length=0;
 b.onclick();assert.deepEqual(f.calls,[]);
});
test('stale saved card after same-owner roster replacement cannot save former entry',()=>{
 const f=fixture(),b=f.makeSaved();f.ctx.savedOutfitBoards=[{...f.original}];f.calls.length=0;
 b.onclick();assert.deepEqual(f.calls,[]);assert.equal(f.ctx.currentBoard.name,'DRAFT-A');
});
test('stale picker row after same-owner wardrobe refresh cannot select old photo',()=>{
 const f=fixture(),b=f.makePicker();f.ctx.items=[{...f.item}];f.calls.length=0;
 b.onclick();assert.deepEqual(f.calls,[]);
});
test('picker Add clothing button may navigate only for exact owner',()=>{
 const f=fixture();f.ctx.items=[];const b=f.makePicker();
 assert.equal(b.label,'Add clothing photos');b.onclick();
 assert.ok(f.calls.includes('view:scan'));
});
test('stale picker Add clothing button cannot navigate after switch',()=>{
 const f=fixture();f.ctx.items=[];const b=f.makePicker();f.swap();f.calls.length=0;
 b.onclick();assert.deepEqual(f.calls,[]);
});
test('signed-out saved cards do not render private titles',()=>{
 const f=fixture();f.lockGate();f.ctx.renderSavedOutfitBoards();
 assert.equal(f.element('savedBoards').children.length,0);
});
test('signed-out clothing picker does not populate original photo thumbnails',()=>{
 const f=fixture();f.hideShell();f.ctx.openBoardPicker('top');
 assert.equal(f.element('boardPickerItems').children.length,0);
});
test('exact source callback contract retains native research selection path',()=>{
 assert.match(savedSource,/if\(nativeLossless04Active\)return nativeLossless04Edit\(/);
 assert.match(savedSource,/savedListLease\?\.current\(\)/);
 assert.match(savedSource,/savedOutfitBoards\[index\]!==value/);
 assert.match(pickerSource,/pickerLease\.current\(\)/);
 assert.match(pickerSource,/!items\.includes\(item\)/);
 assert.match(pickerSource,/selectBoardPiece\(slotId,item\.id\)/);
});
