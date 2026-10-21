'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/photo-import.js','utf8');
const importSource=fs.readFileSync('public/app.js','utf8');
const code=source.slice(source.indexOf('async function readPhotoBatch('));
const handler=importSource.slice(importSource.indexOf('async function importClothingPhotos('),importSource.indexOf("$('clothingPhotos').onchange="));
const file=(name,size=100,type='image/jpeg')=>({name,size,type});
function harness(){
 const seen=[],views=[],messages=[],queued=[];
 const state={
  window:{closetAuth:{user:{id:'person-one'}}},
  busy:false,session:0,batch:[],items:[],
  $:()=>({}),stopCamera(){},controls(){},
  switchView:name=>views.push(name),
  message:name=>messages.push(name),
  candidate(image){const item={image};state.batch.push(item);queued.push(item);return true;},
  photoToJPEG:async file=>'data:image/jpeg;base64,'+file.name,
  readPhotoBatch:undefined
 };
 vm.createContext(state);
 vm.runInContext(code,state);
 vm.runInContext(handler,state);
 return {state,seen,views,messages,queued};
}
test('standard two-photo import remains complete and keeps expected review flow',async()=>{
 const h=harness();
 await h.state.importClothingPhotos([file('top.jpeg'),file('shoes.jpg')]);
 assert.equal(h.state.batch.length,2);
 assert.deepEqual(h.state.batch.map(x=>x.importFilename),['top.jpeg','shoes.jpg']);
 assert.deepEqual(h.views,['review']);
 assert.equal(h.state.busy,false);
 assert.equal(h.state.window.__lastPhotoImportResult.added,2);
 assert.equal(h.state.window.__lastPhotoImportResult.cancelled,false);
});
test('first photo decoding completion after signout cannot enqueue garment under new user',async()=>{
 const h=harness();let resolve;
 h.state.photoToJPEG=()=>new Promise(r=>resolve=r);
 const running=h.state.importClothingPhotos([file('user-a.jpg'),file('not-read.jpg')]);
 h.state.window.closetAuth.user.id='person-two';
 resolve('data:image/jpeg;base64,SECRET_A');
 await running;
 assert.equal(h.queued.length,0);
 assert.deepEqual(h.views,[]);
 assert.equal(h.state.window.__lastPhotoImportResult.cancelled,true);
 assert.deepEqual(Array.from(h.state.window.__lastPhotoImportResult.results),[]);
 assert.ok(h.messages.at(-1).includes('account changed'));
 assert.equal(h.state.busy,false);
});
test('switch during second photo decode preserves earlier frames but never admits stale later photos',async()=>{
 const h=harness(),decoded=[];
 let unblock;
 h.state.photoToJPEG=async f=>{
  decoded.push(f.name);
  if(f.name==='second.jpg')return new Promise(r=>unblock=r);
  return 'data:image/jpeg;base64,'+f.name;
 };
 const running=h.state.importClothingPhotos([file('first.jpg'),file('second.jpg'),file('third.jpg')]);
 for(let i=0;i<12&&!unblock;i++)await Promise.resolve();
 assert.equal(h.queued.length,1);
 h.state.window.closetAuth.user.id='person-two';
 unblock('data:image/jpeg;base64,STALE');
 await running;
 assert.equal(h.queued.length,1);
 assert.deepEqual(decoded,['first.jpg','second.jpg']);
 assert.deepEqual(h.views,[]);
 assert.equal(h.state.window.__lastPhotoImportResult.cancelled,true);
});
test('a decoder exception after account change is cancelled rather than leaking an old filename/error',async()=>{
 const h=harness();let reject;
 h.state.photoToJPEG=()=>new Promise((_,r)=>reject=r);
 const running=h.state.importClothingPhotos([file('private_filename_person_one.heic')]);
 h.state.window.closetAuth.user.id='person-two';
 reject(Error('private_image_data'));
 await running;
 assert.equal(h.state.window.__lastPhotoImportResult.cancelled,true);
 assert.deepEqual(Array.from(h.state.window.__lastPhotoImportResult.errors),[]);
 assert.equal(h.messages.join(' ').includes('private_filename_person_one'),false);
});
test('unsigned users are refused before file conversion and there is no new batch',async()=>{
 const h=harness();h.state.window.closetAuth.user=null;
 await h.state.importClothingPhotos([file('private.jpg')]);
 assert.equal(h.queued.length,0);
 assert.deepEqual(h.views,[]);
 assert.ok(h.messages.some(x=>x.includes('Sign in')));
});
test('old diagnostic object resets immediately when new import starts, so prior filenames cannot be read as current status',async()=>{
 const h=harness();h.state.window.__lastPhotoImportResult={added:1,results:[{name:'old-name.jpg'}]};
 let resolve;h.state.photoToJPEG=()=>new Promise(r=>resolve=r);
 const running=h.state.importClothingPhotos([file('new.jpg')]);
 assert.equal(h.state.window.__lastPhotoImportResult,null);
 resolve('data:image/jpeg;base64,NEW');await running;
 assert.equal(h.state.window.__lastPhotoImportResult.added,1);
 assert.equal(h.state.window.__lastPhotoImportResult.results[0].name,'new.jpg');
});
test('the generic batch helper accepts a cancellation callback without breaking old 3-argument callers',async()=>{
 const h=harness();let current=true,processed=0;
 const images=[file('a.jpg'),file('b.jpg')];
 const out=await h.state.readPhotoBatch(images,async f=>'decoded',async()=>{processed++;current=false;return true;},{isCurrent:()=>current});
 assert.equal(out.cancelled,true);
 assert.equal(processed,1);
 assert.equal(out.results.length,0,'Do not claim completed photo after owner no longer current');
 const valid=await h.state.readPhotoBatch([file('c.jpg')],async()=> 'ok',async()=>true);
 assert.equal(valid.cancelled,false);assert.equal(valid.added,1);
});
