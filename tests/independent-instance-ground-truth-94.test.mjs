import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 INSTANCE_PACKET_94,INSTANCE_REVIEW_94,makeInstancePacket94,verifyPacket94,
 validatePolygon94,validateInstanceReview94,polygonIoU94,
 reconcileIndependentInstanceReviews94,scoreIndependentInstanceMasks94
} from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';

const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sample=sources.slice(0,3);
const a=makeInstancePacket94({sources:sample,role:'A'});
const b=makeInstancePacket94({sources:sample,role:'B'});
const c=makeInstancePacket94({sources:sample,role:'C'});
const square=(x=.12,y=.18,w=.3,h=.35)=>[
 {x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}
];
const garment=(polygon=square(),category='Tops',itemType='T-shirt')=>({
 category,itemType,primaryColor:'Blue',secondaryColor:'White',polygon
});
const review=(packet,reviewerId,labels=null)=>({
 schema:INSTANCE_REVIEW_94,role:packet.role,packetId:packet.packetId,
 reviewerId,method:'direct-human-visual-review',independent:true,
 identityVerification:'SELF_ATTESTED_NOT_VERIFIED',
 rows:packet.items.map((x,i)=>({
  id:x.id,sourceSHA256:x.sourceSHA256,reviewerId,
  reviewedAt:'2026-11-05T16:00:00.000Z',
  noGarments:false,note:'Direct QA sample only — not an independent human review.',
  instances:labels?.[x.id]??[garment()]
 }))
});
test('INSTANCE94 59 genuine source SHA-bound mask packets hide historical labels, model scores and splits',()=>{
 assert.equal(sources.length,59);
 const p=makeInstancePacket94({sources,role:'A'});
 const q=makeInstancePacket94({sources,role:'B'});
 assert.equal(p.total,59);assert.equal(q.total,59);
 assert.equal(p.schema,INSTANCE_PACKET_94);assert.equal(verifyPacket94(p),true);
 assert.notEqual(p.packetId,q.packetId);
 assert.equal(p.items.some((x,i)=>x.id!==q.items[i].id),true);
 const text=JSON.stringify(p);
 for(const field of ['expectedCategory','expectedType','predictions','locked-evaluation',
  'modelConfidence','imagePixels','data:image'])
  assert.equal(text.includes('"'+field+'"'),false);
});
test('INSTANCE94 packet rejects unverified source or duplicate original photo SHA',()=>{
 assert.throws(()=>makeInstancePacket94({sources:[sample[0],{...sample[0],id:'duplicate-id'}],role:'A'}),
  /nonunique or unverified/);
 assert.throws(()=>makeInstancePacket94({sources:[{...sample[0],verified:false}],role:'B'}),
  /nonunique or unverified/);
 assert.throws(()=>makeInstancePacket94({sources:sample,role:'X'}),/invalid blinded packet/);
});
test('INSTANCE94 packet ID rejects changed original photo SHA, leaked auto labels and duplicate photo',()=>{
 const packet=structuredClone(a);packet.items[0].sourceSHA256='f'.repeat(64);
 assert.throws(()=>verifyPacket94(packet),/packet SHA-256 identity mismatch/);
 const other=structuredClone(a);other.items[0].expectedCategory='Tops';
 assert.throws(()=>verifyPacket94(other),/untrusted source identity or leaked source fields/);
});
test('INSTANCE94 valid normalized non-self-intersecting original-photo polygons have positive source area',()=>{
 assert.ok(validatePolygon94(square()).area>.1);
 assert.equal(polygonIoU94(square(),square()),1);
 assert.ok(polygonIoU94(square(),square(.13,.19,.3,.35))>.8);
 assert.equal(polygonIoU94(square(),square(.63,.62,.2,.2)),0);
});
test('INSTANCE94 refuses out-of-bounds, self-intersecting, duplicated points, zero area or too many vertices',()=>{
 for(const shape of [
  [{x:0,y:0},{x:1,y:1}],
  [{x:0,y:0},{x:2,y:.3},{x:.2,y:.4}],
  [{x:.1,y:.1},{x:.4,y:.4},{x:.1,y:.4},{x:.4,y:.1}],
  [{x:.1,y:.1},{x:.1,y:.1},{x:.4,y:.3}],
  [{x:.1,y:.1},{x:.10001,y:.1},{x:.1,y:.10001}],
  Array.from({length:97},(_,i)=>({x:(i%50)/100,y:(i%47)/100}))
 ])assert.throws(()=>validatePolygon94(shape),/INSTANCE94/);
});
test('INSTANCE94 source bound per-garment reviewer export has no JPEG bytes and supports multiple separate masks',()=>{
 const packet=makeInstancePacket94({sources:sample,role:'A',onlyIds:[sample[0].id]});
 const claim=review(packet,'human-qa-A');
 claim.rows[0].instances=[garment(square()),garment(square(.56,.18,.25,.3),'Bottoms','Jeans')];
 const validated=validateInstanceReview94(packet,claim);
 assert.equal(validated.rows[0].instances.length,2);
 assert.equal(validated.complete,true);
 assert.equal(validated.humanIndependenceVerified,false);
 assert.equal(JSON.stringify(validated).includes('data:image'),false);
});
test('INSTANCE94 source SHA swap, fabricated independence, invalid subtype/color and duplicate source row fail closed',()=>{
 const p=review(a,'independent-qa-A');
 const badSHA=structuredClone(p);badSHA.rows[0].sourceSHA256='e'.repeat(64);
 assert.throws(()=>validateInstanceReview94(a,badSHA),/duplicate, unbound/);
 const fake=structuredClone(p);fake.independent=false;
 assert.throws(()=>validateInstanceReview94(a,fake),/invalid or dishonest/);
 const subtype=structuredClone(p);subtype.rows[0].instances[0].itemType='Ankle boots';
 assert.throws(()=>validateInstanceReview94(a,subtype),/invalid individual garment/);
 const colors=structuredClone(p);colors.rows[0].instances[0].secondaryColor='Blue';
 assert.throws(()=>validateInstanceReview94(a,colors),/invalid individual garment/);
 const duplicated=structuredClone(p);duplicated.rows[0].instances.push(duplicated.rows[0].instances[0]);
 assert.throws(()=>validateInstanceReview94(a,duplicated),/duplicate polygon instances/);
});
test('INSTANCE94 explicit negative photos require a human note and zero masks',()=>{
 const p=review(a,'independent-qa-A');
 p.rows[0].noGarments=true;p.rows[0].instances=[];p.rows[0].note='No clothing visible after direct visual inspection.';
 assert.ok(validateInstanceReview94(a,p));
 p.rows[0].note='short';
 assert.throws(()=>validateInstanceReview94(a,p),/explicit human observation/);
});
test('INSTANCE94 two distinct same-source humans with matching instance polygons are merely reconciled, not independently verified people',()=>{
 const result=reconcileIndependentInstanceReviews94({
  packetA:a,reviewA:review(a,'human-A'),
  packetB:b,reviewB:review(b,'human-B')
 });
 assert.equal(result.count.sources,3);
 assert.equal(result.count.accepted,3);assert.equal(result.pending.length,0);
 assert.equal(result.humanIdentityVerified,false);assert.equal(result.scientificAccepted,false);
 assert.equal(result.releaseAuthorized,false);
});
test('INSTANCE94 same human A and B forbidden regardless of packet order',()=>{
 assert.throws(()=>reconcileIndependentInstanceReviews94({
  packetA:a,reviewA:review(a,'human-A'),
  packetB:b,reviewB:review(b,'human-A')
 }),/distinct A\/B/);
});
test('INSTANCE94 differing overlapping masks, subtype or color require a distinct third source-bound human',()=>{
 const rA=review(a,'human-A'),rB=review(b,'human-B');
 rB.rows[0].instances[0].itemType='Sweatshirt';
 const result=reconcileIndependentInstanceReviews94({
  packetA:a,reviewA:rA,packetB:b,reviewB:rB
 });
 assert.equal(result.count.accepted,2);assert.equal(result.pending.length,1);
 assert.equal(result.disagreements.length,1);
 assert.equal(result.pending[0].reason,'third-human-mask-adjudication-required');
 const cResult=reconcileIndependentInstanceReviews94({
  packetA:a,reviewA:rA,packetB:b,reviewB:rB,
  packetC:c,reviewC:review(c,'human-C')
 });
 assert.equal(cResult.count.accepted,3);
 assert.equal(cResult.count.thirdAdjudications,1);
 assert.equal(cResult.humanIdentityVerified,false);
});
test('INSTANCE94 evaluator counts missed overlapping real instances as false negatives and wrong colors as errors',()=>{
 const truth=[
  {id:'test-one',sourceSHA256:'a'.repeat(64),
   instances:[garment(square()),garment(square(.58,.21,.24,.35),'Bottoms','Jeans')]},
  {id:'test-negative',sourceSHA256:'b'.repeat(64),instances:[]}
 ];
 const predictions=[
  {id:'test-one',sourceSHA256:'a'.repeat(64),instances:[
   {...garment(),primaryColor:'Red'}]},
  {id:'test-negative',sourceSHA256:'b'.repeat(64),instances:[
   garment(square(.2,.2,.25,.3))]}
 ];
 const report=scoreIndependentInstanceMasks94({accepted:truth,predictions});
 assert.equal(report.truePositive,1);
 assert.equal(report.falseNegative,1);
 assert.equal(report.falsePositive,1);
 assert.equal(report.detectionPrecision,.5);
 assert.equal(report.detectionRecall,.5);
 assert.equal(report.categoryAccuracyIncludingMissed,.5);
 assert.equal(report.subtypeAccuracyIncludingMissed,.5);
 assert.equal(report.primaryColorAccuracyIncludingMissed,0);
 assert.equal(report.scientificVerdict,'EXPLORATORY_ONLY_UNLESS_INDEPENDENCE_AUDITED');
 assert.equal(report.releaseAuthorized,false);
});
test('INSTANCE94 evaluator rejects duplicate, missing, extra or cross-SHA predictions; no silent denominator shrinkage',()=>{
 const accepted=[{id:'source-A',sourceSHA256:'a'.repeat(64),instances:[garment()]}];
 for(const predictions of [
  [],[{id:'source-A',sourceSHA256:'b'.repeat(64),instances:[garment()]}],
  [{id:'source-A',sourceSHA256:'a'.repeat(64),instances:[garment()]},
   {id:'source-B',sourceSHA256:'b'.repeat(64),instances:[]}],
  [{id:'source-A',sourceSHA256:'a'.repeat(64),instances:[garment()]},
   {id:'source-A',sourceSHA256:'a'.repeat(64),instances:[]}]
 ])assert.throws(()=>scoreIndependentInstanceMasks94({accepted,predictions}),/INSTANCE94/);
});
test('INSTANCE94 source packet builder and offline browser annotation never auto-claim human-reviewed truth',()=>{
 const builder=readFileSync('scripts/build-independent-instance-packets-94.mjs','utf8');
 const ui=readFileSync('research/independent-instance-ground-truth-94/annotate.html','utf8');
 assert.match(builder,/independentHumanMaskReviews:0/);
 assert.match(builder,/actualModelInstanceIoUMeasured:false/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(ui,/const canvas=\$\('photoCanvas'\)/);
 assert.match(ui,/const polygon=vertices\.map/);
 assert.match(ui,/instances\.push\(\{category:/);
 assert.match(ui,/identityVerification:'SELF_ATTESTED_NOT_VERIFIED'/);
 assert.doesNotMatch(ui,/localStorage\.setItem|indexedDB\.open|modelConfidence|predict\(/);
});
