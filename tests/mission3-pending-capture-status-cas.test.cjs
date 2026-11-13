'use strict';
// Execute production app.js draft mutation handlers against actual fake-indexeddb
// transactions; synthetic original JPEGs and signed owners only. NO DEPLOY.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {randomUUID}=require('node:crypto');
const vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const source=readFileSync('public/app.js','utf8');
function part(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a, 'Source region '+start);
 return source.slice(a,b);
}
const cas=part('function commitReviewedDraftCAS(', 'function persistDraft(');
const writer=part('function persistDraft(', 'function readDraft(');
const candidate=part('function candidate(image,options={}){','function queueAutomatic(item){');
const recognition=part('async function recognizeItem(item){','async function recognizeBatch(){');
const first='data:image/jpeg;base64,/9j/AAA=',second='data:image/jpeg;base64,/9j/BBB=';
const sha='a'.repeat(64);
async function open(owner){
 return new Promise((ok,fail)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('state',{keyPath:'id'});
   r.result.createObjectStore('items',{keyPath:'id'});
  };
  r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);
 });
}
async function read(db){
 return new Promise((ok,fail)=>{
  const r=db.transaction('state').objectStore('state').get('draft');
  r.onsuccess=()=>ok(r.result?.batch||[]);r.onerror=()=>fail(r.error);
 });
}
async function put(db,rows){
 return new Promise((ok,fail)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'draft',batch:rows});
  tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
 });
}
function proof(image,owner){return {
 image,sourceSHA256:sha,sourceHashVerified:true,
 originalPhoto:{image,sha256:sha},ownerId:owner
};}
function harness(db,owner){
 const ctx={db,items:[],batch:[],session:0,
  window:{closetAuth:{user:{id:owner},assertCurrent(){if(this.user?.id!==owner)throw Error('Signed owner revoked');}}},
  captureOperationEpoch:0,sessionCapturedIds:new Set(),failedDraftCaptures:new Set(),
  nativeCanonical167Active:true,captureProof01Active:true,index04ResearchActive:false,
  crypto:{randomUUID},structuredClone,JSON,Set,Map,Promise,Error,Date,
  normalizeClothing:item=>({...item}),messages:[],events:[],localPending:new Set(),
  localReady:true,recognitionUnavailable:false,recognitionState:{phase:'idle',activeId:null},
  $:()=>({textContent:'',hidden:false,src:''}),
  recordDeviceEvent:()=>{},render:()=>{},
  message(t){ctx.messages.push(t);},
  captureProofOwner:()=>ctx.window.closetAuth.user?.id===owner&&ctx.db===db?owner:null,
  ClothingDetails:{fillColor:item=>({...item})},
  checkPhoto:async()=>({blank:false,signature:'synthetic',aspect:1,colorEstimate:null}),
  localRequest:async()=>({choices:[{category:'Tops',itemType:'Shirt'}],strong:false,details:{}}),
  enableLocal:async()=>{},segmentationAllows:()=>true,
  saveIndexed:async()=>false,applyLocalChoice:()=>{},
  queueAutomatic:item=>ctx.events.push('queued:'+item.id),
  ownerWardrobeMutationLease(){
   const epoch=ctx.captureOperationEpoch;
   return {ownerDB:db,assertLease(){
    ctx.window.closetAuth.assertCurrent();
    if(ctx.captureOperationEpoch!==epoch||ctx.db!==db||
       ctx.window.closetAuth.user?.id!==owner)throw Error('Owner lease revoked');
   }};
  }
 };
 let queued=Promise.resolve(),blockWrites=false;
 ctx.queued=fn=>{
  const current=queued.then(()=>{
   if(blockWrites)throw Error('Simulated device quota');
   return fn();
  });
  queued=current.catch(()=>{});return current;
 };
 vm.createContext(ctx);for(const code of [cas,writer,candidate,recognition])vm.runInContext(code,ctx);
 return {ctx,open:img=>ctx.candidate(img,{sourceProof:proof(img,owner),requireDraftCommit:true}),
  drain:()=>queued,failWrites:flag=>blockWrites=flag,
  revoke:()=>{ctx.captureOperationEpoch++;ctx.window.closetAuth.user=null;}};
}
test('two independently loaded same-owner tabs append, not overwrite, original JPEGs',async()=>{
 const owner=randomUUID(),aDB=await open(owner),bDB=await open(owner);
 try{
  const a=harness(aDB,owner),b=harness(bDB,owner);
  assert.equal(await a.open(first),true);assert.equal(await b.open(second),true);
  const rows=await read(bDB);
  assert.equal(rows.length,2);assert.deepEqual(rows.map(x=>x.image),[first,second]);
  assert.deepEqual(rows.map(x=>x.originalPhoto.image),[first,second]);
 }finally{aDB.close();bDB.close();}
});
test('same-owner recognition status CAS preserves second-tab photo and source proof',async()=>{
 const owner=randomUUID(),aDB=await open(owner),bDB=await open(owner);
 try{
  const a=harness(aDB,owner),b=harness(bDB,owner);
  assert.equal(await a.open(first),true);
  let release;const blocked=new Promise(ok=>release=ok);
  a.ctx.checkPhoto=()=>blocked;
  const pending=a.ctx.recognizeItem(a.ctx.batch[0]);
  assert.equal(await b.open(second),true);
  release({blank:false,signature:'recognition-only',aspect:1,colorEstimate:null});
  assert.equal(await pending,true);await a.drain();
  const rows=await read(bDB);
  assert.equal(rows.length,2);
  assert.equal(rows[1].originalPhoto.image,second);
  assert.equal(rows[0].originalPhoto.image,first);
  assert.match(rows[0].localStatus,/Confirm garment category and color/);
 }finally{aDB.close();bDB.close();}
});
test('recognition of a stale source never overwrites second-tab human correction',async()=>{
 const owner=randomUUID(),aDB=await open(owner),bDB=await open(owner);
 try{
  const a=harness(aDB,owner),b=harness(bDB,owner);
  await a.open(first);
  let release;const blocked=new Promise(ok=>release=ok);
  a.ctx.checkPhoto=()=>blocked;
  const recognition=a.ctx.recognizeItem(a.ctx.batch[0]);
  const current=(await read(bDB))[0],revised={...current,color:'owner-confirmed teal'};
  await b.ctx.commitReviewedDraftCAS([{before:current,after:revised}]);
  release({blank:false,signature:'stale',aspect:1,colorEstimate:null});
  await recognition;await a.drain();
  assert.equal((await read(bDB))[0].color,'owner-confirmed teal');
  assert.equal((await read(bDB))[0].originalPhoto.image,first);
  assert.match(a.ctx.messages.join(' '),/could not be backed up/);
 }finally{aDB.close();bDB.close();}
});
test('recognition blank-photo removal deletes exact draft only and preserves other-tab JPEG',async()=>{
 const owner=randomUUID(),aDB=await open(owner),bDB=await open(owner);
 try{
  const a=harness(aDB,owner),b=harness(bDB,owner);
  await a.open(first);await b.open(second);
  a.ctx.checkPhoto=async()=>({blank:true});
  await a.ctx.recognizeItem(a.ctx.batch[0]);await a.drain();
  const rows=await read(aDB);
  assert.deepEqual(rows.map(x=>x.image),[second]);assert.equal(rows[0].originalPhoto.image,second);
 }finally{aDB.close();bDB.close();}
});
test('same-owner new ID collision cannot overwrite a saved garment',async()=>{
 const owner=randomUUID(),db=await open(owner);
 try{
  const f=harness(db,owner),frozen={id:'saved-id',ownerId:owner,image:first,
   originalPhoto:{image:first,sha256:sha},sourceSHA256:sha};
  await new Promise((ok,fail)=>{
   const tx=db.transaction('items','readwrite');
   tx.objectStore('items').add(frozen);
   tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
  });
  await assert.rejects(f.ctx.persistDraft({required:true,mode:'insert',record:frozen}),e=>
   e.code==='CAPTURE_STORAGE_FAILED'&&String(e.cause?.message).includes('COLLISION'));
  assert.deepEqual(await read(db),[]);
 }finally{db.close();}
});
test('another tab captures the same original, so a different ID is rejected conservatively',async()=>{
 const owner=randomUUID(),aDB=await open(owner),bDB=await open(owner);
 try{
  const a=harness(aDB,owner),b=harness(bDB,owner);
  await a.open(first);
  await assert.rejects(b.open(first),e=>e.code==='CAPTURE_STORAGE_FAILED'&&
   String(e.cause?.message).includes('DUPLICATE_SOURCE'));
  assert.equal((await read(aDB)).length,1);
  assert.equal(b.ctx.batch.length,1,'Do not delete unsaved local source after rejection');
 }finally{aDB.close();bDB.close();}
});
test('failed original capture retries exactly its own ID without deleting another tab row',async()=>{
 const owner=randomUUID(),aDB=await open(owner),bDB=await open(owner);
 try{
  const a=harness(aDB,owner),b=harness(bDB,owner);
  a.failWrites(true);
  await assert.rejects(a.open(first),e=>e.code==='CAPTURE_STORAGE_FAILED');
  assert.equal(a.ctx.failedDraftCaptures.size,1);
  a.failWrites(false);await b.open(second);
  const pending=a.ctx.batch[0];
  const retried=await a.ctx.persistDraft({required:true,mode:'insert',record:pending,retry:true});
  assert.equal(retried,true);
  const rows=await read(aDB);assert.equal(rows.length,2);
  assert.deepEqual(rows.map(x=>x.image),[second,first]);
  assert.equal(rows[0].originalPhoto.image,second);
 }finally{aDB.close();bDB.close();}
});
test('retry cannot resurrect an existing changed or already saved review record',async()=>{
 const owner=randomUUID(),db=await open(owner);
 try{
  const f=harness(db,owner),old={id:'draft-id',ownerId:owner,image:first,
   originalPhoto:{image:first,sha256:sha},sourceSHA256:sha};
  await put(db,[{...old,color:'user-confirmed'}]);
  f.ctx.failedDraftCaptures.add(old.id);
  await assert.rejects(f.ctx.persistDraft({required:true,mode:'insert',record:old,retry:true}),
   e=>e.code==='CAPTURE_STORAGE_FAILED'&&String(e.cause?.message).includes('STALE'));
  assert.equal((await read(db))[0].color,'user-confirmed');
 }finally{db.close();}
});
test('default no-argument persistence refuses silent whole draft rewrite',async()=>{
 const owner=randomUUID(),db=await open(owner);
 try{
  const f=harness(db,owner);await f.open(first);
  await assert.rejects(f.ctx.persistDraft(),/no rejection|./);
  assert.equal((await read(db)).length,1);
 }finally{db.close();}
});
test('stale owner epoch cannot enqueue new draft, including same account re-login',async()=>{
 const owner=randomUUID(),db=await open(owner);
 try{
  const f=harness(db,owner);
  const row={id:'not-saved',ownerId:owner,image:first,sourceSHA256:sha,
   originalPhoto:{image:first,sha256:sha}};
  const mutation=f.ctx.persistDraft({required:true,mode:'insert',record:row});
  f.ctx.captureOperationEpoch++;
  await assert.rejects(mutation,e=>e.code==='CAPTURE_STORAGE_FAILED');
  assert.deepEqual(await read(db),[]);
 }finally{db.close();}
});
test('source identity and original bytes cannot be changed by draft status writes',async()=>{
 const owner=randomUUID(),db=await open(owner);
 try{
  const f=harness(db,owner);await f.open(first);
  const prior=(await read(db))[0];
  const modified={...prior,originalPhoto:{image:second,sha256:sha}};
  assert.equal(await f.ctx.persistDraft({mode:'update',expected:prior,record:modified}),false);
  assert.equal((await read(db))[0].originalPhoto.image,first);
 }finally{db.close();}
});
test('app contains no old unscoped persistDraft calls or whole-batch write',()=>{
 const sourceCalls=source.match(/persistDraft\([^)]*\)/g)||[];
 assert.ok(sourceCalls.length>=5);
 assert.ok(!sourceCalls.includes('persistDraft()'));
 assert.doesNotMatch(writer,/state'\)\.put\(\{id:'draft',batch:snapshot\}\)/);
 assert.match(candidate,/mode:'insert',record:item/);
 assert.match(recognition,/mode:'update',expected:expectedDraftForRecognition/);
 assert.match(recognition,/mode:'remove',expected:expectedDraftForRecognition/);
});
