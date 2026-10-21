import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {packetFromLock,blankSubmission,validateSubmission,reconcile,reviewHTML,LOCK,hash} from '../scripts/source-holdout-human-review.mjs';
const packet=()=>packetFromLock(fs.readFileSync(LOCK));
// Fabricated fixtures test the intake only. They are NOT actual human reviews.
const submission=(alias='Synthetic fixture alpha')=>{
 const s=blankSubmission(packet());s.status='REVIEWED';s.reviewerAlias=alias;s.reviewedAt='2026-10-21T00:00:00.000Z';
 for(const k of Object.keys(s.attestations))s.attestations[k]=true;
 for(const p of s.photos)Object.assign(p,{observedFamily:'uncertain',uncertain:true,evidence:'Synthetic fixture, not a real review.'});
 return s;
};
test('review packet is byte-bound to frozen source labels but contains only neutral original identities',()=>{
 const p=packet();assert.equal(p.photos.length,13);
 assert.deepEqual(Object.keys(p.photos[0]),['id','image','sha256']);
 const locked=fs.readFileSync(LOCK);assert.throws(()=>packetFromLock(Buffer.concat([locked,Buffer.from('\n')])),/lock changed/);
 for(const secret of ['acceptedTypes','expectedCategory','downloadUrl','visualReview'])assert.ok(!reviewHTML(p).includes(secret));
});
test('blank and zero-submission states never invent human gold or accuracy',()=>{
 assert.throws(()=>validateSubmission(packet(),blankSubmission(packet())),/Unreviewed/);
 const r=reconcile(packet(),[]);assert.equal(r.suppliedSubmissions,0);assert.equal(r.unresolved.length,13);
 assert.equal(r.approvedModelAccuracy,null);assert.equal(r.independentHumanGoldLabels,false);
});
test('one real-shaped submission is still pending a separate human and preserves all sources',()=>{
 const r=reconcile(packet(),[submission()]);assert.equal(r.suppliedSubmissions,1);assert.equal(r.unresolved.length,13);
 assert.ok(r.photos.every(x=>x.agreement===null&&x.status==='AWAITING_REVIEW'));
});
test('matching unknown or uncertain observations stay unresolved',()=>{
 const a=submission(),b=submission('Synthetic fixture beta');
 let r=reconcile(packet(),[a,b]);assert.equal(r.selfAttestedAgreements,0);assert.equal(r.unresolved.length,13);
 for(const s of [a,b])Object.assign(s.photos[0],{observedFamily:'shirt',uncertain:true});
 r=reconcile(packet(),[a,b]);assert.equal(r.photos[0].status,'UNCERTAIN');
});
test('confident agreement is self-attested only; disagreement remains explicit without majority or label overwrite',()=>{
 const a=submission(),b=submission('Synthetic fixture beta');
 for(const s of [a,b])Object.assign(s.photos[0],{observedFamily:'shirt',uncertain:false});
 let r=reconcile(packet(),[a,b]);assert.equal(r.selfAttestedAgreements,1);assert.equal(r.reviewerIdentityAuthenticated,false);
 assert.equal(r.independentHumanGoldLabels,false);assert.equal(r.productionPromotion,'BLOCKED');assert.equal(r.canModifyModel,false);
 b.photos[0].observedFamily='other-garment';r=reconcile(packet(),[a,b]);assert.equal(r.photos[0].status,'DISAGREEMENT');
 assert.deepEqual(r.photos[0].observedFamilies,['shirt','other-garment']);
});
test('reused reviewer alias is rejected across Unicode, case and whitespace variants',()=>{
 for(const alias of ['SYNTHETIC FIXTURE ALPHA',' Synthetic  fixture alpha ','Ｓｙｎｔｈｅｔｉｃ fixture alpha'])
  assert.throws(()=>reconcile(packet(),[submission(),submission(alias)]),/distinct identities/);
});
test('missing human, original-frame, blind-label or independence attestations fail closed',()=>{
 for(const key of Object.keys(submission().attestations)){
  const s=submission();s.attestations[key]=false;assert.throws(()=>validateSubmission(packet(),s),/attestations/);
 }
});
test('missing duplicate unexpected or hash-substituted originals cannot be scored',()=>{
 for(const mutate of [s=>s.photos.pop(),s=>s.photos[1]=s.photos[0],s=>s.photos[0].id='unexpected',s=>s.photos[0].sha256='f'.repeat(64)]){
  const s=submission();mutate(s);assert.throws(()=>validateSubmission(packet(),s));
 }
});
test('review packet mismatch, invalid timestamps and missing evidence are rejected',()=>{
 for(const mutate of [s=>s.packetSha256=hash('other'),s=>s.reviewedAt='2099-01-01T00:00:00.000Z',s=>s.reviewedAt='2026-02-31T00:00:00.000Z',s=>s.photos[0].evidence='',s=>s.photos[0].uncertain='false',s=>s.photos[0].uncertain=false]){
  const s=submission();mutate(s);assert.throws(()=>validateSubmission(packet(),s));
 }
});
test('automated aliases, answer-bearing extra fields and malformed labels are rejected',()=>{
 for(const mutate of [s=>s.reviewerAlias='assistant',s=>s.photos[0].observedFamily='Jacket',s=>s.modelPredictions=[],s=>s.photos[0].expectedLabel='shirt',s=>s.reviewerAlias='invisible\u200bname']){
  const s=submission();mutate(s);assert.throws(()=>validateSubmission(packet(),s));
 }
});
test('receipt binds submitted observations and preserves source ID matching regardless of row order',()=>{
 const a=submission(),b=structuredClone(a);b.photos.reverse();
 assert.deepEqual([...validateSubmission(packet(),b).rows.keys()].sort(),packet().photos.map(p=>p.id).sort());
 const first=validateSubmission(packet(),a).submissionSha256;a.photos[0].evidence+=' Additional fixture text.';
 assert.notEqual(validateSubmission(packet(),a).submissionSha256,first);
 assert.throws(()=>reconcile(packet(),[a,a,a]),/zero, one or two/);
});
test('audit CLI emits a reproducible honest pending report with no review files',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'holdout-review-test-'));
 try{const file=path.join(out,'pending.json');execFileSync(process.execPath,['scripts/source-holdout-human-review.mjs','audit',file]);
  const r=JSON.parse(fs.readFileSync(file));assert.equal(r.suppliedSubmissions,0);assert.equal(r.sourcePhotos,13);assert.equal(r.customerSaves,0);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
