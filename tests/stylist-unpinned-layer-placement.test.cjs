'use strict';
const syntheticPhoto=require('./helpers/issue204-photo.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){const c={URL,encodeURIComponent,Date};vm.createContext(c);
 for(const f of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])
  vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);return c;}
const p=(id,category,itemType,opts={})=>({id,category,itemType,name:id,image:syntheticPhoto(id),
 color:'Black',pattern:'Solid',sleeveLength:'Unknown',seasons:[],...opts});
const separates=()=>[p('shirt','Tops','T-shirt'),p('pants','Bottoms','Jeans'),p('shoes','Shoes','Sneakers')];
test('without Style this, owned jackets and blazers belong to jacket slot, never sweater layer',()=>{
 const c=setup(),clothes=[...separates(),p('jacket','Outerwear','Jacket'),p('blazer','Outerwear','Blazer')];
 const before=JSON.stringify(clothes);
 const results=c.styleOwnedCollection(clothes,{request:'Casual',season:'Fall'});
 assert.equal(results.length,2);
 assert.deepEqual(new Set(results.map(x=>x.board.slots.layer2)),new Set(['jacket','blazer']));
 for(const r of results){
  assert.equal(r.board.slots.layer,undefined);
  assert.equal(r.board.slots.layer3,undefined);
  assert.equal(r.board.slots.top,'shirt');
  assert.equal(r.missing.length,0);
  assert.ok(r.board.layerCount>=2);
  assert.equal(new Set(Object.values(r.board.slots)).size,Object.values(r.board.slots).length);
 }
 assert.equal(JSON.stringify(clothes),before);
});
test('coat/raincoat never appear as a sweater or a jacket; cardigan and vest stay in sweater layer',()=>{
 const c=setup(),clothes=[...separates(),p('coat','Outerwear','Coat'),
  p('raincoat','Outerwear','Raincoat'),p('cardigan','Outerwear','Cardigan'),
  p('vest','Outerwear','Vest')];
 const results=c.styleOwnedCollection(clothes,{request:'Casual',season:'Winter'});
 assert.equal(results.length,3);
 assert.ok(results.some(x=>x.board.slots.layer3==='coat'));
 assert.ok(results.some(x=>x.board.slots.layer3==='raincoat'));
 for(const r of results){
  for(const [slot,id]of Object.entries(r.board.slots)){
   const item=clothes.find(x=>x.id===id);
   if(slot==='layer')assert.ok(['Cardigan','Vest'].includes(item.itemType),item.itemType);
   if(slot==='layer2')assert.ok(!['Coat','Raincoat','Cardigan','Vest'].includes(item.itemType));
   if(slot==='layer3')assert.ok(['Coat','Raincoat'].includes(item.itemType));
  }
  assert.equal(Object.values(r.board.slots).filter(id=>id==='coat').length<=1,true);
 }
});
test('when unpinned layers include an actual sweatshirt, jacket and winter coat, no outfit double-counts outerwear',()=>{
 const c=setup(),clothes=[...separates(),p('sweater','Tops','Sweatshirt'),
  p('jacket','Outerwear','Jacket'),p('coat','Outerwear','Coat')];
 const outputs=c.styleOwnedCollection(clothes,{request:'Casual',season:'Winter'});
 assert.equal(outputs.length,3);
 const distinct=new Set();
 for(const r of outputs){
  const layered=['layer','layer2','layer3'].filter(slot=>r.board.slots[slot]);
  assert.equal(layered.length,1,'Unpinned layers use a single optional outer garment');
  const slot=layered[0];distinct.add(slot);
  if(slot==='layer')assert.equal(r.board.slots.layer,'sweater');
  else if(slot==='layer2')assert.equal(r.board.slots.layer2,'jacket');
  else assert.equal(r.board.slots.layer3,'coat');
  assert.equal(r.board.slots.top,'shirt');
  assert.ok(r.references.every(reference=>clothes.some(x=>x.id===reference.itemId)));
 }
 assert.deepEqual(distinct,new Set(['layer','layer2','layer3']));
});
test('unpinned summer and activewear never add optional coats or competing dressy layers',()=>{
 const c=setup(),clothes=[...separates(),p('coat','Outerwear','Coat'),
  p('jacket','Outerwear','Jacket'),p('cardigan','Outerwear','Cardigan')];
 for(const request of [{request:'Casual',season:'Summer'},{request:'Activewear',season:'Winter'}]){
  const outputs=c.styleOwnedCollection(clothes,request);
  assert.ok(outputs.length>0);
  assert.ok(outputs.every(x=>!x.board.slots.layer&&!x.board.slots.layer2&&!x.board.slots.layer3));
 }
});
test('dress recommendations never expose an optional outerwear layer or duplicate hidden bottoms',()=>{
 const c=setup(),clothes=[p('dress','Dresses','Casual dress'),p('shoes','Shoes','Flats'),
  p('jacket','Outerwear','Jacket'),p('coat','Outerwear','Coat')];
 const outputs=c.styleOwnedCollection(clothes,{request:'Casual',season:'Fall'});
 assert.ok(outputs.length>0);
 for(const r of outputs) {
  assert.equal(r.board.slots.top,'dress');
  assert.equal(r.board.slots.bottom,undefined);
  assert.equal(r.board.slots.layer,undefined);
  assert.equal(r.board.slots.layer2,undefined);
  assert.equal(r.board.slots.layer3,undefined);
 }
});
test('Style this coat stays in correct coat layer with optional lighter owned layer, no silent replacement',()=>{
 const c=setup(),clothes=[...separates(),p('coat','Outerwear','Coat'),
  p('jacket','Outerwear','Jacket'),p('cardigan','Outerwear','Cardigan')];
 const outputs=c.styleOwnedCollection(clothes,{request:'Casual',season:'Winter',anchorItemId:'coat'});
 assert.ok(outputs.length);
 for(const r of outputs){
  assert.equal(r.board.slots.layer3,'coat');
  assert.notEqual(r.board.slots.layer,'jacket');
  assert.equal(r.board.slots.layer2,undefined);
  assert.ok(!r.board.slots.layer||r.board.slots.layer==='cardigan');
  assert.equal(Object.values(r.board.slots).filter(id=>id==='coat').length,1);
 }
 assert.equal(c.styleOwnedCollection(clothes.filter(x=>x.id!=='coat'),{anchorItemId:'coat'}).length,0);
});
