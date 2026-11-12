'use strict';
// Exact source-extracted mobile media lifecycle. Simulated identity, deferred
// media metadata/photo decode, no real family files, no remote service.
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8'),
 photo=fs.readFileSync('public/photo-import.js','utf8');
function slice(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Missing runtime source '+start);
 return source.slice(a,b);
}
const source=[
 slice(photo,'async function readPhotoBatch(','\n}').replace(/\n}\s*$/,'\n}'), // overwritten below by full source
 slice(app,'async function upload(file){',"$('upload').onchange="),
 slice(app,'async function importClothingPhotos(files){',"$('clothingPhotos').onchange="),
 slice(app,'function pauseCameraOnInterruption(){',"document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseCameraOnInterruption();});")
];
// Source readPhotoBatch ends at the end of photo-import.js.
source[0]=photo.slice(photo.indexOf('async function readPhotoBatch('));
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const flush=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
function fixture(){
 const logs=[],control=[],revoked=[],events=[],metadata=defer(),decoded=defer();
 let readyToDecode=false,decodeCount=0,candidates=0,stops=0,rendered=0;
 const dom={captureState:{textContent:''}};
 const video={
  src:'',load(){events.push('video-load');},pause(){events.push('video-pause');},
  removeAttribute(name){if(name==='src')this.src='';},
  getAttribute(name){return name==='src'?this.src:null;}
 };
 const auth={user:{id:'synthetic-A'},assertCurrent(){}};
 const ctx={
  captureOperationEpoch:0,mediaLifecycleEpoch:0,videoImportSerial:0,videoImportActive:false,
  photoImportSerial:0,photoImportActive:false,stream:null,cameraOpening:false,cameraRequest:0,
  captureProofTaking:false,busy:false,session:0,captureProof01Active:true,
  mobileCameraToCloset75Active:true,document:{hidden:false},video,
  db:{name:'closet-current-user-synthetic-A'},batch:[],items:[],
  window:{closetAuth:auth},$:(id)=>dom[id]||{disabled:false,textContent:'',value:'',hidden:false},
  render:()=>{rendered++;},controls:v=>control.push(v),message:v=>logs.push(v),
  URL:{createObjectURL:()=>{events.push('video-url');return 'blob:synthetic';},
   revokeObjectURL:u=>revoked.push(u)},
  stopCamera(){stops++;ctx.cameraOpening=false;ctx.stream=null;},
  waitEvent:()=>metadata.promise,
  readPhotoBatch:undefined,
  captureProofOwner:()=>ctx.window.closetAuth.user.id,
  captureProofFromFile:async()=>{
   decodeCount++;if(!readyToDecode)await decoded.promise;
   return {image:'data:image/jpeg;base64,/9j/'};},
  candidate:async()=>{candidates++;return true;},
  switchView:v=>events.push('view-'+v),
  readPhotoBatchOriginal:undefined,
  photoToJPEG:async()=>{},
  Promise,Error,URLSearchParams,Date,clearInterval,
  readAllFrom:async()=>[],renderOutfitBoard:()=>{},
 };
 vm.createContext(ctx);
 vm.runInContext(source.join('\n'),ctx);
 return {ctx,logs,control,revoked,events,metadata,decoded,flush,
  get candidates(){return candidates},get decodeCount(){return decodeCount},
  get rendered(){return rendered},get stops(){return stops},
  setDecoded(){readyToDecode=true;decoded.resolve();},
  switchOwner({same=false}={}){ctx.captureOperationEpoch++;
   if(!same){auth.user.id='synthetic-B';ctx.db={name:'closet-current-user-synthetic-B'};}
  },
  triggerVideo:()=>ctx.upload({size:300}),triggerPhotos:()=>ctx.importClothingPhotos([{name:'shirt.jpeg',type:'image/jpeg',size:1024}]),
  interrupt:()=>{ctx.document.hidden=true;const result=ctx.pauseCameraOnInterruption();ctx.document.hidden=false;return result;}
 };
}
test('video metadata in-flight is revoked on pagehide even when page instantly becomes visible',async()=>{
 const f=fixture(),old=f.triggerVideo();await flush();
 assert.equal(f.ctx.videoImportActive,true);assert.equal(f.ctx.busy,true);
 assert.equal(f.interrupt(),true);
 assert.equal(f.ctx.mediaLifecycleEpoch,1);assert.equal(f.ctx.videoImportActive,false);
 assert.equal(f.ctx.busy,false);assert.ok(f.revoked.includes('blob:synthetic'));
 f.metadata.resolve();await old;
 assert.equal(f.candidates,0);assert.equal(f.ctx.busy,false);
 assert.match(f.logs.at(-1),/Video import stopped/);
});
test('interrupted video source is paused and URL revoked before old metadata resolves',async()=>{
 const f=fixture(),old=f.triggerVideo();await flush();f.interrupt();
 assert.ok(f.events.includes('video-pause'));
 assert.equal(f.ctx.video.getAttribute('src'),'');
 assert.equal(f.revoked[0],'blob:synthetic');
 f.metadata.resolve();await old;
});
test('old video finalizer cannot unlock a newly started gallery import',async()=>{
 const f=fixture(),video=f.triggerVideo();await flush();f.interrupt();
 const gallery=f.triggerPhotos();await flush();
 assert.equal(f.ctx.photoImportActive,true);
 assert.equal(f.ctx.busy,true);
 f.metadata.resolve();await video;
 assert.equal(f.ctx.photoImportActive,true);assert.equal(f.ctx.busy,true);
 f.setDecoded();await gallery;
 assert.equal(f.ctx.busy,false);assert.equal(f.candidates,1);
});
test('gallery decoded photo is ignored after a brief hidden->visible interruption',async()=>{
 const f=fixture(),gallery=f.triggerPhotos();await flush();
 assert.equal(f.decodeCount,1);
 const oldEpoch=f.ctx.mediaLifecycleEpoch;assert.equal(f.interrupt(),true);
 assert.equal(f.ctx.mediaLifecycleEpoch,oldEpoch+1);
 f.setDecoded();await gallery;
 assert.equal(f.candidates,0);assert.equal(f.ctx.photoImportActive,false);
 assert.equal(f.ctx.busy,false);
});
test('gallery decode from owner A cannot import into owner B after relogin',async()=>{
 const f=fixture(),gallery=f.triggerPhotos();await flush();f.switchOwner();f.setDecoded();
 await gallery;
 assert.equal(f.candidates,0);
 assert.equal(f.ctx.window.closetAuth.user.id,'synthetic-B');
});
test('gallery decode from same-ID relogin is also revoked',async()=>{
 const f=fixture(),gallery=f.triggerPhotos();await flush();f.switchOwner({same:true});f.setDecoded();
 await gallery;assert.equal(f.candidates,0);
});
test('current owner can start and finish a fresh gallery import after interrupted one',async()=>{
 const f=fixture(),old=f.triggerPhotos();await flush();f.interrupt();f.setDecoded();await old;
 const fresh=f.triggerPhotos();await fresh;
 assert.equal(f.candidates,1);
 assert.equal(f.ctx.photoImportActive,false);assert.equal(f.ctx.busy,false);
 assert.ok(f.events.includes('view-review'));
});
test('unrelated pagehide increments epoch but does not report a nonexistent capture',()=>{
 const f=fixture();assert.equal(f.interrupt(),false);
 assert.equal(f.ctx.mediaLifecycleEpoch,1);
 assert.equal(f.logs.length,0);assert.equal(f.revoked.length,0);
});
test('simultaneously active camera and gallery are stopped once, and both tokens revoked',async()=>{
 const f=fixture(),gallery=f.triggerPhotos();await flush();
 f.ctx.stream={getTracks:()=>[]};const oldSerial=f.ctx.photoImportSerial;
 f.interrupt();f.setDecoded();await gallery;
 assert.equal(f.stops>=2,true);
 assert.ok(f.ctx.photoImportSerial>oldSerial);
 assert.equal(f.candidates,0);
});
test('gallery canceled by rapid background can never release controls of a new video',async()=>{
 const f=fixture(),gallery=f.triggerPhotos();await flush();f.interrupt();
 const video=f.triggerVideo();await flush();
 assert.equal(f.ctx.videoImportActive,true);assert.equal(f.ctx.busy,true);
 f.setDecoded();await gallery;
 assert.equal(f.ctx.videoImportActive,true);assert.equal(f.ctx.busy,true);
 f.metadata.resolve();await video;
 assert.equal(f.ctx.videoImportActive,false);assert.equal(f.ctx.busy,false);
});
