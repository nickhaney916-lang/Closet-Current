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
const savedFactsSource=exact('function outfitSavedItemFacts(item){','function outfitWardrobeChanged(){');
const pickerSource=exact('function boardPhotoRequiresUnitReview(item){','function renderOutfitBoard(){');
const pickerFocusSource=exact('function restoreBoardPickerFocus(){',"$('boardPicker').addEventListener");
const suggestionsSource=exact('function renderBoardSuggestions(){','function renderSavedOutfitBoards(){');
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
   contains(){return false},
   showModal(){this.open=true;calls.push('picker-open')}
  };
  return dom[id];
 }
 element('authGate').hidden=true;element('appShell').hidden=false;
 const original={id:'saved-a',name:'OWNER-A-PRIVATE-SAVED',slots:{top:'owner-a-garment'}};
 const item={id:'owner-a-garment',name:'OWNER-A-PRIVATE-JPEG',itemType:'T-Shirt',
  color:'Blue',image:'data:image/jpeg;base64,/9j/AA==',category:'Tops'};
 const ctx={
  boardPickerFocus:null,document:{activeElement:null,body:{}},
  window:{closetAuth:auth},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:17,nativeLossless04Active:false,nativeLossless04:null,
  currentBoard:{name:'DRAFT-A',slots:{}},savedOutfitBoards:[original],
  items:[item],outfitSlots:[{id:'top',label:'Top'}],choosingSlot:'top',
  $(id){return element(id)},
  node(tag,label,className){
   const classes=new Set(String(className||'').split(/\s+/).filter(Boolean));
   const attributes=new Map();
   const el={tag,label,className,isConnected:true,children:[],
    classList:{add(value){classes.add(value)},contains(value){return classes.has(value)}},
    setAttribute(key,value){attributes.set(key,String(value))},
    getAttribute(key){return attributes.get(key)||null},
    append(...xs){this.children.push(...xs)},onclick:null,type:'',id:''};
   if(tag==='button')calls.push('button:'+String(label??className));
   return el;
  },
  slotAllows(){return true},
  normalizeClothing(item){return {...item,seasons:item.seasons||[]}},
  closetGapOptions(_target,_board,wardrobe){return wardrobe},
  wardrobeGapIdeas(){return []},
  cleanOutfitBoard(value){return JSON.parse(JSON.stringify(value))},
  syncBoardInputs(){calls.push('sync')},
  renderOutfitBoard(){calls.push('render')},
  storeBoard(){calls.push('save');return Promise.resolve(true)},
  selectBoardPiece(slot,id){calls.push('select:'+slot+':'+id)},
  switchView(view){calls.push('view:'+view)},
  nativeLossless04Edit(){throw Error('Should not use native research path')}
 };
 vm.createContext(ctx);
 vm.runInContext(leaseSource+savedFactsSource+pickerSource+pickerFocusSource+suggestionsSource+savedSource,ctx,{timeout:1000});
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
test('normal owned alternative warns about unverified source before selection',()=>{
 const f=fixture();
 f.element('boardTarget').value='top';
 f.ctx.renderBoardSuggestions();
 const button=f.element('boardOwnedOptions').children.find(x=>x.className==='board-owned-pick');
 assert.ok(button,'normal owned alternative not rendered');
 assert.equal(button.classList.contains('source-unverified'),true);
 assert.match(button.children.find(x=>x.tag==='small'&&
  /outline unverified/.test(x.label||''))?.label||'',
  /Photo reference only.*garment outline unverified/i);
 assert.match(button.getAttribute('aria-label')||'',
  /individual garment outline unverified.*2D outfit/i);
 f.calls.length=0;button.onclick();
 assert.deepEqual(f.calls,['select:top:owner-a-garment']);
});
test('stale owned alternative cannot select former owner JPEG after session switch',()=>{
 const f=fixture();
 f.element('boardTarget').value='top';
 f.ctx.renderBoardSuggestions();
 const button=f.element('boardOwnedOptions').children.find(x=>x.className==='board-owned-pick');
 f.swap();f.calls.length=0;button.onclick();
 assert.deepEqual(f.calls,[]);
});
test('positive model booleans cannot hide an unverified Mission 1 owner review',()=>{
 const f=fixture();
 Object.assign(f.item,{
  singleGarmentVerified:true,independentPhysicalItemVerified:true,
  threeDReady:true,photoOnly:false,sourceHashVerified:true,
  segmentHint:{clipped:false,verified:true,rawMaskPixelsIndependentlyVerified:true},
  ownerSourceReview88:{schema:'p88-owner-source-review/v1',ownerId:'owner-a',
   independentPhysicalItemVerified:false,threeDReady:false}
 });
 assert.equal(f.ctx.boardPhotoRequiresUnitReview(f.item),true,
  'owner source receipt cannot be promoted by optimistic model flags');
 const button=f.makePicker();
 assert.equal(button.classList.contains('source-unverified'),true);
 assert.match(button.getAttribute('aria-label')||'',/garment outline unverified/i);
});
test('atomic outfit facts detect changed owner source receipt even with unchanged photo',()=>{
 const f=fixture(),base={...f.item,seasons:['Winter'],ownerId:'owner-a',
  sourceHashVerified:true,sourceCropReviewed:true,ownerReviewed:true,
  ownerSourceReview88:{schema:'p88-owner-source-review/v1',ownerId:'owner-a',
   sourceId:'saved-source-a',selectedMaskSha256:'a'.repeat(64)}};
 const facts=value=>JSON.stringify(f.ctx.outfitSavedItemFacts(value));
 const initial=facts(base);
 const revisions=[
  ['owner receipt revised',{...base,ownerSourceReview88:{...base.ownerSourceReview88,selectedMaskSha256:'b'.repeat(64)}}],
  ['owner receipt revoked',{...base,ownerSourceReview88:null}],
  ['reviewed crop changed',{...base,cropBounds:{x:4,y:3,width:20,height:30}}],
  ['mask source changed',{...base,reconciliation70:{maskSha256:'c'.repeat(64)}}],
  ['physical unit decision changed',{...base,reconciliation70Status:'owner-confirmed-separate'}],
  ['reviewer changed confirmation',{...base,ownerReviewed:false}],
  ['photo-only protection changed',{...base,photoOnly:false,threeDReady:true}],
  ['companion mask replaced',{...base,shoePair:{companion:{reconciliation70:{maskSha256:'d'.repeat(64)}}}}]
 ];
 for(const [label,changed] of revisions){
  assert.notEqual(facts(changed),initial,
   label+' must not reuse a stale selected garment on atomic outfit save');
 }
 assert.equal(facts({...base}),initial,'unchanged owner row must remain comparable');
});
test('atomic outfit state transaction verifies selected evidence against durable owner items',()=>{
 assert.match(source,/candidate&&\(!expected\|\|!actual\|\|expected\.length!==actual\.length/);
 assert.match(source,/!expected\.every\(\(v,i\)=>v===actual\[i\]\)/);
 assert.match(source,/const tx=ownerDB\.transaction\(candidate\|\|proof33\?/);
 assert.match(source,/const expectedClothing=Object\.fromEntries\(/);
});
test('M76 positive flags without owner receipt remain 2D source-only in both entrypoints',()=>{
 const f=fixture();
 Object.assign(f.item,{
  ownerSourceReview88:undefined,independentPhysicalItemVerified:true,
  singleGarmentVerified:true,threeDReady:true,photoOnly:false,
  sourceHashVerified:true,sourceCropReviewed:true,
  segmentHint:{clipped:false,verified:true,rawMaskPixelsIndependentlyVerified:true}
 });
 assert.equal(f.ctx.boardPhotoRequiresUnitReview(f.item),true,
  'editable optimistic booleans alone cannot prove one physical garment');
 const picker=f.makePicker();
 assert.equal(picker.classList.contains('source-unverified'),true);
 assert.match(picker.getAttribute('aria-label')||'',/outline unverified.*2D outfit/i);
 f.element('boardTarget').value='top';
 f.ctx.renderBoardSuggestions();
 const alt=f.element('boardOwnedOptions').children.find(x=>x.className==='board-owned-pick');
 assert.ok(alt,'normal alternative not shown');
 assert.equal(alt.classList.contains('source-unverified'),true);
 assert.match(alt.getAttribute('aria-label')||'',/outline unverified.*2D outfit/i);
 f.calls.length=0;alt.onclick();
 assert.deepEqual(f.calls,['select:top:owner-a-garment']);
});
test('real default photo picker allows originating owner to select source',()=>{
 const f=fixture(),button=f.makePicker();f.calls.length=0;
 button.onclick();assert.deepEqual(f.calls,['select:top:owner-a-garment','picker-close']);
});
test('picker source-only photo warning is visible and accessible before selection',()=>{
 const f=fixture(),button=f.makePicker();
 assert.equal(button.classList.contains('source-unverified'),true);
 assert.match(button.children.find(x=>x.tag==='small')?.label||'',
  /Photo reference only.*garment outline unverified/i);
 assert.match(button.getAttribute('aria-label'),
  /individual garment outline unverified.*Select for 2D outfit/i);
});
test('Mission 1 owner-source-review receipt stays 2D only in normal native picker',()=>{
 const f=fixture(),photo='a'.repeat(64),crop='b'.repeat(64),mask='c'.repeat(64);
 Object.assign(f.item,{
  ownerId:'owner-a',outfitSourceId:'source-a',sourceSHA256:photo,
  originalPhoto:{sha256:photo},reconciliation70:{maskSha256:mask},
  reconciliation70Status:'owner-confirmed-separate',
  cropBounds:{x:3,y:6,width:20,height:25},sourceHashVerified:true,
  singleGarmentVerified:false,threeDReady:false,photoOnly:true
 });
 f.item.ownerSourceReview88={
  schema:'p88-owner-source-review/v1',ownerId:'owner-a',
  itemId:f.item.id,sourceId:'source-a',originalPhotoSha256:photo,
  derivedImageSha256:crop,derivedImageBytesVerified:true,
  companionImageSha256:null,companionImageBytesVerified:false,
  companionMaskSha256:null,
  selectedMaskSha256:mask,physicalUnitDecision:'owner-confirmed-separate',
  category:f.item.category,itemType:f.item.itemType,color:f.item.color,
  cropBounds:{...f.item.cropBounds},ownerReviewed:true,
  sourcePhotoOriginal:true,rawMaskPixelsIndependentlyVerified:false,
  independentPhysicalItemVerified:false,singleGarmentVerified:false,threeDReady:false
 };
 assert.equal(f.ctx.boardHasMatchingOwnerSourceReview88(f.item),true);
 assert.equal(f.ctx.boardPhotoRequiresUnitReview(f.item),true,
  'owner review cannot authorize physical unit or fitted 3D');
 const button=f.makePicker();
 assert.match(button.children.find(x=>x.tag==='small')?.label||'',
  /Owner-reviewed photo.*independent garment outline unverified/i);
 assert.match(button.getAttribute('aria-label')||'',
  /physical garment outline not independently verified.*Select for 2D outfit/i);
 f.calls.length=0;button.onclick();
 assert.deepEqual(f.calls,['select:top:owner-a-garment','picker-close']);
});
test('Mission 1 changed/foreign/forged owner-review receipts never certify garment',()=>{
 const f=fixture(),photo='a'.repeat(64),crop='b'.repeat(64),mask='c'.repeat(64);
 Object.assign(f.item,{
  ownerId:'owner-a',outfitSourceId:'source-a',sourceSHA256:photo,
  originalPhoto:{sha256:photo},reconciliation70:{maskSha256:mask},
  reconciliation70Status:'owner-confirmed-separate',
  cropBounds:{x:1,y:2,width:3,height:4},sourceHashVerified:true,
  singleGarmentVerified:false,threeDReady:false,photoOnly:true
 });
 const receipt={schema:'p88-owner-source-review/v1',ownerId:'owner-a',
  itemId:f.item.id,sourceId:'source-a',originalPhotoSha256:photo,
  derivedImageSha256:crop,derivedImageBytesVerified:true,
  companionImageSha256:null,companionImageBytesVerified:false,
  companionMaskSha256:null,
  selectedMaskSha256:mask,physicalUnitDecision:'owner-confirmed-separate',
  category:f.item.category,itemType:f.item.itemType,color:f.item.color,
  cropBounds:{...f.item.cropBounds},ownerReviewed:true,
  sourcePhotoOriginal:true,rawMaskPixelsIndependentlyVerified:false,
  independentPhysicalItemVerified:false,singleGarmentVerified:false,threeDReady:false};
 const cases=[
  {label:'wrong owner',ownerId:'owner-b'},
  {label:'changed source original',originalPhotoSha256:'e'.repeat(64)},
  {label:'changed mask',selectedMaskSha256:'d'.repeat(64)},
  {label:'changed subtype',itemType:'Boots'},
  {label:'changed crop bounds',cropBounds:{...receipt.cropBounds,x:5}},
  {label:'forged independent physical item',independentPhysicalItemVerified:true},
  {label:'forged 3D',threeDReady:true},
  {label:'forged raw pixels',rawMaskPixelsIndependentlyVerified:true},
  {label:'missing crop bytes proof',derivedImageBytesVerified:false},
  {label:'forged companion image verification',companionImageBytesVerified:true},
  {label:'orphan companion mask',companionMaskSha256:'d'.repeat(64)}
 ];
 for(const {label,...mutation} of cases){
  f.item.ownerSourceReview88={...receipt,...mutation};
  assert.equal(f.ctx.boardHasMatchingOwnerSourceReview88(f.item),false,label);
  assert.match(f.ctx.boardPhotoSourceNotice88(f.item),
   /Photo reference only.*garment outline unverified/i,label);
  assert.equal(f.ctx.boardPhotoRequiresUnitReview(f.item),true,label);
 }
 f.item.ownerSourceReview88=receipt;
 f.item.shoePair={companion:{reconciliation70:{maskSha256:'f'.repeat(64)}}};
 assert.equal(f.ctx.boardHasMatchingOwnerSourceReview88(f.item),false,
  'a new companion cannot reuse old one-physical-item owner review');
 delete f.item.shoePair;
 f.swap();
 assert.equal(f.ctx.boardHasMatchingOwnerSourceReview88(f.item),false,
  'a previous owner receipt must not carry into another signed owner');
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
