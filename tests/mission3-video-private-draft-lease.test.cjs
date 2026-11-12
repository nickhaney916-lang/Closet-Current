'use strict';
// Mission 3 P-video: execute the actual app.js video uploader in a controlled
// Node VM to compare the precise verified parent and current private draft lease.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');

const parent=process.env.EXPECT_BASELINE==='1';
const source=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const begin=source.indexOf('async function upload(file){');
const end=source.indexOf("$('upload').onchange",begin);
assert.ok(begin>=0&&end>begin,'native video import function not found');
const realUpload=source.slice(begin,end);
function deferred(){
 let resolve,reject;
 const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail;});
 promise.catch(()=>{}); // verified old fire-and-forget must not crash test process
 return {promise,resolve,reject};
}
function fixture({pauseAtSeek=false}={}){
 const elements=new Map(),calls=[],commit=deferred();
 let owner='11111111-1111-4111-8111-111111111111';
 const database={name:'closet-current-user-'+owner};
 const element=id=>{
  if(!elements.has(id))elements.set(id,{
   value:id==='interval'?'10':'',hidden:false,textContent:'',
   classList:{add(){},remove(){}}
  });
  return elements.get(id);
 };
 const doc={hidden:false};
 const ctx={
  busy:false,batch:[],session:0,captureOperationEpoch:0,captureProof01Active:true,db:database,
  captureProofOwner:()=>owner,document:doc,
  stopCamera(){calls.push('stop')},
  controls(flag){calls.push('controls:'+flag)},
  video:{duration:0.4,videoWidth:1024,videoHeight:768,
   src:'',classList:{add(){}},load(){},removeAttribute(){}},
  $:element,
  URL:{createObjectURL:()=> 'blob:video-only',revokeObjectURL:()=>calls.push('revoke')},
  waitEvent(_element,kind){if(kind==='seeked'&&pauseAtSeek)doc.hidden=true;return Promise.resolve();},
  snap:()=> 'data:image/jpeg;base64,/9j/',
  captureProofFromJPEG:async(_image,_dimensions,signedOwner)=>({
   image:'verified-JPEG-frame',sourceHashVerified:true,ownerId:signedOwner
  }),
  candidate(_image,options){
   calls.push('candidate');
   assert.equal(options?.sourceProof?.image,'verified-JPEG-frame');
   if(!parent)assert.equal(options.requireDraftCommit,true,'must await the durable owner transaction');
   ctx.batch.push({id:'pending-frame'});ctx.session++;
   return commit.promise;
  },
  render(){calls.push('render')},
  message(value){calls.push('message:'+value)},
  switchView(value){calls.push('view:'+value)},
  console
 };
 vm.createContext(ctx);
 vm.runInContext(realUpload,ctx,{timeout:2000});
 return {ctx,calls,commit,setOwner(x){owner=x;},doc};
}
const ticks=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};

test('old uploader acknowledges video before owner draft commits; current waits',async()=>{
 const f=fixture();let done=false;
 const operation=f.ctx.upload({size:500,name:'only-test.mp4'}).then(()=>{done=true;});
 await ticks();
 assert.equal(f.calls.includes('candidate'),true);
 assert.equal(done,parent,'do not switch to review before the private write completed');
 assert.equal(f.calls.includes('view:review'),parent);
 f.commit.resolve(true);await operation;
 assert.equal(done,true);
 assert.equal(f.calls.includes('view:review'),true);
 assert.equal(f.calls.includes('revoke'),true);
});
test('device quota failure retains visible unconfirmed frame; never reports success',async()=>{
 if(parent)return;
 const f=fixture();
 const operation=f.ctx.upload({size:500,name:'only-test.mp4'});
 await ticks();
 assert.equal(f.calls.includes('view:review'),false);
 f.commit.reject(Object.assign(Error('device quota exceeded'),{code:'CAPTURE_STORAGE_FAILED'}));
 await operation;
 const messages=f.calls.filter(x=>x.startsWith('message:'));
 assert.ok(messages.some(x=>/not confirmed|not saved|quota/i.test(x)));
 assert.ok(!messages.some(x=>/frames saved for private review/i.test(x)));
 assert.equal(f.calls.includes('view:review'),true);
});
test('hidden page after video seek cannot process a private camera frame',async()=>{
 const f=fixture({pauseAtSeek:true});
 await f.ctx.upload({size:500});
 // Existing baseline unconditionally processed hidden video; the current
 // implementation must refuse it BEFORE creating a review candidate.
 assert.equal(f.calls.includes('candidate'),parent);
 assert.equal(f.calls.some(x=>x.startsWith('message:')&&/background/i.test(x)),!parent);
});
test('changed owner before loaded video frame cannot publish private draft',async()=>{
 if(parent)return;
 const f=fixture();
 const original=f.ctx.captureProofFromJPEG;
 f.ctx.captureProofFromJPEG=async(...args)=>{
  const proof=await original(...args);
  f.setOwner('22222222-2222-4222-8222-222222222222');
  return proof;
 };
 await f.ctx.upload({size:500});
 assert.equal(f.calls.includes('candidate'),false);
 assert.equal(f.calls.some(x=>x.includes('account change')),false,
  'a revoked former owner must not show an old video error in the next owner session');
});
