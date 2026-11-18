/**
 * Mission 2 P89: original Commons-0043 photographic source MASK cannot
 * uniquely determine physical garment scale or camera magnification.
 *
 * The exact alpha band measurements can be reprojected under two different
 * HYPOTHETICAL world-size / orthographic-image-scale assumptions with
 * identical pixels. This is a constructive non-identifiability witness, NOT
 * photogrammetry, an estimate of the actual photograph's camera, a measured
 * garment, a 3D mesh, nor collision/fit approval.
 *
 * All real photo and CC0 avatar byte digests must be independently checked
 * by the localhost-only native browser BEFORE passing the outline here.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const CUTOUT='b9717f71fffb65beb7b17beebd54702333d41e34f10f214831251660b1664be4';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=Object.freeze(['source','blend-25','blend-50','blend-75','relaxed']);
const TRIALS=Object.freeze([
 Object.freeze({name:'example-world-camera-A',
  photoWaistHalfWidthMeters:.19,photoTopToHemDropMeters:.55,
  unobservedRearDepthMeters:.12}),
 Object.freeze({name:'example-world-camera-B',
  photoWaistHalfWidthMeters:.29,photoTopToHemDropMeters:.82,
  unobservedRearDepthMeters:.31})
]);
const blocked=reason=>Object.freeze({
 schema:'P89-original-licensed-photo-physical-camera-nonidentifiability/v1',
 status:'ORIGINAL_PHOTO_NONIDENTIFIABILITY_EVIDENCE_INVALID',
 reason,realPhysicalGarmentMeasurementAvailable:false,
 calibratedActualCameraAvailable:false,originalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const fin=n=>typeof n==='number'&&Number.isFinite(n);
const closed=(rows,width,height)=>{
 if(!Array.isArray(rows)||rows.length!==7)return false;
 let prev=-1;
 for(const b of rows){
  if(!Number.isSafeInteger(b?.sourcePixelRow)||b.sourcePixelRow<=prev||
   b.sourcePixelRow<0||b.sourcePixelRow>=height||
   !fin(b?.centerPixels)||!fin(b?.widthPixels)||b.widthPixels<=1||
   b.widthPixels>width||b.centerPixels-b.widthPixels/2<-.5||
   b.centerPixels+b.widthPixels/2>width+.5||
   !fin(b.p)||b.p<0||b.p>1)return false;
  prev=b.sourcePixelRow;
 }
 return rows[6].sourcePixelRow>rows[0].sourcePixelRow+5;
};
/**
 * Exactly source image ROW and left/right pixel constraints are reconstructed,
 * with 3D garment size and camera pixels-per-world-unit changing together.
 * A single frontal photograph supplies no independent physical ruler or rear.
 *
 * sourceFrontMaskAttested is NOT a caller consent mechanism. Only the native
 * original-photo/cutout SHA check establishes this input's true provenance.
 */
export function proveOriginalPhotoMetricNonIdentifiability89({
 sourceId,museumAccession,originalPhotoSHA256,originalCutoutSHA256,
 originalSourcePhotoAndCutoutAttested,avatar,original163BoneGLBSHA256,
 rigBoneCount,pose,outline
}={}){
 if(sourceId!=='commons-0043'||museumAccession!=='5152.1'||
  originalPhotoSHA256!==PHOTO||
  originalCutoutSHA256!==CUTOUT||
  originalSourcePhotoAndCutoutAttested!==true||
  !Object.hasOwn(RIG,avatar)||original163BoneGLBSHA256!==RIG[avatar]||
  rigBoneCount!==163||!POSES.includes(pose))
  return blocked('exact-original-photo-cutout-and-163bone-body-identity-required');
 const bands=outline?.sourceRowWidths;
 const [width,height]=outline?.pixelDimensions??[];
 if(outline?.schema!=='P89-source-measured-skirt-silhouette/v1'||
  !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<12||height<12||width>512||height>512||
  !closed(bands,width,height)||
  !Array.isArray(outline.crop)||outline.crop.length!==4||
  outline.crop.some(n=>!fin(n)||n<0||n>1)||
  outline.maskHumanApproved!==false||
  outline.photoCameraAngleIndependentlyValidated!==false||
  outline.realPhysicalDimensionsMeasured!==false||
  outline.releaseAuthorized!==false)
  return blocked('attested-seven-original-photo-alpha-rows-not-verified');
 const waist=bands[0],hem=bands[6],span=hem.sourcePixelRow-waist.sourcePixelRow;
 let candidates;
 try{
  candidates=TRIALS.map(example=>{
   // The camera is ONLY a mathematical 2D orthographic example. It is not
   // inferred to be the true camera used for the museum photograph.
   const pxPerWorldX=waist.widthPixels/(2*example.photoWaistHalfWidthMeters);
   const pxPerWorldY=span/example.photoTopToHemDropMeters;
   if(!fin(pxPerWorldX)||!fin(pxPerWorldY)||pxPerWorldX<=0||pxPerWorldY<=0)
    throw Error('no-credible-original-photo-projection-scale');
   let maxError=0;
   for(const row of bands){
    const xLeft=row.centerPixels-row.widthPixels/2;
    const xRight=row.centerPixels+row.widthPixels/2;
    const xLeftWorld=(xLeft-waist.centerPixels)/pxPerWorldX;
    const xRightWorld=(xRight-waist.centerPixels)/pxPerWorldX;
    const yWorld=-(row.sourcePixelRow-waist.sourcePixelRow)/pxPerWorldY;
    const projectedLeft=waist.centerPixels+pxPerWorldX*xLeftWorld;
    const projectedRight=waist.centerPixels+pxPerWorldX*xRightWorld;
    const projectedY=waist.sourcePixelRow-pxPerWorldY*yWorld;
    maxError=Math.max(maxError,Math.abs(projectedLeft-xLeft),
     Math.abs(projectedRight-xRight),
     Math.abs(projectedY-row.sourcePixelRow));
   }
   if(!fin(maxError)||maxError>1e-8)
    throw Error('original-source-row-pixel-reprojection-not-identical');
   return Object.freeze({
    name:example.name,
    hypotheticalWaistHalfWidthMeters:example.photoWaistHalfWidthMeters,
    hypotheticalTopToHemDropMeters:example.photoTopToHemDropMeters,
    hypotheticalInvisibleRearDepthMeters:example.unobservedRearDepthMeters,
    exampleCameraPixelsPerHypotheticalWorldUnitX:pxPerWorldX,
    exampleCameraPixelsPerHypotheticalWorldUnitY:pxPerWorldY,
    maximumOriginalObservedFrontRowReprojectionErrorPixels:maxError,
    realCameraOrObjectSizeEstimated:false,
    sourcePixelsAndMaterialNotAltered:true
   });
  });
 }catch{
  return blocked('original-source-row-pixel-reprojection-not-identical');
 }
 if(candidates[0].hypotheticalWaistHalfWidthMeters===
    candidates[1].hypotheticalWaistHalfWidthMeters||
    candidates[0].hypotheticalTopToHemDropMeters===
    candidates[1].hypotheticalTopToHemDropMeters||
    candidates[0].hypotheticalInvisibleRearDepthMeters===
    candidates[1].hypotheticalInvisibleRearDepthMeters)
  return blocked('independent-physical-camera-hypotheses-not-distinct');
 return Object.freeze({
  schema:'P89-original-licensed-photo-physical-camera-nonidentifiability/v1',
  status:'TWO_DISTINCT_UNCALIBRATED_WORLDS_SAME_SEVEN_ORIGINAL_ALPHA_ROWS',
  sourceId,avatar,pose,originalPhotoSHA256:PHOTO,
  originalCutoutSHA256:CUTOUT,original163BoneSHA256:RIG[avatar],
  sourcePixelDimensions:Object.freeze([width,height]),
  independentlyAttestedOriginalPhotoAlphaBands:7,
  photographicLeftRightAndRowConstraintsReprojected:21,
  hypotheticalWorldAndCameraExamples:Object.freeze(candidates),
  exactOriginalSourceRowsMatchUnderBothExamples:true,
  examplesNotActualCameraCalibration:true,
  observedOneFrontalAlphaMaskCannotDetermineAbsoluteScale:true,
  unobservedRearDepthCanVaryWithoutChangingFrontProjection:true,
  exampleOrthographicProjectionNotProofOfTrueCameraType:true,
  sameObjectPhysicalWaistAndLengthNotInOriginalSourceMetadata:true,
  museumAccession:'5152.1',
  museumPhotographicSourceMetadataNotMetricRuler:true,
  unrelatedChineseSkirtMeasurementsMustNotBeSubstituted:true,
  realPhysicalGarmentMeasurementAvailable:false,
  calibratedActualCameraAvailable:false,
  originalSourceMaskAndRigUnchanged:true,
  realPhotoBacksideObserved:false,
  humanPhotoReconstructionApproval:false,
  originalBodySignedFitCertified:false,
  continuousClothMotionApproved:false,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
