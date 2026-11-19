/**
 * Mission 2 all-indexed ORIGINAL PHOTO FRONT / licensed CC0 anatomical BODY:
 * fixed-axis spine04 research-only conservative continuous angular broadphase.
 * Source coordinates and geometry MUST be independently SHA-verified by
 * original native browser owner; this pure module cannot authenticate input.
 *
 * For one rotating LBS bone with otherwise fixed original local transforms:
 * p(t)=p(0)+B(cos(d*t)-1)+C sin(d*t).
 * Every vertex coordinate is enclosed by all 5 true quarter-angle positions
 * inflated by |d|*hypot(B,C)/8 + numeric margin. A face's three vertex boxes
 * enclose its whole angular trajectory, independently of triangle sampling.
 *
 * All supplied original garment-front and body indexed triangles are inserted
 * into conservative swept-box BVH. True 5-pose narrowphase can reject direct
 * contacts. Inter-sample envelope overlap/finite budgets ALWAYS BLOCK.
 *
 * NEVER interprets floating research front, missing camera metric, unknown
 * reverse, unapproved alpha or absence of material measurements as fitted 3D.
 */
import {classifyExactTriangleContact} from './full-indexed-contact-calibration89.mjs';

const safe=n=>Number.isSafeInteger(n)&&n>0;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const forbid=(decision,other={})=>({
 decision,...other,realOriginalBodyClothFitCertified:false,
 physicallyCalibratedSourceFit:false,fullOriginalPhysicalCollisionCertified:false,
 originalFabricDrapeCertified:false,sourceOriginalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,familyAlpha:'HOLD'
});
const times=[0,.25,.5,.75,1];
const validPoses=(poses)=>{
 if(!Array.isArray(poses)||poses.length!==5)return false;
 const n=poses[0]?.length;
 return safe(n)&&n%3===0&&poses.every(x=>x&&x.length===n);
};
const hit=(a,ia,b,ib)=>a[ia]<=b[ib+3]&&b[ib]<=a[ia+3]&&
 a[ia+1]<=b[ib+4]&&b[ib+1]<=a[ia+4]&&
 a[ia+2]<=b[ib+5]&&b[ib+2]<=a[ia+5];
const addBound=(target,to,source,from)=>{
 for(let k=0;k<3;k++){
  target[to+k]=Math.min(target[to+k],source[from+k]);
  target[to+k+3]=Math.max(target[to+k+3],source[from+k+3]);
 }
};
const point=(poses,indices,i,step)=>[
 poses[step][indices[3*i]*3],poses[step][indices[3*i]*3+1],poses[step][indices[3*i]*3+2]
];
function faceTriangle(poses,indices,i,step){
 const arr=poses[step],base=i*3,out=[];
 for(let j=0;j<3;j++){
  const k=indices[base+j]*3;
  out.push([arr[k],arr[k+1],arr[k+2]]);
 }
 return out;
}
function area2(tri){
 const [a,b,c]=tri;
 const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],
  vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
 return Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);
}
/**
 * Explicit complete vertex/index data from the authentic original input,
 * not fabricated source skeleton/test fixture. All five poses required.
 */
export function evaluateAllIndexedOriginalSpine04AngularBroadphase({
 frontPoses,bodyPoses,frontIndices,bodyIndices,deltaRadians,
 expectedFrontFaces,expectedBodyFaces,
 sourceFrontDepthShiftIntervalRigUnits=[0,0],
 sourceWitness=null,kinematicModel='one-fixed-axis-LBS-joint',
 maxBodyBVHVisits=3000000,maxLeafPairTests=500000,
 maxNarrowphasePairs=60000,maxTotalFaces=200000,
 maxTotalVertices=250000
}={}){
 if(!validPoses(frontPoses)||!validPoses(bodyPoses)||
  !frontIndices||!bodyIndices||
  !safe(expectedFrontFaces)||!safe(expectedBodyFaces)||
  !finite(deltaRadians)||Math.abs(deltaRadians)<.02||
  Math.abs(deltaRadians)>Math.PI/2||
  ![maxBodyBVHVisits,maxLeafPairTests,maxNarrowphasePairs,
    maxTotalFaces,maxTotalVertices].every(safe))
  throw Error('original-all-face-angular-sweep-unsafe-input');
 // Depth candidates are ORIGINAL RIG UNITS, never physically calibrated
 // cm, and applied ONLY to temporary bounds/temporary exact-triangle copies.
 // Any unverified value/interval must BLOCK before BVH generation.
 if(!Array.isArray(sourceFrontDepthShiftIntervalRigUnits)||
  sourceFrontDepthShiftIntervalRigUnits.length!==2||
  !sourceFrontDepthShiftIntervalRigUnits.every(finite)||
  sourceFrontDepthShiftIntervalRigUnits[0]>
   sourceFrontDepthShiftIntervalRigUnits[1]||
  sourceFrontDepthShiftIntervalRigUnits.some(z=>Math.abs(z)>3.5))
  return forbid('BLOCKED_UNVERIFIED_SOURCE_DEPTH_INTERVAL');
 const [frontDepthLower,frontDepthUpper]=
  sourceFrontDepthShiftIntervalRigUnits;
 const depths=frontDepthLower===frontDepthUpper?[frontDepthLower]:
  [frontDepthLower,(frontDepthLower+frontDepthUpper)/2,frontDepthUpper];
 const nf=frontIndices.length/3,nb=bodyIndices.length/3,
  vf=frontPoses[0].length/3,vb=bodyPoses[0].length/3;
 if(!Number.isSafeInteger(nf)||!Number.isSafeInteger(nb)||
  !safe(nf)||!safe(nb)||nf+nb>maxTotalFaces||
  vf+vb>maxTotalVertices)
  return forbid('BLOCKED_ORIGINAL_ALL_FACE_CAP_OR_COUNT',{
   frontFaces:nf,bodyFaces:nb,frontVertices:vf,bodyVertices:vb
  });
 if(nf!==expectedFrontFaces||nb!==expectedBodyFaces)
  return forbid('BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_SCOPE',{
   submittedOriginalFrontIndexedFaces:nf,submittedOriginalBodyIndexedFaces:nb,
   expectedOriginalFrontIndexedFaces:expectedFrontFaces,
   expectedOriginalBodyIndexedFaces:expectedBodyFaces
  });
 if(kinematicModel!=='one-fixed-axis-LBS-joint')
  return forbid('BLOCKED_UNVERIFIED_COMPLEX_SKIN_OR_FABRIC_MOTION');
 for(const [idx,size] of [[frontIndices,vf],[bodyIndices,vb]]){
  for(const k of idx){
   if(!Number.isSafeInteger(k)||k<0||k>=size)
    return forbid('BLOCKED_ORIGINAL_VERTEX_INDEX_INVALID');
  }
 }
 const structuralWitness=sourceWitness?.actualRigBoneCount===163&&
  sourceWitness?.singleMovingNamedBone==='spine04'&&
  sourceWitness?.allOtherBoneLocalTransformsFrozen===true&&
  sourceWitness?.sourceCoordinatesReadFromOriginalPositionAttribute===true&&
  sourceWitness?.originalSourceSkinnedMesh===true&&
  /^[a-f0-9]{64}$/.test(sourceWitness?.originalJPEG_SHA256||'')&&
  /^[a-f0-9]{64}$/.test(sourceWitness?.actualLicensedRigSHA256||'');
 if(!structuralWitness)
  return forbid('BLOCKED_UNVERIFIED_ORIGINAL_SKELETON_WITNESS');
 const d=deltaRadians,half=d/2,
  u=Math.cos(half)-1,v=Math.sin(half),
  w=Math.cos(d)-1,x=Math.sin(d),det=u*x-w*v;
 if(!finite(det)||Math.abs(det)<1e-9)
  return forbid('BLOCKED_UNSTABLE_ANGULAR_COEFFICIENTS');
 let maxResidual=0,maxInflation=0,minFrontArea=Infinity,minBodyArea=Infinity,
  maxOriginalVertexCoordinate=0;
 const vertices=poses=>{
  const n=poses[0].length/3,boxes=new Float64Array(n*6);
  for(let j=0;j<n;j++)for(let k=0;k<3;k++){
   const coord=j*3+k,
    p0=poses[0][coord],pm=poses[2][coord],p1=poses[4][coord],
    dMid=pm-p0,dEnd=p1-p0,
    B=(dMid*x-dEnd*v)/det,
    C=(u*dEnd-w*dMid)/det;
   if(![B,C,p0,pm,p1].every(finite))
    return null;
   for(const sample of [1,3]){
    const observed=poses[sample][coord];
    if(!finite(observed))return null;
    const predicted=p0+B*(Math.cos(d*times[sample])-1)+
     C*Math.sin(d*times[sample]);
    const residual=Math.abs(observed-predicted);
    if(!finite(residual))return null;
    maxResidual=Math.max(maxResidual,residual);
   }
   const absoluteMax=Math.max(...poses.map(p=>Math.abs(p[coord])));
   if(!finite(absoluteMax))return null;
   maxOriginalVertexCoordinate=Math.max(maxOriginalVertexCoordinate,absoluteMax);
   // A positive rig-unit fixed safety margin also absorbs residuals and
   // floating point, and the explicit derivative term bounds all in-between
   // times for exactly one constant-axis LBS joint.
   const inflation=Math.abs(d)*Math.hypot(B,C)/8+1e-4;
   if(!finite(inflation))return null;
   maxInflation=Math.max(maxInflation,inflation);
   boxes[6*j+k]=Math.min(...poses.map(p=>p[coord]))-inflation;
   boxes[6*j+k+3]=Math.max(...poses.map(p=>p[coord]))+inflation;
  }
  return boxes;
 };
 const fVertices=vertices(frontPoses),bVertices=vertices(bodyPoses);
 if(!fVertices||!bVertices)
  return forbid('BLOCKED_NONFINITE_TRUE_ORIGINAL_VERTEX_TRAJECTORY');
 // Apply interval endpoints after constructing the ONE per-vertex angular
 // envelope. Do not add depth uncertainty at each triangle corner, and
 // do not modify original photographed source position or skin weights.
 for(let vi=0;vi<vf;vi++){
  fVertices[6*vi+2]+=frontDepthLower;
  fVertices[6*vi+5]+=frontDepthUpper;
 }
 const common={originalFrontFaceCount:nf,originalBodyFaceCount:nb,
  originalFrontVertexCount:vf,originalBodyVertexCount:vb,
  sourceWitnessSelfReportedNotIndependentAuthentication:true,
  allSubmittedOriginalFacesIndexed:true,
  entireOriginalFrontAndBodyPoseVerticesPresent:true,
  actualFivePoseAnglesDegrees:[-12,-6,0,6,12],
  maxHarmonicQuarterPoseResidualRigUnits:maxResidual,
  maxConservativeEnvelopeInflationRigUnits:maxInflation,
  maxOriginalVertexCoordinateRigUnits:maxOriginalVertexCoordinate,
  exactFiveSamplesNotContinuousNarrowphase:true,
  researchSourceFrontDepthIntervalRigUnits:[frontDepthLower,frontDepthUpper],
  depthIntervalIsUnmeasuredCounterfactual:true,
  depthOnlyOriginalSilhouetteXYAndUVUnchanged:true,
  sampledDepthPlacementsNotContinuousDepthNarrowphase:true,
  genuinePhysicalCameraScaleUnknown:true,
  originalPhotographReverseNotObserved:true};
 if(maxResidual>1e-5)
  return forbid('BLOCKED_NONHARMONIC_TRUE_ORIGINAL_VERTEX_MOTION',common);
 const sweptFaces=(indices,vertBoxes,poses,kind)=>{
  const count=indices.length/3,boxes=new Float64Array(count*6);
  let minimumOriginalDoubleArea=Infinity;
  for(let f=0;f<count;f++){
   const p=f*6;
   for(let k=0;k<3;k++){
    boxes[p+k]=Infinity;boxes[p+k+3]=-Infinity;
   }
   for(let j=0;j<3;j++){
    const i=indices[3*f+j],k=i*6;
    addBound(boxes,p,vertBoxes,k);
   }
   for(let stage=0;stage<5;stage++){
    const a=area2(faceTriangle(poses,indices,f,stage));
    if(!finite(a)||a<=1e-12)
     return {error:'BLOCKED_DEGENERATE_TRUE_ORIGINAL_'+kind+'_FACE',
      face:f,stage,area:a};
    minimumOriginalDoubleArea=Math.min(minimumOriginalDoubleArea,a);
   }
  }
  return {boxes,minimumOriginalDoubleArea};
 };
 const fs=sweptFaces(frontIndices,fVertices,frontPoses,'FRONT'),
  bs=sweptFaces(bodyIndices,bVertices,bodyPoses,'BODY');
 if(fs.error||bs.error)
  return forbid(fs.error||bs.error,{...common,
   failedFace:(fs.error?fs:bs)});
 minFrontArea=fs.minimumOriginalDoubleArea;
 minBodyArea=bs.minimumOriginalDoubleArea;
 const ninfo={...common,minimumOriginalFrontDoubleAreaRigUnitsSquared:minFrontArea,
  minimumOriginalBodyDoubleAreaRigUnitsSquared:minBodyArea};
 // Balanced median BVH over ALL actual body indexed triangles. Bounding
 // boxes enclose the full time continuum, not merely five screenshots.
 const ids=Array.from({length:nb},(_,i)=>i);
 let nodes=0,leaves=0,maxDepth=0;
 const build=(low,high,depth)=>{
  nodes++;maxDepth=Math.max(maxDepth,depth);
  const bound=new Float64Array([Infinity,Infinity,Infinity,
   -Infinity,-Infinity,-Infinity]);
  for(let j=low;j<high;j++){
   const p=ids[j]*6;
   addBound(bound,0,bs.boxes,p);
  }
  if(high-low<=12){leaves++;return {bound,low,high};}
  let axis=0;
  if(bound[4]-bound[1]>bound[3]-bound[0])axis=1;
  if(bound[5]-bound[2]>bound[axis+3]-bound[axis])axis=2;
  const segment=ids.slice(low,high);
  segment.sort((a,b)=>(
   bs.boxes[6*a+axis]+bs.boxes[6*a+axis+3])-
   (bs.boxes[6*b+axis]+bs.boxes[6*b+axis+3]));
  for(let j=0;j<segment.length;j++)ids[low+j]=segment[j];
  const mid=Math.floor((low+high)/2);
  return {bound,left:build(low,mid,depth+1),
   right:build(mid,high,depth+1)};
 };
 const root=build(0,nb,0);
 let visits=0,leafPairTests=0,envelopeOverlaps=0,
  exactSamplesTested=0,unknownExactSamples=0;
 const summary=(decision,extra={})=>forbid(decision,{
  ...ninfo,allOriginalBodyFacesPresentInSweptBVH:ids.length===nb,
  fullAllOriginalFrontAndBodyAngularBroadphaseCompleted:
   extra.complete===true,
  originalBodyBVHNodes:nodes,originalBodyBVHLeaves:leaves,
  maximumBodyBVHDepth:maxDepth,
  bodyBVHNodesVisited:visits,bodyLeafPairsChecked:leafPairTests,
  overlappingOriginalAngularEnvelopes:envelopeOverlaps,
  exactDiscreteOriginalFaceTests:exactSamplesTested,
  indeterminateDiscreteSamples:unknownExactSamples,
  ...extra
 });
 const stack=[];
 for(let fi=0;fi<nf;fi++){
  stack.length=0;stack.push(root);
  while(stack.length){
   const node=stack.pop();visits++;
   if(visits>maxBodyBVHVisits)
    return summary('BLOCKED_ANGULAR_BVH_VISIT_BUDGET',{
     lastFrontFaceIndex:fi,complete:false});
   if(!hit(fs.boxes,6*fi,node.bound,0))continue;
   if(node.left){stack.push(node.left,node.right);continue;}
   for(let j=node.low;j<node.high;j++){
    const bi=ids[j];leafPairTests++;
    if(leafPairTests>maxLeafPairTests)
     return summary('BLOCKED_ANGULAR_FACE_PAIR_BUDGET',{
      lastFrontFaceIndex:fi,complete:false});
    if(!hit(fs.boxes,6*fi,bs.boxes,6*bi))continue;
    envelopeOverlaps++;
    if(envelopeOverlaps>maxNarrowphasePairs)
     return summary('BLOCKED_ANGULAR_EXACT_SAMPLE_BUDGET',{
      lastFrontFaceIndex:fi,complete:false});
    for(let t=0;t<5;t++){
     const body=faceTriangle(bodyPoses,bodyIndices,bi,t);
     const front=faceTriangle(frontPoses,frontIndices,fi,t);
     for(const sourceShift of depths){
      // This is a TRANSFORMED COPY of the true photographed source
      // geometry, not owner-measured garment placement or mesh mutation.
      const shifted=front.map(([xx,yy,zz])=>[xx,yy,zz+sourceShift]);
      const cls=classifyExactTriangleContact(shifted,body);
      exactSamplesTested++;
      if(['CROSSING','TOUCHING','COPLANAR_OVERLAP'].includes(cls))
       return summary('BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',{
        witness:{frontFace:fi,bodyFace:bi,normalizedTime:times[t],
         sourceDepthShiftRigUnits:sourceShift,
         transformedOriginalSourceCopyOnly:true,
         contactClass:cls},complete:false});
      if(cls==='INDETERMINATE')unknownExactSamples++;
     }
    }
   }
  }
 }
 if(envelopeOverlaps)
  return summary('BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT',{
   complete:true,
   reason:'all original indexed angular and depth-uncertainty envelopes checked; possible contact between time/depth samples unresolved'
  });
 return summary('RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT',{
  complete:true,
  reason:'all original supplied front+body angular and candidate depth-interval bounds disjoint; original photo is NOT physically calibrated to be worn'
 });
}
