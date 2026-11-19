/**
 * Genuine-source P89 geometric falsification: rigidly locate one ACTUAL
 * original-photo front face onto one ACTUAL independently licensed skinned
 * anatomical body face. The same rigid transform applies to EVERY original
 * photographed-front triangle, never editing original mesh, mask, RGB, UV,
 * skin weights or GLB.
 *
 * This deliberately contact-producing pose is a NEGATIVE control, not
 * source-to-wearer registration, physical fitting, cloth solver or "true"
 * garment position. Original photo rear, camera, cloth scale remain UNKNOWN.
 */
import {classifyExactTriangleContact,evaluateFullIndexedContact}
 from './full-indexed-contact-calibration89.mjs';

const EPS=1e-10;
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(a,n)=>a.map(x=>x*n);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],
 a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=a=>Math.hypot(...a);
const centroid=t=>scale(add(add(t[0],t[1]),t[2]),1/3);
const finite=t=>Array.isArray(t)&&t.length===3&&t.every(p=>
 Array.isArray(p)&&p.length===3&&p.every(Number.isFinite));
const area=t=>length(cross(sub(t[1],t[0]),sub(t[2],t[0])));
const unit=v=>{const n=length(v);if(!(n>EPS))throw Error('actual-face-normal-degenerate');return scale(v,1/n);};
const normal=t=>unit(cross(sub(t[1],t[0]),sub(t[2],t[0])));
function quaternionBetween(a,b){
 const d=Math.max(-1,Math.min(1,dot(a,b)));
 if(d>1-1e-12)return [0,0,0,1];
 if(d<-1+1e-12){
  const pick=Math.abs(a[0])<.8?[1,0,0]:[0,1,0];
  const axis=unit(cross(a,pick));
  return [...axis,0];
 }
 const c=cross(a,b),q=[c[0],c[1],c[2],1+d],n=Math.hypot(...q);
 return q.map(x=>x/n);
}
function rotate(v,q){
 const qv=q.slice(0,3),t=scale(cross(qv,v),2);
 return add(v,add(scale(t,q[3]),cross(qv,t)));
}
export function rigidlyAnchorOriginalSourceTriangle(source,body){
 if(!finite(source)||!finite(body)||area(source)<1e-8||area(body)<1e-8)
  throw Error('real-original-source-and-body-nondegenerate-triangles-required');
 const q=quaternionBetween(normal(source),normal(body));
 const originalCenter=centroid(source),bodyCenter=centroid(body);
 const translation=sub(bodyCenter,rotate(originalCenter,q));
 const move=p=>add(rotate(p,q),translation);
 const aligned=source.map(move);
 const checked=classifyExactTriangleContact(aligned,body);
 if(checked!=='COPLANAR_OVERLAP')
  throw Error('original-source-anatomy-contact-positive-control-not-proven '+checked);
 const normalError=length(sub(normal(aligned),normal(body)));
 if(normalError>1e-6)throw Error('real-positive-original-source-normal-misaligned');
 return {quaternion:q,translation,
  sourceTriangleAreaRigUnits:area(source),
  originalBodyTriangleAreaRigUnits:area(body),
  anchoredOriginalPhotoTriangle:aligned,
  actualOriginalBodyTriangle:body,
  normalMisalignment:normalError,
  selectedActualPairContact:checked,
  rigidRotationOnlyNoSourceLocalTriangleReconstruction:true,
  noPhysicalRegistrationOrGarmentFitClaim:true,
  applyPoint:move};
}
function selectSourceFace(originalFront){
 let index=-1,best=0;
 const count=Math.min(96,originalFront.length);
 for(let i=0;i<count;i++){
  if(!finite(originalFront[i]))throw Error('nonfinite-real-original-photo-face');
  const a=area(originalFront[i]);
  if(a>best){best=a;index=i;}
 }
 if(index<0||best<1e-8)
  throw Error('original-first-ninety-six-front-faces-not-finite-and-nondegenerate');
 return index;
}
function selectOriginalAnatomicalFace(bodyFaces){
 let best=-1,bestScore=-Infinity,frontTorsoMatch=false;
 for(let i=0;i<bodyFaces.length;i++){
  const t=bodyFaces[i];
  if(!finite(t))throw Error('nonfinite-actual-original-body-face');
  const a=area(t);
  if(a<1e-8)continue;
  const c=centroid(t),n=normal(t);
  const preferred=c[1]>=.75&&c[1]<=1.45&&n[2]>.3;
  // Prefer a legitimate front-facing torso triangle of the original
  // licensed 2-unit-normalized rig; fallback remains truthful if absent.
  const score=(preferred?1e3:0)+Math.min(a,1)*10+
   (c[2]>.0?.01:0);
  if(score>bestScore){best=i;bestScore=score;frontTorsoMatch=preferred;}
 }
 if(best<0)throw Error('no-positive-area-original-body-contact-anchor');
 return {index:best,frontTorsoMatch};
}
export function originalFullIndexedAnatomyContactNegative(bodyFaces,photoFront,{
 maxPairs=8000000,maxExactAABBPairs=2000000}={}){
 if(!Array.isArray(bodyFaces)||!Array.isArray(photoFront)||
  bodyFaces.length<128||photoFront.length<128)
  throw Error('real-complete-original-photo-and-anatomy-faces-required');
 const sourceFace=selectSourceFace(photoFront);
 const target=selectOriginalAnatomicalFace(bodyFaces);
 const anchored=rigidlyAnchorOriginalSourceTriangle(
  photoFront[sourceFace],bodyFaces[target.index]);
 const movedPhotoFront=photoFront.map(face=>{
  if(!finite(face))throw Error('untrusted-original-photo-triangle');
  return face.map(p=>anchored.applyPoint(p));
 });
 const fullOriginalContact=evaluateFullIndexedContact(
  bodyFaces,movedPhotoFront,{
   maxPairs,maxExactAABBPairs,stopAtFirstVerifiedContact:true,
   reportResourceBlockerInsteadOfThrow:true
  });
 if(fullOriginalContact.contactDecision!=='BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT'||
  fullOriginalContact.definitiveCollisionRejection!==true||
  fullOriginalContact.strictGeometricContactObserved!==true||
  fullOriginalContact.fullOriginalIndexedScopeEvaluated!==false||
  fullOriginalContact.pairEnumerationStoppedAfterRealContact!==true)
  throw Error('real-original-front-body-positive-contact-not-refused '+
   fullOriginalContact.contactDecision);
 return {
  sourcePhotoFrontOriginalIndexedFaces:photoFront.length,
  actualLicensedBodyOriginalIndexedFaces:bodyFaces.length,
  authenticSourceFaceAnchorIndex:sourceFace,
  authenticBodyFaceAnchorIndex:target.index,
  preferredOriginalAnteriorTorsoFaceAnchorFound:target.frontTorsoMatch,
  realSourceAndLicensedBodyFaceAreaRigUnits:{
   source:anchored.sourceTriangleAreaRigUnits,
   body:anchored.originalBodyTriangleAreaRigUnits},
  actuallyOriginalSourceAndBodySelectedTriangleContact:
   anchored.selectedActualPairContact,
  actualFullOriginalIndexedPhotoContactRefusal:fullOriginalContact,
  identicalRigidRegistrationAppliedToEverySourceFace:true,
  realOriginalPositionUVRGBAndRigBuffersNotMutated:true,
  selectedCandidateGeometryCopiedNoPermanentMeshChange:true,
  exhaustiveNegativeContactCheckNotProved:true,
  actualTruePhysicalGarmentFitCalibrated:false,
  originalGarmentReversePhotographAvailable:false,
  genuineOwner3DContactApproved:false,
  consumer3DAdmitted:false,
  sourceOriginalPhoto2DFallbackRequired:true,
  familyAlpha:'HOLD'
 };
}
