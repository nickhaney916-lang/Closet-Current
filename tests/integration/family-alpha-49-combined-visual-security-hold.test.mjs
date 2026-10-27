import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertFamily49,evaluateCombined,PIN_OWNER_SOURCE,PIN_WORK44}
 from '../../scripts/check-family-alpha-49-combined-visual-security-hold.mjs';
import {safeSummary} from '../../scripts/family-alpha-48-real-jwt-readonly-preflight.mjs';
const vis=()=>({
 releaseGate:'HOLD',deployAuthorized:false,ownerVisualApproved:false,
 realAccountsVerified:false,parent:PIN_OWNER_SOURCE,
 changed:['__alpha_research/work43-integration/board.css',
 '__alpha_research/work43-integration/board.mjs']
});
const stage=()=>({
 decision:'HOLD',work43PrivateOriginalPhotoSource:'SOURCE_PINNED_OFFLINE',
 stagingReadOnlyEvidence:{
 evidenceConsistent:true,
 stageCloudBackupWriteStatus:'RESTRICTED_WRITER_CHAIN_PRESENT_LIVE_WRITE_UNTESTED',
 actualBackupSaveHttpVerified:false
 },unchangedFamilyVisualStageGate:'HOLD',humanVisualApproval:'NOT GIVEN',
 fourUniqueLiveJwtSessions:'NOT TESTED',deploymentsAuthorized:false,
 productionModified:false,stagingModified:false
});
const base=()=>({visual:vis(),stage:stage(),
 jwt:safeSummary(null,'NOT_EXECUTED_NEEDS_EXPLICIT_LOCAL_LIVE_OPTIN')});
const mutate=(fn)=>{const d=base();fn(d);return evaluateCombined(d)};
test('source-locked Work44 presentation and #352 corrected stage gate coexist without release',async()=>{
 const r=await assertFamily49();
 assert.equal(r.evidenceConsistent,true,r.issues.join(' | '));
 assert.equal(r.decision,'HOLD');
 assert.equal(r.newVisualPresentation,'PHOTO_ONLY_REVIEW');
 assert.equal(r.wornGarmentOverlay,'FAIL_UNAPPROVED');
 assert.equal(r.visualOwnerApproved,false);
 assert.equal(r.liveTwoAdultJwtIsolation,'NOT TESTED');
 assert.equal(r.exactWork44SourceCommit,PIN_WORK44);
 assert.equal(r.deploymentAuthorized,false);
});
test('offline visual success cannot be promoted to wear/owner approval or deployed preview',()=>{
 for(const edit of [
 d=>d.visual.releaseGate='READY',d=>d.visual.deployAuthorized=true,
 d=>d.visual.ownerVisualApproved=true,d=>d.visual.realAccountsVerified=true,
 d=>d.visual.parent='other',
 d=>d.visual.changed.push('auth.js'),
 d=>d.visual.changed=['__alpha_research/work43-integration/board.css']
 ]){
  const r=mutate(edit);assert.equal(r.evidenceConsistent,false);assert.equal(r.decision,'HOLD');
 }
});
test('the independent stage owner/source/backup evidence cannot be bypassed',()=>{
 for(const edit of [
 d=>d.stage.decision='READY',
 d=>d.stage.work43PrivateOriginalPhotoSource='UNTRUSTED',
 d=>d.stage.stagingReadOnlyEvidence.evidenceConsistent=false,
 d=>d.stage.stagingReadOnlyEvidence.stageCloudBackupWriteStatus='BACKUP_PASS',
 d=>d.stage.stagingReadOnlyEvidence.actualBackupSaveHttpVerified=true,
 d=>d.stage.unchangedFamilyVisualStageGate='READY',
 d=>d.stage.humanVisualApproval='GIVEN',
 d=>d.stage.fourUniqueLiveJwtSessions='PASS',
 d=>d.stage.deploymentsAuthorized=true,
 d=>d.stage.productionModified=true,
 d=>d.stage.stagingModified=true,
 ]){
  const r=mutate(edit);assert.equal(r.evidenceConsistent,false);assert.equal(r.deploymentAuthorized,false);
 }
});
test('real staging HTTP/JWT proof cannot be created by synthetic browser or fake status',()=>{
 for(const edit of [
 d=>d.jwt.status='PASS_LIVE_READONLY_TWO_OWNER_ACCESS',
 d=>d.jwt.decision='READY',
 d=>d.jwt.signedInDistinctAdultSessions=true,
 d=>d.jwt.signedInOwnerWritesTested=true,
 d=>d.jwt.authenticatedPhotoDownloadTested=true,
 d=>d.jwt.fourFamilyJwtSessionsTested=true,
 d=>d.jwt.deploymentAuthorized=true,
 d=>d.jwt.productionModified=true,
 d=>d.jwt.stagingModified=true,
 ]){
  const r=mutate(edit);assert.equal(r.evidenceConsistent,false);assert.equal(r.decision,'HOLD');
 }
});
test('independent correct fixture is consistent but still HOLD',()=>{
 const r=evaluateCombined(base());assert.equal(r.evidenceConsistent,true);
 assert.equal(r.decision,'HOLD');assert.equal(r.productionModified,false);
 assert.equal(r.stagingModified,false);assert.equal(r.deploymentAuthorized,false);
});
