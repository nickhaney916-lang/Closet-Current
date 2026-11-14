// Mission #88 source-executed experimental worker/draft/owner mask veto tests.
// Synthetic segmentation logits and fake worker: no new real-model accuracy data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import * as segmentation from '../public/outfit-segmentation.mjs';
import * as trial from '../public/outfit-instance-review-840.mjs';

const workerSource=fs.readFileSync('public/outfit-worker.mjs','utf8');
const captureSource=fs.readFileSync('public/outfit-capture.js','utf8');
const appSource=fs.readFileSync('public/app.js','utf8');
function sourceLogits(){
 const width=40,height=40,area=width*height,data=new Float32Array(18*area);
 data.fill(-10);for(let i=0;i<area;i++)data[i]=10;
 const paint=(id,left,top,w,h)=>{
  for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){
   const i=y*width+x;for(let c=0;c<18;c++)data[c*area+i]=c===id?10:-10;
  }
 };
 paint(11,14,1,7,6); // true person
 paint(4,10,10,8,8);
 paint(4,30,10,1,5); // accepted detached fragment too small to split
 return {data,dims:[1,18,height,width]};
}
async function workerMessages(instanceReview840){
 const logits=sourceLogits(),sent=[];
 class RawImage {
  constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}
  static async read(){return new RawImage(new Uint8ClampedArray(40*40*3).fill(35),40,40,3);}
  async toBlob(){return {arrayBuffer:async()=>new Uint8Array([255,216,255]).buffer};}
 }
 const runtime={
  AutoModelForSemanticSegmentation:{from_pretrained:async()=>async()=>({logits})},
  AutoProcessor:{from_pretrained:async()=>async()=>({})},
  RawImage,env:{backends:{onnx:{wasm:{}}}}
 };
 const PhotoColor={maskedPalette:()=>null};
 const c={runtime,segmentation,trial,PhotoColor,self:{postMessage:x=>sent.push(x)},Uint8Array,
  Uint8ClampedArray,btoa:x=>Buffer.from(x,'binary').toString('base64')};
 vm.createContext(c);
 const transformed=workerSource
  .replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)')
  .replace("await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(segmentation)')
  .replace("await import('./outfit-instance-review-840.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(trial)')
  .replace("await import('./photo-color.js'+new URL(import.meta.url).search)",'await Promise.resolve()');
 vm.runInContext(transformed,c);
 c.self.onmessage({data:{id:'source88',image:'data:image/jpeg;base64,AAAA',...(instanceReview840?{instanceReview840:true}:{})}});
 await vm.runInContext('chain',c);
 return sent;
}
function captureHarness({ownerId=null,autoStart=true,decode=null,href='https://example.test/closet?outfitInstances840=1',sourceDigest=null}={}){
 const nodes=new Map(),timers=new Map();let sequence=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:''});return nodes.get(id);};
 const c={URL,location:{href},
  atob:x=>Buffer.from(x,'base64').toString('binary'),
  ...(ownerId?{window:{closetAuth:{user:{id:ownerId}}}}:{}),
  $:node,batch:[],items:[],localPending:new Set(),busy:false,session:0,recognitionAssetVersion:'research',
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  crypto:{randomUUID:()=> 'id-'+(++sequence),subtle:{digest:(_,data)=>sourceDigest||Promise.resolve(Uint8Array.from(createHash('sha256').update(Buffer.from(data)).digest()).buffer)}},
  Date:{now:()=>1000},photoToJPEG:decode||(async()=> 'data:image/jpeg;base64,NEWPHOTO'),setTimeout(fn,delay){const id=++sequence;timers.set(id,{fn,delay});return id;},
  clearTimeout:id=>timers.delete(id),stopCamera(){},controls(){},
  candidate(image,options){c.batch.push({id:'piece-'+(++sequence),image,...options,
   requiresOwnershipConfirmation:!!options.outfitSourceId});return true;},
  render(){c.renderOutfitCapture();},switchView(){},structuredClone,
  closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),
  Worker:class{constructor(){c.worker=this;}postMessage(request){this.request=request;}terminate(){this.closed=true;}}
 };
 // VM cannot dynamically import the irrelevant source-only grouping UI.
 // Replace ONLY that transport with a resolved mock; source delivery logic,
 // session gates, photo hashing and owner draft admission run unmodified.
 const fixtureCapture=captureSource.replace(
  "const unit70Api=outfitUnits70?import('./outfit-unit-reconciliation-70.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:'')):null;",
  "const unit70Api=outfitUnits70?Promise.resolve({}):null;");
 vm.createContext(c);vm.runInContext(fixtureCapture,c);
 if(autoStart)c.startOutfitSplit('data:image/jpeg;base64,ORIGINAL');
 return {c,node,emit:part=>c.worker?.onmessage({data:{id:c.worker.request.id,...part}})};
}
function allowSaving(item){
 const start=appSource.indexOf('function ownerMaySaveSourceGroup88(');
 const stop=appSource.indexOf('function adjustPhoto(',start);
 assert.ok(start>=0&&stop>start);
 const context={};vm.createContext(context);vm.runInContext(appSource.slice(start,stop),context);
 return context.ownerMaySaveSourceGroup88(item);
}
test('P88 only explicit trial worker carries unresolved-accepted-fragment reason; no pixelless save status',async()=>{
 const flagged=await workerMessages(true),defaultRun=await workerMessages(false);
 assert.equal(flagged.filter(x=>x.type==='error').length,0);
 const rows=flagged.filter(x=>x.type==='piece').map(x=>x.piece);
 assert.equal(rows.length,1);
 assert.equal(rows[0].instanceMethod,'native_semantic_group_unresolved_fragments');
 assert.equal(rows[0].hint.componentReviewStatus,undefined,'original worker message contract remains unchanged');
 assert.equal(rows[0].requiresReview,true);
 assert.equal(rows[0].hint.categories[0],'Tops');
 assert.equal(rows[0].recognitionPhoto.image.startsWith('data:image/jpeg;base64,'),true);
 const old=defaultRun.filter(x=>x.type==='piece').map(x=>x.piece);
 assert.equal(old.length,1);
 assert.equal(old[0].instanceMethod,'native_semantic_group','default grouping unchanged');
 assert.equal(old[0].hint.componentReviewStatus,undefined,'default consumer hint unchanged');
});
test('P88 native capture preserves original JPEG, unresolved hint and unsaved owner draft',()=>{
 const h=captureHarness();
 assert.equal(h.c.worker.request.instanceReview840,true);
 const piece={image:'data:image/jpeg;base64,PIECE',recognitionPhoto:{image:'data:image/jpeg;base64,CROPPED'},
  hint:{categories:['Tops'],types:[],clipped:false},
  instanceMethod:'native_semantic_group_unresolved_fragments',requiresReview:true};
 h.emit({type:'piece',piece});h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,ORIGINAL');
 assert.equal(h.c.batch[0].segmentHint.componentReviewStatus,'unresolved_fragments_keep_source_mask');
 assert.equal(h.c.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(allowSaving(h.c.batch[0]),false);
});
test('P88 reviewed category, color, approval checkbox cannot certify unresolved class mask',()=>{
 const unresolved={segmentHint:{componentReviewStatus:'unresolved_fragments_keep_source_mask'},
  category:'Tops',color:'Blue',itemType:'T-shirt',userAdjusted:true,ownerConfirmed:true};
 assert.equal(allowSaving(unresolved),false);
 assert.equal(allowSaving({...unresolved,segmentHint:{componentReviewStatus:'owner_must_confirm_garment_units'}}),false,'photo review alone cannot invent a physical garment count');
 assert.equal(allowSaving({...unresolved,segmentHint:{componentReviewStatus:'owner_must_confirm_garment_units'},
  reconciliation70:{ownerId:'owner-A',sourceSha256:'a'.repeat(64),maskSha256:'b'.repeat(64)},
  reconciliation70Status:'separate_confirmed'}),true,'explicit owner unit resolution may proceed to separate signed source validation');
 assert.equal(allowSaving({...unresolved,segmentHint:{componentReviewStatus:'owner_must_confirm_garment_units'},
  reconciliation70:{ownerId:'owner-A'},reconciliation70Status:'unresolved'}),false);
 assert.equal(allowSaving({...unresolved,segmentHint:{componentReviewStatus:'fabricated_or_new_future_status'}}),false);
 assert.equal(allowSaving({...unresolved,segmentHint:undefined}),true);
 const reviewedCore=appSource.slice(appSource.indexOf('const reviewedCore=()=>{'),appSource.indexOf('const canSaveReview=()=>{'));
 assert.match(reviewedCore,/ownerMaySaveSourceGroup88\(item\)/);
 assert.match(appSource,/if\(!ownerMaySaveSourceGroup88\(item\)\)\{message\('The original photo has unresolved garment fragments/);
 assert.match(appSource,/Photograph the garment separately, then review again/);
});

test('P88 owner ID switch stops midflight garment emissions without adding a draft',()=>{
 const h=captureHarness({ownerId:'owner-A'});
 const oldWorker=h.c.worker;
 h.c.window.closetAuth.user={id:'owner-B'};
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,PIECE',
  hint:{categories:['Tops'],types:[],clipped:false},
  instanceMethod:'connected_semantic_component_unverified',requiresReview:true}});
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(oldWorker.closed,true);
 assert.match(h.node('outfitSplitStatus').textContent,/Owner session changed/);
});
test('P88 replaced same-ID signed owner reference revokes an in-flight instance result',()=>{
 const h=captureHarness({ownerId:'owner-A'});
 const oldWorker=h.c.worker;
 h.c.window.closetAuth.user={id:'owner-A'};
 h.emit({type:'piece',piece:{image:'data:image/jpeg;base64,PIECE',
  hint:{categories:['Dresses'],types:[],clipped:false},
  instanceMethod:'connected_semantic_component_unverified',requiresReview:true}});
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(oldWorker.closed,true);
});

test('P88 retry cannot replay an old owner photo after a different-owner sign-in',()=>{
 const h=captureHarness({ownerId:'owner-A'}),original=h.c.worker;
 h.emit({type:'error'}); // full original still in retry slot under original owner
 h.c.window.closetAuth.user={id:'owner-B'};
 h.node('outfitRetry').onclick();
 assert.equal(h.c.worker,original,'no new worker receives the previous owner JPEG');
 assert.equal(vm.runInContext('outfitSplitJob',h.c),null);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'','previous owner original discarded from retry cache');
 assert.match(h.node('outfitSplitStatus').textContent,/previous photo belongs to another signed session/);
});
test('P88 a replaced same-ID signed session cannot replay old-owner photo',()=>{
 const h=captureHarness({ownerId:'owner-A'}),original=h.c.worker;
 h.emit({type:'error'});
 h.c.window.closetAuth.user={id:'owner-A'};
 h.node('outfitRetry').onclick();
 assert.equal(h.c.worker,original);
 assert.equal(vm.runInContext('outfitSplitJob',h.c),null);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'');
});
test('P88 unchanged original signed-owner reference may retry an errored unsaved photo',()=>{
 const h=captureHarness({ownerId:'owner-A'}),original=h.c.worker;
 h.emit({type:'error'});
 h.node('outfitRetry').onclick();
 assert.notEqual(h.c.worker,original);
 assert.equal(h.c.worker.request.image,'data:image/jpeg;base64,ORIGINAL');
 assert.equal(h.c.worker.request.instanceReview840,true);
});
test('P88 a JPG decoded after owner change never enters a new account draft or worker',async()=>{
 let resolveDecode;
 const decoding=new Promise(resolve=>{resolveDecode=resolve;});
 const h=captureHarness({ownerId:'owner-A',autoStart:false,decode:()=>decoding});
 const reading=h.c.readOutfitPhoto({size:400,type:'image/jpeg',name:'photo.jpg'});
 h.c.window.closetAuth.user={id:'owner-B'};
 resolveDecode('data:image/jpeg;base64,OWNER_A_ORIGINAL');
 await reading;
 assert.equal(h.c.worker,undefined);
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'');
 assert.match(h.node('outfitSplitStatus').textContent,/session changed while opening this photo/);
});
test('P88 a JPG decoded after a replaced same-ID session cannot become a new draft',async()=>{
 let resolveDecode;
 const decoding=new Promise(resolve=>{resolveDecode=resolve;});
 const h=captureHarness({ownerId:'owner-A',autoStart:false,decode:()=>decoding});
 const reading=h.c.readOutfitPhoto({size:400,type:'image/jpeg',name:'photo.jpg'});
 h.c.window.closetAuth.user={id:'owner-A'};
 resolveDecode('data:image/jpeg;base64,OLD_SESSION_PHOTO');
 await reading;
 assert.equal(h.c.worker,undefined);
 assert.equal(h.c.batch.length,0);
 assert.match(h.node('outfitSplitStatus').textContent,/session changed while opening this photo/);
});
test('P88 unchanged owner can still submit a fully decoded new photo normally',async()=>{
 const h=captureHarness({ownerId:'owner-A',autoStart:false,
  decode:async()=> 'data:image/jpeg;base64,NEWPHOTO'});
 await h.c.readOutfitPhoto({size:400,type:'image/jpeg',name:'photo.jpg'});
 assert.equal(h.c.worker.request.image,'data:image/jpeg;base64,NEWPHOTO');
 assert.equal(h.c.worker.request.instanceReview840,true);
});

test('P88 connected shoes enter pending source review, not separate owned wardrobe entries',()=>{
 const h=captureHarness({ownerId:'owner-A'});
 const piece={image:'data:image/jpeg;base64,U0hPRUxFRlQ=',
  recognitionPhoto:{image:'data:image/jpeg;base64,Q1JPUExFRlQ='},
  hint:{categories:['Shoes'],types:[],clipped:false},
  instanceMethod:'connected_footwear_component',requiresReview:true};
 h.emit({type:'piece',piece});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch[0].segmentHint.componentReviewStatus,'owner_must_confirm_garment_units');
 assert.equal(allowSaving(h.c.batch[0]),false,'category and color cannot convert one shoe into owned pair');
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,ORIGINAL');
});
test('P88 two disconnected same-class tops both require a human physical-unit decision',()=>{
 const h=captureHarness({ownerId:'owner-A'});
 for(const image of ['VE9QQQ==','VE9QQg=='])h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,'+image,hint:{categories:['Tops'],types:[],clipped:false},
  instanceMethod:'connected_semantic_component_unverified',requiresReview:true
 }});
 h.emit({type:'done',count:2});
 assert.equal(h.c.batch.length,2);
 assert.equal(h.c.items.length,0);
 assert.ok(h.c.batch.every(x=>x.segmentHint.componentReviewStatus==='owner_must_confirm_garment_units'));
 assert.ok(h.c.batch.every(x=>allowSaving(x)===false));
 assert.ok(h.c.batch.every(x=>x.originalPhoto.image==='data:image/jpeg;base64,ORIGINAL'));
});
test('P88 forged high-confidence classifier cannot auto-admit a disconnected physical mask',()=>{
 const start=appSource.indexOf('function automaticAdmissionCore842(');
 const stop=appSource.indexOf('async function saveIndexed(',start);
 assert.ok(start>=0&&stop>start);
 const c={categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']};
 vm.createContext(c);vm.runInContext(appSource.slice(start,stop),c);
 const item={id:'source',image:'data:image/jpeg;base64,FAKE',category:'Shoes',
  itemType:'Sneakers',color:'Black',requiresOwnershipConfirmation:false,
  segmentHint:{categories:['Shoes'],clipped:false,componentReviewStatus:'owner_must_confirm_garment_units'}};
 assert.equal(c.automaticAdmissionCore842(item),false);
 assert.equal(c.automaticAdmissionCore842({...item,segmentHint:{categories:['Shoes'],clipped:false}}),true,
  'the new guard is scoped to source-bound unresolved units; other legacy auto guard remains testable');
});

test('P88 source SHA await cannot reassign a split garment to a replaced same-ID owner session',async()=>{
 let releaseDigest;const digest=new Promise(resolve=>{releaseDigest=resolve;});
 const h=captureHarness({ownerId:'owner-A',sourceDigest:digest,
  href:'https://example.test/closet?outfitInstances840=1&outfitUnits70=1&color76=1'});
 const worker=h.c.worker;
 assert.equal(worker.request.instanceReview840,true);
 assert.equal(worker.request.instanceReview70,true);
 const piece={image:'data:image/jpeg;base64,U0hPRUxFRlQ=',
  hint:{categories:['Shoes'],types:[],clipped:false},
  instanceMethod:'connected_footwear_component',requiresReview:true,
  recognitionPhoto:{image:'data:image/jpeg;base64,Q1JPUExFRlQ='},
  reconciliation70:{sourceSha256:'0'.repeat(64),maskSha256:'1'.repeat(64)}};
 h.emit({type:'piece',piece});
 // Allow queued handleOutfitMessage() to start, suspend at source digest await,
 // then replace the owner object with identical user ID before it resumes.
 for(let i=0;i<4;i++)await Promise.resolve();
 assert.equal(h.c.batch.length,0);
 h.c.window.closetAuth.user={id:'owner-A'};
 releaseDigest(new Uint8Array(32).buffer);
 for(let i=0;i<12;i++)await Promise.resolve();
 assert.equal(h.c.batch.length,0,'no formerly authorized JPEG may be added to replacement session');
 assert.equal(h.c.items.length,0);
 assert.equal(worker.closed,true,'worker must be terminated on post-await revoked owner');
 assert.match(h.node('outfitSplitStatus').textContent,/session changed during photo verification/);
});

const originalSha70=createHash('sha256').update(Buffer.from('ORIGINAL','base64')).digest('hex');
const optin70='https://example.test/closet?outfitInstances840=1&outfitUnits70=1';
function pieceWithSource70(sourceSha256=originalSha70,extra={}){
 return {
  image:'data:image/jpeg;base64,U0hPRUxFRlQ=',
  recognitionPhoto:{image:'data:image/jpeg;base64,Q1JPUExFRlQ='},
  hint:{categories:['Shoes'],types:[],clipped:false},
  instanceMethod:'connected_footwear_component',requiresReview:true,
  reconciliation70:{sourceSha256,maskSha256:'a'.repeat(64)},
  ...extra
 };
}
test('P88 source70 recomputes the actual local original JPEG SHA before accepting a masked draft',async()=>{
 const h=captureHarness({ownerId:'owner-A',href:optin70}),job=vm.runInContext('outfitSplitJob',h.c);
 h.emit({type:'piece',piece:pieceWithSource70()});
 h.emit({type:'done',count:1});
 await job.messageQueue;
 assert.equal(h.c.batch.length,1);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,ORIGINAL');
 assert.equal(h.c.batch[0].reconciliation70.sourceSha256,originalSha70);
 assert.equal(h.c.batch[0].reconciliation70.ownerId,'owner-A');
 assert.equal(h.c.batch[0].reconciliation70Status,'unresolved');
 assert.equal(allowSaving(h.c.batch[0]),false);
 assert.equal(h.c.worker.closed,true);
});
test('P88 reject a valid-format but wrong-worker-claimed JPEG SHA before any private draft',async()=>{
 const h=captureHarness({ownerId:'owner-A',href:optin70}),job=vm.runInContext('outfitSplitJob',h.c);
 h.emit({type:'piece',piece:pieceWithSource70('f'.repeat(64))});
 h.emit({type:'done',count:1});
 await job.messageQueue;
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.worker.closed,true);
 assert.match(h.node('outfitSplitStatus').textContent,/source did not match its original JPEG/);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'data:image/jpeg;base64,ORIGINAL','legitimate owner may retry original');
});
test('P88 absent or malformed worker mask SHA cannot enter unit70 even with a matching source',async()=>{
 for(const maskSha256 of [null,'x'.repeat(64),'f'.repeat(63),'not-hash']){
  const h=captureHarness({ownerId:'owner-A',href:optin70}),job=vm.runInContext('outfitSplitJob',h.c);
  h.emit({type:'piece',piece:pieceWithSource70(originalSha70,{reconciliation70:{sourceSha256:originalSha70,maskSha256}})});
  await job.messageQueue;
  assert.equal(h.c.batch.length,0);
  assert.equal(h.c.items.length,0);
  assert.equal(h.c.worker.closed,true);
  assert.match(h.node('outfitSplitStatus').textContent,/Source proof unavailable/);
 }
});
test('P88 unit70 source digest blocks early done until verified garment is admitted in exact message order',async()=>{
 let release;
 const suspendedDigest=new Promise(resolve=>{release=resolve;});
 const h=captureHarness({ownerId:'owner-A',href:optin70,sourceDigest:suspendedDigest});
 const job=vm.runInContext('outfitSplitJob',h.c);
 h.emit({type:'piece',piece:pieceWithSource70()});
 h.emit({type:'done',count:1});
 for(let k=0;k<5;k++)await Promise.resolve();
 assert.equal(h.c.batch.length,0);
 assert.equal(vm.runInContext('outfitSplitJob',h.c),job);
 release(Uint8Array.from(createHash('sha256').update(Buffer.from('ORIGINAL','base64')).digest()).buffer);
 await job.messageQueue;
 assert.equal(h.c.batch.length,1);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.worker.closed,true);
 assert.match(h.node('outfitSplitStatus').textContent,/1 individual clothing photos cropped/);
});
test('P88 preserve previously verified original photo drafts when a later unit receipt disagrees',async()=>{
 const h=captureHarness({ownerId:'owner-A',href:optin70});
 const job=vm.runInContext('outfitSplitJob',h.c);
 h.emit({type:'piece',piece:pieceWithSource70()});
 h.emit({type:'piece',piece:pieceWithSource70('b'.repeat(64),{
  image:'data:image/jpeg;base64,VE9QUw==',
  reconciliation70:{sourceSha256:'b'.repeat(64),maskSha256:'c'.repeat(64)}
 })});
 h.emit({type:'done',count:2});
 await job.messageQueue;
 assert.equal(h.c.batch.length,1,'verified earlier receipt must not vanish');
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,ORIGINAL');
 assert.equal(h.c.batch[0].reconciliation70.sourceSha256,originalSha70);
 assert.equal(h.c.worker.closed,true);
});
test('P88 unit70 cannot accept receipts if original JPEG digest is unavailable on device',async()=>{
 const h=captureHarness({ownerId:'owner-A',href:optin70,sourceDigest:Promise.reject(Error('subtle digest unavailable'))});
 const job=vm.runInContext('outfitSplitJob',h.c);
 h.emit({type:'piece',piece:pieceWithSource70()});
 await job.messageQueue;
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.worker.closed,true);
 assert.match(h.node('outfitSplitStatus').textContent,/source did not match its original JPEG/);
});

function cropHarness88({saved=false,checkPhoto=null}={}){
 const start=appSource.indexOf('function hasSourceBoundMask88(');
 const end=appSource.indexOf('// P846:',start);
 assert.ok(start>=0&&end>start,'P88 native crop controller available');
 const c={
  localPending:new Set(),busy:false,stream:null,cameraOpening:false,
  stopCamera(){},originalSourceOnly:true,
  node:(_,label)=>({label,disabled:false,type:''}),messages:[],
  message(s){c.messages.push(s);},openPhotoCrop(_,callbacks){c.editor=callbacks;return Promise.resolve();},
  structuredClone, checkPhoto:checkPhoto||(async()=>({colorEstimate:null,signature:[],aspect:1})),
  ClothingDetails:{fillColor:()=>({})},
  items:saved?[{id:'garment'}]:[],batch:[{id:'garment'}],writeCount:0,
  writeAll:async()=>{c.writeCount++},render(){},
  queued:async fn=>{c.writeCount++;return fn();},
  db:{transaction(){return {objectStore:()=>({put(){}}),set oncomplete(fn){fn()}}}},
  applyLocalChoice(){throw Error('unexpected suggestion')},
  window:{closetAuth:{user:{id:'owner-A'}}}
 };
 vm.createContext(c);
 vm.runInContext(appSource.slice(start,end),c);
 return c;
}
const sampleSource88=()=>({id:'garment',image:'data:image/jpeg;base64,T1JJR0lOQUw=',category:'Tops',color:'Blue',
  itemType:'T-shirt',name:'Source photo',seasons:[]});
test('P88 source-bound P70 photo is not crop-editable even through a direct function call',()=>{
 const c=cropHarness88();
 for(const bound of [
  {reconciliation70:{ownerId:'owner-A',sourceSha256:'a'.repeat(64),maskSha256:'b'.repeat(64)}},
  {reconciliation70Status:'unresolved'},
  {reconciliation70Status:'separate_confirmed'},
  {shoePair:{confirmedByOwner:true}},
  {combinedFragments70:{confirmedByOwner:true}},
  {segmentHint:{componentReviewStatus:'owner_must_confirm_garment_units'}},
  {segmentHint:{componentReviewStatus:'unresolved_fragments_keep_source_mask'}}
 ]){
  const item={...sampleSource88(),...bound};
  assert.equal(c.cropButton(item).disabled,true);
  c.editor=null;c.cropClothingPhoto(item);
  assert.equal(c.editor,null,'direct script invocation cannot bypass disabled button');
  assert.match(c.messages.at(-1),/original segmented mask/);
  assert.equal(c.writeCount,0);
 }
});
test('P88 unsegmented single-photo crop still works with original owner-edit workflow',async()=>{
 const c=cropHarness88({saved:true}),item=sampleSource88();
 assert.equal(c.cropButton(item).disabled,false);
 c.cropClothingPhoto(item);
 assert.ok(c.editor);
 await c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT',cropBounds:{x:0,y:0,width:1,height:1}},null);
 assert.equal(c.writeCount,1);
 assert.equal(item.image,'data:image/jpeg;base64,TkVXUElYRUxT');
 assert.equal(c.messages.length,0);
});
test('P88 late P70 mask receipt during awaited crop photo-quality check forbids stale write',async()=>{
 let release;
 const c=cropHarness88({saved:true,checkPhoto:()=>new Promise(resolve=>{release=resolve;})}),item=sampleSource88();
 c.cropClothingPhoto(item);
 const pending=c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 item.reconciliation70={ownerId:'owner-A',sourceSha256:'a'.repeat(64),maskSha256:'b'.repeat(64)};
 release({colorEstimate:null,signature:[],aspect:1});
 await assert.rejects(pending,/P88_STALE_MASK_AFTER_PHOTO_CHECK/);
 assert.equal(c.writeCount,0);
 assert.equal(item.image,sampleSource88().image,'original pixels retained on rejected crop');
});
test('P88 late P70 mask receipt inserted after editor opens but before Save rejects immediately',async()=>{
 const c=cropHarness88({saved:true}),item=sampleSource88();
 c.cropClothingPhoto(item);
 item.segmentHint={componentReviewStatus:'owner_must_confirm_garment_units'};
 await assert.rejects(c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null),/P88_SOURCE_MASK_CROP_FORBIDDEN/);
 assert.equal(c.writeCount,0);
 assert.equal(item.image,sampleSource88().image);
});
