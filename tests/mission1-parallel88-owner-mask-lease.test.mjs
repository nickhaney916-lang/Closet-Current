// Mission #88 source-executed experimental worker/draft/owner mask veto tests.
// Synthetic segmentation logits and fake worker: no new real-model accuracy data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import * as segmentation from '../public/outfit-segmentation.mjs';
import * as unit70 from '../public/outfit-unit-reconciliation-70.mjs';
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
 assert.match(h.node('outfitSplitStatus').textContent,/1 tentative clothing regions found, not a verified garment count/);
 assert.match(h.node('outfitSplitStatus').textContent,/Small accessories such as watches, belts, headwear, bags or glasses/);
 assert.match(h.node('outfitSplitStatus').textContent,/Photograph missing items individually/);
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
 // Execute the ACTUAL native same-source/mask duplicate policy in addition
 // to the source-bound private save; do not replace it with a mock predicate.
 const receiptStart=appSource.indexOf('function unit70Receipts(');
 const receiptEnd=appSource.indexOf('function unit70OwnerEvidenceValid(',receiptStart);
 assert.ok(receiptStart>=0&&receiptEnd>receiptStart);
 vm.runInContext(appSource.slice(receiptStart,receiptEnd),c);
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

test('P88 an incomplete outfit scan prompts human comparison and independent close-up photos, never a complete item count',()=>{
 const h=captureHarness({ownerId:'owner-A'});
 h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,UElFQ0U=',
  hint:{categories:['Dresses'],types:[],clipped:false},
  instanceMethod:'native_semantic_group',requiresReview:true
 }});
 h.emit({type:'done',count:1});
 assert.equal(h.c.batch.length,1);
 assert.equal(h.c.items.length,0,'no implicit wardrobe save');
 const status=h.node('outfitSplitStatus').textContent;
 assert.match(status,/1 tentative clothing regions found, not a verified garment count/);
 assert.match(status,/Compare these tentative regions with your original outfit photo/);
 assert.match(status,/watches, belts, headwear, bags or glasses/);
 assert.match(status,/tops or bottoms, may be missed/);
 assert.match(status,/Photograph missing items individually and confirm each category, subtype and color yourself/);
 assert.equal(h.c.batch[0].originalPhoto.image,'data:image/jpeg;base64,ORIGINAL');
 // The app navigates to Review when drafts were captured. The caution must
 // be visible there, not only in the hidden Add clothes/scan status.
 const reviewStatus=h.node('outfitSaveStatus').textContent;
 assert.match(reviewStatus,/Separated pieces remain here for you to confirm category, type and color/);
 assert.match(reviewStatus,/watches, belts, headwear, bags or glasses/);
 assert.match(reviewStatus,/Photograph missing items individually/);
});
test('P88 zero recognised outfit regions does not falsely declare a clean empty inventory',()=>{
 const h=captureHarness({ownerId:'owner-A'});
 h.emit({type:'done',count:0});
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 const status=h.node('outfitSplitStatus').textContent;
 assert.match(status,/No confidently separated clothing regions found/);
 assert.match(status,/watches, belts, headwear, bags or glasses/);
 assert.match(status,/Photograph missing items individually/);
});
test('P88 missing-category caution is flag-gated and legacy outfit completion text is unchanged',()=>{
 const h=captureHarness({href:'https://example.test/closet'});
 assert.equal(h.c.worker.request.instanceReview840,undefined);
 h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,UElFQ0U=',
  hint:{categories:['Tops'],types:[],clipped:false},
  instanceMethod:'native_semantic_group'
 }});
 h.emit({type:'done',count:1});
 assert.match(h.node('outfitSplitStatus').textContent,/1 individual clothing photos cropped/);
 assert.doesNotMatch(h.node('outfitSplitStatus').textContent,/tentative clothing regions|watches/);
 assert.doesNotMatch(h.node('outfitSaveStatus').textContent,/watches|missing items/);
 assert.equal(h.c.items.length,0);
});

function unitDecisionHarness88({ownerId='owner-A',sourceId='src-A',apiPromise=null,queueBeforeWrite=null}={}){
 const begin=captureSource.indexOf('function unit70Owner(){');
 const end=captureSource.indexOf('function renderOutfitCapture(){',begin);
 assert.ok(begin>=0&&end>begin,'native P88 owner decisions are source-executed');
 const initialOwner={id:ownerId};
 const ownerDraft=(id,source=sourceId,owner=ownerId)=>({
  id,outfitSourceId:source,category:'Shoes',itemType:'',image:'data:image/jpeg;base64,U0hPRQ==',
  reconciliation70Status:'unresolved',segmentHint:{categories:['Shoes'],clipped:false},
  reconciliation70:{ownerId:owner,sourceSha256:'a'.repeat(64),
   maskSha256:(id==='part-A'?'b':'c').repeat(64)}
 });
 const dom={hidden:true,children:[],replaceChildren(){this.children=[]},prepend(x){this.children.unshift(x)}};
 const c={
  window:{closetAuth:{user:initialOwner}},outfitActiveId:sourceId,
  batch:[ownerDraft('part-A')],items:[],outfitUnits70:true,
  outfitUnit70Error:'',unit70Api:apiPromise||Promise.resolve(unit70),
  structuredClone,captureOwner88:()=>c.window.closetAuth?.user||null,
  db:{transaction(){const tx={
   objectStore(){return {put(value){c.storageWrites.push(value);Promise.resolve().then(()=>tx.oncomplete?.())}}},
   oncomplete:null,onerror:null,onabort:null
  };return tx}},
  storageWrites:[],queuedCalls:0,renderCalls:0,captureRenders:0,
  queued:async task=>{c.queuedCalls++;if(c.queueGate||queueBeforeWrite)await (c.queueGate||queueBeforeWrite);return task()},
  render(){c.renderCalls++},renderOutfitCapture(){c.captureRenders++},
  candidate(){throw Error('UNSAFE generic candidate may not run before P70 unpair authorization')},
  normalizeClothing:x=>({...x}),crypto:{randomUUID:()=> 'restored-companion-88'},
  ClothingDetails:{fillColor:()=>({})},
  sessionCapturedIds:new Set(),session:0,
  uiNodes:new Map(),$:id=>{
   if(!c.uiNodes.has(id))c.uiNodes.set(id,{textContent:'',src:'',hidden:true});
   return c.uiNodes.get(id);
  },
  autoQueue:[],queueAutomatic(item){c.autoQueue.push({item,alreadyPersisted:c.storageWrites.some(x=>x.batch.some(y=>y.id===item.id))})},
  document:{
   getElementById:id=>id==='outfitUnitReview70'?dom:null,
   createElement:()=>({textContent:'',setAttribute(){}})
  },
  apiPanelCallbacks:null,
  extraDom:dom
 };
 if(!apiPromise)c.unit70Api=Promise.resolve({
  ...unit70,renderUnitReview70(_target,callbacks){c.apiPanelCallbacks=callbacks;}
 });
 vm.createContext(c);vm.runInContext(captureSource.slice(begin,end),c);
 return {c,ownerDraft,originalOwner:initialOwner,dom};
}
test('P88 physical owner keep decision persists only to same exact signed session and original outfit',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 await vm.runInContext("updateUnit70('keep',['part-A'])",c);
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites.length,1);
 assert.equal(c.storageWrites[0].batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites[0].batch[0].reconciliation70.ownerId,'owner-A');
 assert.equal(c.renderCalls,1);
 assert.equal(c.items.length,0);
});
test('P88 physical unit decision cannot cross an asynchronous API import into replaced same-ID session',async()=>{
 let resolveApi;
 const pendingApi=new Promise(resolve=>{resolveApi=resolve;});
 const h=unitDecisionHarness88({apiPromise:pendingApi}),c=h.c;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 c.window.closetAuth.user={id:'owner-A'};
 resolveApi(unit70);
 await pending;
 assert.equal(c.batch[0].reconciliation70Status,'unresolved');
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.queuedCalls,0);
 assert.equal(c.renderCalls,0);
});
test('P88 stale Review-panel callbacks do not authorize a replaced same-ID login',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 vm.runInContext('renderUnit70Panel()',c);
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.ok(c.apiPanelCallbacks,'real Review panel captured the source owner lease');
 c.window.closetAuth.user={id:'owner-A'};
 await c.apiPanelCallbacks.onKeep(['part-A']);
 assert.equal(c.batch[0].reconciliation70Status,'unresolved');
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.queuedCalls,0);
});
test('P88 stale Review-panel callbacks cannot apply to another outfit source',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 vm.runInContext('renderUnit70Panel()',c);
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.ok(c.apiPanelCallbacks);
 c.outfitActiveId='src-B';
 await c.apiPanelCallbacks.onKeep(['part-A']);
 assert.equal(c.batch[0].reconciliation70Status,'unresolved');
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.queuedCalls,0);
});
test('P88 asynchronous panel import cannot paint old-owner garments after account changes',async()=>{
 let resolveApi;
 const pendingApi=new Promise(resolve=>{resolveApi=resolve;});
 let painted=0;
 const h=unitDecisionHarness88({apiPromise:pendingApi}),c=h.c;
 vm.runInContext('renderUnit70Panel()',c);
 c.window.closetAuth.user={id:'owner-A'};
 resolveApi({...unit70,renderUnitReview70(){painted++}});
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.equal(painted,0);
 assert.equal(c.window.ownerMaySaveUnit70,undefined);
 assert.equal(c.storageWrites.length,0);
});
test('P88 queued cloud-beforeWrite authorization is checked again before IDB draft mutation',async()=>{
 let release;
 const blocked=new Promise(resolve=>{release=resolve;});
 const h=unitDecisionHarness88({queueBeforeWrite:blocked}),c=h.c;
 const original=c.batch;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed',
  'candidate stays only in memory while queued beforeWrite runs');
 assert.equal(c.storageWrites.length,0);
 c.window.closetAuth.user={id:'owner-B'};
 release();
 await pending;
 assert.equal(c.storageWrites.length,0,'old signed source never writes after queue await');
 assert.equal(c.batch[0].reconciliation70Status,'unresolved','revoked in-memory decision rolled back');
 assert.equal(c.batch[0].id,original[0].id);
 assert.equal(c.renderCalls,0);
});
test('P88 current owner cannot claim a separate source/photo or a different owner reconciliation',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 c.batch.push(h.ownerDraft('part-B','src-other','owner-A'));
 c.batch.push(h.ownerDraft('part-C','src-A','owner-B'));
 await vm.runInContext("updateUnit70('keep',['part-B'])",c);
 await vm.runInContext("updateUnit70('keep',['part-C'])",c);
 assert.ok(c.batch.every(x=>x.reconciliation70Status==='unresolved'));
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.queuedCalls,0);
 assert.ok(c.captureRenders>=2,'error stays on actual owner Review panel');
});

test('P88 foreign-source owner receipt cannot appear in the signed review panel',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 c.batch.push(h.ownerDraft('other-owner','src-A','owner-B'));
 vm.runInContext('renderUnit70Panel()',c);
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.equal(c.apiPanelCallbacks,null,'foreign owner photos may never enter this panel');
 assert.equal(h.dom.hidden,true);
 assert.equal(c.storageWrites.length,0);
});
test('P88 old discard callback cannot delete a garment the owner has already confirmed',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 vm.runInContext('renderUnit70Panel()',c);
 for(let i=0;i<8;i++)await Promise.resolve();
 const staleAction=c.apiPanelCallbacks.onDiscard;
 await vm.runInContext("updateUnit70('keep',['part-A'])",c);
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 const beforeWrites=c.storageWrites.length;
 await staleAction(['part-A']);
 assert.equal(c.batch.length,1,'confirmed draft must survive old unresolved-group discard action');
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites.length,beforeWrites,'no stale discard persistence');
});

function makeConfirmedPair88(h){
 const c=h.c;
 const second=h.ownerDraft('part-B');
 second.image='data:image/jpeg;base64,U0hPRVJJR0hU';
 c.batch.push(second);
 return vm.runInContext("updateUnit70('pair',['part-A','part-B'])",c);
}
test('P88 unpair restores companion ONLY after a single authorized snapshot commit, then starts recognition',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 await makeConfirmedPair88(h);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].shoePair?.confirmedByOwner,true);
 assert.equal(c.storageWrites.length,1);
 const priorWrites=c.storageWrites.length;
 await vm.runInContext("updateUnit70('unpair',['part-A'])",c);
 assert.equal(c.batch.length,2);
 assert.equal(c.storageWrites.length,priorWrites+1,
  'unpair must use a single owner-bound IDB draft transaction');
 assert.deepEqual(c.storageWrites.at(-1).batch.map(x=>x.id),['part-A','restored-companion-88']);
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.batch[1].reconciliation70Status,'separate_confirmed');
 assert.equal(c.batch[1].reconciliation70.maskSha256,'c'.repeat(64));
 assert.equal(c.batch[1].outfitSourceId,'src-A');
 assert.equal(c.autoQueue.length,1);
 assert.equal(c.autoQueue[0].alreadyPersisted,true,
  'recognition must run only AFTER the P70 snapshot is durably committed');
 assert.equal(c.sessionCapturedIds.has('restored-companion-88'),true);
 assert.equal(c.session,1);
 assert.equal(c.uiNodes.get('reviewCount').textContent,2);
});
test('P88 revoked owner during unpair queued cloud-beforeWrite cannot leak companion photo or recognition',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 await makeConfirmedPair88(h);
 const before=c.storageWrites.length;
 let release;
 c.queueGate=new Promise(resolve=>{release=resolve;});
 const pending=vm.runInContext("updateUnit70('unpair',['part-A'])",c);
 for(let n=0;n<10;n++)await Promise.resolve();
 assert.equal(c.batch.length,2,'in-memory restoration may stage pending commit');
 assert.equal(c.storageWrites.length,before);
 assert.equal(c.autoQueue.length,0);
 assert.equal(c.sessionCapturedIds.size,0);
 c.window.closetAuth.user={id:'owner-A'};
 release();
 await pending;
 assert.equal(c.storageWrites.length,before,'no separate generic draft transaction after owner change');
 assert.equal(c.batch.length,1,'failed unpair rolls back only its staged halves');
 assert.equal(c.batch[0].shoePair?.confirmedByOwner,true);
 assert.equal(c.autoQueue.length,0);
 assert.equal(c.sessionCapturedIds.size,0);
 assert.equal(c.session,0);
});
test('P88 failed queue aborts complete unpair without a second shadow draft write or photo scan',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 await makeConfirmedPair88(h);
 const before=c.storageWrites.length;
 c.queueGate=Promise.reject(Error('cloud.beforeWrite failed'));
 await vm.runInContext("updateUnit70('unpair',['part-A'])",c);
 assert.equal(c.storageWrites.length,before);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].shoePair?.confirmedByOwner,true);
 assert.equal(c.autoQueue.length,0);
 assert.equal(c.session,0);
 assert.match(c.outfitUnit70Error,/cloud.beforeWrite failed/);
});
test('P88 reject unpair forged companion owner/mask SHA or duplicated JPEG without side effects',async()=>{
 for(const kind of ['owner','mask','duplicate']){
  const h=unitDecisionHarness88(),c=h.c;
  await makeConfirmedPair88(h);
  const before=c.storageWrites.length;
  const companion=c.batch[0].shoePair.companion;
  if(kind==='owner')companion.reconciliation70={...companion.reconciliation70,ownerId:'owner-B'};
  if(kind==='mask')companion.reconciliation70={...companion.reconciliation70,maskSha256:'b'.repeat(64)};
  if(kind==='duplicate')companion.image=c.batch[0].image;
  await vm.runInContext("updateUnit70('unpair',['part-A'])",c);
  assert.equal(c.batch.length,1);
  assert.equal(c.storageWrites.length,before);
  assert.equal(c.autoQueue.length,0);
  assert.equal(c.sessionCapturedIds.size,0);
  assert.equal(c.session,0);
  assert.match(c.outfitUnit70Error,/companion garment|companion photo/i);
 }
});

test('P88 two rapid owner keep decisions serialize full durable snapshots without losing either decision',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 c.batch.push(h.ownerDraft('part-B'));
 let release;
 c.queueGate=new Promise(resolve=>{release=resolve;});
 const first=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 const second=vm.runInContext("updateUnit70('keep',['part-B'])",c);
 for(let i=0;i<16;i++)await Promise.resolve();
 assert.equal(c.queuedCalls,1,'second unit decision must not start a conflicting queued write');
 assert.equal(c.batch.find(x=>x.id==='part-A').reconciliation70Status,'separate_confirmed');
 assert.equal(c.batch.find(x=>x.id==='part-B').reconciliation70Status,'unresolved',
  'second decision must wait for the first transaction outcome');
 assert.equal(c.storageWrites.length,0);
 release();await Promise.all([first,second]);
 assert.equal(c.storageWrites.length,2);
 assert.deepEqual(c.storageWrites[0].batch.map(x=>x.reconciliation70Status),
  ['separate_confirmed','unresolved']);
 assert.deepEqual(c.storageWrites[1].batch.map(x=>x.reconciliation70Status),
  ['separate_confirmed','separate_confirmed']);
 assert.equal(c.batch.every(x=>x.reconciliation70Status==='separate_confirmed'),true);
 assert.equal(c.items.length,0,'physical decisions are never automatic closet admissions');
});
test('P88 rapid pair then unpair commits once each in order, companion scans after its durable snapshot',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 const right=h.ownerDraft('part-B');right.image='data:image/jpeg;base64,U0hPRVJJR0hU';c.batch.push(right);
 let release;c.queueGate=new Promise(resolve=>{release=resolve;});
 const paired=vm.runInContext("updateUnit70('pair',['part-A','part-B'])",c);
 const split=vm.runInContext("updateUnit70('unpair',['part-A'])",c);
 for(let i=0;i<16;i++)await Promise.resolve();
 assert.equal(c.queuedCalls,1);
 assert.equal(c.batch.length,1,'unpair must not run against uncommitted pair snapshot');
 assert.equal(c.batch[0].shoePair?.confirmedByOwner,true);
 assert.equal(c.autoQueue.length,0);
 release();await Promise.all([paired,split]);
 assert.equal(c.storageWrites.length,2);
 assert.equal(c.storageWrites[0].batch.length,1,'pair committed first');
 assert.equal(c.storageWrites[1].batch.length,2,'two unpaired halves committed second');
 assert.equal(c.autoQueue.length,1);
 assert.equal(c.autoQueue[0].alreadyPersisted,true);
 assert.equal(c.batch.length,2);
 assert.equal(c.batch.every(x=>x.reconciliation70Status==='separate_confirmed'),true);
 assert.equal(c.session,1);
});
test('P88 queued physical decision failure rolls back before next valid decision is evaluated',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 c.batch.push(h.ownerDraft('part-B'));
 let rejectFirst;c.queueGate=new Promise((resolve,reject)=>{rejectFirst=reject;});
 const failed=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 const later=vm.runInContext("updateUnit70('keep',['part-B'])",c);
 for(let i=0;i<12;i++)await Promise.resolve();
 assert.equal(c.queuedCalls,1);
 assert.equal(c.batch.find(x=>x.id==='part-A').reconciliation70Status,'separate_confirmed');
 c.queueGate=null;
 rejectFirst(Error('first owner decision cloud preflight failed'));
 await Promise.all([failed,later]);
 assert.equal(c.storageWrites.length,1,'failed snapshot must not leak into later durable state');
 const persisted=c.storageWrites[0].batch;
 assert.deepEqual(persisted.map(x=>x.reconciliation70Status),
  ['unresolved','separate_confirmed']);
 assert.deepEqual(c.batch.map(x=>x.reconciliation70Status),
  ['unresolved','separate_confirmed']);
 assert.equal(c.autoQueue.length,0);
});
test('P88 owner click-time selection is frozen before delayed reconciliation module import',async()=>{
 let resolveApi;const delayed=new Promise(resolve=>{resolveApi=resolve;});
 const h=unitDecisionHarness88({apiPromise:delayed}),c=h.c;
 c.batch.push(h.ownerDraft('part-B'));
 c.mutableSelection=['part-A'];
 const pending=vm.runInContext("updateUnit70('keep',mutableSelection)",c);
 c.mutableSelection[0]='part-B';
 resolveApi(unit70);
 await pending;
 assert.equal(c.storageWrites.length,1);
 assert.equal(c.batch.find(x=>x.id==='part-A').reconciliation70Status,'separate_confirmed');
 assert.equal(c.batch.find(x=>x.id==='part-B').reconciliation70Status,'unresolved');
});
test('P88 two stale same-region keep clicks do not perform duplicate owner confirmed writes',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 const a=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 const b=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 await Promise.all([a,b]);
 assert.equal(c.storageWrites.length,1);
 assert.equal(c.queuedCalls,1);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 assert.match(c.outfitUnit70Error,/Invalid owner review decision/);
});

function recognitionUnitRaceHarness88(){
 const h=unitDecisionHarness88(),c=h.c;
 const start=appSource.indexOf('async function recognizeItem(item){');
 const end=appSource.indexOf('async function recognizeBatch(){',start);
 assert.ok(start>=0&&end>start,'actual asynchronous recognition source is executed');
 let resolvePhoto;
 const photo=new Promise(resolve=>{resolvePhoto=resolve;});
 c.window.document={};
 c.db.name='closet-current-user-owner-A';
 c.recognitionState={activeId:null,phase:'ready'};
 c.pendingScanLease859=new Map();
 c.localPending=new Set();
 c.photoQualityHints73=new Map();
 c.checkPhoto=()=>photo;
 c.recognitionUnavailable=false;
 c.localReady=true;
 c.recordDeviceEvent=()=>{};
 c.scanDraftBackupCalls=0;
 c.persistDraft=()=>{
  c.scanDraftBackupCalls++;
  const snapshot=structuredClone(c.batch);
  return c.queued(async()=>{
   c.storageWrites.push({id:'draft',batch:snapshot,origin:'scanner'});
  });
 };
 vm.runInContext(appSource.slice(start,end),c);
 return {...h,resolvePhoto,scan:(item)=>{
  c.pendingScanLease859.set(item.id,{item,owner:c.window.closetAuth.user,db:c.db});
  c.localPending.add(item.id);
  return vm.runInContext('recognizeItem(batch.find(x=>x.id === '+JSON.stringify(item.id)+'))',c);
 }};
}
test('P88 background scanner cannot back up a staged, not-yet-committed owner unit decision',async()=>{
 const h=recognitionUnitRaceHarness88(),c=h.c;
 const item=c.batch[0],recognition=h.scan(item);
 let release;
 c.queueGate=new Promise(resolve=>{release=resolve;});
 const decision=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let i=0;i<15;i++)await Promise.resolve();
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed',
  'in-memory pairing decision is not yet persisted');
 assert.equal(c.storageWrites.length,0);
 h.resolvePhoto({blank:true});
 for(let i=0;i<15;i++)await Promise.resolve();
 assert.equal(c.scanDraftBackupCalls,0,'stale scanner must not queue a shadow draft');
 assert.equal(c.queuedCalls,1,'only owner unit transaction may enter the write queue');
 release();await Promise.all([decision,recognition]);
 assert.equal(c.storageWrites.length,1,'scanner cannot overwrite the committed owner review');
 assert.equal(c.storageWrites[0].batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.scanDraftBackupCalls,0);
 assert.equal(c.localPending.size,0);
});
test('P88 unaffected garment scan backs up fresh post-decision owner state only after unit commit',async()=>{
 const h=recognitionUnitRaceHarness88(),c=h.c;
 const second=h.ownerDraft('part-B');second.image='data:image/jpeg;base64,U0hPRVJJR0hU';
 c.batch.push(second);
 const scan=h.scan(second);
 let release;c.queueGate=new Promise(resolve=>{release=resolve;});
 const decision=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let i=0;i<15;i++)await Promise.resolve();
 assert.equal(c.storageWrites.length,0);
 h.resolvePhoto({blank:true});
 for(let i=0;i<18;i++)await Promise.resolve();
 assert.equal(c.scanDraftBackupCalls,0);
 release();await Promise.all([decision,scan]);
 assert.equal(c.storageWrites.length,2,'owner decision first, current scanner draft second');
 assert.equal(c.storageWrites[0].batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites[1].origin,'scanner');
 assert.equal(c.storageWrites[1].batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites[1].batch[1].localAnalyzed,true);
 assert.equal(c.batch[1].requiresOwnershipConfirmation,true);
 assert.equal(c.items.length,0);
});
test('P88 same-ID owner replacement during scanner/fenced decision cannot persist old account JPEG',async()=>{
 const h=recognitionUnitRaceHarness88(),c=h.c;
 const scan=h.scan(c.batch[0]);
 let release;c.queueGate=new Promise(resolve=>{release=resolve;});
 const decision=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let i=0;i<15;i++)await Promise.resolve();
 h.resolvePhoto({blank:true});
 for(let i=0;i<15;i++)await Promise.resolve();
 c.window.closetAuth.user={id:'owner-A'};
 release();await Promise.all([decision,scan]);
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.scanDraftBackupCalls,0);
 assert.equal(c.batch[0].reconciliation70Status,'unresolved');
 assert.equal(c.items.length,0);
});
test('P88 normal non-outfit scanner cleanup is unaffected by the experimental unit fence',async()=>{
 const h=recognitionUnitRaceHarness88(),c=h.c;
 c.outfitUnits70=false;
 c.batch[0].outfitSourceId=null;
 const scan=h.scan(c.batch[0]);
 h.resolvePhoto({blank:true});
 await scan;
 assert.equal(c.scanDraftBackupCalls,1);
 assert.equal(c.storageWrites.length,1);
 assert.equal(c.storageWrites[0].origin,'scanner');
 assert.equal(c.batch[0].localAnalyzed,true);
});


// Source-execute P88's actual owner/private-save lease functions. These tests
// use synthetic JPEG bytes and fake IndexedDB, NOT hosted signed accounts.
function sourceSaveHarness88(){
 const start=appSource.indexOf('function sourceGroupRevision88(');
 const end=appSource.indexOf('// Mission 1 #88: unresolved SegFormer fragments',start);
 assert.ok(start>=0&&end>start,'native source lease must be present');
 const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,225,7,255,217]).toString('base64');
 const hash=createHash('sha256').update(Buffer.from([255,216,255,225,7,255,217])).digest('hex');
 const user={id:'owner-a'},writes=[],db={
  name:'closet-current-user-owner-a',
  transaction(stores,mode){
   assert.deepEqual([...stores],['items','state']);
   assert.equal(mode,'readwrite');
   const tx={
    objectStore(name){return {put(value){
     writes.push({name,value});
     if(name==='state')queueMicrotask(()=>tx.oncomplete?.());
    }}}
   };
   return tx;
  }
 };
 const receipt={ownerId:user.id,sourceSha256:hash,maskSha256:'a'.repeat(64)};
 const item={id:'source-88',outfitSourceId:'photo-88',image:jpeg,
  originalPhoto:{image:jpeg},recognitionPhoto:{image:jpeg},
  reconciliation70:receipt,reconciliation70Status:'separate_confirmed'};
 const c={window:{closetAuth:{user}},db,items:[],batch:[item],crypto:{
  subtle:{digest:async(_,bytes)=>Uint8Array.from(createHash('sha256').update(Buffer.from(bytes)).digest()).buffer}
 },atob:s=>Buffer.from(s,'base64').toString('binary'),
  Uint8Array,structuredClone,Promise,
  unit70OwnerEvidenceValid:i=>i.reconciliation70?.ownerId===c.window.closetAuth.user?.id&&
   (i.reconciliation70Status!=='paired_confirmed'||i.category==='Shoes'),
  queued:async fn=>{await c.beforeWrite?.();return fn();}
 };
 vm.createContext(c);
 // Native duplicate predicate, not a mocked decision: source-bound saving
 // must detect masks that another item acquired while cloud preflight awaited.
 const receiptsStart=appSource.indexOf('function unit70Receipts(');
 const receiptsEnd=appSource.indexOf('function unit70OwnerEvidenceValid(',receiptsStart);
 assert.ok(receiptsStart>=0&&receiptsEnd>receiptsStart);
 vm.runInContext(appSource.slice(receiptsStart,receiptsEnd),c);
 vm.runInContext(appSource.slice(start,end),c);
 return {c,user,db,item,jpeg,hash,writes};
}
test('P88 owner source lease independently hashes original JPEG before atomic private save',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await c.saveSourceBoundPiece88({...item},[],lease);
 assert.deepEqual(writes.map(x=>x.name),['items','state']);
 assert.equal(writes[0].value.originalPhoto.image,item.originalPhoto.image);
 assert.equal(writes[1].value.batch.length,0);
});
test('P88 same-ID owner replacement during JPEG hash refuses original session save',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 let release;
 const prior=c.crypto.subtle.digest;
 c.crypto.subtle.digest=(...args)=>new Promise(resolve=>{release=()=>prior(...args).then(resolve);});
 const verifying=c.sourceSavePhotoVerified88(lease);
 await Promise.resolve();
 c.window.closetAuth.user={id:'owner-a'};
 release();
 assert.equal(await verifying,false);
 await assert.rejects(c.saveSourceBoundPiece88({...item},[],lease),/P88_STALE_SOURCE_OWNER/);
 assert.equal(writes.length,0);
});
test('P88 queued cloud preflight rechecks signed owner and actual IDB handle before transaction',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 c.beforeWrite=async()=>{c.db={name:'closet-current-user-owner-a'};};
 await assert.rejects(c.saveSourceBoundPiece88({...item},[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});
test('P88 changed original JPEG or mask receipt cannot use earlier owner photo proof',async()=>{
 const {c,item,writes,jpeg}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 item.originalPhoto={image:jpeg+'A'};
 assert.equal(await c.sourceSavePhotoVerified88(lease),false);
 item.originalPhoto={image:jpeg};
 item.reconciliation70={...item.reconciliation70,maskSha256:'b'.repeat(64)};
 await assert.rejects(c.saveSourceBoundPiece88({...item},[],lease),/P88_STALE_SOURCE_OWNER/);
 assert.equal(writes.length,0);
});

test('P88 owner-approved shoe category permits paired save, but pre-edit category cannot falsely veto it',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 item.category='Uncategorized';
 item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true,companion:{reconciliation70:{
  ownerId:'owner-a',sourceSha256:item.reconciliation70.sourceSha256,maskSha256:'b'.repeat(64)}}};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await c.saveSourceBoundPiece88({...item,category:'Shoes'},[],lease);
 assert.deepEqual(writes.map(x=>x.name),['items','state']);
});
test('P88 paired physical unit refuses mismatched owner category at private write',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 item.category='Uncategorized';
 item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await assert.rejects(c.saveSourceBoundPiece88({...item,category:'Tops'},[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});


test('P88 nested companion mask edited in place during cloud preflight revokes shoe save',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 item.category='Shoes';item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true,componentIds:['left','right'],
  companion:{image:'data:image/jpeg;base64,QUJDRA==',
   reconciliation70:{ownerId:'owner-a',sourceSha256:item.reconciliation70.sourceSha256,
    maskSha256:'b'.repeat(64)}}};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const approved=structuredClone(item);
 c.beforeWrite=async()=>{
  // The pair object reference remains identical, as does the main source mask.
  item.shoePair.companion.reconciliation70.maskSha256='c'.repeat(64);
 };
 await assert.rejects(c.saveSourceBoundPiece88(approved,[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0,'never save mutated physical-pair evidence');
});

test('P88 newly saved duplicate mask during queued cloud preflight vetoes private admission',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 c.beforeWrite=async()=>c.items.push({
  id:'already-saved-other',reconciliation70:{ownerId:'owner-a',
   sourceSha256:item.reconciliation70.sourceSha256,
   maskSha256:item.reconciliation70.maskSha256}
 });
 await assert.rejects(c.saveSourceBoundPiece88(structuredClone(item),[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0,'same original mask can enter closet only once');
});

test('P88 queued original save preserves unrelated new photo draft added during cloud preflight',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const second={id:'independent-new-photo',image:'data:image/jpeg;base64,SU5ERVBFTkRFTlQ='};
 c.beforeWrite=async()=>c.batch.push(second);
 await c.saveSourceBoundPiece88(structuredClone(item),[],lease);
 assert.deepEqual(writes.map(x=>x.name),['items','state']);
 assert.equal(writes[1].value.batch.length,1);
 assert.equal(writes[1].value.batch[0].id,second.id);
 assert.equal(writes[0].value.id,item.id);
});


test('P88 queued P70 owner keep after cloud preflight preserves a newly captured separate photo',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const h=unitDecisionHarness88({queueBeforeWrite:gate}),c=h.c;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites.length,0,'owner physical-unit decision not yet durable');
 // A second camera source arrives while queued cloud.beforeWrite has not returned.
 const independent=h.ownerDraft('new-photo','another-original','owner-A');
 c.batch.push(independent);
 release();await pending;
 assert.equal(c.storageWrites.length,1);
 assert.deepEqual(c.storageWrites[0].batch.map(x=>x.id),['part-A','new-photo']);
 assert.equal(c.storageWrites[0].batch[0].reconciliation70Status,'separate_confirmed');
 assert.equal(c.storageWrites[0].batch[1].outfitSourceId,'another-original');
 assert.equal(c.batch.length,2,'the independently captured draft remains visible');
});

test('P88 rejected P70 owner decision restores original region but keeps new photo',async()=>{
 let rejectGate;const gate=new Promise((_resolve,reject)=>{rejectGate=reject;});
 const h=unitDecisionHarness88({queueBeforeWrite:gate}),c=h.c;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 c.batch.push(h.ownerDraft('new-photo','another-original','owner-A'));
 rejectGate(Error('cloud.beforeWrite deliberately refused this owner action'));
 await pending;
 assert.equal(c.storageWrites.length,0,'failed owner action cannot write a draft');
 assert.deepEqual(c.batch.map(x=>x.id),['part-A','new-photo']);
 assert.equal(c.batch[0].reconciliation70Status,'unresolved',
  'only the uncommitted physical-unit owner action was rolled back');
 assert.equal(c.batch[1].outfitSourceId,'another-original',
  'the camera capture is NOT rolled back with the owner decision');
 assert.match(c.outfitUnit70Error,/cloud.beforeWrite deliberately refused/);
});

test('P88 changed signed unit mask during P70 preflight is not persisted as an approved decision',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const h=unitDecisionHarness88({queueBeforeWrite:gate}),c=h.c;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 c.batch[0].reconciliation70.maskSha256='f'.repeat(64);
 release();await pending;
 assert.equal(c.storageWrites.length,0,'stale owner source mask must never be committed');
 assert.equal(c.batch[0].reconciliation70Status,'unresolved');
 assert.match(c.outfitUnit70Error,/Owner or source garment changed before draft persistence/);
});
