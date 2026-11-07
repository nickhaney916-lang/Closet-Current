import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {createOwnerRemotePreview133,OWNER_REMOTE_PREVIEW_133}
 from '../research/remote-cloud-reviewed-preview-133/remote-preview-owner.mjs';

const digest=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes))]
 .map(x=>x.toString(16).padStart(2,'0')).join('');
const endpoint=(ownerId)=>'/rest/v1/closet_backups?owner_id=eq.'+ownerId+'&select=owner_id,revision,document';
const response=(status,payload,bytes)=>({ok:status>=200&&status<300,status,
 json:async()=>payload,arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
function fixture({approval=async()=>true,remoteExists=true,onRead=async()=>{},onBackup=async()=>{}}={}){
 const ownerId=randomUUID(),otherId=randomUUID();
 const token='P133-test-token-owner-A-research-long';
 const session={user:{id:ownerId},token,valid:true};
 const auth={user:session.user,
  assertCurrent(){if(!session.valid)throw Error('owner session revoked');},
  async getAccessToken(){if(!session.valid)throw Error('owner session revoked');return session.token;}
 };
 const jpegPath='closet-photo:'+ownerId+'/'+'a'.repeat(64)+'.jpg';
 const document={schemaVersion:1,ownerId,
  items:[{id:'private-top-133',ownerId,image:jpegPath,
   originalPhoto:{image:jpegPath},segmentHint:{cutoutImage:jpegPath},
   color:'Sensitive private garment color',notes:'NOT-FOR-USER-VISIBLE-PREVIEW'}],
  state:{'outfit-board':{saved:[{id:'secret-saved-outfit-name-133',ownerId}]}}
 };
 let remote=remoteExists?{owner_id:ownerId,revision:3,document}:null;
 let readCount=0;const requests=[],writes=[];
 const bridge={
  async backup({expectedRemoteRevision}){
   await onBackup();
   writes.push(expectedRemoteRevision);
   const actual=remote?.revision||0;
   if(expectedRemoteRevision!==actual){
    const e=Error('P129 CAS conflict');e.code='conflict';throw e;
   }
   remote={owner_id:ownerId,revision:actual+1,document:structuredClone(document)};
   return{saved:true,revision:remote.revision,ownerId};
  },
  async restore(){throw Error('P133 research adapter is backup-only');},
  revoke(){}
 };
 const fetcher=async (url,opts={})=>{
  requests.push({url,method:opts.method,auth:opts.headers?.Authorization});
  assert(url.endsWith(endpoint(ownerId)),'unexpected network path '+url);
  assert.equal(opts.method,'GET');
  assert.equal(opts.cache,'no-store');
  assert.equal(opts.headers.Authorization,'Bearer '+session.token);
  readCount++;await onRead({readCount,session});
  return response(200,remote?[structuredClone(remote)]:[]);
 };
 const p=createOwnerRemotePreview133({auth,baseURL:'https://research.invalid',
  anonKey:'synthetic-anon-key',fetcher,subtle:webcrypto.subtle,
  bridge,confirmReplace:approval});
 return {p,ownerId,otherId,session,document,requests,writes,
  get remote(){return remote;},set remote(v){remote=v;},
  get readCount(){return readCount;}};
}
test('P133 read-only preview returns owner-safe counts/revision without garment image/labels/notes',async()=>{
 const f=fixture();
 const p=await f.p.preview();
 assert.deepEqual(p,{exists:true,revision:3,reviewedGarmentCount:1,savedOutfitCount:1,
  imageBytesExposed:false,garmentDetailsExposed:false,familyAlpha:'HOLD',
  productionAuthorized:false});
 assert.equal(f.readCount,1);assert.deepEqual(f.writes,[]);
 const text=JSON.stringify(p);
 for(const privateText of ['NOT-FOR-USER-VISIBLE-PREVIEW',
  'Sensitive private garment color','private-top-133','closet-photo:'])
  assert.equal(text.includes(privateText),false);
 assert.equal(f.p.status().privateManifestReadOnly,true);
 assert.equal(f.p.status().independentSignedJWTVerified,false);
});
test('P133 owner-approved existing backup receives real observed revision and the only preview-safe prompt',async()=>{
 let prompt;
 const f=fixture({approval:async p=>{prompt=p;return true;}});
 const r=await f.p.backupWithOwnerPreview();
 assert.equal(r.saved,true);assert.equal(r.revision,4);
 assert.equal(r.remoteRevisionObserved,true);assert.equal(r.remotePreviewShown,true);
 assert.equal(r.cloudSourceReviewAutoMerged,false);
 assert.deepEqual(f.writes,[3]);
 assert.equal(f.readCount,2,'must read before and AFTER owner confirmation');
 assert.equal(prompt.revision,3);
 assert.equal(prompt.reviewedGarmentCount,1);
 assert.equal(prompt.savedOutfitCount,1);
 assert.equal(prompt.risk.includes('Remote-only edits'),true);
 const text=JSON.stringify(prompt);
 for(const secret of ['Sensitive private garment color','NOT-FOR-USER-VISIBLE-PREVIEW',
  'secret-saved-outfit-name-133','closet-photo:'])assert.equal(text.includes(secret),false);
});
test('P133 nonliteral decisions cancel before private storage upload or CAS',async()=>{
 for(const decision of [false,undefined,'yes',{approved:true},1,null]){
  const f=fixture({approval:async()=>decision});
  const r=await f.p.backupWithOwnerPreview();
  assert.equal(r.saved,false);assert.equal(r.cancelled,true);
  assert.deepEqual(f.writes,[]);
  assert.equal(f.readCount,1,'cancel does not need extra manifest fetch');
 }
});
test('P133 absent remote creates only with observed revision zero and never prompts for destructive overwrite',async()=>{
 let called=0;const f=fixture({remoteExists:false,
  approval:async()=>{called++;return true;}});
 const p=await f.p.preview();
 assert.equal(p.exists,false);assert.equal(p.revision,0);
 const r=await f.p.backupWithOwnerPreview();
 assert.equal(r.saved,true);assert.equal(r.revision,1);
 assert.equal(r.remotePreviewShown,false);assert.deepEqual(f.writes,[0]);
 assert.equal(called,0);
});
test('P133 changing remote revision during confirmation prevents any attempted write',async()=>{
 let f;
 f=fixture({approval:async()=>{f.remote={...f.remote,revision:4};return true;}});
 await assert.rejects(f.p.backupWithOwnerPreview(),e=>e.code==='remote-changed');
 assert.equal(f.readCount,2);assert.deepEqual(f.writes,[]);
});
test('P133 even same-revision remote manifest swapping is rejected via SHA-256 fingerprint',async()=>{
 let f;
 f=fixture({approval:async()=>{
  f.remote={...f.remote,document:{...f.remote.document,
   items:[{...f.remote.document.items[0],color:'Undeclared second-device change'}]}};
  return true;
 }});
 await assert.rejects(f.p.backupWithOwnerPreview(),e=>e.code==='remote-changed');
 assert.deepEqual(f.writes,[]);
});
test('P133 remote deletion during owner review never turns approved replacement into create-only',async()=>{
 let f;
 f=fixture({approval:async()=>{f.remote=null;return true;}});
 await assert.rejects(f.p.backupWithOwnerPreview(),e=>e.code==='remote-changed');
 assert.deepEqual(f.writes,[]);
});
test('P133 rejects foreign owner row, nested foreign photo, wrong owner item and duplicate IDs without exposing assets',async()=>{
 const mutations=[
  f=>{f.remote.owner_id=f.otherId;},
  f=>{f.remote.document.ownerId=f.otherId;},
  f=>{f.remote.document.items[0].ownerId=f.otherId;},
  f=>{f.remote.document.items[0].segmentHint.cutoutImage='closet-photo:'+f.otherId+'/'+'b'.repeat(64)+'.jpg';},
  f=>{f.remote.document.items.push(structuredClone(f.remote.document.items[0]));},
  f=>{f.remote.document.items[0].image='data:image/jpeg;base64,SECRET';},
  f=>{f.remote.document.state['outfit-board'].saved={unexpected:'not an array'};},
  f=>{f.remote.revision=-4;},
  f=>{f.remote.document.schemaVersion=0;}
 ];
 for(const mutate of mutations){
  const f=fixture();mutate(f);
  await assert.rejects(f.p.backupWithOwnerPreview(),e=>
   e.code==='remote-manifest-invalid');
  assert.deepEqual(f.writes,[]);
 }
});
test('P133 token replacement, account switch and revoke across asynchronous consent block pending writes',async()=>{
 for(const change of ['token','owner','revoke']){
  let reached,release;const started=new Promise(r=>reached=r),paused=new Promise(r=>release=r);
  const f=fixture({approval:async()=>{reached();await paused;return true;}});
  const operation=f.p.backupWithOwnerPreview();
  await started;
  if(change==='token')f.session.token='rotated-token-133-new';
  if(change==='owner')f.session.user.id=randomUUID();
  if(change==='revoke')f.p.revoke();
  release();
  await assert.rejects(operation,e=>e.code==='owner-session-revoked'||/revoked/.test(e.message));
  assert.deepEqual(f.writes,[]);
  assert.equal(f.p.status().busy,false);
 }
});
test('P133 second operation during pending owner prompt is refused, and lock clears afterwards',async()=>{
 let reached,release;const started=new Promise(r=>reached=r),paused=new Promise(r=>release=r);
 const f=fixture({approval:async()=>{reached();await paused;return true;}});
 const pending=f.p.backupWithOwnerPreview();
 await started;
 await assert.rejects(f.p.preview(),e=>e.code==='owner-operation-busy');
 await assert.rejects(f.p.backupWithOwnerPreview(),e=>e.code==='owner-operation-busy');
 assert.deepEqual(f.writes,[]);
 release();await pending;
 assert.equal(f.p.status().busy,false);
});
test('P133 delegated CAS rejects a competing write AFTER the second manifest preview',async()=>{
 let f;
 f=fixture({onBackup:async()=>{f.remote={...f.remote,revision:f.remote.revision+1};}});
 await assert.rejects(f.p.backupWithOwnerPreview(),e=>e.code==='conflict');
 assert.equal(f.readCount,2);
 assert.deepEqual(f.writes,[3]);
 assert.equal(f.remote.revision,4);
 assert.equal(f.p.status().busy,false);
});
async function realPhotoFixture({confirmReplace=async()=>true}={}){
 const ownerId=randomUUID();
 const session={user:{id:ownerId},token:'p133-test-unsigned-research-auth-token',valid:true};
 const auth={user:session.user,
  assertCurrent(){if(!session.valid)throw Error('revoked');},
  async getAccessToken(){if(!session.valid)throw Error('revoked');return session.token;}
 };
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+ownerId,2);
  request.onupgradeneeded=()=>{request.result.createObjectStore('items',{keyPath:'id'});
   request.result.createObjectStore('state',{keyPath:'id'});};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
 const put=(store,row)=>new Promise((resolve,reject)=>{
  const t=db.transaction(store,'readwrite');t.objectStore(store).put(row);
  t.oncomplete=resolve;t.onerror=()=>reject(t.error);
 });
 const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const m=await sharp(original).metadata();
 const cutout=await sharp(original).extract({left:0,top:0,
  width:Math.floor(m.width*.55),height:Math.floor(m.height*.65)})
  .jpeg({quality:88}).toBuffer();
 const originalSHA=await digest(original),cutoutSHA=await digest(cutout);
 const toData=bytes=>'data:image/jpeg;base64,'+bytes.toString('base64');
 const item={id:'p133-reviewed-shirt',ownerId,image:toData(original),
  originalPhoto:{image:toData(original),sha256:originalSHA},
  sourceSHA256:originalSHA,sourceHashVerified:true,sourcePhotoOriginal:true,
  humanReviewedSource:true,singleGarmentVerified:false,
  outfitSourceId:'reviewed-test-source-133',cutoutSHA256:cutoutSHA,
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalSHA,cutoutSHA256:cutoutSHA,
   cutoutImage:toData(cutout)},
  category:'Tops',itemType:'T-shirt',color:'Green',colorSource:'user',
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  threeDReady:false};
 await put('items',item);
 await put('state',{id:'outfit-board',
  saved:[{id:'real-owner-outfit-133',ownerId,slots:{top:item.id}}],current:{slots:{top:item.id}}});
 const objects=new Map();
 let remote=null,reads=0;
 const fetcher=async(url,options={})=>{
  assert.equal(options.headers.Authorization,'Bearer '+session.token);
  assert.equal(options.headers.apikey,'research-key');
  if(url.includes('/storage/v1/object/closet-private/')){
   const key=decodeURIComponent(url.split('/closet-private/')[1]);
   if(!key.startsWith(ownerId+'/'))return response(403,{});
   if(options.method==='POST'){
    if(objects.has(key))return response(409,{});
    objects.set(key,new Uint8Array(options.body));return response(200,{});
   }
   return objects.has(key)?response(200,{},objects.get(key)):response(404,{});
  }
  if(url.endsWith(endpoint(ownerId))){reads++;return response(200,remote?[structuredClone(remote)]:[]);}
  if(url.endsWith('/rest/v1/rpc/save_closet_backup')){
   const request=JSON.parse(options.body);
   const current=remote?.revision||0;
   if(request.p_expected_revision!==current)return response(200,null);
   if(request.p_document.ownerId!==ownerId)return response(403,{});
   remote={owner_id:ownerId,revision:current+1,document:request.p_document};
   return response(200,remote.revision);
  }
  return response(404,{});
 };
 let lastPrompt=null;
 const service=createOwnerRemotePreview133({
  auth,db,baseURL:'https://research.invalid',anonKey:'research-key',
  fetcher,subtle:webcrypto.subtle,confirmRestore:async()=>false,
  confirmReplace:async prompt=>{lastPrompt=prompt;return confirmReplace(prompt);}
 });
 return{service,db,ownerId,objects,originalSHA,cutoutSHA,
  get remote(){return remote;},set remote(v){remote=v;},
  get reads(){return reads;},get lastPrompt(){return lastPrompt;}};
}
test('P133 end-to-end actual P129 original+cutout JPEG owner backup, remote preview, explicit second-version consent, private SHA objects and saved-outfit preservation',async()=>{
 const f=await realPhotoFixture();
 try{
  const empty=await f.service.preview();
  assert.equal(empty.exists,false);
  const first=await f.service.backupWithOwnerPreview();
  assert.equal(first.saved,true);assert.equal(first.revision,1);
  assert.equal(first.remotePreviewShown,false);
  assert.equal(f.objects.size,2);
  assert.equal(JSON.stringify(f.remote.document).includes('data:image/jpeg'),false);
  const preview=await f.service.preview();
  assert.equal(preview.exists,true);assert.equal(preview.revision,1);
  assert.equal(preview.reviewedGarmentCount,1);
  assert.equal(preview.savedOutfitCount,1);
  const next=await f.service.backupWithOwnerPreview();
  assert.equal(next.saved,true);assert.equal(next.revision,2);
  assert.equal(next.remotePreviewShown,true);
  assert.equal(next.cloudSourceReviewAutoMerged,false);
  assert.equal(f.lastPrompt.revision,1);
  assert.equal(f.lastPrompt.imageBytesExposed,false);
  assert.equal(f.remote.document.state['outfit-board'].saved[0].id,'real-owner-outfit-133');
  assert.equal(f.objects.size,2);
  assert.equal(f.service.status().independentSignedJWTVerified,false);
  assert.equal(f.service.status().productionAuthorized,false);
 }finally{f.db.close();}
});
test('P133 source preserves original P129 revision CAS and does not falsely claim deployed cloud or Family Alpha release',()=>{
 const src=readFileSync('research/remote-cloud-reviewed-preview-133/remote-preview-owner.mjs','utf8');
 for(const literal of ['createOwnerCloudRevision132','assertOwnerCloudPaths128',
  'verifyBeforeAndAfterConsent:true','remoteRevisionObserved:true',
  'noAutomaticSourceReviewMerge:true','independentSignedJWTVerified:false',
  "familyAlpha:'HOLD'"])
  assert.ok(src.includes(literal),literal);
 assert.equal(OWNER_REMOTE_PREVIEW_133.productionAuthorized,false);
 assert.equal(OWNER_REMOTE_PREVIEW_133.privateManifestReadOnly,true);
});
