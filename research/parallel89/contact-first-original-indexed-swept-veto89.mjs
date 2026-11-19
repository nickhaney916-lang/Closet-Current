/**
 * M2 authentic ORIGINAL source photo/front / licensed body contact-first veto.
 * A true original indexed face-contact witness is a mathematically sufficient
 * NEGATIVE garment/body safety result. Validate complete supplied ORIGINAL
 * source/anatomical indexing + all five source poses before inexpensive exact
 * face-pair witness evaluation. Positive => STOP early; expensive all-pair
 * BVH work is NOT required to REJECT an unsafe garment. Negative/unknown =>
 * BLOCKED, NEVER CLEAR; caller's full angular BVH is separate research.
 *
 * This pure function cannot independently authenticate source filenames,
 * hashes, real camera metric calibration, source reverse or skin contracts.
 */
import {classifyExactTriangleContact} from './full-indexed-contact-calibration89.mjs';

const safe=n=>Number.isSafeInteger(n)&&n>=0;
const positive=new Set(['CROSSING','TOUCHING','COPLANAR_OVERLAP']);
const block=(decision,detail={})=>({
 decision,...detail,fullOriginalAngularBroadphaseCompleted:false,
 actualMeasuredSourceCameraCalibration:false,
 originalBodyGarmentPhysicalFitCertified:false,
 originalSourceFabricDrapeCertified:false,
 sourceOriginalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,familyAlpha:'HOLD'
});
export function checkOriginalIndexedContactBeforeSweptBVH({
 frontPoses,bodyPoses,frontIndices,bodyIndices,
 expectedFrontFaces,expectedBodyFaces,
 originalFrontFace,originalBodyFace,rigDepthShift,
 witnessPoseIndex=2,sourceWitness=null,maxTotalInputScalars=2000000
}={}){
 if(!safe(expectedFrontFaces)||expectedFrontFaces<1||
  !safe(expectedBodyFaces)||expectedBodyFaces<1||
  !safe(maxTotalInputScalars)||maxTotalInputScalars<6||
  !Array.isArray(frontPoses)||!Array.isArray(bodyPoses)||
  frontPoses.length!==5||bodyPoses.length!==5||
  !frontIndices||!bodyIndices)
  return block('BLOCKED_UNSAFE_ORIGINAL_WITNESS_INPUT');
 const frontCount=frontIndices.length/3,bodyCount=bodyIndices.length/3;
 if(!Number.isSafeInteger(frontCount)||!Number.isSafeInteger(bodyCount)||
  frontCount!==expectedFrontFaces||bodyCount!==expectedBodyFaces)
  return block('BLOCKED_ORIGINAL_WITNESS_INCOMPLETE_INDEXED_SCOPE',{
   reportedFrontFaces:frontCount,reportedBodyFaces:bodyCount});
 const nf=frontPoses[0]?.length,nb=bodyPoses[0]?.length;
 if(!safe(nf)||!safe(nb)||nf%3!==0||nb%3!==0||
  !nf||!nb||5*(nf+nb)>maxTotalInputScalars||
  frontPoses.some(p=>p?.length!==nf)||
  bodyPoses.some(p=>p?.length!==nb))
  return block('BLOCKED_ORIGINAL_WITNESS_VERTEX_SHAPE_OR_CAP');
 if(!safe(originalFrontFace)||originalFrontFace>=frontCount||
  !safe(originalBodyFace)||originalBodyFace>=bodyCount||
  !safe(witnessPoseIndex)||witnessPoseIndex>4||
  !Number.isFinite(rigDepthShift)||rigDepthShift<0||rigDepthShift>3)
  return block('BLOCKED_ORIGINAL_CONTACT_WITNESS_INVALID');
 const hashes=sourceWitness?.originalJPEG_SHA256&&
  /^[a-f0-9]{64}$/.test(sourceWitness.originalJPEG_SHA256)&&
  sourceWitness?.originalLicensedRigSHA256&&
  /^[a-f0-9]{64}$/.test(sourceWitness.originalLicensedRigSHA256);
 if(!hashes||sourceWitness?.actualRigBoneCount!==163||
  sourceWitness?.correctedPositionAttributeWorldSkinning!==true||
  sourceWitness?.oneNamedJointOnly!=='spine04'||
  sourceWitness?.otherBoneLocalPosesFrozen!==true)
  return block('BLOCKED_UNVERIFIED_ORIGINAL_RIG_IDENTITY_OR_SKINNING');
 const finitePoses=poses=>poses.every(arr=>{
  for(let i=0;i<arr.length;i++)if(!Number.isFinite(arr[i]))return false;
  return true;
 });
 if(!finitePoses(frontPoses)||!finitePoses(bodyPoses))
  return block('BLOCKED_NONFINITE_ORIGINAL_SKINNED_VERTEX');
 const bounds=(indices,n)=>{
  for(let i=0;i<indices.length;i++)
   if(!safe(indices[i])||indices[i]>=n/3)return false;
  return true;
 };
 if(!bounds(frontIndices,nf)||!bounds(bodyIndices,nb))
  return block('BLOCKED_ORIGINAL_INDEX_OUTSIDE_TRUE_VERTEX_BUFFER');
 const face=(poses,indices,i,t,dz)=>{
  const p=poses[t],out=[];
  for(let k=0;k<3;k++){
   const j=3*indices[3*i+k];
   out.push([p[j],p[j+1],p[j+2]-dz]);
  }
  return out;
 };
 const a=face(frontPoses,frontIndices,originalFrontFace,witnessPoseIndex,
  rigDepthShift);
 const b=face(bodyPoses,bodyIndices,originalBodyFace,witnessPoseIndex,0);
 const kind=classifyExactTriangleContact(a,b);
 const common={
  originalFrontFacesIndexed:frontCount,originalBodyFacesIndexed:bodyCount,
  originalFrontVerticesIncluded:nf/3,originalBodyVerticesIncluded:nb/3,
  allFiveOriginalPosesCoordinatesFinitelyChecked:true,
  completeOriginalFrontAndBodyFaceIndicesChecked:true,
  witnessOriginalFrontFace:originalFrontFace,
  witnessOriginalBodyFace:originalBodyFace,
  witnessPoseIndex,witnessClass:kind,
  chosenRigZShiftOnly:rigDepthShift,
  originalPhotoXYSilhouettePreserved:true,
  candidateGarmentReverseNotObserved:true,
  sourceWitnessOnlyStructurallyVerifiedNotIndependentlyAuthenticated:true
 };
 if(!positive.has(kind))
  return block('BLOCKED_UNPROVEN_ORIGINAL_TRUE_FACE_CONTACT',common);
 return block('BLOCKED_TRUE_ORIGINAL_INDEXED_CONTACT_BEFORE_BVH',{
  ...common,actualVerifiedOriginalIndexedFaceContact:true,
  soundEarlyExitRequiresNoAdditionalPairs:true,
  noFullNegativeContactClaim:true
 });
}
