'use strict';
// Execute the actual app call-site and photo-import batch reader from an
// immutable baseline or current HEAD; do not duplicate either algorithm.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=process.env.CAMERA_SOURCE_ROOT||'.';
const baseline=process.env.EXPECT_BASELINE==='1';
const photo=fs.readFileSync(root+'/public/photo-import.js','utf8');
const app=fs.readFileSync(root+'/public/app.js','utf8');
const reader=photo.slice(photo.indexOf('async function readPhotoBatch('));
const from=app.indexOf('async function importClothingPhotos(files){');
const to=app.indexOf("$('clothingPhotos').onchange",from);
assert.ok(from>=0&&to>from&&reader.startsWith('async function readPhotoBatch('));
const gallery=app.slice(from,to);
const files=[
 {name:'first.jpg',type:'image/jpeg',size:128},
 {name:'second.jpg',type:'image/jpeg',size:128},
 {name:'third.png',type:'image/png',size:128}
];
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});promise.catch(()=>{});return {promise,resolve,reject};}
function context(ctx){vm.createContext(ctx);vm.runInContext(reader,ctx);return ctx;}
test('revocation after first owner photo stops every remaining JPEG decode',async()=>{
 let active=true;const decoded=[],accepted=[];
 const ctx=context({});
 const result=await ctx.readPhotoBatch(files,async file=>{decoded.push(file.name);return file.name;},
 async(_,file)=>{accepted.push(file.name);active=false;return false;},{shouldContinue:()=>active});
 assert.deepEqual(decoded,baseline?files.map(f=>f.name):['first.jpg']);
 assert.deepEqual(accepted,baseline?files.map(f=>f.name):['first.jpg']);
 assert.equal(result.results.filter(r=>r.status==='duplicate').length,baseline?3:0);
 assert.equal(result.cancelled,baseline?undefined:true);
});
test('owner switch while first decode awaits never calls old owner candidate',async()=>{
 const pending=deferred(),visited=[];let active=true;
 const ctx=context({});
 const task=ctx.readPhotoBatch(files,async file=>{visited.push('decode:'+file.name);return pending.promise;},
 async(_img,file)=>{visited.push('candidate:'+file.name);return true;},{shouldContinue:()=>active});
 active=false;pending.resolve('decoded-image');await task;
 assert.equal(visited.includes('candidate:first.jpg'),baseline);
 assert.equal(visited.includes('decode:second.jpg'),baseline);
});
test('revocation during candidate await produces no misleading duplicate or next decode',async()=>{
 const pending=deferred(),entered=deferred(),decoded=[],called=[];let active=true;
 const ctx=context({});
 const task=ctx.readPhotoBatch(files,async file=>{decoded.push(file.name);return file.name;},
 async(_img,file)=>{called.push(file.name);entered.resolve();return pending.promise;},{shouldContinue:()=>active});
 // Wait for the real decoder/candidate boundary, not an assumed number of
 // foreign-VM microtask hops (which varies across Node versions).
 await entered.promise;
 assert.deepEqual(called,['first.jpg']);
 active=false;pending.resolve(false);
 const result=await task;
 assert.deepEqual(decoded,baseline?files.map(f=>f.name):['first.jpg']);
 assert.equal(result.results.length,baseline?3:0);
 assert.equal(result.cancelled,baseline?undefined:true);
});
test('normal current-owner multi-photo import preserves accepted, duplicate, rejected and error receipts',async()=>{
 const selected=[files[0],{name:'duplicate.jpg',type:'image/jpeg',size:128},
 {name:'wrong.txt',type:'text/plain',size:5},
 {name:'bad.jpg',type:'image/jpeg',size:128}];
 const ctx=context({});
 const result=await ctx.readPhotoBatch(selected,
 async file=>{if(file.name==='bad.jpg')throw Error('unsupported image');return file.name;},
 async(_img,file)=>file.name!=='duplicate.jpg',{shouldContinue:()=>true});
 assert.equal(result.added,1);
 assert.deepEqual(Array.from(result.results,x=>x.status),['added','duplicate','rejected','error']);
 assert.equal(result.cancelled,undefined);
 assert.match(result.errors.join(' '),/not an image/);
 assert.match(result.errors.join(' '),/could not open/);
});
function galleryFixture({onFirst='switch',sameUser=false}={}){
 let owner='owner-a';const dbA={name:'closet-current-user-owner-a'},dbB={name:'closet-current-user-'+(sameUser?'owner-a':'owner-b')};
 const decoded=[],candidates=[],events=[],window={__lastPhotoImportResult:'new-owner-import'};
 const ctx={
  captureOperationEpoch:0,mediaLifecycleEpoch:0,photoImportSerial:0,photoImportActive:false,
  document:{hidden:false},busy:false,session:0,db:dbA,batch:[],
  captureProof01Active:true,mobileCameraToCloset75Active:false,
  captureProofOwner:()=>owner,
  captureProofFromFile:async file=>{decoded.push(file.name);return {image:file.name,originalPhoto:{image:file.name}};},
  candidate:async image=>{
   candidates.push(image);
   if(candidates.length===1&&onFirst==='switch'){
    owner=sameUser?'owner-a':'owner-b';ctx.captureOperationEpoch++;ctx.db=dbB;
    ctx.busy=true;events.push('new owner entered');
   }
   return true;
  },
  stopCamera:()=>events.push('stop'),controls:v=>events.push('controls:'+v),
  message:v=>events.push('message:'+v),switchView:v=>events.push('view:'+v),
  render:()=>events.push('render'),window
 };
 context(ctx);vm.runInContext(gallery,ctx);
 return {ctx,decoded,candidates,events,window};
}
test('actual app gallery caller immediately stops old account batch after switch',async()=>{
 const f=galleryFixture();
 await f.ctx.importClothingPhotos(files);
 assert.deepEqual(f.decoded,baseline?files.map(x=>x.name):['first.jpg']);
 assert.deepEqual(f.candidates,['first.jpg']);
 assert.equal(f.window.__lastPhotoImportResult,'new-owner-import');
 assert.equal(f.ctx.busy,true,'old finally must not release next-owner capture controls');
 assert.equal(f.events.includes('controls:false'),false);
});
test('sign-out and sign-back-in as same owner revokes earlier selected file batch',async()=>{
 const f=galleryFixture({sameUser:true});
 await f.ctx.importClothingPhotos(files);
 assert.deepEqual(f.decoded,baseline?files.map(x=>x.name):['first.jpg']);
 assert.deepEqual(f.candidates,['first.jpg']);
 assert.equal(f.ctx.busy,true);
});
test('normal same-owner gallery import still confirms all selected photos and opens review',async()=>{
 const f=galleryFixture({onFirst:'none'});
 await f.ctx.importClothingPhotos(files);
 assert.deepEqual(f.decoded,files.map(x=>x.name));
 assert.deepEqual(f.candidates,files.map(x=>x.name));
 assert.equal(f.window.__lastPhotoImportResult.added,3);
 assert.equal(f.window.__lastPhotoImportResult.cancelled,undefined);
 assert.equal(f.events.includes('view:review'),true);
 assert.equal(f.ctx.busy,false);
});
