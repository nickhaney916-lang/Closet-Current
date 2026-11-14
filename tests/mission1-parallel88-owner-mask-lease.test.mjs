// Mission #88 source-executed experimental worker/draft/owner mask veto tests.
// Synthetic segmentation logits and fake worker: no new real-model accuracy data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
function captureHarness({ownerId=null,autoStart=true,decode=null}={}){
 const nodes=new Map(),timers=new Map();let sequence=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:''});return nodes.get(id);};
 const c={URL,location:{href:'https://example.test/closet?outfitInstances840=1'},
  ...(ownerId?{window:{closetAuth:{user:{id:ownerId}}}}:{}),
  $:node,batch:[],items:[],localPending:new Set(),busy:false,session:0,recognitionAssetVersion:'research',
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  crypto:{randomUUID:()=> 'id-'+(++sequence)},
  Date:{now:()=>1000},photoToJPEG:decode||(async()=> 'data:image/jpeg;base64,NEWPHOTO'),setTimeout(fn,delay){const id=++sequence;timers.set(id,{fn,delay});return id;},
  clearTimeout:id=>timers.delete(id),stopCamera(){},controls(){},
  candidate(image,options){c.batch.push({id:'piece-'+(++sequence),image,...options,
   requiresOwnershipConfirmation:!!options.outfitSourceId});return true;},
  render(){c.renderOutfitCapture();},switchView(){},structuredClone,
  closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),
  Worker:class{constructor(){c.worker=this;}postMessage(request){this.request=request;}terminate(){this.closed=true;}}
 };
 vm.createContext(c);vm.runInContext(captureSource,c);
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
