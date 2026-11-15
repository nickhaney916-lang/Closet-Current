/**
 * MAIN1054 M54: source-grounded fail-closed P88 unresolved semantic mask
 * through real opt-in MULTI24 intake -> human UI gate -> atomic IDB commit.
 * Original public licensed Commons photograph; test-owner is SYNTHETIC.
 * Does NOT establish model accuracy, real human proof, or default release.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {
 UNRESOLVED_SEGMENT_STATUS54,unresolvedSegmentation54,
 sanitizeSegmentHint50,minimalPieceSnapshot51,verifiedRecord24,atomicSaveGarments24
} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {intakeProposal58} from '../research/multi-garment-capture-01/detection-intake-58.mjs';
import {canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';

if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const original=readFileSync('benchmark/fixtures/commons-0003.jpg');
const digest=createHash('sha256').update(original).digest('hex');
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json'))
 .find(x=>x.id==='commons-0003');
assert.equal(digest,locked.sha256);
assert.equal(locked.verified,true);
const image='data:image/jpeg;base64,'+original.toString('base64');
const proof={image,sourceSHA256:digest,sourceHashVerified:true,
 originalPhoto:{image,sha256:digest,origin:'licensed-source-M54'}};
const schema={types:{Tops:['T-shirt','Hoodie','Sweatshirt'],
 Bottoms:['Jeans'],Dresses:['Casual dress'],
 Outerwear:['Jacket'],Shoes:['Sneakers']}};
const normalHint=()=>({categories:['Tops'],types:['T-shirt'],clipped:false,
 confidence:.98});
const unresolved=()=>({...normalHint(),
 componentReviewStatus:UNRESOLVED_SEGMENT_STATUS54,
 instanceMethod:'native_semantic_group_unresolved_fragments'});
const piece=(id,hint,opts={})=>({
 id,instanceKey:'seg-4-'+id.replace(/[^0-9]/g,'').padEnd(2,'0')+'-12-45-45-1',
 image,cropBounds:{x:.09,y:.08,width:.42,height:.46},
 confirmed:true,cropReviewed:true,manual:false,
 category:'Tops',itemType:'T-shirt',color:'Blue',
 hint,...opts
});
// #88 actual outfit-worker.mjs delivers instanceMethod at top level, and
// its hint contains only categories/types/clipped/confidence.
const worker=(method='native_semantic_group_unresolved_fragments')=>({
 instanceKey:'seg-4-10-12-45-45-1',
 cropBounds:{x:.09,y:.08,width:.42,height:.46},
 personDetected:true,colorEstimate:{color:'Blue'},
 instanceMethod:method,hint:normalHint()
});
function dbOpen(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const rows=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items','readonly').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function local(action){
 const owner='m54-'+randomUUID(),db=await dbOpen(owner);
 try{return await action({owner,db,save:pieces=>atomicSaveGarments24({
   db,ownerId:owner,currentOwner:()=>owner,proof,pieces
  })});}finally{db.close();}
}
test('M54 authentic original licensed multi-piece source JPEG and original SHA are frozen',()=>{
 assert.equal(createHash('sha256').update(original).digest('hex'),digest);
 assert.equal(proof.originalPhoto.image,proof.image);
 assert.equal(proof.originalPhoto.sha256,proof.sourceSHA256);
});
test('M54 an exact P88 source fragment status survives bounded sanitizer; worker secrets do not',()=>{
 const payload=unresolved();
 payload.photo=image;
 payload.mask=new Uint8Array(10000);
 payload.ownerSecret='SENSITIVE';
 const clean=sanitizeSegmentHint50(payload);
 assert.deepEqual(clean,{
  categories:['Tops'],types:['T-shirt'],clipped:false,confidence:.98,
  componentReviewStatus:UNRESOLVED_SEGMENT_STATUS54
 });
 assert.equal(unresolvedSegmentation54(clean),true);
 assert.equal(JSON.stringify(clean).includes('SENSITIVE'),false);
 assert.equal(JSON.stringify(clean).includes('data:image'),false);
});
test('M54 unknown future component review/method evidence fails closed instead of silently disappearing',()=>{
 for(const hint of [
  {...normalHint(),componentReviewStatus:'new_unsupported_unseen_region'},
  {...normalHint(),componentReviewStatus:{value:'owner_must_confirm_garment_units'}},
  {...normalHint(),instanceMethod:'unrecognized_semantic_source'},
  {...normalHint(),componentReviewStatus:UNRESOLVED_SEGMENT_STATUS54,
   instanceMethod:'connected_semantic_component_unverified'}
 ]){
  assert.equal(unresolvedSegmentation54(hint),true);
  assert.equal(sanitizeSegmentHint50(hint).componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 }
});
test('M54 explicitly reviewed valid known instance methods are not falsely rejected',()=>{
 for(const hint of [
  normalHint(),
  {...normalHint(),componentReviewStatus:'owner_must_confirm_garment_units',
   instanceMethod:'connected_semantic_component_unverified'},
  {...normalHint(),instanceMethod:'native_semantic_group'},
  {...normalHint(),instanceMethod:'connected_footwear_component'}
 ]){
  assert.equal(unresolvedSegmentation54(hint),false);
  assert.deepEqual(sanitizeSegmentHint50(hint),{
   categories:['Tops'],types:['T-shirt'],clipped:false,confidence:.98
  });
 }
 assert.equal(sanitizeSegmentHint50(unresolved(),{manual:true}),null,
  'manual evidence never forges detector hint');
});
test('M54 real model-to-review intake retains only negative P88 source flag and never saves garment',()=>{
 const raw=worker();raw.ownerId='FOREIGN';raw.image=image;
 raw.hint.originalPhoto=image;
 const result=intakeProposal58(raw,[],1);
 assert.equal(result.accepted,true);
 assert.equal(result.piece.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 assert.equal(result.piece.hint.instanceMethod,undefined);
 assert.equal(Object.hasOwn(result.piece,'image'),false);
 assert.equal(Object.hasOwn(result.piece,'ownerId'),false);
 assert.equal(result.piece.hint.originalPhoto,undefined);
 assert.equal(result.piece.hint.categories[0],'Tops');
 assert.equal(result.piece.hint.instanceMethod,undefined,
  'only the bounded negative verdict may be persisted, not worker method text');
});
test('M54 P88 actual top-level safe method remains a review suggestion with no invented veto',()=>{
 for(const method of ['native_semantic_group',
  'connected_footwear_component','connected_semantic_component_unverified']){
  const next=intakeProposal58(worker(method),[],1);
  assert.equal(next.accepted,true);
  assert.equal(next.piece.hint.componentReviewStatus,undefined);
  assert.equal(next.piece.hint.confidence,.98);
 }
});
test('M54 a new unsupported top-level P88 worker method is quarantined before owner save',()=>{
 const next=intakeProposal58(worker('future_unknown_fragment_merger'),[],1);
 assert.equal(next.accepted,true);
 assert.equal(next.piece.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 assert.equal(canConfirmScene32({...piece('10',next.piece.hint)},schema),false);
});
test('M54 malformed/array hint stays invalid even if a worker supplies a real source method',()=>{
 const malformed={...worker(),hint:['Tops']};
 assert.equal(intakeProposal58(malformed,[],1).accepted,false);
});
test('M54 owner category/type/color and crop review cannot confirm an unresolved multi-garment mask',()=>{
 const safe=piece('10',normalHint());
 const flagged=piece('10',unresolved());
 assert.equal(canConfirmScene32(safe,schema),true);
 assert.equal(canConfirmScene32(flagged,schema),false);
 assert.equal(canConfirmScene32({...flagged,cropReviewed:true,color:'Black'},schema),false);
 assert.throws(()=>verifiedRecord24({proof,ownerId:'m54-owner',piece:flagged}),
  /unresolved source fragments/);
});
test('M54 low-level immutable snapshot cannot erase veto when forged manual flag is true',()=>{
 const flagged=piece('10',unresolved(),{manual:true,instanceKey:'manual-100-100-400-400'});
 const snapshot=minimalPieceSnapshot51(flagged,proof);
 assert.equal(snapshot.manual,true);
 assert.equal(snapshot.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 assert.throws(()=>verifiedRecord24({proof,ownerId:'m54-owner',piece:snapshot}),
  /unresolved source fragments/);
});
test('M54 one unresolved proposal vetoes whole private IDB batch, including independently selected normal neighbor',()=>local(async({db,save})=>{
 const normal=piece('10',normalHint());
 const bad=piece('11',unresolved(),{
  instanceKey:'seg-4-75-75-18-18-1',
  cropBounds:{x:.66,y:.66,width:.18,height:.18}
 });
 await assert.rejects(save([normal,bad]),/unresolved source fragments/);
 assert.deepEqual(await rows(db),[],
  'a blocked same-class aggregate cannot partially save a seemingly valid other piece');
}));
test('M54 forged manual override still cannot atomically save an unresolved P88 source mask',()=>local(async({db,save})=>{
 const disguised=piece('10',unresolved(),{
  manual:true,instanceKey:'manual-120-180-250-280',
  cropBounds:{x:.12,y:.18,width:.25,height:.28}
 });
 await assert.rejects(save([disguised]),/unresolved source fragments/);
 assert.deepEqual(await rows(db),[]);
}));
test('M54 missing external status is never invented as clearance; separately re-photographed manual piece still saves under existing explicit owner gates',()=>local(async({db,owner,save})=>{
 const manuallyRemarked=piece('10',null,{
  manual:true,instanceKey:'manual-120-180-250-280',
  cropBounds:{x:.12,y:.18,width:.25,height:.28}
 });
 const saved=await save([manuallyRemarked]);
 assert.equal(saved.length,1);
 assert.equal(saved[0].ownerId,owner);
 assert.equal(saved[0].originalPhoto.image,image);
 assert.equal(saved[0].sourceSHA256,digest);
 assert.equal(saved[0].segmentHint,null);
 assert.equal(saved[0].photoOnly,true);
 assert.equal(saved[0].threeDReady,false);
 assert.equal((await rows(db)).length,1);
}));
test('M54 native opt-in UI shows separate-photo warning and leaves checkbox under source veto',()=>{
 const src=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(src,/maskReview54='recapture-required'/);
 assert.match(src,/This proposed region may contain more than one garment or unresolved fragments/);
 assert.match(src,/canConfirmScene32\(p,schema\)/);
 assert.match(src,/atomicSaveGarments24/);
 assert.match(src,/Remove detection/);
});
