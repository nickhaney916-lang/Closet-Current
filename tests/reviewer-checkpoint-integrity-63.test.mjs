import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {makeBlindPacket61} from '../research/independent-annotation-61/blinded-review.mjs';
import {validateResume63,verifyPacketDigest63,REVIEW_SCHEMA63} from '../research/reviewer-checkpoint-integrity-63/resume-guard.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const sets={
 development:read('benchmark/manifest-reviewed-32.json'),
 validation:read('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':read('benchmark/manifest-holdout-16.json')
};
const sources=read('benchmark/locked-photo-sources.json');
const packet=role=>makeBlindPacket61({sets,sources,role});
const row=(item,over={})=>({
 id:item.id,sourceSHA256:item.sourceSHA256,reviewerId:'independent-human-A',
 independent:true,method:'direct-human-visual-review',
 reviewedAt:'2026-11-05T08:00:00.000Z',
 category:'Tops',itemType:'T-shirt',primaryColor:'Blue',secondaryColor:null,
 uncertain:false,uncertaintyReason:null,notes:'research photo sample',
 ...over
});
const exp=(p,records,over={})=>({
 schema:REVIEW_SCHEMA63,packetId:p.packetId,role:p.role,
 reviewerId:'independent-human-A',independent:true,
 method:'direct-human-visual-review',
 completed:records.length,total:p.total,incomplete:records.length!==p.total,
 identityVerification:'SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED',
 modelPredictionsViewed:false,reviewerPeerAnswersViewed:false,
 rows:records,...over
});
test('REVIEW63 59 real SHA-bound photo packet accepts exactly source-matched partial review and preserves no hidden model labels',()=>{
 const p=packet('A'),source=p.items[0],original=row(source);
 const valid=validateResume63(p,exp(p,[original]));
 assert.equal(valid.reviewed,1);assert.equal(valid.total,59);assert.equal(valid.incomplete,true);
 assert.equal(valid.rows[0].sourceSHA256,source.sourceSHA256);
 assert.equal(valid.independenceSelfAttestedNotVerified,true);
 assert.equal(valid.rows[0].category,'Tops');
 assert.notStrictEqual(valid.rows[0],original,'Never trust references to caller-controlled source object');
});
test('REVIEW63 exact same packet role and source SHA reject other reviewer packets or swapped source bytes',()=>{
 const a=packet('A'),b=packet('B'),good=exp(a,[row(a.items[0])]);
 for(const bad of [
  {...good,packetId:b.packetId},
  {...good,role:'B'},
  {...good,rows:[{...good.rows[0],sourceSHA256:'f'.repeat(64)}]},
  {...good,rows:[{...good.rows[0],id:'source-intrusion'}]}
 ])assert.throws(()=>validateResume63(a,bad),/CHECKPOINT63/);
 assert.throws(()=>validateResume63(b,good),/CHECKPOINT63/);
});
test('REVIEW63 cannot switch reviewer identity, claim copied reviewer attestation or incomplete flags',()=>{
 const p=packet('A'),good=exp(p,[row(p.items[0])]);
 assert.throws(()=>validateResume63(p,good,{expectedReviewerId:'different-human-B'}),/reviewer/);
 for(const bad of [
  {...good,reviewerId:'different-human-B'},
  {...good,identityVerification:'CRYPTOGRAPHICALLY_VERIFIED'},
  {...good,modelPredictionsViewed:true},
  {...good,reviewerPeerAnswersViewed:true},
  {...good,independent:false},
  {...good,completed:59},{...good,incomplete:false},{...good,total:58}
 ])assert.throws(()=>validateResume63(p,bad),/CHECKPOINT63/);
});
test('REVIEW63 duplicate source row, invalid timestamp, extra model metadata and unbounded text fail closed',()=>{
 const p=packet('A'),valid=row(p.items[0]);
 for(const bad of [
  exp(p,[valid,valid]),exp(p,[{...valid,reviewedAt:'not-a-date'}]),
  exp(p,[{...valid,modelPrediction:'T-shirt'}]),
  exp(p,[{...valid,notes:'X'.repeat(601)}]),
  {...exp(p,[valid]),candidateModelConfidence:1}
 ])assert.throws(()=>validateResume63(p,bad),/CHECKPOINT63/);
});
test('REVIEW63 source-bound subtype, primary, secondary color and negative controls are validated',()=>{
 const p=packet('A'),valid=row(p.items[0]);
 for(const edits of [
  {category:'Accessories',itemType:'Scarf'},
  {category:'Shoes',itemType:'T-shirt'},
  {primaryColor:'not-in-closet-palette'},
  {primaryColor:null},
  {secondaryColor:'Blue'},
  {category:'Uncategorized',itemType:'Unknown',primaryColor:'Blue'},
  {category:'Uncategorized',itemType:'Sneakers',primaryColor:null},
 ])assert.throws(()=>validateResume63(p,exp(p,[{...valid,...edits}])),/CHECKPOINT63/);
 const negative={...valid,category:'Uncategorized',itemType:'Unknown',primaryColor:null,secondaryColor:null};
 assert.equal(validateResume63(p,exp(p,[negative])).reviewed,1);
});
test('REVIEW63 ambiguity never becomes an invented classification or color',()=>{
 const p=packet('B'),r=row(p.items[0],{
  uncertain:true,category:null,itemType:null,primaryColor:null,secondaryColor:null,
  uncertaintyReason:'Cannot distinguish skirt or shorts visually',notes:null
 });
 const exportB=exp(p,[{...r,reviewerId:'independent-human-B'}],{reviewerId:'independent-human-B'});
 assert.equal(validateResume63(p,exportB).rows[0].uncertain,true);
 for(const changes of [
  {category:'Tops'},{primaryColor:'Blue'},{uncertaintyReason:'unclear'},
  {uncertaintyReason:null},{secondaryColor:'Brown'}
 ])assert.throws(()=>validateResume63(p,exp(p,[{...r,...changes}],{
  reviewerId:'independent-human-B'})),/CHECKPOINT63/);
});
test('REVIEW63 independently signed packet SHA is byte-stable for both source-locked blinded reviewer roles',async()=>{
 for(const role of ['A','B','C']){
  const p=packet(role);
  const canonical=JSON.stringify({schema:p.schema,role:p.role,
   items:p.items.map(x=>({id:x.id,image:x.image,sourceSHA256:x.sourceSHA256}))});
  assert.equal(createHash('sha256').update(canonical).digest('hex'),p.packetId);
  if(globalThis.crypto?.subtle)assert.equal(await verifyPacketDigest63(p),true);
 }
});
test('REVIEW63 packet hash and malicious source keys cannot bypass provenance validation',async()=>{
 const p=packet('A'),tampered={...p,packetId:'f'.repeat(64)};
 if(globalThis.crypto?.subtle)
  await assert.rejects(verifyPacketDigest63(tampered),/integrity mismatch/);
 const duplicate=structuredClone(p);duplicate.items[1].id=duplicate.items[0].id;
 assert.throws(()=>validateResume63(duplicate,exp(duplicate,[row(duplicate.items[0])])),/duplicate packet/);
 const swapped=structuredClone(p);swapped.items[1].sourceSHA256=swapped.items[0].sourceSHA256;
 assert.throws(()=>validateResume63(swapped,exp(swapped,[row(swapped.items[0])])),/duplicate packet/);
});
test('REVIEW63 UI stays offline, explicitly rejects stale packet imports and never persists unapproved notes automatically',()=>{
 const html=readFileSync('research/independent-annotation-61/review.html','utf8');
 assert.match(html,/type="module"/);
 assert.match(html,/id="resumeFile"/);
 assert.match(html,/verifyPacketDigest63\(parsed\)/);
 assert.match(html,/validateResume63\(packet,incoming/);
 assert.match(html,/activePacket!==packet/);
 assert.match(html,/previous observations preserved/);
 assert.match(html,/dirtySinceExport/);
 assert.match(html,/No browser autosave/);
 assert.doesNotMatch(html,/<script[^>]+src=/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|indexedDB|fetch\(/);
});
