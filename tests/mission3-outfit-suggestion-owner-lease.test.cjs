'use strict';
// Executes the exact production outfit suggestions and originating-owner lease.
// All identities, wardrobes and prospective styling ideas are synthetic.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function extract(start,end){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing actual production code '+start);
 return source.slice(i,j);
}
const lease=extract('function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const suggestions=extract('function renderBoardSuggestions(){','function renderSavedOutfitBoards(){');
function fixture({native=false,controllerActive=true}={}){
 const calls=[],dom={},auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};
 function el(id){
  if(!dom[id])dom[id]={id,isConnected:true,value:'',textContent:'',hidden:false,
   children:[],append(...elements){this.children.push(...elements)},
   replaceChildren(){for(const child of this.children)child.isConnected=false;this.children=[]}};
  return dom[id];
 }
 el('authGate').hidden=true;el('appShell').hidden=false;el('boardTarget').value='shoes';
 const garment={id:'owner-a-shoe',name:'OWNER-A-PRIVATE-SHOE',image:'data:image/jpeg;base64,/9j/',
  category:'Shoes',itemType:'Sneakers',color:'Black'};
 const suggestion={type:'sneakers',color:'Blue',label:'Blue shoes',
  reason:'Private suggestion',trendSource:null,examples:[],retailerLinks:[],
  shoppingUrl:'https://example.org/shoes',query:'blue shoes'};
 const controller={active:controllerActive,status(){return {active:this.active}},
  setIdea(target,value){calls.push('native-idea:'+target+':'+value.type)}};
 function node(tag,label,className){
  return {tag,label,className,isConnected:true,textContent:label??'',type:'',children:[],
   append(...children){this.children.push(...children)},
   replaceChildren(){this.children=[]}};
 }
 const ctx={
  window:{closetAuth:auth},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:10,nativeLossless04Active:native,nativeLossless04:controller,
  currentBoard:{slots:{},ideas:{}},items:[garment],
  outfitSlots:[{id:'shoes',label:'Shoes',level:0}],
  $(id){return el(id)},node,
  closetGapOptions(){return [garment]},
  wardrobeGapIdeas(){return [suggestion]},
  boardLink(label,url){return node('a',label,url)},
  slotAllows(){return true},
  nativeLossless04Edit(call){calls.push('native-edit');call()},
  selectBoardPiece(slot,item){calls.push('owned:'+slot+':'+item)},
  renderOutfitBoard(){calls.push('render')},
  storeBoard(){calls.push('store');return Promise.resolve(true)}
 };
 vm.createContext(ctx);
 vm.runInContext(lease+suggestions,ctx,{timeout:1000});
 function find(node,condition){
  if(condition(node))return node;
  for(const child of node.children||[]){
   const result=find(child,condition);if(result)return result;
  }
  return null;
 }
 function render(){
  ctx.renderBoardSuggestions();
  const own=find(el('boardOwnedOptions'),x=>x.className==='board-owned-pick');
  const preview=find(el('boardRecommendations'),x=>x.label==='Try this idea on the board');
  return {own,preview};
 }
 return {ctx,calls,dom,auth,garment,suggestion,controller,render,
  swap(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++},
  replaceDB(){ctx.db={name:'closet-current-user-owner-a'}},
  epoch(){ctx.captureOperationEpoch++},
  revoke(){auth.revoked=true},
  lockGate(){dom.authGate.hidden=false},
  hideShell(){dom.appShell.hidden=true},
  rotateTarget(){dom.boardTarget.value='top'},
  replaceGarment(){ctx.items=[{...garment}]},
  replaceController(){ctx.nativeLossless04={active:true,status(){return {active:true}},setIdea(){calls.push('WRONG-CONTROLLER')}}},
  inactiveController(){controller.active=false},
  newOwnerDraft(){ctx.currentBoard={slots:{top:'NEW-OWNER-TOP'},ideas:{}};calls.length=0}
 };
}
test('valid default owner can select suggestion photo and persist',()=>{
 const f=fixture(),{own}=f.render();f.calls.length=0;own.onclick();
 assert.deepEqual(f.calls,['owned:shoes:owner-a-shoe']);
});
test('valid default owner can select a shopping direction without falsely claiming ownership',()=>{
 const f=fixture(),{preview}=f.render();f.calls.length=0;preview.onclick();
 assert.deepEqual(f.calls,['render','store']);
 assert.equal(f.ctx.currentBoard.ideas.shoes.type,'sneakers');
});
test('valid research-native owner can set a styling idea through the original controller',()=>{
 const f=fixture({native:true}),{preview}=f.render();f.calls.length=0;preview.onclick();
 assert.deepEqual(f.calls,['native-edit','native-idea:shoes:sneakers']);
});
test('valid research-native owned-photo pick preserves the established selection path',()=>{
 const f=fixture({native:true}),{own}=f.render();f.calls.length=0;own.onclick();
 assert.deepEqual(f.calls,['owned:shoes:owner-a-shoe']);
});
const reasons=[
 ['other owner',f=>f.swap()],
 ['same ID renewed login',f=>f.relogin()],
 ['new DB object',f=>f.replaceDB()],
 ['new capture epoch',f=>f.epoch()],
 ['revoked session',f=>f.revoke()],
 ['shown login gate',f=>f.lockGate()],
 ['hidden app shell',f=>f.hideShell()],
 ['changed slot target',f=>f.rotateTarget()]
];
for(const [reason,change] of reasons){
 for(const native of [false,true]){
  test((native?'native':'default')+' former-owner suggestion photo refuses '+reason,()=>{
   const f=fixture({native}),{own}=f.render();change(f);f.newOwnerDraft();
   own.onclick();assert.deepEqual(f.calls,[]);
   assert.equal(f.ctx.currentBoard.slots.top,'NEW-OWNER-TOP');
  });
  test((native?'native':'default')+' former-owner idea preview refuses '+reason,()=>{
   const f=fixture({native}),{preview}=f.render();change(f);f.newOwnerDraft();
   preview.onclick();assert.deepEqual(f.calls,[]);
   assert.equal(f.ctx.currentBoard.slots.top,'NEW-OWNER-TOP');
  });
 }
}
test('a detached old original photo option cannot select a garment even in the same session',()=>{
 const f=fixture(),{own}=f.render();own.isConnected=false;f.calls.length=0;
 own.onclick();assert.deepEqual(f.calls,[]);
});
test('a detached former styling idea preview cannot overwrite the current board',()=>{
 const f=fixture(),{preview}=f.render();preview.isConnected=false;f.calls.length=0;
 preview.onclick();assert.deepEqual(f.calls,[]);
});
test('a same-owner wardrobe refresh invalidates a former owned garment row',()=>{
 const f=fixture(),{own}=f.render();f.replaceGarment();f.calls.length=0;
 own.onclick();assert.deepEqual(f.calls,[]);
});
test('native idea cannot escape via a newly bound native controller after old owner logout',()=>{
 const f=fixture({native:true}),{preview}=f.render();f.replaceController();f.calls.length=0;
 preview.onclick();assert.deepEqual(f.calls,[]);
});
test('native idea cannot apply to a revoked controller that reports inactive',()=>{
 const f=fixture({native:true}),{preview}=f.render();f.inactiveController();f.calls.length=0;
 preview.onclick();assert.deepEqual(f.calls,[]);
});
test('rendered suggestion callbacks hold the source exact signed-owner lease',()=>{
 assert.match(suggestions,/const suggestionLease=beginOwnerBoardUiLease\(\)/);
 assert.match(suggestions,/suggestionConsumer=nativeLossless04/);
 assert.match(suggestions,/!items\.includes\(item\)/);
 assert.match(suggestions,/preview\.isConnected===false/);
 assert.match(suggestions,/nativeLossless04===suggestionConsumer/);
 assert.match(suggestions,/suggestionConsumer\.setIdea\(target,idea\)/);
});
