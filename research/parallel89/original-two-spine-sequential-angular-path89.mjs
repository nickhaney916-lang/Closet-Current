/**
 * Mission 2: full ORIGINAL 35,262-front /109,064-body indexed-face
 * continuous three-LEG spine03/spine04 articulation in the actual licensed
 * 163bone LBS skeleton. Each LEG independently moves ONE fixed-axis named
 * joint; ALL other 162 named local bone transforms are frozen within that leg.
 *
 * Segments are joined by comparing every actual original source/body posed
 * vertex at the exact end/start boundary, not by asserting nominal angles.
 * This certifies ONLY a piecewise-SEQUENTIAL research path and never
 * simultaneous two-bone motion, generic animation, cloth, drape or physical fit.
 */
import {evaluateAllIndexedOriginalSpine04AngularBroadphase}
 from './all-indexed-original-angular-bvh89.mjs';
const held={
 familyAlpha:'HOLD',consumer3DAdmitted:false,
 sourceOriginalPhoto2DFallbackRequired:true,
 physicallyFitted:false,originalFabricDrapeCertified:false,
 completeArbitraryTwoJointMotionCertified:false,
 simultaneousTwoJointMotionCertified:false,
 sourceWitnessSelfReportedNotIndependentAuthentication:true
};
const block=(decision,detail={})=>({decision,...detail,...held});
export const sequentialLegs=Object.freeze([
 Object.freeze({movingJoint:'spine04',fixedJoint:'spine03',
  fixedDegrees:-8,anglesDegrees:Object.freeze([-12,-6,0,6,12])}),
 Object.freeze({movingJoint:'spine03',fixedJoint:'spine04',
  fixedDegrees:12,anglesDegrees:Object.freeze([-8,-4,0,4,8])}),
 Object.freeze({movingJoint:'spine04',fixedJoint:'spine03',
  fixedDegrees:8,anglesDegrees:Object.freeze([12,6,0,-6,-12])})
]);
const jointPosition=(spec,step)=>({
 spine03:spec.movingJoint==='spine03'?
  spec.anglesDegrees[step]:spec.fixedDegrees,
 spine04:spec.movingJoint==='spine04'?
  spec.anglesDegrees[step]:spec.fixedDegrees
});
const identical=(a,b)=>{
 if(!a||!b||a.length!==b.length)return Infinity;
 let delta=0;
 for(let i=0;i<a.length;i++){
  if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))return Infinity;
  delta=Math.max(delta,Math.abs(a[i]-b[i]));
 }
 return delta;
};
const finitePositive=n=>Number.isSafeInteger(n)&&n>0;
export function evaluateOriginalFullIndexedSequentialTwoSpinePath({
 segments,frontIndices,bodyIndices,
 expectedFrontFaces,expectedBodyFaces,
 sourceWitness,simultaneousMotionRequested=false,
 maxSegmentBoundaryMismatch=1e-7,
 maxBodyBVHVisits=3000000,maxLeafPairTests=500000,
 maxNarrowphasePairs=60000
}={}){
 if(simultaneousMotionRequested!==false)
  return block('BLOCKED_SIMULTANEOUS_TWO_JOINT_PATH_NOT_PROVEN');
 if(!Array.isArray(segments)||segments.length!==3||
  !frontIndices||!bodyIndices||
  !finitePositive(expectedFrontFaces)||!finitePositive(expectedBodyFaces)||
  !Number.isFinite(maxSegmentBoundaryMismatch)||
  maxSegmentBoundaryMismatch<0||maxSegmentBoundaryMismatch>1e-5||
  ![maxBodyBVHVisits,maxLeafPairTests,maxNarrowphasePairs].every(finitePositive))
  return block('BLOCKED_INVALID_SEQUENTIAL_TWO_SPINE_PATH_INPUT');
 if(frontIndices.length!==expectedFrontFaces*3||
  bodyIndices.length!==expectedBodyFaces*3)
  return block('BLOCKED_INCOMPLETE_SEQUENTIAL_ORIGINAL_INDEXED_SCOPE',{
   submittedFrontFaces:frontIndices.length/3,
   submittedBodyFaces:bodyIndices.length/3});
 if(sourceWitness?.actualRigBoneCount!==163||
  sourceWitness?.originalSourceSkinnedMesh!==true||
  sourceWitness?.sourceCoordinatesReadFromOriginalPositionAttribute!==true||
  sourceWitness?.allOther161BoneLocalPosesUnchanged!==true||
  !/^[a-f0-9]{64}$/.test(sourceWitness?.originalJPEG_SHA256||'')||
  !/^[a-f0-9]{64}$/.test(sourceWitness?.actualLicensedRigSHA256||''))
  return block('BLOCKED_UNVERIFIED_ORIGINAL_TWO_SPINE_SOURCE_WITNESS');
 let maxBoundaryDifference=0;
 for(let i=0;i<3;i++){
  const spec=sequentialLegs[i],got=segments[i];
  if(!got||got.movingJoint!==spec.movingJoint||
   got.fixedJoint!==spec.fixedJoint||
   got.fixedDegrees!==spec.fixedDegrees||
   !Array.isArray(got.anglesDegrees)||
   got.anglesDegrees.length!==5||
   got.anglesDegrees.some((deg,j)=>deg!==spec.anglesDegrees[j])||
   got.allOtherLocalBonesFrozenWithinSegment!==true||
   !Array.isArray(got.frontPoses)||got.frontPoses.length!==5||
   !Array.isArray(got.bodyPoses)||got.bodyPoses.length!==5)
   return block('BLOCKED_ORIGINAL_SEQUENTIAL_KINEMATIC_SEGMENT_MISMATCH',{
    offendingSegment:i});
  if(i){
   const prev=segments[i-1],prevEnd=jointPosition(sequentialLegs[i-1],4),
    nextStart=jointPosition(spec,0);
   if(prevEnd.spine03!==nextStart.spine03||
    prevEnd.spine04!==nextStart.spine04)
    return block('BLOCKED_JOINT_SEGMENT_BOUNDARY_ANGLES_DISCONTINUOUS',{
     offendingSegment:i});
   const f=identical(prev.frontPoses[4],got.frontPoses[0]),
    b=identical(prev.bodyPoses[4],got.bodyPoses[0]);
   if(!Number.isFinite(f)||!Number.isFinite(b)||
    Math.max(f,b)>maxSegmentBoundaryMismatch)
    return block('BLOCKED_REAL_ORIGINAL_SKINNED_SEGMENT_BOUNDARY_DISCONTINUITY',{
     offendingSegment:i,maximumFrontMismatch:f,maximumBodyMismatch:b});
   maxBoundaryDifference=Math.max(maxBoundaryDifference,f,b);
  }
 }
 const results=[];
 let completedSegments=0,actualContactSegments=0,unresolvedSegments=0,
  budgetBlockedSegments=0,maximumHarmonicResidual=0;
 for(let i=0;i<3;i++){
  const s=segments[i],spec=sequentialLegs[i],
   delta=(spec.anglesDegrees[4]-spec.anglesDegrees[0])*Math.PI/180;
  const result=evaluateAllIndexedOriginalSpine04AngularBroadphase({
   frontPoses:s.frontPoses,bodyPoses:s.bodyPoses,
   frontIndices,bodyIndices,
   expectedFrontFaces,expectedBodyFaces,
   deltaRadians:delta,
   sourceWitness:{
    actualRigBoneCount:163,
    singleMovingNamedBone:spec.movingJoint,
    allOtherBoneLocalTransformsFrozen:
     s.allOtherLocalBonesFrozenWithinSegment===true,
    sourceCoordinatesReadFromOriginalPositionAttribute:
     sourceWitness.sourceCoordinatesReadFromOriginalPositionAttribute,
    originalSourceSkinnedMesh:sourceWitness.originalSourceSkinnedMesh,
    originalJPEG_SHA256:sourceWitness.originalJPEG_SHA256,
    actualLicensedRigSHA256:sourceWitness.actualLicensedRigSHA256
   },
   maxBodyBVHVisits,maxLeafPairTests,maxNarrowphasePairs
  });
  results.push({
   segment:i+1,movingOriginalLicensedBone:spec.movingJoint,
   frozenOriginalLicensedBone:spec.fixedJoint,
   frozenJointAngleDegrees:spec.fixedDegrees,
   namedMovingJointAnglesDegrees:[...spec.anglesDegrees],
   decision:result.decision,
   completeOriginalAngularBroadphase:
    result.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted===true,
   actualOriginalVerifiedContactWitness:result.witness||null,
   originalFrontFaceCount:result.originalFrontFaceCount??null,
   originalBodyFaceCount:result.originalBodyFaceCount??null,
   maximumQuarterPoseHarmonicResidualRigUnits:
    result.maxHarmonicQuarterPoseResidualRigUnits??null,
   bodyBVHNodesVisited:result.bodyBVHNodesVisited??null,
   overlappingOriginalAngularEnvelopes:
    result.overlappingOriginalAngularEnvelopes??null,
   originalIndexedFaceScopeFromFullArrays:
    result.allSubmittedOriginalFacesIndexed===true,
   ...held
  });
  if(result.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted)
   completedSegments++;
  if(result.decision==='BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT')
   actualContactSegments++;
  else if(result.decision==='BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT')
   unresolvedSegments++;
  else if(result.decision!=='RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT')
   budgetBlockedSegments++;
  if(Number.isFinite(result.maxHarmonicQuarterPoseResidualRigUnits))
   maximumHarmonicResidual=Math.max(maximumHarmonicResidual,
    result.maxHarmonicQuarterPoseResidualRigUnits);
 }
 const summary={
  actualNamedOriginalBonesMovedInDifferentSegments:['spine04','spine03'],
  fixedAxisSingleMovingJointPerSegment:true,
  originalRestoredNotAssumedByPureEvaluator:true,
  segmentCount:3,segmentResults:results,
  originalFrontFacesSubmittedPerSegment:expectedFrontFaces,
  originalBodyFacesSubmittedPerSegment:expectedBodyFaces,
  numberCompletedFullAngularBroadphases:completedSegments,
  numberActualContactSegments:actualContactSegments,
  numberUnresolvedAngularSegments:unresolvedSegments,
  numberResourceOrOtherBlockedSegments:budgetBlockedSegments,
  maximumBoundaryVertexMismatchRigUnits:maxBoundaryDifference,
  maximumHarmonicQuarterPoseResidualRigUnits:maximumHarmonicResidual,
  completeAllThreeSequentialOriginalSweptSegments:
   completedSegments===3&&budgetBlockedSegments===0&&
   actualContactSegments===0,
  oneJointAtATimeOnlyNotSimultaneousOrWearerFitted:true,
  originalPhotographCameraMetricScaleUnknown:true,
  originalGarmentActualReverseUnobserved:true
 };
 if(actualContactSegments)
  return block('BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_REAL_CONTACT',summary);
 if(budgetBlockedSegments)
  return block('BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_INCOMPLETE_RESOURCE_OR_MODEL',summary);
 if(unresolvedSegments)
  return block('BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_UNRESOLVED_CONTACT',summary);
 return block('RESEARCH_ONLY_ORIGINAL_TWO_SPINE_PIECEWISE_FULL_FACE_SWEEPS_SEPARATED',
  summary);
}
