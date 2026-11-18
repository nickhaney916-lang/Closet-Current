/**
 * Original public photo skirt no-hit plane-line diagnostic.
 *
 * IMPORTANT: No independent recomputation of the STRICT source-core mask,
 * 3D source ring ray origin, original anatomical source planes or BVH:
 * duplication was proven to diverge on the actual 163-bone public GLB.
 * This module reads the exact SAME original-source ray pass that establishes
 * the 336-ray baseline, then independently checks CONSERVATION, provenance
 * and the semantics of its newly retained line-miss evidence.
 *
 * Distinguishing an original face behind/too far from a ray is NOT declaring
 * physical clothing clearance; every original no-hit remains UNKNOWN.
 */
import {summarizeOriginalCoreSkinSensitivity89}
 from './skirt-original-core-skin-sensitivity89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const CLASSES=Object.freeze([
 'SOURCE_FORWARD_BEYOND_RAY_CAP',
 'SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER',
 'SOURCE_COLLINEAR_OR_DEGENERATE_LINE',
 'NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION'
]);
const sum=x=>Object.values(x).reduce((n,v)=>n+v,0);
const fail=reason=>Object.freeze({
 schema:'P89-locked-original-nohit-anatomy-plane-line/v1',
 status:'ORIGINAL_SKIRT_SOURCE_LINE_ANALYSIS_UNVERIFIABLE',
 reason,originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 signedBodyContainmentCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
/** Pure source diagnostic; synthetic fixtures alone cannot certify a GLB. */
export function summarizeOriginalNoHitLineGeometry89(args={}){
 const original=summarizeOriginalCoreSkinSensitivity89(args);
 const measured=original.originalNoHitLineGeometryFromVerifiedStrictSourceRays;
 if(!measured||
  measured.originalPhotoSkirtSourceRayCount!==336||
  measured.originalStrictCoreUnknown!==original.baselineStrictCoreUnknown||
  measured.originalStrictCoreInward!==original.baselineStrictCoreInward||
  measured.originalStrictCoreOutward!==original.baselineStrictCoreOutward||
  measured.originalStrictCoreNear!==original.baselineStrictCoreNear||
  measured.originalSourceIndexedBodyFaceCount!==original.sourceIndexedBodyTriangles||
  measured.originalSourceExcludedFaceRayHits!==
   original.baselineUnknownExcludedOriginalFaceRayHits||
  measured.originalSourceNoForwardFaceRayHits!==
   original.baselineUnknownNoOriginalFaceRayHits||
  measured.originalSourceExcludedFaceRayHits+
   measured.originalSourceNoForwardFaceRayHits!==measured.originalStrictCoreUnknown||
  Object.keys(measured.exclusiveNoHitLineGeometryReasons).join('|')!==
   CLASSES.join('|')||
  sum(measured.exclusiveNoHitLineGeometryReasons)!==
   measured.originalSourceNoForwardFaceRayHits||
  !Array.isArray(measured.sevenOriginalSkirtBandLineReasons)||
  measured.sevenOriginalSkirtBandLineReasons.length!==7||
  measured.sevenOriginalSkirtBandLineReasons.some((row,i)=>
   row.originalPhotoSkirtBand!==i||
   row.originalStrictUnknown!==original.originalStrictCoreSourceBandReceipts[i].strictCoreUnknown||
   row.originalExcludedBodySourceHit!==
    original.originalStrictCoreSourceBandReceipts[i].originalExcludedFaceIntersection||
   row.originalNoForwardBodySourceRayHit!==
    original.originalStrictCoreSourceBandReceipts[i].noObservedOriginalFaceIntersection||
   row.noHitSourceAngularSectors.length!==row.originalNoForwardBodySourceRayHit||
   row.noHitSourceAngularSectors.some((j,k,all)=>
    !Number.isInteger(j)||j<0||j>=48||(k>0&&j<=all[k-1]))||
   sum(row.noHitLineGeometryReasons)!==row.originalNoForwardBodySourceRayHit))
  throw Error('reused-original-source-nohit-ray-evidence-inconsistent');
 return Object.freeze({
  schema:'P89-true-original-skirt-nohit-line-geometry/v1',
  ...measured,
  originalPhoto2DFallbackRequired:true,
  lineBehindSkirtCenterIsNotBodyOrGarmentClearance:true,
  sourceOnlyUnobservedAngularDirectionsNotSignedVolume:true,
  sourceOriginalPublicAnatomyAndPhotoUnmodified:true,
  newRealWorldBodyGarmentDimensionsInferred:false,
  sourceMeshEdgesNotWeldedOrFabricated:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export function auditOriginalNoHitLineGeometry89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentlyVerifiedSkinSensitivityReceipt}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentlyVerifiedSkinSensitivityReceipt?.schema!==
   'P89-original-anatomy-skin-core-sensitivity-source-indexed/v1'||
  independentlyVerifiedSkinSensitivityReceipt?.sourceSkirtSpokeCount!==336||
  independentlyVerifiedSkinSensitivityReceipt?.counterfactualsMayNotChangeOriginalStrictCoreMask!==true)
  return fail('genuine-original-source-skin-and-selected-photo-provenance-required');
 try{
  const x=summarizeOriginalNoHitLineGeometry89(args),
   p=independentlyVerifiedSkinSensitivityReceipt;
  if(x.originalSourceIndexedBodyFaceCount!==p.sourceIndexedBodyTriangles||
   x.originalStrictCoreInward!==p.baselineStrictCoreInward||
   x.originalStrictCoreOutward!==p.baselineStrictCoreOutward||
   x.originalStrictCoreNear!==p.baselineStrictCoreNear||
   x.originalStrictCoreUnknown!==p.baselineStrictCoreUnknown||
   x.originalSourceExcludedFaceRayHits!==p.baselineUnknownExcludedOriginalFaceRayHits||
   x.originalSourceNoForwardFaceRayHits!==p.baselineUnknownNoOriginalFaceRayHits||
   x.sevenOriginalSkirtBandLineReasons.some((v,i)=>
    v.originalStrictUnknown!==p.originalStrictCoreSourceBandReceipts[i]?.strictCoreUnknown||
    v.originalExcludedBodySourceHit!==
     p.originalStrictCoreSourceBandReceipts[i]?.originalExcludedFaceIntersection||
    v.originalNoForwardBodySourceRayHit!==
     p.originalStrictCoreSourceBandReceipts[i]?.noObservedOriginalFaceIntersection))
   return fail('original-skirt-line-analysis-disagrees-with-independent-336-ray-evidence');
  return Object.freeze({
   schema:'P89-locked-original-nohit-anatomy-plane-line/v1',
   status:'SOURCE_NOHIT_LINE_REASONS_EVIDENCED_NOT_WEARABLE_FIT',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   exactSourceNoHitLineGeometryEvidence:x,
   sourceSkinSensitivityIndependentlyCrossChecked336:true,
   originalPhoto2DFallbackRequired:true,
   closedSignedBodyVolumeVerified:false,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  return fail([
   'reused-original-source-nohit-ray-evidence-inconsistent',
   'original-source-nohit-line-forward-replay-mismatch'
  ].includes(e.message)?e.message:
   'source-original-nohit-line-geometry-unverifiable');
 }
}
