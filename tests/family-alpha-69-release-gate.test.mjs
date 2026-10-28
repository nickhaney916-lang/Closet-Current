import test from 'node:test';
import assert from 'node:assert/strict';
import {readReleaseEvidence,assertSnapshot,assessSnapshot,PIN,FORMAT,REQUIRED_GATES}
 from '../scripts/family-alpha-69-release-gate.mjs';
const original=await readReleaseEvidence();
const altered=fn=>{const x=structuredClone(original);fn(x);return x;};
test('exact green no-deploy CI still returns HOLD with all real-world blockers',()=>{
 const result=assessSnapshot(original);
 assert.equal(result.decision,'HOLD');
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.noDeployment,true);
 assert.equal(result.evidenceSourcePR,382);
 assert.equal(result.integratedSourceSHA,PIN);
 assert.equal(result.outstanding.length,Object.keys(REQUIRED_GATES).length);
 assert.deepEqual(result.outstanding.map(x=>x.id),Object.keys(REQUIRED_GATES));
 assert.equal(result.realPhotoVisual.pass,0);
 assert.equal(original.format,FORMAT);
});
test('reject source pin, fake green CI, wrong retry, unsupported image upgrades',()=>{
 const cases=[
  x=>x.source.head='f'.repeat(40),
  x=>x.source.pr=381,
  x=>x.ci.integration.status='PENDING',
  x=>x.ci.integration.status='SUCCESS_WITHOUT_EVIDENCE',
  x=>x.ci.inherited.attempt=1,
  x=>x.ci.inherited.run='https://example.com/false-run',
  x=>x.visual.pass=5,
  x=>x.visual.review=0,
  x=>x.visual.fail=0,
  x=>x.visual.humanApproved=true,
  x=>x.visual.licensedOriginals=14
 ];
 for(const [i,fn] of cases.entries())assert.throws(()=>assessSnapshot(altered(fn)),undefined,'forgery '+i);
});
test('never permits fabricated live privacy, storage, physical-phone or staging approval',()=>{
 for(const key of Object.keys(REQUIRED_GATES))for(const claim of ['PASS','SUCCESS','VERIFIED',true,null]){
  assert.throws(()=>assessSnapshot(altered(x=>{x.checks[key]=claim})),undefined,key+' '+claim);
 }
});
test('reject extra private photos, PII, account IDs, tokens, or forged deployment approvals',()=>{
 const cases=[
  x=>{x.privatePhotos=['data:image/jpeg;base64,AAAA']},
  x=>{x.email='tester@example.com'},
  x=>{x.checks.familyMemberName='private'},
  x=>{x.ci.integration.ownerToken='secret'},
  x=>{x.visual.imageUrl='https://example.com/private.jpg'},
  x=>{x.source.accountId='private'},
  x=>{x.decision.status='READY'},
  x=>{x.decision.status='APPROVED'},
  x=>{x.decision.deployAuthorized=true},
  x=>{x.decision.productionModified=true},
  x=>{x.decision.stagingModified=true},
  x=>{delete x.checks.realCloudBackupRestore},
  x=>{delete x.visual.humanApproved},
  x=>{x.ci.extra='looks fine'}
 ];
 for(const [i,fn] of cases.entries())assert.throws(()=>assertSnapshot(altered(fn)),undefined,'extra/claim '+i);
});
test('adversarial value types and missing evidence fail closed without external I/O',()=>{
 for(const bad of [null,undefined,[],{},'HOLD',true])
  assert.throws(()=>assessSnapshot(bad));
 assert.throws(()=>assessSnapshot(altered(x=>{x.visual.pass='0'})));
 assert.throws(()=>assessSnapshot(altered(x=>{x.checks=null})));
 assert.throws(()=>assessSnapshot(altered(x=>{x.source.head=null})));
});
