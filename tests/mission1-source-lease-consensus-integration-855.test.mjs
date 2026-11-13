import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../scripts/p79-synthetic-fixtures.mjs';
import {independentAgreement} from '../scripts/p75-dataset-core.mjs';
import {reviewHandoff} from '../scripts/p79-workstation-core.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

// P855 synthetic cryptographic test doubles are not human ground truth.
// The actual P854 source-executed scanner lease tests run separately in CI.
test('P855 shared P75 custodian and P79 workstation both refuse conflicting signed nested labels',async()=>{
 const f=await fixture(1);
 try{
  const source=f.bundle.sources[0].source;
  const a=f.receipt(0),b=f.receipt(1,{...f.label,quality:{...f.label.quality,framing:'clipped'}});
  const adjudication=independentAgreement(source,[a,b],f.bundle.registry,f.bundle.approvedFingerprint);
  assert.equal(adjudication.eligible,false);
  assert.ok(adjudication.issues.some(x=>x.includes('full-label disagreement')));
  assert.ok(adjudication.agreement.ratio<1);
  const handoff=reviewHandoff(source,[a,b],f.bundle.registry,f.bundle.approvedFingerprint);
  assert.equal(handoff.status,'DISPUTED / BLOCKED');
  assert.equal(handoff.acceptedHumanLabels,0);
 }finally{await f.cleanup();}
});
test('P855 cryptographic test-signature consensus never implies independent humans or release permission',async()=>{
 const f=await fixture(1);
 try{
  const source=f.bundle.sources[0].source, receipts=[f.receipt(0),f.receipt(1)];
  assert.equal(independentAgreement(source,receipts,f.bundle.registry,f.bundle.approvedFingerprint).eligible,true);
  assert.equal(reviewHandoff(source,receipts,f.bundle.registry,f.bundle.approvedFingerprint).status,'READY FOR P75 CUSTODIAN AUDIT');
  assert.equal(reviewHandoff(source,receipts,f.bundle.registry,f.bundle.approvedFingerprint).acceptedHumanLabels,0);
  const release=evaluateMission1Evidence(null);
  assert.equal(release.status,'BLOCKED');
  assert.equal(release.shouldLiftFamilyAlphaHold,false);
  assert.equal(release.countOfIndependentHumanBlindSources,0);
  assert.equal(release.countOfPhysicalDevicePlatforms,0);
 }finally{await f.cleanup();}
});