'use strict';
// Actual app.js function bodies tested with controlled synthetic worker inputs.
// No genuine photo inference or owner approvals are claimed by this suite.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
function part(start,end){
 const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'missing P842 source boundary '+start);
 return app.slice(i,j);
}
const admissionAndSave=part('function automaticAdmissionCore842(', 'async function recognizeItem(');
const admissionOnly=part('function automaticAdmissionCore842(', 'async function saveIndexed(');
const recognize=part('async function recognizeItem(', 'async function recognizeBatch(');
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const baseItem=()=>({id:'synthetic-id',image:'data:image/jpeg;base64,QUJDRA==',category:'Tops',
 color:'Blue',itemType:'T-shirt',name:'Blue T-shirt',userAdjusted:false,localAnalyzed:false,
 requiresOwnershipConfirmation:false,possibleDuplicate:false,segmentHint:null});
function makeStorage(item,reviewFirst=false){
 const writes=[],c={categories,reviewFirst836:reviewFirst,structuredClone,Date,
  batch:[item],items:[],normalizeClothing:x=>({...x}),queued:work=>work(),
  persistDraft(){},
  db:{transaction(){
   const tx={oncomplete:null,objectStore(name){return {put(value){writes.push({name,value});}}}};
   queueMicrotask(()=>{if(tx.oncomplete)tx.oncomplete();});
   return tx;
  }}
 };
 vm.createContext(c);vm.runInContext(admissionAndSave,c);
 return {c,writes,save:()=>c.saveIndexed(item)};
}
test('P842 valid source/category/color can reach legacy automatic persistence when trial is off',async()=>{
 const item=baseItem(),h=makeStorage(item);
 assert.equal(await h.save(),true);assert.equal(h.c.items.length,1);
 assert.equal(h.writes.filter(x=>x.name==='items').length,1);
 assert.equal(h.c.batch.length,0);
});
test('P842 storage boundary refuses unknown categories/colors and ambiguous source states',async()=>{
 const cases=[
  {category:'Uncategorized'},
  {category:'made-up model label'},
  {color:''},
  {color:'    '},
  {color:'Unknown'},
  {color:'  uNkNoWn  '},
  {image:''},
  {possibleDuplicate:true},
  {requiresOwnershipConfirmation:true},
  {outfitSourceId:'scene-id'},
  {segmentHint:{clipped:true,categories:['Tops']}}
 ];
 for(const patch of cases){
  const item={...baseItem(),...patch},h=makeStorage(item);
  assert.equal(await h.save(),false,'expected review hold: '+JSON.stringify(patch));
  assert.equal(h.c.items.length,0,'no item inserted for '+JSON.stringify(patch));
  assert.equal(h.writes.length,0,'no database writes for '+JSON.stringify(patch));
  assert.equal(h.c.batch.length,1,'the original draft survives');
 }
});
test('P842 reviewFirst836 opt-in cannot be bypassed through direct saveIndexed()',async()=>{
 const item=baseItem(),h=makeStorage(item,true);
 assert.equal(await h.save(),false);assert.equal(h.writes.length,0);
 assert.equal(h.c.batch.length,1);
});
function makeInference(result,patch={},reviewFirst=false){
 const item={...baseItem(),...patch},events=[];
 const c={categories,reviewFirst836:reviewFirst,Date,items:[],batch:[item],
  recognitionUnavailable:false,localReady:true,localPending:new Set([item.id]),
  recognitionState:{phase:'ready',activeId:null},events,
  persistDraft(){},render(){},similarPhotos:()=>false,
  checkPhoto:async()=>({blank:false,colorEstimate:null,signature:[1,2,3],aspect:1}),
  localRequest:async()=>result,
  ClothingDetails:{fillColor:value=>({...value}),fill:value=>({...value})},
  applyLocalChoice(value,choice){value.category=choice.category;value.itemType=choice.itemType;},
  segmentationAllows:()=>true,
  saveIndexed:async()=>{events.push('automatic-save');return true;},
  $:()=>({textContent:''})
 };
 vm.createContext(c);vm.runInContext(admissionOnly+recognize,c);
 return {c,item,events,run:()=>c.recognizeItem(item)};
}
const strong=(diagnostics=null)=>({strong:true,categoryConfirmed:true,categoryOnly:false,
 choices:[{category:'Tops',itemType:'T-shirt',label:'a T-shirt'}],details:{},
 ...(diagnostics?{diagnostics}:{})});
const partial=()=>({strong:false,categoryConfirmed:true,categoryOnly:true,
 choices:[{category:'Tops',itemType:'Unknown',label:'a top'}],details:{}});
test('P842 category-only inference with known color stays draft, never automatically becomes an owned item',async()=>{
 const h=makeInference(partial());assert.equal(await h.run(),true);
 assert.equal(h.item.requiresOwnershipConfirmation,true);
 assert.equal(h.events.length,0);
 assert.equal(h.c.batch.length,1);
 assert.match(h.item.localStatus,/Only a broad garment category/);
});
test('P842 strong inference with Unknown color stays owner-review draft',async()=>{
 const h=makeInference(strong(),{color:'  UNKNOWN  '});assert.equal(await h.run(),true);
 assert.equal(h.item.requiresOwnershipConfirmation,true);assert.equal(h.events.length,0);
 assert.match(h.item.localStatus,/incomplete or ambiguous/);
});
test('P842 high-risk diagnostic forces owner review even when worker incorrectly says strong',async()=>{
 const h=makeInference(strong({mission1SubtypeSafety:{ownerSubtypeReviewRequired:true}}));
 assert.equal(await h.run(),true);assert.equal(h.item.requiresOwnershipConfirmation,true);
 assert.equal(h.events.length,0);assert.equal(h.c.batch.length,1);
});
test('P842 strong complete result still permits existing behavior when opt-in trial is off',async()=>{
 const h=makeInference(strong());assert.equal(await h.run(),true);
 assert.deepEqual(h.events,['automatic-save']);
});
test('P842 reviewFirst836 research trial still blocks even a strong complete result',async()=>{
 const h=makeInference(strong(),{},true);assert.equal(await h.run(),true);
 assert.equal(h.item.requiresOwnershipConfirmation,true);assert.equal(h.events.length,0);
});
