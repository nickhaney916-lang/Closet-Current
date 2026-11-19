/**
 * M2 P89 independent original-photo source-front-to-genuine-anatomy
 * camera-axis ray witness. Research-only, NO measured camera calibration.
 *
 * The Met 2551406 original photo front and each original licensed skinned
 * body vertex are supplied as actual posed XYZ rig units. A bounded set
 * of original photo FRONT triangle centroids casts -Z rays onto EVERY
 * original skinned anatomy indexed face through a spatial XY broadphase.
 * If a real original photographic front + body triangle contact can be
 * produced by a single rigid depth translation WITHOUT rotation, the
 * existing FULL source/body fail-closed contact gate MUST refuse it.
 *
 * This is NOT a physical wearer registration, true garment thickness,
 * source-original back, fitted silhouette, continuous sweep or drape.
 */
import {classifyExactTriangleContact,evaluateFullIndexedContact}
 from './full-indexed-contact-calibration89.mjs';
const EPS=1e-9;
const finite=t=>Array.isArray(t)&&t.length===3&&t.every(p=>
 Array.isArray(p)&&p.length===3&&p.every(Number.isFinite));
const area=t=>{
 const a=t[0],b=t[1],c=t[2];
 const x=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);
 const y=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
 const z=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 return Math.hypot(x,y,z);
};
const midpoint=t=>[
 (t[0][0]+t[1][0]+t[2][0])/3,
 (t[0][1]+t[1][1]+t[2][1])/3,
 (t[0][2]+t[1][2]+t[2][2])/3
];
const xyBounds=t=>{
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const p of t){
  minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);
  minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);
 }
 return {minX,maxX,minY,maxY};
};
const barycentricXY=(p,t)=>{
 const a=t[0],b=t[1],c=t[2];
 const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1];
 const det=dx*ey-dy*ex;
 if(Math.abs(det)<=1e-12)return null; // original nearly edge-on
 const px=p[0]-a[0],py=p[1]-a[1];
 const v=(px*ey-py*ex)/det,w=(dx*py-dy*px)/det,u=1-v-w;
 if(u<-1e-8||v<-1e-8||w<-1e-8)return null;
 return {u,v,w,z:u*a[2]+v*b[2]+w*c[2]};
};
const readonlyFloat=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
export function cameraAxisOriginalPhotoBodyWitness(bodyFaces,frontFaces,{
 photoCentroidSamples=192,maxBackwardRigUnits=3,maxCellEntries=5000000,
 maxHitCandidates=24000,maxPairs=8000000,maxExactAABBPairs=2000000
}={}){
 if(!Array.isArray(bodyFaces)||!Array.isArray(frontFaces)||
  bodyFaces.length<128||frontFaces.length<128||
  bodyFaces.length>150000||frontFaces.length>150000)
  throw Error('full-original-real-body-and-front-face-scope-required');
 if(!Number.isSafeInteger(photoCentroidSamples)||photoCentroidSamples<8||
  photoCentroidSamples>256||!readonlyFloat(maxBackwardRigUnits,.0001,5)||
  !Number.isSafeInteger(maxCellEntries)||maxCellEntries<128||
  !Number.isSafeInteger(maxHitCandidates)||maxHitCandidates<1||
  maxHitCandidates>50000)throw Error('bounded-real-original-depth-ray-budget-required');
 // Only a POSITIVE photographic body contact is a meaningful refusal.
 // A negative sampled ray result NEVER clears the unobserved source faces.
 for(const t of bodyFaces)if(!finite(t))throw Error('nonfinite-original-body-surface');
 for(const t of frontFaces)if(!finite(t))throw Error('nonfinite-original-photo-front');
 const gridW=32,gridH=48,bodyBoxes=bodyFaces.map(xyBounds);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const b of bodyBoxes){
  minX=Math.min(minX,b.minX);maxX=Math.max(maxX,b.maxX);
  minY=Math.min(minY,b.minY);maxY=Math.max(maxY,b.maxY);
 }
 if(!(maxX-minX>1e-6&&maxY-minY>1e-6))
  throw Error('real-original-body-projected-extent-invalid');
 const stepx=(maxX-minX)/gridW,stepy=(maxY-minY)/gridH;
 const cell=(v,lo,step,n)=>Math.max(0,Math.min(n-1,
  Math.floor((v-lo)/step)));
 const grids=Array.from({length:gridW*gridH},()=>[]);
 let occupied=0;
 for(let i=0;i<bodyFaces.length;i++){
  const box=bodyBoxes[i];
  // Both lower AND upper edges use the identical global MIN origin;
  // normalizing an upper edge against MAX silently omitted all XY cells
  // except the origin and broke genuine body/photo source ray contacts.
  const xl=cell(box.minX,minX,stepx,gridW),
   xh=cell(box.maxX,minX,stepx,gridW),
   yl=cell(box.minY,minY,stepy,gridH),
   yh=cell(box.maxY,minY,stepy,gridH);
  for(let y=yl;y<=yh;y++)for(let x=xl;x<=xh;x++){
   grids[y*gridW+x].push(i);
   occupied++;
   if(occupied>maxCellEntries)
    throw Error('original-body-projection-grid-resource-limit');
  }
 }
 const chosen=new Set();
 for(let i=0;i<photoCentroidSamples;i++)
  chosen.add(Math.min(frontFaces.length-1,
   Math.floor((i+.5)*frontFaces.length/photoCentroidSamples)));
 const hits=[];let rays=0,projectedBodyCandidates=0,degeneratePhotoRays=0,
  edgeOnBodyCandidates=0;
 for(const fi of [...chosen]){
  const photo=frontFaces[fi];
  if(area(photo)<1e-12){degeneratePhotoRays++;continue;}
  const p=midpoint(photo);
  if(p[0]<minX||p[0]>maxX||p[1]<minY||p[1]>maxY)continue;
  rays++;
  const x=cell(p[0],minX,stepx,gridW),y=cell(p[1],minY,stepy,gridH);
  for(const bi of grids[y*gridW+x]){
   const box=bodyBoxes[bi];
   if(p[0]<box.minX-EPS||p[0]>box.maxX+EPS||
    p[1]<box.minY-EPS||p[1]>box.maxY+EPS)continue;
   projectedBodyCandidates++;
   const body=bodyFaces[bi],bary=barycentricXY(p,body);
   if(!bary){edgeOnBodyCandidates++;continue;}
   const dz=p[2]-bary.z;
   if(dz<0||dz>maxBackwardRigUnits)continue;
   hits.push({sourceFaceIndex:fi,originalBodyFaceIndex:bi,
    initialOriginalPhotoPointRigXYZ:p,originalBodyProjectedSurfaceZ:bary.z,
    originalBodyBarycentricXY:[bary.u,bary.v,bary.w],
    photoFrontToActualBodyDepthRigUnits:dz});
   if(hits.length>maxHitCandidates)
    return {decision:'BLOCKED_RAY_CANDIDATE_BUDGET',
     candidatesBeforeBudget:hits.length,photographicRaySamples:rays,
     sourcePhotoFacesIndexed:frontFaces.length,
     actualBodyFacesIndexed:bodyFaces.length,
     consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'};
  }
 }
 // Frontmost-first: smallest backward distance = first actual ray-to-body
 // surface in the original provisional +Z viewer orientation.
 hits.sort((a,b)=>a.photoFrontToActualBodyDepthRigUnits-
   b.photoFrontToActualBodyDepthRigUnits);
 let attempts=0,first=null;
 const maxAttempts=Math.min(hits.length,96);
 for(let h=0;h<maxAttempts;h++){
  const candidate=hits[h],front=frontFaces[candidate.sourceFaceIndex],
   body=bodyFaces[candidate.originalBodyFaceIndex];
  // Only SAME -Z depth shift for every original garment source face.
  // Tiny contact probes are dimensionless numerical perturbations only.
  for(const delta of [0,-.00002,.00002,-.0002,.0002,-.002,.002]){
   const depth=candidate.photoFrontToActualBodyDepthRigUnits+delta;
   if(depth<0||depth>maxBackwardRigUnits)continue;
   attempts++;
   const moved=front.map(p=>[p[0],p[1],p[2]-depth]);
   const classification=classifyExactTriangleContact(moved,body);
   if(['CROSSING','COPLANAR_OVERLAP','TOUCHING'].includes(classification)){
    first={...candidate,trialDepthAdjustmentRigUnits:delta,
     chosenExactDepthTranslationRigUnits:depth,
     genuineSourceBodyTriangleContact:classification};
    break;
   }
  }
  if(first)break;
 }
 const receipt={
  schema:'M2-P89-original-source-camera-axis-body-witness/RESEARCH/v1',
  sourcePhotoFacesIndexed:frontFaces.length,
  actualBodyFacesIndexed:bodyFaces.length,
  entireOriginalBodyFacesIncludedIn2DProjectionGrid:true,
  bodyProjectionGridDimensions:[gridW,gridH],
  sourceOriginalCameraDirection:[0,0,-1],
  cameraAxisDirectionAssumedNotMeasured:true,
  sampledSourceCentroidRays:chosen.size,
  actualRaysInsideOriginalBodyProjectedBoundingExtent:rays,
  originalBody2DProjectionCandidateFaces:projectedBodyCandidates,
  nearlyCameraParallelBodyFaceCandidates:edgeOnBodyCandidates,
  sourcePhotoZeroAreaRayCount:degeneratePhotoRays,
  actualRaySurfaceHitsInProvisionalRigUnits:hits.length,
  originalSelectedPhotoFace:null,
  originalSelectedBodyFace:null,
  trueOriginalContactProducedWithoutPhotoRotation:false,
  noSourcePhotoReconstructionOrReskinning:true,
  oneRigidViewerDepthTranslationAppliedToOriginalFrontOnly:true,
  temporaryCopyOnlyNoSourceOrRigMutation:true,
  noActualPhotographicCameraOrReferenceCalibration:true,
  originalPhotoFrontOnlyBackStillUnobserved:true,
  sourceOriginalGarmentSizeNotMeasured:true,
  genuineBodyClothPhysicalFitCertified:false,
  genuineContinuousMotionCollisionCertified:false,
  consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
  familyAlpha:'HOLD'
 };
 if(!first){
  const candidate=hits[0]||null;
  const inspect=candidate?{
   sourceFaceIndex:candidate.sourceFaceIndex,
   bodyFaceIndex:candidate.originalBodyFaceIndex,
   depthRigUnits:candidate.photoFrontToActualBodyDepthRigUnits,
   chosenFaceContactAtNominalDepth:classifyExactTriangleContact(
    frontFaces[candidate.sourceFaceIndex].map(p=>
     [p[0],p[1],p[2]-candidate.photoFrontToActualBodyDepthRigUnits]),
    bodyFaces[candidate.originalBodyFaceIndex])
  }:null;
  return {...receipt,decision:'BLOCKED_NO_DEPTH_ONLY_SOURCE_TO_BODY_CONTACT_WITNESS',
   testedTrueOriginalRaySurfaceCandidatePairs:attempts,
   earliestRayHitThatFailedContactConfirmation:inspect,
   trueOriginalDepthContactWitness:null};
 }
 const movedFrontFaces=frontFaces.map(t=>t.map(p=>
  [p[0],p[1],p[2]-first.chosenExactDepthTranslationRigUnits]));
 const fullOriginalGate=evaluateFullIndexedContact(bodyFaces,movedFrontFaces,{
  maxPairs,maxExactAABBPairs,stopAtFirstVerifiedContact:true,
  reportResourceBlockerInsteadOfThrow:true
 });
 if(fullOriginalGate.contactDecision!=='BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT'||
  fullOriginalGate.definitiveCollisionRejection!==true||
  fullOriginalGate.strictGeometricContactObserved!==true||
  fullOriginalGate.pairEnumerationStoppedAfterRealContact!==true||
  fullOriginalGate.fullOriginalIndexedScopeEvaluated!==false)
  throw Error('original-real-source-camera-axis-contact-not-rejected '+
   fullOriginalGate.contactDecision);
 return {...receipt,
  decision:'BLOCKED_ACTUAL_PHOTO_FRONT_ANATOMY_CAMERA_AXIS_CONTACT',
  originalSelectedPhotoFace:first.sourceFaceIndex,
  originalSelectedBodyFace:first.originalBodyFaceIndex,
  trueOriginalContactProducedWithoutPhotoRotation:true,
  testedTrueOriginalRaySurfaceCandidatePairs:attempts,
  trueOriginalDepthContactWitness:first,
  fullOriginalIndexedRealContactRefusal:fullOriginalGate
 };
}
