/**
 * M2 original rectangular two-joint envelope first-witness diagnostic.
 *
 * A conservative swept AABB overlap across an ENTIRE two-dimensional angle
 * region is not an observed triangle crossing. This deliberately inspects
 * ONLY the first reported original indexed source/body face pair at four
 * genuine original grid corners and one independently measured original
 * cell-center skinned pose. It never clears other faces, angles, garment fit,
 * unobserved reverse, original image segmentation or wearer calibration.
 *
 * The caller MUST separately establish genuine source JPEG, rig GLB, live
 * original 163-bone skinning, original vertex buffer and account authority.
 * Pure JS cannot authenticate self-asserted "original" arrays or SHA strings.
 */
import {classifyExactTriangleContact} from
 './full-indexed-contact-calibration89.mjs';

const isInt=v=>Number.isSafeInteger(v)&&v>=0;
const valid=(p,n)=>p?.length===n&&Array.from(p).every(Number.isFinite);
const stop=(decision,details={})=>({
 decision,...details,
 actualPhysicalGarmentBodyFitCertified:false,
 fullOriginalRectangularSweepContactResolved:false,
 frontAndBodyFullFaceActualContactSampled:false,
 sourceOriginalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,familyAlpha:'HOLD'
});
const centers=[
 {anglesDeg:[-3,-6],kind:'path',index:1},
 {anglesDeg:[-3,6],kind:'holdout',index:0},
 {anglesDeg:[3,-6],kind:'holdout',index:1},
 {anglesDeg:[3,6],kind:'path',index:3}
];
const corners=[
 [0,1,3,4],[1,2,4,5],[3,4,6,7],[4,5,7,8]
];
const gridAngles=[-6,0,6].flatMap(a=>[-12,0,12].map(b=>[a,b]));
function triangle(positions,indices,index){
 const out=[];
 for(let k=0;k<3;k++){
  const i=indices[3*index+k]*3;
  out.push([positions[i],positions[i+1],positions[i+2]]);
 }
 return out;
}
function lowerBound(a,b){
 const minA=[Infinity,Infinity,Infinity],maxA=[-Infinity,-Infinity,-Infinity],
  minB=[Infinity,Infinity,Infinity],maxB=[-Infinity,-Infinity,-Infinity];
 for(const p of a)for(let i=0;i<3;i++){
  minA[i]=Math.min(minA[i],p[i]);maxA[i]=Math.max(maxA[i],p[i]);
 }
 for(const p of b)for(let i=0;i<3;i++){
  minB[i]=Math.min(minB[i],p[i]);maxB[i]=Math.max(maxB[i],p[i]);
 }
 return Math.hypot(...[0,1,2].map(i=>
  Math.max(0,minA[i]-maxB[i],minB[i]-maxA[i])));
}
export function triageOriginalTwoAngleRectangleFirstWitness({
 rectangleAudit,frontGridPoses,bodyGridPoses,
 frontPathPoses,bodyPathPoses,independentOffDiagonalHoldouts,
 frontIndices,bodyIndices,expectedFrontFaces,expectedBodyFaces
}={}){
 const a=rectangleAudit;
 if(a?.decision!==
   'BLOCKED_UNRESOLVED_ORIGINAL_TWO_ANGLE_RECTANGLE_ENVELOPE_OVERLAP'||
  a.entireTwoAngleRectangleIncluded!==true||a.cells!==4||
  a.consumer3DAdmitted!==false||a.familyAlpha!=='HOLD')
  return stop('BLOCKED_UNSUPPORTED_OR_UNVERIFIED_RECTANGLE_VERDICT');
 const wf=a.originalWitness?.frontFace,wb=a.originalWitness?.bodyFace,
  cell=a.originalWitness?.cell;
 if(!isInt(wf)||!isInt(wb)||!isInt(cell)||cell>=4||
  !isInt(expectedFrontFaces)||!isInt(expectedBodyFaces)||
  expectedFrontFaces===0||expectedBodyFaces===0||
  wf>=expectedFrontFaces||wb>=expectedBodyFaces||
  a.originalFullFrontFaces!==expectedFrontFaces||
  a.originalFullBodyFaces!==expectedBodyFaces||
  frontIndices?.length!==3*expectedFrontFaces||
  bodyIndices?.length!==3*expectedBodyFaces)
  return stop('BLOCKED_MALFORMED_ORIGINAL_CONTACT_WITNESS');
 const grids=[frontGridPoses,bodyGridPoses],
  paths=[frontPathPoses,bodyPathPoses];
 if(!grids.every(g=>Array.isArray(g)&&g.length===9&&
  g[0]?.length>0&&g[0].length%3===0&&
  g.every(p=>p?.length===g[0].length))||
  !paths.every((p,i)=>Array.isArray(p)&&p.length===5&&
   p.every(v=>v?.length===grids[i][0].length))||
  !Array.isArray(independentOffDiagonalHoldouts)||
  independentOffDiagonalHoldouts.length!==2||
  independentOffDiagonalHoldouts.some((h,i)=>
   !Array.isArray(h?.anglesDeg)||h.anglesDeg.length!==2||
   h.anglesDeg[0]!==[-3,3][i]||
   h.anglesDeg[1]!==[6,-6][i]||
   h.frontVertices?.length!==frontGridPoses[0].length||
   h.bodyVertices?.length!==bodyGridPoses[0].length))
  return stop('BLOCKED_INCONSISTENT_ORIGINAL_POSE_DATA');
 const vertices=[frontGridPoses[0].length/3,bodyGridPoses[0].length/3];
 for(const [indices,count] of [[frontIndices,vertices[0]],[bodyIndices,vertices[1]]])
  for(const v of indices)
   if(!isInt(v)||v>=count)
    return stop('BLOCKED_ORIGINAL_FACE_INDEX_OUT_OF_RANGE');
 const frontCenter=centers[cell].kind==='path'?
  frontPathPoses[centers[cell].index]:
  independentOffDiagonalHoldouts[centers[cell].index].frontVertices;
 const bodyCenter=centers[cell].kind==='path'?
  bodyPathPoses[centers[cell].index]:
  independentOffDiagonalHoldouts[centers[cell].index].bodyVertices;
 const snapshots=[
  ...corners[cell].map(index=>({
   anglesDeg:gridAngles[index],kind:'actual-original-grid-corner',
   front:frontGridPoses[index],body:bodyGridPoses[index]
  })),
  {anglesDeg:centers[cell].anglesDeg,
   kind:'actual-original-independent-cell-center',
   front:frontCenter,body:bodyCenter}
 ];
 const samples=[];
 for(const pose of snapshots){
  const front=triangle(pose.front,frontIndices,wf),
   body=triangle(pose.body,bodyIndices,wb);
  if(!front.flat().every(Number.isFinite)||
    !body.flat().every(Number.isFinite))
   return stop('BLOCKED_NONFINITE_ORIGINAL_WITNESS_TRIANGLE');
  const cls=classifyExactTriangleContact(front,body),
   boxGap=lowerBound(front,body);
  if(!Number.isFinite(boxGap))
   return stop('BLOCKED_NONFINITE_ORIGINAL_WITNESS_DISTANCE_BOUND');
  samples.push({anglesDeg:pose.anglesDeg,
   poseKind:pose.kind,contactClass:cls,
   originalTriangleAABBDistanceLowerBoundRigUnits:boxGap});
 }
 const contacts=samples.filter(p=>['CROSSING','TOUCHING','COPLANAR_OVERLAP'].includes(p.contactClass));
 const indeterminate=samples.filter(p=>p.contactClass==='INDETERMINATE');
 const common={
  sourceWitnessRequiresIndependentCallerAuthentication:true,
  originalFrontIndexedFace:wf,originalBodyIndexedFace:wb,
  rectangleCell:cell,sourcePoseSamples:5,
  actualOriginalGridCornersExamined:4,
  actualOriginalIndependentCellCentersExamined:1,
  genuineOriginalIndexedFacePairsExamined:1,
  observedExactTriangleContactsAtSampledPoses:contacts.length,
  indeterminateOriginalPoseContactClassifications:indeterminate.length,
  firstWitnessSampledOriginalPoseContacts:samples,
  otherOriginalFacePairsUnauditedByThisDiagnostic:true,
  unsampledContinuousTwoAngleMotionUnresolved:true,
  originalGarmentFrontNotPhysicallyCalibrated:true
 };
 if(indeterminate.length)return stop('BLOCKED_INDETERMINATE_ORIGINAL_SAMPLED_TRIANGLE',common);
 if(contacts.length)return stop('BLOCKED_ACTUAL_ORIGINAL_RECTANGLE_SAMPLE_TRIANGLE_CONTACT',common);
 return stop('BLOCKED_RECTANGLE_CONTINUOUS_BETWEEN_OR_OTHER_FACE_CONTACT_UNKNOWN',common);
}
