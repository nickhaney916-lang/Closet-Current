/** P185: honest actual saved garment + dual anatomical source-fit acceptance. */
import assert from 'node:assert/strict';
import {verifyDualGarmentScreens184} from '../dual-humanoid-photo-garment-184/evidence.mjs';
export function verifyGarmentShoulderEvidence185(record,{root,engine}={}){
 const pngProof=verifyDualGarmentScreens184(record,{root,engine});
 assert.equal(pngProof.verifiedSHAImages,21);
 assert.equal(pngProof.realGarment3DScreens,18);
 for(const row of record.evidence){
  assert.equal(row.anatomicalShoulderHemSourceAxis185,true,
   'Real shirt must apply shoulder measurement at HIGH world Y');
  assert.equal(row.physicalShoulderEasing185,true);
  assert.equal(row.maleShoulderEasing185,true);
  assert.equal(row.mannequinBaseCoverDisclosure185,true,
   'Mannequin anatomical shorts are NOT an owned saved bottom');
  assert.equal(row.noSelectedOrSavedBottomFabricated185,true);
  assert.ok(Number.isInteger(row.shoulderEasedVertices185)&&row.shoulderEasedVertices185>=20);
  assert.ok(Number.isFinite(row.shoulderMaxMeters185)&&
   row.shoulderMaxMeters185>.0001&&row.shoulderMaxMeters185<=.025);
  assert.equal(row.provisionalCutoutNeedsHumanReview,true);
  assert.equal(row.photorealismAccepted,false);
  assert.equal(row.ownerApprovalForArbitraryPhotos,false);
  assert.equal(row.bothRearViewsInferredNotPhotographed,true);
  assert.equal(row.physicalPhoneVerified,false);
  assert.equal(row.familyAlpha,'HOLD');
 }
 return Object.freeze({verified:true,sourceShoulderAndHemAxisCorrected:true,
  bothReal163BoneFigureShouldersEased:true,
  mannequinShortsClearlyDisclosedNotOwned:true,
  shaVerifiedRealBrowserImages:21,real3DViews:18,
  ownerCutoutApproved:false,physicalClothCollisionCertified:false,
  humanPhotorealismApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
