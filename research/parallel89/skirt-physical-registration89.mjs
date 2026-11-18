/**
 * Commons-0043 Qing mamianqun-class photographed-skirt source:
 * CONSTRUCTION-AWARE physical-registration refusal, research only.
 *
 * Wikimedia identifies accession 5152.1 as Qing mamianqun; such skirts
 * commonly use overlapping panels / waist ties or fastenings. This is
 * historical category context, NOT proof of this exact museum specimen's
 * original inner overlap, fasteners, flat waistband length or wearable
 * circumference. The 343-vertex, 7x49 P89 closed ring is a modeled proxy:
 * its source mesh perimeter cannot be equated to measured garment waist,
 * even when an arbitrary entered "waist circumference" happens to fit.
 *
 * Public sources:
 * https://commons.wikimedia.org/wiki/File:Woman%27s_summer_skirt_from_China,_Honolulu_Museum_of_Art_5152.1.JPG
 * https://uritextilecollection.omeka.net/items/show/599
 *
 * The audit never modifies original model, photograph or skin and never
 * admits owner/customer 3D. It exposes only derived uncalibrated geometry.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const finite=Number.isFinite;
const round=x=>Math.round(x*1e5)/1e5;
const SOURCE_CLASS=Object.freeze({
 accession:'5152.1',museum:'Honolulu Museum of Art',
 publicCategory:'QING_MAMIANQUN_CLASSIFICATION',
 exactSpecimenPanelConstructionVerified:false,
 exactSpecimenWaistClosureAndOverlapVerified:false,
 originalFrontPhotoOnly:true,
 frontPanelReferenceNotIdenticalToSewnCylinder:true
});
const FAIL_SCHEMA='P89-original-photo-skirt-construction-aware-size-registration/v2';
const fail=reason=>Object.freeze({
 schema:FAIL_SCHEMA,status:'PHYSICAL_SOURCE_SKIRT_REGISTRATION_UNVERIFIABLE',
 reason,sourceConstruction:SOURCE_CLASS,
 originalGarmentPhysicalDimensionsVerified:false,
 originalGarmentClosureAndOverlapVerified:false,
 actualPhotoCameraScaleVerified:false,sourceBacksideObserved:false,
 actualSignedBodyContainmentCertified:false,continuousClothFitCertified:false,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
function at(p,i){const n=3*i;return [p[n],p[n+1],p[n+2]];}
function ring(p,row){
 const first=at(p,49*row),last=at(p,49*row+48);
 let len=0;
 for(let i=0;i<48;i++){
  const a=at(p,49*row+i),b=at(p,49*row+i+1);
  len+=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 }
 return {length:len,endGap:Math.hypot(...first.map((v,i)=>v-last[i]))};
}
export function auditOriginalSkirtPhysicalRegistration89({
 sourceId,sourceSHA256,originalSourceAttested=false,avatar,pose,
 originalSkirtRestPositions,rigBoneCount,physicalTape=null
}={}){
 if(sourceId!=='commons-0043'||sourceSHA256!==PHOTO||
    originalSourceAttested!==true||!['female','male'].includes(avatar)||
    !POSES.has(pose)||rigBoneCount!==163)
  return fail('genuine-original-commons-0043-photo-and-163bone-context-required');
 const p=originalSkirtRestPositions;
 if(!(p instanceof Float32Array)||p.length!==343*3||
    p.some(n=>!finite(n)||Math.abs(n)>10))
  return fail('original-343-vertex-rest-geometry-invalid');
 const immutable=p.slice();
 const waist=ring(p,0),hem=ring(p,6);
 if(!finite(waist.length)||!finite(hem.length)||
    waist.length<.15||waist.length>8||hem.length<.15||
    hem.length>10||waist.endGap>.035||hem.endGap>.035)
  return fail('virtual-closed-ring-proxy-invalid');
 const verticalDrops=[];
 for(let k=0;k<49;k++){
  const a=at(p,k),b=at(p,6*49+k);
  const h=a[1]-b[1];
  if(!finite(h)||h<.08||h>2.5)
   return fail('original-photo-skirt-top-bottom-rest-direction-invalid');
  verticalDrops.push(h);
 }
 if(Math.max(...verticalDrops)-Math.min(...verticalDrops)>.25)
  return fail('original-skirt-rest-top-bottom-height-too-inconsistent');
 const meanDrop=verticalDrops.reduce((a,b)=>a+b,0)/49;
 if(p.some((n,i)=>!Object.is(n,immutable[i])))
  return fail('original-rest-geometry-was-mutated');
 const base={
  schema:FAIL_SCHEMA,sourceId,sourceConstruction:SOURCE_CLASS,
  originalPhotoSHA256:PHOTO,avatar,pose,originalRigBoneCount:163,
  originalSourceRestVertexCount:343,sourceRingCount:7,ringSamples:49,
  // Model-space geometry only: NOT sewn physical garment circumference.
  uncalibratedVirtualClosedShellWaistPerimeterModelUnits:round(waist.length),
  uncalibratedVirtualClosedShellHemPerimeterModelUnits:round(hem.length),
  uncalibratedSourceTopToHemDropModelUnits:round(meanDrop),
  modelWaistPerimeterAsPhysicalGarmentCircumferenceAllowed:false,
  physicalClothWaistbandLengthAndClosedWearerWaistAreNotInterchangeable:true,
  actualSourceOverlapAndFasteningUnobserved:true,
  originalGarmentClosureAndOverlapVerified:false,
  originalGarmentPhysicalDimensionsVerified:false,
  actualPhotoCameraScaleVerified:false,independentHumanTapePhotoReviewed:false,
  physicalGarmentOwnerApproved:false,sourceBacksideObserved:false,
  actualSignedBodyContainmentCertified:false,continuousClothFitCertified:false,
  originalSourceRestGeometryUnchanged:true,originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
 const missing=Object.freeze([
  'same-artifact-waistband-flat-length-and-tie-closure-method',
  'same-artifact-front-back-panel-number-and-overlap-topology',
  'same-artifact-original-physical-skirt-vertical-length',
  'independently-adjudicated-object-matched-measurement-and-multiview-photos',
  'actual-object-photo-camera-calibration-and-hidden-side-rear-coverage'
 ]);
 if(physicalTape==null)return Object.freeze({...base,
  status:'ORIGINAL_PHYSICAL_GARMENT_DIMENSIONS_MISSING',
  hypotheticalUniformScale:null,independentWaistScaleCandidate:null,
  missingIndependentEvidence:missing
 });
 if(!physicalTape||typeof physicalTape!=='object'||Array.isArray(physicalTape))
  return fail('physical-tape-record-type-invalid');
 // Compatibility: old inputs named waistCircumferenceMm are NOT sufficient:
 // when source skirt uses wraps, a waistband's laid-flat length, tie length,
 // and tied-on-body circumference can differ dramatically.
 const {waistCircumferenceMm,waistToHemLengthMm}=physicalTape;
 if(!finite(waistCircumferenceMm)||!finite(waistToHemLengthMm)||
    waistCircumferenceMm<300||waistCircumferenceMm>2400||
    waistToHemLengthMm<100||waistToHemLengthMm>2000)
  return fail('external-tape-sizes-outside-physical-sanity-bounds');
 const kind=physicalTape.waistMeasurementKind??'UNSPECIFIED';
 if(!['UNSPECIFIED','FLAT_WAISTBAND_LENGTH',
       'TIED_ON_BODY_WAIST_CIRCUMFERENCE','CLAIMED_CLOSED_WAIST_PERIMETER'].includes(kind))
  return fail('unknown-waist-physical-measurement-method');
 // Even asserted photos, panel counts, timestamps, signatures or reviewer
 // booleans cannot certify the true specimen's topology from self-report.
 const lengthOnly=waistToHemLengthMm/(1000*meanDrop);
 if(!finite(lengthOnly)||lengthOnly<.1||lengthOnly>4)
  return fail('external-vertical-height-not-consistent-with-source-hypothesis');
 return Object.freeze({...base,
  status:'WRAP_SKIRT_OVERLAP_AND_CLOSURE_UNVERIFIED_NO_WAIST_SCALE',
  externallyEnteredWaistMm:waistCircumferenceMm,
  externalWaistMeasurementMeaningUnreviewed:kind,
  externallyEnteredVerticalLengthMm:waistToHemLengthMm,
  // Vertical-only hypothesis is NOT camera calibration or actual waist fit.
  provisionalVerticalOnlyScaleHypothesis:round(lengthOnly),
  hypotheticalUniformScale:null,
  independentWaistScaleCandidate:null,
  fractionalTwoMeasureScaleDisagreement:null,
  missingIndependentEvidence:missing
 });
}
