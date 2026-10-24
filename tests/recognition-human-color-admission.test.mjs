import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the ACTUAL browser app source functions with synthetic garment
// captures. No copied policy, model calls, network, external credentials,
// private JPEGs or staging. Original/classifier payloads are mock responses.
const source=await readFile('public/app.js','utf8');
function section(start,end){
 const begin=source.indexOf(start),finish=source.indexOf(end,begin);
 assert.ok(begin>=0&&finish>begin, 'App section changed: '+start);
 return source.slice(begin,finish);
}
const proof=section('const verifiedColorAdmission=new WeakMap();','// Saving is transactional');
const quick=section('function canConfirmReviewedColor(item){','function renderPhotoResults(');
const recognizer=section('async function recognizeItem(item){','async function recognizeBatch()');
const currentApp=proof+'\n'+quick+'\n'+recognizer+'\n({recognizeItem,canConfirmReviewedColor,confirmReviewedColor,hasReviewedColorAdmission})';

function makeCase({
 category='Uncategorized',type='Unknown',color='',strong=true,
 partial=false,modelCategory='Shoes',modelType='Sneakers',
 mask=true,scene=false,duplicate=false,ownership=false,
 blank=false,sourceChanged=false
}={}){
 const original='data:image/jpeg;base64,synthetic-source-A';
 const sceneImage='data:image/jpeg;base64,synthetic-full-scene-A';
 const item={
  id:'synthetic-garment-1',image:original,
  color,category,itemType:type,userAdjusted:false,localAnalyzed:false,
  possibleDuplicate:false,requiresOwnershipConfirmation:ownership,
  originalPhoto:scene?{image:sceneImage}:undefined,
  recognitionPhoto:scene?{image:original}:undefined,
  outfitSourceId:scene?'synthetic-outfit':undefined,
  segmentHint:scene?{categories:[modelCategory],types:[modelType]}:undefined
 };
 const store={items:[],state:[]};
 let savedAuto=0,started=0,externalCalls=0,sourceMutation=sourceChanged;
 const db={
  transaction(){const tx={objectStore(name){return {
   put(value){store[name].push(structuredClone(value));if(name==='state')
     Promise.resolve().then(()=>tx.oncomplete?.());}
  };}};return tx;}
 };
 const ctx={
  structuredClone,
  window:{closetAuth:{user:{id:'owner-A'}}},db,
  items:duplicate?[{id:'other-garment',image:original}]:[],
  batch:[item],localPending:new Set([item.id]),
  recognitionState:{phase:'ready',activeId:null},
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  render(){},persistDraft(){},scheduleMemoryReview(){},message(){},
  localReady:true,recognitionUnavailable:false,
  recognitionSourcePhoto:x=>x.recognitionPhoto?.image||x.image,
  checkPhoto:async()=>({blank,signature:'signature-photo-A',aspect:1,colorEstimate:null}),
  trustedAutomaticPhotoColor:()=>null,
  ClothingDetails:{
   fillColor(){return {};}, fill(){return {};},
   validColor:value=>typeof value==='string'&&value.length>0&&value!=='Unknown'
  },
  independentlyDistinctOutfitRegions:()=>true,
  exactlyRepeatedCapturedItem:()=>false,
  similarPhotos:()=>false,
  ClothingMemory:undefined,
  localRequest:async()=>{
   if(sourceMutation){item.image='data:image/jpeg;base64,synthetic-retake-B';sourceMutation=false;}
   return {strong,categoryConfirmed:partial,categoryOnly:partial,
    choices:strong||partial?[{category:modelCategory,itemType:partial?'Unknown':modelType}]:[],
    details:{},reason:'synthetic-classifier-reply'};
  },
  clothingSchema:{types:{
   Shoes:['Sneakers','Boots'],Bottoms:['Shorts','Skirt'],
   Dresses:['Dress'],Tops:['T-shirt'],Outerwear:['Jacket']
  }},
  segmentationAllows:()=>mask,
  applyLocalChoice:(t,c)=>{t.category=c.category;t.itemType=c.itemType;},
  saveIndexed:async()=>{savedAuto++;return true;},
  queued:async callback=>{started++;return callback();},
  normalizeClothing:x=>({...x}),
  $:()=>({textContent:''}),
  recordDeviceEvent:()=>{}
 };
 const api=vm.runInNewContext(currentApp,ctx,{timeout:1200});
 return {
  item,ctx,db,store,api,
  async scan(){await api.recognizeItem(item);},
  get autoSaved(){return savedAuto;},
  get queued(){return started;},
  get networkRequests(){return externalCalls;}
 };
}

test('a strong shoe category with unknown color stays review-required but offers one human color confirmation',async()=>{
 const f=makeCase();await f.scan();
 assert.equal(f.autoSaved,0);
 assert.equal(f.item.category,'Shoes');
 assert.equal(f.item.itemType,'Sneakers');
 assert.equal(f.item.recognitionReviewRequired,true);
 assert.equal(f.api.canConfirmReviewedColor(f.item),true);
});
test('category-only Bottoms Unknown subtype may ask for color without fabricating Shorts or Skirt',async()=>{
 const f=makeCase({strong:false,partial:true,modelCategory:'Bottoms'});
 await f.scan();
 assert.equal(f.autoSaved,0);
 assert.equal(f.item.category,'Bottoms');
 assert.equal(f.item.itemType,'Unknown');
 assert.equal(f.api.canConfirmReviewedColor(f.item),true);
});
test('choosing a color commits actual quick-color transaction, records explicit human source, clears review for saved clone',async()=>{
 const f=makeCase();await f.scan();
 assert.equal(await f.api.confirmReviewedColor(f.item,'Blue'),true);
 assert.equal(f.store.items.length,1);
 const stored=f.store.items[0];
 assert.equal(stored.category,'Shoes');
 assert.equal(stored.itemType,'Sneakers');
 assert.equal(stored.color,'Blue');
 assert.equal(stored.colorSource,'user');
 assert.equal(stored.userAdjusted,true);
 assert.equal(stored.recognitionReviewRequired,false);
 assert.equal(f.ctx.batch.length,0);
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('category-only human color commit does not mislabel a skirt or shorts',async()=>{
 const f=makeCase({strong:false,partial:true,modelCategory:'Bottoms'});
 await f.scan();
 assert.equal(await f.api.confirmReviewedColor(f.item,'Black'),true);
 assert.equal(f.store.items[0].category,'Bottoms');
 assert.equal(f.store.items[0].itemType,'Unknown');
 assert.equal(f.store.items[0].indexingLevel,'category-color');
 assert.equal(f.store.items[0].recognitionReviewRequired,false);
});
test('restored draft with forged classifier flag cannot use quick-color path without an in-session admission',()=>{
 const f=makeCase();
 f.item.localAnalyzed=true;f.item.category='Shoes';f.item.itemType='Sneakers';
 f.item.recognitionReviewRequired=true;
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
 f.item.recognitionReviewRequired=false;
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('misclassified shoe/shorts mask is denied even with a strong classifier output',async()=>{
 const f=makeCase({mask:false});await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
 assert.equal(f.item.recognitionReviewRequired,true);
 assert.equal(f.autoSaved,0);
});
test('unknown or abstained classifier remains review-required',async()=>{
 const f=makeCase({strong:false,partial:false});await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('unverified original outfit crop is NOT one-tap eligible',async()=>{
 const f=makeCase({scene:true});f.item.segmentHint.displayFallback='original-crop';
 await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
 assert.equal(f.item.recognitionReviewRequired,true);
});
test('duplicate saved piece blocks human-color quick-save',async()=>{
 const f=makeCase({duplicate:true});await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
 assert.equal(f.autoSaved,0);
});
test('garment ownership confirmation cannot be bypassed by quick-color',async()=>{
 const f=makeCase({ownership:true});await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('manual edits do not allow previous classifier proof to approve quick-color',async()=>{
 const f=makeCase();await f.scan();
 f.item.userAdjusted=true;
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('category or type change invalidates the approved original/classifier proof',async()=>{
 const f=makeCase();await f.scan();
 f.item.category='Bottoms';assert.equal(f.api.canConfirmReviewedColor(f.item),false);
 f.item.category='Shoes';f.item.itemType='Boots';
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('swapping current photo invalidates saved color admission',async()=>{
 const f=makeCase();await f.scan();
 f.item.image='data:image/jpeg;base64,synthetic-photo-B';
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('changing full original scene or segment hint invalidates color admission',async()=>{
 const f=makeCase({scene:true});await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),true);
 f.item.originalPhoto.image='data:image/jpeg;base64,synthetic-new-scene';
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
 f.item.originalPhoto.image='data:image/jpeg;base64,synthetic-full-scene-A';
 f.item.segmentHint.categories=['Bottoms'];
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('account switch invalidates in-memory admission even if garment object remains',async()=>{
 const f=makeCase();await f.scan();
 f.ctx.window.closetAuth.user.id='owner-B';
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('database connection switch invalidates admission even on same account',async()=>{
 const f=makeCase();await f.scan();
 f.ctx.db={};
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('pending rescan invalidates old admitted color before new classifier completes',async()=>{
 const f=makeCase();await f.scan();
 assert.equal(f.api.canConfirmReviewedColor(f.item),true);
 f.ctx.localPending.add(f.item.id);
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('blank or replaced source cannot acquire color admission on new scan',async()=>{
 const blank=makeCase({blank:true});await blank.scan();
 assert.equal(blank.api.canConfirmReviewedColor(blank.item),false);
 const changed=makeCase({sourceChanged:true});await changed.scan();
 assert.equal(changed.api.canConfirmReviewedColor(changed.item),false);
});
test('quick color rejects non-palette and already-colored selections',async()=>{
 const f=makeCase();await f.scan();
 assert.equal(await f.api.confirmReviewedColor(f.item,''),false);
 f.item.color='Red';
 assert.equal(f.api.canConfirmReviewedColor(f.item),false);
});
test('two sessions have independent approvals; one scan cannot make another synthetic photo saveable',async()=>{
 const a=makeCase();await a.scan();
 const b=makeCase();
 b.item.localAnalyzed=true;b.item.category='Shoes';b.item.itemType='Sneakers';
 b.item.recognitionReviewRequired=true;
 assert.equal(a.api.canConfirmReviewedColor(a.item),true);
 assert.equal(b.api.canConfirmReviewedColor(b.item),false);
});
