import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build,verify,OUTPUT,WORK54_OUTPUT,EDITOR,PLANNER,PINS}
 from '../scripts/build-family-alpha-74-work54-phone-hold.mjs';

test('mainline and reviewed Work54 source pins are exact and family release is never approved',async()=>{
 assert.equal(PINS.mainline72,'195d230539a58d1cf23a33367b9d13d395955565');
 assert.equal(PINS.work54,'4ae94144e1348efe7bd27427fee41dbedf0e030f');
 assert.equal(PINS.work54VisualUnblock,'1bbb5c4075f63387ac9ce761de69e7c552d20dab');
 const report=await verify();
 assert.equal(report.decision,'HOLD');
 assert.equal(report.realPhotoOwnerVisualPass,0);
 assert.equal(report.deploymentAuthorized,false);
 assert.equal(report.existingManualFitPreserved,true);
 assert.equal(report.protectedDeviceHelpAndPrivateFeedbackPreserved,true);
 assert.equal(report.photoAndOwnerAssetsUnchanged,true);
});

test('exact Work54 compiled fitted editor preserved along with existing private feedback and phone checklist',async()=>{
 const baseline=await readFile(WORK54_OUTPUT+'/'+EDITOR),integrated=await readFile(OUTPUT+'/'+EDITOR);
 assert.deepEqual(integrated,baseline);
 const planner=await readFile(OUTPUT+'/'+PLANNER);
 assert.deepEqual(planner,await readFile('research/work54/starting-fit.mjs'));
 const view=await readFile(OUTPUT+'/index.html','utf8');
 assert.match(view,/id="alphaPhoneWalkthrough"/);
 assert.match(view,/id="alphaPrivateFeedback"/);
 assert.match(integrated.toString(),/Suggest starting fit/);
 assert.match(integrated.toString(),/Existing manual or restored fit kept/);
});

test('release marker never promotes synthetic device tests or reviewed starting guess to family pilot approval',async()=>{
 const m=JSON.parse(await readFile(OUTPUT+'/family-alpha-74-HOLD.json','utf8'));
 for(const x of ['releaseAuthorized','deploymentAuthorized','stagingModified','productionModified',
  'actualPhysicalPhoneVerified','realTwoOwnerJwtVerified','cloudBackupWriteRestoreVerified','humanVisualApproved'])
  assert.equal(m[x],false,x);
 assert.deepEqual(m.onlyModifiedCompiledAssets,[EDITOR]);
 assert.deepEqual(m.onlyAddedCompiledAssets,[PLANNER]);
 assert.deepEqual(m.pins,PINS);
});

test('source patch and reviewed planner contain no network, cloud storage or automatic approval code',async()=>{
 const s=await readFile('research/work54/starting-fit.mjs','utf8');
 assert.doesNotMatch(s,/fetch\s*\(|localStorage|indexedDB|sendBeacon|ownerApproved:\s*true|rgba\[[^\]]+\]\s*=/);
 assert.match(s,/requiresHumanReview:true/);
 assert.match(s,/unsupported-source-or-shoes/);
 const fitted=await readFile(OUTPUT+'/'+EDITOR,'utf8');
 assert.match(fitted,/!event\.isTrusted\|\|!check\(\)/);
 assert.match(fitted,/Starting fit proposed from the reviewed cutout/);
 assert.match(fitted,/existing.*manual|Existing manual or restored fit kept/i);
});
