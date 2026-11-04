/**
 * COLOR-ENGINE-CONSISTENCY-21
 * Reuses real original-photo 16x16 browser results from PR #20 (actual
 * PhotoColor.estimate + ClothingDetails.fillColor), requiring the same
 * SHA-locked original to get a consistent *automatic saved color* in two
 * browser engines. Disagreements among REVIEW-ONLY suggestions are recorded
 * but not counted as false automatic acceptance. No ground-truth accuracy
 * can be concluded from this small development cohort.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const dir='benchmark/color-confidence-19';
const read=async file=>JSON.parse(await readFile(dir+'/'+file,'utf8'));
const [data,source,prior,shots]=await Promise.all([
 read('report.json'),read('source-quarantine.json'),
 read('user-color-authority-20-audit.json'),read('screenshots.json')
]);
assert.equal(data.priority,'COLOR-CONFIDENCE-SAFETY-19');
assert.equal(data.browserCases,12);
assert.equal(data.uniqueLicensedOriginalPhotographs,6);
assert.equal(data.wrongUncertainAutoFills,0);
assert.equal(data.explicitManualColorPreserved,12);
assert.equal(data.explicitlyClearedColorPreserved,12);
assert.equal(data.originalSha256Verified,true);
assert.equal(data.trueIndependentColorGroundTruthAvailable,false);
assert.equal(data.measuredColorAccuracy,null);
assert.equal(data.noUnexpectedUploads,true);
assert.equal(data.jsErrors,0);
assert.equal(prior.browserEngineCases,12);
assert.equal(prior.screenshotsSHA256Checked,6);
assert.equal(source.selectedIds.length,6);
const pairs=new Map();
for(const c of data.cases){
 assert.ok(['chromium','webkit'].includes(c.engine));
 assert.ok(source.selectedIds.includes(c.id));
 assert.equal(c.originalSha256,c.sha256);
 if(!pairs.has(c.id))pairs.set(c.id,new Map());
 const existing=pairs.get(c.id);
 assert.ok(!existing.has(c.engine),'each original must be evaluated once per browser');
 existing.set(c.engine,c);
}
assert.equal(pairs.size,6);
const measurements=[];
let automaticAgreements=0,autoDisagreements=0,reviews=0,reviewSuggestionDisagreements=0;
for(const id of source.selectedIds){
 const pair=pairs.get(id),chromium=pair?.get('chromium'),webkit=pair?.get('webkit');
 assert.ok(chromium&&webkit,'missing real browser original '+id);
 assert.equal(chromium.sha256,webkit.sha256,'cross-browser identity mismatch');
 const autoChromium=chromium.storedColor||null,autoWebkit=webkit.storedColor||null;
 if(autoChromium===null&&autoWebkit===null){
  reviews++;
  if(chromium.estimate?.color!==webkit.estimate?.color)reviewSuggestionDisagreements++;
 }else if(autoChromium===autoWebkit){
  automaticAgreements++;
 }else{
  autoDisagreements++;
 }
 measurements.push({id,sourceSHA256:chromium.sha256,
  chromiumEstimate:chromium.estimate?.color||null,
  chromiumSupport:chromium.estimate?.support??null,
  webkitEstimate:webkit.estimate?.color||null,
  webkitSupport:webkit.estimate?.support??null,
  automaticallySavedSameValue:autoChromium===autoWebkit,
  acceptedAutomaticColor:autoChromium===autoWebkit?autoChromium:null,
  bothReview:autoChromium===null&&autoWebkit===null,
  manualColorPreservedInBoth:chromium.userAuthority?.manualWon===true&&webkit.userAuthority?.manualWon===true,
  intentionalBlankPreservedInBoth:chromium.userAuthority?.clearWon===true&&webkit.userAuthority?.clearWon===true});
}
assert.equal(shots.length,6);
let pngsVerified=0;
for(const shot of shots){
 const bytes=await readFile(dir+'/'+shot.file);
 const checksum=createHash('sha256').update(bytes).digest('hex');
 assert.equal(checksum,shot.sha256,'original screenshot evidence SHA changed');
 const metadata=await sharp(bytes).metadata();
 assert.equal(metadata.width,shot.width);
 pngsVerified++;
}
const result={
 priority:'COLOR-ENGINE-CONSISTENCY-21',
 originalPhotos:source.selectedIds.length,
 actualChromiumAndWebkitRuns:data.browserCases,
 uniqueOriginalSHAverified:true,
 automaticallyAcceptedPairsSameColor:automaticAgreements,
 automaticCrossBrowserDisagreements:autoDisagreements,
 mutuallyReviewOnlyPairs:reviews,
 reviewOnlySuggestionLabelDisagreements:reviewSuggestionDisagreements,
 bothEnginesAgreeToAutomaticallyAcceptAtLeastOneColor:automaticAgreements>=1,
 sourcePreserved:true,externalUploads:0,browserErrors:0,
 manualOverridesPreserved:prior.manuallyConfirmedColorPreservedAfterForcedRecognition,
 manualClearsPreserved:prior.manuallyClearedColorPreservedAfterForcedRecognition,
 screenshotShaVerified:pngsVerified,
 groundTruthPrimaryColorAccuracy:null,
 independentHumanColorLabelsPresent:false,
 scientificGeneralizationCertified:false,
 allPotentiallyAmbiguousSourcesRequireHumanReview:true,
 familyAlpha:'HOLD',deployed:false,merged:false,measurement:measurements
};
await writeFile(dir+'/color-engine-consistency-21-audit.json',JSON.stringify(result,null,2)+'\n');
console.log('COLOR ENGINE 21 ACTUAL TWO BROWSER COMPARISON '+JSON.stringify({
 photos:result.originalPhotos,engines:2,autoAgreements:automaticAgreements,
 autoDisagreements,mutualReviews:reviews,reviewLabelDiffs:reviewSuggestionDisagreements,
 sourceShaPreserved:true,userCorrectionsProtected:result.manualOverridesPreserved,
 screenshotShaVerified:pngsVerified,scientificAccuracy:null,familyAlpha:'HOLD'
}));
assert.equal(autoDisagreements,0,
 'different browsers cannot silently auto-accept different values for the same original in research acceptance');
assert.ok(automaticAgreements>=1,
 'conservative safety change should retain automatic acceptance on at least one obviously strong case');
assert.equal(pngsVerified,6);
