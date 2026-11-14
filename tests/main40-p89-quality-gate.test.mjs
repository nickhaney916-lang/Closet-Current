import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {createTrustedNativeOwnerScope39} from '../research/main1054-handoff39/trusted-native-owner-scope.mjs';
import {assessNative3DQuality40} from '../research/main1054-handoff40/p89-quality-admission.mjs';
import {auditNativeOwnerViewer38} from '../research/main1054-handoff38/strict-viewer-admission.mjs';

const jpeg=readFileSync('benchmark/fixtures/commons-0023.jpg');
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
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
async function rows(db){
 return new Promise((resolve,reject)=>{
  const r=db.transaction('items','readonly').objectStore('items').getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function add(db,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(row);
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function testOwner(callback){
 const ownerId='m37-'+randomUUID(),db=await dbFor(ownerId),id='licensed-owner-item';
 let authRef={user:{id:ownerId},assertCurrent(){}};
 let session={ownerId,authenticated:true,epoch:2,operationEpoch:3,
  authRef,privateDbRef:db,privateDbName:db.name};
 let revision=1,board={name:'Safe researched source',slots:{bottom:id}};
 const getSession=()=>({...session}),getRevision=()=>revision,getBoard=()=>board;
 const readOwnerItems=async scope=>{
  scope?.assertCurrent?.();
  const x=await rows(scope?.privateDbRef||db);
  scope?.assertCurrent?.();
  return x;
 };
 const draft={id,ownerId,category:'Uncategorized',itemType:'Unknown',
  color:'Unknown',sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image:photo,sha256:sha},image:photo};
 const review={confirmed:true,recordId:id,originalSHA256:sha,
  category:'Bottoms',itemType:'Jeans',color:'Blue',singleGarmentConfirmed:true};
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'draft',batch:[structuredClone(draft)]});
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
 const receipt=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>session.authenticated?ownerId:null,
  record:draft,review,cryptoProvider:webcrypto,
  assertLease:()=>session.authenticated&&session.authRef===authRef
 });
 assert.equal(receipt.saved,true);
 const input={getSession,getRevision,readOwnerItems,getBoard,cryptoProvider:webcrypto};
 try{await callback({
  input,db,id,ownerId,async tamper(){const x=(await rows(db))[0];x.color='Red';await add(db,x);},
  async changeUnrelated(){await add(db,{id:'new-old-tab',ownerId,category:'Shoes'});},
  sameOwnerRelogin(){authRef={user:{id:ownerId},assertCurrent(){}};session={...session,authRef};},
  logout(){session={...session,authenticated:false};},
  boardEdit(){board={name:'Revised',slots:{top:id}};},
  setRevision(){revision++;}
 });}finally{db.close();}
}

function viewer(h){
 const auth=h.input.getSession().authRef;
 const selected={id:'saved-board',outfit3dId:'research-fixture-3d-id',
  ownerId:h.ownerId,name:'Safe researched source',slots:{bottom:h.id}};
 const consumer={
  selected:0,
  status:()=>({active:true,dirty:false}),
  readOnlySnapshot:()=>({saved:[selected]}),
  readOnlyGarmentSources91:ids=>({
   ownerId:h.ownerId,sources:ids.map(id=>({id,sha256:sha,
    category:'Bottoms',itemType:'Jeans',color:'Blue',secondaryColor:''}))
  }),
  // Independent real source-byte SHA, not a reused trusted metadata string.
  attestOriginalPhotoBytes92:async ids=>{
   const actual=await rows(h.db);
   return {ownerId:h.ownerId,sources:ids.map(id=>{
    const row=actual.find(x=>x.id===id);
    const bytes=Buffer.from((row?.originalPhoto?.image||'').split(',')[1]||'','base64');
    return {id,sha256:createHash('sha256').update(bytes).digest('hex'),
     category:'Bottoms',itemType:'Jeans',color:'Blue',secondaryColor:''};
   })};
  },
  readOnlyWardrobeRevision93:()=>({ownerId:h.ownerId,revision:1,generation:1})
 };
 const doc={
  hidden:false,visibilityState:'visible',
  getElementById(id){
   if(id==='appShell')return {hidden:false};
   if(id==='authGate')return {hidden:true};
   return null;
  }
 };
 const win={closetAuth:auth};
 return {ownerScope:h.input,consumer,originalNativeAuth:auth,win,doc};
}

function actualProvider(h){
 const v=viewer(h);
 const board=v.consumer;
 board.view=()=>h.input.getBoard();
 board.readOnlyWardrobeRevision93=()=>({ownerId:h.ownerId,generation:1,revision:1});
 let opEpoch=2;
 const ownerScope=createTrustedNativeOwnerScope39({
  consumer:board,authRef:v.originalNativeAuth,privateDbRef:h.db,
  getActualOperationEpoch:()=>opEpoch,
  readActualOwnerItems:async proof=>h.input.readOwnerItems(proof),
  assertOwnerLive:()=>{
   const s=h.input.getSession();
   if(!s.authenticated||s.authRef!==v.originalNativeAuth||s.privateDbRef!==h.db)
    throw Error('synthetic-test-original-owner-revoked');
  }
 });
 return {...v,ownerScope,expireEpoch(){opEpoch++}};
}

test('M40 actual licensed Commons jeans PHOTO119 review & private M39 source → quality HOLD, not 3D grant',()=>testOwner(async h=>{
 const p=actualProvider(h);
 const baseline=await auditNativeOwnerViewer38(p);
 assert.equal(baseline.status,'OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY','M38 original-owner preflight before M40');
 const repeated=await auditNativeOwnerViewer38(p);
 assert.equal(repeated.status,'OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY','M38 sequential owner preflight reentry');
 const q=await assessNative3DQuality40(p);
 assert.equal(q.status,'P89_PUBLIC_SOURCE_ALIGNED_BUT_3D_QUALITY_HOLD',q.blockedAt);
 assert.equal(q.matchedPublicPhotoSources,1);
 assert.equal(q.unmatchedPrivateSources,0);
 assert.deepEqual(q.publicResearchLabels,['commons-0023']);
 assert.ok(q.missingQualityEvidence.includes('INDEPENDENT_PHOTO_FIDELITY_REVIEW_MISSING'));
 assert.ok(q.missingQualityEvidence.includes('COMPLETE_BODY_AND_LAYER_CONTACT_UNPROVEN'));
 assert.equal(q.consumer3DAdmitted,false);
 assert.equal(q.privateOwnerPhotograph3DAuthorized,false);
 assert.equal(q.actualPhotoRealismAccepted,false);
 assert.equal(q.familyAlpha,'HOLD');
 for(const secret of [h.id,h.ownerId,sha,photo])
  assert.equal(JSON.stringify(q).includes(secret),false);
}));
test('M40 does not let forged completed human or mesh flags grant genuine 3D',()=>testOwner(async h=>{
 const p=actualProvider(h);
 p.consumer.independentlyReviewed=true;p.consumer.consumer3DAdmitted=true;
 p.consumer.contactPassed=true;p.consumer.humanRealismAccepted=true;
 p.consumer.approved3DRenderer=true;
 const q=await assessNative3DQuality40(p);
 assert.equal(q.status,'P89_PUBLIC_SOURCE_ALIGNED_BUT_3D_QUALITY_HOLD',q.blockedAt);
 assert.equal(q.consumer3DAdmitted,false);
 assert.equal(q.releaseAuthorized,false);
 assert.equal(q.independentlyReviewed,false);
}));
test('M40 same JPEG recognized public, but mismatched category cannot become verified 3D',()=>testOwner(async h=>{
 const p=actualProvider(h),original=p.consumer.readOnlyGarmentSources91,
  originalBytes=p.consumer.attestOriginalPhotoBytes92;
 p.consumer.readOnlyGarmentSources91=ids=>{
  const out=original(ids);
  return {...out,sources:out.sources.map(x=>({...x,category:'Tops'}))};
 };
 p.consumer.attestOriginalPhotoBytes92=async ids=>{
  const out=await originalBytes(ids);
  return {...out,sources:out.sources.map(x=>({...x,category:'Tops'}))};
 };
 const q=await assessNative3DQuality40(p);
 assert.equal(q.consumer3DAdmitted,false);
 assert.notEqual(q.status,'P89_PUBLIC_SOURCE_ALIGNED_BUT_3D_QUALITY_HOLD');
}));
test('M40 mutated source and session epoch are blocked without private photo leak',()=>testOwner(async h=>{
 const p=actualProvider(h);
 await h.tamper();
 const q=await assessNative3DQuality40(p);
 assert.equal(q.status,'SIGNED_OWNER_OR_ORIGINAL_PHOTO_RECHECK_REQUIRED');
 assert.equal(q.consumer3DAdmitted,false);
 assert.equal(JSON.stringify(q).includes(photo),false);
}));
test('M40 swapped same-ID signed session always fail closes',()=>testOwner(async h=>{
 const p=actualProvider(h);h.sameOwnerRelogin();
 assert.equal((await assessNative3DQuality40(p)).status,
  'SIGNED_OWNER_OR_ORIGINAL_PHOTO_RECHECK_REQUIRED');
}));
test('M40 public source QA ledger cannot be confused with actual human/family acceptance',()=>testOwner(async h=>{
 const p=actualProvider(h);
 const q=await assessNative3DQuality40(p);
 assert.equal(q.originalPhoto2DRequired,true);
 assert.equal(q.actualPhotoRealismAccepted,false);
 assert.equal(q.physicalDeviceVerified,false);
 assert.equal(q.realHostedOwnerVerified,false);
 assert.equal(q.releaseAuthorized,false);
}));
test('M40 strictly opt-in native button checks source research before donor WebGL allocation',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const guard=s.indexOf("params?.get('main40')==='research'");
 const donor=s.indexOf('const donor=await importPinnedDonor()',guard);
 assert.ok(guard>0&&donor>guard);
 assert.match(s.slice(guard,donor),/assessNative3DQuality40/);
 assert.match(s.slice(guard,donor),/MAIN40_QUALITY_REVIEW_REQUIRED/);
 assert.match(s.slice(guard,donor),/params\?\.get\('main39'\)==='research'/);
 assert.equal(s.includes('main40=research&'+'releaseApproved=true'),false);
});
