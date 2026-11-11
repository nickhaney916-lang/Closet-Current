import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync('public/app.js','utf8');
const a=app.indexOf('function cropClothingPhoto(item){');
const b=app.indexOf('function cropButton(item)',a);
assert.ok(a>=0&&b>a,'native crop function source anchors exist');
const nativeCrop=app.slice(a,b);

function harness({ambiguous=true,confirmed=false,saved=false,signedOwner='signed-owner-1'}={}){
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
 const db={name:'closet-current-user-signed-owner-1',transaction:()=>{
  const tx={oncomplete:null,onerror:null,onabort:null,
   objectStore:()=>({put:row=>{if(row.id==='draft')stored.push(structuredClone(row.batch[0]));}})};
  queueMicrotask(()=>tx.oncomplete?.());
  return tx;
 }};
 const auth={user:{id:signedOwner},assertCurrent:()=>{}};
 const c={localPending:new Set(),busy:false,stream:null,cameraOpening:false,
  items:saved?[item]:[],batch:[item],structuredClone,db,session:0,
  window:{closetAuth:auth},
  captureProofOwner:()=>{
   const owner=c.window.closetAuth?.user?.id;
   return owner&&c.db?.name==='closet-current-user-'+owner?owner:null;
  },
  // A synthetic digest provider exercises native crop admission branches.
  // Real SHA-256/PHOTO119 are verified in separate P826 integration tests.
  captureProof01Module:async()=>({
   verifyStoredCanonical:async()=>true,
   jpegBytes:()=>Uint8Array.from([255,216,1,2,255,217]),
   digestBytes:async()=> 'fresh-cutout-826-sha'
  }),
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
 if((!saved||!ambiguous)&&(!ambiguous||signedOwner==='signed-owner-1'))
  assert.ok(callbacks?.analyze&&callbacks?.save,'actual crop handlers mounted');
 return {item,c,calls,stored,callbacks,original,messages};
}

test('P822 real native ambiguous crop never calls model classification or fills guessed color even when helper supplies choice',async()=>{
 const h=harness();
 const choice=await h.callbacks.analyze('data:image/jpeg;base64,AACC');
 assert.equal(choice,null);
 assert.equal(h.calls.inference,0);
 await h.callbacks.save({image:'data:image/jpeg;base64,AADD',ownerSingleGarmentConfirmed826:true,
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
  image:'data:image/jpeg;base64,AADD',ownerSingleGarmentConfirmed826:true,
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
 await h.callbacks.save({image:'data:image/jpeg;base64,AADD',ownerSingleGarmentConfirmed826:true},candidate);
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
 await assert.rejects(()=>h.callbacks.save({image:'data:image/jpeg;base64,AADD',ownerSingleGarmentConfirmed826:true},null),/invalid JPEG/);
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
 await h.callbacks.save({image:'data:image/jpeg;base64,AADD',ownerSingleGarmentConfirmed826:true},choice);
 assert.equal(h.stored.length,1);
 assert.equal(h.item.color,'Blue');
});

test('P825 wrong signed owner cannot even open a flagged source crop editor',()=>{
 const h=harness({signedOwner:'foreign-owner'});
 assert.equal(h.callbacks,undefined);
 assert.equal(h.stored.length,0);
 assert.match(h.messages.join(' '),/crop session has changed/);
});
test('P825 source owner switch while photo quality is pending refuses stale draft write',async()=>{
 const h=harness();
 let release;h.c.checkPhoto=()=>new Promise(resolve=>{release=resolve;});
 const pending=h.callbacks.save({image:'data:image/jpeg;base64,NEWC',ownerSingleGarmentConfirmed826:true},null);
 assert.equal(typeof release,'function');
 h.c.window.closetAuth={user:{id:'other-owner'},assertCurrent:()=>{}};
 assert.equal(h.callbacks.isActive(),false);
 release({signature:'new',aspect:1,colorEstimate:{color:'Yellow'}});
 await assert.rejects(pending,/M1_P825_STALE_OR_FOREIGN_OWNER_CROP/);
 assert.equal(h.stored.length,0,'cross-account draft must not be written');
 assert.equal(h.item.image,'data:image/jpeg;base64,AABB');
});
test('P825 new camera session during pending analysis invalidates old owner crop lease',async()=>{
 const h=harness();
 let release;h.c.checkPhoto=()=>new Promise(resolve=>{release=resolve;});
 const pending=h.callbacks.save({image:'data:image/jpeg;base64,NEWC',ownerSingleGarmentConfirmed826:true},null);
 h.c.session++;
 release({signature:'new',aspect:1,colorEstimate:{color:'Green'}});
 await assert.rejects(pending,/M1_P825_STALE_OR_FOREIGN_OWNER_CROP/);
 assert.equal(h.stored.length,0);
});
test('P825 original JPEG replacement or draft substitution is never admitted into owner state',async()=>{
 for(const change of [
  h=>{h.item.originalPhoto.image='data:image/jpeg;base64,REPLACED';},
  h=>{h.item.segmentHint.cutoutSHA256='another-cutout';},
  h=>{h.c.batch=[structuredClone(h.item)];},
  h=>{h.c.db={...h.c.db};}
 ]){
  const h=harness(),old=h.item.image;
  let release;h.c.checkPhoto=()=>new Promise(resolve=>{release=resolve;});
  const pending=h.callbacks.save({image:'data:image/jpeg;base64,NEWC',ownerSingleGarmentConfirmed826:true},null);
  change(h);
  assert.equal(h.callbacks.isActive(),false);
  release({signature:'new',aspect:1,colorEstimate:{color:'Red'}});
  await assert.rejects(pending,/M1_P825_STALE_OR_FOREIGN_OWNER_CROP/);
  assert.equal(h.stored.length,0);
  assert.equal(h.item.image,old);
 }
});
test('P825 queued owner write validates lease again after an asynchronous prewrite gate',async()=>{
 const h=harness();let work;
 h.c.queued=task=>new Promise((resolve,reject)=>{work=()=>Promise.resolve().then(task).then(resolve,reject);});
 const pending=h.callbacks.save({image:'data:image/jpeg;base64,NEWC',ownerSingleGarmentConfirmed826:true,id:'forged-id'},null);
 for(let i=0;i<120&&!work;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof work,'function');
 h.c.window.closetAuth={user:{id:'changed-owner'},assertCurrent:()=>{}};
 work();
 await assert.rejects(pending,/M1_P825_STALE_OR_FOREIGN_OWNER_CROP/);
 assert.equal(h.stored.length,0);
});
test('P825 immutable owner record identity is not overwritten by crop-result id metadata',async()=>{
 const h=harness();
 await h.callbacks.save({image:'data:image/jpeg;base64,NEWC',ownerSingleGarmentConfirmed826:true,id:'foreign-id',ownerId:'foreign-owner'},null);
 assert.equal(h.stored[0].id,'private-photo-piece');
 assert.equal(h.stored[0].ownerId,'signed-owner-1');
 assert.equal(h.item.id,'private-photo-piece');
});
test('P825 crop editor fails closed after JPEG decode if owner lease expires before dialog mounts',async()=>{
 const editor=readFileSync('public/photo-crop-editor.js','utf8');
 let resolveDecode,appended=0,created=0;
 const context={
  window:{},document:{
   createElement:()=>{created++;return {className:''};},
   body:{append:()=>{appended++;}}
  },
  Image:class {
   set src(value){this.value=value;}
   decode(){return new Promise(resolve=>{resolveDecode=resolve;});}
  }
 };
 vm.createContext(context);vm.runInContext(editor,context);
 let active=true;
 const pending=context.window.openPhotoCrop({
  image:'data:image/jpeg;base64,AAEE'
 },{analyze:async()=>null,save:async()=>{},isActive:()=>active});
 assert.equal(typeof resolveDecode,'function');
 active=false;resolveDecode();
 await assert.rejects(pending,/changed during original JPEG decode/);
 assert.equal(created,1,'only an unmounted dialog may be allocated');
 assert.equal(appended,0,'expired private photo must never mount into next owner UI');
});

test('P826 no owner-confirmed original one-garment crop cannot reseal or enter private draft',async()=>{
 const h=harness();
 await assert.rejects(()=>h.callbacks.save({image:'data:image/jpeg;base64,UNAPPROVED'},null),
  /M1_P826_EXPLICIT_ORIGINAL_ONE_GARMENT_CROP_REVIEW_REQUIRED/);
 assert.equal(h.stored.length,0);
 assert.equal(h.item.segmentHint.cutoutSHA256,'previous-cutout');
});
test('P826 owner crop refreshes exact cutout SHA, never owner category/type/color, and never auto-confirms Adjust',async()=>{
 const h=harness();
 await h.callbacks.save({image:'data:image/jpeg;base64,NEWC',
  ownerSingleGarmentConfirmed826:true},null);
 assert.equal(h.stored.length,1);
 const saved=h.stored[0];
 assert.equal(saved.segmentHint.cutoutSHA256,'fresh-cutout-826-sha');
 assert.equal(saved.segmentHint.cutoutImage,'data:image/jpeg;base64,NEWC');
 assert.equal(saved.segmentHint.ownerReviewedInstance,true);
 assert.equal(saved.segmentHint.verified,true);
 assert.equal(saved.segmentHint.sourceDisconnectedReviewRequired,true);
 assert.match(saved.segmentHint.ownerCropReviewProvenance826,/explicit-original-photo/);
 assert.equal(saved.sourceSHA256,'sha-original');
 assert.equal(saved.color,'');
 assert.equal(saved.itemType,'Unknown');
 assert.equal(saved.sourceAmbiguityAcknowledged820,undefined,
  'crop review is not final Adjust human category/type/color approval');
 assert.equal(saved.ownerSingleGarmentConfirmed826,undefined,
  'ephemeral UI checkbox cannot persist as generic photo metadata');
});
test('P826 cutout identical to the original JPEG source digest is rejected',async()=>{
 const h=harness();
 h.c.captureProof01Module=async()=>({
  verifyStoredCanonical:async()=>true,
  jpegBytes:()=>Uint8Array.from([255,216,255,217]),
  digestBytes:async()=>h.item.sourceSHA256
 });
 await assert.rejects(()=>h.callbacks.save({image:'data:image/jpeg;base64,NEWC',
  ownerSingleGarmentConfirmed826:true},null),/M1_P826_CROP_NOT_DISTINCT_FROM_ORIGINAL/);
 assert.equal(h.stored.length,0);
});
test('P826 original source SHA proof rejection keeps old owner draft unchanged',async()=>{
 const h=harness();
 h.c.captureProof01Module=async()=>({
  verifyStoredCanonical:async()=>false
 });
 await assert.rejects(()=>h.callbacks.save({image:'data:image/jpeg;base64,NEWC',
  ownerSingleGarmentConfirmed826:true},null),/M1_P826_ORIGINAL_JPEG_SHA_PROOF_FAILED/);
 assert.equal(h.stored.length,0);
 assert.equal(h.item.image,'data:image/jpeg;base64,AABB');
});
test('P826 signed account rotation during real asynchronous crop SHA prevents private draft write',async()=>{
 const h=harness();
 let release;
 h.c.captureProof01Module=async()=>({
  verifyStoredCanonical:async()=>true,
  jpegBytes:()=>Uint8Array.from([255,216,1,2,255,217]),
  digestBytes:()=>new Promise(resolve=>{release=resolve;})
 });
 const pending=h.callbacks.save({image:'data:image/jpeg;base64,NEWC',
  ownerSingleGarmentConfirmed826:true},null);
 for(let i=0;i<20&&!release;i++)await Promise.resolve();
 assert.equal(typeof release,'function');
 h.c.window.closetAuth={user:{id:'changed-owner'},assertCurrent:()=>{}};
 release('new-real-cutout-sha');
 await assert.rejects(pending,/M1_P825_STALE_OR_FOREIGN_OWNER_CROP/);
 assert.equal(h.stored.length,0);
});
