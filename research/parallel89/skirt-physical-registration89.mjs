/** P89 original 163-bone photo-skirt physical sizing boundary.
 * The SOURCE 343-vertex 7 x 49 skirt shell is a research proposal in GLB
 * coordinates. No ruler, actual photographed garment waist circumference or
 * hem drop has been independently measured. Source model units are not a
 * legitimate substitute for measured real-garment dimensions.
 *
 * This audit NEVER certifies a wearable garment, even when a caller supplies
 * externally typed numbers. It exposes the missing input and tests whether
 * a *uniform* scale hypothesis would be internally consistent.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const finite=Number.isFinite;
const round=n=>Math.round(n*1e5)/1e5;
const invalid=reason=>Object.freeze({
 schema:'P89-original-photo-skirt-physical-size-registration/v1',
 status:'PHYSICAL_SOURCE_SKIRT_REGISTRATION_UNVERIFIABLE',reason,
 originalGarmentPhysicalDimensionsVerified:false,
 actualPhotoCameraScaleVerified:false,sourceBacksideObserved:false,
 actualSignedBodyContainmentCertified:false,continuousClothFitCertified:false,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
function point(p,i){return [p[3*i],p[3*i+1],p[3*i+2]];}
function ring(p,row){
 const offset=row*49;
 const first=point(p,offset),last=point(p,offset+48);
 let length=0;
 for(let i=0;i<48;i++)length+=distance(point(p,offset+i),point(p,offset+i+1));
 return {perimeter:length,seamGap:distance(first,last)};
}
/** This is a read-only numerical audit. The real browser caller must verify
 * the original JPEG, mask, source mesh and 163-bone rig BEFORE calling it. */
export function auditOriginalSkirtPhysicalRegistration89({
 sourceId,sourceSHA256,originalSourceAttested=false,avatar,pose,
 originalSkirtRestPositions,rigBoneCount,physicalTape=null
}={}){
 if(sourceId!=='commons-0043'||sourceSHA256!==PHOTO||
    originalSourceAttested!==true||!['female','male'].includes(avatar)||
    !POSES.has(pose)||rigBoneCount!==163)
  return invalid('genuine-original-commons-0043-photo-and-163bone-context-required');
 const p=originalSkirtRestPositions;
 if(!(p instanceof Float32Array)||p.length!==343*3||
    p.some(n=>!finite(n)||Math.abs(n)>10))
  return invalid('original-343-vertex-rest-geometry-invalid');
 const snapshot=p.slice();
 const waist=ring(p,0),hem=ring(p,6);
 if(!finite(waist.perimeter)||!finite(hem.perimeter)||
    waist.perimeter<.15||waist.perimeter>8||
    hem.perimeter<.15||hem.perimeter>10||
    waist.seamGap>.035||hem.seamGap>.035)
  return invalid('original-source-rest-rings-not-closed-for-perimeter-audit');
 const lengths=[];
 for(let col=0;col<49;col++){
  const a=point(p,col),b=point(p,6*49+col);
  const yDrop=a[1]-b[1];
  if(!finite(yDrop)||yDrop<.08||yDrop>2.5)
   return invalid('original-photo-skirt-top-bottom-rest-direction-invalid');
  lengths.push(yDrop);
 }
 const meanDrop=lengths.reduce((a,b)=>a+b,0)/lengths.length;
 if(Math.max(...lengths)-Math.min(...lengths)>.25)
  return invalid('original-skirt-rest-top-bottom-height-too-inconsistent');
 if(p.some((n,i)=>!Object.is(n,snapshot[i])))
  return invalid('original-rest-geometry-was-mutated');
 const base={
  schema:'P89-original-photo-skirt-physical-size-registration/v1',
  sourceId,originalPhotoSHA256:PHOTO,avatar,pose,originalRigBoneCount:163,
  originalSourceRestVertexCount:343,sourceRingCount:7,ringSamples:49,
  // These are geometric distances in the research shell coordinate frame.
  // NEVER report as authenticated tape measurements.
  uncalibratedSourceWaistPerimeterModelUnits:round(waist.perimeter),
  uncalibratedSourceHemPerimeterModelUnits:round(hem.perimeter),
  uncalibratedSourceTopToHemDropModelUnits:round(meanDrop),
  originalGarmentPhysicalDimensionsVerified:false,
  actualPhotoCameraScaleVerified:false,
  independentHumanTapePhotoReviewed:false,
  physicalGarmentOwnerApproved:false,
  sourceBacksideObserved:false,actualSignedBodyContainmentCertified:false,
  continuousClothFitCertified:false,originalSourceRestGeometryUnchanged:true,
  originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 if(physicalTape==null)return Object.freeze({...base,
  status:'ORIGINAL_PHYSICAL_GARMENT_DIMENSIONS_MISSING',
  missingIndependentEvidence:Object.freeze([
   'actual-same-garment-measured-waist-circumference',
   'actual-same-garment-measured-waist-to-hem-length',
   'independent-source-matched-measurement-photo-review',
   'camera-calibration-and-same-garment-side-rear-coverage'
  ]),
  hypotheticalUniformScale:null});
 const {waistCircumferenceMm,waistToHemLengthMm}=physicalTape;
 if(!finite(waistCircumferenceMm)||!finite(waistToHemLengthMm)||
    waistCircumferenceMm<300||waistCircumferenceMm>2400||
    waistToHemLengthMm<100||waistToHemLengthMm>2000)
  return invalid('external-tape-sizes-outside-physical-sanity-bounds');
 const waistScale=waistCircumferenceMm/(1000*waist.perimeter),
   dropScale=waistToHemLengthMm/(1000*meanDrop);
 const disagreement=Math.abs(waistScale-dropScale)/
   Math.max(Math.abs(waistScale),Math.abs(dropScale));
 if(!finite(disagreement)||waistScale<.1||waistScale>4||
    dropScale<.1||dropScale>4||disagreement>.06)
  return invalid('waist-and-height-measurements-inconsistent-with-uniform-source-scale');
 // Untyped external numbers do not independently establish that the true
 // photographed artifact was ever measured. No automatic size approval.
 return Object.freeze({...base,
  status:'UNREVIEWED_EXTERNAL_TAPE_UNIFORM_SCALE_HYPOTHESIS_ONLY',
  externallyEnteredWaistCircumferenceMm:waistCircumferenceMm,
  externallyEnteredWaistToHemLengthMm:waistToHemLengthMm,
  independentWaistScaleCandidate:round(waistScale),
  independentLengthScaleCandidate:round(dropScale),
  fractionalTwoMeasureScaleDisagreement:round(disagreement),
  hypotheticalUniformScale:round((waistScale+dropScale)/2),
  missingIndependentEvidence:Object.freeze([
   'verified-source-matched-physical-tape-photographs',
   'independent-human-measurement-adjudication',
   'original-source-calibrated-camera-geometry',
   'verified-same-garment-side-rear-source',
   'signed-full-volume-containment-and-moving-cloth-fit'
  ])
 });
}
