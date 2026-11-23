/**
 * Met object 70759, accession 1983.21a,b: independent REAL catalogued
 * physical garment dimensions. This is an institutional OBJECT-size anchor,
 * never a camera/image-plane or body/rig calibration.
 *
 * Curatorial source: https://www.metmuseum.org/art/collection/search/70759
 * Main original image 2551406 is captioned "a) front".
 *
 * Editorial/manual record of museum-published dimensions, NOT a digitally
 * signed museum measurement report. Exact source JPEG/RGB provenance must be
 * supplied and independently authenticated by the existing P89 native runner.
 * No estimates of hidden surfaces, garment closure, circumference or wearer.
 */
// Exact inch values are multiples of quarter inches; decimal millimetres
// have at most two digits. Round the binary float representation only,
// never the museum source value or any physical measurement uncertainty.
const mmPerIn=25.4;
const fixedPartAInches=Object.freeze({
 length:39,bottomWidth:52.5,
 waistBandWidthExcludingLoopButton:28.5
});
const blocked=(reason,extra={})=>({
 status:'NOT_PHYSICALLY_CALIBRATED',
 reason,...extra,
 localPhotoMillimetersPerPixel:null,
 photoToOriginalRigUnitsPerMillimeter:null,
 independentCameraIntrinsicsAndPlanePoseVerified:false,
 wearerAnthropometryAndSourceFitVerified:false,
 observedGarmentBack:false,
 observedPhysicalGarmentDrape:false,
 fullGarmentBodyContactCertified:false,
 sourcePhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,
 familyAlpha:'HOLD'
});
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const official={
 museum:'The Metropolitan Museum of Art',
 objectId:70759,
 accession:'1983.21a,b',
 photographedPart:'a',
 photographedImageId:2551406,
 originalPhotoCaption:'a) front',
 dimensionsURL:'https://www.metmuseum.org/art/collection/search/70759',
 originalImageURL:'https://collectionapi.metmuseum.org/api/collection/v1/iiif/70759/2551406/main-image',
 reportedDimensionUnit:'inch',
 dimensionKind:'museum-catalogue-physical-object',
 partAInches:fixedPartAInches
};
/**
 * P89's actual original photo verification is EXTERNAL to this module;
 * this checks its record consistency, not JPEG trust or Met's live page.
 * Require a verified original photo SHA and decoded source RGB SHA supplied
 * separately from immutable externally checked native P89 source files.
 *
 * Source is expected to be freshly retrieved P89 in-memory payload fields,
 * trusted is P89's independent current original-source digest receipt.
 */
export function institutionalPartAAnchor({source,trusted}={}){
 if(!source||!trusted||source.objectId!==70759||
  source.imageId!==2551406||source.caption!=='a) front'||
  source.part!=='a'||source.accession!=='1983.21a,b')
  return blocked('BLOCKED_WRONG_MUSEUM_OBJECT_PART_OR_ORIGINAL_IMAGE');
 if(!sha(source.originalJPEG_SHA256)||!sha(source.decodedOriginalRGB_SHA256)||
  !sha(trusted.originalJPEG_SHA256)||!sha(trusted.decodedOriginalRGB_SHA256)||
  source.originalJPEG_SHA256!==trusted.originalJPEG_SHA256||
  source.decodedOriginalRGB_SHA256!==trusted.decodedOriginalRGB_SHA256)
  return blocked('BLOCKED_ORIGINAL_PHOTOGRAPH_OR_RGB_RECEIPT_MISMATCH');
 if(trusted.imageId!==2551406||trusted.objectId!==70759||
  trusted.sourcePhotoCaption!=='a) front'||
  trusted.independentOriginalSourceVerifiedByCaller!==true)
  return blocked('BLOCKED_NATIVE_ORIGINAL_SOURCE_ATTESTATION_MISSING');
 const mm=Object.fromEntries(Object.entries(fixedPartAInches)
  .map(([key,value])=>[key,Math.round(value*mmPerIn*100)/100]));
 return blocked('REAL_CATALOGUED_GARMENT_PART_A_DIMENSIONS_ONLY',{
  museumCatalogueReference:official.dimensionsURL,
  sourceMuseumCollectionObjectId:70759,
  sourceOriginalMuseumImageId:2551406,
  sourceOriginalImageSHA256:source.originalJPEG_SHA256,
  sourceDecodedOriginalRGB_SHA256:source.decodedOriginalRGB_SHA256,
  museumAccession:'1983.21a,b',measuredPhysicalPart:'a',
  physicalSizeClass:'INSTITUTIONALLY_PUBLISHED_OBJECT_DIMENSIONS',
  independentlyPublishedPhysicalLengthsAvailable:true,
  dimensionsRecordedFromPublishedCatalog:true,
  physicalGarmentPartADimensionsInches:{...fixedPartAInches},
  physicalGarmentPartADimensionsMillimeters:mm,
  museumCatalogMeasurementUncertainty:'NOT_PUBLISHED',
  waistbandMeasurementExcludesLoopAndButton:true,
  bottomWidthNotAutomaticallyCircumference:true,
  partBMeasurementsNotApplicableToPartA:true,
  projectedImageContourNotMatchedToMeasuredSeamLandmarks:true,
  cameraAndProjectionCalibrationEvidenceStatus:'MISSING',
  fullThreeDimensionalGarmentFitStatus:'UNVERIFIED'
 });
}
export const MET70759_OBJECT_DIMENSION_REFERENCE=Object.freeze({
 ...official,partAInches:fixedPartAInches
});
