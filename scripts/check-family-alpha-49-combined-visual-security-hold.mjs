/**
 * Family Alpha #49 — independent Work44 + corrected #352 gate.
 * Only works on a local no-deploy compiled candidate.
 * Staging remains unconfigured; all actual users and host policies remain untouched.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {assertWork44HOLD, OUTPUT as VISUAL} from './build-work44-visual-board-hold.mjs';
import {auditCurrentPhotoBoardStage} from './check-family-alpha-47-stage-photo-board-hold.mjs';
import {safeSummary} from './family-alpha-48-real-jwt-readonly-preflight.mjs';

export const PIN_WORK44='4a182cf817284b061f4c4a885958e3b0472d555d';
export const PIN_SECURITY='12dcc0bd7ee35eadad86503ae26cc9496a251b4a';
export const PIN_OWNER_SOURCE='b771329a5502cf53e495c860fe8c342d7ca3443a';

export function evaluateCombined({visual={},stage={},jwt={}}={}){
 const issues=[];
 if(visual.releaseGate!=='HOLD'||visual.deployAuthorized!==false||
  visual.ownerVisualApproved!==false||visual.realAccountsVerified!==false||
  visual.parent!==PIN_OWNER_SOURCE||
  !Array.isArray(visual.changed)||visual.changed.length!==2||
  !visual.changed.includes('__alpha_research/work43-integration/board.css')||
  !visual.changed.includes('__alpha_research/work43-integration/board.mjs'))
  issues.push('Unexpected Work44 source/asset boundary, visual or release claims');
 if(stage.decision!=='HOLD'||stage.work43PrivateOriginalPhotoSource!=='SOURCE_PINNED_OFFLINE'||
  stage.stagingReadOnlyEvidence?.evidenceConsistent!==true||
  stage.stagingReadOnlyEvidence?.stageCloudBackupWriteStatus!=='RESTRICTED_WRITER_CHAIN_PRESENT_LIVE_WRITE_UNTESTED'||
  stage.stagingReadOnlyEvidence?.actualBackupSaveHttpVerified!==false||
  stage.unchangedFamilyVisualStageGate!=='HOLD'||stage.humanVisualApproval!=='NOT GIVEN'||
  stage.fourUniqueLiveJwtSessions!=='NOT TESTED'||stage.deploymentsAuthorized!==false||
  stage.productionModified!==false||stage.stagingModified!==false)
  issues.push('Corrected private writer / real account Family Alpha gate missing or falsely approved');
 if(jwt.decision!=='HOLD'||jwt.status!=='NOT_EXECUTED_NEEDS_EXPLICIT_LOCAL_LIVE_OPTIN'||
  jwt.signedInDistinctAdultSessions!==false||jwt.signedInOwnerWritesTested!==false||
  jwt.authenticatedPhotoDownloadTested!==false||jwt.fourFamilyJwtSessionsTested!==false||
  jwt.deploymentAuthorized!==false||jwt.productionModified!==false||jwt.stagingModified!==false)
  issues.push('Synthetic/offline test cannot impersonate real staging Auth / photo download proof');
 return Object.freeze({
  decision:'HOLD',
  evidenceConsistent:issues.length===0,
  issues,
  exactWork44SourceCommit:PIN_WORK44,
  exactStageEvidenceCommit:PIN_SECURITY,
  exactPrivateOwnerBoardCommit:PIN_OWNER_SOURCE,
  newVisualPresentation:'PHOTO_ONLY_REVIEW',
  wornGarmentOverlay:'FAIL_UNAPPROVED',
  visualOwnerApproved:false,
  liveTwoAdultJwtIsolation:'NOT TESTED',
  realCloudBackupWriteRestore:'NOT TESTED',
  physicalAndroidIphone:'NOT TESTED',
  stagingAuthConfigured:false,
  deploymentAuthorized:false,
  productionModified:false,
  stagingModified:false,
  note:'Passing browser/synthetic source tests does not authorize the four-person staging release.'
 });
}
export async function assertFamily49(){
 const visual=await assertWork44HOLD();
 const stage=await auditCurrentPhotoBoardStage();
 const safe=safeSummary(null,'NOT_EXECUTED_NEEDS_EXPLICIT_LOCAL_LIVE_OPTIN');
 const css=await readFile(join(VISUAL,'__alpha_research/work43-integration/board.css'),'utf8');
 const board=await readFile(join(VISUAL,'__alpha_research/work43-integration/board.mjs'),'utf8');
 assert.match(css,/object-fit:contain/);
 assert.doesNotMatch(css,/object-fit\s*:\s*cover/);
 assert.match(board,/including any surroundings/);
 assert.match(board,/not a virtual try-on/);
 const result=evaluateCombined({visual,stage,jwt:safe});
 assert.equal(result.evidenceConsistent,true,result.issues.join('\n'));
 assert.equal(result.decision,'HOLD');
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log('FAMILY_ALPHA_49_COMBINED_VISUAL_PRIVACY_HOLD',JSON.stringify(await assertFamily49()));
}
