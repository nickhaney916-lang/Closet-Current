import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 CHECKS,REASONS,newReviewEvidence,validateEvidence,recordReview,
 parseReviewImport,serializeReviewExport
} from '../research/work48/visual-review-evidence.mjs';
const mock=()=>({rows:Array.from({length:15},(_,i)=>({
 id:'commons-'+String(i+1).padStart(4,'0'),profile:i<5?{slot:'top'}:null,
 hasCutout:i<9
}))});
const ok=Object.fromEntries(CHECKS.map(k=>[k,true]));
test('all fifteen verified-looking licensed rows start NOT REVIEWED, never as reviewed or owner approved',()=>{
 const manifest=mock(),s=newReviewEvidence(manifest),r=validateEvidence(manifest,s);
 assert.equal(r.pending,15);assert.equal(r.pass,0);assert.equal(r.releaseAuthorized,false);
 assert.equal(s.ownerApproved,false);assert.equal(s.release,'HOLD');
 assert.equal(s.rows.filter(x=>x.decision==='NOT_REVIEWED').length,15);
});
test('manual PASS requires supported source, original cutout and all four deliberately checked conditions',()=>{
 const manifest=mock(),initial=newReviewEvidence(manifest);
 for(const partial of [[],['sourcePixels'],['cutoutEdge'],['proportions']]){
  const flags=Object.fromEntries(CHECKS.map(k=>[k,partial.includes(k)]));
  assert.throws(()=>recordReview(manifest,initial,manifest.rows[0].id,'PASS',REASONS[0],flags));
 }
 const review=recordReview(manifest,initial,manifest.rows[0].id,'PASS',REASONS[0],ok);
 assert.equal(validateEvidence(manifest,review).pass,1);
 assert.equal(validateEvidence(manifest,review).pending,14);
 assert.equal(review.ownerApproved,false);assert.equal(review.decision,'HOLD');
 for(const index of [5,10,14]){
  assert.throws(()=>recordReview(manifest,initial,manifest.rows[index].id,'PASS',REASONS[0],ok));
 }
});
test('FAIL and REVIEW require issue reasons; PASS cannot be contradicted by unresolved issue reason',()=>{
 const manifest=mock(),s=newReviewEvidence(manifest);
 assert.throws(()=>recordReview(manifest,s,'commons-0001','PASS',REASONS[1],ok));
 assert.throws(()=>recordReview(manifest,s,'commons-0014','FAIL',REASONS[0]));
 assert.throws(()=>recordReview(manifest,s,'commons-0002','REVIEW',''));
 const first=recordReview(manifest,s,'commons-0002','REVIEW',REASONS[2]);
 const second=recordReview(manifest,first,'commons-0014','FAIL',REASONS[7]);
 const r=validateEvidence(manifest,second);
 assert.equal(r.review,1);assert.equal(r.fail,1);assert.equal(r.pending,13);
});
test('manual grades can be reset to NOT REVIEWED without lingering prior flags or implicit sign-off',()=>{
 const manifest=mock(),s=newReviewEvidence(manifest);
 const graded=recordReview(manifest,s,'commons-0001','PASS',REASONS[0],ok);
 const cleared=recordReview(manifest,graded,'commons-0001','NOT_REVIEWED','ignored',ok);
 assert.equal(validateEvidence(manifest,cleared).pass,0);
 assert.equal(cleared.rows[0].reason,'');
 assert.ok(CHECKS.every(k=>cleared.rows[0].checks[k]===false));
 assert.equal(graded.rows[0].decision,'PASS','snapshot preserved, no in-place edits');
});
test('JSON import rejects forged release approvals, unstructured personal info and altered order',()=>{
 const manifest=mock(),valid=newReviewEvidence(manifest);
 const rogue=[
 e=>e.ownerApproved=true,e=>e.release='READY',e=>e.decision='PASS',
 e=>e.productionModified=true,e=>e.stagingModified=true,
 e=>e.rows[0].id='commons-9999',
 e=>e.rows[0].email='somebody@example.org',
 e=>e.rows[0].reason='private personal note',
 e=>e.rows.pop(),e=>e.accountId='private',
 e=>e.source='Verified owner sign-off',
 e=>e.rows[0].checks.other=true
 ];
 for(const alter of rogue){
  const e=structuredClone(valid);alter(e);
  assert.throws(()=>parseReviewImport(manifest,JSON.stringify(e)));
 }
});
test('safe export and restart round-trip preserve local manual choices, but never grant go-live',()=>{
 const manifest=mock(),s=newReviewEvidence(manifest);
 const first=recordReview(manifest,s,'commons-0001','PASS',REASONS[0],ok);
 const second=recordReview(manifest,first,'commons-0015','FAIL',REASONS[9]);
 const json=serializeReviewExport(manifest,second),fromDisk=parseReviewImport(manifest,json);
 assert.deepEqual(fromDisk,second);
 assert.equal(validateEvidence(manifest,fromDisk).pending,13);
 assert.equal(validateEvidence(manifest,fromDisk).releaseAuthorized,false);
 assert.doesNotMatch(json,/(@|sk-proj|sb_secret_|email|token|filename|deviceId|productionUrl)/i);
 assert.throws(()=>parseReviewImport(manifest,json.repeat(500)));
 assert.throws(()=>parseReviewImport(manifest,'not json'));
});
test('no malformed or shortened benchmark can be substituted for the fixed cohort',()=>{
 const manifest=mock();
 for(const mutate of [m=>m.rows.pop(),m=>m.rows[5].id=m.rows[0].id,m=>m.rows[0].id='../leak',m=>m.rows=null]){
  const x=structuredClone(manifest);mutate(x);
  assert.throws(()=>newReviewEvidence(x));
 }
});
