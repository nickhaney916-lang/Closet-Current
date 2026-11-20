/**
 * Mission 2 all-indexed ORIGINAL PHOTO FRONT / licensed CC0 anatomical BODY:
 * real 2-JOINT spine03 + spine04 simultaneous diagonal angular motion.
 * Bilinear trigonometric skinning coefficients from 3x3 true original-pose
 * angular grid, validated against independent original off-diagonal holdouts.
 * Source SHA and authentic original frozen-rig provenance validated by native
 * browser runner, NEVER by a self-asserted pure JS source witness.
 * Source coordinates and geometry MUST be independently SHA-verified by
 * original native browser owner; this pure module cannot authenticate input.
 *
 * For two original fixed-local-axis rotating LBS joints where the other
 * 161 local bones never move, each world-coordinate LBS vertex is a linear
 * combination of {1,cos(a),sin(a)} x {1,cos(b),sin(b)}. Derive nine real
 * coefficients per coordinate from a 3x3 original pose angular grid and
 * verify model at two independent original off-grid poses + quarter path
 * samples. For simultaneous a(t),b(t), a certified derivative L1 bound
 * multiplied by 1/8 bounds all times nearest to five actual time samples.
 * A vertex is inflated ONCE. All original face boxes/BVH tested conservatively.
 * Unsupported arbitrary rotations, missing independent holdouts, malformed
 * original source, uncertainty or finite budget always BLOCK.
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
export function evaluateOriginalSimultaneousSpine03Spine04AngularBroadphase({
 frontPoses,bodyPoses,frontGridPoses,bodyGridPoses,
 independentOffDiagonalHoldouts,frontIndices,bodyIndices,
 expectedFrontFaces,expectedBodyFaces,
 sourceWitness=null,kinematicModel='two-fixed-axis-LBS-joints',
 spine03AnglesDeg=[-6,0,6],spine04AnglesDeg=[-12,0,12],
 maxBodyBVHVisits=3000000,maxLeafPairTests=500000,
 maxNarrowphasePairs=60000,maxTotalFaces=200000,
 maxTotalVertices=250000
}={}){
 const validGrid=(grid,poses)=>Array.isArray(grid)&&grid.length===9&&
  grid.every(x=>x&&x.length===poses?.[0]?.length);
 const anglesOK=(values,expected)=>Array.isArray(values)&&
  values.length===3&&values.every((v,i)=>finite(v)&&
   Math.abs(v-expected[i])<1e-12);
 const holdoutsOK=Array.isArray(independentOffDiagonalHoldouts)&&
  independentOffDiagonalHoldouts.length===2&&
  independentOffDiagonalHoldouts.every((h,i)=>
   Array.isArray(h?.anglesDeg)&&h.anglesDeg.length===2&&
   Math.abs(h.anglesDeg[0]-[-3,3][i])<1e-12&&
   Math.abs(h.anglesDeg[1]-[6,-6][i])<1e-12&&
   h.frontVertices?.length===frontPoses?.[0]?.length&&
   h.bodyVertices?.length===bodyPoses?.[0]?.length);
 if(!validPoses(frontPoses)||!validPoses(bodyPoses)||
  !validGrid(frontGridPoses,frontPoses)||!validGrid(bodyGridPoses,bodyPoses)||
  !holdoutsOK||!anglesOK(spine03AnglesDeg,[-6,0,6])||
  !anglesOK(spine04AnglesDeg,[-12,0,12])||
  !frontIndices||!bodyIndices||
  !safe(expectedFrontFaces)||!safe(expectedBodyFaces)||
  ![maxBodyBVHVisits,maxLeafPairTests,maxNarrowphasePairs,
    maxTotalFaces,maxTotalVertices].every(safe))
  throw Error('original-all-face-angular-sweep-unsafe-input');
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
 if(kinematicModel!=='two-fixed-axis-LBS-joints')
  return forbid('BLOCKED_UNVERIFIED_COMPLEX_SKIN_OR_FABRIC_MOTION');
 for(const [idx,size] of [[frontIndices,vf],[bodyIndices,vb]]){
  for(const k of idx){
   if(!Number.isSafeInteger(k)||k<0||k>=size)
    return forbid('BLOCKED_ORIGINAL_VERTEX_INDEX_INVALID');
  }
 }
 const structuralWitness=sourceWitness?.actualRigBoneCount===163&&
  sourceWitness?.simultaneousMovingNamedBones?.[0]==='spine03'&&
  sourceWitness?.simultaneousMovingNamedBones?.[1]==='spine04'&&
  sourceWitness?.other161BoneLocalTransformsFrozen===true&&
  sourceWitness?.independentOriginalSourceJointPoses===true&&
  sourceWitness?.sourceCoordinatesReadFromOriginalPositionAttribute===true&&
  sourceWitness?.originalSourceSkinnedMesh===true&&
  /^[a-f0-9]{64}$/.test(sourceWitness?.originalJPEG_SHA256||'')&&
  /^[a-f0-9]{64}$/.test(sourceWitness?.actualLicensedRigSHA256||'');
 if(!structuralWitness)
  return forbid('BLOCKED_UNVERIFIED_ORIGINAL_SKELETON_WITNESS');
 const A=6*Math.PI/180,B=12*Math.PI/180,
  da=2*A,db=2*B;
 const fit=(lo,mid,hi,angle)=>{
  const sin=Math.sin(angle),cos=Math.cos(angle)-1;
  const ss=(hi-lo)/(2*sin),cc=((hi+lo)/2-mid)/cos;
  return [mid-cc,cc,ss];
 };
 const basis=a=>[1,Math.cos(a),Math.sin(a)];
 const timesAngles=t=>[(-6+12*t)*Math.PI/180,
  (-12+24*t)*Math.PI/180];
 let maxResidual=0,maxInflation=0,
  maxOriginalVertexCoordinate=0,minFrontArea=Infinity,
  minBodyArea=Infinity;
 const vertices=(grid,poses,holdoutKey)=>{
  const n=poses[0].length/3,
   boxes=new Float64Array(n*6),
   offDiagonal=independentOffDiagonalHoldouts;
  for(let coord=0;coord<poses[0].length;coord++){
   const raw=new Array(9);
   for(let q=0;q<9;q++){
    const v=grid[q][coord];
    if(!finite(v))return null;
    raw[q]=v;
   }
   // 3x3 tensor-product interpolation. Each column first decomposes the
   // spine03 local fixed-axis rotation, then each row spine04. All9
   // coefficients include cross terms such as sin(a)*sin(b).
   const alongA=Array.from({length:3},()=>new Array(3));
   for(let j=0;j<3;j++){
    const coeff=fit(raw[j],raw[3+j],raw[6+j],A);
    for(let i=0;i<3;i++)alongA[i][j]=coeff[i];
   }
   const C=new Array(9);
   for(let i=0;i<3;i++){
    const coeff=fit(alongA[i][0],alongA[i][1],alongA[i][2],B);
    for(let j=0;j<3;j++)C[i*3+j]=coeff[j];
   }
   if(!C.every(finite))return null;
   const predict=(aa,bb)=>{
    const a=basis(aa),b=basis(bb);
    let out=0;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)
     out+=C[i*3+j]*a[i]*b[j];
    return out;
   };
   for(let t=0;t<5;t++){
    const observed=poses[t][coord],
     [aa,bb]=timesAngles(times[t]);
    if(!finite(observed))return null;
    const err=Math.abs(observed-predict(aa,bb));
    if(!finite(err))return null;
    maxResidual=Math.max(maxResidual,err);
   }
   for(let q=0;q<2;q++){
    const h=offDiagonal[q],
     observed=h[holdoutKey][coord],
     predicted=predict(h.anglesDeg[0]*Math.PI/180,
      h.anglesDeg[1]*Math.PI/180);
    if(!finite(observed)||!finite(predicted))return null;
    maxResidual=Math.max(maxResidual,
     Math.abs(observed-predicted));
   }
   // Across 0<=t<=1 with a=-6°+12°t, b=-12°+24°t,
   // |dp/dt| <= |a'| SUM_{i>0,j}|Cij|+
   //           |b'| SUM_{i,j>0}|Cij|.
   // Every time is at most 1/8 from one of five true original poses.
   // This derivative bounds the full continuous SIMULTANEOUS diagonal,
   // not unobserved arbitrary 2D joint motion and not fabric deformation.
   let deriv=0;
   for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const c=Math.abs(C[i*3+j]);
    if(i>0)deriv+=da*c;
    if(j>0)deriv+=db*c;
   }
   const inflation=deriv/8+1e-4;
   if(!finite(inflation))return null;
   maxInflation=Math.max(maxInflation,inflation);
   let lo=Infinity,hi=-Infinity;
   for(let t=0;t<5;t++){
    const v=poses[t][coord];
    lo=Math.min(lo,v);hi=Math.max(hi,v);
    maxOriginalVertexCoordinate=Math.max(maxOriginalVertexCoordinate,
     Math.abs(v));
   }
   const j=Math.floor(coord/3),k=coord%3;
   boxes[j*6+k]=lo-inflation;
   boxes[j*6+k+3]=hi+inflation;
  }
  return boxes;
 };
 const fVertices=vertices(frontGridPoses,frontPoses,'frontVertices'),
  bVertices=vertices(bodyGridPoses,bodyPoses,'bodyVertices');
 if(!fVertices||!bVertices)
  return forbid('BLOCKED_NONFINITE_ORIGINAL_TWO_JOINT_GRID_OR_PATH');
 const common={
  originalFrontFaceCount:nf,originalBodyFaceCount:nb,
  originalFrontVertexCount:vf,originalBodyVertexCount:vb,
  sourceWitnessSelfReportedNotIndependentAuthentication:true,
  allSubmittedOriginalFacesIndexed:true,
  entireOriginalFrontAndBodyPoseVerticesPresent:true,
  originalGrid3x3BothActualBonesPoseBuffersPresent:true,
  originalIndependentNonDiagonalPoseHoldoutsVerified:true,
  originalMovingJoints:['spine03','spine04'],
  jointAnglesDeg:{spine03:[-6,0,6],spine04:[-12,0,12]},
  trueSimultaneousMotionPath:'spine03=-6+12t,spine04=-12+24t,0<=t<=1',
  maxTwoAngleHarmonicResidualRigUnits:maxResidual,
  maxConservativeEnvelopeInflationRigUnits:maxInflation,
  maxOriginalVertexCoordinateRigUnits:maxOriginalVertexCoordinate,
  exactFiveSamplesNotContinuousNarrowphase:true,
  arbitrary2DJointAngleRectangleAudited:false,
  genuinePhysicalCameraScaleUnknown:true,
  originalPhotographReverseNotObserved:true
 };
 if(maxResidual>1e-5)
  return forbid('BLOCKED_NONBILINEAR_TRUE_ORIGINAL_TWO_JOINT_MOTION',common);
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
  fullOriginalTwoJointSimultaneousPathSweptBroadphaseCompleted:
   extra.complete===true,
  originalBodyBVHNodes:nodes,originalBodyBVHLeaves:leaves,
  maximumBodyBVHDepth:maxDepth,
  bodyBVHNodesVisited:visits,bodyLeafPairsChecked:leafPairTests,
  overlappingOriginalSimultaneousAngularEnvelopes:envelopeOverlaps,
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
    return summary('BLOCKED_TWO_JOINT_BVH_VISIT_BUDGET',{
     lastFrontFaceIndex:fi,complete:false});
   if(!hit(fs.boxes,6*fi,node.bound,0))continue;
   if(node.left){stack.push(node.left,node.right);continue;}
   for(let j=node.low;j<node.high;j++){
    const bi=ids[j];leafPairTests++;
    if(leafPairTests>maxLeafPairTests)
     return summary('BLOCKED_TWO_JOINT_FACE_PAIR_BUDGET',{
      lastFrontFaceIndex:fi,complete:false});
    if(!hit(fs.boxes,6*fi,bs.boxes,6*bi))continue;
    envelopeOverlaps++;
    if(envelopeOverlaps>maxNarrowphasePairs)
     return summary('BLOCKED_TWO_JOINT_EXACT_SAMPLE_BUDGET',{
      lastFrontFaceIndex:fi,complete:false});
    for(let t=0;t<5;t++){
     const cls=classifyExactTriangleContact(
      faceTriangle(frontPoses,frontIndices,fi,t),
      faceTriangle(bodyPoses,bodyIndices,bi,t));
     exactSamplesTested++;
     if(['CROSSING','TOUCHING','COPLANAR_OVERLAP'].includes(cls))
      return summary('BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',{
       witness:{frontFace:fi,bodyFace:bi,normalizedTime:times[t],
        contactClass:cls},complete:false});
     if(cls==='INDETERMINATE')unknownExactSamples++;
    }
   }
  }
 }
 if(envelopeOverlaps)
  return summary('BLOCKED_UNRESOLVED_FULL_INDEXED_SIMULTANEOUS_TWO_JOINT_CONTACT',{
   complete:true,
   reason:'all original indexed angular envelopes checked but possible in-between contact unresolved'});
 return summary('RESEARCH_ONLY_FULL_INDEXED_SIMULTANEOUS_TWO_JOINT_PATH_ENVELOPES_DISJOINT',{
  complete:true,
  reason:'all original supplied front+body bounds disjoint only for two-angle simultaneous linear fixed-axis LBS and FLOATING uncalibrated photo front is NOT worn clothing'
 });
}
