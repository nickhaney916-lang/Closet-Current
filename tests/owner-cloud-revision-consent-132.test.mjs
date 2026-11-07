import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {createOwnerCloudRevision132,OWNER_CLOUD_REVISION_132}
 from '../research/owner-cloud-revision-consent-132/revision-owner-gate.mjs';

function unit({confirmRemoteReplace=async()=>true}={}){
 const ownerId=randomUUID();
 const session={user:{id:ownerId},token:'p132-synthetic-access-token-owner-A',valid:true};
 const auth={
  user:session.user,
  assertCurrent(){if(!session.valid)throw Error('session revoked');},
  async getAccessToken(){if(!session.valid)throw Error('session revoked');return session.token;}
 };
 const calls=[],bridge={
  async backup(opts){calls.push({action:'backup',...opts});return{saved:true,revision:opts.expectedRemoteRevision+1,ownerId};},
  async restore(opts){calls.push({action:'restore',...opts});return{restored:true,revision:opts.expectedRemoteRevision,ownerId};},
  revoke(){calls.push({action:'revoke'});}
 };
 const gate=createOwnerCloudRevision132({auth,bridge,confirmRemoteReplace});
 return{gate,auth,session,calls,ownerId};
}
test('P132 refuses unspecified, malformed, negative, fractional and unsafe cloud revisions before any cloud request',async()=>{
 const f=unit();
 for(const options of [undefined,{}, {expectedRemoteRevision:null},{expectedRemoteRevision:-1},
  {expectedRemoteRevision:1.25},{expectedRemoteRevision:'1'},{expectedRemoteRevision:Number.MAX_SAFE_INTEGER+1}]){
  await assert.rejects(f.gate.backup(options),e=>e.code==='revision-precondition');
 }
 assert.equal(f.calls.length,0);
});
test('P132 first backup is create-only and delegates an exact optimistic revision zero to P129',async()=>{
 const f=unit(); const r=await f.gate.backup({expectedRemoteRevision:0});
 assert.equal(r.saved,true);assert.equal(r.revision,1);
 assert.equal(r.ownerApprovalForReplace,false);
 assert.equal(r.automaticSourceReviewMerge,false);
 assert.deepEqual(f.calls,[{action:'backup',expectedRemoteRevision:0}]);
 assert.equal(f.gate.status().researchOnly,true);
 assert.equal(f.gate.status().busy,false);
});
test('P132 cannot silently replace or field-merge a remote owner-revised closet',async()=>{
 const f=unit();
 for(const options of [
  {expectedRemoteRevision:0,strategy:'owner-approved-replace'},
  {expectedRemoteRevision:1},
  {expectedRemoteRevision:1,strategy:'create-only'},
  {expectedRemoteRevision:1,strategy:'auto-merge'},
  {expectedRemoteRevision:1,strategy:'unsafe-field-merge'}]){
  await assert.rejects(f.gate.backup(options),e=>['revision-precondition','owner-review-required'].includes(e.code));
 }
 assert.deepEqual(f.calls,[]);
});
test('P132 requires literal true owner approval and does not mistake an object for consent',async()=>{
 for(const approval of [false,undefined,null,1,'yes',{approved:true}]){
  let prompt,called=0;
  const f=unit({confirmRemoteReplace:async p=>{called++;prompt=p;return approval;}});
  const r=await f.gate.backup({expectedRemoteRevision:7,strategy:'owner-approved-replace'});
  assert.equal(r.cancelled,true);assert.equal(r.saved,false);assert.equal(f.calls.length,0);
  assert.equal(called,1);assert.equal(prompt.ownerId,f.ownerId);
  assert.equal(prompt.expectedRemoteRevision,7);
  assert.equal(prompt.automaticMerge,false);
  assert.equal(prompt.replacesRemoteItems,true);
  assert.equal(JSON.stringify(prompt).includes('data:image'),false);
 }
 const f=unit({confirmRemoteReplace:null});
 await assert.rejects(f.gate.backup({expectedRemoteRevision:1,strategy:'owner-approved-replace'}),
  e=>e.code==='owner-review-required');
 assert.equal(f.calls.length,0);
});
test('P132 owner-approved replacement sends the exact observed revision to P129 CAS and preserves owner identity',async()=>{
 let prompt;
 const f=unit({confirmRemoteReplace:async p=>{prompt=p;return true;}});
 const r=await f.gate.backup({expectedRemoteRevision:12,strategy:'owner-approved-replace'});
 assert.equal(r.saved,true);assert.equal(r.revision,13);
 assert.equal(r.ownerApprovalForReplace,true);
 assert.equal(prompt.ownerId,f.ownerId);
 assert.equal(prompt.action,'replace-entire-existing-cloud-wardrobe');
 assert.deepEqual(f.calls,[{action:'backup',expectedRemoteRevision:12}]);
});
test('P132 revokes owner lease when token or account changes during asynchronous owner confirmation',async()=>{
 for(const changed of ['token','owner','revoke']){
  let entered,release;const started=new Promise(r=>entered=r),pause=new Promise(r=>release=r);
  const f=unit({confirmRemoteReplace:async()=>{entered();await pause;return true;}});
  const op=f.gate.backup({expectedRemoteRevision:2,strategy:'owner-approved-replace'});
  await started;
  if(changed==='token')f.session.token='new-revoked-token';
  if(changed==='owner')f.session.user.id=randomUUID();
  if(changed==='revoke')f.gate.revoke();
  release();
  await assert.rejects(op,e=>e.code==='owner-session-revoked');
  assert.equal(f.calls.filter(x=>x.action==='backup').length,0);
  assert.equal(f.gate.status().busy,false);
 }
});
test('P132 refuses concurrent owner operations even while consent dialog is pending',async()=>{
 let entered,release;const started=new Promise(r=>entered=r),pause=new Promise(r=>release=r);
 const f=unit({confirmRemoteReplace:async()=>{entered();await pause;return true;}});
 const first=f.gate.backup({expectedRemoteRevision:2,strategy:'owner-approved-replace'});
 await started;
 await assert.rejects(f.gate.backup({expectedRemoteRevision:0}),
  e=>e.code==='owner-operation-busy');
 await assert.rejects(f.gate.restore({expectedRemoteRevision:1}),
  e=>e.code==='owner-operation-busy');
 release();await first;
 assert.equal(f.calls.filter(x=>x.action==='backup').length,1);
});
test('P132 restore requires explicit remote revision, delegates P129 separate literal confirmation',async()=>{
 const f=unit();
 for(const opt of [undefined,{}, {expectedRemoteRevision:0},{expectedRemoteRevision:-1}]){
  await assert.rejects(f.gate.restore(opt),e=>e.code==='revision-precondition');
 }
 const r=await f.gate.restore({expectedRemoteRevision:3});
 assert.equal(r.restored,true);assert.equal(r.ownerCloudRevisionPrecondition,true);
 assert.deepEqual(f.calls,[{action:'restore',expectedRemoteRevision:3}]);
});
const sha=async b=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
const data=b=>'data:image/jpeg;base64,'+b.toString('base64');
const response=(status,payload,bytes)=>({
 ok:status>=200&&status<300,status,
 json:async()=>payload,
 arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)
});
async function actualP129Fixture({replaceApproval=async()=>true,restoreApproval=async()=>true}={}){
 const ownerId=randomUUID(),session={user:{id:ownerId},token:'fake-unsigned-owner-A-research-token',valid:true};
 const auth={user:session.user,assertCurrent(){if(!session.valid)throw Error('revoked');},
  async getAccessToken(){if(!session.valid)throw Error('revoked');return session.token;}};
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+ownerId,2);
  req.onupgradeneeded=()=>{req.result.createObjectStore('items',{keyPath:'id'});req.result.createObjectStore('state',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 const put=(store,row)=>new Promise((resolve,reject)=>{
  const t=db.transaction(store,'readwrite');t.objectStore(store).put(row);
  t.oncomplete=resolve;t.onerror=()=>reject(t.error);
 });
 const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const m=await sharp(original).metadata();
 const crop=await sharp(original).extract({left:0,top:0,
  width:Math.floor(m.width*.55),height:Math.floor(m.height*.65)}).jpeg({quality:88}).toBuffer();
 const originalSHA=await sha(original),cutoutSHA=await sha(crop);
 const item={id:'shirt-132',ownerId,image:data(original),
  originalPhoto:{image:data(original),sha256:originalSHA},
  sourceSHA256:originalSHA,sourceHashVerified:true,sourcePhotoOriginal:true,
  humanReviewedSource:true,singleGarmentVerified:false,outfitSourceId:'licensed-fixture-132',
  cutoutSHA256:cutoutSHA,
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalSHA,cutoutSHA256:cutoutSHA,cutoutImage:data(crop)},
  category:'Tops',itemType:'T-shirt',color:'Blue',colorSource:'user',
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',threeDReady:false};
 await put('items',item);
 await put('state',{id:'outfit-board',current:{slots:{top:item.id}},
  saved:[{id:'saved-look-132',ownerId,name:'Owner saved outfit',slots:{top:item.id}}]});
 const objects=new Map(),requests=[];let remote=null;
 const fetcher=async(url,opts={})=>{
  requests.push({url,method:opts.method||'GET'});
  assert.equal(opts.headers.Authorization,'Bearer '+session.token);
  assert.equal(opts.headers.apikey,'synthetic-public-research-key');
  if(url.includes('/storage/v1/object/closet-private/')){
   const path=decodeURIComponent(url.split('/closet-private/')[1]);
   if(!path.startsWith(ownerId+'/'))return response(403,{});
   if(opts.method==='POST'){if(objects.has(path))return response(409,{});
    objects.set(path,new Uint8Array(opts.body));return response(200,{});}
   return objects.has(path)?response(200,{},objects.get(path)):response(404,{});
  }
  if(url.includes('/rest/v1/closet_backups?'))
   return response(200,remote?[remote]:[]);
  if(url.endsWith('/rest/v1/rpc/save_closet_backup')){
   const body=JSON.parse(opts.body),current=remote?.revision||0;
   if(body.p_expected_revision!==current)return response(200,null);
   if(body.p_document.ownerId!==ownerId)return response(403,{});
   remote={owner_id:ownerId,revision:current+1,document:body.p_document};
   return response(200,remote.revision);
  }
  return response(404,{});
 };
 const gate=createOwnerCloudRevision132({auth,db,baseURL:'https://research.invalid',
  anonKey:'synthetic-public-research-key',fetcher,confirmRestore:restoreApproval,
  confirmRemoteReplace:replaceApproval,subtle:webcrypto.subtle});
 return{gate,session,ownerId,db,objects,requests,originalSHA,cutoutSHA,
  get remote(){return remote;},set remote(value){remote=value;}};
}
test('P132 runs actual P129 double-JPEG upload and atomic restore only with typed revisions and affirmative owner choices',async()=>{
 const f=await actualP129Fixture();
 try{
  const refused=await f.gate.backup({expectedRemoteRevision:0,strategy:'auto-merge'}).catch(e=>e);
  assert.equal(refused.code,'revision-precondition');
  assert.equal(f.requests.length,0);
  const first=await f.gate.backup({expectedRemoteRevision:0});
  assert.equal(first.revision,1);assert.equal(first.photoObjects,2);
  assert.equal(f.objects.size,2);assert.equal(f.remote.revision,1);
  assert.equal(JSON.stringify(f.remote.document).includes('data:image/jpeg'),false);
  await assert.rejects(f.gate.backup({expectedRemoteRevision:1}),e=>e.code==='owner-review-required');
  assert.equal(f.remote.revision,1);
  const second=await f.gate.backup({expectedRemoteRevision:1,strategy:'owner-approved-replace'});
  assert.equal(second.saved,true);assert.equal(second.revision,2);
  assert.equal(second.ownerApprovalForReplace,true);
  assert.equal(f.remote.revision,2);
  const restored=await f.gate.restore({expectedRemoteRevision:2});
  assert.equal(restored.restored,true);assert.equal(restored.revision,2);
  assert.equal(restored.originalAndCutoutJPEGSHAValid,true);
  const board=await new Promise((resolve,reject)=>{
   const r=f.db.transaction('state','readonly').objectStore('state').get('outfit-board');
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  assert.equal(board.saved[0].id,'saved-look-132');
  assert.equal(f.gate.status().signedJWTIndependentlyVerified,false);
 }finally{f.db.close();}
});
test('P132 actual P129 writer rejects stale remote CAS, preventing owner-approved overwrite of an updated remote backup',async()=>{
 const f=await actualP129Fixture();
 try{
  await f.gate.backup({expectedRemoteRevision:0});
  f.remote={...f.remote,revision:2};
  const requests=f.requests.length;
  await assert.rejects(f.gate.backup({
   expectedRemoteRevision:1,strategy:'owner-approved-replace'
  }),e=>e.code==='conflict');
  assert.equal(f.remote.revision,2);
  assert.equal(f.requests.slice(requests).filter(r=>r.url.includes('/rpc/save_closet_backup')).length,0);
 }finally{f.db.close();}
});
test('P132 actual P129 delegate never restores without previously observed revision and literal restore consent',async()=>{
 const f=await actualP129Fixture({restoreApproval:async()=>({approved:true})});
 try{
  await f.gate.backup({expectedRemoteRevision:0});
  const r=await f.gate.restore({expectedRemoteRevision:1});
  assert.equal(r.cancelled,true);assert.equal(r.restored,false);
 }finally{f.db.close();}
});
test('P132 is research-only, does not modify production/cloud SQL or claim real cryptographically signed A/B accounts',()=>{
 const code=readFileSync('research/owner-cloud-revision-consent-132/revision-owner-gate.mjs','utf8');
 for(const term of [
  "createSignedOwnerCloud129","owner-approved-replace",
  "approved!==true","expectedRemoteRevision","bridge.backup({expectedRemoteRevision})",
  "automaticSourceReviewMerge:false","signedJWTIndependentlyVerified:false",
  "releaseAuthorized:false","familyAlpha:'HOLD'"
 ])assert.ok(code.includes(term),term);
 assert.equal(OWNER_CLOUD_REVISION_132.researchOnly,true);
 assert.equal(OWNER_CLOUD_REVISION_132.automaticReviewSourceMerge,false);
 assert.equal(OWNER_CLOUD_REVISION_132.remoteReplaceRequiresLiteralOwnerApproval,true);
});
