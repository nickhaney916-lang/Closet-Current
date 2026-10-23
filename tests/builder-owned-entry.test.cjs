const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const els=new Map(),calls=[];
 const el=id=>{if(!els.has(id))els.set(id,{addEventListener(k,fn){this[k]=fn;}});return els.get(id);};
 const c={$:el,items:[],currentBoard:{slots:{}},switchView:v=>calls.push(v),
  stylistOwnsCloset:()=>true,refuseStylistAccount:()=>calls.push('refused'),styleNewClosetItem:id=>calls.push(id)};
 el('stylistClearAnchor').click=()=>calls.push('clear');el('styleCollectionForm').requestSubmit=()=>calls.push('submit');
 vm.createContext(c);const source=fs.readFileSync('public/outfit-board.js','utf8');
 vm.runInContext(source.slice(source.indexOf('// Reuse the account-bound owned stylist')),c);
 return {c,el,calls};
}
test('empty builder offers Add clothing and cannot request imaginary owned outfits',()=>{
 const h=setup();h.c.renderBuilderOwnedStart();assert.equal(h.el('builderCreateOwned').disabled,true);
 assert.match(h.el('builderOwnedStatus').textContent,/closet is empty/);
 h.el('builderAddClothes').click();assert.deepEqual(h.calls,['scan']);
});
test('builder reuses existing stylist and persisted pin instead of silently changing the anchor',()=>{
 const h=setup();h.c.items=[{id:'top',category:'Tops'},{id:'shoe',category:'Shoes',name:'New shoes'}];
 h.c.currentBoard={slots:{top:'top',shoes:'shoe'},anchorItemId:'shoe'};
 h.c.renderBuilderOwnedStart();assert.equal(h.el('builderCreateOwned').disabled,false);
 assert.equal(h.el('builderStyleSelected').textContent,'Style pinned piece');
 h.el('builderStyleSelected').click();assert.deepEqual(h.calls,['shoe']);
 h.el('builderCreateOwned').click();assert.deepEqual(h.calls,['shoe','clear','stylist','submit']);
});
test('account change is refused before whole-closet outfit generation',()=>{
 const h=setup();h.c.stylistOwnsCloset=()=>false;h.el('builderCreateOwned').click();
 assert.deepEqual(h.calls,['refused']);
});
