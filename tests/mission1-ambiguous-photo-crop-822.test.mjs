import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync('public/app.js','utf8');
const a=app.indexOf('function cropClothingPhoto(item){');
const b=app.indexOf('function cropButton(item)',a);
assert.ok(a>=0&&b>a,'native crop function source anchors exist');
const nativeCrop=app.slice(a,b);

function harness({ambiguous=true,confirmed=false,saved=false}={}){
 const original='data:image/jpeg;base64,AAEE';
 const item={id:'private-photo-piece',ownerId:'signed-owner-1',
  image:'data:image/jpeg;base64,AABB',
  originalPhoto:{image:original,sha256:'sha-original'},
  sourceSHA256:'sha-original',sourceHashVerified:true,
  outfitSourceId:'outfit-1',segmentHint:{
   sourceDisconnectedReviewRequired:ambiguous,
   originalSHA256:'sha-original',cutoutSHA256:'previous-cutout',
   verified:true,ownerReviewedInstance:true
  },
  category:'Tops',itemType:'Shirt',color:'Red',
  colorSource:'photo-estimate',sourceAmbiguityAcknowledged820:confirmed,
  sourceAmbiguityReviewProvenance820:confirmed?'owner-original-confirmation':undefined,
  recognitionMemory:{suggestedCategory:'Tops'}};
 const calls={inference:0,color:0,quality:0,classification:0,renders:0},stored=[],messages=[];
 let callbacks;
 const db={transaction:()=>{
  const tx={oncomplete:null,onerror:null,onabort:null,
   objectStore:()=>({put:row=>{if(row.id==='draft')stored.push(structuredClone(row.batch[0]));}})};
  queueMicrotask(()=>tx.oncomplete?.());
  return tx;
 }};
 const c={localPending:new Set(),busy:false,stream:null,cameraOpening:false,
  items:saved?[item]:[],batch:[item],structuredClone,db,
  openPhotoCrop:(_item,handlers)=>{callbacks=handlers;return Promise.resolve();},
  localReady:false,enableLocal:async()=>{calls.inference++;},
  localRequest:async()=>{calls.inference++;return {strong:true,choices:[{
   category:'Tops',itemType:'Shirt',color:'Blue',details:{}
  }]};},
  segmentationAllows:()=>true,
  ClothingDetails:{
   recognizedFields:()=>({}),
   fillColor:(v,estimate)=>{calls.color++;return {...v,
    color:estimate?.color||'Uncertain',colorSource:'photo-estimate'};},
   fill:(v,choice)=>({...v,category:choice.category,itemType:choice.itemType})
  },
  applyLocalChoice:(v,choice)=>{calls.classification++;
   v.category=choice.category;v.itemType=choice.itemType;},
  checkPhoto:async()=>{calls.quality++;return {
   colorEstimate:{color:'Blue'},signature:'signature-1',aspect:1.12
  };},
  writeAll:async values=>{stored.push(structuredClone(values[0]));},
  queued:task=>task(),
  render:()=>{calls.renders++;},message:m=>messages.push(m),
  stopCamera:()=>{throw Error('camera should be stopped already');}
 };
 vm.createContext(c);vm.runInContext(nativeCrop,c);c.cropClothingPhoto(item);
 if(!saved||!ambiguous)assert.ok(callbacks?.analyze&&callbacks?.save,'actual crop handlers mounted');
 return {item,c,calls,stored,callbacks,original,messages};
}

test('P822 real native ambiguous crop never calls model classification or fills guessed color even when helper supplies choice',async()=>{
 const h=harness();
 const choice=await h.callbacks.analyze('data:image/jpeg;base64,AACC');
 assert.equal(choice,null);
 assert.equal(h.calls.inference,0);
 await h.callbacks.save({image:'data:image/jpeg;base64,AADD',
  maskedColorEstimate:{color:'Magenta'},maskApplied:true},
  {category:'Bottoms',itemType:'Jeans',details:{},color:'Green'});
 assert.equal(h.stored.length,1);
 assert.equal(h.calls.quality,1,'photo quality/signature may still be measured');
 assert.equal(h.calls.color,0,'mixed original must never get a guessed crop color');
 assert.equal(h.calls.classification,0,'injected classifier choice is ignored');
 assert.equal(h.item.category,'Uncategorized');
 assert.equal(h.item.itemType,'Unknown');
 assert.equal(h.item.color,'');
 assert.equal(h.item.colorSource,undefined);
 assert.equal(h.item.indexedAt,undefined);
 assert.equal(h.item.requiresOwnershipConfirmation,true);
 assert.equal(h.item.segmentHint.sourceDisconnectedReviewRequired,true);
 assert.match(h.item.localStatus,/original-photo review/);
 assert.ok(h.calls.renders>0);
});
test('P822 changed crop invalidates old original-one-garment confirmation and retains source identity',async()=>{
 const h=harness({confirmed:true});
 await h.callbacks.save({
  image:'data:image/jpeg;base64,AADD',
  originalPhoto:{image:'data:image/jpeg;base64,FORGED'},
  sourceSHA256:'forged-sha',sourceHashVerified:false,
  ownerId:'foreign-owner',outfitSourceId:'foreign-outfit',
  segmentHint:{sourceDisconnectedReviewRequired:false},
  color:'Black',colorSource:'user',category:'Dresses',itemType:'Dress'
 },null);
 assert.equal(h.stored.length,1);
 const saved=h.stored[0];
 assert.equal(saved.ownerId,'signed-owner-1');
 assert.equal(saved.sourceSHA256,'sha-original');
 assert.equal(saved.sourceHashVerified,true);
 assert.equal(saved.originalPhoto.image,h.original);
 assert.equal(saved.outfitSourceId,'outfit-1');
 assert.equal(saved.segmentHint.sourceDisconnectedReviewRequired,true);
 assert.equal(saved.sourceAmbiguityAcknowledged820,undefined);
 assert.equal(saved.sourceAmbiguityReviewProvenance820,undefined);
 assert.equal(h.item.sourceAmbiguityAcknowledged820,undefined,
  'live editor must not retain stale approval after persisted crop');
 assert.equal(h.item.sourceAmbiguityReviewProvenance820,undefined);
 assert.equal(h.item.colorSource,undefined,
  'in-memory crop may not resurrect stale photo-estimate color');
 assert.equal(saved.category,'Uncategorized');
 assert.equal(saved.itemType,'Unknown');
 assert.equal(saved.color,'');
 assert.equal(saved.recognitionMemory,undefined);
});
test('P822 ordinary unambiguous crop keeps existing optional photo inference and explicit save behavior',async()=>{
 const h=harness({ambiguous:false});
 const candidate=await h.callbacks.analyze('data:image/jpeg;base64,AACC');
 assert.equal(candidate.category,'Tops');
 assert.equal(candidate.itemType,'Shirt');
 assert.equal(h.calls.inference,2,'normal crop still loads model and classifies');
 await h.callbacks.save({image:'data:image/jpeg;base64,AADD'},candidate);
 assert.equal(h.stored.length,1);
 assert.equal(h.calls.color,1);
 assert.equal(h.calls.classification,1);
 assert.equal(h.item.color,'Blue');
 assert.equal(h.item.itemType,'Shirt');
 assert.equal(h.item.segmentHint.sourceDisconnectedReviewRequired,false);
 assert.match(h.item.localStatus,/Suggested details applied/);
});
test('P822 failed photo-quality check cannot partially commit an ambiguous crop',async()=>{
 const h=harness();
 h.c.checkPhoto=async()=>{throw Error('invalid JPEG');};
 await assert.rejects(()=>h.callbacks.save({image:'data:image/jpeg;base64,AADD'},null),/invalid JPEG/);
 assert.equal(h.stored.length,0);
 assert.equal(h.item.image,'data:image/jpeg;base64,AABB');
 assert.equal(h.item.originalPhoto.image,h.original);
});

test('P824 saved ambiguous garment crop is blocked before opening editor or touching saved private wardrobe',()=>{
 const h=harness({ambiguous:true,saved:true,confirmed:true});
 assert.equal(h.callbacks,undefined,'must not mount crop editor for already-saved ambiguous source');
 assert.equal(h.stored.length,0);
 assert.equal(h.calls.quality,0);
 assert.equal(h.calls.inference,0);
 assert.equal(h.calls.renders,0);
 assert.equal(h.item.image,'data:image/jpeg;base64,AABB');
 assert.equal(h.item.originalPhoto.image,h.original);
 assert.equal(h.item.sourceAmbiguityAcknowledged820,true,
  'blocking an attempted recrop does not destroy an existing saved owner claim');
 assert.match(h.messages.join(' '),/saved garment.*unchanged/i);
});
test('P824 ordinary saved nonambiguous crop remains available for existing editor path',async()=>{
 const h=harness({ambiguous:false,saved:true});
 assert.ok(h.callbacks,'unflagged saved clothing keeps prior crop UI');
 const choice=await h.callbacks.analyze('data:image/jpeg;base64,AACC');
 assert.equal(choice.category,'Tops');
 await h.callbacks.save({image:'data:image/jpeg;base64,AADD'},choice);
 assert.equal(h.stored.length,1);
 assert.equal(h.item.color,'Blue');
});
