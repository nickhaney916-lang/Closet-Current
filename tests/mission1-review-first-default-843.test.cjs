'use strict';
// P843 executes the unchanged P842 classifier admission, save transaction,
// and recognition code with the ACTUAL top-level review-first declaration.
// Synthetic worker results are never represented as original-photo accuracy.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const extract=(start,end)=>{
 const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'P843 actual source function missing: '+start);
 return app.slice(i,j);
};
const declaration=app.match(/^const reviewFirst836=.*;$/m)?.[0];
assert.ok(declaration,'P843 must execute ACTUAL review-first declaration');
const source=declaration+'\n'+
 extract('function automaticAdmissionCore842(', 'async function recognizeBatch(');
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const original=()=>({id:'source-a',image:'data:image/jpeg;base64,QUJDRA==',
 name:'',category:'Uncategorized',itemType:'Unknown',color:'Blue',
 localStatus:'',requiresOwnershipConfirmation:false,possibleDuplicate:false,
 userAdjusted:false,seasons:[],segmentHint:null});
const strong=()=>({strong:true,categoryConfirmed:true,categoryOnly:false,
 choices:[{label:'a T-shirt',category:'Tops',itemType:'T-shirt',sleeveLength:'Unknown'}],
 details:{color:'Blue'}});
const partial=()=>({strong:false,categoryConfirmed:true,categoryOnly:true,
 choices:[{label:'a top',category:'Tops',itemType:'Unknown'}],details:{}});
function scene({result=strong(),item=original(),href='https://closet.test/?reviewFirst836=0',others=[]}={}){
 const writes=[];
 const c={URL,location:{href},categories,Date,structuredClone,
  batch:[item],items:others,localPending:new Set([item.id]),localReady:true,
  recognitionUnavailable:false,recognitionState:{phase:'ready',activeId:null},
  checkPhoto:async()=>({blank:false,aspect:1,signature:[1,2,3],colorEstimate:null}),
  similarPhotos:()=>false,localRequest:async()=>result,segmentationAllows:()=>true,
  render(){},persistDraft(){},message(){},$(){return {textContent:''};},
  normalizeClothing:x=>({...x}),queued:work=>work(),
  ClothingDetails:{fillColor:x=>({...x}),fill:x=>({...x})},
  applyLocalChoice(x,choice){x.category=choice.category;x.itemType=choice.itemType;},
  db:{transaction(){
   const tx={oncomplete:null,objectStore(name){return {put(value){writes.push({name,value});}}}};
   queueMicrotask(()=>tx.oncomplete?.());return tx;
  }}
 };
 vm.createContext(c);vm.runInContext(source,c);
 return {c,item,writes,
  scan:()=>c.recognizeItem(item),
  tryAutoSave:()=>c.saveIndexed(item)};
}
test('P843 research default is a literal immutable true, not a URL opt-in',()=>{
 assert.equal(declaration.trim(),'const reviewFirst836=true;');
 const h=scene();assert.equal(vm.runInContext('reviewFirst836',h.c),true);
 assert.throws(()=>vm.runInContext('reviewFirst836=false;',h.c),/constant|Assignment to constant/);
});
test('P843 full strong model suggestion never enters closet until owner review',async()=>{
 const h=scene();assert.equal(await h.scan(),true);
 assert.equal(h.item.category,'Tops');
 assert.equal(h.item.requiresOwnershipConfirmation,true);
 assert.match(h.item.localStatus,/Tap Adjust to confirm/);
 assert.equal(h.c.items.length,0);assert.equal(h.c.batch.length,1);
 assert.equal(h.writes.length,0);
 assert.equal(h.c.localPending.size,0);
});
test('P843 forged URL params cannot disable review-first admission',async()=>{
 for(const suffix of ['reviewFirst836=0','reviewFirst836=1','reviewFirst836=false',
  'autoSave=1','reviewFirst836=0&unsafeLegacyAutoSave843=1']){
  const h=scene({href:'https://closet.test/?'+suffix});
  await h.scan();
  assert.equal(h.writes.length,0,suffix);
  assert.equal(h.c.batch.length,1,suffix);
  assert.equal(h.item.requiresOwnershipConfirmation,true,suffix);
 }
});
test('P843 direct automatic persistence invocation is blocked for strong complete evidence',async()=>{
 const h=scene();h.item.category='Tops';h.item.itemType='T-shirt';h.item.color='Blue';
 assert.equal(await h.tryAutoSave(),false);
 assert.equal(h.writes.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch.length,1);
});
test('P843 category-only and high-risk suggestions remain owner drafts',async()=>{
 for(const result of [partial(),{
  ...strong(),diagnostics:{mission1SubtypeSafety:{ownerSubtypeReviewRequired:true}}
 }]){
  const h=scene({result});assert.equal(await h.scan(),true);
  assert.equal(h.writes.length,0);
  assert.equal(h.c.batch.length,1);
  assert.equal(h.item.requiresOwnershipConfirmation,true);
 }
});
test('P843 incomplete color and unsupported garment identity still cannot be saved',async()=>{
 for(const color of ['', 'Unknown', '  uNkNoWn  ']){
  const h=scene({item:{...original(),color}});
  assert.equal(await h.scan(),true);assert.equal(h.writes.length,0);
  assert.equal(h.c.batch.length,1);
 }
});
test('P843 classifier failure preserves the original unsaved photo and retryable state',async()=>{
 const h=scene();h.c.localRequest=async()=>{throw Error('model offline');};
 assert.equal(await h.scan(),false);
 assert.equal(h.writes.length,0);assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch.length,1);assert.equal(h.c.localPending.size,0);
 assert.equal(h.item.scanFailed,true);
});
test('P843 already-owned pieces are untouched; the new guard affects new draft admission only',()=>{
 const saved={...original(),id:'existing-owner-saved',category:'Tops',itemType:'T-shirt'};
 const h=scene({others:[saved]});
 assert.equal(h.c.items.length,1);assert.equal(h.c.items[0].id,'existing-owner-saved');
 assert.equal(h.c.batch.length,1);
});
