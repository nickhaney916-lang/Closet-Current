import test from 'node:test';
import assert from 'node:assert/strict';
import {assessFamilyAlpha,evidenceKey,SUBJECTS,POSES,VIEWS,CRITERIA} from '../research/three-d-qa57/acceptance.mjs';
import {readFile} from 'node:fs/promises';
const h=v=>v.repeat(64);
const ledger={release:'HOLD',sourceId:'commons-0003',originalSHA256:h('a'),cutoutSHA256:h('b'),screenshots:{}};
const positive={disposition:'APPROVE',reviewer:'Independent visual reviewer',
 reviewDate:'2026-10-28',physicalDeviceTested:true,privacyGateVerified:true,
 ownerReleaseApproval:true,assessments:{}};
for(const model of SUBJECTS)for(const pose of POSES)for(const view of VIEWS){
 const key=evidenceKey(model,pose,view);
 ledger.screenshots[key]=h('c');
 positive.assessments[key]={screenshotSHA256:h('c'),notes:'Independently inspected actual photographed material and all silhouettes.'};
 for(const criterion of CRITERIA)positive.assessments[key][criterion]='PASS';
}
test('full independent human review hypothetically passes only with all evidence',()=>{
 assert.equal(assessFamilyAlpha(positive,ledger).approved,true);
});
test('unreviewed or REVIEW/FAIL clothing can never become a release PASS',()=>{
 assert.equal(assessFamilyAlpha({...positive,disposition:'HOLD'},ledger).approved,false);
 for(const grade of ['REVIEW','FAIL',null]){
  const copy=structuredClone(positive);
  copy.assessments['female:relaxed:side'].sideDrape=grade;
  const result=assessFamilyAlpha(copy,ledger);
  assert.equal(result.approved,false);
  assert.ok(result.blockers.some(x=>x.includes('sideDrape')));
 }
});
test('stale screenshots, missing explanations and missing privacy/phone approval fail closed',()=>{
 const copy=structuredClone(positive);
 copy.assessments['male:source:rear'].screenshotSHA256=h('d');
 copy.assessments['male:source:rear'].notes='ok';
 copy.privacyGateVerified=false;
 copy.physicalDeviceTested=false;
 assert.equal(assessFamilyAlpha(copy,ledger).approved,false);
 assert.ok(assessFamilyAlpha(copy,ledger).blockers.length>=4);
});
test('committed report remains HOLD and carries no invented human signoff',async()=>{
 const review=JSON.parse(await readFile(new URL('../research/three-d-qa57/release-review.json',import.meta.url)));
 assert.equal(review.disposition,'HOLD');
 assert.equal(assessFamilyAlpha(review,ledger).approved,false);
});
