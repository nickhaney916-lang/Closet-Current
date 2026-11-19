/**
 * Mission 2 P89 — research-only motion, metrology and fabric mechanics.
 *
 * This is NOT an observed 3D reconstruction from an unseen garment reverse.
 * In particular a discrete skinned-bone pose is NOT evidence of the continuous
 * path between poses. A rotating skeleton must never use the linear-motion
 * clearance result without an independent enclosing motion bound.
 *
 * Genuine original front/body triangle inputs may be supplied by the licensed
 * source/rig research runner. Synthetic controls are kept separate.
 * No consumer admission, hosted data, private photographs, or network calls.
 */
import {classifyExactTriangleContact} from './full-indexed-contact-calibration89.mjs';

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const positive=n=>finite(n)&&n>0;
const safeLimit=n=>Number.isSafeInteger(n)&&n>0;
const v3=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
const triangle=t=>Array.isArray(t)&&t.length===3&&t.every(v3);
const sha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/i.test(s);
const boxFor=(a,b)=>{
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const t of [a,b])for(const p of t)for(let k=0;k<3;k++){
  min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);
 }
 return {min,max};
};
const overlaps=(a,b)=>a.min.every((x,i)=>x<=b.max[i]&&b.min[i]<=a.max[i]);
const lerpTri=(a,b,t)=>a.map((p,i)=>p.map((x,k)=>x+(b[i][k]-x)*t));
const union=(a,b)=>({
 min:a.min.map((x,i)=>Math.min(x,b.min[i])),
 max:a.max.map((x,i)=>Math.max(x,b.max[i]))
});
function buildBVH(boxes,indices){
 if(indices.length<=12){
  return {box:indices.map(i=>boxes[i]).reduce(union),indices};
 }
 // Iterate instead of spreading the full original 109k+ body face array:
 // large spread calls can exceed native JavaScript argument limits.
 const lower=[Infinity,Infinity,Infinity],upper=[-Infinity,-Infinity,-Infinity];
 for(const i of indices)for(let k=0;k<3;k++){
  lower[k]=Math.min(lower[k],boxes[i].min[k]);
  upper[k]=Math.max(upper[k],boxes[i].max[k]);
 }
 const extent=lower.map((x,k)=>upper[k]-x);
 const axis=extent.indexOf(Math.max(...extent));
 const sorted=indices.slice().sort((i,j)=>
  (boxes[i].min[axis]+boxes[i].max[axis])-
  (boxes[j].min[axis]+boxes[j].max[axis]));
 const middle=Math.floor(sorted.length/2);
 const left=buildBVH(boxes,sorted.slice(0,middle));
 const right=buildBVH(boxes,sorted.slice(middle));
 return {box:union(left.box,right.box),left,right};
}
const safety=(decision,more={})=>({
 decision,...more,consumer3DAdmitted:false,
 originalPhoto2DFallbackRequired:true,physicallyCalibratedFit:false,
 realisticDrapeCertified:false,familyAlpha:'HOLD'
});

/**
 * Conservative full indexed *linear-vertex* motion broadphase, backed by
 * source/body genuine face-pair exact sampled narrowphase. A non-contact
 * result requires EVERY possible moving pair's swept boxes to be separated.
 * Swept AABB overlap without an exact sampled contact stays BLOCKED.
 *
 * Sampled intermediate contact is a real contact for a LINEAR trajectory,
 * but missing a hit at finite sample times is NEVER proof of clearance.
 * Rotating bone trajectories cannot be treated as linear vertex movement.
 */
export function evaluateSweptIndexedContact({
 frontStart,frontEnd,bodyStart,bodyEnd,
 motionModel='unbounded-bone-rotation',maxPairs=250000,
 sampleTimes=[0,.25,.5,.75,1]
}={}){
 if(![frontStart,frontEnd,bodyStart,bodyEnd].every(Array.isArray)||
  !frontStart?.length||!bodyStart?.length||
  frontStart.length!==frontEnd.length||bodyStart.length!==bodyEnd.length||
  frontStart.length>150000||bodyStart.length>150000||
  ![...frontStart,...frontEnd,...bodyStart,...bodyEnd].every(triangle))
  throw Error('original-swept-indexed-faces-invalid');
 if(!safeLimit(maxPairs)||!Array.isArray(sampleTimes)||
  sampleTimes.length<3||sampleTimes.length>65||
  !sampleTimes.every(t=>finite(t)&&t>=0&&t<=1)||
  sampleTimes[0]!==0||sampleTimes.at(-1)!==1||
  sampleTimes.some((t,i)=>i&&t<=sampleTimes[i-1]))
  throw Error('swept-contact-budget-or-sample-grid-invalid');
 if(motionModel!=='linear-vertex')
  return safety('BLOCKED_MOTION_BOUND_UNPROVEN',{
   originalSourceFrontIndexedFaces:frontStart.length,
   originalBodyIndexedFaces:bodyStart.length,
   motionModel,reason:'rotating bones/fabric can deviate between endpoint vertices'
  });
 const frontBoxes=frontStart.map((t,i)=>boxFor(t,frontEnd[i]));
 const bodyBoxes=bodyStart.map((t,i)=>boxFor(t,bodyEnd[i]));
 const root=buildBVH(bodyBoxes,bodyBoxes.map((_,i)=>i));
 let candidatePairs=0,overlapPairs=0,exactSampleTests=0,nodeVisits=0;
 const receipt=(decision,extra={})=>safety(decision,{
  originalSourceFrontIndexedFaces:frontStart.length,
  originalBodyIndexedFaces:bodyStart.length,
  conservativeLinearSweptBounds:true,
  fullIndexedFaceArraysPresented:true,
  broadphaseCandidatePairs:candidatePairs,
  sweptOverlappingTrianglePairs:overlapPairs,
  exactTemporalSamplesEvaluated:exactSampleTests,
  visitedBVHNodes:nodeVisits,
  ...extra
 });
 for(let f=0;f<frontStart.length;f++){
  const stack=[root],fb=frontBoxes[f];
  while(stack.length){
   const n=stack.pop();nodeVisits++;
   if(!overlaps(fb,n.box))continue;
   if(!n.indices){stack.push(n.left,n.right);continue;}
   for(const b of n.indices){
    candidatePairs++;
    if(candidatePairs>maxPairs)
     return receipt('BLOCKED_SWEPT_RESOURCE_LIMIT',{
      lastFrontIndex:f,fullPairEnumeration:false
     });
    if(!overlaps(fb,bodyBoxes[b]))continue;
    overlapPairs++;
    for(const t of sampleTimes){
     const a=lerpTri(frontStart[f],frontEnd[f],t);
     const body=lerpTri(bodyStart[b],bodyEnd[b],t);
     const kind=classifyExactTriangleContact(a,body);
     exactSampleTests++;
     if(['CROSSING','COPLANAR_OVERLAP','TOUCHING'].includes(kind))
      return receipt('BLOCKED_OBSERVED_SWEPT_CONTACT',{
       witness:{frontFace:f,bodyFace:b,t,contactClass:kind},
       fullPairEnumeration:false
      });
    }
   }
  }
 }
 if(overlapPairs>0)
  return receipt('BLOCKED_UNRESOLVED_INTER_SAMPLE_CONTACT',{
   fullPairEnumeration:true,
   reason:'swept volumes overlap; finite temporal sampling cannot certify clearance'
  });
 return receipt('CLEAR_LINEAR_SWEPT_BOXES_ONLY',{
  fullPairEnumeration:true,
  reason:'valid only for the explicitly supplied linear-vertex trajectory'
 });
}

export function assessPhysicalFitEvidence(input={}){
 const missing=[];
 const need=(name,valid)=>{if(!valid)missing.push(name);};
 const ref=input.physicalReference||{}, camera=input.camera||{},
  body=input.wearerMeasurements||{}, garment=input.garmentMeasurements||{},
  material=input.materialMeasurements||{};
 need('originalPhotoSHA256',sha(input.originalPhotoSHA256));
 need('approvedOriginalFrontMask',input.approvedOriginalFrontMask===true);
 need('humanReviewedSourceMask',input.humanReviewedSourceMask===true);
 need('observedOriginalReverse',input.observedOriginalReverse===true);
 need('photoAlignedPhysicalReference',positive(ref.spanPixels)&&
  positive(ref.spanMm)&&
   sha(input.originalPhotoSHA256)&&ref.sourcePhotoSHA256===input.originalPhotoSHA256&&
  ref.sameGarmentPlane===true);
 need('cameraIntrinsicExtrinsicEvidence',positive(camera.focalLengthPixels)&&
  positive(camera.distanceMm)&&camera.opticalAxisReviewed===true);
 need('calibratedWearerBodyScale',body.scaleMeasured===true&&
  positive(body.chestCircumferenceMm)&&
  finite(body.chestUncertaintyMm)&&body.chestUncertaintyMm>=0);
 need('independentlyMeasuredGarmentChest',positive(garment.chestCircumferenceMm)&&
  finite(garment.chestUncertaintyMm)&&garment.chestUncertaintyMm>=0);
 need('testedOriginalFabricSpecimen',material.independentlyMeasured===true&&
  positive(material.arealDensityKgM2)&&
  positive(material.stretchStiffnessNPerM)&&
  positive(material.bendingStiffnessNm));
 const measuredScaleMmPerPixel=
  positive(ref.spanPixels)&&positive(ref.spanMm)&&
   sha(input.originalPhotoSHA256)&&
  ref.sourcePhotoSHA256===input.originalPhotoSHA256&&
  ref.sameGarmentPlane===true?ref.spanMm/ref.spanPixels:null;
 const minimumChestEaseMm=
  positive(body.chestCircumferenceMm)&&
  positive(garment.chestCircumferenceMm)&&
  finite(body.chestUncertaintyMm)&&body.chestUncertaintyMm>=0&&
  finite(garment.chestUncertaintyMm)&&garment.chestUncertaintyMm>=0?
  garment.chestCircumferenceMm-body.chestCircumferenceMm-
   body.chestUncertaintyMm-garment.chestUncertaintyMm:null;
 return {
  evidenceStatus:missing.length?'BLOCKED_MISSING_PHYSICAL_EVIDENCE':
   'MEASUREMENTS_PRESENT_NOT_INDEPENDENTLY_ATTESTED',
  missingEvidence:missing,
  measuredReferenceScaleMmPerPixel:measuredScaleMmPerPixel,
  conservativeMinimumChestEaseMm:minimumChestEaseMm,
  chestDimensionalConflict:minimumChestEaseMm!==null&&minimumChestEaseMm<=0,
  // No receipt/flag supplied by a fixture can substitute for real signed
  // calibration, approved mask, garment back, wearer fit and blind review.
  originalPhotoToWearable3DCalibrated:false,
  independentCalibrationAcceptancePerformed:false,
  physicalFitCertified:false,consumer3DAdmitted:false,
  originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 };
}

/**
 * Small, explicitly research-only gravity/strain prototype. The patch is
 * rectangular, front-surface-only, and pinned along one edge, with
 * position-based structural/shear/bending constraints in SI units.
 * Optional sphere-vertex proxy contact is NOT real anatomical collision;
 * no face/edge sweep, seams, friction, layering or observed reverse exists.
 * Material values must be independently measured before representing source.
 */
export function simulateResearchFabricPatch({
 widthM=.6,depthM=.6,columns=7,rows=7,
 arealDensityKgM2=.25,stretchStiffnessNPerM=650,
 bendingStiffnessNm=.05,dampingRatio=.025,
 gravityMS2=9.81,dtSeconds=1/120,steps=120,iterations=10,
 collisionSphere=null
}={}){
 if(collisionSphere!==null&&(
  !Array.isArray(collisionSphere.centerM)||
  collisionSphere.centerM.length!==3||
  !collisionSphere.centerM.every(finite)||
  !positive(collisionSphere.radiusM)||
  !finite(collisionSphere.clearanceM??0)||
  (collisionSphere.clearanceM??0)<0))
  throw Error('fabric-proxy-collider-invalid');
 if(![widthM,depthM,arealDensityKgM2,stretchStiffnessNPerM,
  bendingStiffnessNm,dtSeconds].every(positive)||
  ![columns,rows,steps,iterations].every(Number.isSafeInteger)||
  columns<2||rows<2||columns>20||rows>20||
  steps<1||steps>600||iterations<1||iterations>30||
  !finite(gravityMS2)||gravityMS2<0||gravityMS2>30||
  !finite(dampingRatio)||dampingRatio<0||dampingRatio>=1||
  dtSeconds>1/30)
  throw Error('fabric-physics-parameters-invalid');
 const n=columns*rows,points=[],prev=[];
 const index=(x,y)=>y*columns+x;
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
  const p=[widthM*x/(columns-1),1.2,depthM*y/(rows-1)];
  points.push(p);prev.push(p.slice());
 }
 const mass=arealDensityKgM2*widthM*depthM/n,
  invMass=1/mass,links=[],
  cellLengthM=Math.min(widthM/(columns-1),depthM/(rows-1)),
  // Approximate conversion: Nm bending coefficient to N/m distance
  // constraint via squared local grid spacing, NOT a shell-element solver.
  approximateBendingSpringNPerM=bendingStiffnessNm/(cellLengthM*cellLengthM);
 let proxyVertexCorrections=0;
 const add=(i,j,k)=>{
  const a=points[i],b=points[j];
  links.push({i,j,k,rest:Math.hypot(...a.map((v,c)=>v-b[c]))});
 };
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
  const i=index(x,y);
  if(x+1<columns)add(i,index(x+1,y),stretchStiffnessNPerM);
  if(y+1<rows)add(i,index(x,y+1),stretchStiffnessNPerM);
  if(x+1<columns&&y+1<rows){
   add(i,index(x+1,y+1),stretchStiffnessNPerM*.45);
   add(index(x+1,y),index(x,y+1),stretchStiffnessNPerM*.45);
  }
  if(x+2<columns)add(i,index(x+2,y),approximateBendingSpringNPerM);
  if(y+2<rows)add(i,index(x,y+2),approximateBendingSpringNPerM);
 }
 const pinned=i=>i<columns;
 for(let step=0;step<steps;step++){
  for(let i=columns;i<n;i++){
   const p=points[i],old=prev[i],last=p.slice();
   for(let k=0;k<3;k++)
    p[k]+=(p[k]-old[k])*(1-dampingRatio)+
     (k===1?-gravityMS2*dtSeconds*dtSeconds:0);
   prev[i]=last;
  }
  for(let it=0;it<iterations;it++)for(const e of links){
   const a=points[e.i],b=points[e.j],d=b.map((v,k)=>v-a[k]),
    length=Math.hypot(...d);
   if(length<1e-12)continue;
   const wa=pinned(e.i)?0:invMass,wb=pinned(e.j)?0:invMass;
   const compliance=1/(e.k*dtSeconds*dtSeconds),
    correction=(length-e.rest)/(wa+wb+compliance)/length;
   for(let k=0;k<3;k++){
    a[k]+=wa*correction*d[k];
    b[k]-=wb*correction*d[k];
   }
  }
  // Optional vertex-to-sphere projection AFTER mechanical constraints.
  // Geometry/face penetration remains UNKNOWN: not real anatomy or drape.
  if(collisionSphere){
   const center=collisionSphere.centerM,
    target=collisionSphere.radiusM+(collisionSphere.clearanceM??0);
   for(let i=columns;i<n;i++){
    const p=points[i],delta=p.map((v,k)=>v-center[k]),
     distance=Math.hypot(...delta);
    if(distance>=target)continue;
    const unit=distance>1e-9?delta.map(v=>v/distance):[0,1,0];
    for(let k=0;k<3;k++)p[k]=center[k]+unit[k]*target;
    proxyVertexCorrections++;
   }
  }
  if(!points.every(p=>p.every(finite)))throw Error('fabric-simulation-diverged');
 }
 let maxStructuralStrain=0;
 for(const e of links){
  if(e.k!==stretchStiffnessNPerM)continue;
  const len=Math.hypot(...points[e.i].map((v,k)=>v-points[e.j][k]));
  maxStructuralStrain=Math.max(maxStructuralStrain,Math.abs(len-e.rest)/e.rest);
 }
 return {
  positionsM:points,originalTopPinHeightM:1.2,
  minHeightM:Math.min(...points.map(p=>p[1])),
  maximumStructuralStrain:maxStructuralStrain,
  pinnedEdgeUnchanged:points.slice(0,columns).every(p=>p[1]===1.2),
  patchFaceCount:(columns-1)*(rows-1)*2,
  approximateBendingSpringNPerM,
  proxySphereVertexCorrections:proxyVertexCorrections,
  proxySphereVertexOnlyConstraint:collisionSphere!==null,
  originalBodyTriangleContactsProved:false,
  simulatedSteps:steps,simulatedTimeSeconds:steps*dtSeconds,
  materialParameterUnits:'kg/m2;N/m;Nm;seconds;meters',
  referenceMaterialMeasurementsVerified:false,
  avatarCollisionConstraintsIntegrated:false,
  observedRearOrSewnSeams:false,
  originalPhotoSourceFabricBehaviorCertified:false,
  realisticDrapeCertified:false,consumer3DAdmitted:false,
  originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 };
}
