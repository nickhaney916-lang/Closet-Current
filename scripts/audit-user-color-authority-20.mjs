import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const dir='benchmark/color-confidence-19';
const read=async name=>JSON.parse(await readFile(dir+'/'+name,'utf8'));
const [original,independent,sourceLocks]=await Promise.all([
 read('report.json'),read('independent-audit.json'),read('source-quarantine.json')
]);
assert.equal(original.browserCases,12,'six genuine originals x two real browser engines');
assert.equal(original.uniqueLicensedOriginalPhotographs,6);
assert.equal(original.explicitManualColorPreserved,12,'all real-browser user edits must survive model recognition overwrite');
assert.equal(original.explicitlyClearedColorPreserved,12,'all intentional user color clears must remain unfilled');
assert.equal(original.allManualColorSourcesUnchanged,true);
assert.equal(original.wrongUncertainAutoFills,0);
assert.equal(original.trueIndependentColorGroundTruthAvailable,false);
assert.equal(original.measuredColorAccuracy,null);
assert.equal(original.releaseColorThreshold95PercentSatisfied,false);
assert.equal(original.noUnexpectedUploads,true);
assert.equal(original.jsErrors,0);
assert.equal(original.mobileScreenshots,6);
assert.equal(independent.mobileScreenshotShaVerified,6);
assert.equal(independent.originalShaIntegrity,true);
assert.equal(independent.noOriginalUploads,true);
assert.equal(sourceLocks.selectedIds.length,6);
const observed=new Set();
for(const result of original.cases){
 assert.ok(['chromium','webkit'].includes(result.engine));
 assert.ok(sourceLocks.selectedIds.includes(result.id));
 const key=result.engine+'/'+result.id;
 assert.ok(!observed.has(key));observed.add(key);
 assert.equal(result.userAuthority?.manualWon,true);
 assert.equal(result.userAuthority?.clearWon,true);
 assert.equal(result.userAuthority?.sourceUnchanged,true);
 assert.equal(result.originalSha256,result.sha256);
}
assert.equal(observed.size,12);
const final={
 priority:'USER-COLOR-AUTHORITY-20',underlyingSourceAudit:'COLOR-CONFIDENCE-19',
 browserEngineCases:12,uniqueUnchangedLicensedOriginals:6,
 manuallyConfirmedColorPreservedAfterForcedRecognition:12,
 manuallyClearedColorPreservedAfterForcedRecognition:12,
 pixelOriginalShaUnchanged:12,sourceQuarantineCount:sourceLocks.quarantined.length,
 screenshotsSHA256Checked:6,
 photoPrimaryColorAccuracy:null,
 independentGroundTruthLabelsPresent:false,
 fullMobileApplicationFlowCertified:false,
 realSignedTwoOwnerRLSCertified:false,
 physicalMobileHardwareCertified:false,
 result:'NARROW_COLOR_PROVENANCE_SAFETY_RESEARCH_VERIFIED',
 familyAlpha:'HOLD',productionTouched:false
};
await writeFile(dir+'/user-color-authority-20-audit.json',JSON.stringify(final,null,2)+'\n');
console.log('USER COLOR AUTHORITY20 INDEPENDENT REVIEW '+JSON.stringify(final));
