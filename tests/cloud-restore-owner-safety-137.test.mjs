import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {createCloudRestoreGuard137,CLOUD_RESTORE_GUARD_137}
 from '../research/cloud-restore-owner-safety-137/owner-restore-guard.mjs';
import {createSignedOwnerCloud129}
 from '../research/signed-owner-cloud-integration-129/native-cloud-bridge.mjs';

const hash=async b=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',b))]
 .map(c=>c.toString(16).padStart(2,'0')).join('');
const data=b=>'data:image/jpeg;base64,'+b.toString('base64');
const response=(status,value,bytes)=>({
 ok:status>=200&&status<300,status,json:async()=>value,
 arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)
});
async function dbFor(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
function put(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
function get(db,store,key){
 return new Promise((resolve,reject)=>{
  const r=db.transaction(store,'readonly').objectStore(store).get(key);
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function fixture({approval=async()=>true,onRead=async()=>{},onImage=async()=>{}}={}){
 const ownerId=randomUUID(),otherId=randomUUID();
 const db=await dbFor(ownerId);
 const jpg=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const meta=await sharp(jpg).metadata();
 const cutout=await sharp(jpg).extract({left:0,top:0,
  width:Math.floor(meta.width*.55),height:Math.floor(meta.height*.65)})
  .jpeg({quality:88}).toBuffer();
 const originalSHA=await hash(jpg),cutoutSHA=await hash(cutout);
 assert.notEqual(originalSHA,cutoutSHA);
 const garment={
  id:'verified-p137-shirt',ownerId,
  image:data(jpg),originalPhoto:{image:data(jpg),sha256:originalSHA},
  sourceSHA256:originalSHA,sourceHashVerified:true,sourcePhotoOriginal:true,
  humanReviewedSource:true,singleGarmentVerified:false,
  outfitSourceId:'licensed-p137-original',cutoutSHA256:cutoutSHA,
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalSHA,cutoutSHA256:cutoutSHA,
   cutoutImage:data(cutout)},
  category:'Tops',itemType:'T-shirt',color:'Green',colorSource:'user',
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,
  confirmedColor:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  threeDReady:false
 };
 await put(db,'items',garment);
 await put(db,'state',{id:'outfit-board',
  current:{slots:{top:garment.id}},
  saved:[{id:'saved-137-private-outfit',ownerId,name:'Private P137 style',
   slots:{top:garment.id}}]});
 const session={user:{id:ownerId},token:'synthetic-p137-owner-token-not-signed',active:true};
 const auth={
  user:session.user,
  assertCurrent(){if(!session.active)throw Error('owner session revoked');},
  async getAccessToken(){if(!session.active)throw Error('owner session revoked');return session.token;}
 };
 const objects=new Map(),requests=[];
 let remote=null,reads=0,images=0,writes=0,asked=0,lastPrompt=null;
 const cloudPath='/rest/v1/closet_backups?owner_id=eq.'+
  encodeURIComponent(ownerId)+'&select=owner_id,revision,document';
 const fetcher=async(url,opts={})=>{
  requests.push({url,method:opts.method||'GET'});
  assert.equal(opts.headers.Authorization,'Bearer '+session.token);
  assert.equal(opts.headers.apikey,'p137-test-anon');
  if(url.includes('/storage/v1/object/closet-private/')){
   const path=decodeURIComponent(url.split('/closet-private/')[1]);
   if(!path.startsWith(ownerId+'/'))return response(403,{});
   if(opts.method==='POST'){
    if(objects.has(path))return response(409,{});
    objects.set(path,new Uint8Array(opts.body));return response(200,{});
   }
   images++;await onImage({images,db,session});
   return objects.has(path)?response(200,{},objects.get(path)):response(404,{});
  }
  if(url.endsWith(cloudPath)){
   reads++;await onRead({reads,db,session});
   return response(200,remote?[structuredClone(remote)]:[]);
  }
  if(url.endsWith('/rest/v1/rpc/save_closet_backup')){
   writes++;
   const rpc=JSON.parse(opts.body),expected=remote?.revision||0;
   if(rpc.p_expected_revision!==expected)return response(200,null);
   if(rpc.p_document.ownerId!==ownerId)return response(403,{});
   remote={owner_id:ownerId,revision:expected+1,document:rpc.p_document};
   return response(200,remote.revision);
  }
  throw Error('unexpected endpoint '+url);
 };
 const writer=createSignedOwnerCloud129({
  auth,db,baseURL:'https://research.invalid',anonKey:'p137-test-anon',
  fetcher,confirmRestore:async()=>false,subtle:webcrypto.subtle
 });
 await writer.backup({expectedRemoteRevision:0});
 assert.equal(remote.revision,1);assert.equal(objects.size,2);
 const guard=createCloudRestoreGuard137({
  auth,db,baseURL:'https://research.invalid',anonKey:'p137-test-anon',
  fetcher,subtle:webcrypto.subtle,
  confirmReplaceLocal:async prompt=>{
   asked++;lastPrompt=prompt;
   return approval(prompt);
  }
 });
 return {guard,db,session,ownerId,otherId,objects,requests,originalSHA,cutoutSHA,
  get remote(){return remote;},set remote(v){remote=v;},
  get reads(){return reads;},get images(){return images;},
  get writes(){return writes;},get asked(){return asked;},
  get lastPrompt(){return lastPrompt;},
  async changeItem(fn){
   const old=await get(db,'items',garment.id);
   await put(db,'items',fn({...old}));
  },
  async changeBoard(fn){
   const old=await get(db,'state','outfit-board');
   await put(db,'state',fn(structuredClone(old)));
  },
  close(){db.close();}
 };
}
test('P137 readonly restore preview shows safe owner counts, no images or garment labels',async()=>{
 const f=await fixture();
 try{
  const beforeImages=f.images,beforeWrites=f.writes;
  const p=await f.guard.previewRestore();
  assert.deepEqual(p,{
   remoteRevision:1,localGarmentCount:1,localSavedOutfitCount:1,
   remoteGarmentCount:1,remoteSavedOutfitCount:1,
   originalAndCutoutBytesExposed:false,privateGarmentDetailsExposed:false,
   destructiveRestoreRequiresLiteralOwnerApproval:true,
   productionAuthorized:false,familyAlpha:'HOLD'
  });
  assert.equal(f.images,beforeImages,'preview must not download private JPEGs');
  assert.equal(f.writes,beforeWrites);
  for(const secret of ['Private P137 style','verified-p137-shirt','data:image','Green','closet-photo:'])
   assert.equal(JSON.stringify(p).includes(secret),false);
 }finally{f.close();}
});
test('P137 validated original+cutout remote restore requires owner consent and atomically recovers saved outfit IDs',async()=>{
 const f=await fixture();
 try{
  await f.changeItem(r=>({...r,color:'Local change that will be discarded'}));
  await f.changeBoard(r=>({...r,saved:[...r.saved,{
   id:'local-only-outfit-137',ownerId:f.ownerId,slots:{top:'verified-p137-shirt'}
  }]}));
  const r=await f.guard.restoreWithOwnerReview();
  assert.equal(r.restored,true);assert.equal(r.atomic,true);
  assert.equal(r.revision,1);assert.equal(r.originalAndCutoutJPEGSHAValid,true);
  assert.equal(r.localAndRemoteReviewBound,true);
  assert.equal(f.asked,1);assert.equal(f.lastPrompt.bothJPEGSHA256Verified,true);
  assert.equal(f.lastPrompt.remoteGarmentCount,1);
  assert.equal(f.lastPrompt.localSavedOutfitCount,2);
  assert.equal(f.lastPrompt.remoteSavedOutfitCount,1);
  assert.equal(f.lastPrompt.automaticMerge,false);
  const item=await get(f.db,'items','verified-p137-shirt');
  assert.equal(item.color,'Green');
  assert.equal(item.originalPhoto.sha256,f.originalSHA);
  assert.equal(item.cutoutSHA256,f.cutoutSHA);
  const board=await get(f.db,'state','outfit-board');
  assert.deepEqual(board.saved.map(x=>x.id),['saved-137-private-outfit']);
  const promptText=JSON.stringify(f.lastPrompt);
  for(const secret of ['Local change that will be discarded','Private P137 style',
    'verified-p137-shirt','data:image/jpeg','closet-photo:'])
   assert.equal(promptText.includes(secret),false);
 }finally{f.close();}
});
test('P137 refuses false, nonliteral and declined review without touching local outfit or photo',async()=>{
 for(const value of [false,undefined,null,'yes',1,{approved:true}]){
  const f=await fixture({approval:async()=>value});
  try{
   await f.changeItem(r=>({...r,color:'Local Red'}));
   const r=await f.guard.restoreWithOwnerReview();
   assert.equal(r.restored,false);assert.equal(r.cancelled,true);
   assert.equal((await get(f.db,'items','verified-p137-shirt')).color,'Local Red');
   assert.equal(f.asked,1);
   assert.equal(f.guard.status().busy,false);
  }finally{f.close();}
 }
});
test('P137 local garment edit during awaited owner review rejects and retains edit, with no restored writes',async()=>{
 let f;
 f=await fixture({approval:async()=>{
  await f.changeItem(x=>({...x,color:'Second-device review correction'}));
  return true;
 }});
 try{
  await assert.rejects(f.guard.restoreWithOwnerReview(),e=>e.code==='local-changed');
  assert.equal((await get(f.db,'items','verified-p137-shirt')).color,
   'Second-device review correction');
  assert.equal(f.guard.status().busy,false);
 }finally{f.close();}
});
test('P137 saved outfit edit during approval rejects rather than silently discarding the new look',async()=>{
 let f;
 f=await fixture({approval:async()=>{
  await f.changeBoard(row=>({...row,saved:[...row.saved,{
   id:'new-look-during-restore',ownerId:f.ownerId,slots:{top:'verified-p137-shirt'}
  }]}));
  return true;
 }});
 try{
  await assert.rejects(f.guard.restoreWithOwnerReview(),e=>e.code==='local-changed');
  assert.equal((await get(f.db,'state','outfit-board')).saved.length,2);
 }finally{f.close();}
});
test('P137 changing cloud revision during approval fails closed and leaves local wardrobe intact',async()=>{
 let f;
 f=await fixture({approval:async()=>{
  f.remote={...f.remote,revision:2};return true;
 }});
 try{
  await f.changeItem(r=>({...r,color:'Local Yellow'}));
  await assert.rejects(f.guard.restoreWithOwnerReview(),e=>e.code==='remote-changed');
  assert.equal(f.remote.revision,2);
  assert.equal((await get(f.db,'items','verified-p137-shirt')).color,'Local Yellow');
 }finally{f.close();}
});
test('P137 same remote revision but altered private document fails fingerprint recheck',async()=>{
 let f;
 f=await fixture({approval:async()=>{
  f.remote={...f.remote,document:{...f.remote.document,
   items:[{...f.remote.document.items[0],color:'unapproved cloud color'}]}};
  return true;
 }});
 try{
  await assert.rejects(f.guard.restoreWithOwnerReview(),e=>e.code==='remote-changed');
 }finally{f.close();}
});
test('P137 cloud deletion during owner review fails closed without local replacement',async()=>{
 let f;
 f=await fixture({approval:async()=>{f.remote=null;return true;}});
 try{
  await assert.rejects(f.guard.restoreWithOwnerReview(),e=>
    e.code==='cloud-missing');
  assert((await get(f.db,'items','verified-p137-shirt')).ownerId===f.ownerId);
 }finally{f.close();}
});
test('P137 foreign owner remote manifest and foreign private JPEG path rejected before object download',async()=>{
 for(const change of [
  f=>{f.remote.owner_id=f.otherId;},
  f=>{f.remote.document.ownerId=f.otherId;},
  f=>{f.remote.document.items[0].ownerId=f.otherId;},
  f=>{f.remote.document.items[0].segmentHint.cutoutImage=
    'closet-photo:'+f.otherId+'/'+'a'.repeat(64)+'.jpg';},
  f=>{f.remote.document.items.push({...f.remote.document.items[0]});}
 ]){
  const f=await fixture();
  try{
   change(f);const before=f.images;
   await assert.rejects(f.guard.restoreWithOwnerReview(),e=>e.code==='remote-invalid');
   assert.equal(f.images,before,'malicious manifest cannot trigger image fetch');
   assert.equal(f.asked,0);
  }finally{f.close();}
 }
});
test('P137 corrupt actual private cutout JPEG bytes fail integrity before any owner approval',async()=>{
 const f=await fixture();
 try{
  const key=[...f.objects.keys()].find(k=>k.endsWith(f.cutoutSHA+'.jpg'));
  assert(key);
  const object=f.objects.get(key);
  const damaged=new Uint8Array(object);damaged[damaged.length-3]^=1;
  f.objects.set(key,damaged);
  await assert.rejects(f.guard.restoreWithOwnerReview(),
   /SHA mismatch|invalid JPEG|PHOTO128/i);
  assert.equal(f.asked,0);
 }finally{f.close();}
});
test('P137 logout, account switching, token rotation and explicit revoke abort asynchronous owner consent',async()=>{
 for(const action of ['logout','owner','token','revoke']){
  let f;
  f=await fixture({approval:async()=>{
   if(action==='logout')f.session.active=false;
   if(action==='owner')f.session.user.id=f.otherId;
   if(action==='token')f.session.token='new-p137-rotated-owner-token';
   if(action==='revoke')f.guard.revoke();
   return true;
  }});
  try{
   await assert.rejects(f.guard.restoreWithOwnerReview(),
    e=>e.code==='owner-session-revoked'||/revoked|owner|session/i.test(e.message));
   assert.equal(f.guard.status().busy,false);
  }finally{f.close();}
 }
});
test('P137 only one restore or preview may execute while owner consent is pending',async()=>{
 let entered,release;
 const waiting=new Promise(r=>entered=r),pause=new Promise(r=>release=r);
 const f=await fixture({approval:async()=>{entered();await pause;return false;}});
 try{
  const job=f.guard.restoreWithOwnerReview();
  await waiting;
  await assert.rejects(f.guard.previewRestore(),e=>e.code==='owner-operation-busy');
  await assert.rejects(f.guard.restoreWithOwnerReview(),e=>e.code==='owner-operation-busy');
  release();
  assert.equal((await job).cancelled,true);
  assert.equal(f.guard.status().busy,false);
 }finally{release?.();f.close();}
});
test('P137 preview rejects missing remote backup rather than offering destructive restore',async()=>{
 const f=await fixture();
 try{
  f.remote=null;
  await assert.rejects(f.guard.previewRestore(),e=>e.code==='cloud-missing');
  assert.equal(f.asked,0);
 }finally{f.close();}
});
test('P137 does not claim real signed HTTP/JWT, production authorization or physical phone certification',()=>{
 const source=readFileSync('research/cloud-restore-owner-safety-137/owner-restore-guard.mjs','utf8');
 for(const marker of [
  'createSignedOwnerCloud129','readOwnerSnapshot01','assertOwnerCloudPaths128',
  'await assertSameLocal(ctx,source)','await assertSameRemote(ctx,target)',
  'approved!==true','serverIssuedSignedJWTIndependentlyVerified:false',
  "familyAlpha:'HOLD'"
 ])assert.ok(source.includes(marker),marker);
 assert.equal(CLOUD_RESTORE_GUARD_137.researchOnly,true);
 assert.equal(CLOUD_RESTORE_GUARD_137.atomicIDBDelegatedToP126,true);
 assert.equal(CLOUD_RESTORE_GUARD_137.productionAuthorized,false);
});
