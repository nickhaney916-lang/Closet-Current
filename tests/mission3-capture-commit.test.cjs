'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const source=readFileSync((process.env.CAPTURE_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const fragments=[
 source.slice(source.indexOf('function captureProofOwner(){'),source.indexOf('async function captureProofFromJPEG(')),
 source.slice(source.indexOf('function persistDraft('),source.indexOf('function readDraft(')),
 source.slice(source.indexOf('function candidate('),source.indexOf('function queueAutomatic('))
];
async function open(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,1);
  req.onupgradeneeded=()=>{req.result.createObjectStore('state',{keyPath:'id'});req.result.createObjectStore('items',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
function read(db){
 return new Promise(resolve=>{
  const req=db.transaction('state').objectStore('state').get('draft');
  req.onsuccess=()=>resolve(req.result||null);
 });
}
async function harness(){
 const owner=randomUUID(),other=randomUUID(),db=await open(owner),foreign=await open(other),messages=[],recognized=[];
 let hold=null,fail=false,queue=Promise.resolve();
 const window={closetAuth:{user:{id:owner},assertCurrent(){if(!this.user?.id)throw Error('locked');}}};
 const c={window,db,items:[],batch:[],sessionCapturedIds:new Set(),session:0,
  crypto:{randomUUID},structuredClone,window,console,
  recordDeviceEvent(){},queueAutomatic:item=>recognized.push(item.id),
  message:text=>messages.push(text),$:()=>({textContent:'',hidden:false,src:''}),
  queued(work){const x=queue.then(async()=>{
   if(hold)await hold;
   if(fail){const error=Error('storage quota');error.name='QuotaExceededError';throw error;}
   return work();
  });queue=x.catch(()=>{});return x;}
 };
 vm.createContext(c);
 vm.runInContext(readFileSync('public/taxonomy.js','utf8'),c);
 for(const fragment of fragments)vm.runInContext(fragment,c);
 const proof=()=>({sourceHashVerified:true,sourceSHA256:'a'.repeat(64),
  originalPhoto:{image:'data:image/jpeg;base64,/9j/',sha256:'a'.repeat(64)}});
 return {owner,other,db,foreign,c,proof,messages,recognized,read:()=>read(db),
  setHold(p){hold=p;},setFail(v){fail=v;},
  close(){db.close();foreign.close();}
 };
}
test('camera original is not acknowledged before its owner-private review transaction commits',async()=>{
 const f=await harness();
 try{
  let release;const gate=new Promise(r=>release=r);f.setHold(gate);
  const result=f.c.candidate('photo-one',{sourceProof:f.proof(),requireDraftCommit:true});
  let settled=false;Promise.resolve(result).then(()=>settled=true,()=>settled=true);
  await new Promise(setImmediate);assert.equal(settled,baseline?true:false);
  if(baseline){
   // Old candidate immediately returned true; it did not await the queued write.
   assert.equal(result,true);
  }else{
   assert.equal(typeof result.then,'function');
   assert.equal(f.recognized.length,0,'automatic recognition cannot run before durable draft commit');
  }
  release();
  assert.equal(await result,true);
  const stored=await f.read();
  assert.equal(stored.batch.length,1);
  assert.equal(stored.batch[0].originalPhoto.sha256,'a'.repeat(64));
  assert.equal(f.recognized.length,1);
 }finally{f.close();}
});

test('quota failure never reports a successful private camera capture or loses its visible review candidate',async()=>{
 const f=await harness();
 try{
  f.setFail(true);
  const value=f.c.candidate('photo-quota',{sourceProof:f.proof(),requireDraftCommit:true});
  if(baseline)assert.equal(value,true);
  else{
   await assert.rejects(Promise.resolve(value),e=>e.code==='CAPTURE_STORAGE_FAILED');
   assert.equal(f.recognized.length,0);
  }
  assert.equal(f.c.batch.length,1,'keep unsaved source visible for user recovery');
  assert.equal(await f.read(),null,'failed commit must leave no durable state row');
 }finally{f.close();}
});

test('pending camera commit refuses switched owner/database before new account writes',async()=>{
 const f=await harness();
 try{
  let release;const gate=new Promise(r=>release=r);f.setHold(gate);
  const result=f.c.candidate('photo-lease',{sourceProof:f.proof(),requireDraftCommit:true});
  f.c.window.closetAuth.user={id:f.other};f.c.db=f.foreign;
  release();
  if(baseline)assert.equal(result,true);
  else await assert.rejects(result,e=>e.code==='CAPTURE_STORAGE_FAILED');
  assert.equal(await read(f.foreign),null,'no cross-owner draft insertion');
 }finally{f.close();}
});

test('legacy synchronous callers keep Boolean candidate result without requiring a new await',async()=>{
 const f=await harness();
 try{
  const accepted=f.c.candidate('photo-old',{sourceProof:f.proof()});
  assert.equal(accepted,true);
 }finally{f.close();}
});

test('photo import distinguishes failed IndexedDB commit from unreadable JPEG input',async()=>{
 const c={};
 vm.createContext(c);
 const imp=readFileSync('public/photo-import.js','utf8');
 vm.runInContext(imp.slice(imp.indexOf('async function readPhotoBatch(')),c);
 const files=[{name:'not-backed-up.jpg',type:'image/jpeg',size:1024}];
 const result=await c.readPhotoBatch(files,async()=> 'valid-photo',async()=>{
  throw Object.assign(Error('quota exceeded'),{code:'CAPTURE_STORAGE_FAILED'});
 });
 assert.equal(result.added,0);
 assert.equal(result.results[0].status,'error');
 if(!baseline)assert.match(result.errors.join(' '),/not saved to device/);
});
