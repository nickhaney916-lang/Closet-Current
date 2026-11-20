/**
 * RESEARCH ONLY / HOLD. Consecutive, NEVER simultaneous joint rotations.
 * Segment A: actual licensed spine03 local Z rotates -6 to +6 degrees
 *            while spine04 stays at -12 degrees and all other bones freeze.
 * Segment B: spine03 remains +6 degrees and spine04 rotates -12 to +12.
 * Validate the whole original full-indexed 163bone garment/body trajectory
 * as TWO independent one-joint continuous harmonic LBS envelopes.
 * The joining boundary must match for EVERY ORIGINAL skinned XYZ.
 *
 * This is NOT a bound for concurrent 2-joint interpolation, cloth mechanics,
 * multi-axis joint paths or actual photographed wearer fit. Input witnesses
 * self report source/model provenance; genuine browser SHA controls own it.
 */
import {evaluateOriginalSingleMovingNamedJointAngularBroadphase}
 from './parameterized-original-named-joint-angular-bvh89.mjs';

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const block=(decision,more={})=>({
 decision,...more,consumer3DAdmitted:false,physicalFitCertified:false,
 verifiedRealGarmentDrape:false,originalPhoto2DFallbackRequired:true,
 measuredCameraAndBodyRegistration:false,
 sequentialMotionOnly:true,concurrentTwoJointMotionAudited:false,
 allArbitrary163boneMotionsAudited:false,familyAlpha:'HOLD'
});
const rad=n=>n*Math.PI/180;
const sameAngles=(arr,expected)=>Array.isArray(arr)&&
 arr.length===expected.length&&arr.every((v,i)=>finite(v)&&
 Math.abs(v-expected[i])<1e-12);
export function evaluateTwoSequentialOriginalNamedSpineJoints({
 segments,frontIndices,bodyIndices,
 expectedFrontFaces,expectedBodyFaces,
 sourceWitness,
 maxBodyBVHVisits=3000000,maxLeafPairTests=500000,
 maxNarrowphasePairs=60000
}={}){
 if(!Array.isArray(segments)||segments.length!==2)
  return block('BLOCKED_INCOMPLETE_SEQUENTIAL_ORIGINAL_JOINT_PATH');
 const [a,b]=segments;
 if(!a||!b||!sameAngles(a.anglesDeg,[-6,-3,0,3,6])||
  !sameAngles(b.anglesDeg,[-12,-6,0,6,12])||
  a.movingNamedJoint!=='spine03'||b.movingNamedJoint!=='spine04'||
  a.otherOriginalSpineJointHeldDeg!==-12||
  b.otherOriginalSpineJointHeldDeg!==6)
  return block('BLOCKED_UNVERIFIED_ORIGINAL_JOINT_SEQUENCE_OR_AXES');
 if(!sourceWitness||sourceWitness?.actualRigBoneCount!==163||
  sourceWitness?.allOtherBoneLocalTransformsFrozen!==true||
  sourceWitness?.sourceCoordinatesReadFromOriginalPositionAttribute!==true||
  sourceWitness?.originalSourceSkinnedMesh!==true||
  !/^[0-9a-f]{64}$/.test(sourceWitness?.originalJPEG_SHA256||'')||
  !/^[0-9a-f]{64}$/.test(sourceWitness?.actualLicensedRigSHA256||''))
  return block('BLOCKED_UNVERIFIED_ORIGINAL_RIG_SOURCE_OR_LOCAL_BONE_POSES');
 if(!frontIndices||!bodyIndices||
  !Number.isSafeInteger(expectedFrontFaces)||
  !Number.isSafeInteger(expectedBodyFaces)||
  expectedFrontFaces<1||expectedBodyFaces<1||
  expectedFrontFaces!==frontIndices.length/3||
  expectedBodyFaces!==bodyIndices.length/3)
  return block('BLOCKED_INCOMPLETE_TRUE_ORIGINAL_INDEXED_FACE_COVERAGE');
 const validPoses=(p)=>Array.isArray(p)&&p.length===5&&
  p[0]&&p[0].length>0&&p[0].length%3===0&&
  p.every(v=>v&&v.length===p[0].length);
 if(![a.frontPoses,b.frontPoses,a.bodyPoses,b.bodyPoses].every(validPoses)||
  a.frontPoses[4].length!==b.frontPoses[0].length||
  a.bodyPoses[4].length!==b.bodyPoses[0].length)
  return block('BLOCKED_UNVERIFIED_ORIGINAL_TWO_SEGMENT_BUFFER_SHAPE');
 let maxJoinError=0;
 const checkJoin=(left,right)=>{
  for(let i=0;i<left.length;i++){
   if(!finite(left[i])||!finite(right[i]))return false;
   const d=Math.abs(left[i]-right[i]);
   if(!finite(d))return false;
   maxJoinError=Math.max(maxJoinError,d);
  }
  return true;
 };
 if(!checkJoin(a.frontPoses[4],b.frontPoses[0])||
  !checkJoin(a.bodyPoses[4],b.bodyPoses[0])||
  maxJoinError>1e-7)
  return block('BLOCKED_DISCONNECTED_OR_NONFINITE_ACTUAL_SKELETAL_POSE_PATH',{
   maximumOriginalPoseJoinXYZDifferenceRigUnits:maxJoinError
  });
 const totalFront=frontIndices.length/3,totalBody=bodyIndices.length/3;
 const results=[];
 for(const segment of [a,b]){
  const result=evaluateOriginalSingleMovingNamedJointAngularBroadphase({
   frontPoses:segment.frontPoses,bodyPoses:segment.bodyPoses,
   frontIndices,bodyIndices,expectedFrontFaces,expectedBodyFaces,
   movingNamedJoint:segment.movingNamedJoint,
   deltaRadians:rad(segment.anglesDeg[4]-segment.anglesDeg[0]),
   sourceWitness:{...sourceWitness,
    singleMovingNamedBone:segment.movingNamedJoint},
   maxBodyBVHVisits,maxLeafPairTests,maxNarrowphasePairs
  });
  results.push({namedJoint:segment.movingNamedJoint,
   heldOtherSpineJointDeg:segment.otherOriginalSpineJointHeldDeg,
   actualOriginalFaceCount:[totalFront,totalBody],
   ...result
  });
 }
 const common={
  completeOriginalIndexedScopeSubmitted:true,
  originalFrontFacesPresentInEachSegment:totalFront,
  originalLicensedBodyFacesPresentInEachSegment:totalBody,
  continuousJoinVerifiedForEveryOriginalSourceAndBodyVertex:true,
  maximumOriginalPoseJoinXYZDifferenceRigUnits:maxJoinError,
  twoNamedSequentialOriginalJoints:['spine03','spine04'],
  eachSegmentExactlyOneMovingOriginalNamedJoint:true,
  otherJointFrozenAtEachSegment:true,
  bothSegmentsComputed:true,segmentAudits:results
 };
 const collision=results.find(x=>x.decision==='BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT');
 if(collision)
  return block('BLOCKED_TRUE_ORIGINAL_CONTACT_ON_SEQUENTIAL_JOINT_PATH',{
   ...common,decisiveJoint:collision.namedJoint,
   actualContactWitness:collision.witness
  });
 const denied=results.find(x=>![
  'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT'
 ].includes(x.decision));
 if(denied)
  return block('BLOCKED_UNRESOLVED_OR_BUDGETED_SEQUENTIAL_JOINT_PATH',{
   ...common,decisiveJoint:denied.namedJoint,
   exactUnresolvedCause:denied.decision
  });
 return block('RESEARCH_ONLY_TWO_SEQUENTIAL_FIXED_AXIS_JOINT_SEGMENTS_DISJOINT',{
  ...common,completeTwoSequentialSegmentEnvelopeChecks:true,
  reason:'only ORIGINAL floating/uncalibrated photo front, two ordered one-joint LBS intervals; not simultaneous motion or fitted clothing'
 });
}
