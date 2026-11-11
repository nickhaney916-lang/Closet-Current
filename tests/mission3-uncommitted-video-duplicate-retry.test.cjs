'use strict';
// Mission 3: execute the exact browser candidate() function from public/app.js.
// Compare the pinned accepted browser parent with the new retry behavior.
// No live owners, hosted auth, external network, or customer photographs.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');

const parent=process.env.EXPECT_BASELINE==='1';
const source=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const start=source.indexOf('function candidate(image,options={}){');
const end=source.indexOf('function queueAutomatic(item){',start);
assert.ok(start>=0&&end>start,'actual native app candidate source must exist');
const actualCandidate=source.slice(start,end);
const image='data:image/jpeg;base64,/9j/';
const sha='a'.repeat(64);
const ownerA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ownerB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const proof={image,sourceSHA256:sha,sourceHashVerified:true,
 originalPhoto:{image,sha256:sha}};
const opts={sourceProof:proof,requireDraftCommit:true,importFilename:'sample-video.mp4'};
function fixture(){
 const batch=[],items=[],failedDraftCaptures=new Set();
 const sessionCapturedIds=new Set(),writes=[],events=[],queue=[];
 let owner=ownerA,mode='quota';
 const elements=new Map(),$=id=>{
  if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,src:''});
  return elements.get(id);
 };
 const context={
  nativeCanonical167Active:true,captureProof01Active:true,
  captureProofOwner(){return owner;},failedDraftCaptures,batch,items,sessionCapturedIds,
  session:0,$,crypto:{randomUUID},structuredClone,
  normalizeClothing:x=>({...x}),message:x=>events.push(x),
  persistDraft({required}){
   assert.equal(required,true);writes.push({owner,ids:batch.map(x=>x.id)});
   return mode==='quota'?Promise.reject(Object.assign(Error('quota reached'),{code:'CAPTURE_STORAGE_FAILED'})):Promise.resolve();
  },
  queueAutomatic(item){queue.push(item.id);},
  console
 };
 vm.createContext(context);vm.runInContext(actualCandidate,context);
 return {context,batch,failedDraftCaptures,sessionCapturedIds,writes,events,queue,
  setMode:x=>mode=x,setOwner:x=>owner=x};
}

test('parent loses identical video retry; updated app reuses same owner row and commits',async()=>{
 const f=fixture();
 await assert.rejects(f.context.candidate(image,opts),e=>e.code==='CAPTURE_STORAGE_FAILED');
 assert.equal(f.batch.length,1);
 assert.equal(f.writes.length,1);
 const id=f.batch[0].id;
 if(!parent)assert.equal(f.failedDraftCaptures.has(id),true);
 f.setMode('saved');
 const result=await f.context.candidate(image,opts);
 assert.equal(result,parent?false:true);
 assert.equal(f.writes.length,parent?1:2);
 assert.equal(f.batch.length,1);
 assert.equal(f.batch[0].id,id);
 assert.equal(f.context.session,1);
 assert.equal(f.sessionCapturedIds.size,1);
 assert.equal(f.queue.length,parent?0:1);
 if(!parent){
  assert.equal(f.failedDraftCaptures.has(id),false);
  assert.match(f.events.at(-1),/now saved/);
  assert.equal(f.context.candidate(image,opts),false,'already committed photo is a duplicate');
  assert.equal(f.writes.length,2);
 }
});
test('repeated failed owner retry preserves one visible row and a durable warning',async()=>{
 if(parent)return;
 const f=fixture();
 await assert.rejects(f.context.candidate(image,opts),/quota reached/);
 await assert.rejects(f.context.candidate(image,opts),/quota reached/);
 assert.equal(f.batch.length,1);assert.equal(f.writes.length,2);
 assert.equal(f.failedDraftCaptures.has(f.batch[0].id),true);
 f.setMode('saved');
 assert.equal(await f.context.candidate(image,opts),true);
 assert.equal(f.writes.length,3);
 assert.equal(f.context.session,1);
});
test('foreign signed owner cannot retry another owner private unsaved frame',async()=>{
 if(parent)return;
 const f=fixture();
 await assert.rejects(f.context.candidate(image,opts),/quota reached/);
 f.setMode('saved');f.setOwner(ownerB);
 assert.equal(f.context.candidate(image,opts),false);
 assert.equal(f.writes.length,1);
 assert.equal(f.failedDraftCaptures.size,1);
 assert.equal(f.queue.length,0);
});
test('wrong source SHA or unverified source cannot clear failed draft marker',async()=>{
 if(parent)return;
 const f=fixture();
 await assert.rejects(f.context.candidate(image,opts),/quota reached/);
 f.setMode('saved');
 for(const modified of [
  {...proof,sourceHashVerified:false},
  {...proof,sourceSHA256:'b'.repeat(64)},
  {...proof,originalPhoto:{...proof.originalPhoto,sha256:'b'.repeat(64)}},
  {...proof,originalPhoto:{...proof.originalPhoto,image:'data:image/jpeg;base64,AAAA'}}
 ]){
  assert.equal(f.context.candidate(image,{sourceProof:modified,requireDraftCommit:true}),false);
  assert.equal(f.writes.length,1);
 }
 assert.equal(f.failedDraftCaptures.size,1);
 assert.equal(await f.context.candidate(image,opts),true);
 assert.equal(f.failedDraftCaptures.size,0);
});
test('ephemeral pending draft retries are cleared on owner session lock',()=>{
 if(parent)return;
 assert.match(source,/db=null;items=\[\];batch=\[\];failedDraftCaptures\.clear\(\)/);
});
