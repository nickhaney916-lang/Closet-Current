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

function cropHarness88({saved=false,checkPhoto=null,peers=[]}={}){
 const start=appSource.indexOf('function hasSourceBoundMask88(');
 const end=appSource.indexOf('// P846:',start);
 const leaseStart=appSource.indexOf('function reviewedExactPhotoPeers88(');
 const leaseEnd=appSource.indexOf('function empty(',leaseStart);
 assert.ok(start>=0&&end>start&&leaseStart>=0&&leaseEnd>leaseStart,
  'P88 native crop and reviewed owner lease available');
 const c={
  localPending:new Set(),busy:false,stream:null,cameraOpening:false,
  stopCamera(){},originalSourceOnly:true,localReady:true,
  node:(_,label)=>({label,disabled:false,type:''}),messages:[],
  message(s){c.messages.push(s);},openPhotoCrop(_,callbacks){c.editor=callbacks;return Promise.resolve();},
  structuredClone,checkPhoto:checkPhoto||(async()=>({colorEstimate:null,signature:[],aspect:1})),
  ClothingDetails:{fillColor:()=>({})},
  items:[],batch:[],draftStoreRevision88:'null',writeCount:0,written:[],render(){c.renderCount++;},renderCount:0,
  queued:async fn=>{await c.beforeWrite?.();const result=fn();c.writeCount++;return result;},
  db:{name:'closet-current-user-owner-A',transaction(stores,mode){
   assert.equal(mode,'readwrite');
   const tx={objectStore(store){return {put(value){
    c.written.push({store,value:structuredClone(value)});
   }}}};
   queueMicrotask(()=>tx.oncomplete?.());return tx;
  }},
  applyLocalChoice(){throw Error('unexpected suggestion')},
  window:{closetAuth:{user:{id:'owner-A'}}}
 };
 vm.createContext(c);
 // Verify the actual native signed-owner lease along with the same-source
 // mask/crop guards, not a permissive mock of the private storage boundary.
 vm.runInContext(appSource.slice(leaseStart,leaseEnd),c);
 const receiptStart=appSource.indexOf('function unit70Receipts(');
 const receiptEnd=appSource.indexOf('function unit70OwnerEvidenceValid(',receiptStart);
 assert.ok(receiptStart>=0&&receiptEnd>receiptStart);
 vm.runInContext(appSource.slice(receiptStart,receiptEnd),c);
 vm.runInContext(appSource.slice(start,end),c);
 const nativeCrop=c.cropClothingPhoto;
 c.cropClothingPhoto=item=>{
  // Match the exact object identity of the native saved closet or draft.
  if(saved){c.items=[item,...peers];c.batch=[];}else{c.items=[...peers];c.batch=[item];}
  c.draftStoreRevision88=JSON.stringify(c.batch);
  return nativeCrop(item);
 };
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
test('P88 changed cropped photo clears old exact-JPEG duplicate marker so owner may review new source',async()=>{
 const original=sampleSource88();
 const peer={id:'saved-identical',image:original.image};
 const item={...sampleSource88(),exactSavedPhotoMatch88:{savedItemId:peer.id},
  possibleDuplicate:true,requiresOwnershipConfirmation:true};
 const c=cropHarness88({peers:[peer]});
 c.cropClothingPhoto(item);
 await c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 assert.equal(c.written.length,1);
 assert.equal(c.written[0].store,'state');
 assert.equal(c.written[0].value.batch[0].exactSavedPhotoMatch88,undefined);
 assert.equal(c.written[0].value.batch[0].ownerDuplicateReview88,undefined);
 assert.equal(c.written[0].value.batch[0].possibleDuplicate,false);
 assert.equal(item.exactSavedPhotoMatch88,undefined,'in-memory old duplicate proof must also be removed');
 assert.equal(item.image,'data:image/jpeg;base64,TkVXUElYRUxT');
 const lease=c.reviewedSaveLease88(item);
 assert.equal(c.reviewedDistinctPhotoReceiptValid88({...item},lease),true,
  'a genuinely new cropped source is not permanently stuck on the stale match');
 assert.equal(c.writeCount,1);
});
test('P88 crop changing a saved duplicate-attested image revokes stale identical-byte attestation',async()=>{
 const item={...sampleSource88(),
  exactSavedPhotoMatch88:{savedItemId:'saved-peer'},
  ownerDuplicateReview88:{schema:'p88-distinct-physical-owner-attestation/v1',
   identicalSavedPhotoItemIds:['saved-peer'],ownerAttestedDistinctPhysicalItem:true}};
 const c=cropHarness88({saved:true});
 c.cropClothingPhoto(item);
 await c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 assert.equal(c.written.length,1);
 assert.equal(c.written[0].store,'items');
 assert.equal(c.written[0].value.ownerDuplicateReview88,undefined);
 assert.equal(c.written[0].value.exactSavedPhotoMatch88,undefined);
 assert.equal(item.ownerDuplicateReview88,undefined);
 assert.equal(item.exactSavedPhotoMatch88,undefined);
 assert.equal(c.writeCount,1);
});
test('P88 crop that now exactly matches an already owned DIFFERENT photo must require renewed duplicate review',async()=>{
 const item=sampleSource88(),otherPhoto='data:image/jpeg;base64,TkVXUElYRUxT';
 const peer={id:'other-owned-piece',image:otherPhoto};
 const c=cropHarness88({peers:[peer]});
 c.cropClothingPhoto(item);
 await c.editor.save({image:otherPhoto},null);
 const updated=c.written[0].value.batch[0];
 assert.equal(updated.image,otherPhoto);
 assert.equal(updated.exactSavedPhotoMatch88.savedItemId,peer.id);
 assert.equal(updated.possibleDuplicate,true);
 assert.equal(updated.requiresOwnershipConfirmation,true);
 assert.match(updated.localStatus,/exactly matches another saved closet photo/);
 assert.equal(item.exactSavedPhotoMatch88.savedItemId,peer.id);
 assert.equal(c.reviewedDistinctPhotoReceiptValid88({...item},c.reviewedSaveLease88(item)),false,
  'same-photo owner physical-item consent is still mandatory after crop');
});
test('P88 new saved peer matching the crop during cloud wait cannot enter closet without duplicate review',async()=>{
 const item=sampleSource88(),newPhoto='data:image/jpeg;base64,TkVXUElYRUxT';
 const c=cropHarness88();
 c.cropClothingPhoto(item);
 c.beforeWrite=async()=>{c.items.push({id:'saved-while-cropping',image:newPhoto});};
 await c.editor.save({image:newPhoto},null);
 const updated=c.written[0].value.batch[0];
 assert.equal(updated.exactSavedPhotoMatch88.savedItemId,'saved-while-cropping');
 assert.equal(updated.requiresOwnershipConfirmation,true);
 assert.equal(updated.possibleDuplicate,true);
});
test('P88 crop editor cannot inject fabricated duplicate-owner attestation or saved-photo marker',async()=>{
 const c=cropHarness88(),item=sampleSource88();c.cropClothingPhoto(item);
 for(const field of [
  {ownerDuplicateReview88:{ownerAttestedDistinctPhysicalItem:true}},
  {exactSavedPhotoMatch88:{savedItemId:'arbitrary'}}
 ]){
  await assert.rejects(c.editor.save({image:'data:image/jpeg;base64,TkVX',...field},null),
   /P88_CROP_CANNOT_REBIND_ID_OR_MASK/);
 }
 assert.equal(c.writeCount,0);
 assert.equal(item.image,sampleSource88().image);
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

test('P88 Crop refuses A-to-B switch during awaited photo quality and never writes private source',async()=>{
 let releaseQuality;
 const c=cropHarness88({saved:true,checkPhoto:()=>new Promise(resolve=>{releaseQuality=resolve;})}),
  item=sampleSource88();
 c.cropClothingPhoto(item);
 const pending=c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 c.window.closetAuth.user={id:'owner-B'};
 c.db={name:'closet-current-user-owner-B',transaction(){throw Error('CROSS_OWNER_CROP');}};
 releaseQuality({colorEstimate:null,signature:[],aspect:1});
 await assert.rejects(pending,/P88_STALE_CROP_OWNER_OR_SOURCE/);
 assert.equal(c.written.length,0);
 assert.equal(c.renderCount,0);
 assert.equal(item.image,sampleSource88().image);
});
test('P88 Crop blocks same-ID renewed login after cloud preflight and cannot write old source',async()=>{
 const c=cropHarness88({saved:true}),item=sampleSource88();
 c.cropClothingPhoto(item);
 let enter,release;
 const started=new Promise(r=>{enter=r;});
 c.beforeWrite=()=>{enter();return new Promise(r=>{release=r;});};
 const pending=c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 await started;
 c.window.closetAuth.user={id:'owner-A'};
 release();
 await assert.rejects(pending,/P88_STALE_CROP_OWNER_OR_SOURCE/);
 assert.equal(c.written.length,0);
 assert.equal(item.image,sampleSource88().image);
});
test('P88 Crop keeps a different new draft captured during cloud preflight',async()=>{
 const c=cropHarness88(),item=sampleSource88();
 c.cropClothingPhoto(item);
 let enter,release;
 const started=new Promise(r=>{enter=r;});
 c.beforeWrite=()=>{enter();return new Promise(r=>{release=r;});};
 const pending=c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 await started;
 const other={id:'next-new-photo',image:'data:image/jpeg;base64,TkVYVA=='};
 c.batch.push(other);
 release();await pending;
 assert.equal(c.written.length,1,'one atomic current-owner state write');
 assert.equal(c.written[0].store,'state');
 assert.deepEqual(c.written[0].value.batch.map(x=>x.id),[item.id,other.id]);
 assert.equal(c.written[0].value.batch[0].image,'data:image/jpeg;base64,TkVXUElYRUxT');
 assert.equal(c.written[0].value.batch[1].image,other.image);
 assert.equal(item.image,'data:image/jpeg;base64,TkVXUElYRUxT');
 assert.equal(c.renderCount,1);
});
test('P88 Crop rejects forged target ID and extra physical mask metadata',async()=>{
 const c=cropHarness88({saved:true}),item=sampleSource88();
 c.cropClothingPhoto(item);
 for(const forged of [
  {id:'different-item',image:'data:image/jpeg;base64,TkVXUElYRUxT'},
  {image:'data:image/jpeg;base64,TkVXUElYRUxT',reconciliation70Status:'separate_confirmed'},
  {image:'data:image/jpeg;base64,TkVXUElYRUxT',ownerSourceReview88:{ownerReviewed:true}}
 ]){
  await assert.rejects(c.editor.save(forged,null),/P88_CROP_CANNOT_REBIND_ID_OR_MASK/);
 }
 assert.equal(c.written.length,0);
 assert.equal(item.image,sampleSource88().image);
});
test('P88 Crop analysis is denied on revoked signed owner after classifier await',async()=>{
 const c=cropHarness88({saved:true}),item=sampleSource88();
 c.cropClothingPhoto(item);
 let done;
 c.localRequest=()=>new Promise(resolve=>{done=resolve;});
 const pending=c.editor.analyze('data:image/jpeg;base64,QU5BTFlTSVM=');
 c.window.closetAuth.user={id:'owner-B'};
 done({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]});
 await assert.rejects(pending,/P88_STALE_CROP_OWNER_OR_SOURCE/);
 assert.equal(c.written.length,0);
});
test('P88 Crop denied when segmentation receipt arrives while cloud preflight is queued',async()=>{
 const c=cropHarness88({saved:true}),item=sampleSource88();
 c.cropClothingPhoto(item);
 let enter,release;const started=new Promise(resolve=>{enter=resolve;});
 c.beforeWrite=()=>{enter();return new Promise(resolve=>{release=resolve;});};
 const pending=c.editor.save({image:'data:image/jpeg;base64,TkVXUElYRUxT'},null);
 await started;
 item.segmentHint={componentReviewStatus:'owner_must_confirm_garment_units'};
 release();
 await assert.rejects(pending,/P88_STALE_CROP_OWNER_OR_SOURCE/);
 assert.equal(c.written.length,0);
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
test('P88 default outfit workflow shows missing-category caution without enabling experimental instance splitting',()=>{
 const h=captureHarness({href:'https://example.test/closet'});
 assert.equal(h.c.worker.request.instanceReview840,undefined,
  'informational notice must not change worker inference flags');
 h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,UElFQ0U=',
  hint:{categories:['Tops'],types:[],clipped:false},
  instanceMethod:'native_semantic_group'
 }});
 h.emit({type:'done',count:1});
 assert.match(h.node('outfitSplitStatus').textContent,
  /1 tentative clothing regions cropped, not a verified garment count/);
 assert.match(h.node('outfitSplitStatus').textContent,
  /watches, belts, headwear, bags or glasses/);
 assert.match(h.node('outfitSaveStatus').textContent,
  /Compare these tentative regions with your original outfit photo/);
 assert.match(h.node('outfitSaveStatus').textContent,/Photograph missing items individually/);
 assert.equal(h.c.batch.length,1,'recognized drafts are still preserved');
 assert.equal(h.c.items.length,0,'informational notice grants no save authority');
});
test('P88 default zero-region scan warns that a missing model detection is not an empty wardrobe',()=>{
 const h=captureHarness({href:'https://example.test/closet'});
 h.emit({type:'done',count:0});
 assert.equal(h.c.worker.request.instanceReview840,undefined);
 assert.match(h.node('outfitSplitStatus').textContent,/No clothing regions confidently located/);
 assert.match(h.node('outfitSplitStatus').textContent,/not proof your outfit is empty/);
 assert.match(h.node('outfitSplitStatus').textContent,/Photograph missing items individually/);
 assert.equal(h.c.items.length,0);
 assert.equal(h.c.batch.length,0);
});


test('P88 default nonexperimental outfit worker rejects a replaced owner ID before admitting any garment',()=>{
 const h=captureHarness({ownerId:'owner-A',href:'https://example.test/closet'});
 assert.equal(h.c.worker.request.instanceReview840,undefined);
 const original=h.c.worker;
 h.c.window.closetAuth.user={id:'owner-B'};
 h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,UElFQ0U=',
  hint:{categories:['Tops'],types:[],clipped:false},
  instanceMethod:'native_semantic_group'
 }});
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,0);
 assert.equal(original.closed,true);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'');
 assert.match(h.node('outfitSplitStatus').textContent,/Owner session changed/);
});
test('P88 default worker refuses different signed reference with same textual owner ID',()=>{
 const h=captureHarness({ownerId:'owner-A',href:'https://example.test/closet'}),original=h.c.worker;
 h.c.window.closetAuth.user={id:'owner-A'};
 h.emit({type:'piece',piece:{
  image:'data:image/jpeg;base64,UElFQ0U=',
  hint:{categories:['Tops'],types:[],clipped:false}
 }});
 assert.equal(h.c.batch.length,0);
 assert.equal(original.closed,true);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'');
});
test('P88 default upload decode does not transfer old-owner JPEG across a late sign-in',async()=>{
 let unblock;
 const pending=new Promise(resolve=>{unblock=resolve;});
 const h=captureHarness({autoStart:false,href:'https://example.test/closet',
  decode:()=>pending});
 const upload=h.c.readOutfitPhoto({size:420,type:'image/jpeg',name:'upload.jpg'});
 h.c.window={closetAuth:{user:{id:'owner-B'}}};
 unblock('data:image/jpeg;base64,T0xELU9XTkVSLVBIT1RP');
 await upload;
 assert.equal(h.c.worker,undefined);
 assert.equal(h.c.batch.length,0);
 assert.match(h.node('outfitSplitStatus').textContent,/session changed while opening this photo/);
});
test('P88 default signed owner retry may not replay previous same-ID session photo',()=>{
 const h=captureHarness({ownerId:'owner-A',href:'https://example.test/closet'});
 const first=h.c.worker;
 h.emit({type:'error'});
 h.c.window.closetAuth.user={id:'owner-A'};
 h.node('outfitRetry').onclick();
 assert.equal(h.c.worker,first);
 assert.equal(vm.runInContext('lastOutfitPhoto',h.c),'');
 assert.match(h.node('outfitSplitStatus').textContent,/previous photo belongs to another signed session/);
});
test('P88 default unchanged original owner can retry after worker error without auto saving',()=>{
 const h=captureHarness({ownerId:'owner-A',href:'https://example.test/closet'});
 const first=h.c.worker;
 h.emit({type:'error'});
 h.node('outfitRetry').onclick();
 assert.notEqual(h.c.worker,first);
 assert.equal(h.c.worker.request.image,'data:image/jpeg;base64,ORIGINAL');
 assert.equal(h.c.worker.request.instanceReview840,undefined);
 assert.equal(h.c.batch.length,0);
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
 assert.deepEqual(Array.from(c.batch,x=>x.reconciliation70Status),
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
 const secondJpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,8,255,217]).toString('base64');
 const hash=createHash('sha256').update(Buffer.from([255,216,255,225,7,255,217])).digest('hex');
 const user={id:'owner-a'},writes=[],rows=new Map();
 let persistedDraft=null,aborted=false;
 const db={
  name:'closet-current-user-owner-a',
  transaction(stores,mode){
   assert.deepEqual([...stores],['items','state']);
   assert.equal(mode,'readwrite');
   aborted=false;
   const tx={oncomplete:null,onabort:null,onerror:null,
    abort(){aborted=true;queueMicrotask(()=>tx.onabort?.());},
    objectStore(name){
     if(name==='items')return {
      getAll(){const req={result:[...rows.values()].map(x=>structuredClone(x))};
       queueMicrotask(()=>req.onsuccess?.());return req;},
      add(value){
       if(rows.has(value.id))throw Error('ConstraintError: saved item ID exists');
       writes.push({name,method:'add',value:structuredClone(value)});
       rows.set(value.id,structuredClone(value));
      }
     };
     assert.equal(name,'state');
     return {
      get(id){
       assert.equal(id,'draft');
       const req={result:persistedDraft?structuredClone(persistedDraft):undefined};
       queueMicrotask(()=>req.onsuccess?.());
       return req;
      },
      put(value){
       writes.push({name,method:'put',value:structuredClone(value)});
       persistedDraft=structuredClone(value);
       queueMicrotask(()=>{if(!aborted)tx.oncomplete?.();});
      }
     };
    }
   };
   return tx;
  }
 };
 const receipt={ownerId:user.id,sourceSha256:hash,maskSha256:'a'.repeat(64)};
 const item={id:'source-88',outfitSourceId:'photo-88',image:jpeg,
  originalPhoto:{image:jpeg},recognitionPhoto:{image:jpeg},
  reconciliation70:receipt,reconciliation70Status:'separate_confirmed'};
 persistedDraft={id:'draft',batch:[structuredClone(item)]};
 const c={window:{closetAuth:{user}},db,items:[],batch:[item],
  draftStoreRevision88:JSON.stringify(persistedDraft.batch),crypto:{
  subtle:{digest:async(_,bytes)=>Uint8Array.from(createHash('sha256').update(Buffer.from(bytes)).digest()).buffer}
 },atob:s=>Buffer.from(s,'base64').toString('binary'),
  Uint8Array,structuredClone,Promise,
  unit70OwnerEvidenceValid:i=>i.reconciliation70?.ownerId===c.window.closetAuth.user?.id&&
   (i.reconciliation70Status!=='paired_confirmed'||i.category==='Shoes'),
  queued:async fn=>{await c.beforeWrite?.();return fn();}
 };
 vm.createContext(c);
 const receiptsStart=appSource.indexOf('function unit70Receipts(');
 const receiptsEnd=appSource.indexOf('function unit70OwnerEvidenceValid(',receiptsStart);
 assert.ok(receiptsStart>=0&&receiptsEnd>receiptsStart);
 vm.runInContext(appSource.slice(receiptsStart,receiptsEnd),c);
 vm.runInContext(appSource.slice(start,end),c);
 return {c,user,db,item,jpeg,secondJpeg,hash,writes,rows,
  readStored:()=>structuredClone(persistedDraft),
  updateStored:v=>{persistedDraft=structuredClone(v);}};
}
// Reproduce the REAL native Adjust owner's physical-unit receipt for positive
// private-save fixtures. Do not bypass the new fail-closed receipt at the DB
// boundary; negative cases still test source/owner revocation independently.
function reviewedForSave88(c,value,lease){
 return {...value,ownerSourceReview88:c.reviewedSourceReceipt88(value,lease)};
}
test('P88 owner source lease independently hashes original JPEG before atomic private save',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await c.saveSourceBoundPiece88(reviewedForSave88(c,{...item},lease),[],lease);
 assert.deepEqual(writes.map(x=>x.name),['items','state']);
 assert.equal(writes[0].value.originalPhoto.image,item.originalPhoto.image);
 assert.equal(writes[0].value.ownerSourceReview88.schema,'p88-owner-source-review/v1');
 assert.equal(writes[0].value.ownerSourceReview88.ownerReviewed,true);
 assert.equal(writes[0].value.ownerSourceReview88.originalPhotoSha256,
  item.reconciliation70.sourceSha256);
 assert.equal(writes[0].value.ownerSourceReview88.derivedImageSha256,
  createHash('sha256').update(Buffer.from(item.image.split(',')[1],'base64')).digest('hex'));
 assert.equal(writes[0].value.ownerSourceReview88.derivedImageBytesVerified,true);
 assert.equal(writes[0].value.ownerSourceReview88.rawMaskPixelsIndependentlyVerified,false);
 assert.equal(writes[0].value.ownerSourceReview88.singleGarmentVerified,false);
 assert.equal(writes[0].value.ownerSourceReview88.threeDReady,false);
 assert.equal(writes[1].value.batch.length,0);
});
test('P88 source-bound garment create is insert-only and cannot replace saved same-ID wardrobe item',async()=>{
 const h=sourceSaveHarness88(),lease=h.c.sourceSaveLease88(h.item);
 assert.equal(await h.c.sourceSavePhotoVerified88(lease),true);
 const existing={id:h.item.id,image:'data:image/jpeg;base64,T0xE',category:'Outerwear'};
 h.rows.set(existing.id,structuredClone(existing));
 const prior=h.readStored();
 await assert.rejects(
  h.c.saveSourceBoundPiece88(reviewedForSave88(h.c,{...h.item},lease),[],lease),
  /ConstraintError/
 );
 assert.equal(h.writes.length,0,'colliding source photo never changes items or state');
 assert.deepEqual(h.rows.get(existing.id),existing);
 assert.deepEqual(h.readStored(),prior,'original unsaved photo retained');
});
test('P88 source-bound reviewed item cannot erase a different tab source photo from private drafts',async()=>{
 const h=sourceSaveHarness88(),lease=h.c.sourceSaveLease88(h.item);
 assert.equal(await h.c.sourceSavePhotoVerified88(lease),true);
 const other={id:'second-original',image:'data:image/jpeg;base64,U0VDT05E'};
 h.updateStored({id:'draft',batch:[structuredClone(h.item),other]});
 const reviewed=reviewedForSave88(h.c,{...h.item},lease);
 await assert.rejects(h.c.saveSourceBoundPiece88(reviewed,[],lease),
  /P88_SOURCE_DRAFT_STORAGE_CHANGED/);
 assert.equal(h.writes.length,0);
 assert.deepEqual(h.readStored().batch[1],other);
 assert.equal(h.rows.has(h.item.id),false);
});
test('P88 source-bound signed owner with reconciled latest draft revision saves only reviewed source',async()=>{
 const h=sourceSaveHarness88(),other={id:'other',image:h.secondJpeg};
 h.c.batch.push(other);
 h.updateStored({id:'draft',batch:structuredClone(h.c.batch)});
 h.c.draftStoreRevision88=JSON.stringify(h.c.batch);
 const lease=h.c.sourceSaveLease88(h.item);
 assert.equal(await h.c.sourceSavePhotoVerified88(lease),true);
 await h.c.saveSourceBoundPiece88(reviewedForSave88(h.c,{...h.item},lease),[],lease);
 assert.deepEqual(h.writes.map(x=>x.method),['add','put']);
 assert.deepEqual(h.readStored().batch,[other]);
 assert.equal(h.rows.has(h.item.id),true);
});

test('P88 private source save rejects an absent or tampered owner review receipt',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await assert.rejects(c.saveSourceBoundPiece88({...item},[],lease),
  /P88_REVOKED_SOURCE_SAVE/);
 const reviewed=reviewedForSave88(c,structuredClone(item),lease);
 reviewed.ownerSourceReview88.color='unapproved-change';
 await assert.rejects(c.saveSourceBoundPiece88(reviewed,[],lease),
  /P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0,'unreviewed or forged provenance never enters private DB');
});
test('P88 forged saved-crop digest cannot be admitted as approved physical source',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const value=reviewedForSave88(c,structuredClone(item),lease);
 value.ownerSourceReview88.derivedImageSha256='f'.repeat(64);
 await assert.rejects(c.saveSourceBoundPiece88(value,[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});
test('P88 malformed crop cannot be cryptographically bound despite valid original photo',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 item.image='data:image/jpeg;base64,Tk9UIEpQRUc=';
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),false);
 assert.equal(writes.length,0);
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
 await assert.rejects(c.saveSourceBoundPiece88(reviewedForSave88(c,{...item},lease),[],lease),/P88_STALE_SOURCE_OWNER/);
 assert.equal(writes.length,0);
});
test('P88 queued cloud preflight rechecks signed owner and actual IDB handle before transaction',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 c.beforeWrite=async()=>{c.db={name:'closet-current-user-owner-a'};};
 await assert.rejects(c.saveSourceBoundPiece88(reviewedForSave88(c,{...item},lease),[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});
test('P88 changed original JPEG or mask receipt cannot use earlier owner photo proof',async()=>{
 const {c,item,writes,jpeg}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 item.originalPhoto={image:jpeg+'A'};
 assert.equal(await c.sourceSavePhotoVerified88(lease),false);
 item.originalPhoto={image:jpeg};
 item.reconciliation70={...item.reconciliation70,maskSha256:'b'.repeat(64)};
 await assert.rejects(c.saveSourceBoundPiece88(reviewedForSave88(c,{...item},lease),[],lease),/P88_STALE_SOURCE_OWNER/);
 assert.equal(writes.length,0);
});

test('P88 source private-save refuses switched item IDs, crop and unapproved 3D flags',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 for(const change of [
  x=>{x.id='other-item';},
  x=>{x.cropBounds={x:0,y:0,width:0.5,height:1};},
  x=>{x.segmentHint={verified:true};},
  x=>{x.recognitionPhoto={image:'data:image/jpeg;base64,Rk9SR0VE'};},
  x=>{x.singleGarmentVerified=true;},
  x=>{x.threeDReady=true;},
  x=>{x.independentPhysicalItemVerified=true;},
  x=>{x.segmentHint={ownerReviewedInstance:true};}
 ]){
  const value=reviewedForSave88(c,structuredClone(item),lease);
  change(value);
  await assert.rejects(c.saveSourceBoundPiece88(value,[],lease),/P88_REVOKED_SOURCE_SAVE/);
 }
 assert.equal(writes.length,0,'forged source/3D status cannot enter private wardrobe');
});
test('P88 queued source save refuses in-place mutated model mask receipt metadata',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const value=reviewedForSave88(c,structuredClone(item),lease);
 c.beforeWrite=async()=>{item.reconciliation70.instanceOrdinal=99;};
 await assert.rejects(c.saveSourceBoundPiece88(value,[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});
test('P88 cryptographic original JPEG proof refuses mislabeled non-JPEG bytes',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 const raw=Buffer.from('NOT A JPEG');
 item.originalPhoto.image='data:image/jpeg;base64,'+raw.toString('base64');
 item.reconciliation70.sourceSha256=createHash('sha256').update(raw).digest('hex');
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),false);
 assert.equal(writes.length,0);
});
test('P88 owner-approved shoe category permits paired save, but pre-edit category cannot falsely veto it',async()=>{
 const {c,item,writes,secondJpeg}=sourceSaveHarness88();
 item.category='Uncategorized';
 item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true,companion:{image:secondJpeg,reconciliation70:{
  ownerId:'owner-a',sourceSha256:item.reconciliation70.sourceSha256,maskSha256:'b'.repeat(64)}}};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await c.saveSourceBoundPiece88(reviewedForSave88(c,{...item,category:'Shoes'},lease),[],lease);
 assert.deepEqual(writes.map(x=>x.name),['items','state']);
 const proof=writes[0].value.ownerSourceReview88;
 assert.equal(proof.companionImageSha256,
  createHash('sha256').update(Buffer.from(secondJpeg.split(',')[1],'base64')).digest('hex'));
 assert.equal(proof.companionImageBytesVerified,true);
 assert.equal(proof.rawMaskPixelsIndependentlyVerified,false);
});
test('P88 malformed paired companion image is refused before private save',async()=>{
 const {c,item,writes,secondJpeg}=sourceSaveHarness88();
 item.category='Shoes';item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true,companion:{image:secondJpeg,reconciliation70:{
  ownerId:'owner-a',sourceSha256:item.reconciliation70.sourceSha256,maskSha256:'b'.repeat(64)}}};
 const lease=c.sourceSaveLease88(item);
 item.shoePair.companion.image='data:image/jpeg;base64,Tk9UIEpQRUc=';
 assert.equal(await c.sourceSavePhotoVerified88(lease),false);
 item.shoePair.companion.image=secondJpeg;
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const val=reviewedForSave88(c,structuredClone(item),lease);
 val.ownerSourceReview88.companionImageSha256='0'.repeat(64);
 await assert.rejects(c.saveSourceBoundPiece88(val,[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});
test('P88 companion crop replaced during queued private preflight revokes entire pair',async()=>{
 const {c,item,writes,secondJpeg,jpeg}=sourceSaveHarness88();
 item.category='Shoes';item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true,companion:{image:secondJpeg,reconciliation70:{
  ownerId:'owner-a',sourceSha256:item.reconciliation70.sourceSha256,maskSha256:'b'.repeat(64)}}};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const val=reviewedForSave88(c,structuredClone(item),lease);
 c.beforeWrite=async()=>{item.shoePair.companion.image=jpeg;};
 await assert.rejects(c.saveSourceBoundPiece88(val,[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});
test('P88 paired physical unit refuses mismatched owner category at private write',async()=>{
 const {c,item,writes}=sourceSaveHarness88();
 item.category='Uncategorized';
 item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 await assert.rejects(c.saveSourceBoundPiece88(reviewedForSave88(c,{...item,category:'Tops'},lease),[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0);
});


test('P88 nested companion mask edited in place during cloud preflight revokes shoe save',async()=>{
 const {c,item,writes,secondJpeg}=sourceSaveHarness88();
 item.category='Shoes';item.reconciliation70Status='paired_confirmed';
 item.shoePair={confirmedByOwner:true,componentIds:['left','right'],
  companion:{image:secondJpeg,
   reconciliation70:{ownerId:'owner-a',sourceSha256:item.reconciliation70.sourceSha256,
    maskSha256:'b'.repeat(64)}}};
 const lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const approved=structuredClone(item);
 c.beforeWrite=async()=>{
  // The pair object reference remains identical, as does the main source mask.
  item.shoePair.companion.reconciliation70.maskSha256='c'.repeat(64);
 };
 await assert.rejects(c.saveSourceBoundPiece88(reviewedForSave88(c,approved,lease),[],lease),/P88_REVOKED_SOURCE_SAVE/);
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
 await assert.rejects(c.saveSourceBoundPiece88(reviewedForSave88(c,structuredClone(item),lease),[],lease),/P88_REVOKED_SOURCE_SAVE/);
 assert.equal(writes.length,0,'same original mask can enter closet only once');
});

test('P88 queued original save preserves unrelated new photo draft added during cloud preflight',async()=>{
 const {c,item,writes}=sourceSaveHarness88(),lease=c.sourceSaveLease88(item);
 assert.equal(await c.sourceSavePhotoVerified88(lease),true);
 const second={id:'independent-new-photo',image:'data:image/jpeg;base64,SU5ERVBFTkRFTlQ='};
 c.beforeWrite=async()=>c.batch.push(second);
 await c.saveSourceBoundPiece88(reviewedForSave88(c,structuredClone(item),lease),[],lease);
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
 assert.deepEqual(Array.from(c.storageWrites[0].batch,x=>x.id),['part-A','new-photo']);
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
 assert.deepEqual(Array.from(c.batch,x=>x.id),['part-A','new-photo']);
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


test("P88 queued P70 owner decision refuses another signed owner\'s newly appended source photo",async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const h=unitDecisionHarness88({queueBeforeWrite:gate}),c=h.c;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 assert.equal(c.batch[0].reconciliation70Status,'separate_confirmed');
 const foreign=h.ownerDraft('foreign-owner-late-photo','source-B','owner-B');
 c.batch.push(foreign);
 release();await pending;
 assert.equal(c.storageWrites.length,0,
  'owner-A private IndexedDB must not receive an owner-B garment receipt');
 assert.equal(c.batch.find(x=>x.id==='part-A').reconciliation70Status,'unresolved',
  'uncommitted owner decision must be rolled back');
 assert.match(c.outfitUnit70Error,/Owner or source garment changed before draft persistence/);
 assert.equal(c.renderCalls,0,'invalid foreign owner batch never passes signed action');
 assert.equal(c.batch.some(x=>x.id==='foreign-owner-late-photo'),false,
  "foreign owner photo must not remain in current owner review draft after veto");
});

test('P88 queued P70 decision refuses malformed same-source mask appended after preflight starts',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const h=unitDecisionHarness88({queueBeforeWrite:gate}),c=h.c;
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 const altered=h.ownerDraft('late-mask','src-A','owner-A');
 altered.reconciliation70.maskSha256='NOT-SHA256';
 c.batch.push(altered);
 release();await pending;
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.batch.find(x=>x.id==='part-A').reconciliation70Status,'unresolved');
 assert.equal(c.batch.some(x=>x.id==='late-mask'),false,
  'corrupt late-source receipt must not survive a failed owner decision');
 assert.match(c.outfitUnit70Error,/Owner or source garment changed before draft persistence/);
});


test('P88 queued owner keep refuses paired companion mask edited in place',async()=>{
 const h=unitDecisionHarness88(),c=h.c;
 await makeConfirmedPair88(h);
 assert.equal(c.batch[0].shoePair?.confirmedByOwner,true);
 const originalWrites=c.storageWrites.length;
 c.batch.push(h.ownerDraft('part-C'));
 let release;c.queueGate=new Promise(resolve=>{release=resolve;});
 const pending=vm.runInContext("updateUnit70('keep',['part-C'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 const first=c.batch.find(x=>x.id==='part-A');
 assert.equal(first.shoePair?.confirmedByOwner,true);
 first.shoePair.companion.reconciliation70.maskSha256='f'.repeat(64);
 release();await pending;
 assert.equal(c.storageWrites.length,originalWrites,
  'changing companion mask of another confirmed pair forbids an unrelated queued write');
 assert.equal(c.batch.find(x=>x.id==='part-C').reconciliation70Status,'unresolved');
 assert.match(c.outfitUnit70Error,/Owner or source garment changed before draft persistence/);
});

test('P88 queued owner decision refuses modified original JPEG while preflight waits',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const h=unitDecisionHarness88({queueBeforeWrite:gate}),c=h.c;
 c.batch[0].originalPhoto={image:'data:image/jpeg;base64,T1JJR0lOQUw='};
 const pending=vm.runInContext("updateUnit70('keep',['part-A'])",c);
 for(let n=0;n<12;n++)await Promise.resolve();
 c.batch[0].originalPhoto.image='data:image/jpeg;base64,TU9ESUZJRUQ=';
 release();await pending;
 assert.equal(c.storageWrites.length,0);
 assert.equal(c.batch.find(x=>x.id==='part-A').reconciliation70Status,'unresolved');
 assert.match(c.outfitUnit70Error,/Owner or source garment changed before draft persistence/);
});


// Real app.js backup function, not a duplicate fake helper. The queue
// is held across simulated cloud preflight and source/camera revision.
function privateDraftBackupHarness88(){
 const start=appSource.indexOf('function persistDraft(){');
 const end=appSource.indexOf('function readDraft()',start);
 assert.ok(start>=0&&end>start,'native signed-owner persistDraft found');
 const writes=[],alerts=[],user={id:'owner-A'},state={
  window:{closetAuth:{user}},db:null,batch:[],structuredClone,
  draftStoreRevision88:'null',message:msg=>alerts.push(msg)
 };
 let stored=null;
 const idb={name:'closet-current-user-owner-A',transaction(store,mode){
  assert.equal(store,'state');assert.equal(mode,'readwrite');
  let aborted=false;
  const tx={objectStore(name){
   assert.equal(name,'state');
   return {
    get(id){
     assert.equal(id,'draft');
     const req={result:stored?structuredClone(stored):undefined};
     queueMicrotask(()=>{
      req.onsuccess?.();
      if(!aborted)queueMicrotask(()=>tx.oncomplete?.());
     });
     return req;
    },
    put(v){writes.push(structuredClone(v));stored=structuredClone(v);}
   };
  },abort(){
   aborted=true;
   queueMicrotask(()=>tx.onabort?.());
  }};
  return tx;
 }};
 state.db=idb;
 let waiting=null;
 state.queued=async fn=>{
  if(waiting)await waiting;
  return fn();
 };
 vm.createContext(state);
 vm.runInContext(appSource.slice(start,end),state);
 const pause=()=>{let release,entered;
  const started=new Promise(resolve=>{entered=resolve;});
  waiting=new Promise(resolve=>{release=resolve;entered();});
  return {started,release:()=>{waiting=null;release();}};
 };
 return {state,user,idb,writes,alerts,pause,
  getStored:()=>structuredClone(stored),
  changeStored:change=>{stored=change?structuredClone(change):null;}};
}
test('P88 queued private backup must not persist prior-owner photo to account B',async()=>{
 const h=privateDraftBackupHarness88();
 h.state.batch=[{id:'only-owner-A',image:'data:image/jpeg;base64,QUFB'}];
 const gate=h.pause();
 const pending=h.state.persistDraft();await gate.started;
 h.state.window.closetAuth.user={id:'owner-B'};
 h.state.db={name:'closet-current-user-owner-B',transaction(){throw Error('FOREIGN_OWNER_BACKUP');}};
 h.state.batch=[{id:'only-owner-B',image:'data:image/jpeg;base64,QkJC'}];
 gate.release();await pending;
 assert.equal(h.writes.length,0,'no photo or metadata from A written to B');
 assert.equal(h.alerts.length,0,'old owner backup does not show warning in B account');
});
test('P88 queued private backup also rejects same-ID renewed login and same-ID new IDB',async()=>{
 for(const change of ['renew-login','replace-db']){
  const h=privateDraftBackupHarness88();
  h.state.batch=[{id:'owner-A-original',image:'data:image/jpeg;base64,QUFB'}];
  const gate=h.pause(),pending=h.state.persistDraft();await gate.started;
  if(change==='renew-login')h.state.window.closetAuth.user={id:'owner-A'};
  else h.state.db={name:'closet-current-user-owner-A',transaction(){throw Error('STALE_IDB');}};
  gate.release();await pending;
  assert.equal(h.writes.length,0,'replaced private session never receives stale draft');
  assert.equal(h.alerts.length,0);
 }
});
test('P88 queued private backup commits exact newest same-owner capture and edit, not stale frozen batch',async()=>{
 const h=privateDraftBackupHarness88();
 const original={id:'first',image:'data:image/jpeg;base64,T0xE'};
 h.state.batch=[original];
 const gate=h.pause(),pending=h.state.persistDraft();await gate.started;
 original.image='data:image/jpeg;base64,TkVX';
 h.state.batch.push({id:'second',image:'data:image/jpeg;base64,U0VDT05E'});
 gate.release();await pending;
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].id,'draft');
 assert.deepEqual(h.writes[0].batch.map(x=>x.id),['first','second']);
 assert.equal(h.writes[0].batch[0].image,'data:image/jpeg;base64,TkVX');
 assert.equal(h.writes[0].batch[1].image,'data:image/jpeg;base64,U0VDT05E');
});
test('P88 queued private backup honors an owner-approved removal while queued',async()=>{
 const h=privateDraftBackupHarness88();
 h.state.batch=[{id:'confirmed-and-removed',image:'data:image/jpeg;base64,T0xE'}];
 const gate=h.pause(),pending=h.state.persistDraft();await gate.started;
 h.state.batch=[];
 gate.release();await pending;
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].batch.length,0,'removed photo cannot return after slow queued backup');
});
test('P88 other tab adding an unfinished original cannot be overwritten by stale draft backup',async()=>{
 const h=privateDraftBackupHarness88();
 const mine={id:'photo-A',image:'data:image/jpeg;base64,QUFB'};
 const theirs={id:'photo-B',image:'data:image/jpeg;base64,QkJC'};
 h.state.batch=[mine];
 const first=await h.state.persistDraft();
 assert.equal(first,undefined);
 const original=structuredClone(h.getStored());
 // Another browser tab appends a private original after this tab read its old revision.
 h.changeStored({id:'draft',batch:[mine,theirs]});
 h.state.batch=[{...mine,color:'Blue'}];
 await h.state.persistDraft();
 assert.deepEqual(h.getStored().batch,[mine,theirs],
  'current tab cannot silently destroy the other tab original photo');
 assert.equal(h.writes.length,1,'no second state.put after storage revision mismatch');
 assert.ok(h.alerts.some(s=>s.includes('could not be backed up')),
  'owner should be warned the current draft backup was blocked');
 assert.notDeepEqual(h.getStored(),original);
});
test('P88 other tab correcting or removing a photo blocks stale draft backup',async()=>{
 for(const changed of [
  [{id:'same-id',image:'data:image/jpeg;base64,TkVX'}],
  []
 ]){
  const h=privateDraftBackupHarness88();
  const original={id:'same-id',image:'data:image/jpeg;base64,T0xE'};
  h.state.batch=[original];await h.state.persistDraft();
  h.changeStored({id:'draft',batch:changed});
  h.state.batch=[{...original,color:'Red'}];
  await h.state.persistDraft();
  assert.deepEqual(h.getStored().batch,changed);
  assert.equal(h.writes.length,1);
 }
});

// Execute the actual native camera candidate source. The test simulates
// already-saved ORIGINAL JPEG bytes, not any model acceptance/accuracy metric.
function exactSavedPhotoCaptureHarness88({reviewFirst=true}={}){
 const start=appSource.indexOf('function candidate(image,options={})');
 const end=appSource.indexOf('function queueAutomatic(',start);
 assert.ok(start>=0&&end>start,'P88 actual native photo capture function found');
 let count=0,backups=0,scans=0;
 const c={items:[],batch:[],structuredClone,session:0,sessionCapturedIds:new Set(),
  reviewFirst836:reviewFirst,crypto:{randomUUID:()=>String(++count)},
  normalizeClothing:x=>structuredClone(x),records:[],
  $:id=>{if(!c.views[id])c.views[id]={};return c.views[id];},
  views:{},recordDeviceEvent:e=>c.records.push(e),message:s=>{c.status=s;},
  persistDraft:()=>{backups++;},queueAutomatic:()=>{scans++;}};
 vm.createContext(c);vm.runInContext(appSource.slice(start,end),c);
 return {c,get backups(){return backups;},get scans(){return scans;}};
}
test('P88 a repeated *saved* original stays unsaved for physical-item owner review, not silently discarded',()=>{
 const h=exactSavedPhotoCaptureHarness88();
 const original={id:'saved-A',image:'data:image/jpeg;base64,UEhPVE8=',category:'Tops',itemType:'T-shirt'};
 h.c.items=[original];
 assert.equal(h.c.candidate(original.image),true);
 assert.equal(h.c.items.length,1,'existing wardrobe must never be overwritten');
 assert.equal(h.c.batch.length,1,'owner receives another unsaved draft');
 const pending=h.c.batch[0];
 assert.equal(pending.image,original.image,'original photo bytes are retained');
 assert.equal(pending.requiresOwnershipConfirmation,true);
 assert.equal(pending.possibleDuplicate,true);
 assert.equal(pending.localAnalyzed,true);
 assert.equal(pending.category,'Uncategorized','no unsupported garment type guess');
 assert.match(pending.localStatus,/Original kept unsaved for owner comparison/);
 assert.equal(h.scans,0,'identical original does not cause speculative re-inference');
 assert.equal(h.backups,1);
 assert.deepEqual(h.c.records,['exact_saved_photo_retained_for_review']);
});
test('P88 duplicate frames already awaiting review are coalesced with clear recapture instructions',()=>{
 const h=exactSavedPhotoCaptureHarness88(),image='data:image/jpeg;base64,SEVMTE8=';
 assert.equal(h.c.candidate(image),true);
 assert.equal(h.c.candidate(image),false);
 assert.equal(h.c.batch.length,1);
 assert.equal(h.scans,1,'the existing scan remains, do not spawn duplicate model jobs');
 assert.equal(h.backups,1);
 assert.match(h.c.status,/already waiting in Photo results/);
 assert.match(h.c.status,/different physical garment/);
});
test('P88 new different photo still enters the existing scanner without model or taxonomy modification',()=>{
 const h=exactSavedPhotoCaptureHarness88();
 h.c.items=[{id:'other',image:'data:image/jpeg;base64,T0xE'}];
 assert.equal(h.c.candidate('data:image/jpeg;base64,TkVX'),true);
 assert.equal(h.c.batch.length,1);
 assert.equal(h.scans,1);
 assert.equal(h.c.batch[0].requiresOwnershipConfirmation,undefined);
 assert.equal(h.c.batch[0].possibleDuplicate,undefined);
});
test('P88 legacy non-review indexing source policy still skips an exact saved JPEG',()=>{
 const h=exactSavedPhotoCaptureHarness88({reviewFirst:false});
 h.c.items=[{id:'saved',image:'data:image/jpeg;base64,QUJD'}];
 assert.equal(h.c.candidate('data:image/jpeg;base64,QUJD'),false);
 assert.equal(h.c.batch.length,0);
 assert.equal(h.backups,0);
 assert.equal(h.scans,0);
});
// Execute the actual source queue/owner/identical-photo review helpers.
// Synthetic photo bytes do NOT establish two physical garments; only a
// deliberate owner attestation permits the second unsaved draft to be saved.
function exactDuplicateOwnerSaveHarness88(){
 const saveBegin=appSource.indexOf('function savePiece('),saveEnd=appSource.indexOf('function node(',saveBegin);
 const helpers=appSource.indexOf('function reviewedExactPhotoPeers88('),end=appSource.indexOf('function empty(',helpers);
 assert.ok(saveBegin>=0&&saveEnd>saveBegin&&helpers>saveEnd&&end>helpers);
 const records=[],user={id:'owner-A'};
 const ownerDb={name:'closet-current-user-owner-A',transaction(){
  const tx={objectStore(store){
   return {getAll(){assert.equal(store,'items');const req={result:[structuredClone(existing)]};queueMicrotask(()=>req.onsuccess?.());return req;},get(key){assert.equal(key,'draft');const req={result:{id:'draft',batch:[structuredClone(current)]}};queueMicrotask(()=>req.onsuccess?.());return req;},add(value){records.push({store,value:structuredClone(value)});},put(value){records.push({store,value:structuredClone(value)});if(store==='state')queueMicrotask(()=>tx.oncomplete?.());}};
  }};
  return tx;
 }};
 const photo='data:image/jpeg;base64,UEhPVE8=',existing={id:'already-owned',image:photo,category:'Tops'},
  current={id:'new-capture',image:photo,category:'Tops',itemType:'T-shirt',color:'Blue',
   exactSavedPhotoMatch88:{savedItemId:existing.id}};
 const c={window:{closetAuth:{user}},items:[existing],batch:[current],db:ownerDb,
  structuredClone,draftStoreRevision88:JSON.stringify([current]),queued:async fn=>{await c.beforeWrite?.();return fn();}};
 vm.createContext(c);
 vm.runInContext(appSource.slice(saveBegin,saveEnd)+appSource.slice(helpers,end),c);
 const lease=c.reviewedSaveLease88(current);
 return {c,ownerDb,user,existing,current,lease,records,
  value:()=>structuredClone(current),
  reviewed:()=>({...structuredClone(current),ownerDuplicateReview88:c.reviewedDistinctPhotoReceipt88(lease)})};
}
test('P88 identical saved photo cannot be admitted by category/color review alone',async()=>{
 const h=exactDuplicateOwnerSaveHarness88();
 assert.equal(h.lease.exactPhotoPeers88.length,1);
 assert.equal(h.c.reviewedDistinctPhotoReceiptValid88(h.value(),h.lease),false);
 await assert.rejects(h.c.savePiece(h.value(),[],h.lease),/P88_DISTINCT_OWNER_DECISION_REQUIRED/);
 assert.equal(h.records.length,0);
});
test('P88 explicit distinct-photo owner attestation stores only reviewed metadata, not physical or 3D certification',async()=>{
 const h=exactDuplicateOwnerSaveHarness88(),v=h.reviewed();
 assert.equal(h.c.reviewedDistinctPhotoReceiptValid88(v,h.lease),true);
 await h.c.savePiece(v,[],h.lease);
 assert.deepEqual(h.records.map(x=>x.store),['items','state']);
 assert.equal(h.records[0].value.id,'new-capture');
 assert.equal(h.records[0].value.image,h.existing.image);
 assert.equal(h.records[0].value.ownerDuplicateReview88.schema,'p88-distinct-physical-owner-attestation/v1');
 assert.deepEqual(h.records[0].value.ownerDuplicateReview88.identicalSavedPhotoItemIds,['already-owned']);
 assert.equal(h.records[0].value.ownerDuplicateReview88.ownerAttestedDistinctPhysicalItem,true);
 assert.equal(h.records[0].value.ownerDuplicateReview88.singleGarmentVerified,false);
 assert.equal(h.records[0].value.ownerDuplicateReview88.threeDReady,false);
 assert.equal(h.records[0].value.ownerDuplicateReview88.independentPhysicalItemVerified,false);
 assert.equal(h.records[1].value.batch.length,0);
});
test('P88 forged duplicate-photo consent or independent garment verification flags cannot authorize save',async()=>{
 for(const tamper of [
  r=>{r.ownerId='owner-B';},
  r=>{r.reviewedPhotoId='different';},
  r=>{r.identicalSavedPhotoItemIds=['different'];},
  r=>{r.identicalSavedPhotoItemIds=[];},
  r=>{r.independentPhysicalItemVerified=true;},
  r=>{r.singleGarmentVerified=true;},
  r=>{r.threeDReady=true;},
  r=>{r.ownerAttestedDistinctPhysicalItem=false;}
 ]){
  const h=exactDuplicateOwnerSaveHarness88(),v=h.reviewed();
  tamper(v.ownerDuplicateReview88);
  await assert.rejects(h.c.savePiece(v,[],h.lease),/P88_DISTINCT_OWNER_DECISION_REQUIRED/);
  assert.equal(h.records.length,0);
 }
});
test('P88 exact-photo consent expires if saved peer is replaced during cloud preflight',async()=>{
 const h=exactDuplicateOwnerSaveHarness88();
 h.c.beforeWrite=async()=>{h.c.items[0]={...h.existing};};
 await assert.rejects(h.c.savePiece(h.reviewed(),[],h.lease),/P88_REVOKED_REVIEWED_SAVE/);
 assert.equal(h.records.length,0);
});
test('P88 exact-photo consent expires on additional same-JPEG saved peer or changed photo',async()=>{
 for(const alter of [
  h=>h.c.items.push({id:'new-peer',image:h.existing.image}),
  h=>{h.existing.image='data:image/jpeg;base64,Q0hBTkdF';}
 ]){
  const h=exactDuplicateOwnerSaveHarness88();
  h.c.beforeWrite=async()=>alter(h);
  await assert.rejects(h.c.savePiece(h.reviewed(),[],h.lease),/P88_REVOKED_REVIEWED_SAVE/);
  assert.equal(h.records.length,0);
 }
});
test('P88 identical photo original owner IDB/session and draft marker stay fixed while saving',async()=>{
 for(const alter of [
  h=>h.c.window.closetAuth.user={id:'owner-A'},
  h=>h.c.db={name:'closet-current-user-owner-A',transaction(){throw Error('STALE_DB');}},
  h=>{h.current.exactSavedPhotoMatch88.savedItemId='forged';},
  h=>h.c.batch.splice(0)
 ]){
  const h=exactDuplicateOwnerSaveHarness88();
  h.c.beforeWrite=async()=>alter(h);
  await assert.rejects(h.c.savePiece(h.reviewed(),[],h.lease),/P88_REVOKED_REVIEWED_SAVE/);
  assert.equal(h.records.length,0);
 }
});
test('P88 stale saved-peer fingerprint rejects duplicate review even if captured match is gone',async()=>{
 const h=exactDuplicateOwnerSaveHarness88();
 h.c.items.splice(0);
 await assert.rejects(h.c.savePiece(h.reviewed(),[],h.lease),/P88_STALE_REVIEWED_OWNER/);
 assert.equal(h.records.length,0);
});
test('P88 ordinary review save holds exact owner, image and IDB after cloud preflight',async()=>{
 const saveBegin=appSource.indexOf('function savePiece(');
 const saveEnd=appSource.indexOf('function node(',saveBegin);
 const begin=appSource.indexOf('function reviewedExactPhotoPeers88(');
 const end=appSource.indexOf('function empty(',begin);
 assert.ok(saveBegin>=0&&saveEnd>saveBegin&&begin>saveEnd&&end>begin,
  'native reviewed save source is present');
 const native=appSource.slice(saveBegin,saveEnd)+appSource.slice(begin,end);
 const setup=()=>{
  let releaseGate,writeCount=0;
  const gate=new Promise(resolve=>{releaseGate=resolve;});
  const written={};
  const database={name:'closet-current-user-owner-A',transaction(){
   const tx={objectStore(store){
    return {getAll(){assert.equal(store,'items');const req={result:[]};queueMicrotask(()=>req.onsuccess?.());return req;},get(key){assert.equal(key,'draft');const req={result:{id:'draft',batch:[structuredClone(item)]}};queueMicrotask(()=>req.onsuccess?.());return req;},add(value){writeCount++;written[store]=structuredClone(value);},put(value){writeCount++;written[store]=structuredClone(value);if(store==='state')queueMicrotask(()=>tx.oncomplete?.());}};
   }};
   return tx;
  }};
  const user={id:'owner-A'};
  const item={id:'source-1',image:'data:image/jpeg;base64,AA==',
   category:'Tops',itemType:'T-Shirt',color:'Blue',
   segmentHint:{categories:['Tops']},cropBounds:{x:0,y:0,width:1,height:1}};
  const c={window:{closetAuth:{user}},db:database,batch:[item],items:[],
   draftStoreRevision88:JSON.stringify([item]),structuredClone,queued:async cb=>{await gate;return cb();}};
  vm.createContext(c);vm.runInContext(native,c);
  const lease=vm.runInContext('reviewedSaveLease88(batch[0])',c);
  return {c,lease,item,user,database,written,releaseGate,
   get writes(){return writeCount;}};
 };
 {
  const s=setup();
  const attempt=s.c.savePiece({...s.item},[],s.lease);
  s.c.window.closetAuth.user={id:'owner-B'};
  s.c.db={name:'closet-current-user-owner-B',transaction(){throw Error('WRONG_OWNER_WRITE');}};
  s.releaseGate();
  await assert.rejects(attempt,/P88_REVOKED_REVIEWED_SAVE/);
  assert.equal(s.writes,0,'old photo never reaches replacement account');
 }
 {
  const s=setup();
  const attempt=s.c.savePiece({...s.item},[],s.lease);
  s.c.window.closetAuth.user={id:'owner-A'}; // same-ID renewed login
  s.releaseGate();
  await assert.rejects(attempt,/P88_REVOKED_REVIEWED_SAVE/);
  assert.equal(s.writes,0);
 }
 {
  const s=setup();
  const attempt=s.c.savePiece({...s.item},[],s.lease);
  s.item.segmentHint.categories.push('Shoes'); // in-place source revision
  s.releaseGate();
  await assert.rejects(attempt,/P88_REVOKED_REVIEWED_SAVE/);
  assert.equal(s.writes,0);
 }
 {
  const s=setup();
  const attempt=s.c.savePiece({...s.item},[],s.lease);
  const other={id:'new-draft',image:'data:image/jpeg;base64,AQ=='};
  s.c.batch.push(other);
  s.releaseGate();await attempt;
  assert.equal(s.writes,2,'one item and one draft-state write');
  assert.equal(s.written.items.id,s.item.id);
  assert.deepEqual(s.written.state.batch.map(x=>x.id),['new-draft'],
   'a photo appended during async preflight is not lost');
 }
 {
  const s=setup(),forged={...s.item,image:'data:image/jpeg;base64,AQ=='};
  const attempt=s.c.savePiece(forged,[],s.lease);
  s.releaseGate();
  await assert.rejects(attempt,/P88_REVOKED_REVIEWED_SAVE/);
  assert.equal(s.writes,0,'replaced crop cannot reuse the old review lease');
 }

  // Existing photos may be edited, but an ordinary review cannot mint a
  // model-verified source, one-garment identity, or 3D-readiness token.
  for(const alter of [
   v=>{v.ownerReviewed=true;},v=>{v.sourcePhotoOriginal=true;},
   v=>{v.sourceHashVerified=true;},v=>{v.singleGarmentVerified=true;},
   v=>{v.independentPhysicalItemVerified=true;},v=>{v.threeDReady=true;},
   v=>{v.sourceSHA256='a'.repeat(64);},
   v=>{v.ownerId='owner-A';},v=>{v.sourceKind='verified-single';},
   v=>{v.originalPhoto={image:v.image,sha256:'a'.repeat(64)};},
   v=>{v.ownerSourceReview88={ownerReviewed:true};},
   v=>{v.reconciliation70={ownerId:'owner-A',maskSha256:'a'.repeat(64)};},
   v=>{v.shoePair={confirmedByOwner:true};}
  ]){
   const s=setup(),v=structuredClone(s.item);
   alter(v);const pending=s.c.savePiece(v,[],s.lease);s.releaseGate();
   await assert.rejects(pending,/P88_REVOKED_REVIEWED_SAVE/);
   assert.equal(s.writes,0,'ordinary photo cannot silently become source-verified');
  }
  {
   const s=setup(),pending=s.c.savePiece({...s.item},[],s.lease);
   s.item.sourceHashVerified=true; // in-place change while preflight queued
   s.releaseGate();await assert.rejects(pending,/P88_REVOKED_REVIEWED_SAVE/);
   assert.equal(s.writes,0);
  }
  {
   const s=setup(),v={...s.item,category:'Dresses',itemType:'Dress',
    color:'Green',userAdjusted:true};
   const pending=s.c.savePiece(v,[],s.lease);s.releaseGate();await pending;
   assert.equal(s.written.items.category,'Dresses');
   assert.equal(s.written.items.color,'Green');
   assert.equal(s.writes,2,'legitimate owner details still persist');
  }
});


// Source-executes the actual native saved-item row write with fake IndexedDB;
// no hosted account or genuinely independent photo/garment recognition involved.
function savedDetailsHarness88(){
 const start=appSource.indexOf('function saveExistingPiece88(');
 const end=appSource.indexOf('function node(',start);
 const begin=appSource.indexOf('function reviewedExactPhotoPeers88(');
 const finish=appSource.indexOf('function empty(',begin);
 assert.ok(start>0&&end>start&&begin>end&&finish>begin);
 assert.match(appSource,/await saveExistingPiece88\(recorded,savedDetailsLease88\)/);
 const owner={id:'owner-A'},writes=[],deletes=[],item={id:'saved-1',
  image:'data:image/jpeg;base64,/9j/2Q==',originalPhoto:{image:'data:image/jpeg;base64,/9j/2Q=='},
  recognitionPhoto:{image:'data:image/jpeg;base64,/9j/2Q=='},
  category:'Tops',itemType:'T-shirt',color:'Blue',userAdjusted:true,
  segmentHint:{categories:['Tops']},cropBounds:{x:0,y:0,width:1,height:1},
  ownerSourceReview88:{ownerReviewed:true,threeDReady:false},
  ownerDuplicateReview88:{ownerAttestedDistinctPhysicalItem:true,threeDReady:false}};
 // Synthetic IDB transactional model. An unrelated browser tab may mutate
 // rows after the UI loaded its copy and before the queued readwrite opens.
 // Only an oncomplete transaction applies staged put/delete writes.
 const rows=new Map([[item.id,structuredClone(item)]]);
 let c;
 const db={name:'closet-current-user-owner-A',transaction(store,mode){
  assert.equal(store,'items');assert.equal(mode,'readwrite');
  let readStarted=false,finishScheduled=false,staged=()=>{};
  const tx={oncomplete:null,onabort:null,onerror:null,aborted:false,
   abort(){this.aborted=true;queueMicrotask(()=>this.onabort?.());},
   objectStore(name){
    assert.equal(name,'items');
    const finish=()=>{
     if(finishScheduled)return;
     finishScheduled=true;
     queueMicrotask(()=>{
      if(tx.aborted)return;
      staged();
      tx.oncomplete?.();
     });
    };
    return {
     get(key){
      readStarted=true;
      const request={result:undefined,onsuccess:null,onerror:null};
      Promise.resolve(c.readGate).then(()=>{
       if(tx.aborted)return;
       request.result=rows.has(key)?structuredClone(rows.get(key)):undefined;
       request.onsuccess?.({target:request});
       finish();
      });
      return request;
     },
     put(value){
      const copy=structuredClone(value);
      writes.push(copy);
      staged=()=>rows.set(copy.id,copy);
      if(!readStarted)finish();
     },
     delete(key){
      deletes.push(key);
      staged=()=>rows.delete(key);
      if(!readStarted)finish();
     }
    };
   }
  };
  return tx;
 }};
 c={window:{closetAuth:{user:owner}},db,items:[item],batch:[],structuredClone,
   readGate:null};
 c.beforeWrite=async()=>{};
 c.queued=async fn=>{await c.beforeWrite();return fn();};
 vm.createContext(c);
 vm.runInContext(appSource.slice(start,end)+appSource.slice(begin,finish),c);
 const lease=c.reviewedSaveLease88(item);
 return {c,item,db,owner,lease,writes,deletes,rows};
}
test('P88 existing closet item accepts manual category/type/color edits in captured IDB only',async()=>{
 const h=savedDetailsHarness88(),value=structuredClone(h.item);
 value.category='Dresses';value.itemType='Dress';value.color='Green';
 await h.c.saveExistingPiece88(value,h.lease);
 assert.equal(h.writes.length,1);assert.equal(h.writes[0].itemType,'Dress');
 assert.equal(h.writes[0].color,'Green');
 assert.equal(h.writes[0].originalPhoto.image,h.item.originalPhoto.image);
});
test('P88 saved detail queued preflight refuses cross-owner, same-ID renewed login and changed IDB',async()=>{
 for(const mutate of [
  h=>{h.c.window.closetAuth.user={id:'owner-B'};h.c.db={name:'closet-current-user-owner-B'};},
  h=>{h.c.window.closetAuth.user={id:'owner-A'};},
  h=>{h.c.db={name:'closet-current-user-owner-A'};}
 ]){
  const h=savedDetailsHarness88(),value=structuredClone(h.item);value.color='Green';
  h.c.beforeWrite=async()=>mutate(h);
  await assert.rejects(h.c.saveExistingPiece88(value,h.lease),/P88_REVOKED_SAVED_EDITOR_OWNER_OR_SOURCE/);
  assert.equal(h.writes.length,0,'old item never writes into a switched account');
 }
});
test('P88 saved edit never resurrects deleted item or uses altered original and mask evidence',async()=>{
 for(const mutate of [
  h=>{h.c.items=[];},h=>{h.item.image='data:image/jpeg;base64,QUJD';},
  h=>{h.item.originalPhoto.image='data:image/jpeg;base64,QUJD';},
  h=>{h.item.ownerSourceReview88.ownerReviewed=false;},
  h=>{h.item.ownerDuplicateReview88.threeDReady=true;},
  h=>{h.item.segmentHint.categories.push('Shoes');}
 ]){
  const h=savedDetailsHarness88(),value=structuredClone(h.item);
  value.itemType='Unknown';h.c.beforeWrite=async()=>mutate(h);
  await assert.rejects(h.c.saveExistingPiece88(value,h.lease),/P88_REVOKED_SAVED_EDITOR_OWNER_OR_SOURCE/);
  assert.equal(h.writes.length,0);
 }
});
test('P88 saved editor cannot mint source verification/3D proof or change immutable original',async()=>{
 for(const mutate of [
  v=>{v.id='foreign-item';},v=>{v.image='data:image/jpeg;base64,QUJD';},
  v=>{v.originalPhoto.image='data:image/jpeg;base64,QUJD';},
  v=>{v.recognitionPhoto.image='data:image/jpeg;base64,QUJD';},
  v=>{v.segmentHint.verified=true;},v=>{v.ownerSourceReview88.threeDReady=true;},
  v=>{v.ownerDuplicateReview88.threeDReady=true;},
  v=>{v.sourceHashVerified=true;},v=>{v.singleGarmentVerified=true;},
  v=>{v.independentPhysicalItemVerified=true;},v=>{v.threeDReady=true;},
  v=>{v.sourceKind='verified-single';}
 ]){
  const h=savedDetailsHarness88(),value=structuredClone(h.item);mutate(value);
  await assert.rejects(h.c.saveExistingPiece88(value,h.lease),/P88_STALE_SAVED_EDITOR_OWNER_OR_SOURCE/);
  assert.equal(h.writes.length,0);
 }
});



test('P88 existing saved item deletion is scoped to original owner and IDB row',async()=>{
 const h=savedDetailsHarness88();
 assert.match(appSource,/await removeExistingPiece88\(deleteLease\)/,
  'native Adjust and Closet actions must invoke signed saved deletion');
 assert.equal((appSource.match(/await removeExistingPiece88\(deleteLease\)/g)||[]).length,2,
  'both existing garment Delete entry points must call the signed helper');
 await h.c.removeExistingPiece88(h.lease);
 assert.deepEqual(h.deletes,['saved-1']);
 assert.equal(h.writes.length,0);
});
test('P88 saved delete rejects signed owner or database replacement after cloud preflight',async()=>{
 for(const mutate of [
  h=>{h.c.window.closetAuth.user={id:'owner-B'};h.c.db={name:'closet-current-user-owner-B'};},
  h=>{h.c.window.closetAuth.user={id:'owner-A'};},
  h=>{h.c.db={name:'closet-current-user-owner-A'};}
 ]){
  const h=savedDetailsHarness88();h.c.beforeWrite=async()=>mutate(h);
  await assert.rejects(h.c.removeExistingPiece88(h.lease),/P88_REVOKED_SAVED_DELETE_OWNER_OR_SOURCE/);
  assert.equal(h.deletes.length,0,'never delete a replacement account garment');
 }
});
test('P88 saved delete refuses stale source, reintroduced ID, or edited owner physical evidence',async()=>{
 for(const mutate of [
  h=>{h.c.items=[];},
  h=>{h.c.items=[structuredClone(h.item)];},
  h=>{h.item.image='data:image/jpeg;base64,TkVX';},
  h=>{h.item.originalPhoto.image='data:image/jpeg;base64,TkVX';},
  h=>{h.item.segmentHint.categories.push('Shoes');},
  h=>{h.item.ownerSourceReview88.ownerReviewed=false;},
  h=>{h.item.ownerDuplicateReview88.threeDReady=true;}
 ]){
  const h=savedDetailsHarness88();h.c.beforeWrite=async()=>mutate(h);
  await assert.rejects(h.c.removeExistingPiece88(h.lease),/P88_REVOKED_SAVED_DELETE_OWNER_OR_SOURCE/);
  assert.equal(h.deletes.length,0,'stale deletion cannot remove or recreate a different row');
 }
});

// Cross-tab/private restore collisions: protect the actual persisted item
// at the native IndexedDB readwrite boundary, not just the JS owner object.
test('P88 cross-tab owner subtype/color correction blocks stale editor overwrite',async()=>{
 for(const mutate of [
  v=>{v.color='Green';},
  v=>{v.itemType='Blouse';},
  v=>{v.notes='corrected from other session';},
  v=>{v.ownerSourceReview88.ownerReviewed=false;},
  v=>{v.image='data:image/jpeg;base64,TkVX';}
 ]){
  const h=savedDetailsHarness88(),remote=structuredClone(h.rows.get(h.item.id));
  mutate(remote);h.rows.set(h.item.id,remote);
  const revised={...structuredClone(h.item),color:'Purple'};
  await assert.rejects(h.c.saveExistingPiece88(revised,h.lease),
   /P88_SAVED_EDITOR_STORAGE_CHANGED/,
   'a second tab correction cannot be discarded by the first tab');
  assert.deepEqual(h.rows.get(h.item.id),remote);
  assert.equal(h.writes.length,0);
 }
});
test('P88 saved editor cannot resurrect a source deleted in a second tab',async()=>{
 const h=savedDetailsHarness88();
 h.rows.delete(h.item.id);
 await assert.rejects(h.c.saveExistingPiece88({...h.item,color:'Green'},h.lease),
  /P88_SAVED_EDITOR_STORAGE_CHANGED/);
 assert.equal(h.rows.has(h.item.id),false);
 assert.equal(h.writes.length,0);
});
test('P88 cross-tab changed or replaced row blocks stale delete',async()=>{
 for(const remote of [
  row=>{row.color='Purple';},
  row=>{row.sourceSHA256='a'.repeat(64);},
  row=>{row.itemType='Dress';}
 ]){
  const h=savedDetailsHarness88(),changed=structuredClone(h.rows.get(h.item.id));
  remote(changed);h.rows.set(h.item.id,changed);
  await assert.rejects(h.c.removeExistingPiece88(h.lease),
   /P88_SAVED_DELETE_STORAGE_CHANGED/);
  assert.deepEqual(h.rows.get(h.item.id),changed);
  assert.equal(h.deletes.length,0);
 }
 const h=savedDetailsHarness88();h.rows.delete(h.item.id);
 await assert.rejects(h.c.removeExistingPiece88(h.lease),/P88_SAVED_DELETE_STORAGE_CHANGED/);
 assert.equal(h.deletes.length,0);
});
test('P88 saved row read checks signed owner again when asynchronous IDB callback arrives',async()=>{
 let release;
 const gate=new Promise(r=>{release=r});
 const h=savedDetailsHarness88();
 h.c.readGate=gate;
 const task=h.c.saveExistingPiece88({...h.item,color:'Green'},h.lease);
 // Confirm an actual IDB read was queued before revoking the signed session.
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 h.c.window.closetAuth.user={id:'owner-A'};
 release();
 await assert.rejects(task,/P88_(?:SAVED_EDITOR_STORAGE_CHANGED|REVOKED_SAVED_EDITOR_OWNER_OR_SOURCE)/);
 assert.equal(h.writes.length,0);
});

// P88: exercise the ACTUAL native asynchronous closetReady reload, not a
// handwritten replica of its physical-garment and duplicate draft policy.
async function reloadedOwnerDraftHarness88(drafts){
 const start=appSource.indexOf('function restoreMission1Draft88(');
 const end=appSource.indexOf('for(const c of categories.slice(1))',start);
 assert.ok(start>=0&&end>start,'native owner review reload source exists');
 const scans=[],alerts=[],renders=[];
 const c={window:{closetAuth:{ready:Promise.resolve(),user:{id:'owner-A'}}},
  openDB:async()=>({name:'closet-current-user-owner-A'}),
  readAll:async()=>[],readDraft:async()=>structuredClone(drafts),
  normalizeClothing:x=>x,
  render:()=>renders.push(true),message:x=>alerts.push(x),
  queueAutomatic:item=>scans.push(item),Promise};
 vm.createContext(c);
 vm.runInContext('let db,items=[],batch=[];\n'+appSource.slice(start,end),c);
 await vm.runInContext('closetReady',c);
 return {c,scans,alerts,renders,batch:vm.runInContext('batch',c),
  saved:vm.runInContext('items',c)};
}
test('P88 app reload preserves outfit original, owner confirmation and existing model/owner review fields',async()=>{
 const source={id:'outfit-shirt',image:'data:image/jpeg;base64,T1VURklU',outfitSourceId:'whole-1',
  category:'Tops',itemType:'T-shirt',color:'Blue',userAdjusted:true,localAnalyzed:true,
  requiresOwnershipConfirmation:true,originalPhoto:{image:'data:image/jpeg;base64,T1JJR0lO'},
  segmentHint:{clipped:false,categories:['Tops'],componentReviewStatus:'owner_must_confirm_garment_units'},
  reconciliation70Status:'paired_confirmed',
  reconciliation70:{sourceSha256:'a'.repeat(64),maskSha256:'b'.repeat(64),ownerId:'owner-A'}};
 const h=await reloadedOwnerDraftHarness88([source]);
 assert.equal(h.batch.length,1);
 assert.equal(h.batch[0].image,source.image,'original photo region retained in owner draft');
 assert.equal(h.batch[0].originalPhoto.image,source.originalPhoto.image);
 assert.equal(h.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(h.batch[0].localAnalyzed,true,'do not forcibly revoke prior scan state');
 assert.equal(h.batch[0].userAdjusted,true,'owner-corrected class cannot be reset by page restart');
 assert.equal(h.batch[0].itemType,'T-shirt');
 assert.equal(h.batch[0].reconciliation70.maskSha256,source.reconciliation70.maskSha256);
 assert.equal(h.scans.length,0,'restored outfit mask cannot silently start fresh whole-photo reclassification');
 assert.equal(h.saved.length,0);
});
test('P88 a pending unresolved segmented outfit stays unsaved and owner-review-required on restart',async()=>{
 const h=await reloadedOwnerDraftHarness88([{id:'ambiguous',image:'data:image/jpeg;base64,QUJD',
  outfitSourceId:'original-ambiguous',localAnalyzed:false,requiresOwnershipConfirmation:false,
  segmentHint:{componentReviewStatus:'unresolved_fragments_keep_source_mask'}}]);
 assert.equal(h.batch.length,1);
 assert.equal(h.batch[0].requiresOwnershipConfirmation,true);
 assert.equal(h.batch[0].localAnalyzed,false);
 assert.match(h.batch[0].localStatus,/Restored source-bound or duplicate photograph/);
 assert.equal(h.scans.length,0);
 assert.equal(h.saved.length,0);
});
test('P88 exact saved-photo and visual duplicate hints preserve review on reload without reclassification',async()=>{
 const h=await reloadedOwnerDraftHarness88([
  {id:'same-saved',image:'data:image/jpeg;base64,QUFB',
   exactSavedPhotoMatch88:{savedItemId:'prior'},possibleDuplicate:true,localAnalyzed:true,
   requiresOwnershipConfirmation:true},
  {id:'lookalike',image:'data:image/jpeg;base64,QkJC',
   possibleDuplicate:true,localAnalyzed:false,requiresOwnershipConfirmation:false},
  {id:'same-source',image:'data:image/jpeg;base64,Q0ND',
   ownerDuplicateReview88:{ownerAttestedDistinctPhysicalItem:true},
   localAnalyzed:false,requiresOwnershipConfirmation:false}
 ]);
 assert.equal(h.batch.length,3);
 assert.equal(h.scans.length,0);
 assert.ok(h.batch.every(i=>i.requiresOwnershipConfirmation===true));
 assert.equal(h.batch[0].exactSavedPhotoMatch88.savedItemId,'prior');
 assert.equal(h.batch[0].localAnalyzed,true);
 assert.equal(h.saved.length,0);
});
test('P88 ordinary new single-photo drafts resume scanning but manually corrected photos do not',async()=>{
 const h=await reloadedOwnerDraftHarness88([
  {id:'new-original',image:'data:image/jpeg;base64,TkVX',localAnalyzed:false,
   userAdjusted:false,requiresOwnershipConfirmation:false},
  {id:'manually-adjusted',image:'data:image/jpeg;base64,TUFOVUFM',localAnalyzed:false,
   userAdjusted:true,category:'Outerwear',itemType:'Coat',color:'Black'},
  {id:'already-scanned',image:'data:image/jpeg;base64,U0NBTk5FRA==',localAnalyzed:true,
   category:'Tops',itemType:'T-shirt',color:'Blue',requiresOwnershipConfirmation:true}
 ]);
 assert.deepEqual(h.scans.map(x=>x.id),['new-original']);
 assert.equal(h.batch[1].itemType,'Coat');
 assert.equal(h.batch[2].requiresOwnershipConfirmation,true);
 assert.equal(h.renders.length,1);
 assert.equal(h.saved.length,0,'reload must not auto-admit any garment');
});
test('P88 original shoe-pair and source-bound fragment receipts survive app reload',async()=>{
 const h=await reloadedOwnerDraftHarness88([
  {id:'pair-1',image:'data:image/jpeg;base64,U0hPRVM=',localAnalyzed:false,
   shoePair:{confirmedByOwner:true,companion:{image:'data:image/jpeg;base64,UklHSFQ='}}},
  {id:'fragments',image:'data:image/jpeg;base64,RlJBRw==',
   combinedFragments70:{confirmedByOwner:true,companion:{image:'data:image/jpeg;base64,Q1JPUA=='}}},
  {id:'unresolved',image:'data:image/jpeg;base64,VU5SRVM=',
   reconciliation70Status:'unresolved'}
 ]);
 assert.equal(h.scans.length,0);
 assert.ok(h.batch.every(x=>x.requiresOwnershipConfirmation===true));
 assert.equal(h.batch[0].shoePair.companion.image,'data:image/jpeg;base64,UklHSFQ=');
 assert.equal(h.batch[1].combinedFragments70.confirmedByOwner,true);
 assert.equal(h.batch[2].reconciliation70Status,'unresolved');
});

// P88: exercise the real async initial app owner/photo reload across each
// awaited database boundary. No actual family photo, browser account, RLS,
// or cloud access is implied by this source-executed fake owner IDB fixture.
function ownerBootRevokeHarness88(){
 const start=appSource.indexOf('function restoreMission1Draft88(');
 const end=appSource.indexOf('for(const c of categories.slice(1))',start);
 assert.ok(start>=0&&end>start,'native signed owner boot source present');
 const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((a,b)=>{resolve=a;reject=b;});
  return {promise,resolve,reject};
 };
 const gates={open:deferred(),items:deferred(),draft:deferred()};
 const starts={open:deferred(),items:deferred(),draft:deferred()};
 const calls=[],messages=[],scans=[],renders=[];
 const user={id:'owner-A'};let closes=0;
 const ownerDb={name:'closet-current-user-owner-A',close(){closes++;}};
 const c={window:{closetAuth:{ready:Promise.resolve(),user}},
  openDB:()=>{calls.push('open');starts.open.resolve();return gates.open.promise;},
  readAll:()=>{calls.push('items');starts.items.resolve();return gates.items.promise;},
  readDraft:()=>{calls.push('draft');starts.draft.resolve();return gates.draft.promise;},
  normalizeClothing:x=>structuredClone(x),
  queueAutomatic:item=>scans.push(item),message:s=>messages.push(s),
  render:()=>renders.push('render')};
 vm.createContext(c);
 vm.runInContext('let db,items=[],batch=[];\n'+appSource.slice(start,end),c);
 const complete=vm.runInContext('closetReady',c);
 return {c,user,ownerDb,gates,starts,calls,messages,scans,renders,complete,
  get closes(){return closes;},
  get items(){return vm.runInContext('items',c);},
  get batch(){return vm.runInContext('batch',c);},
  get db(){return vm.runInContext('db',c);}};
}
test('P88 owner A boot discarded before IndexedDB open resolves after switching to B',async()=>{
 const h=ownerBootRevokeHarness88();
 await h.starts.open.promise;
 h.c.window.closetAuth.user={id:'owner-B'};
 h.gates.open.resolve(h.ownerDb);
 await h.complete;
 assert.deepEqual(h.calls,['open'],'must never read A contents after logout');
 assert.equal(h.closes,1);
 assert.equal(h.db,undefined);
 assert.equal(h.items.length,0);
 assert.equal(h.batch.length,0);
 assert.equal(h.scans.length,0);
 assert.equal(h.renders.length,0);
 assert.equal(h.messages.length,0,'old owner may not show a photo count in B');
});
test('P88 A wardrobe read finishing after B account switch never paints private A items into B',async()=>{
 const h=ownerBootRevokeHarness88();
 await h.starts.open.promise;h.gates.open.resolve(h.ownerDb);
 await h.starts.items.promise;
 h.c.window.closetAuth.user={id:'owner-B'};
 h.gates.items.resolve([{id:'A-private-shirt',image:'data:image/jpeg;base64,QUFB'}]);
 await h.complete;
 assert.deepEqual(h.calls,['open','items']);
 assert.equal(h.closes,1);
 assert.equal(h.items.length,0);
 assert.equal(h.batch.length,0);
 assert.equal(h.renders.length,0);
 assert.equal(h.messages.length,0);
 assert.equal(h.scans.length,0);
});
test('P88 completed A clothing read does not leak A draft when login renewed during pending draft read',async()=>{
 const h=ownerBootRevokeHarness88();
 await h.starts.open.promise;h.gates.open.resolve(h.ownerDb);
 await h.starts.items.promise;
 h.gates.items.resolve([{id:'A-owned-dress',image:'data:image/jpeg;base64,QUJD'}]);
 await h.starts.draft.promise;
 h.c.window.closetAuth.user={id:'owner-A'}; // same ID is not the same signed session
 h.gates.draft.resolve([{id:'A-private-camera',image:'data:image/jpeg;base64,UEhPVE8='}]);
 await h.complete;
 assert.deepEqual(h.calls,['open','items','draft']);
 assert.equal(h.closes,1);
 assert.equal(h.items.length,0,'A owned pieces never visible after renewed login');
 assert.equal(h.batch.length,0,'A unfinished JPEG never visible after renewed login');
 assert.equal(h.renders.length,0);
 assert.equal(h.messages.length,0);
 assert.equal(h.scans.length,0);
});
test('P88 replacement IDB during pending A draft load remains current; late old load cannot overwrite it',async()=>{
 const h=ownerBootRevokeHarness88();
 await h.starts.open.promise;h.gates.open.resolve(h.ownerDb);
 await h.starts.items.promise;h.gates.items.resolve([]);
 await h.starts.draft.promise;
 const replacement={name:'closet-current-user-owner-A'};
 h.c.db=replacement;
 // top-level let db in VM is lexical and not a property of the context.
 h.c.window.replacementBootDb88=replacement;
 vm.runInContext('db=window.replacementBootDb88',h.c);
 h.gates.draft.resolve([{id:'stale',image:'data:image/jpeg;base64,U1RBTEU='}]);
 await h.complete;
 assert.equal(h.db,replacement,'never clear newer db when older A DB revoked');
 assert.equal(h.closes,1,'old connection is closed without affecting replacement');
 assert.equal(h.batch.length,0);
 assert.equal(h.renders.length,0);
 assert.equal(h.scans.length,0);
});
test('P88 rejected old-owner draft read after account switch cannot display storage warning in B session',async()=>{
 const h=ownerBootRevokeHarness88();
 await h.starts.open.promise;h.gates.open.resolve(h.ownerDb);
 await h.starts.items.promise;h.gates.items.resolve([]);
 await h.starts.draft.promise;
 h.c.window.closetAuth.user={id:'owner-B'};
 h.gates.draft.reject(Error('owner A old database closed'));
 await h.complete;
 assert.equal(h.closes,1);
 assert.equal(h.messages.length,0,'do not report old account private storage failure to new owner');
 assert.equal(h.renders.length,0);
 assert.equal(h.batch.length,0);
});

test('P88 active owner still sees meaningful browser storage error when initial IDB open fails',async()=>{
 const h=ownerBootRevokeHarness88();
 await h.starts.open.promise;
 h.gates.open.reject(Error('IndexedDB disabled'));
 await h.complete;
 assert.equal(h.calls.length,1);
 assert.equal(h.messages.length,1,'a real current-owner storage failure remains visible');
 assert.match(h.messages[0],/Browser storage is unavailable/);
 assert.equal(h.batch.length,0);
 assert.equal(h.items.length,0);
 assert.equal(h.scans.length,0);
});

// P88: source-execute the actual native photo and closet-video import paths
// with gated decode / seek promises. These are synthetic files and fake owner
// IDs; they cannot establish physical mobile camera or hosted-account privacy.
function pendingImportEvent88(){
 let resolve,reject;
 const promise=new Promise((a,b)=>{resolve=a;reject=b;});
 return {promise,resolve,reject};
}
async function importWait88(check){
 for(let i=0;i<30;i++){
  if(check())return;
  await new Promise(resolve=>setImmediate(resolve));
 }
 assert.fail('expected native import await not reached');
}
function photoFileImportHarness88(){
 const start=appSource.indexOf('async function importClothingPhotos(files){');
 const end=appSource.indexOf("$('clothingPhotos').onchange",start);
 assert.ok(start>0&&end>start,'actual native photo importer exists');
 const owner={id:'owner-A'},ownerDb={name:'closet-current-user-owner-A'};
 const gates=[],accepted=[],messages=[],views=[],controls=[],resultPhotos=[];
 const c={window:{document:{},closetAuth:{user:owner}},db:ownerDb,
  busy:false,session:0,batch:[],items:[],
  stopCamera(){},controls(x){controls.push(x);},message(x){messages.push(x);},
  switchView(x){views.push(x);},candidate(image){
   accepted.push(image);c.batch.push({id:'draft-'+accepted.length,image});return true;
  },
  photoToJPEG(file){const d=pendingImportEvent88();gates.push({file,...d});return d.promise;},
  readPhotoBatch:async(files,decode,onPhoto)=>{
   const errors=[],results=[];let added=0;
   for(const file of files){
    try{
     const photo=await decode(file);
     const accepted=await onPhoto(photo,file);
     if(accepted===false)results.push({name:file.name,status:'duplicate'});
     else{added++;resultPhotos.push(photo);results.push({name:file.name,status:'added'});}
    }catch(error){
     errors.push(file.name+': could not open; try JPEG or PNG');
     results.push({name:file.name,status:'error',reason:error.message});
    }
   }
   return {added,errors,results};
  }};
 vm.createContext(c);vm.runInContext(appSource.slice(start,end),c);
 return {c,owner,ownerDb,gates,accepted,messages,views,controls,resultPhotos};
}
test('P88 local photo decode cannot admit owner A original JPEG to a replacement B session',async()=>{
 const h=photoFileImportHarness88();
 const task=h.c.importClothingPhotos([{name:'A-private.jpg',size:123}]);
 await importWait88(()=>h.gates.length===1);
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.batch=[{id:'B-existing',image:'data:image/jpeg;base64,QkJC'}];
 h.gates[0].resolve('data:image/jpeg;base64,QUFB');
 await task;
 assert.deepEqual(h.c.batch.map(x=>x.id),['B-existing']);
 assert.equal(h.accepted.length,0);
 assert.equal(h.views.length,0);
 assert.equal(h.messages.length,0);
 assert.equal(h.c.window.__lastPhotoImportResult,undefined);
});
test('P88 same-ID renewed owner login and replacement IDB each revoke pending photo decode',async()=>{
 for(const change of ['same-id-login','same-id-db']){
  const h=photoFileImportHarness88();
  const task=h.c.importClothingPhotos([{name:'A-private.png',size:123}]);
  await importWait88(()=>h.gates.length===1);
  if(change==='same-id-login')h.c.window.closetAuth.user={id:'owner-A'};
  else h.c.db={name:'closet-current-user-owner-A'};
  h.gates[0].resolve('data:image/jpeg;base64,QUFB');
  await task;
  assert.equal(h.accepted.length,0);
  assert.equal(h.c.batch.length,0);
  assert.equal(h.views.length,0);
  assert.equal(h.messages.length,0);
 }
});
test('P88 import may retain already accepted owner A photo but never append later frame to owner B',async()=>{
 const h=photoFileImportHarness88();
 const task=h.c.importClothingPhotos([
  {name:'first.jpg',size:100},{name:'second.jpg',size:100}]);
 await importWait88(()=>h.gates.length===1);
 h.gates[0].resolve('data:image/jpeg;base64,RklSU1Q=');
 await importWait88(()=>h.gates.length===2);
 assert.equal(h.accepted.length,1,'first image accepted only in original signed session');
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.batch=[{id:'B-original',image:'data:image/jpeg;base64,QkJC'}];
 h.gates[1].resolve('data:image/jpeg;base64,U0VDT05E');
 await task;
 assert.deepEqual(h.c.batch.map(x=>x.id),['B-original']);
 assert.equal(h.accepted.length,1);
 assert.equal(h.views.length,0);
 assert.equal(h.messages.length,0);
});
test('P88 same owner photo import still returns two distinct original JPEG review drafts',async()=>{
 const h=photoFileImportHarness88();
 const task=h.c.importClothingPhotos([
  {name:'one.jpg',size:100},{name:'two.jpg',size:100}]);
 await importWait88(()=>h.gates.length===1);
 h.gates[0].resolve('data:image/jpeg;base64,T05F');
 await importWait88(()=>h.gates.length===2);
 h.gates[1].resolve('data:image/jpeg;base64,VFdP');
 await task;
 assert.deepEqual(h.c.batch.map(x=>x.image),['data:image/jpeg;base64,T05F','data:image/jpeg;base64,VFdP']);
 assert.deepEqual(h.c.batch.map(x=>x.importFilename),['one.jpg','two.jpg']);
 assert.deepEqual(h.views,['review']);
 assert.equal(h.c.window.__lastPhotoImportResult.added,2);
 assert.equal(h.c.busy,false);
});
function videoFrameImportHarness88(){
 const start=appSource.indexOf('async function upload(file){');
 const end=appSource.indexOf("$('upload').onchange",start);
 assert.ok(start>0&&end>start,'actual native video importer exists');
 const owner={id:'owner-A'},ownerDb={name:'closet-current-user-owner-A'};
 const events=[],frames=[],views=[],messages=[],revoked=[],controls=[],renders=[];
 const elements={placeholder:{hidden:true},interval:{value:'1'},
  captureState:{textContent:''}};
 const video={src:'',duration:1.5,currentTime:0,classList:{add(){}},
  removeAttribute(name){if(name==='src')this.src='';},load(){}};
 const c={window:{document:{},closetAuth:{user:owner}},
  db:ownerDb,busy:false,session:0,batch:[],items:[],video,
  URL:{createObjectURL(){return 'blob:owner-A-video';},
   revokeObjectURL(url){revoked.push(url);}},
  waitEvent(_,type){const d=pendingImportEvent88();events.push({type,...d});return d.promise;},
  snap(){const image='data:image/jpeg;base64,RlJBTUU'+(frames.length+1);
   return image;},
  candidate(photo){frames.push(photo);c.batch.push({id:'frame-'+frames.length,image:photo});return true;},
  stopCamera(){},controls(v){controls.push(v);},message(m){messages.push(m);},
  switchView(view){views.push(view);},render(){renders.push('render');},
  $(id){return elements[id]||(elements[id]={textContent:'',hidden:true});}};
 vm.createContext(c);vm.runInContext(appSource.slice(start,end),c);
 return {c,owner,ownerDb,events,frames,views,messages,revoked,controls,renders};
}
test('P88 signed owner changed during video metadata decode never paints old JPEG frames to B',async()=>{
 const h=videoFrameImportHarness88(),task=h.c.upload({size:100});
 await importWait88(()=>h.events.length===1);
 assert.equal(h.events[0].type,'loadedmetadata');
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.batch=[{id:'B-current',image:'data:image/jpeg;base64,QkJC'}];
 h.events[0].resolve();
 await task;
 assert.deepEqual(h.c.batch.map(x=>x.id),['B-current']);
 assert.equal(h.frames.length,0);
 assert.equal(h.views.length,0);
 assert.equal(h.messages.length,0);
 assert.deepEqual(h.revoked,['blob:owner-A-video']);
});
test('P88 renewed same-ID session or replaced IDB during video seek cannot capture old owner frame',async()=>{
 for(const change of ['renew','db']){
  const h=videoFrameImportHarness88(),task=h.c.upload({size:100});
  await importWait88(()=>h.events.length===1);h.events[0].resolve();
  await importWait88(()=>h.events.length===2);
  assert.equal(h.events[1].type,'seeked');
  if(change==='renew')h.c.window.closetAuth.user={id:'owner-A'};
  else h.c.db={name:'closet-current-user-owner-A'};
  h.events[1].resolve();await task;
  assert.equal(h.frames.length,0);
  assert.equal(h.c.batch.length,0);
  assert.equal(h.views.length,0);
  assert.equal(h.messages.length,0);
 }
});
test('P88 same-owner video import retains distinct extracted frames for manual review',async()=>{
 const h=videoFrameImportHarness88(),task=h.c.upload({size:100});
 await importWait88(()=>h.events.length===1);h.events[0].resolve();
 await importWait88(()=>h.events.length===2);h.events[1].resolve();
 await importWait88(()=>h.events.length===3);h.events[2].resolve();
 await task;
 assert.equal(h.frames.length,2);
 assert.equal(h.c.batch.length,2);
 assert.deepEqual(h.views,['review']);
 assert.equal(h.c.busy,false);
 assert.equal(h.c.video.src,'');
 assert.deepEqual(h.revoked,['blob:owner-A-video']);
});
test('P88 video import must stop after owner changes between two decoded frames',async()=>{
 const h=videoFrameImportHarness88(),task=h.c.upload({size:100});
 await importWait88(()=>h.events.length===1);h.events[0].resolve();
 await importWait88(()=>h.events.length===2);h.events[1].resolve();
 await importWait88(()=>h.events.length===3);
 assert.equal(h.frames.length,1);
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.batch=[{id:'B-current',image:'data:image/jpeg;base64,QkJC'}];
 h.events[2].resolve();await task;
 assert.equal(h.frames.length,1);
 assert.deepEqual(h.c.batch.map(x=>x.id),['B-current']);
 assert.equal(h.views.length,0);
 assert.equal(h.messages.length,0);
});

// P88: source-execute the actual "Fill missing details from photo" editor
// controller against a small DOM/worker facade. Stale results cannot silently
// overwrite owner-confirmed subtype/color or migrate across signed sessions.
// These tests do not claim real camera accuracy or authenticated hosted RLS.
function photoFillGated88(){
 let resolve,reject;
 const promise=new Promise((a,b)=>{resolve=a;reject=b;});
 return {promise,resolve,reject};
}
async function photoFillReached88(predicate){
 for(let i=0;i<30;i++){
  if(predicate())return;
  await new Promise(resolve=>setImmediate(resolve));
 }
 assert.fail('native photo-fill await was not reached');
}
function photoFillHarness88({itemValues={},auto=false,learning=false,legacy=false}={}){
 const start=appSource.indexOf('function clothingFields(body,item,onChange=()=>{}){');
 const end=appSource.indexOf('// P88: an owner photo crop',start);
 assert.ok(start>0&&end>start,'native source editor and photo-fill callback exists');
 const owner={id:'owner-A'},ownerDb={name:'closet-current-user-owner-A'};
 const nodes=[],photoCalls=[],modelCalls=[],ownerEdits=[];
 const suggestionCalls=[],applicationCalls=[],scope={ownerId:'owner-A',active:true};
 const legacySuggestion={requiresConfirmation:true,fields:{itemType:'T-shirt'}};
 const make=(tag,text)=>{
  const el={tag,textContent:text||'',value:'',disabled:false,isConnected:true,
   children:[],options:[],className:'',checked:false,src:'',alt:'',
   append(...values){this.children.push(...values);},
   prepend(...values){this.children.unshift(...values);},
   replaceChildren(...values){this.children=[...values];this.options=[...values];},
   setAttribute(key,val){this[key==='aria-label'?'ariaLabel':key]=val;}};
  nodes.push(el);return el;
 };
 const field=(body,title,value,type='input')=>{
  const label=make('label',title),input=make(type);
  input.setAttribute('aria-label',title);input.value=value||'';
  label.append(input);body.append(label);return input;
 };
 const choice=(body,title,value,options)=>{
  const label=make('label',title),input=make('select');
  input.setAttribute('aria-label',title);
  input.options=options.map(x=>{const o=make('option',x);o.value=x;return o;});
  input.value=options.includes(value)?value:options[0];
  label.append(input);body.append(label);return input;
 };
 const item={id:'draft-1',image:'data:image/jpeg;base64,QUFB',
  name:'',category:'Tops',itemType:'Unknown',color:'Blue',colorSource:'user',
  seasons:[],notes:'',pattern:'Unknown',sleeveLength:'Unknown',fit:'Unknown',
  ...itemValues};
 const c={window:{document:{},closetAuth:{user:owner}},
  document:{createTextNode:text=>make('text',text)},db:ownerDb,
  item,nodes,make,node:make,field,choice,
  normalizeClothing:x=>({seasons:[],...x}),
  learningMode72:()=>learning,
  learningScope72:()=>learning&&scope.active?scope:null,
  ClothingMemory:(learning||legacy)?{
   suggest:()=>legacy?legacySuggestion:null,weekly:()=>null,
   apply:value=>({...value,itemType:'T-shirt'}),
   suggest72:()=>{const gate=photoFillGated88();suggestionCalls.push(gate);return gate.promise;},
   apply72:()=>{const gate=photoFillGated88();applicationCalls.push(gate);return gate.promise;}
  }:undefined,
  localReady:true,
  items:[],
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  clothingSchema:{types:{Uncategorized:[],Tops:['T-shirt','Blouse','Tunic'],Bottoms:['Jeans'],
   Dresses:['Casual dress'],Outerwear:['Coat'],Shoes:['Sneakers'],Accessories:['Bag']},
   seasons:['Summer','Winter'],sleeve:['Unknown','Short sleeve','Long sleeve'],
   pattern:['Unknown','Solid'],fit:['Unknown','Regular']},
  ClothingDetails:{
   missing:()=>[],
   fillColor:(value,estimate)=>estimate?{color:estimate,colorSource:'photo-estimate'}:{},
   fill:(value,choice,details)=>({sleeveLength:details?.sleeveLength||'Short sleeve'})
  },
  checkPhoto:()=>{const gate=photoFillGated88();photoCalls.push(gate);return gate.promise;},
  localRequest:()=>{const gate=photoFillGated88();modelCalls.push(gate);return gate.promise;},
  segmentationAllows:()=>true,
  applyLocalChoice:(value,choice)=>{value.category=choice.category;value.itemType=choice.itemType;},
  enableLocal:async()=>true
 };
 const body=make('form');vm.createContext(c);
 vm.runInContext(appSource.slice(start,end),c);
 c.collect=c.clothingFields(body,item,key=>ownerEdits.push(key));
 const find=label=>nodes.find(x=>x.ariaLabel===label);
 const fill=nodes.find(x=>x.textContent==='Fill missing details from photo');
 assert.ok(fill&&typeof fill.onclick==='function');
 return {c,item,owner,ownerDb,nodes,body,photoCalls,modelCalls,ownerEdits,fill,find,suggestionCalls,applicationCalls,scope};
}
test('P88 late photo color detection may not overwrite an owner-entered color while decoding',async()=>{
 const h=photoFillHarness88();
 const task=h.fill.onclick();await photoFillReached88(()=>h.photoCalls.length===1);
 const color=h.find('Color');color.value='Orange';color.oninput();
 h.photoCalls[0].resolve({colorEstimate:'Blue'});
 await task;
 assert.equal(h.item.color,'Orange');
 assert.equal(h.item.colorSource,'user');
 assert.equal(h.modelCalls.length,0,'stale photo must not proceed to model inference');
 assert.deepEqual(h.ownerEdits,['color']);
});
test('P88 late recognition result cannot replace owner-corrected T-shirt versus blouse subtype',async()=>{
 const h=photoFillHarness88();
 const task=h.fill.onclick();await photoFillReached88(()=>h.photoCalls.length===1);
 h.photoCalls[0].resolve({colorEstimate:null});
 await photoFillReached88(()=>h.modelCalls.length===1);
 const type=h.find('Item type');type.value='Blouse';type.oninput();
 h.modelCalls[0].resolve({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}],details:{}});
 await task;
 assert.equal(h.item.itemType,'Blouse');
 assert.equal(h.item.category,'Tops');
 assert.deepEqual(h.ownerEdits,['itemType']);
});
test('P88 late model suggestion never crosses owner A to B, even renewed same-ID login and DB',async()=>{
 for(const kind of ['different-owner','renewed-login','new-db']){
  const h=photoFillHarness88(),task=h.fill.onclick();
  await photoFillReached88(()=>h.photoCalls.length===1);
  h.photoCalls[0].resolve({colorEstimate:null});
  await photoFillReached88(()=>h.modelCalls.length===1);
  if(kind==='different-owner'){
   h.c.window.closetAuth.user={id:'owner-B'};h.c.db={name:'closet-current-user-owner-B'};
  }else if(kind==='renewed-login')h.c.window.closetAuth.user={id:'owner-A'};
  else h.c.db={name:'closet-current-user-owner-A'};
  h.modelCalls[0].resolve({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}],details:{}});
  await task;
  assert.equal(h.item.itemType,'Unknown',kind);
  assert.equal(h.item.color,'Blue',kind);
  assert.equal(h.ownerEdits.length,0,kind);
 }
});
test('P88 late photo-fill suggestion ignores a replaced source photo or source-bound segmentation mask',async()=>{
 for(const kind of ['jpeg','recognition','mask','dialog-closed']){
  const h=photoFillHarness88(),task=h.fill.onclick();
  await photoFillReached88(()=>h.photoCalls.length===1);
  h.photoCalls[0].resolve({colorEstimate:null});
  await photoFillReached88(()=>h.modelCalls.length===1);
  if(kind==='jpeg')h.item.image='data:image/jpeg;base64,TkVX';
  else if(kind==='recognition')h.item.recognitionPhoto={image:'data:image/jpeg;base64,RlJBRw=='};
  else if(kind==='mask')h.item.segmentHint={componentReviewStatus:'unresolved'};
  else h.body.isConnected=false;
  h.modelCalls[0].resolve({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}],details:{}});
  await task;
  assert.equal(h.item.itemType,'Unknown',kind);
  assert.equal(h.ownerEdits.length,0,kind);
 }
});
test('P88 same owner photo-fill can still suggest subtype, while clearing prior photo review approval',async()=>{
 const h=photoFillHarness88({itemValues:{category:'Uncategorized',color:'Unknown',colorSource:'photo-estimate'}});
 // Construction starts one optional color estimate; resolve it first.
 await photoFillReached88(()=>h.photoCalls.length===1);
 h.photoCalls[0].resolve({colorEstimate:null});
 await photoFillReached88(()=>h.photoCalls.length===1);
 const task=h.fill.onclick();
 await photoFillReached88(()=>h.photoCalls.length===2);
 h.photoCalls[1].resolve({colorEstimate:'Blue'});
 await photoFillReached88(()=>h.modelCalls.length===1);
 h.modelCalls[0].resolve({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}],
  details:{sleeveLength:'Short sleeve'}});
 await task;
 assert.equal(h.item.category,'Tops');
 assert.equal(h.item.itemType,'T-shirt');
 assert.equal(h.item.color,'Blue');
 assert.ok(h.ownerEdits.includes('color'),'model-estimated color revokes prior owner review');
 assert.ok(h.ownerEdits.length>=2,'model-filled subtype revokes previous acknowledgement');
 assert.equal(h.fill.disabled,false);
});
test('P88 background photo-color estimate cannot override an owner edit while pending',async()=>{
 const h=photoFillHarness88({itemValues:{color:'Unknown',colorSource:'photo-estimate'}});
 await photoFillReached88(()=>h.photoCalls.length===1);
 const color=h.find('Color');color.value='Red';color.oninput();
 h.photoCalls[0].resolve({colorEstimate:'Green'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.item.color,'Red');
 assert.equal(h.item.colorSource,'user');
 assert.deepEqual(h.ownerEdits,['color']);
});

test('P88 late opt-in learning lookup cannot offer a model subtype after a manual correction',async()=>{
 const h=photoFillHarness88({learning:true});
 assert.equal(h.suggestionCalls.length,1);
 const type=h.find('Item type');type.value='Blouse';type.oninput();
 h.suggestionCalls[0].resolve({fields:{itemType:'T-shirt'},requiresConfirmation:true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.nodes.filter(x=>x.textContent==='Use owner-confirmed suggestion').length,0);
 assert.equal(h.item.itemType,'Blouse');
});
test('P88 opt-in learning proposal is source and signed-user scoped even before display',async()=>{
 for(const kind of ['owner','renewed','idb','photo','mask','closed']){
  const h=photoFillHarness88({learning:true});
  if(kind==='owner')h.c.window.closetAuth.user={id:'owner-B'};
  if(kind==='renewed')h.c.window.closetAuth.user={id:'owner-A'};
  if(kind==='idb')h.c.db={name:'closet-current-user-owner-A'};
  if(kind==='photo')h.item.image='data:image/jpeg;base64,TkVX';
  if(kind==='mask')h.item.segmentHint={componentReviewStatus:'unresolved'};
  if(kind==='closed')h.body.isConnected=false;
  h.suggestionCalls[0].resolve({fields:{itemType:'T-shirt'},requiresConfirmation:true});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.nodes.filter(x=>x.textContent==='Use owner-confirmed suggestion').length,0,kind);
 }
});
test('P88 late owner-learning apply cannot overwrite a newly corrected blouse subtype',async()=>{
 const h=photoFillHarness88({learning:true});
 h.suggestionCalls[0].resolve({fields:{itemType:'T-shirt'},requiresConfirmation:true});
 await photoFillReached88(()=>h.nodes.some(x=>x.textContent==='Use owner-confirmed suggestion'));
 const use=h.nodes.find(x=>x.textContent==='Use owner-confirmed suggestion');
 const pending=use.onclick();await photoFillReached88(()=>h.applicationCalls.length===1);
 const type=h.find('Item type');type.value='Blouse';type.oninput();
 h.applicationCalls[0].resolve({...h.item,itemType:'T-shirt'});
 await pending;
 assert.equal(h.item.itemType,'Blouse');
 assert.deepEqual(h.ownerEdits,['itemType']);
});
test('P88 late owner-learning apply cannot cross account, renewed session, IDB, original or mask',async()=>{
 for(const kind of ['owner','renewed','idb','photo','recognition','mask','closed']){
  const h=photoFillHarness88({learning:true});
  h.suggestionCalls[0].resolve({fields:{itemType:'T-shirt'},requiresConfirmation:true});
  await photoFillReached88(()=>h.nodes.some(x=>x.textContent==='Use owner-confirmed suggestion'));
  const use=h.nodes.find(x=>x.textContent==='Use owner-confirmed suggestion');
  const pending=use.onclick();await photoFillReached88(()=>h.applicationCalls.length===1);
  if(kind==='owner')h.c.window.closetAuth.user={id:'owner-B'};
  if(kind==='renewed')h.c.window.closetAuth.user={id:'owner-A'};
  if(kind==='idb')h.c.db={name:'closet-current-user-owner-A'};
  if(kind==='photo')h.item.image='data:image/jpeg;base64,TkVX';
  if(kind==='recognition')h.item.recognitionPhoto={image:'data:image/jpeg;base64,TkVX'};
  if(kind==='mask')h.item.segmentHint={componentReviewStatus:'unresolved'};
  if(kind==='closed')h.body.isConnected=false;
  h.applicationCalls[0].resolve({...h.item,itemType:'T-shirt'});
  await pending;
  assert.equal(h.item.itemType,'Unknown',kind);
  assert.equal(h.ownerEdits.length,0,kind);
 }
});
test('P88 current owner may apply opt-in learning suggestion while still requiring manual review',async()=>{
 const h=photoFillHarness88({learning:true});
 h.suggestionCalls[0].resolve({fields:{itemType:'T-shirt'},requiresConfirmation:true});
 await photoFillReached88(()=>h.nodes.some(x=>x.textContent==='Use owner-confirmed suggestion'));
 const use=h.nodes.find(x=>x.textContent==='Use owner-confirmed suggestion');
 const pending=use.onclick();await photoFillReached88(()=>h.applicationCalls.length===1);
 h.applicationCalls[0].resolve({...h.item,itemType:'T-shirt'});
 await pending;
 assert.equal(h.item.itemType,'T-shirt');
 assert.equal(h.ownerEdits.length,1,'model changes revoke prior editor acknowledgement');
 const count=h.applicationCalls.length;await use.onclick();
 assert.equal(h.applicationCalls.length,count,'stale suggestion must not replay after revision');
});
test('P88 legacy memory suggestion cannot override later owner edits or another session',async()=>{
 for(const kind of ['human','owner','photo','valid']){
  const h=photoFillHarness88({legacy:true});
  const use=h.nodes.find(x=>x.textContent==='Use suggested details');
  assert.ok(use,kind);
  if(kind==='human'){const type=h.find('Item type');type.value='Blouse';type.oninput();}
  if(kind==='owner')h.c.window.closetAuth.user={id:'owner-B'};
  if(kind==='photo')h.item.image='data:image/jpeg;base64,TkVX';
  use.onclick();
  assert.equal(h.item.itemType,kind==='human'?'Blouse':kind==='valid'?'T-shirt':'Unknown',kind);
  assert.equal(h.ownerEdits.length,kind==='human'||kind==='valid'?1:0,kind);
 }
});


test('P88 missing outfit garment action opens the native single-item path, never promotes a source receipt',()=>{
 const h=captureHarness({ownerId:'owner-A',autoStart:false});
 const seen=[],actions={append(button){h.node('outfitRecoverMissing88').button=button;}};
 const panel=h.node('outfitPieceActions');
 panel.querySelector=selector=>selector==='.actions'?actions:null;
 h.c.document={createElement:()=>({id:'',type:'',className:'',textContent:'',hidden:false,disabled:false}),
  getElementById:id=>id==='outfitRecoverMissing88'?(h.node(id).button||null):null};
 const source={id:'outfit-piece',outfitSourceId:'PHOTO-A',image:'data:image/jpeg;base64,UFJFU0VSVkVE',
  reconciliation70:{maskSha256:'a'.repeat(64)}};
 h.c.batch.push(source);
 h.c.db={name:'closet-current-user-owner-A'};
 h.c.setCaptureMode=mode=>seen.push('mode:'+mode);
 h.c.switchView=view=>seen.push('view:'+view);
 h.node('start').focus=()=>seen.push('focus:manual-photo');
 h.c.message=text=>seen.push('message:'+text);
 vm.runInContext("outfitActiveId='PHOTO-A'",h.c);
 h.c.renderOutfitCapture();
 const button=h.node('outfitRecoverMissing88').button;
 assert.ok(button,'actual outfit Review creates the recovery control');
 assert.equal(button.hidden,false);assert.equal(button.disabled,false);
 button.onclick();
 assert.deepEqual(seen.slice(0,3),['mode:single','view:scan','focus:manual-photo']);
 assert.match(seen[3],/Confirm its category, type and color in Review/);
 assert.equal(h.c.batch.length,1,'existing outfit source draft is retained');
 assert.equal(h.c.batch[0],source,'no new synthetic/worker garment was created');
 assert.equal(h.c.items.length,0,'no independent garment auto-save or 3D proof');
});
test('P88 missed-item action cannot carry source or owner permissions into a replacement session',()=>{
 const h=captureHarness({ownerId:'owner-A',autoStart:false});
 let button=null;let navigation=0;
 h.node('outfitPieceActions').querySelector=()=>({append:node=>{button=node;}});
 h.c.document={createElement:()=>({}),
  getElementById:id=>id==='outfitRecoverMissing88'?button:null};
 h.c.db={name:'closet-current-user-owner-A'};
 h.c.batch.push({id:'source',outfitSourceId:'PHOTO-A'});
 h.c.setCaptureMode=()=>navigation++;
 h.c.switchView=()=>navigation++;
 h.c.message=()=>navigation++;
 vm.runInContext("outfitActiveId='PHOTO-A'",h.c);
 h.c.renderOutfitCapture();assert.ok(button);assert.equal(button.disabled,false);
 h.c.window.closetAuth.user={id:'owner-A'}; // renewed same ID is distinct authorization
 button.onclick();assert.equal(navigation,0);
 assert.equal(button.disabled,true);
 // Opening Review again on the new signed session cannot re-enable a stale
 // private DB handle; a genuine new owner DB/ref must be separately validated.
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.renderOutfitCapture();assert.equal(button.hidden,true);
 assert.equal(navigation,0);
});


// P88 source-executed native background learning + exact signed-owner IDB
// tests. Synthetic fixtures; no blind human label / real account evidence.
function memoryLearningHarness88({modelGate=null,preflightGate=null,readGate=null}={}){
 const start=appSource.indexOf('let memoryReviewTimer=null,memoryReviewRunning=false;');
 const tag='setInterval(scheduleMemoryReview,60*60*1000);';
 const stop=appSource.indexOf(tag,start)+tag.length;
 assert.ok(start>0&&stop>start);
 const transactions=[],writes=[],reads=[],renders=[],modelCalls=[],queued=[];
 function makeDb(id,record){
  const rows=new Map([[record.id,structuredClone(record)]]);
  const db={name:'closet-current-user-'+id,rows,transaction(storeName,mode){
   transactions.push({db,storeName,mode});let store;
   const tx={oncomplete:null,onerror:null,onabort:null,objectStore(){
    return store??=(function(){
     return {get(key){
      const request={onsuccess:null,result:null};reads.push({db,key});
      Promise.resolve(readGate?.promise).then(()=>{
       request.result=rows.get(key);request.onsuccess?.();
       queueMicrotask(()=>tx.oncomplete?.());
      });return request;
     },put(value){const copy=structuredClone(value);writes.push({db,value:copy});rows.set(copy.id,copy);}};
    })();
   }};
   return tx;
  }};
  return db;
 }
 const owner={id:'A'},item={id:'garment-1',image:'data:image/jpeg;base64,QUFB',
  originalPhoto:{image:'data:image/jpeg;base64,QUFB'},
  recognitionPhoto:{image:'data:image/jpeg;base64,QUFB'},
  category:'Tops',itemType:'T-shirt',color:'Blue',confirmedDetails:true,
  recognitionMemory:null,learningReviewedWeek:'old'};
 const ownerDb=makeDb('A',item),otherDb=makeDb('B',item);
 const result={recognitionMemory:{good:true},strong:true,
  choices:[{category:'Tops',itemType:'T-shirt'}],details:{}};
 const c={window:{document:{},closetAuth:{user:owner}},db:ownerDb,items:[item],
  ClothingMemory:{week:()=> 'new-week',valid:x=>!!x?.good},
  ClothingDetails:{recognizedFields:()=>({})},
  busy:false,automaticRunning:false,localPending:new Set(),localReady:true,
  document:{hidden:false,querySelector(){return null;},addEventListener(){}},
  closetReady:{then(){}},enableLocal:async()=>true,
  localRequest(type,image){modelCalls.push({type,image});return modelGate?modelGate.promise:Promise.resolve(result);},
  segmentationAllows:()=>true,
  queued(work){queued.push(true);return Promise.resolve(preflightGate?.promise).then(work);},
  render(){renders.push(true);},setTimeout(){return 1;},setInterval(){},
  Promise,JSON,structuredClone,queueMicrotask};
 vm.createContext(c);vm.runInContext(appSource.slice(start,stop),c);
 return {c,owner,item,ownerDb,otherDb,result,writes,transactions,reads,renders,modelCalls,queued};
}
test('P88 background learning saves owner-review-only metadata in original owner database',async()=>{
 const h=memoryLearningHarness88();await h.c.reviewRecognitionMemory();
 assert.equal(h.writes.length,1);assert.equal(h.writes[0].db,h.ownerDb);
 assert.equal(h.writes[0].value.weeklySuggestion.requiresConfirmation,true);
 assert.equal(h.writes[0].value.itemType,'T-shirt');
 assert.equal(h.renders.length,1);
});
test('P88 late learning worker result cannot change account or show old clothing in B',async()=>{
 const gate=photoFillGated88(),h=memoryLearningHarness88({modelGate:gate});
 const task=h.c.reviewRecognitionMemory();
 await photoFillReached88(()=>h.modelCalls.length===1);
 h.c.window.closetAuth.user={id:'B'};h.c.db=h.otherDb;h.c.items=[{...h.item,category:'Shoes'}];
 gate.resolve(h.result);await task;
 assert.equal(h.writes.length,0);assert.equal(h.transactions.length,0);
 assert.equal(h.renders.length,0);assert.equal(h.c.items[0].category,'Shoes');
});
test('P88 same-ID login renewal and IDB replacement revoke pending learning worker',async()=>{
 for(const changed of ['owner','database']){
  const gate=photoFillGated88(),h=memoryLearningHarness88({modelGate:gate});
  const task=h.c.reviewRecognitionMemory();
  await photoFillReached88(()=>h.modelCalls.length===1);
  if(changed==='owner')h.c.window.closetAuth.user={id:'A'};
  else h.c.db={name:'closet-current-user-A',transaction(){assert.fail('stale database');}};
  gate.resolve(h.result);await task;
  assert.equal(h.writes.length,0,changed);assert.equal(h.transactions.length,0,changed);
  assert.equal(h.renders.length,0,changed);
 }
});
test('P88 cloud preflight invalidates old signed owner before learning IDB write',async()=>{
 const gate=photoFillGated88(),h=memoryLearningHarness88({preflightGate:gate});
 const task=h.c.reviewRecognitionMemory();
 await photoFillReached88(()=>h.queued.length===1);
 h.c.window.closetAuth.user={id:'B'};h.c.db=h.otherDb;gate.resolve();await task;
 assert.equal(h.transactions.length,0);assert.equal(h.writes.length,0);assert.equal(h.renders.length,0);
});
test('P88 switch during delayed IDB get cannot persist old account learning',async()=>{
 const gate=photoFillGated88(),h=memoryLearningHarness88({readGate:gate});
 const task=h.c.reviewRecognitionMemory();
 await photoFillReached88(()=>h.reads.length===1);
 h.c.window.closetAuth.user={id:'B'};h.c.db=h.otherDb;
 gate.resolve();await task;
 assert.equal(h.transactions.length,1);assert.equal(h.writes.length,0);assert.equal(h.renders.length,0);
});
test('P88 owner corrected type while model runs defeats stale weekly suggestion',async()=>{
 const gate=photoFillGated88(),h=memoryLearningHarness88({modelGate:gate});
 const task=h.c.reviewRecognitionMemory();await photoFillReached88(()=>h.modelCalls.length===1);
 h.item.itemType='Blouse';gate.resolve(h.result);await task;
 assert.equal(h.writes.length,0);assert.equal(h.item.itemType,'Blouse');
});
test('P88 private saved record changed subtype during queue: stale learning cannot commit',async()=>{
 const gate=photoFillGated88(),h=memoryLearningHarness88({preflightGate:gate});
 const task=h.c.reviewRecognitionMemory();await photoFillReached88(()=>h.queued.length===1);
 h.ownerDb.rows.get('garment-1').itemType='Blouse';gate.resolve();await task;
 assert.equal(h.transactions.length,1);assert.equal(h.writes.length,0);
 assert.equal(h.ownerDb.rows.get('garment-1').itemType,'Blouse');
});


// P88: execute exact native camera permission/play/capture handlers in a
// signed browser facade. This is not a physical Android/iPhone camera run.
function nativeCameraLeaseHarness88({audioGate=null,permissionGate=null,playGate=null}={}){
 const start=appSource.indexOf('function cameraOwnerLive88(');
 const stop=appSource.indexOf('function waitEvent(',start);
 assert.ok(start>0&&stop>start,'native camera owner lease controller located');
 const nodes=new Map(),photos=[],views=[],messages=[],intervals=[];
 const el=id=>{if(!nodes.has(id))nodes.set(id,{id,value:id==='interval'?'1':'',
  hidden:false,textContent:'',disabled:false,src:'',classList:{add(){},remove(){}}});return nodes.get(id);};
 const originalOwner={id:'owner-A'};
 const db={name:'closet-current-user-owner-A'};
 const tracks=[{stops:0,stop(){this.stops++;}}];
 const mediaStream={getTracks(){return tracks;}};
 let permissions=0,plays=0,audios=0;
 const video={readyState:3,videoWidth:1920,videoHeight:1080,srcObject:null,
  removeAttribute(){},classList:{add(){},remove(){}},
  play(){plays++;return playGate?playGate.promise:Promise.resolve();}};
 const c={
  window:{document:{},closetAuth:{user:originalOwner},AudioContext:class{
   resume(){audios++;return audioGate?audioGate.promise:Promise.resolve();}
  }},
  navigator:{mediaDevices:{getUserMedia(){permissions++;return permissionGate?permissionGate.promise:Promise.resolve(mediaStream);}}},
  db,batch:[],busy:false,stream:null,cameraOwnerLease88:null,cameraRequest:0,
  cameraOpening:false,cameraMode:null,timer:null,video,audio:null,
  session:0,lastCapture:0,lastSaved:null,stable:0,sessionCapturedIds:new Set(),
  cadence:null,canvas:{},lastPixels:null,
  $:el,controls(disabled){for(const name of ['start','startAuto','upload'])el(name).disabled=disabled;},
  snap(){return 'data:image/jpeg;base64,QUFB';},
  candidate(photo){photos.push(photo);c.session++;return true;},
  message(value){messages.push(value);},switchView(value){views.push(value);},
  beep(){},render(){},CaptureCadence:class{
   constructor(intervalMs,now){this.intervalMs=intervalMs;this.last=now;}
   due(){return true;}captured(now){this.last=now;}
  },
  Date,Number,Math,Error,
  clearInterval(){},setInterval(fn){intervals.push(fn);return intervals.length;},
  setTimeout(){return 1;},clearTimeout(){},
 };
 vm.createContext(c);vm.runInContext(appSource.slice(start,stop),c);
 return {c,el,db,originalOwner,mediaStream,tracks,photos,views,messages,
  get permissions(){return permissions;},get audios(){return audios;},
  get plays(){return plays;},intervals};
}
test('P88 pending camera permission may not admit A frame after owner switches to B',async()=>{
 const gate=photoFillGated88(),h=nativeCameraLeaseHarness88({permissionGate:gate});
 const task=h.c.startCamera('manual');
 await photoFillReached88(()=>h.permissions===1);
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 gate.resolve(h.mediaStream);await task;
 assert.equal(h.tracks[0].stops,1);
 assert.equal(h.photos.length,0);assert.equal(h.c.stream,null);
 assert.equal(h.c.cameraMode,null);assert.equal(h.views.length,0);
});
test('P88 same-ID renewed login during video.play revokes obtained camera stream',async()=>{
 const gate=photoFillGated88(),h=nativeCameraLeaseHarness88({playGate:gate});
 const task=h.c.startCamera('manual');
 await photoFillReached88(()=>h.plays===1);
 h.c.window.closetAuth.user={id:'owner-A'};
 gate.resolve();await task;
 assert.equal(h.tracks[0].stops,1);
 h.c.takePhoto();
 assert.equal(h.photos.length,0);assert.equal(h.c.cameraMode,null);
});
test('P88 swapped same-owner IDB during audio.resume stops before camera permission request',async()=>{
 const gate=photoFillGated88(),h=nativeCameraLeaseHarness88({audioGate:gate});
 const task=h.c.startCamera('manual');
 await photoFillReached88(()=>h.audios===1);
 h.c.db={name:'closet-current-user-owner-A'};
 gate.resolve();await task;
 assert.equal(h.permissions,0);assert.equal(h.photos.length,0);
 assert.equal(h.c.cameraMode,null);assert.equal(h.c.busy,false);
});
test('P88 active owner manual camera capture retains original only as review draft',async()=>{
 const h=nativeCameraLeaseHarness88();
 await h.c.startCamera('manual');
 h.c.takePhoto();
 assert.deepEqual(h.photos,['data:image/jpeg;base64,QUFB']);
 assert.equal(h.c.session,1);
 h.c.finishScan();
 assert.deepEqual(h.views,['review']);assert.equal(h.tracks[0].stops,1);
});
test('P88 switched owner invalidates active automatic camera before next frame',async()=>{
 const h=nativeCameraLeaseHarness88();
 await h.c.startCamera('auto');
 const initial=h.photos.length;assert.equal(initial,1);
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.captureTick();
 assert.equal(h.photos.length,initial);
 assert.equal(h.tracks[0].stops,1);
 assert.equal(h.views.length,0);
});
test('P88 switched owner Done cannot snap or paint original camera Review under B',async()=>{
 const h=nativeCameraLeaseHarness88();
 await h.c.startCamera('manual');
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.finishScan();
 assert.equal(h.photos.length,0);assert.equal(h.views.length,0);
 assert.equal(h.tracks[0].stops,1);
});

test('P88 stale camera playback cannot erase replacement owner capture count or preview',async()=>{
 const gate=photoFillGated88(),h=nativeCameraLeaseHarness88({playGate:gate});
 const task=h.c.startCamera('manual');
 await photoFillReached88(()=>h.plays===1);
 h.c.window.closetAuth.user={id:'owner-B'};
 h.c.db={name:'closet-current-user-owner-B'};
 h.c.session=7;h.el('sessionCount').textContent='7';
 h.el('lastCaptureImage').hidden=false;
 gate.resolve();await task;
 assert.equal(h.c.session,7);
 assert.equal(h.el('sessionCount').textContent,'7');
 assert.equal(h.el('lastCaptureImage').hidden,false);
 assert.equal(h.photos.length,0);assert.equal(h.views.length,0);
});

test('P88 cancelled pending camera releases busy before browser permission resolves',async()=>{
 const gate=photoFillGated88(),h=nativeCameraLeaseHarness88({permissionGate:gate});
 const task=h.c.startCamera('manual');
 await photoFillReached88(()=>h.permissions===1);
 h.c.stopCamera();
 assert.equal(h.c.busy,false,'cancel must allow another capture/import immediately');
 gate.resolve(h.mediaStream);await task;
 assert.equal(h.tracks[0].stops,1);
});
test('P88 cancelled permission callback cannot unlock a newer pending camera request',async()=>{
 const oldGate=photoFillGated88(),newGate=photoFillGated88();
 const h=nativeCameraLeaseHarness88({permissionGate:oldGate});
 const oldTask=h.c.startCamera('manual');
 await photoFillReached88(()=>h.permissions===1);
 h.c.stopCamera();
 assert.equal(h.c.busy,false);
 let newPermission=false;
 h.c.navigator.mediaDevices.getUserMedia=()=>{newPermission=true;return newGate.promise;};
 const newTask=h.c.startCamera('manual');
 await photoFillReached88(()=>newPermission);
 oldGate.resolve(h.mediaStream);await oldTask;
 assert.equal(h.c.busy,true,'only the current permission request owns busy');
 assert.equal(h.el('start').disabled,true);
 const newTrack={stops:0,stop(){this.stops++;}};
 const newStream={getTracks:()=>[newTrack]};
 newGate.resolve(newStream);await newTask;
 assert.equal(h.c.stream,newStream);assert.equal(h.c.busy,false);
 assert.equal(newTrack.stops,0);h.c.stopCamera();
});
test('P88 cancelled audio resume cannot release a newer import busy state',async()=>{
 const gate=photoFillGated88(),h=nativeCameraLeaseHarness88({audioGate:gate});
 const task=h.c.startCamera('manual');
 await photoFillReached88(()=>h.audios===1);
 h.c.stopCamera();assert.equal(h.c.busy,false);
 h.c.busy=true;h.el('upload').disabled=true;
 gate.resolve();await task;
 assert.equal(h.c.busy,true);assert.equal(h.el('upload').disabled,true);
 assert.equal(h.permissions,0);assert.equal(h.photos.length,0);
});


// P88 reviewed draft commits are CREATE-only. A stale or colliding draft ID
// cannot replace an existing physical closet record via IndexedDB put().
// This source-executed test uses a synthetic IDB collision, NOT live accounts.
test('P88 ordinary reviewed draft ID collision preserves existing closet row and unsaved photo',async()=>{
 const start=appSource.indexOf('function savePiece('),stop=appSource.indexOf('function node(',start);
 const helpers=appSource.indexOf('function reviewedExactPhotoPeers88(');
 const end=appSource.indexOf('function empty(',helpers);
 assert.ok(start>=0&&stop>start&&helpers>stop&&end>helpers);
 const native=appSource.slice(start,stop)+appSource.slice(helpers,end);
 const photo='data:image/jpeg;base64,TkVX';
 const saved={id:'captured-id',image:'data:image/jpeg;base64,T0xE',
  category:'Outerwear',itemType:'Jacket',color:'Red'};
 const source={id:'captured-id',image:photo,category:'Tops',
  itemType:'T-shirt',color:'Blue',userAdjusted:true};
 const previous=structuredClone(saved),draftBefore=structuredClone(source);
 const owner={id:'owner-A'},savedRows=new Map([[saved.id,structuredClone(saved)]]);
 let savedDraft={id:'draft',batch:[structuredClone(source)]};
 const operations=[];
 const draftStoreRevision88=JSON.stringify(savedDraft.batch);
 const db={name:'closet-current-user-owner-A',transaction(stores,mode){
  assert.deepEqual(Array.from(stores),['items','state']);
  assert.equal(mode,'readwrite');
  let aborted=false;
  const tx={oncomplete:null,onabort:null,onerror:null,abort(){aborted=true;queueMicrotask(()=>tx.onabort?.());},objectStore(name){
   if(name==='items')return {
    getAll(){const req={result:[...savedRows.values()].map(x=>structuredClone(x))};
     queueMicrotask(()=>req.onsuccess?.());return req;},
    add(value){operations.push('items.add');
     if(savedRows.has(value.id))throw Error('ConstraintError: key already exists');
     savedRows.set(value.id,structuredClone(value));},
    put(value){operations.push('items.put');savedRows.set(value.id,structuredClone(value));}
   };
   if(name==='state')return {
    get(key){assert.equal(key,'draft');
     const req={result:structuredClone(savedDraft)};
     queueMicrotask(()=>req.onsuccess?.());
     return req;},
    put(value){operations.push('state.put');savedDraft=structuredClone(value);queueMicrotask(()=>{if(!aborted)tx.oncomplete?.();});}
   };
   throw Error('Unexpected store');
  }};
  return tx;
 }};
 const c={window:{closetAuth:{user:owner}},db,items:[saved],batch:[source],
  structuredClone,draftStoreRevision88,queued:async fn=>fn()};
 vm.createContext(c);vm.runInContext(native,c);
 const lease=c.reviewedSaveLease88(source);
 await assert.rejects(c.savePiece({...source},[],lease),/ConstraintError/);
 assert.deepEqual(operations,['items.add'],'draft collision must not run state write');
 assert.deepEqual(savedRows.get(saved.id),previous,'existing owner garment remains intact');
 assert.deepEqual(savedDraft.batch,[draftBefore],'unsaved reviewed source remains recoverable');
});
test('P88 reviewed original cannot erase another tab new private draft during save',async()=>{
 const start=appSource.indexOf('function savePiece('),stop=appSource.indexOf('function node(',start);
 const begin=appSource.indexOf('function reviewedExactPhotoPeers88(');
 const end=appSource.indexOf('function empty(',begin);
 const old={id:'reviewed-A',image:'data:image/jpeg;base64,QUFB',
  category:'Tops',itemType:'T-shirt',color:'Blue'};
 const other={id:'second-owner-photo',image:'data:image/jpeg;base64,QkJC'};
 const user={id:'owner-A'},writes=[],savedRows=new Map();
 let remote={id:'draft',batch:[old]};
 const db={name:'closet-current-user-owner-A',transaction(stores){
  assert.deepEqual(Array.from(stores),['items','state']);
  let aborted=false;
  const tx={objectStore(name){
   if(name==='items')return {getAll(){const req={result:[...savedRows.values()].map(x=>structuredClone(x))};queueMicrotask(()=>req.onsuccess?.());return req;},add(v){writes.push(v);savedRows.set(v.id,v);}};
   if(name==='state')return {
    get(key){assert.equal(key,'draft');
     const req={result:structuredClone(remote)};
     queueMicrotask(()=>req.onsuccess?.());
     return req;},
    put(v){remote=structuredClone(v);queueMicrotask(()=>{if(!aborted)tx.oncomplete?.();});}
   };
  },abort(){aborted=true;queueMicrotask(()=>tx.onabort?.());}};
  return tx;
 }};
 const c={window:{closetAuth:{user}},db,items:[],batch:[old],
  draftStoreRevision88:JSON.stringify(remote.batch),
  structuredClone,queued:async fn=>fn()};
 vm.createContext(c);vm.runInContext(appSource.slice(start,stop)+appSource.slice(begin,end),c);
 const lease=c.reviewedSaveLease88(old);
 remote={id:'draft',batch:[old,other]}; // different tab captured a new photo
 await assert.rejects(c.savePiece({...old},[],lease),
  /P88_DRAFT_STORAGE_CHANGED/);
 assert.equal(writes.length,0,'original not admitted after unsaved list divergence');
 assert.deepEqual(remote.batch,[old,other],'new second-tab photo stays recoverable');
});

test('P88 ordinary fresh-ID reviewed save inserts rather than overwrites a closet row',async()=>{
 const start=appSource.indexOf('function savePiece('),stop=appSource.indexOf('function node(',start);
 const helpers=appSource.indexOf('function reviewedExactPhotoPeers88(');
 const end=appSource.indexOf('function empty(',helpers);
 const source={id:'new-id',image:'data:image/jpeg;base64,TkVX',
  category:'Tops',itemType:'T-shirt',color:'Blue'};
 const owner={id:'owner-A'},operations=[];
 let savedDraft={id:'draft',batch:[structuredClone(source)]};
 const db={name:'closet-current-user-owner-A',transaction(){
  const tx={oncomplete:null,onabort:null,onerror:null,objectStore(name){
   return {getAll(){assert.equal(name,'items');const req={result:[]};queueMicrotask(()=>req.onsuccess?.());return req;},add(value){operations.push(name+'.add:'+value.id);},
    get(id){assert.equal(id,'draft');const req={result:structuredClone(savedDraft)};
     queueMicrotask(()=>req.onsuccess?.());return req;},
    put(value){operations.push(name+'.put:'+value.id);
     if(name==='state'){savedDraft=structuredClone(value);queueMicrotask(()=>tx.oncomplete?.());}}};
  }};
  return tx;
 }};
 const c={window:{closetAuth:{user:owner}},db,items:[],batch:[source],
  structuredClone,draftStoreRevision88:JSON.stringify(savedDraft.batch),queued:async fn=>fn()};
 vm.createContext(c);vm.runInContext(appSource.slice(start,stop)+appSource.slice(helpers,end),c);
 await c.savePiece({...source},[],c.reviewedSaveLease88(source));
 assert.deepEqual(operations,['items.add:new-id','state.put:draft'],
  'new item ID must be insert-only; the captured draft is cleared atomically');
});
