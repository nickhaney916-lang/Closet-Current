/**
 * Source-independent measured public textile benchmark from The Met.
 * NOT a physical measurement, image or reconstructed rear of Honolulu
 * Museum of Art 5152.1 / Commons-0043. The actual catalog item is
 * Metropolitan Museum of Art no. 1983.21a,b, object URL /70759.
 *
 * Museum catalog describes garments a and b as two *parts* of an object.
 * "waist band width without the loop/button" is NOT wearer circumference.
 * Two approved object-specific source-image endpoints can be fetched and
 * independently byte-hashed, but their angle/part assignments remain UNKNOWN.
 * A visual multi-image source is not camera calibration or complete 360°.
 */
export const MET_70759_89=Object.freeze({
 schema:'M2-Met-70759-independent-measured-multiimage-source/v1',
 repositorySource:'https://www.metmuseum.org/art/collection/search/70759',
 institution:'The Metropolitan Museum of Art',
 objectId:70759,objectNumber:'1983.21a, b',
 originalHonoluluSourceId:'commons-0043',
 originalHonoluluAccession:'5152.1',
 sourceIndependentOfHonolulu:true,
 legalPublicDomainRecord:true,
 originalCollectionObjectMeasurementSource:'MET_CATALOG_NOT_OWNER_TAPE',
 // Genuine collection record, source dimensions in inches; preserve a/b
 // distinct; "wide at bottom" is not hem circumference.
 parts:Object.freeze([
  Object.freeze({part:'a',lengthInches:39,
   widthAtBottomInches:52.5,waistbandWidthWithoutLoopButtonInches:28.5}),
  Object.freeze({part:'b',lengthInches:38,
   widthAtBottomInches:51.25,waistbandWidthWithoutLoopButtonInches:28.75})
 ]),
 publishedPhotoEndpoints:Object.freeze([
  'https://collectionapi.metmuseum.org/api/collection/v1/iiif/70759/2551408/main-image',
  'https://collectionapi.metmuseum.org/api/collection/v1/iiif/70759/2551409/main-image'
 ]),
 publishedPhotoSHA256:Object.freeze([
  '59c0e6568000b68678efb067a5cdd2f95eee3c1407b9927df82ac89af0124ec2',
  '239c547f950cc28475fb860357b0173d7670a0fe5210637db5f54fb88ff4b515'
 ]),
 // Pixel digests of genuinely decoded museum source images; the museum's
 // IIIF CDN can deliver byte-different but pixel-identical JPEG encodings.
 // Never silently accept an unverified replacement. The real CI must
 // calculate BOTH actual JPEG and decoded RGB digests, independent of caller.
 publishedPhotoAcceptedObservedJPEGEncodings:Object.freeze([
  Object.freeze([
   '59c0e6568000b68678efb067a5cdd2f95eee3c1407b9927df82ac89af0124ec2',
   'f2e83d99e39ef472e834189ef6541760973bc2ef2d6cc4786cc9123b58140c06'
  ]),
  Object.freeze([
   '239c547f950cc28475fb860357b0173d7670a0fe5210637db5f54fb88ff4b515'
  ])
 ]),
 publishedPhotoDecodedRGBSHA256:Object.freeze([
  'dddbda448c32667a0ab5c1b90a43d139b5917c1b9955dc428987beec035e06c0',
  '1cd4c7f71ebbb00a27f769e46a438a03f19393bd6a6ba200af14a092d1461e3f'
 ]),
 publishedImageIDsNotProofOfExactGarmentPartOrViewAngle:true,
 physicalOriginalGarmentBackViewIndependentHumanVerified:false,
 cameraParametersPublished:false
});
const round=n=>Math.round(n*100)/100;
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const failure=reason=>Object.freeze({
 schema:'M2-source-independent-met-70759-measured-image-intake/v1',
 status:'SOURCE_MATCHED_MET_INTAKE_REFUSED',reason,
 sourceEligibleForNewIndependentBenchmark:false,
 mayCalibrateOriginalCommons0043:false,
 canUseMetMeasurementsToCalibrateHonolulu5152_1:false,
 photoDerivedWearable3DAuthorized:false,consumer3DAdmitted:false,
 originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'
});
const safePhoto=(item,expected,originalExpectedSHA,originalExpectedRGBSHA)=>{
 if(!item||item.sourceObjectId!==70759||item.sourceObjectNumber!=='1983.21a, b'||
  item.sourceUrl!==expected||
  !['collectionapi.metmuseum.org','images.metmuseum.org'].includes(item.responseOrigin)||
  item.redirectedToNonMuseumHost===true||
  item.httpStatus!==200||item.contentType!=='image/jpeg'||
  // The actual independent Node ingestion MUST hash downloaded JPEG
  // bytes and independently decode/attest exact RGB content. Different
  // museum-approved JPEG encodings of identical pixels are valid source
  // content and should not cause false failures.
  item.decodedRGBSHA256!==originalExpectedRGBSHA||
  !Number.isSafeInteger(item.byteLength)||item.byteLength<10000||
  item.byteLength>40000000||!hex(item.sha256)||
  !Number.isSafeInteger(item.widthPixels)||item.widthPixels<400||
  !Number.isSafeInteger(item.heightPixels)||item.heightPixels<400||
  item.widthPixels>18000||item.heightPixels>18000||
  item.jpegMagicVerified!==true||item.actualBytesHashed!==true||
  item.actualImageDecoded!==true||
  item.actualDecodedRGBHashIndependentlyChecked!==true||
  item.photoPartExactHumanVerified===true||
  item.originalCameraCalibrationClaimed===true)
  return false;
 return true;
};
/**
 * The ONLY source data accepted is a frozen, exact-object museum record.
 * The optional actual museum image receipts come from trusted Node fetch,
 * full JPEG digest and decode, not a caller-provided URL string.
 * Metadata-only is RESEARCH_READY for sourcing, but not image-attested.
 */
export function assessMet70759IndependentSource89({
 catalog=MET_70759_89,images=null
}={}){
 if(catalog!==MET_70759_89)
  return failure('exact-met-1983-21-a-b-immutable-catalog-required');
 const [a,b]=catalog.parts;
 if(a.part!=='a'||b.part!=='b')return failure('wrong-original-part-identities');
 const physical=catalog.parts.map(part=>Object.freeze({
  part:part.part,
  measuredCatalogLengthMm:round(part.lengthInches*25.4),
  measuredCatalogWidthAtHemMm:round(part.widthAtBottomInches*25.4),
  measuredCatalogWaistbandWidthExcludingLoopButtonMm:
   round(part.waistbandWidthWithoutLoopButtonInches*25.4),
  museumRecordMeasurementHasRulerProvenance:false,
  actualSewnWaistCircumferenceUnknown:true,
  garmentWidthIsNotBodyWaistCircumference:true
 }));
 const base={
  schema:'M2-source-independent-met-70759-measured-image-intake/v1',
  sourceId:'met-70759-1983-21-a-b',
  sourceCollectionObjectNumber:catalog.objectNumber,
  independentSourceVerifiedCatalogUrl:catalog.repositorySource,
  sourceOfficialMuseumRecordMet:true,
  sourcePublicDomain:true,
  aAndBAreDifferentCatalogParts:true,
  originalCatalogDimensionFieldsSeparatelyMapped:true,
  physicalDimensionsFromSameNewMetObjectOnly:true,
  originalSourceHonoluluImageDigestNotReused:true,
  catalogPartDimensionsMm:Object.freeze(physical),
  actualSourceCameraParametersKnown:false,
  actualSourceImagePartOrientationIndependentlyVerified:false,
  actualRealGarmentWearerWaistCircumferenceKnown:false,
  actualOriginalGarmentFull3DThicknessDrapeNotMeasured:true,
  canUseMetMeasurementsToCalibrateHonolulu5152_1:false,
  originalHonoluluPhotoAndGeometryUntouched:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
 if(images===null)
  return Object.freeze({...base,
   status:'MET_OBJECT_PHYSICAL_CATALOG_FOUND_IMAGES_NOT_BYTE_ATTESTED',
   independentMetImageBytesAttested:false,
   sourceEligibleForNewIndependentBenchmark:false,
   sourcePhotoEvidenceForActual3DStillMissing:true
  });
 if(!Array.isArray(images)||images.length!==2||
  !images.every((x,i)=>safePhoto(x,catalog.publishedPhotoEndpoints[i],
   catalog.publishedPhotoSHA256[i],
   catalog.publishedPhotoDecodedRGBSHA256[i]))||
  images[0].sha256===images[1].sha256||
  images[0].sourceUrl===images[1].sourceUrl)
  return failure('real-distinct-same-met-object-two-source-jpegs-required');
 return Object.freeze({...base,
  status:'MET_SAME_OBJECT_MEASUREMENTS_AND_TWO_PUBLISHED_JPEGS_ATTESTED_RESEARCH_ONLY',
  publishedPhotographIDsVerified:Object.freeze([2551408,2551409]),
  originalCatalogImageCount:2,
  actualPublishedImagesDifferentBytes:true,
  imageDigests:Object.freeze(images.map(x=>x.sha256)),
  decodedImageContentDigests:Object.freeze(images.map(x=>x.decodedRGBSHA256)),
  anyJPEGReencodedButPixelIdenticalToLockedPhoto:images.some((x,i)=>
   x.sha256!==catalog.publishedPhotoSHA256[i]),
  recordedPublishedPixelDimensions:Object.freeze(images.map(x=>
   Object.freeze([x.widthPixels,x.heightPixels]))),
  sourceImagePartAndFrontBackLabelRequiresIndependentInspection:true,
  verifiedPhysicalUnitsOnlyForThisMetObject:true,
  independentMetImageBytesAttested:true,
  sourceEligibleForNewIndependentBenchmark:true,
  sourcePhotoEvidenceForActual3DStillMissing:true,
  physicallyCalibrated3DSourceAttested:false
 });
}
