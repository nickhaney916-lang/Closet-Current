import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeSource99Packets,auditProvisionalHumanReviews99,SOURCE99_SCHEMA}
 from '../research/source97-human-adjudication-99/review-intake-gate.mjs';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const manifest=json('research/new-real-commons-candidate-cohort-97/source-candidates.json');
const original59=json('benchmark/locked-photo-sources.json');
const quarantined96=json('research/real-multigarment-candidate-intake-96/candidate-manifest.json').candidates;
const baseline={manifest,original59,quarantined96};
const packets=makeSource99Packets(baseline);
const pts=[{x:.1,y:.1},{x:.8,y:.1},{x:.8,y:.8},{x:.1,y:.8}];
function row(role,index,{color='Red',noGarments=false,sourceOverride=null}={}){
 const src=packets[role].items[index];
 return {id:src.id,sourceSHA256:sourceOverride||src.sourceSHA256,
  reviewerId:'human-reviewer-'+role,
  reviewedAt:'2026-11-05T18:00:00Z',noGarments,
  note:noGarments?'I see no garment in this photograph':'',
  instances:noGarments?[]:[{category:'Tops',itemType:'T-shirt',
   primaryColor:color,secondaryColor:null,polygon:pts}]};
}
function review(role,rows=[]){
 return {schema:'closet-current-human-instance-review-94/v1',
  role,packetId:packets[role].packetId,reviewerId:'human-reviewer-'+role,
  method:'direct-human-visual-review',independent:true,
  identityVerification:'SELF_ATTESTED_NOT_VERIFIED',rows};
}
function audit(exportsByRole){return auditProvisionalHumanReviews99({...baseline,exportsByRole});}

test('SOURCE99 true P97 source-hash-locked A/B/C packets match blind P98 source identities; not model labels',()=>{
 for(const role of ['A','B','C']){
  assert.equal(packets[role].total,7);
  assert.equal(packets[role].schema,'closet-current-blind-instance-packet-94/v1');
  assert.equal(packets[role].items.every(x=>Object.keys(x).sort().join(',')==='id,image,sourceSHA256'),true);
 }
 assert.equal(new Set(Object.values(packets).map(x=>x.packetId)).size,3);
 assert.equal(packets.A.items.length,manifest.candidates.length);
});
test('SOURCE99 empty genuine-review intake keeps all scores NULL, 7/7 awaiting actual humans, no release',()=>{
 const x=audit({});
 assert.equal(x.schema,SOURCE99_SCHEMA);
 assert.equal(x.reviewerRolesProvided,0);
 assert.equal(x.unresolvedSources,7);
 assert.equal(x.selfAttestedAgreementOnly,0);
 assert.equal(x.thirdReviewerStillRequired,0);
 assert.equal(x.newCandidatesScientificallyAccepted,0);
 assert.equal(x.independentEligibleSourceGapStill41,true);
 assert.equal(x.realModelMaskIoU,null);
 assert.equal(x.categoryAccuracy,null);
 assert.equal(x.primaryColorAccuracy,null);
 assert.equal(x.actualHumanIdentityVerified,false);
 assert.equal(x.humanIndependentReviewVerified,false);
 assert.equal(x.familyAlpha,'HOLD');
 assert.equal(x.releaseAuthorized,false);
});
test('SOURCE99 A/B matching traced garment instance is PROVISIONAL only, never scientific acceptance',()=>{
 const first=packets.A.items[0].id;
 const bidx=packets.B.items.findIndex(x=>x.id===first);
 const x=audit({A:review('A',[row('A',0)]),B:review('B',[row('B',bidx)])});
 assert.equal(x.selfAttestedAgreementOnly,1);
 assert.equal(x.selfAttestedThirdAdjudicationOnly,0);
 assert.equal(x.unresolvedSources,6);
 assert.equal(x.newCandidatesScientificallyAccepted,0);
 assert.equal(x.realModelMaskIoU,null);
 assert.equal(x.actualHumanIdentityVerified,false);
 assert.equal(x.sourceStatus.find(v=>v.id===first).status,'TWO_SELF_ATTESTED_REVIEWERS_AGREE_UNVERIFIED');
 assert.equal(JSON.stringify(x).includes('human-reviewer-'),false,'never leak reviewer IDs');
 assert.equal(JSON.stringify(x).includes('"polygon"'),false,'never leak private source mask geometry');
 assert.equal(JSON.stringify(x).includes('"primaryColor":"Red"'),false,'never leak provisional garment labels');
});
test('SOURCE99 genuine A/B disagreement requires C, with C result still only UNVERIFIED self-attestation',()=>{
 const first=packets.A.items[0].id;
 const bidx=packets.B.items.findIndex(x=>x.id===first);
 const cidx=packets.C.items.findIndex(x=>x.id===first);
 const a=review('A',[row('A',0)]);
 const b=review('B',[row('B',bidx,{color:'Blue'})]);
 const missing=audit({A:a,B:b});
 assert.equal(missing.thirdReviewerStillRequired,1);
 assert.equal(missing.unresolvedSources,7);
 assert.equal(missing.sourceStatus.find(x=>x.id===first).status,'AWAITING_THIRD_ADJUDICATION');
 const done=audit({A:a,B:b,C:review('C',[row('C',cidx,{color:'Green'})])});
 assert.equal(done.selfAttestedThirdAdjudicationOnly,1);
 assert.equal(done.thirdReviewerStillRequired,0);
 assert.equal(done.unresolvedSources,6);
 assert.equal(done.newCandidatesScientificallyAccepted,0);
 assert.equal(done.categoryAccuracy,null);
 assert.equal(done.sourceStatus.find(x=>x.id===first).status,'THIRD_SELF_ATTESTED_ADJUDICATION_UNVERIFIED');
});
test('SOURCE99 incomplete A/B does not treat absent sources as human-verified negative controls',()=>{
 const x=audit({A:review('A',[row('A',0,{noGarments:true})])});
 assert.equal(x.reviewedSourceCounts.A,1);
 assert.equal(x.reviewedSourceCounts.B,0);
 assert.equal(x.unresolvedSources,7);
 assert.equal(x.selfAttestedAgreementOnly,0);
 assert.equal(x.realModelMaskIoU,null);
});
test('SOURCE99 refuses wrong photograph SHA, leaked fields, forged packet, reviewer aliases and QA robots',()=>{
 const good=review('A',[row('A',0)]);
 for(const patch of [
  r=>r.rows[0].sourceSHA256='a'.repeat(64),
  r=>r.packetId='b'.repeat(64),
  r=>r.rows[0].modelGuess='Tops',
  r=>r.rows[0].instances[0].boundingBox={x:0,y:0,width:1,height:1},
  r=>r.rows[0].note='x'.repeat(601),
  r=>r.rows[0].instances[0].polygon[0].x=2,
  r=>r.rows[0].instances[0].polygon[1]={x:.2,y:.2,confidence:.9},
  r=>r.rows[0].instances[0].primaryColor='Unknown',
  r=>r.privatePhoto='data:image/jpeg;base64,...',
  r=>{r.reviewerId='qa-robot-browser';r.rows[0].reviewerId='qa-robot-browser';},
  r=>r.independent=false
 ]){
  const mutated=structuredClone(good);patch(mutated);
  assert.throws(()=>audit({A:mutated}),/SOURCE99|INSTANCE94/);
 }
});
test('SOURCE99 distinct A/B/C self-attested reviewer names required; C cannot bypass A+B',()=>{
 const a=review('A',[row('A',0)]);
 const c=review('C',[row('C',0)]);
 assert.throws(()=>audit({A:a,C:c}),/SOURCE99/);
 const b=review('B',[row('B',0)]);
 b.reviewerId=a.reviewerId;b.rows[0].reviewerId=a.reviewerId;
 assert.throws(()=>audit({A:a,B:b}),/SOURCE99|INSTANCE94/);
 assert.throws(()=>audit({D:a}),/SOURCE99/);
});
test('SOURCE99 refuses candidate holdout promotion, swapped source hashes or fabricated accepted human masks',()=>{
 for(const change of [
  m=>m.candidates[0].holdoutEligible=true,
  m=>m.candidates[0].quarantine=false,
  m=>m.candidates[0].knownModelExposure='CONFIRMED_UNSEEN',
  m=>m.currentVerifiedHumanInstanceMasks=7,
  m=>m.scientificAcceptedCandidateCount=7,
  m=>m.candidates[1].pinnedSourceSHA256=m.candidates[0].pinnedSourceSHA256
 ]){
  const bad=structuredClone(manifest);change(bad);
  assert.throws(()=>auditProvisionalHumanReviews99({...baseline,manifest:bad,exportsByRole:{}}),/SOURCE97|SOURCE99/);
 }
});
test('SOURCE99 no CI pretends synthetic QA is scientific evidence or deploys the application',()=>{
 const ci=readFileSync('.github/workflows/source97-human-adjudication-99-no-deploy.yml','utf8');
 const cli=readFileSync('scripts/audit-source97-human-review-99.mjs','utf8');
 assert.match(ci,/BASE=afe42938dd5b385e1d4bae9423a60803f2bdd2e0/);
 assert.match(ci,/node scripts\/audit-source97-human-review-99\.mjs --empty/);
 assert.match(ci,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
 assert.doesNotMatch(ci,/deploy-pages|gh-pages|auth\/signUp|upload-artifact[\s\S]*reviewer-A/);
 assert.match(cli,/auditProvisionalHumanReviews99/);
});
