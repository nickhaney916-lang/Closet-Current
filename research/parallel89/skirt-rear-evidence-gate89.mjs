/**
 * P89 exact licensed public photo source-only rear-visibility evidence gate.
 * No inferred backside is ever declared photographic evidence. This does not
 * approve wearable 3D and does not consume user/private photos or vertices.
 */
const poses=['source','blend-50','relaxed'],views=[0,90,180],avatars=['female','male'];
const status='ORIGINAL_SKIRT_ONLY_FRONT_PHOTOGRAPHED_REAR_NOT_SOURCE_VERIFIED';
const error=reason=>Object.freeze({
 schema:'P89-original-photo-source-rear-material-360-evidence/v1',
 status:'INCOMPLETE_OR_UNTRUSTED_ORIGINAL_REAR_MATERIAL_EVIDENCE',reason,
 originalRearPhotoVerified:false,sourcePhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const round=n=>Math.round(n*1e5)/1e5;
export function summarizeOriginalSkirtUnphotographedRear89({rows,
 sourceSHA256,sourcePhotoRearObserved=false}={}){
 if(!Array.isArray(rows)||rows.length!==18||
  sourceSHA256!=='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344'||
  sourcePhotoRearObserved!==false)
  return error('original-public-front-photo-and-exact-18-genuine-source-views-required');
 const index=new Map();
 for(const r of rows){
  if(!r||r.schema!=='P89-actual-original-licensed-photo-visible-provisional-neutral-rear/v1'||
   r.status!=='ORIGINAL_PUBLIC_SKIRT_UNPHOTOGRAPHED_REAR_RENDERED_NOT_REAL_PHOTO'||
   !avatars.includes(r.avatar)||!poses.includes(r.pose)||!views.includes(r.viewAngle)||
   r.sourcePhotoId!=='commons-0043'||r.actual163BoneSourceRig!==true||
   r.sourceFrontPhotographedSurfaceTriangleCount!==288||
   r.sourceUnphotographedRearTriangleCount!==288||
   r.originalPhotoFrontUVAndRGBUnchanged!==true||
   r.originalSkirtSourcePhotoAndAnatomicalGeometryUnchanged!==true||
   r.temporaryAttributionMaterialDisposedAndRestored!==true||
   r.originalRearPhotoObserved!==false||
   r.inferredBackDoesNotBecomePhotographed!==true||
   r.originalMaskOwnerApproved!==false||
   r.sourcePhoto2DFallbackRequired!==true||
   r.consumer3DAdmitted!==false||r.releaseAuthorized!==false||
   !Number.isSafeInteger(r.unphotographedRearMarkerPixels)||
   !Number.isSafeInteger(r.opaqueSourceMeshProjectedMarkerPixels)||
   r.unphotographedRearMarkerPixels<0||
   r.opaqueSourceMeshProjectedMarkerPixels<r.unphotographedRearMarkerPixels||
   r.opaqueSourceMeshProjectedMarkerPixels<=0||
   r.opaqueSourceMeshProjectedMarkerPixels>390*690||
   !Number.isFinite(r.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt)||
   r.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt<0||
   r.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt>1||
   r.opaqueFrontMarkerOverestimatesPhotographicAlphaCoverage!==true||
   r.projectedSourceDenominatorNotTruePhotographedVisiblePixels!==true
  )return error('genuine-pinned-original-source-360-material-frame-missing-or-forged');
  const proportion=r.unphotographedRearMarkerPixels/r.opaqueSourceMeshProjectedMarkerPixels;
  if(Math.abs(r.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt-proportion)>.00002)
   return error('false-gpu-original-photo-source-projected-ratio');
  const key=[r.avatar,r.pose,r.viewAngle].join('|');
  if(index.has(key))return error('duplicate-original-anatomical-source-camera');
  index.set(key,r);
 }
 const byAvatar=[];
 for(const avatar of avatars){
  const angles=[];
  for(const viewAngle of views){
   const viewsForPose=poses.map(p=>index.get([avatar,p,viewAngle].join('|')));
   if(viewsForPose.some(x=>!x))return error('missing-actual-pose-camera-original-public-source');
   if(viewAngle===90&&viewsForPose.some(x=>x.unphotographedRearMarkerPixels<=750))
    return error('source-actual-side-neutral-rear-disclosure-not-witnessed');
   if(viewAngle===180&&viewsForPose.some(x=>
    x.unphotographedRearMarkerPixels<=2000||
    x.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt<=.70))
    return error('full-rear-camera-should-observe-inferred-unphotographed-dominant-material');
   const minimum=Math.min(...viewsForPose.map(x=>x.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt));
   const maximum=Math.max(...viewsForPose.map(x=>x.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt));
   angles.push(Object.freeze({angle:viewAngle,
    samples:viewsForPose.length,
    visibleNeverPhotographedMarkerPixelCounts:viewsForPose.map(x=>x.unphotographedRearMarkerPixels),
    guaranteedMinimumSourceInferredMaterialShareOfOpaqueProjectedSkirt:round(minimum),
    maximumSourceInferredMaterialShareOfOpaqueProjectedSkirt:round(maximum)}));
  }
  byAvatar.push(Object.freeze({avatar,angles}));
 }
 return Object.freeze({
  schema:'P89-original-photo-source-rear-material-360-evidence/v1',status,
  originalPhotoSourceId:'commons-0043',
  originalFrontPhotoSHA256:sourceSHA256,
  exactOriginalSourceSkirtTriCount:576,
  originalPhotoFrontTriCount:288,inferredUnphotographedBackTriCount:288,
  threeOriginalRigPosesPerAvatar:true,
  actualNativeOriginalPhotoViewReports:18,
  originalFrontPhotoObserved:true,originalRearPhotoVerified:false,
  substantialUnphotographedBackVisibleAtActualSideAndRearAngles:true,
  visuallyCorrectFrontDoesNotProveRearSource:true,
  inferredRearShareIsConservativeAlphaOvercountLowerBound:true,
  groupedSourcePublicCounts:byAvatar,
  sourcePhoto2DFallbackRequired:true,
  independentPhotorealismAccepted:false,
  continuousClothOrDynamicGarmentSafetyCertified:false,
  consumer3DAdmitted:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
}
