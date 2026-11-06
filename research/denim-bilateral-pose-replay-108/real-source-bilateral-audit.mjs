/**
 * PHOTO108 – independent verification of real P106 bilateral, alternating and
 * repeated photographed jeans, with fail-closed source identity, UV/front/
 * skin protection and original skinned body triangle non-regression.
 *
 * Crucially this does NOT claim a cloth physics simulator, swept collision
 * proof, general user-photo reconstruction, or visual photorealism.
 */
import {validateBilateralSourcePose108} from './bilateral-pose-policy.mjs';
const LICENSED_SOURCE_SHA=Object.freeze({
 'commons-public-domain-jeans-2005':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'commons-cc-by-sa-denimjeans2-2008':'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const fail=reason=>{throw Error('PHOTO108 '+reason);};
export function verifyPhotographedBilateralDenim108(pants,{left,right}={}){
 const pose=validateBilateralSourcePose108(left,right);
 const mesh=pants?.meshes?.[0];
 const s=pants?.stats;
 if(pants?.meshes?.length!==1||!mesh?.isSkinnedMesh||
   mesh.skeleton?.bones?.length!==163||
   !s?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
   !s?.poseResponsiveDenim104||
   !s?.originalPhotographedDenimNormalContinuity105||
   !s?.photographedDenimCalfDrapeGeometry106||
   !s?.originalPhotoUVRestFrontSkinPositionsBytePreserved77||
   !s?.originalSourcePhotoUVRestSkinAndFrontNormalsUnchanged105||
   !s?.originalSourcePhotographAndUVRestSkinProtected106||
   s.sourceSHA256!==LICENSED_SOURCE_SHA[s.sourceId]||
   s.real163BoneSampledKnee103?.leftDegrees!==pose.leftDegrees||
   s.real163BoneSampledKnee103?.rightDegrees!==pose.rightDegrees)
  fail('real original SHA-verified 163-bone P103-106 photographed source/pose required');
 const f=s.sourceNeutralRearCalfDrape106;
 const actual=s.actualSkinnedDenimBodyCrossingSegments77;
 if(!f||!Number.isSafeInteger(actual)||actual<0||
    !Number.isSafeInteger(f.contactBefore)||f.contactBefore<0||
    !Number.isSafeInteger(f.contactAfter)||f.contactAfter<0||
    actual!==f.contactAfter||f.contactAfter>f.contactBefore)
  fail('actual photographed calf pose-to-body triangle contact must be measured and not worsen');
 if(!Number.isSafeInteger(f.moved)||f.moved<0||
    !Number.isFinite(f.maxShift)||f.maxShift<0||f.maxShift>.012001)
  fail('actual rear calf vertices and maximum photographed source relative displacement invalid');
 const neutral=left===0&&right===0;
 if(neutral){
  if(f.moved!==0||f.maxShift!==0||f.factor!==0)
   fail('source straight legs must not invent hanging cloth geometry');
 }else{
  if(f.moved<8||f.maxShift<.0004||![1,.6,.3].includes(f.factor)||
     f.sourcePhotoFrontProtectedVertices<70)
   fail('true pictured jeans rear calf must respond measurably to genuine bending');
  if(left>0&&!(f.rightLegMoved>=8)||
     left===0&&(f.rightLegMoved||0)!==0||
     right>0&&!(f.leftLegMoved>=8)||
     right===0&&(f.leftLegMoved||0)!==0)
   fail('left/right anatomical source legs must be independently isolated');
 }
 const geo=mesh.geometry,p=geo?.getAttribute('position'),
   orig=geo?.getAttribute('pantsRest'),
   src=geo?.getAttribute('pantsSourceUV'),
   front=geo?.getAttribute('pantsSourceFront'),
   index=geo?.getAttribute('skinIndex'),
   weights=geo?.getAttribute('skinWeight');
 if(!p||p.count<400||[orig,src,front,index,weights].some(a=>a?.count!==p.count))
  fail('source JPEG/UV/rest/front/skin original geometry attributes unavailable');
 if(s.familyAlpha!=='HOLD'||s.releaseAuthorized!==false||
    s.noInventedReversePhotograph106!==true||
    s.physicallySimulatedCloth106!==false||
    s.fullContinuousSweptBodyContactProof106!==false||
    s.independentHumanPhotorealismApproved106!==false||
    s.physicalPhonesTested106!==false)
  fail('honest scientific HOLD/physical phone/rear photo/privacy release gates required');
 return {...pants,stats:{...s,
  bilateralDenimPoseReplayVerified108:true,
  independentOriginalBilateralKnees108:pose,
  independentSourceOriginal163BonesVerified108:true,
  perLegCalfVertexMovement108:{
   leftKneeAppliedRightMeshLeg:f.rightLegMoved||0,
   rightKneeAppliedLeftMeshLeg:f.leftLegMoved||0,
   originalSHA256:s.sourceSHA256,
   sampledTriangleCrossingsBefore:f.contactBefore,
   sampledTriangleCrossingsAfter:f.contactAfter,
   maximumSourceRelativeCalfShiftMeters:f.maxShift
  },
  perPoseResetAndReplayScreenshotProofNeeded108:true,
  originalPhotoAndUVSkinAndFrontPreserved108:true,
  fullMovementSweepCollisionVerified108:false,
  photorealisticPhysicalClothDynamicsVerified108:false,
  independentHumanVisualApproval108:false,
  actualAndroidIphoneDeviceTested108:false,
  realSignedMultiAccountRLSVerified108:false,
  productionDeploymentAuthorized108:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 }};
}
