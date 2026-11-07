import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {createLocalRemoteFence134,LOCAL_REMOTE_FENCE_134}
 from '../research/local-remote-consent-fence-134/owner-local-remote-fence.mjs';

const sha=async x=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',x))]
 .map(v=>v.toString(16).padStart(2,'0')).join('');
const data=x=>'data:image/jpeg;base64,'+Buffer.from(x).toString('base64');
const reply=(status,body,bytes)=>({
 ok:status>=200&&status<300,status,
 json:async()=>body,
 arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)
});
function idb(id){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+id,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
function store(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('write failed'));
 });
}
function fetchRow(db,store,id){
 return new Promise((resolve,reject)=>{
  const r=db.transaction(store,'readonly').objectStore(store).get(id);
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function setup({confirm=async()=>true,onRemoteRead=async()=>{},onUpload=async()=>{}}={}){
 const ownerId=randomUUID(),otherId=randomUUID();
 const db=await idb(ownerId),original=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const meta=await sharp(original).metadata();
 const cutout=await sharp(original).extract({
  left:0,top:0,width:Math.floor(meta.width*.55),
  height:Math.floor(meta.height*.65)
 }).jpeg({quality:88}).toBuffer();
 const originalSHA=await sha(original),cutoutSHA=await sha(cutout);
 assert.notEqual(originalSHA,cutoutSHA);
 const item={
  id:'owner-134-shirt',ownerId,
  image:data(original),originalPhoto:{image:data(original),sha256:originalSHA},
  sourceSHA256:originalSHA,sourceHashVerified:true,sourcePhotoOriginal:true,
  humanReviewedSource:true,singleGarmentVerified:false,
  outfitSourceId:'owner-reviewed-134',cutoutSHA256:cutoutSHA,
  segmentHint:{
   verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalSHA,cutoutSHA256:cutoutSHA,
   cutoutImage:data(cutout)
  },
  category:'Tops',itemType:'T-shirt',color:'Green',colorSource:'user',
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,
  confirmedColor:true,reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  threeDReady:false
 };
 await store(db,'items',item);
 await store(db,'state',{id:'outfit-board',current:{slots:{top:item.id}},
  saved:[{id:'p134-owned-look',ownerId,name:'Private outfit',
   slots:{top:item.id}}]});
 const session={user:{id:ownerId},token:'p134-deterministic-unsigned-token-long',active:true};
 const auth={
  user:session.user,
  assertCurrent(){if(!session.active)throw Error('owner session revoked');},
  async getAccessToken(){if(!session.active)throw Error('owner session revoked');return session.token;}
 };
 let remote=null,readCount=0,writeCount=0,uploadCount=0;
 const objects=new Map(),requests=[];
 const remotePath='/rest/v1/closet_backups?owner_id=eq.'+
  encodeURIComponent(ownerId)+'&select=owner_id,revision,document';
 const transport=async(url,opts={})=>{
  requests.push({url,method:opts.method||'GET'});
  assert.equal(opts.headers?.Authorization,'Bearer '+session.token);
  assert.equal(opts.headers?.apikey,'p134-research-anon');
  if(url.includes('/storage/v1/object/closet-private/')){
   const path=decodeURIComponent(url.split('/closet-private/')[1]);
   if(!path.startsWith(ownerId+'/'))return reply(403,{});
   if(opts.method==='POST'){
    uploadCount++;
    await onUpload({uploadCount,db,session,ownerId});
    if(objects.has(path))return reply(409,{});
    objects.set(path,new Uint8Array(opts.body));return reply(200,{});
   }
   return objects.has(path)?reply(200,{},objects.get(path)):reply(404,{});
  }
  if(url.endsWith(remotePath)){
   readCount++;
   await onRemoteRead({readCount,db,session,ownerId});
   return reply(200,remote?[structuredClone(remote)]:[]);
  }
  if(url.endsWith('/rest/v1/rpc/save_closet_backup')){
   writeCount++;
   const body=JSON.parse(opts.body),current=remote?.revision||0;
   if(body.p_expected_revision!==current)return reply(200,null);
   if(body.p_document.ownerId!==ownerId)return reply(403,{});
   remote={owner_id:ownerId,revision:current+1,document:body.p_document};
   return reply(200,remote.revision);
  }
  return reply(404,{});
 };
 let lastPrompt=null;
 const service=createLocalRemoteFence134({
  auth,db,baseURL:'https://research.invalid',anonKey:'p134-research-anon',
  subtle:webcrypto.subtle,fetcher:transport,
  confirmReplace:async prompt=>{lastPrompt=prompt;return confirm(prompt);},
  confirmRestore:async()=>false
 });
 return {db,service,session,ownerId,otherId,requests,objects,originalSHA,cutoutSHA,
  get remote(){return remote;},set remote(v){remote=v;},
  get readCount(){return readCount;},
  get writeCount(){return writeCount;},
  get uploadCount(){return uploadCount;},
  get lastPrompt(){return lastPrompt;},
  async changeItem(fn){
   const before=await fetchRow(db,'items',item.id);
   await store(db,'items',fn(structuredClone(before)));
  },
  async changeBoard(fn){
   const before=await fetchRow(db,'state','outfit-board');
   await store(db,'state',fn(structuredClone(before)));
  },
  close(){db.close();}
 };
}
test('P134 privacy-safe joint preview verifies both original and reviewed cutout without cloud write',async()=>{
 const f=await setup();try{
  const p=await f.service.previewBoth();
  assert.equal(p.remoteExists,false);assert.equal(p.remoteRevision,0);
  assert.equal(p.localReviewedGarments,1);assert.equal(p.localSavedOutfits,1);
  assert.ok(p.localOriginalJPEGFieldsVerified>=1);
  assert.equal(p.localReviewedCutoutJPEGsVerified,1);
  assert.equal(p.photoBytesExposed,false);assert.equal(p.garmentDetailsExposed,false);
  assert.equal(f.writeCount,0);assert.equal(f.uploadCount,0);
  for(const secret of ['Private outfit','owner-134-shirt','Green','data:image/jpeg','closet-photo:'])
   assert.equal(JSON.stringify(p).includes(secret),false);
 }finally{f.close();}
});
test('P134 first owner cloud backup uses observed remote revision zero, validates local photo and preserves outfit ID',async()=>{
 const f=await setup();try{
  const r=await f.service.backupWithReviewedConsent();
  assert.equal(r.saved,true);assert.equal(r.revision,1);
  assert.equal(r.localSourceReviewProved,true);assert.equal(r.remotePreviewShown,false);
  assert.equal(f.remote.revision,1);assert.equal(f.writeCount,1);
  assert.equal(f.objects.size,2);
  assert.equal(f.remote.document.state['outfit-board'].saved[0].id,'p134-owned-look');
  assert.equal(JSON.stringify(f.remote.document).includes('data:image/jpeg'),false);
 }finally{f.close();}
});
test('P134 owner sees both local and remote counts with only literal true consent, while preserving both original/cutout JPEGs',async()=>{
 let decided=false,prompt;
 const f=await setup({confirm:async p=>{decided=true;prompt=p;return true;}});
 try{
  await f.service.backupWithReviewedConsent();
  const r=await f.service.backupWithReviewedConsent();
  assert.equal(decided,true);assert.equal(r.saved,true);assert.equal(r.revision,2);
  assert.equal(r.localSnapshotBoundToDecision,true);
  assert.equal(r.remoteRevisionObserved,true);
  assert.equal(r.noAutomaticSourceReviewMerge,true);
  assert.equal(prompt.remoteRevision,1);
  assert.equal(prompt.remoteReviewedGarments,1);
  assert.equal(prompt.remoteSavedOutfits,1);
  assert.equal(prompt.localReviewedGarments,1);
  assert.equal(prompt.localSavedOutfits,1);
  assert.equal(prompt.localReviewedCutoutJPEGsVerified,1);
  assert.equal(prompt.photoBytesExposed,false);
  assert.equal(prompt.automaticMerge,false);
  assert.equal(f.objects.size,2);
  for(const secret of ['Private outfit','owner-134-shirt','Green','data:image/jpeg','closet-photo:'])
   assert.equal(JSON.stringify(prompt).includes(secret),false);
 }finally{f.close();}
});
test('P134 nonliteral approval and cancellation leave existing remote wardrobe untouched',async()=>{
 for(const answer of [false,null,undefined,'yes',{approved:true},1]){
  const f=await setup({confirm:async()=>answer});
  try{
   await f.service.backupWithReviewedConsent();
   const r=await f.service.backupWithReviewedConsent();
   assert.equal(r.saved,false);assert.equal(r.cancelled,true);
   assert.equal(f.remote.revision,1);assert.equal(f.writeCount,1);
  }finally{f.close();}
 }
});
test('P134 changing a source-reviewed color during confirmation rejects before any remote photo upload or CAS',async()=>{
 let f;
 f=await setup({confirm:async()=>{
  await f.changeItem(row=>({...row,color:'Red'}));
  return true;
 }});
 try{
  await f.service.backupWithReviewedConsent();
  const originalUploads=f.uploadCount;
  await assert.rejects(f.service.backupWithReviewedConsent(),e=>e.code==='local-changed');
  assert.equal(f.remote.revision,1);
  assert.equal(f.writeCount,1);
  assert.equal(f.uploadCount,originalUploads);
 }finally{f.close();}
});
test('P134 changing a saved outfit during confirmation cannot silently replace newer remote board state',async()=>{
 let f;
 f=await setup({confirm:async()=>{
  await f.changeBoard(row=>({...row,saved:[...row.saved,
   {id:'second-local-look',ownerId:f.ownerId,name:'New',
    slots:{top:'owner-134-shirt'}}]}));
  return true;
 }});
 try{
  await f.service.backupWithReviewedConsent();
  await assert.rejects(f.service.backupWithReviewedConsent(),e=>e.code==='local-changed');
  assert.equal(f.writeCount,1);assert.equal(f.remote.revision,1);
 }finally{f.close();}
});
test('P134 local modification while initial remote preview HTTP response is in flight aborts before consent',async()=>{
 let f,enabled=false;
 f=await setup({onRemoteRead:async()=>{
  if(!enabled)return;
  enabled=false;
  await f.changeItem(row=>({...row,notes:'New note during remote preview'}));
 }});
 try{
  await f.service.backupWithReviewedConsent();
  enabled=true;
  await assert.rejects(f.service.backupWithReviewedConsent(),e=>e.code==='local-changed');
  assert.equal(f.writeCount,1);assert.equal(f.remote.revision,1);
  assert.equal(f.lastPrompt,null);
 }finally{f.close();}
});
test('P134 P126 integrity fails closed on tampered original photo or independently reviewed cutout BEFORE cloud operations',async()=>{
 for(const mutate of [
  x=>({...x,originalPhoto:{...x.originalPhoto,sha256:'0'.repeat(64)}}),
  x=>({...x,segmentHint:{...x.segmentHint,cutoutSHA256:'0'.repeat(64)}}),
  x=>({...x,ownerReviewed:false}),
  x=>({...x,threeDReady:true}),
  x=>({...x,ownerId:randomUUID()})
 ]){
  const f=await setup();
  try{
   await f.changeItem(mutate);
   await assert.rejects(f.service.backupWithReviewedConsent());
   assert.equal(f.writeCount,0);assert.equal(f.uploadCount,0);
   assert.equal(f.readCount,0,'no remote preview until local identity is valid');
  }finally{f.close();}
 }
});
test('P134 session logout, account switch or token replacement during owner choice never reaches cloud write',async()=>{
 for(const changed of ['logout','owner','token','revoke']){
  let f;
  f=await setup({confirm:async()=>{
   if(changed==='logout')f.session.active=false;
   if(changed==='owner')f.session.user.id=f.otherId;
   if(changed==='token')f.session.token='replacement-p134-owner-token';
   if(changed==='revoke')f.service.revoke();
   return true;
  }});
  try{
   await f.service.backupWithReviewedConsent();
   await assert.rejects(f.service.backupWithReviewedConsent(),e=>
    /revoked|token|owner/i.test(String(e.message)));
   assert.equal(f.remote.revision,1);assert.equal(f.writeCount,1);
  }finally{f.close();}
 }
});
test('P134 refuses simultaneous operations while owner decision is unresolved',async()=>{
 let f,entered,release;
 const started=new Promise(r=>entered=r),paused=new Promise(r=>release=r);
 f=await setup({confirm:async()=>{entered();await paused;return true;}});
 try{
  await f.service.backupWithReviewedConsent();
  const pending=f.service.backupWithReviewedConsent();
  await started;
  await assert.rejects(f.service.previewBoth(),e=>e.code==='owner-operation-busy');
  await assert.rejects(f.service.backupWithReviewedConsent(),e=>e.code==='owner-operation-busy');
  release();const r=await pending;
  assert.equal(r.saved,true);
  assert.equal(f.service.status().busy,false);
 }finally{release?.();f.close();}
});
test('P134 remote version change after owner consent fails closed without overwrite',async()=>{
 let f;
 f=await setup({confirm:async()=>{
  f.remote={...f.remote,revision:f.remote.revision+1};
  return true;
 }});
 try{
  await f.service.backupWithReviewedConsent();
  await assert.rejects(f.service.backupWithReviewedConsent(),e=>e.code==='remote-changed');
  assert.equal(f.remote.revision,2);
  assert.equal(f.writeCount,1);
 }finally{f.close();}
});
test('P134 actual P129 writer rejects local change during photo upload before save RPC',async()=>{
 let f,enabled=false;
 f=await setup({onUpload:async()=>{
  if(!enabled)return;
  enabled=false;
  await f.changeItem(row=>({...row,notes:'local edit before backup CAS'}));
 }});
 try{
  await f.service.backupWithReviewedConsent();
  enabled=true;
  await assert.rejects(f.service.backupWithReviewedConsent(),e=>
   e.code==='conflict'||e.code==='local-changed'||/changed/i.test(e.message));
  assert.equal(f.writeCount,1);
  assert.equal(f.remote.revision,1);
 }finally{f.close();}
});
test('P134 remote-only preview cannot expose a second owner wardrobe through owner-scoped request',async()=>{
 const f=await setup();try{
  const p=await f.service.previewBoth();
  assert.equal(p.remoteExists,false);
  assert(f.requests.every(x=>!x.url.includes(f.otherId)));
  assert(f.requests.every(x=>x.method==='GET'));
  assert.equal(f.service.status().liveSignedJWTVerified,false);
  assert.equal(f.service.status().physicalDeviceVerified,false);
 }finally{f.close();}
});
test('P134 research boundaries preserve separate P133/P132/P129 original photo cloud writer',()=>{
 const code=readFileSync('research/local-remote-consent-fence-134/owner-local-remote-fence.mjs','utf8');
 for(const term of ['createOwnerRemotePreview133','readOwnerSnapshot01','exportBackup01',
  'validateRestore01','await assertSameLocal(current.lease,current.local)',
  'localSnapshotBoundToDecision:true','beforeRPCFingerprintRechecked:true',
  'liveSignedJWTVerified:false',"familyAlpha:'HOLD'"])
  assert.ok(code.includes(term),term);
 assert.equal(LOCAL_REMOTE_FENCE_134.researchOnly,true);
 assert.equal(LOCAL_REMOTE_FENCE_134.noAutomaticCloudMerge,true);
 assert.equal(LOCAL_REMOTE_FENCE_134.productionAuthorized,undefined);
 assert.equal(LOCAL_REMOTE_FENCE_134.releaseAuthorized,false);
});
