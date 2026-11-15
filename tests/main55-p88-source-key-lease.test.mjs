/** MAIN1054 M55: P88 source/owner mask-key handoff, NOT a real model-accuracy test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {openP88SourceIntake55} from '../research/master-consolidation-1054/p88-source-key-adapter-55.mjs';
import {canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
import {UNRESOLVED_SEGMENT_STATUS54} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
const sha=createHash('sha256').update(bytes).digest('hex');
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
assert.equal(sha,locked.sha256);
assert.equal(locked.verified,true);
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const proof={image,sourceSHA256:sha,sourceHashVerified:true,
 originalPhoto:{image,sha256:sha,origin:'licensed-public-M55'}};
const maskA='abcdef0123456789'.repeat(4);
const maskB='1234567890abcdef'.repeat(4);
const rect={x:.1,y:.15,width:.3,height:.35};
const schema={types:{Tops:['T-shirt']}};
function live(){
 const state={owner:'synthetic-m55',source:sha,epoch:11,request:'f943bd89-3c8e-4be9-a892-2b883653ff12',
  db:'closet-current-user-synthetic-m55'};
 return {state,callbacks:{
  ownerId:state.owner,requestId:state.request,reviewEpoch:state.epoch,
  getOwner:()=>state.owner,getSourceSHA256:()=>state.source,
  getReviewEpoch:()=>state.epoch,getActiveRequestId:()=>state.request,
  getDbName:()=>state.db
 }};
}
function event(state,{ordinal=0,mask=maskA,method='native_semantic_group',
  source=sha,hint={categories:['Tops'],types:['T-shirt'],confidence:.99,clipped:false},
  override={}}={}){
 return {type:'piece',id:state.request,piece:{
  image:'data:image/jpeg;base64,PRIVATE',ownerId:'FOREIGN',maskPixels:'SECRET',
  cropBounds:rect,hint,colorEstimate:{color:'Blue',private:'DO-NOT-COPY'},
  instanceMethod:method,
  reconciliation70:{sourceSha256:source,maskSha256:mask,instanceOrdinal:ordinal,method},
  ...override
 }};
}
async function session(){const l=live();return {...l,intake:await openP88SourceIntake55({proof,...l.callbacks})};}
test('M55 authentic checked-in licensed source bytes are exact, unaltered, and eligible for P88 budget',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
 assert.ok(image.length<=12_000_000);
});
test('M55 P88 request explicitly enables research receipts without sending owner ID or changing original',async()=>{
 const {intake}=await session();
 assert.deepEqual(intake.workerRequest(),{
  id:'f943bd89-3c8e-4be9-a892-2b883653ff12',
  image,instanceReview70:true,instanceReview840:true
 });
 intake.close();
});
test('M55 valid P88 source/mask/ordinal is assigned deterministic bounded key, still unreviewed',async()=>{
 const {state,intake}=await session();
 const first=intake.intake(event(state));
 assert.equal(first.accepted,true,first.reason);
 assert.equal(first.piece.instanceKey,'seg-'+BigInt('0x'+maskA).toString(10));
 assert.equal(first.piece.personDetected,false);
 assert.deepEqual(first.piece.cropBounds,rect);
 assert.equal(first.piece.hint.categories[0],'Tops');
 assert.equal(first.piece.hint.componentReviewStatus,undefined);
 assert.deepEqual(Object.keys(first.piece).sort(),
  ['colorEstimate','cropBounds','hint','instanceKey','personDetected']);
 assert.equal(JSON.stringify(first.piece).includes('SECRET'),false);
 assert.equal(JSON.stringify(first.piece).includes('FOREIGN'),false);
 assert.equal(JSON.stringify(first.piece).includes('DO-NOT-COPY'),false);
 assert.equal(canConfirmScene32({...first.piece,category:'Tops',
  itemType:'T-shirt',color:'Blue',cropReviewed:false},schema),false);
 intake.close();
});
test('M55 source hash mismatch and missing attested P88 mask are rejected, not assigned guessed keys',async()=>{
 const a=await session();
 assert.equal(a.intake.intake(event(a.state,{source:'0'.repeat(64)})).reason,
  'invalid-P88-source-mask-receipt');
 a.intake.close();
 const b=await session();
 assert.equal(b.intake.intake(event(b.state,{
  override:{reconciliation70:undefined}
 })).reason,'invalid-P88-source-mask-receipt');
 b.intake.close();
});
test('M55 reusing an identical mask under a different ordinal cannot produce a duplicate closet item',async()=>{
 const {state,intake}=await session();
 const one=intake.intake(event(state));
 assert.equal(one.accepted,true);
 const replay=intake.intake(event(state,{ordinal:1}));
 assert.equal(replay.accepted,false);
 assert.equal(replay.reason,'duplicate-source-mask');
 // A genuinely distinct claimed mask is a separate *unverified* proposal.
 const two=intake.intake(event(state,{ordinal:2,mask:maskB}),[{...one.piece,manual:false}]);
 assert.equal(two.accepted,true,two.reason);
 assert.notEqual(one.piece.instanceKey,two.piece.instanceKey);
 intake.close();
});
test('M55 invalid ordinal, malformed hint, or inconsistent method cannot bypass intake',async()=>{
 const a=await session();
 assert.equal(a.intake.intake(event(a.state,{ordinal:3})).reason,
  'invalid-P88-source-mask-receipt');
 a.intake.close();
 const b=await session();
 assert.equal(b.intake.intake(event(b.state,{
  override:{instanceMethod:'new-method'}
 })).reason,'invalid-P88-source-mask-receipt');
 b.intake.close();
 const c=await session();
 assert.equal(c.intake.intake(event(c.state,{hint:['Tops']})).reason,
  'invalid-P88-source-mask-receipt');
 c.intake.close();
});
test('M55 P88 unresolved same-class negative source metadata reaches M54 veto intact',async()=>{
 const {state,intake}=await session();
 const res=intake.intake(event(state,{method:'native_semantic_group_unresolved_fragments'}));
 assert.equal(res.accepted,true);
 assert.equal(res.piece.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 assert.equal(canConfirmScene32({...res.piece,category:'Tops',
  itemType:'T-shirt',color:'Blue',cropReviewed:true},schema),false);
 intake.close();
});
test('M55 unknown future P88 mask method is quarantined, never treated as approved',async()=>{
 const {state,intake}=await session();
 const res=intake.intake(event(state,{
  method:'future-method-unsupported'
 }));
 assert.equal(res.accepted,true);
 assert.equal(res.piece.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 intake.close();
});
test('M55 old request, owner switch, source switch, revision change and DB switch fail closed',async()=>{
 for(const field of ['owner','source','epoch','request','db']){
  const {state,intake}=await session();
  state[field]=field==='epoch'?12:'changed';
  assert.equal(intake.intake(event({...state,request:'f943bd89-3c8e-4be9-a892-2b883653ff12'})).reason,
   'stale-source-or-owner-lease',field);
  assert.throws(()=>intake.workerRequest(),/stale source or owner lease/);
 }
});
test('M55 wrong message request never advances ordinal, completed session cannot revive',async()=>{
 const {state,intake}=await session();
 const foreign=event(state);foreign.id='foreign-request';
 assert.equal(intake.intake(foreign).reason,'wrong-worker-session');
 assert.equal(intake.intake(event(state)).accepted,true);
 intake.close();
 assert.equal(intake.intake(event(state,{ordinal:1})).reason,'stale-source-or-owner-lease');
});
test('M55 forged/modified original and untrusted owner lease never open',async()=>{
 const l=live();
 await assert.rejects(openP88SourceIntake55({proof:{
  ...proof,sourceSHA256:'f'.repeat(64)
 },...l.callbacks}),/unverified original JPEG/);
 await assert.rejects(openP88SourceIntake55({
  proof,...l.callbacks,getOwner:()=> 'foreign-account'
 }),/stale source or owner lease/);
});
