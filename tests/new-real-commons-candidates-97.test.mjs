import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {verifyProvenance97,verifySourceOriginal97,auditRealSourceCohort97}
 from '../research/new-real-commons-candidate-cohort-97/source-gate.mjs';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=json('research/new-real-commons-candidate-cohort-97/source-candidates.json');
const old=json('benchmark/locked-photo-sources.json');
const quarantine=json('research/real-multigarment-candidate-intake-96/candidate-manifest.json').candidates;
const sha=x=>createHash('sha256').update(x).digest('hex');
const pinned=manifest.candidates.every(x=>/^[a-f0-9]{64}$/.test(x.pinnedSourceSHA256||'')&&
 Number.isInteger(x.pinnedOriginalBytes));
const base=(m=manifest,requirePinned=pinned)=>verifyProvenance97({
 manifest:m,original59:old,quarantined96:quarantine,requirePinned
});
const mutation=(n=0)=>structuredClone(manifest);
test('SOURCE97 seven genuinely new official Commons candidate URLs with specific license and source trace, no human labels',()=>{
 const r=base();
 assert.equal(r.candidateCount,7);
 assert.equal(r.existingFrozen,59);
 assert.equal(r.oldQuarantine,2);
 assert.equal(r.additionalScientificAcceptance,0);
 assert.equal(r.sourceGapUntil100,41);
 assert.equal(r.modelAccuracyMeasured,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(manifest.candidates.every(x=>x.humanLabel===null&&
  x.humanInstanceMasks.length===0&&x.holdoutEligible===false),true);
});
test('SOURCE97 a candidate cannot claim independent human masks, fresh unseen locked testing or production release',()=>{
 for(const patch of [
  {quarantine:false},{holdoutEligible:true},
  {knownModelExposure:'CONFIRMED_UNSEEN'},
  {humanLabel:{category:'Dresses'}},
  {humanInstanceMasks:[{x:1}]},
  {independentHumanReview:true}
 ]){
  const m=mutation();Object.assign(m.candidates[0],patch);
  assert.throws(()=>base(m),/SOURCE97/);
 }
 for(const patch of [{scientificAcceptedCandidateCount:7},
  {independentRealHumanReviews:2},{currentVerifiedHumanInstanceMasks:100},
  {existingHoldoutNeverRepartitioned:false},{frozenOriginalCount:66}]){
  const m=mutation();Object.assign(m,patch);
  assert.throws(()=>base(m),/SOURCE97/);
 }
});
test('SOURCE97 license link, author, original Wikimedia page, original host, path and unredirected URL required',()=>{
 for(const patch of [
  {license:'All rights reserved'},
  {licenseURL:'https://bad.example.com/license'},
  {author:''},
  {originalURL:'http://upload.wikimedia.org/wikipedia/commons/x.jpg'},
  {originalURL:'https://example.com/wikipedia/commons/x.jpg'},
  {originalURL:manifest.candidates[0].originalURL+'?side=tracking'},
  {commonsPage:'https://fake.example.org/wiki/File:Original.jpg'},
  {originFileName:'different-file.jpg'},
  {advertisedWidth:0}
 ]){
  const m=mutation();Object.assign(m.candidates[0],patch);
  assert.throws(()=>base(m),/SOURCE97/,JSON.stringify(patch));
 }
});
test('SOURCE97 no candidate can quietly reuse an existing frozen SHA, prior quarantine source, ID or another candidate source URL',()=>{
 for(const patch of [
  {id:manifest.candidates[1].id},
  {id:old[0].id},
  {originalURL:manifest.candidates[1].originalURL},
  {originalURL:quarantine[0].downloadUrl},
  {pinnedSourceSHA256:old[0].sha256,pinnedOriginalBytes:123456},
  {pinnedSourceSHA256:quarantine[0].sha256,pinnedOriginalBytes:123456}
 ]){
  const m=mutation();
  Object.assign(m.candidates[0],patch);
  assert.throws(()=>base(m,true),/SOURCE97/);
 }
});
test('SOURCE97 strict SHA lock NEVER succeeds for null/adversarial length, discovery mode cannot certify already pinned image',()=>{
 const m=mutation();m.candidates[0].pinnedSourceSHA256=null;
 assert.throws(()=>base(m,true),/SOURCE97/);
 const mm=mutation();mm.candidates[0].pinnedSourceSHA256='a'.repeat(64);
 mm.candidates[0].pinnedOriginalBytes=1024;
 assert.throws(()=>base(mm,false),/SOURCE97/);
});
test('SOURCE97 real JPEG source SHA/size/dimensions check with immutable bytes detects any individual photo edit',async()=>{
 const b=readFileSync('benchmark/fixtures/'+old[0].image);
 const meta=await sharp(b).metadata(),expected={...manifest.candidates[0],
  advertisedWidth:meta.width,advertisedHeight:meta.height,
  pinnedOriginalBytes:b.length,pinnedSourceSHA256:sha(b)};
 const proof=await verifySourceOriginal97(expected,b);
 assert.equal(proof.originalBytes,b.length);
 assert.equal(proof.originalWidth,meta.width);
 assert.equal(proof.sourceSHA256,sha(b));
 const mutated=Buffer.from(b);mutated[Math.floor(b.length/2)]^=1;
 await assert.rejects(verifySourceOriginal97(expected,mutated),/SHA-256/);
 await assert.rejects(verifySourceOriginal97({...expected,advertisedWidth:meta.width+1},b),/width\/height/);
 await assert.rejects(verifySourceOriginal97({...expected,pinnedOriginalBytes:b.length-1},b),/length/);
});
test('SOURCE97 no invented non-garment ground truth from an image titled hangers',()=>{
 const hangers=manifest.candidates.find(x=>x.id==='r97-empty-hangers');
 assert.ok(hangers);
 assert.equal(hangers.scenarioForSourceCoverageOnly,'non-garment-control-candidate');
 assert.equal(hangers.humanLabel,null);
 assert.equal(hangers.independentHumanReview,false);
 assert.equal(hangers.holdoutEligible,false);
});
test('SOURCE97 actual photos do not flow to git or public artifact, no model output changes or automatic scientific claims',()=>{
 const ci=readFileSync('.github/workflows/new-real-commons-candidate-cohort-97-no-deploy.yml','utf8');
 const script=readFileSync('scripts/verify-new-real-commons-candidates-97.mjs','utf8');
 assert.match(ci,/BASE=26662c589c58a3a11669ab789ffc09a3f8514ee7/);
 assert.match(ci,/research\/new-real-commons-candidate-cohort-97\/source-gate\.mjs/);
 assert.match(script,/auditRealSourceCohort97/);
 assert.match(script,/--strict/);
 assert.match(script,/--discover/);
 assert.match(script,/NO HUMAN LABELS, NO SCIENTIFIC PROMOTION/);
 assert.doesNotMatch(ci,/benchmark\/fixtures\/\*|upload-pages-artifact|deploy-pages|gh-pages/);
});
test('SOURCE97 candidate fake independent callback data never bypasses exact real frozen source photo SHA',async()=>{
 const m=mutation();
 const fake=Buffer.from('fake image');
 await assert.rejects(auditRealSourceCohort97({
  manifest:m,original59:old,quarantined96:quarantine,
  readFrozenPhoto:()=>fake,
  fetchPriorQuarantinePhoto:()=>fake,
  fetchOriginal:()=>fake,requirePinned:pinned
 }),/frozen original source changed/);
});
