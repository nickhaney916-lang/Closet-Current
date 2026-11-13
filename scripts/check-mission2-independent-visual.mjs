/** Research-only no-deploy output, count-only. Never prints image bytes. */
import assert from 'node:assert/strict';
import {
 M2_VISUAL_POLICY,inspectOriginalVisualAssets,assessMission2VisualRelease
} from '../research/mission2-source-length/independent-visual-acceptance.mjs';

const cohort=await inspectOriginalVisualAssets();
const result=assessMission2VisualRelease(cohort);
assert.equal(cohort.originalSourceJPEGsSHA256Verified,59);
assert.equal(result.originalPhotoCount,59);
assert.equal(result.humanPhotorealism10of10Certified,false);
assert.equal(result.releaseAuthorized,false);
assert.equal(result.familyAlpha,'HOLD');
for(const category of M2_VISUAL_POLICY.categories)
 assert.ok(result.categoryCounts[category]>=2,'genuine category-source availability');
console.log('M2_ORIGINAL_59_REAL_PHOTO_3D_VISUAL_GATE_HOLD:'+JSON.stringify({
 verifiedOriginalJPEGs:cohort.originalSourceJPEGsSHA256Verified,
 verifiedSourceBytes:cohort.originalBytesVerified,
 development:cohort.partitionCounts.development,
 validation:cohort.partitionCounts.validation,
 recognitionHoldout:cohort.partitionCounts.holdout,
 realPhotoCategories:cohort.categorySourceCounts,
 original3DResearchBlouseExposedInRecognitionHoldout:true,
 independentlyBlind3DPhotos:cohort.independent3DBlindSourcesVerified,
 human3DPhotorealismRatings:cohort.independentlyHumanRatedSource3DImages,
 releaseBlockers:result.keyBlockers,
 humanTenOfTenCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
}));
