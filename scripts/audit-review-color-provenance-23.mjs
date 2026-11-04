import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/color-confidence-19';
const read=async name=>JSON.parse(await readFile(dir+'/'+name,'utf8'));
const [report,source,oldAudit,manualAudit,engineAudit,shots]=await Promise.all([
 read('report.json'),read('source-quarantine.json'),read('independent-audit.json'),
 read('user-color-authority-20-audit.json'),read('color-engine-consistency-21-audit.json'),
 read('screenshots.json')
]);
assert.equal(report.uniqueLicensedOriginalPhotographs,6);
assert.equal(report.browserCases,12);
assert.equal(source.selectedIds.length,6);
assert.equal(report.originalSha256Verified,true);
assert.equal(report.measuredColorAccuracy,null);
assert.equal(report.noteOnlyColorProvenancePreserved,12);
assert.equal(report.consumerManualEditsPreserved,12);
assert.equal(report.consumerManualClearsPreserved,12);
assert.equal(report.explicitManualColorPreserved,12);
assert.equal(report.explicitlyClearedColorPreserved,12);
assert.equal(report.wrongUncertainAutoFills,0);
assert.equal(report.noUnexpectedUploads,true);
assert.equal(report.jsErrors,0);
assert.equal(oldAudit.mobileScreenshotShaVerified,6);
assert.equal(manualAudit.manualOverridesPreserved,undefined);
assert.equal(manualAudit.manuallyConfirmedColorPreservedAfterForcedRecognition,12);
assert.equal(manualAudit.manuallyClearedColorPreservedAfterForcedRecognition,12);
assert.ok(Number.isInteger(engineAudit.automaticCrossBrowserDisagreements)&&engineAudit.automaticCrossBrowserDisagreements>=0,'inherited cross-browser measurement must be real and nonnegative');
const inheritedColorModelMismatchIds=(engineAudit.measurement||[]).filter(x=>!x.automaticallySavedSameValue).map(x=>x.id);
const recordIds=new Set();
for(const row of report.cases){
 assert.ok(source.selectedIds.includes(row.id));
 const key=row.engine+'/'+row.id;
 assert.ok(!recordIds.has(key));recordIds.add(key);
 assert.equal(row.originalSha256,row.sha256);
 assert.equal(row.consumerReviewForm?.estimatedStillSource,'photo-estimate');
 assert.equal(row.consumerReviewForm?.estimatedColor,'Blue');
 assert.equal(row.consumerReviewForm?.manualSource,'user');
 assert.equal(row.consumerReviewForm?.manualColor,'Green');
 assert.equal(row.consumerReviewForm?.clearedSource,'user');
 assert.equal(row.consumerReviewForm?.clearedColor,'');
 assert.equal(row.consumerReviewForm?.shaUnchanged,true);
 assert.equal(row.consumerReviewForm?.ownerId,'owner-research-only');
}
assert.equal(recordIds.size,12);
assert.equal(shots.length,6);
let verifiedScreenshots=0;const usedScreens=new Set();
for(const shot of shots){
 assert.ok(['chromium','webkit'].includes(shot.engine));
 assert.ok([320,390,430].includes(shot.width));
 assert.ok(!usedScreens.has(shot.engine+'/'+shot.width));
 usedScreens.add(shot.engine+'/'+shot.width);
 const data=await readFile(dir+'/'+shot.file),checksum=createHash('sha256').update(data).digest('hex');
 assert.equal(checksum,shot.sha256);
 const info=await sharp(data).metadata();
 assert.equal(info.format,'png');
 assert.equal(info.width,shot.width);
 assert.ok(info.height>500&&data.length>8000);
 verifiedScreenshots++;
}
assert.equal(verifiedScreenshots,6);
const audit={
 priority:'REVIEW-COLOR-PROVENANCE-23',status:'NARROW_RESEARCH_VERIFIED',
 genuineLicensedOriginals:6,originalSHA256Locked:true,
 chromeWebkitBrowserCases:12,realConsumerFormNoteOnlyPreservesEstimatedSource:12,
 realConsumerFormManualInputMarksUser:12,realConsumerFormUserClearMarksUser:12,
 originalSHAAndOwnerUnchanged:12,realScreenshotSHAverified:6,
 falseAutoColorOnReview:0,fullModelColorAccuracy:null,independentHumanGroundTruth:false,
 previousManualColorAuthorityTestsPassed:true,
 inheritedCrossBrowserAutoColorMismatches:engineAudit.automaticCrossBrowserDisagreements,
 inheritedCrossBrowserMismatchSourceIds:inheritedColorModelMismatchIds,
 inheritedColorEngine21Generalization:engineAudit.automaticCrossBrowserDisagreements?'NEEDS_REWORK':'NARROW_DEVELOPMENT_COHORT_PASS',
 // This records inherited model science failures without conflating them with
 // correctly preserved save-provenance. No false model pass is asserted.
 previousCrossBrowserConsistencyPassed:engineAudit.automaticCrossBrowserDisagreements===0,
 noUnexpectedPrivatePhotoUpload:true,clientSideErrors:0,
 realSignedCloudOwnerIsolationNotTested:true,
 actualEndToEndFullAppSaveNotTested:true,
 familyAlpha:'HOLD',prodDeploy:false,branchMerged:false
};
await writeFile(dir+'/review-color-provenance-23-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log('REVIEW-COLOR-PROVENANCE-23 INDEPENDENT AUDIT '+JSON.stringify(audit));
