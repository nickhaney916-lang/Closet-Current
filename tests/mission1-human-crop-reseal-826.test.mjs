import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID,createHash,webcrypto} from 'node:crypto';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import * as captureProof from '../public/native-canonical-photo-source-167.mjs';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {commitHumanReviewedPhoto119 as researchWriter} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';

const app=readFileSync('public/app.js','utf8');
const a=app.indexOf('function cropClothingPhoto(item){'),b=app.indexOf('function cropButton(item)',a);
assert.ok(a>=0&&b>a);
const nativeCrop=app.slice(a,b);
const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const jpeg=buf=>'data:image/jpeg;base64,'+buf.toString('base64');
const sha=buf=>createHash('sha256').update(buf).digest('hex');
const original=jpeg(bytes),sourceSHA=sha(bytes);
async function open(owner){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner,2);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('items',{keyPath:'id'});
   request.result.createObjectStore('state',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function put(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(row);
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 });
}
async function get(db,store,id){
 return new Promise((resolve,reject)=>{
  const req=db.transaction(store).objectStore(store).get(id);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function ownerCaptureHarness(){
 const ownerId='crop826-'+randomUUID(),db=await open(ownerId);
 const record={id:'source-1',ownerId,originalPhoto:{image:original,sha256:sourceSHA},
  image:original,sourceSHA256:sourceSHA,sourceHashVerified:true,
  outfitSourceId:'source-photo',sourceId:'source-photo',
  segmentHint:{sourceDisconnectedReviewRequired:true,
   originalSHA256:sourceSHA,verified:false,ownerReviewedInstance:false,clipped:false},
  category:'Uncategorized',itemType:'Unknown',color:'',name:'Unreviewed source'};
 await put(db,'state',{id:'draft',batch:[structuredClone(record)]});
 let editor,qualityCalls=0,renders=0;
 const auth={user:{id:ownerId},assertCurrent(){}};
 const c={localPending:new Set(),busy:false,stream:null,cameraOpening:false,
  items:[],batch:[record],structuredClone,db,session:0,window:{closetAuth:auth},
  captureProofOwner:()=>c.window.closetAuth?.user?.id===ownerId&&
   c.db===db&&db.name==='closet-current-user-'+ownerId?ownerId:null,
  captureProof01Module:async()=>({
   ...captureProof,
   verifyStoredCanonical:p=>captureProof.verifyStoredCanonical(p,{cryptoProvider:webcrypto}),
   digestBytes:b=>captureProof.digestBytes(b,webcrypto)
  }),
  checkPhoto:async()=>{qualityCalls++;return {
   colorEstimate:{color:'Red'},signature:'review-crop',aspect:1.3
  };},
  openPhotoCrop:(_item,callbacks)=>{editor=callbacks;return Promise.resolve();},
  queued:action=>action(),render:()=>{renders++;},
  message:()=>{},stopCamera:()=>{throw Error('no camera')},
  writeAll:()=>{throw Error('unsaved review crop cannot overwrite saved wardrobe')},
  ClothingDetails:{fillColor:()=>{throw Error('ambiguous source must not auto-color')}}
 };
 vm.createContext(c);vm.runInContext(nativeCrop,c);c.cropClothingPhoto(record);
 assert.ok(editor?.save&&editor?.requireOwnerSingleGarment826);
 return {db,record,c,ownerId,editor,counts:()=>({qualityCalls,renders})};
}
for(const [writerName,write] of [['native',commitHumanReviewedPhoto119],['research',researchWriter]]){
test('P826 '+writerName+' real owner JPEG crop flows to PHOTO119 only after a separate reviewed label',async()=>{
 const h=await ownerCaptureHarness();
 try{
  const meta=await sharp(bytes).metadata();
  const crop=await sharp(bytes).extract({
   left:Math.floor(meta.width*.14),top:Math.floor(meta.height*.12),
   width:Math.floor(meta.width*.55),height:Math.floor(meta.height*.60)
  }).jpeg({quality:87}).toBuffer();
  assert.ok(crop.length<3000000);
  const edited=jpeg(crop);
  assert.notEqual(sha(crop),sourceSHA);
  const before=await get(h.db,'state','draft');
  assert.equal(before.batch.length,1);
  await h.editor.save({image:edited,ownerSingleGarmentConfirmed826:true,
   cropBounds:{x:.14,y:.12,width:.55,height:.6}},null);
  const current=await get(h.db,'state','draft');
  assert.equal(current.batch.length,1,'crop remains a draft, NOT automatically saved');
  assert.equal((await get(h.db,'items',h.record.id)),undefined);
  assert.equal(current.batch[0].image,edited);
  assert.equal(current.batch[0].segmentHint.cutoutImage,edited);
  assert.equal(current.batch[0].segmentHint.cutoutSHA256,sha(crop),
   'real byte-level digest from the newly edited actual JPEG');
  assert.equal(current.batch[0].sourceSHA256,sourceSHA,
   'original SHA cannot be replaced by the newly cropped photo');
  assert.equal(current.batch[0].originalPhoto.image,original);
  assert.equal(current.batch[0].category,'Uncategorized');
  assert.equal(current.batch[0].itemType,'Unknown');
  assert.equal(current.batch[0].requiresOwnershipConfirmation,true,'private draft still requires final owner confirmation');
  assert.equal(current.batch[0].color,'');
  assert.equal(current.batch[0].sourceAmbiguityAcknowledged820,undefined);
  assert.equal(h.counts().qualityCalls,1);
  const reviewed={confirmed:true,recordId:h.record.id,originalSHA256:sourceSHA,
   category:'Bottoms',itemType:'Jeans',color:'Navy',
   singleGarmentConfirmed:false,instanceConfirmed:true,
   cutoutSHA256:h.record.segmentHint.cutoutSHA256};
  const result=await write({
   db:h.db,ownerId:h.ownerId,currentOwner:()=>h.ownerId,
   record:h.record,review:reviewed,cryptoProvider:webcrypto,
   assertLease:()=>true
  });
  assert.equal(result.saved,true);
  assert.equal(result.sourceKind,'human-reviewed-source-bound-cutout');
  const saved=await get(h.db,'items',h.record.id);
  assert.equal(saved.image,edited);
  assert.equal(saved.segmentHint.cutoutImage,edited);
  assert.equal(saved.sourceSHA256,sourceSHA);
  assert.equal(saved.category,'Bottoms');
  assert.equal(saved.itemType,'Jeans');
  assert.equal(saved.color,'Navy');
  assert.equal(saved.reviewProvenance,'explicit-owner-claim-not-independent-review-evidence');
  assert.equal(saved.requiresOwnershipConfirmation,false,'only PHOTO119 completed review clears the temporary draft gate');
  assert.equal((await get(h.db,'state','draft')).batch.length,0,
   'atomic reviewed writer retires only reviewed source draft');
 }finally{h.db.close();}
});}
test('P826 revoked original SHA or unchecked one-garment claim never saves new crop draft',async()=>{
 const h=await ownerCaptureHarness();
 try{
  const cropped=jpeg(await sharp(bytes).resize({width:320}).jpeg().toBuffer());
  await assert.rejects(h.editor.save({image:cropped},null),
   /M1_P826_EXPLICIT_ORIGINAL_ONE_GARMENT_CROP_REVIEW_REQUIRED/);
  assert.equal((await get(h.db,'state','draft')).batch[0].image,original);
  h.c.captureProof01Module=async()=>({
   ...captureProof,
   verifyStoredCanonical:async()=>false
  });
  await assert.rejects(h.editor.save({image:cropped,
   ownerSingleGarmentConfirmed826:true},null),/M1_P826_ORIGINAL_JPEG_SHA_PROOF_FAILED/);
  assert.equal((await get(h.db,'items',h.record.id)),undefined);
  assert.equal((await get(h.db,'state','draft')).batch[0].image,original);
 }finally{h.db.close();}
});

test('P826 actual crop editor Save button requires fresh one-garment checkbox and closes after valid saved crop rotates its old lease',async()=>{
 const editorSource=readFileSync('public/photo-crop-editor.js','utf8');
 const made=[],mounted=[],paintCalls=[];
 const newElement=(tag)=>{
  const el={tag,children:[],attributes:{},style:{},hidden:false,
   disabled:false,checked:false,isConnected:true,open:false,
   append(...nodes){this.children.push(...nodes);},
   setAttribute(key,value){this.attributes[key]=String(value);},
   addEventListener(){},
   querySelectorAll(){return [];},
   showModal(){this.open=true;},
   close(){this.open=false;this.onclose?.();},
   remove(){this.isConnected=false;},
   getContext(){return {drawImage(){paintCalls.push(tag);}};},
   toDataURL(){return 'data:image/jpeg;base64,AABB';}
  };made.push(el);return el;
 };
 const E={
  bounds:()=>({x:0,y:0,width:1,height:1}),
  pixels:()=>({x:0,y:0,width:600,height:600,outputWidth:600,outputHeight:600})
 };
 const context={
  window:{PhotoCropEngine:E},
  document:{createElement:newElement,createTextNode:text=>({tag:'text',textContent:text}),
   body:{append:el=>mounted.push(el)}},
  Image:class{
   naturalWidth=600;naturalHeight=600;
   set src(v){this.image=v;}
   async decode(){}
  }
 };
 vm.createContext(context);
 vm.runInContext(editorSource,context);
 let active=true,saveCount=0,received=null;
 const item={originalPhoto:{image:'data:image/jpeg;base64,AAEE'}};
 await context.window.openPhotoCrop(item,{
  analyze:async()=>null,requireOwnerSingleGarment826:true,
  isActive:()=>active,
  save:async photo=>{saveCount++;received=photo;active=false;}
 });
 const dialog=made.find(x=>x.tag==='dialog');
 const commit=made.find(x=>x.tag==='button'&&x.textContent==='Save crop');
 const reset=made.find(x=>x.tag==='button'&&x.textContent==='Whole photo');
 const owner=made.find(x=>x.tag==='input'&&
  x.attributes['aria-label']==='I reviewed the original and this crop shows only one garment');
 const status=made.find(x=>x.attributes.role==='status');
 assert.ok(dialog?.open&&commit?.onclick&&reset?.onclick&&owner);
 assert.equal(owner.checked,false,'original photo declaration is never prechecked');
 await commit.onclick();
 assert.equal(saveCount,0,'unchecked owner claim cannot reach save callback');
 assert.match(status.textContent,/confirm this crop shows one garment/);
 owner.checked=true;reset.onclick();
 assert.equal(owner.checked,false,'changing crop bounds invalidates previous one-garment claim');
 owner.checked=true;
 await commit.onclick();
 assert.equal(saveCount,1);
 assert.equal(received.ownerSingleGarmentConfirmed826,true);
 assert.equal(dialog.open,false,'a successfully saved crop closes, even though its old source lease rotates');
 assert.equal(dialog.isConnected,false);
 assert.equal(mounted.length,1);
 assert.ok(paintCalls.length>0);
});
