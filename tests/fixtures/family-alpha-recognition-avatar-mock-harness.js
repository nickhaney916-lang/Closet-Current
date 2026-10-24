'use strict';
// OFFLINE TEST FIXTURE. These dependency shims intentionally represent a
// mocked classifier/Auth response. Actual recognition/confirm functions are
// appended at runtime from source-pinned combined app.js, never copied here.
const $=id=>document.getElementById(id);
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const ownerA='a1111111-1111-4111-8111-111111111111';
const ownerB='b2222222-2222-4222-8222-222222222222';
const ownerState={owner:ownerA,epoch:1,db:null};
window.closetAuth={user:{id:ownerA},getSessionGeneration:()=>ownerState.epoch,
 getAccessToken:async()=> 'synthetic-jwt-not-valid',getPublicKey:()=> 'mock-publishable'};
window.closetCloud={getOwnerId:d=>d===ownerState.db?ownerState.owner:null,
 beforeWrite:async d=>{if(d!==ownerState.db)throw Error('Not this owner');},
 changed(){}};
let db,items=[],batch=[],recognitionUnavailable=false,localReady=true;
const localPending=new Set(),recognitionState={phase:'ready',activeId:null};
let writes=Promise.resolve();
function render(){}function persistDraft(){}function scheduleMemoryReview(){}
function message(){}function recordDeviceEvent(){}
function checkPhoto(photo){
 if(!photo.startsWith('data:image/jpeg;base64,'))throw Error('Input not JPEG');
 return Promise.resolve({blank:false,signature:photo.slice(0,100),aspect:1,colorEstimate:null});
}
function trustedAutomaticPhotoColor(){return null;}
const ClothingDetails={validColor:c=>typeof c==='string'&&c.length>0&&c!=='Unknown',
 fillColor:()=>({}),fill:()=>({})};
const clothingSchema={types:{Tops:['T-shirt'],Bottoms:['Shorts','Skirt'],Shoes:['Sneakers'],Dresses:['Dress']}};
function segmentationAllows(item,choice){return item.segmentHint?.clipped!==true&&choice?.category==='Tops';}
function applyLocalChoice(item,choice){item.category=choice.category;item.itemType=choice.itemType;}
function exactlyRepeatedCapturedItem(){return false;}
function independentlyDistinctOutfitRegions(){return true;}
function similarPhotos(){return false;}
function localRequest(kind,source){
 if(kind!=='classify')throw Error('Mock only');
 if(source!==batch[0]?.image)throw Error('Classifier did not receive original JPEG');
 return Promise.resolve({strong:true,categoryConfirmed:false,categoryOnly:false,
  choices:[{category:'Tops',itemType:'T-shirt'}],details:{},reason:'mock-test-only'});
}
function normalizeClothing(value){return value;}
async function saveIndexed(){throw Error('Strong classification MUST require explicit color before saving');}
async function openPrivate(){
 const owner=ownerState.owner,request=indexedDB.open('closet-current-user-'+owner,2);
 const opened=await new Promise((resolve,reject)=>{
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains('items'))request.result.createObjectStore('items',{keyPath:'id'});
   if(!request.result.objectStoreNames.contains('state'))request.result.createObjectStore('state',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 db=opened;ownerState.db=opened;return opened;
}
async function scanRealPhoto(image){
 if(typeof image!=='string'||!image.startsWith('data:image/jpeg;base64,'))throw Error('Missing original photo');
 const item={id:'synthetic-top-1',image,originalPhoto:{image},category:'Uncategorized',
  itemType:'Unknown',color:'',userAdjusted:false,localAnalyzed:false};
 batch=[item];localPending.add(item.id);
 await recognizeItem(item);
 return {classified:item.category==='Tops'&&item.itemType==='T-shirt',
  reviewRequired:item.recognitionReviewRequired,chooseColor:canConfirmReviewedColor(item),
  noAutoSave:items.length===0,sourceUnchanged:item.image===image,itemId:item.id};
}
async function confirmAndSelect(){
 if(!await confirmReviewedColor(batch[0],'Blue'))throw Error('Human color confirmation failed');
 const tx=db.transaction('state','readwrite'),slot=tx.objectStore('state');
 slot.put({id:'outfit-board',current:{slots:{top:items[0].id}}});
 await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
 const persisted=await new Promise((resolve,reject)=>{
  const req=db.transaction('items','readonly').objectStore('items').get(items[0].id);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 return {id:persisted?.id,color:persisted?.color,source:persisted?.colorSource,
  originalPreserved:persisted?.originalPhoto?.image===persisted.image,
  reviewCleared:persisted?.recognitionReviewRequired===false,
  inMemory:items.length,owner:db.name};
}
window.__syntheticFlow={
 ownerA,ownerB,ownerState,openPrivate,scanRealPhoto,confirmAndSelect,
 getDb:()=>db,getItems:()=>items,
 switchOwner(){ownerState.owner=ownerB;ownerState.epoch++;window.closetAuth.user={id:ownerB};},
 isOwnerA(){return ownerState.owner===ownerA;}
};
