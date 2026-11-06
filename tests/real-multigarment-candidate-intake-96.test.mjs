import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditCandidateCohort96,validateCandidateIntake96,verifyOriginalCandidateJPEG96,
 perceptualFingerprintJPEG96,hammingDistance64_96,TARGET_SCIENCE_96}
 from '../research/real-multigarment-candidate-intake-96/intake-gate.mjs';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=json('research/real-multigarment-candidate-intake-96/candidate-manifest.json');
const locked=json('benchmark/locked-photo-sources.json');
const pilot=json('research/multi-review-triage-28/frozen-photo-annotations-16.json');
const verify=(m=manifest,s=locked,p=pilot)=>validateCandidateIntake96({
 manifest:m,lockedSources:s,pilotSources:p
});
const mutable=()=>structuredClone(manifest);
const first=readFileSync('benchmark/fixtures/'+locked[0].image);
test('SOURCE96 two separately licensed, previously ONNX-tested multi-garment photos genuinely NEW to frozen 59 by SHA',()=>{
 const r=verify();
 assert.equal(r.existingFrozen,59);assert.equal(r.quarantinedCandidates,2);
 assert.equal(r.currentlyMissingTo100,41);
 assert.equal(r.promotedIndependentHumanLabeledSources,0);
 assert.equal(manifest.candidates.every(x=>!locked.some(s=>s.sha256===x.sha256)),true);
 assert.equal(TARGET_SCIENCE_96.minimumTotal,100);
 assert.equal(manifest.lockedEvaluationModified,false);
});
test('SOURCE96 attempts to fake full 100-photo cohort or independent masks fail closed',()=>{
 for(const patch of [{existingFrozenSources:100},{additionalAcceptedScientificPhotos:2},
  {realHumanInstanceMasks:2},{lockedEvaluationModified:true},{priorModelSeen:false},
  {licenseVerification:'FULLY_INDEPENDENT_CERTIFIED'}]){
  const m=mutable();Object.assign(m,patch);
  assert.throws(()=>verify(m),/INTAKE96/);
 }
});
test('SOURCE96 exact source SHA, original bytes, pixel dimensions and prior pilot provenance bind each intake record',()=>{
 for(const field of ['sha256','bytes','height','width','downloadUrl','existingPilotId']){
  const m=mutable();
  m.candidates[0][field]=field==='sha256'?'f'.repeat(64):
   field==='downloadUrl'?'https://upload.wikimedia.org/wikipedia/commons/bogus.jpg':
   field==='existingPilotId'?'not-real':1;
  assert.throws(()=>verify(m),/INTAKE96/,field);
 }
});
test('SOURCE96 new originals cannot share frozen exact SHA or each other SHA, nor reuse frozen source IDs',()=>{
 for(const patch of [{sha256:locked[0].sha256},{sha256:manifest.candidates[1].sha256},
  {id:locked[0].id},{id:manifest.candidates[1].id}]){
  const m=mutable();Object.assign(m.candidates[0],patch);
  assert.throws(()=>verify(m),/INTAKE96/);
 }
});
test('SOURCE96 reject non-Wikimedia, HTTP, unsafe query, false attribution, unsupported license and zero human review evidence',()=>{
 for(const patch of [
  {downloadUrl:'http://upload.wikimedia.org/wikipedia/commons/example.jpg'},
  {downloadUrl:'https://evil.example.com/steal.jpg'},
  {downloadUrl:manifest.candidates[0].downloadUrl+'?redirect=evil'},
  {provenance:{...manifest.candidates[0].provenance,license:'All rights reserved'}},
  {provenance:{...manifest.candidates[0].provenance,source:'https://other.example.com/foo'}},
  {independentHumanAnnotation:true},{independentGarmentCount:3},
  {originalModelSeen:false}
 ]){
  const m=mutable();Object.assign(m.candidates[0],patch);
  assert.throws(()=>verify(m),/INTAKE96/);
 }
});
test('SOURCE96 archived genuine original JPEG bytes must match exact SHA, byte length and dimensions; no reinterpretation',async()=>{
 const src=locked[0];
 const row={...manifest.candidates[0],sha256:src.sha256,bytes:first.length};
 const validSharp=await import('sharp');const meta=await validSharp.default(first).metadata();
 row.width=meta.width;row.height=meta.height;
 const r=await verifyOriginalCandidateJPEG96(row,first);
 assert.equal(r.sourceSHA256,src.sha256);assert.equal(r.originalVerified,true);
 const broken=Buffer.from(first);broken[Math.floor(broken.length/2)]^=1;
 await assert.rejects(verifyOriginalCandidateJPEG96(row,broken),/SHA-256 changed/);
 await assert.rejects(verifyOriginalCandidateJPEG96({...row,width:row.width+1},first),
  /dimensions changed/);
});
test('SOURCE96 real 64-bit image fingerprint reproducible; any exact photo has distance zero, reverse-specified hashes correctly differ',async()=>{
 const h=await perceptualFingerprintJPEG96(first);
 assert.match(h,/^[a-f0-9]{16}$/);
 assert.equal(await perceptualFingerprintJPEG96(first),h);
 assert.equal(hammingDistance64_96(h,h),0);
 assert.equal(hammingDistance64_96('0000000000000000','ffffffffffffffff'),64);
 assert.throws(()=>hammingDistance64_96(h,'not-a-hash'),/INTAKE96/);
});
test('SOURCE96 source exact hash duplicate rejected before remote fetch and no frozen source mutation',async()=>{
 const m=mutable();
 // Simulate two intake rows using real existing originals with known SHAs;
 // duplicated historical original may not become a new candidate source.
 m.candidates[0].sha256=locked[0].sha256;
 await assert.rejects(auditCandidateCohort96({
  manifest:m,lockedSources:locked,pilotSources:pilot,
  readLockedJPEG:x=>readFileSync('benchmark/fixtures/'+x.image),
  fetchCandidateBytes:()=>{throw Error('MUST NOT FETCH');}
 }),/INTAKE96/);
});
test('SOURCE96 candidate QA does not fabricate independent human reviewers, model source truth or locked splits',()=>{
 const text=readFileSync('scripts/verify-real-candidate-intake-96.mjs','utf8');
 const ci=readFileSync('.github/workflows/real-multigarment-candidate-intake-96-no-deploy.yml','utf8');
 assert.match(text,/auditCandidateCohort96/);
 assert.match(text,/sourceMinimumStillMissing,41/);
 assert.match(text,/additionalAcceptedScientificPhotos,0/);
 assert.match(ci,/BASE=e1473010be68cf01d7607996a4a9a1879bb6899b/);
 assert.doesNotMatch(text,/expectedCategory|expectedType|independentReviews:/);
 assert.doesNotMatch(ci,/deploy-pages|gh-pages|push to main/);
});
