/**
 * Mission 2 corrected-original source: bounded fixed-axis, single-joint LINEAR-BLEND-SKINNING
 * angular-motion envelope. Research ONLY / original family alpha HOLD.
 *
 * A single rotating joint and its descendants, with fixed parents and
 * frozen transforms, generate each LBS skinned vertex as:
 *   p(theta)=A+B cos(theta)+C sin(theta).
 *
 * We derive coefficients from real start/middle/end skinned poses and check
 * independent quarter poses. Under this explicit source-verified LBS model,
 * |p'(t)| <= |deltaRadians| hypot(B,C), so every position in 0..1 lies within
 * nearest 5-sample coordinate box inflated by that bound * 1/8.
 *
 * This is NOT safe for arbitrary animation, multiple moving joints, morphs,
 * dual-quaternion/cloth sim, corrected skinning or unverified paths. It is
 * NOT a fitted 3D garment, a complete original anatomical face audit, an
 * approved photo mask or sewn fabric motion.
 */
import {classifyExactTriangleContact} from './full-indexed-contact-calibration89.mjs';

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const vec=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
const tri=t=>Array.isArray(t)&&t.length===3&&t.every(vec);
const safe=n=>Number.isSafeInteger(n)&&n>0;
const timeGrid=[0,.25,.5,.75,1];
const block=(decision,rest={})=>({
 decision,...rest,fullOriginalIndexedScopeEvaluated:false,
 originalFullSurfaceMotionContactCertified:false,
 physicalFitCertified:false,originalPhotoFabricDrapeCertified:false,
 sourcePhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 familyAlpha:'HOLD'
});
const union=(a,b)=>({
 min:a.min.map((x,k)=>Math.min(x,b.min[k])),
 max:a.max.map((x,k)=>Math.max(x,b.max[k]))
});
const overlap=(a,b)=>a.min.every((x,k)=>x<=b.max[k]&&b.min[k]<=a.max[k]);

/**
 * Original true-coordinate rig witnesses must be checked by original licensed glb/photo
 * browser harness. Mere input assertion can NEVER certify an original rig.
 */
export function evaluateFixedAxisLbsRotationalEnvelope({
 frontPoseFaces,bodyPoseFaces,totalOriginalFrontFaces=null,
 totalOriginalBodyFaces=null,angleDeltaRadians,
 model='single-fixed-axis-lbs-joint',
 maxCandidatePairs=10000,sourceWitness=null
}={}){
 if(![frontPoseFaces,bodyPoseFaces].every(a=>Array.isArray(a)&&a.length===5)||
  !safe(maxCandidatePairs)||!finite(angleDeltaRadians)||
  Math.abs(angleDeltaRadians)<.02||Math.abs(angleDeltaRadians)>Math.PI/2)
  throw Error('single-joint-sweep-input-or-budget-invalid');
 const nFront=frontPoseFaces[0]?.length,nBody=bodyPoseFaces[0]?.length;
 if(!safe(nFront)||!safe(nBody)||nFront>4096||nBody>8192||
  [...frontPoseFaces].some(s=>!Array.isArray(s)||s.length!==nFront)||
  [...bodyPoseFaces].some(s=>!Array.isArray(s)||s.length!==nBody)||
  [...frontPoseFaces,...bodyPoseFaces].some(s=>!s.every(tri)))
  throw Error('single-joint-sweep-original-face-arrays-invalid');
 if(model!=='single-fixed-axis-lbs-joint')
  return block('BLOCKED_NON_SINGLE_JOINT_MOTION_MODEL',{model});
 const frontComplete=totalOriginalFrontFaces===nFront,
  bodyComplete=totalOriginalBodyFaces===nBody;
 const originalSourceAuthenticated=Boolean(
  sourceWitness?.realOriginalRigSHA256&&
  /^[0-9a-f]{64}$/.test(sourceWitness.realOriginalRigSHA256)&&
  sourceWitness?.originalSourceJPEG_SHA256&&
  /^[0-9a-f]{64}$/.test(sourceWitness.originalSourceJPEG_SHA256)&&
  sourceWitness?.actualRigBoneCount===163&&
  sourceWitness?.singleNamedMovingBone==='spine04'&&
  sourceWitness?.originalSourceSkinnedMesh===true&&
  sourceWitness?.allOtherBoneLocalPosesUnchanged===true&&
  sourceWitness?.originalRigAndSourceBuffersUnchanged===true);
 const eps=1e-4; // rig units; explicitly included in all bounds
 const angle=angleDeltaRadians,half=angle/2;
 const u=Math.cos(half)-1,v=Math.sin(half),
  w=Math.cos(angle)-1,x=Math.sin(angle),det=u*x-w*v;
 if(!finite(det)||Math.abs(det)<1e-9)
  return block('BLOCKED_UNSTABLE_ROTATION_COEFFICIENTS');
 let maxResidual=0,maxInflation=0;
 const boxesFor=(poses,n)=>{
  const boxes=[];
  for(let i=0;i<n;i++){
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let j=0;j<3;j++)for(let k=0;k<3;k++){
    const p=poses.map(s=>s[i][j][k]),
     dMid=p[2]-p[0],dEnd=p[4]-p[0],
     B=(dMid*x-dEnd*v)/det,
     C=(u*dEnd-w*dMid)/det;
    if(!finite(B)||!finite(C))throw Error('sweep-rotation-coefficients-nonfinite');
    for(const sample of [1,3]){
     const t=timeGrid[sample];
     const predicted=p[0]+B*(Math.cos(angle*t)-1)+C*Math.sin(angle*t);
     maxResidual=Math.max(maxResidual,Math.abs(predicted-p[sample]));
    }
    const inflation=Math.abs(angle)*Math.hypot(B,C)/8+eps;
    if(!finite(inflation))throw Error('sweep-rotation-bound-nonfinite');
    maxInflation=Math.max(maxInflation,inflation);
    min[k]=Math.min(min[k],...p)-inflation;
    max[k]=Math.max(max[k],...p)+inflation;
   }
   boxes.push({min,max});
  }
  return boxes;
 };
 const fboxes=boxesFor(frontPoseFaces,nFront),
  bboxes=boxesFor(bodyPoseFaces,nBody);
 const info={sampledOriginalFrontFaces:nFront,sampledOriginalBodyFaces:nBody,
  reportedOriginalFrontFaceCount:totalOriginalFrontFaces,
  reportedOriginalBodyFaceCount:totalOriginalBodyFaces,
  allOriginalFrontFacesSubmitted:frontComplete,
  allOriginalBodyFacesSubmitted:bodyComplete,
  sourceWitnessSelfReportedNotCryptographicallyAuthenticated:true,
  originalRigContractStructurallyChecked:originalSourceAuthenticated,
  maximumQuarterPoseHarmonicResidualRigUnits:maxResidual,
  maximumConservativePerCoordinateInflationRigUnits:maxInflation,
  mathematicallyBoundedSingleAxisLbsHypothesis:true,
  singleFixedAxisLbsKinematicsOnly:true};
 if(maxResidual>eps)
  return block('BLOCKED_NON_HARMONIC_ACTUAL_POSE_WITNESS',info);
 // BVH avoids an O(F*B) face-pair scan. Bodies must be filtered using
 // their swept **conservatively inflated** boxes, not discrete AABBs.
 const build=ids=>{
  if(ids.length<=8){
   return {box:ids.map(i=>bboxes[i]).reduce(union),ids};
  }
  const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
  for(const i of ids)for(let k=0;k<3;k++){
   low[k]=Math.min(low[k],bboxes[i].min[k]);
   high[k]=Math.max(high[k],bboxes[i].max[k]);
  }
  const extent=low.map((v,k)=>high[k]-v),
   axis=extent.indexOf(Math.max(...extent));
  ids.sort((a,b)=>(bboxes[a].min[axis]+bboxes[a].max[axis])-
   (bboxes[b].min[axis]+bboxes[b].max[axis]));
  const mid=Math.floor(ids.length/2),
   left=build(ids.slice(0,mid)),right=build(ids.slice(mid));
  return {box:union(left.box,right.box),left,right};
 };
 const bvh=build(Array.from({length:nBody},(_,i)=>i));
 let visitedNodes=0,testedCandidatePairs=0,overlappingEnvelopePairs=0,
  actualDiscreteExactPairs=0,indeterminatePairSamples=0;
 const summary=(decision,other={})=>block(decision,{
  ...info,visitedBodyBVHNodes:visitedNodes,testedCandidatePairs,
  overlappingEnvelopePairs,actualDiscreteExactPairs,
  indeterminatePairSamples,...other
 });
 for(let i=0;i<nFront;i++){
  const stack=[bvh];
  while(stack.length){
   const node=stack.pop();visitedNodes++;
   if(!overlap(fboxes[i],node.box))continue;
   if(!node.ids){stack.push(node.left,node.right);continue;}
   for(const j of node.ids){
    testedCandidatePairs++;
    if(testedCandidatePairs>maxCandidatePairs)
     return summary('BLOCKED_ROTATION_ENVELOPE_RESOURCE_LIMIT',{
      lastOriginalFrontFaceIndex:i,completeEvaluated:false
     });
    if(!overlap(fboxes[i],bboxes[j]))continue;
    overlappingEnvelopePairs++;
    for(let n=0;n<5;n++){
     const kind=classifyExactTriangleContact(
      frontPoseFaces[n][i],bodyPoseFaces[n][j]);
     actualDiscreteExactPairs++;
     if(['CROSSING','COPLANAR_OVERLAP','TOUCHING'].includes(kind))
      return summary('BLOCKED_REAL_POSE_FACE_CONTACT',{
       contactWitness:{frontFace:i,bodyFace:j,
        normalizedTime:timeGrid[n],contactClass:kind},
       completeEvaluated:false
      });
     if(kind==='INDETERMINATE')indeterminatePairSamples++;
    }
   }
  }
 }
 if(overlappingEnvelopePairs>0)
  return summary('BLOCKED_UNRESOLVED_ROTATIONAL_CONTACT',{
   completeEvaluated:true,
   reason:'five discrete samples cannot exclude contact between harmonic poses'
  });
 if(!frontComplete||!bodyComplete||!originalSourceAuthenticated)
  return summary('RESEARCH_ONLY_SAMPLED_ROTATIONAL_ENVELOPES_SEPARATED',{
   completeEvaluated:true,
   reason:'subset or self-reported rig source cannot certify original full surface'
  });
 return summary('RESEARCH_ONLY_COMPLETE_SUBMITTED_ROTATIONAL_ENVELOPES_SEPARATED',{
  completeEvaluated:true,
  reason:'self-reported source witness is not an independent proof of actual source or bone motion; no fit certification'
 });
}
