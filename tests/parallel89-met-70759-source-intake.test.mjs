/** Synthetic receipts test exact object provenance; real Met JPEG bytes
 * downloaded and decoded separately in genuine source intake CI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {MET_70759_89 as catalogue,assessMet70759IndependentSource89 as audit}
 from '../research/parallel89/met-70759-source-intake89.mjs';

const fake=(id,sha)=>({
 sourceObjectId:70759,sourceObjectNumber:'1983.21a, b',
 sourceUrl:catalogue.publishedPhotoEndpoints[id],
 responseOrigin:'collectionapi.metmuseum.org',redirectedToNonMuseumHost:false,
 httpStatus:200,contentType:'image/jpeg',byteLength:85555,
 widthPixels:1024,heightPixels:768,
 sha256:sha,jpegMagicVerified:true,actualBytesHashed:true,
 actualImageDecoded:true,photoPartExactHumanVerified:false,
 originalCameraCalibrationClaimed:false
});
function photos(){return [
 fake(0,catalogue.publishedPhotoSHA256[0]),
 fake(1,catalogue.publishedPhotoSHA256[1])
];}
test('source-matched museum measurements remain separate a/b and not circumference, with no images initially',()=>{
 const a=audit();
 assert.equal(a.status,'MET_OBJECT_PHYSICAL_CATALOG_FOUND_IMAGES_NOT_BYTE_ATTESTED');
 assert.equal(a.sourceId,'met-70759-1983-21-a-b');
 assert.equal(a.sourceCollectionObjectNumber,'1983.21a, b');
 assert.equal(a.sourceOfficialMuseumRecordMet,true);
 assert.equal(a.originalCatalogDimensionFieldsSeparatelyMapped,true);
 assert.deepEqual(a.catalogPartDimensionsMm,[
  {part:'a',measuredCatalogLengthMm:990.6,measuredCatalogWidthAtHemMm:1333.5,
   measuredCatalogWaistbandWidthExcludingLoopButtonMm:723.9,
   museumRecordMeasurementHasRulerProvenance:false,
   actualSewnWaistCircumferenceUnknown:true,garmentWidthIsNotBodyWaistCircumference:true},
  {part:'b',measuredCatalogLengthMm:965.2,measuredCatalogWidthAtHemMm:1301.75,
   measuredCatalogWaistbandWidthExcludingLoopButtonMm:730.25,
   museumRecordMeasurementHasRulerProvenance:false,
   actualSewnWaistCircumferenceUnknown:true,garmentWidthIsNotBodyWaistCircumference:true}
 ]);
 assert.equal(a.sourceEligibleForNewIndependentBenchmark,false);
 assert.equal(a.canUseMetMeasurementsToCalibrateHonolulu5152_1,false);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.releaseAuthorized,false);
});
test('two distinct separately SHA-attested source image receipts can seed only independent Met research, never 3D consumer',()=>{
 const a=audit({images:photos()});
 assert.equal(a.status,
  'MET_SAME_OBJECT_MEASUREMENTS_AND_TWO_PUBLISHED_JPEGS_ATTESTED_RESEARCH_ONLY');
 assert.equal(a.sourceEligibleForNewIndependentBenchmark,true);
 assert.equal(a.actualPublishedImagesDifferentBytes,true);
 assert.equal(a.independentMetImageBytesAttested,true);
 assert.equal(a.originalCatalogImageCount,2);
 assert.deepEqual(a.publishedPhotographIDsVerified,[2551408,2551409]);
 assert.equal(a.sourceImagePartAndFrontBackLabelRequiresIndependentInspection,true);
 assert.equal(a.actualSourceImagePartOrientationIndependentlyVerified,false);
 assert.equal(a.physicallyCalibrated3DSourceAttested,false);
 assert.equal(a.canUseMetMeasurementsToCalibrateHonolulu5152_1,false);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.originalPhoto2DFallbackRequired,true);
});
test('wrong Met catalog, Honolulu accession, unrelated object dimensions, or fake pasted plain JS catalog are rejected',()=>{
 for(const opts of [{catalog:{...catalogue}},
  {catalog:{...catalogue,objectNumber:'5152.1'}},
  {catalog:{...catalogue,objectId:70760}},
  {catalog:{...catalogue,parts:catalogue.parts.slice().reverse()}},
  {catalog:{...catalogue,parts:[]}}]){
  const a=audit(opts);
  assert.equal(a.status,'SOURCE_MATCHED_MET_INTAKE_REFUSED');
  assert.equal(a.sourceEligibleForNewIndependentBenchmark,false);
  assert.equal(a.canUseMetMeasurementsToCalibrateHonolulu5152_1,false);
 }
});
test('wrong image source, duplicate photo, corrupt digest, metadata or false approval blocks source intake',()=>{
 for(const edit of [
  p=>p[0].sourceObjectId=5152,
  p=>p[1].sourceObjectNumber='1983.21c',
  p=>p[0].sourceUrl= 'https://example.com/photo.jpg',
  p=>p[1].sourceUrl= p[0].sourceUrl,
  p=>p[1].sha256=p[0].sha256,
  p=>p[0].sha256='a'.repeat(64),
  p=>p[1].sha256='0'.repeat(63),
  p=>p[1].contentType='text/html',
  p=>p[0].httpStatus=404,
  p=>p[0].actualBytesHashed=false,
  p=>p[0].jpegMagicVerified=false,
  p=>p[1].actualImageDecoded=false,
  p=>p[1].photoPartExactHumanVerified=true,
  p=>p[1].originalCameraCalibrationClaimed=true,
  p=>p[0].byteLength=1,
  p=>p[1].widthPixels=100,
  p=>p[0].redirectedToNonMuseumHost=true,
  p=>p[0].responseOrigin='attacker.net'
 ]){
  const images=photos();edit(images);
  const a=audit({images});
  assert.equal(a.status,'SOURCE_MATCHED_MET_INTAKE_REFUSED');
  assert.equal(a.sourceEligibleForNewIndependentBenchmark,false);
  assert.equal(a.consumer3DAdmitted,false);
 }
});
test('the museum a/b historical measurements can never certify a body fit or calibrate Honolulu',()=>{
 const a=audit({images:photos()});
 assert.equal(a.aAndBAreDifferentCatalogParts,true);
 assert.equal(a.actualRealGarmentWearerWaistCircumferenceKnown,false);
 assert.equal(a.actualSourceCameraParametersKnown,false);
 assert.equal(a.originalSourceHonoluluImageDigestNotReused,true);
 assert.equal(a.originalHonoluluPhotoAndGeometryUntouched,true);
 assert.equal(a.sourcePhotoEvidenceForActual3DStillMissing,true);
 assert.equal(a.familyAlpha,'HOLD');
});
