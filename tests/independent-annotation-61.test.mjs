import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 makeBlindPacket61,validateHumanExport61,reconcileHumanExports61,
 makeBlindPacketHash61,REVIEW_PROTOCOL61
} from '../research/independent-annotation-61/blinded-review.mjs';
import {resolveIndependentTruth60} from '../research/recognition-ground-truth-gate-60/ground-truth-gate.mjs';
const parse=path=>JSON.parse(readFileSync(path,'utf8'));
const sets={development:parse('benchmark/manifest-reviewed-32.json'),
 validation:parse('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':parse('benchmark/manifest-holdout-16.json')};
const sources=parse('benchmark/locked-photo-sources.json');
const packets=()=>({
 a:makeBlindPacket61({sets,sources,role:'A'}),
 b:makeBlindPacket61({sets,sources,role:'B'})
});
const vote=(item,reviewerId,over={})=>({
 id:item.id,sourceSHA256:item.sourceSHA256,reviewerId,
 independent:true,method:'direct-human-visual-review',reviewedAt:'2026-11-05T12:00:00.000Z',
 category:'Tops',itemType:'T-shirt',primaryColor:'Blue',secondaryColor:null,
 uncertain:false,uncertaintyReason:null,notes:'Synthetic unit fixture only',...over
});
const exported=(packet,id,rows)=>({
 schema:REVIEW_PROTOCOL61,packetId:packet.packetId,role:packet.role,
 reviewerId:id,independent:true,method:'direct-human-visual-review',
 completed:rows.length,total:packet.total,incomplete:rows.length!==packet.total,
 identityVerification:'SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED',
 rows
});
test('BLIND61 actual 59 source JPEG packets A/B omit old labels, split and all AI predictions',()=>{
 const {a,b}=packets();
 assert.equal(a.total,59);assert.equal(b.total,59);
 assert.notEqual(a.packetId,b.packetId);
 assert.equal(makeBlindPacketHash61(a),a.packetId);
 assert.equal(makeBlindPacketHash61(b),b.packetId);
 assert.notDeepEqual(a.items.map(x=>x.id),b.items.map(x=>x.id));
 assert.equal(new Set(a.items.map(x=>x.sourceSHA256)).size,59);
 assert.deepEqual(Object.keys(a.items[0]).sort(),['id','image','sourceSHA256']);
 for(const p of [a,b]){
  assert.equal(p.blinded,true);
  const payload=JSON.stringify(p);
  for(const privateName of ['expectedCategory','expectedType','acceptedTypes','holdout','modelScore','predictedType','reviewerPeerVote'])
   assert.equal(payload.includes('"'+privateName+'"'),false,privateName);
  assert.ok(p.neverShown.includes('holdout-allocation'));
 }
});
test('BLIND61 actual historical accessories/Scarf label cannot leak to visual review data',()=>{
 const {a}=packets(),p=a.items.find(x=>x.id==='validation-0008');
 assert.ok(p);
 assert.equal(JSON.stringify(p).includes('Accessories'),false);
 assert.equal(JSON.stringify(p).includes('Scarf'),false);
});
test('BLIND61 only reviewed source SHA and a valid real taxonomy/primary color are accepted for synthetic protocol fixture',()=>{
 const {a}=packets(),row=vote(a.items[0],'human-A');
 const good=exported(a,'human-A',[row]);
 const v=validateHumanExport61(a,good);
 assert.equal(v.reviewed,1);assert.equal(v.total,59);
 assert.equal(v.complete,false);
 assert.equal(v.independenceSelfAttestedNotVerified,true);
 for(const invalid of [
  {...row,primaryColor:null},{...row,category:'Accessories',itemType:'Scarf'},
  {...row,itemType:'Ankle boots'},{...row,primaryColor:'BLUEISH'},
  {...row,secondaryColor:'Blue'},
  {...row,sourceSHA256:'f'.repeat(64)},{...row,independent:false},
  {...row,reviewerId:'another-reviewer'}
 ])assert.throws(()=>validateHumanExport61(a,exported(a,'human-A',[invalid])),/BLIND61/);
});
test('BLIND61 negative/non-garment review is deliberate and must not contain clothing colors',()=>{
 const {a}=packets(),item=a.items.find(x=>x.id==='commons-0046');
 const noGarment=vote(item,'human-A',{category:'Uncategorized',itemType:'Unknown',primaryColor:null});
 assert.equal(validateHumanExport61(a,exported(a,'human-A',[noGarment])).reviewed,1);
 assert.throws(()=>validateHumanExport61(a,exported(a,'human-A',[{...noGarment,primaryColor:'Blue'}])),/invalid/);
});
test('BLIND61 ambiguous/out-of-scope color or accessory is retained as unresolved instead of guessed truth',()=>{
 const {a,b}=packets(),item=a.items.find(x=>x.id==='validation-0008');
 const unavailable=vote(item,'human-A',{category:null,itemType:null,primaryColor:null,uncertain:true,
  uncertaintyReason:'Scarf / accessory is outside current five-family closet taxonomy'});
 const available=vote(b.items.find(x=>x.id===item.id),'human-B');
 const results=reconcileHumanExports61(a,exported(a,'human-A',[unavailable]),
  b,exported(b,'human-B',[available]));
 assert.equal(results.count.pending,59);
 assert.equal(results.count.accepted,0);
 assert.equal(results.pending.find(x=>x.id===item.id).reason,'reviewer-marked-ambiguous-or-out-of-scope');
});
test('BLIND61 A and B are isolated until reconciliation; two conflicting primary colors need a truly separate C identity',()=>{
 const {a,b}=packets(),first=a.items[0],second=b.items.find(x=>x.id===first.id);
 const aa=exported(a,'human-A',[vote(first,'human-A')]);
 const bb=exported(b,'human-B',[vote(second,'human-B',{primaryColor:'Red'})]);
 const report=reconcileHumanExports61(a,aa,b,bb);
 assert.equal(report.count.disagreements,1);
 assert.equal(report.count.accepted,0);
 assert.equal(report.pending.find(x=>x.id===first.id).reason,'separate-third-human-adjudication-required');
 assert.deepEqual(report.thirdHumanPacketIDs,[first.id]);
 assert.equal(JSON.stringify(report).includes('primaryColor'),false,'Conflict brief never reveals either reviewer color');
 const c=makeBlindPacket61({sets,sources,role:'C',onlyIds:report.thirdHumanPacketIDs});
 assert.equal(c.total,1);
 const cc=exported(c,'human-C',[vote(c.items[0],'human-C',{primaryColor:'Green'})]);
 const resolved=reconcileHumanExports61(a,aa,b,bb,c,cc);
 assert.equal(resolved.count.accepted,1);
 assert.equal(resolved.count.pending,58);
 assert.equal(resolved.adjudications[first.id].adjudication.primaryColor,'Green');
 assert.equal(resolved.releaseAuthorized,false);
 assert.equal(resolved.humanIndependenceVerified,false);
});
test('BLIND61 same person and duplicate source responses fail even when they assert independence',()=>{
 const {a,b}=packets(),first=a.items[0],second=b.items.find(x=>x.id===first.id);
 const aa=exported(a,'human-A',[vote(first,'human-A')]);
 const bb=exported(b,'human-A',[vote(second,'human-A')]);
 assert.throws(()=>reconcileHumanExports61(a,aa,b,bb),/same reviewer/);
 assert.throws(()=>validateHumanExport61(a,exported(a,'human-A',[aa.rows[0],aa.rows[0]])),/duplicate/);
});
test('BLIND61 packet role/hash tampering and malicious source hashes cannot be accepted',()=>{
 const {a}=packets(),one=vote(a.items[0],'human-A');
 assert.throws(()=>validateHumanExport61({...a,packetId:'0'.repeat(64)},exported(a,'human-A',[one])),/packet tampered/);
 assert.throws(()=>validateHumanExport61({...a,role:'C'},exported(a,'human-A',[one])),/packet tampered/);
 const tampered=structuredClone(a);
 tampered.items[0].sourceSHA256='f'.repeat(64);
 assert.throws(()=>validateHumanExport61(tampered,exported(a,'human-A',[one])),/packet tampered/);
});
test('BLIND61 third adjudicator cannot borrow A or B identity, source SHA or mislabeled sample',()=>{
 const {a,b}=packets(),one=a.items[0];
 const aa=exported(a,'human-A',[vote(one,'human-A')]);
 const bb=exported(b,'human-B',[vote(b.items.find(x=>x.id===one.id),'human-B',{primaryColor:'Red'})]);
 const c=makeBlindPacket61({sets,sources,role:'C',onlyIds:[one.id]});
 const bad=exported(c,'human-A',[vote(c.items[0],'human-A')]);
 assert.throws(()=>reconcileHumanExports61(a,aa,b,bb,c,bad),/third human/);
 const missing=exported(c,'human-C',[vote(c.items[0],'human-C',{sourceSHA256:'f'.repeat(64)})]);
 assert.throws(()=>reconcileHumanExports61(a,aa,b,bb,c,missing),/misbound review source/);
});
test('BLIND61 corrected ground truth accepts two human votes contradicting a provisional category or negative',()=>{
 const sha='a'.repeat(64),g=vote({id:'source',sourceSHA256:sha},'human-A',
  {category:'Uncategorized',itemType:'Unknown',primaryColor:null});
 const h={...g,reviewerId:'human-B'};
 const negativeFromHistoricalGarment=resolveIndependentTruth60(
  {id:'source',sha256:sha,expectedCategory:'Tops'},
  {sourceSHA256:sha,independentReviews:[g,h]});
 assert.equal(negativeFromHistoricalGarment.accepted,true);
 assert.equal(negativeFromHistoricalGarment.label.category,'Uncategorized');
 const trueGarment=vote({id:'source',sourceSHA256:sha},'human-A'),trueGarmentB={...trueGarment,reviewerId:'human-B'};
 const garmentFromHistoricalNegative=resolveIndependentTruth60(
  {id:'source',sha256:sha,expectedCategory:'Uncategorized'},
  {sourceSHA256:sha,independentReviews:[trueGarment,trueGarmentB]});
 assert.equal(garmentFromHistoricalNegative.accepted,true);
 assert.equal(garmentFromHistoricalNegative.label.itemType,'T-shirt');
});
test('BLIND61 review.html contains offline fields and never calls a hosted classifier or exposes label answers',()=>{
 const html=readFileSync('research/independent-annotation-61/review.html','utf8');
 assert.match(html,/type="file"/);
 assert.match(html,/id="photo"/);
 assert.match(html,/id="category"/);
 assert.match(html,/id="itemType"/);
 assert.match(html,/id="primaryColor"/);
 assert.match(html,/id="secondaryColor"/);
 assert.match(html,/id="uncertain"/);
 assert.match(html,/modelPredictionsViewed:false/);
 assert.match(html,/independent:true,method:'direct-human-visual-review'/);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 assert.doesNotMatch(html,/fetch\(/);
 assert.doesNotMatch(html,/localStorage/);
});
