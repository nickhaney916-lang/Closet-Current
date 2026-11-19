/**
 * Met 70759 original four-gallery image chromatic textile projection benchmark.
 * This is a measured 2D color-fabric REGION, NOT a complete garment alpha
 * silhouette: cream/off-white waistband, shadows and dark low-saturation
 * threads may be omitted; photograph geometry is not physically calibrated.
 *
 * Image 2551406 is explicitly captioned "a) front" on the museum record.
 * Other image roles/parts are VISUAL PROVISIONAL interpretations of gallery
 * order and embroidery vs plain-fabric appearance. A "rear-looking" image
 * never proves a full original 360° sewing pattern or physical drape.
 *
 * The external original JPEG must be checked by Node CI for exact ID, museum
 * host, expected SHA-256 and JPEG decode BEFORE passing RGB samples here.
 */
import {MET_70759_89} from './met-70759-source-intake89.mjs';
const MET='1983.21a, b';
const VIEWS=Object.freeze([
 Object.freeze({id:2551406,part:'a',provisionalPartForSourceResearch:'a',
  museumVerifiedSide:'front',researchViewLabel:'a-front-museum-first-caption',
  catalogCaptionExact:'a) front',sourcePartViewVerified:true,
  canonicalDecodedRGBSHA256:'e0b7738db57ac4b7c27d4f03f724442f53c8e85f09f7a139839dfaa04c86cbec'}),
 Object.freeze({id:2551407,part:null,provisionalPartForSourceResearch:'a',
  museumVerifiedSide:null,researchViewLabel:'a-other-side-candidate',
  catalogCaptionExact:null,sourcePartViewVerified:false,
  canonicalDecodedRGBSHA256:'e59253bef19ccc908b7cb1519c1ef4c92e011e9ae955bca878de14f40a9f9678'}),
 Object.freeze({id:2551408,part:null,provisionalPartForSourceResearch:'b',
  museumVerifiedSide:null,researchViewLabel:'b-decorated-side-candidate',
  catalogCaptionExact:null,sourcePartViewVerified:false,
  canonicalDecodedRGBSHA256:'dddbda448c32667a0ab5c1b90a43d139b5917c1b9955dc428987beec035e06c0'}),
 Object.freeze({id:2551409,part:null,provisionalPartForSourceResearch:'b',
  museumVerifiedSide:null,researchViewLabel:'b-less-decorated-side-candidate',
  catalogCaptionExact:null,sourcePartViewVerified:false,
  canonicalDecodedRGBSHA256:'1cd4c7f71ebbb00a27f769e46a438a03f19393bd6a6ba200af14a092d1461e3f'})
]);
const frozen=a=>Object.freeze(a.map(x=>Object.freeze(x)));
const roundMm=v=>Math.round(v*100)/100;
const reject=reason=>Object.freeze({
 schema:'M2-Met70759-real-four-gallery-color-fabric-projection/v1',
 status:'MET_FOUR_GALLERY_COLOR_ENVELOPE_UNVERIFIABLE',reason,
 source2DPhotographRetained:true,consumer3DAdmitted:false,
 mayCalibrateOriginalHonoluluGarment:false,physicalClothFitCertified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const good=id=>VIEWS.find(v=>v.id===id);
export const MET70759_GALLERY_VIEW_NOTES89=VIEWS;

/**
 * Explicit institutional-label-only accessor. The published object lists
 * measurements of BOTH physical components a/b, but only museum-captioned
 * image 2551406 as "a) front". It is UNSAFE to equate four photographs
 * with two parts × two sides solely from array order or cloth patterns.
 *
 * Do not accept caller-provided museum captions/metadata as an authority.
 * Never authorize backside geometry, complete sewn pattern, physical
 * scale, fitting, or consumer 3D even for verified "a) front".
 */
export function assessMet70759PhotoPartViewEvidence89({
 imageId,decodedRGBSHA256,originalMuseumObjectNumber
}={}){
 const v=good(imageId);
 const valid=Boolean(v&&originalMuseumObjectNumber===MET&&
  decodedRGBSHA256===v.canonicalDecodedRGBSHA256);
 const institutionallyCaptioned=valid&&v.sourcePartViewVerified===true&&
  v.catalogCaptionExact==='a) front'&&v.part==='a'&&
  v.museumVerifiedSide==='front';
 return Object.freeze({
  schema:'M2-Met70759-original-gallery-authoritative-photo-role-gate/v1',
  status:!valid?'ORIGINAL_SOURCE_PHOTO_ROLE_REFUSED':
   institutionallyCaptioned?'ONLY_A_FRONT_CAPTION_MUSEUM_VERIFIED':
   'IMAGE_PIXELS_VERIFIED_BUT_GARMENT_PART_AND_SIDE_UNVERIFIED',
  objectNumber:MET,
  originalMuseumImageId:valid?imageId:null,
  museumCaptionVerified:institutionallyCaptioned,
  museumExactCaption:institutionallyCaptioned?'a) front':null,
  institutionallyVerifiedPart:institutionallyCaptioned?'a':null,
  institutionallyVerifiedSide:institutionallyCaptioned?'front':null,
  provisionalResearchPart:valid?v.provisionalPartForSourceResearch:null,
  provisionalResearchViewLabel:valid?v.researchViewLabel:null,
  noPartOrSideInferredFromGalleryOrder:!institutionallyCaptioned,
  noCallerProvidedCaptionCanForgeOfficialSource:true,
  catalogMeasurementsOfPartsCannotCertifyImagePart:!institutionallyCaptioned,
  twoPartCatalogAndFourPhotosNotA3DViewPair:true,
  backwardFacingOriginalTextileSurfaceQualified:false,
  mayInferSewnBackOr360FromThisSource:false,
  source2DPhotographAllowed:valid,
  source2DPhotographFallbackRequired:true,
  canCalibrateOriginalHonolulu5152_1:false,
  approvedFull3DGarment:false,
  consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

/** A narrow, conservative chroma/dark fabric proxy, not real segmentation. */
function colored(r,g,b){
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),mean=(r+g+b)/3;
 return (hi-lo>=34&&mean<230&&lo<216)||
  (mean<85&&hi-lo>=13);
}
function percentile(hist,total,portion){
 const goal=Math.max(1,Math.ceil(total*portion));
 let n=0;
 for(let x=0;x<hist.length;x++){
  n+=hist[x];if(n>=goal)return x;
 }
 return hist.length-1;
}
/**
 * Offline 2D diagnosis ONLY, on RGB extracted from a photo whose real JPEG
 * bytes passed the per-photo SHA gate in Node CI. It counts conservative
 * chromatic garment-like pixels by horizontal bands; a white waistband is
 * deliberately outside its measurement definition.
 */
export function measureMet70759ColorFabricProjection89({
 imageId,sourceSHA256,decodedRGBSHA256,expectedSourceSHA256,
 originalMuseumObjectNumber,actualOriginalJPEGAttested,
 actualDecodedRGBHashIndependentlyChecked,
 width,height,rgb
}={}){
 const view=good(imageId);
 if(!view||originalMuseumObjectNumber!==MET||
  actualOriginalJPEGAttested!==true||
  typeof sourceSHA256!=='string'||!/^[a-f0-9]{64}$/.test(sourceSHA256)||
  sourceSHA256!==expectedSourceSHA256||
  decodedRGBSHA256!==view.canonicalDecodedRGBSHA256||
  actualDecodedRGBHashIndependentlyChecked!==true||
  !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<90||height<90||width>18000||height>18000||
  !(rgb instanceof Uint8Array)&&!(rgb instanceof Uint8ClampedArray))
  return reject('exact-source-image-and-decodable-rgb-provenance-required');
 if(rgb.length!==width*height*3)
  return reject('original-published-image-rgb-dimensions-inconsistent');
 const perRow=new Uint32Array(height);
 let chromaticPixels=0;
 const xLo=Math.ceil(width*.025),xHi=Math.floor(width*.975);
 const yLo=Math.ceil(height*.04),yHi=Math.floor(height*.97);
 for(let y=yLo;y<yHi;y++)for(let x=xLo;x<xHi;x++){
  const k=(y*width+x)*3;
  if(colored(rgb[k],rgb[k+1],rgb[k+2])){
   perRow[y]++;chromaticPixels++;
  }
 }
 const activeMin=Math.max(8,Math.floor(width*.055));
 const active=[];
 for(let y=yLo;y<yHi;y++)if(perRow[y]>=activeMin)active.push(y);
 if(active.length<Math.floor(height*.30)||chromaticPixels<width*height*.045)
  return reject('measured-real-photo-textile-chroma-coverage-insufficient');
 const first=active[0],last=active[active.length-1],range=last-first;
 if(range<height*.32)return reject('observed-textile-color-vertical-span-insufficient');
 const bands=[];
 const sampleAt=Object.freeze([.10,.23,.36,.50,.64,.77,.90]);
 for(const t of sampleAt){
  const y=Math.round(first+t*range);
  const radius=Math.max(2,Math.round(range*.024));
  const hist=new Uint32Array(width);
  let count=0;
  for(let yy=Math.max(yLo,y-radius);yy<=Math.min(yHi-1,y+radius);yy++)
   for(let x=xLo;x<xHi;x++){
    const k=(yy*width+x)*3;
    if(colored(rgb[k],rgb[k+1],rgb[k+2])){hist[x]++;count++;}
   }
  if(count<Math.max(50,Math.floor(width*.1)))
   return reject('source-chromatic-ink-band-insufficient-for-projection');
  const l=percentile(hist,count,.02),r=percentile(hist,count,.98);
  if(r<=l||r-l>=width)
   return reject('source-chromatic-band-horizontal-span-invalid');
  bands.push({
   bandIndex:bands.length,sampledSourceY:y,chromaticPixelCount:count,
   lowerTwoPercentileSourceX:l,upperNinetyEightPercentileSourceX:r,
   observedColorFabricWidthPixels:r-l,
   observedColorFabricWidthFraction:(r-l)/width
  });
 }
 const firstWidth=bands[0].observedColorFabricWidthPixels;
 const lastWidth=bands[6].observedColorFabricWidthPixels;
 return Object.freeze({
  schema:'M2-Met70759-real-four-gallery-color-fabric-projection/v1',
  status:'ORIGINAL_MUSEUM_TEXTILE_COLOR_REGION_MEASURED_RESEARCH_ONLY',
  museumObjectNumber:MET,museumObjectId:70759,imageId,
  originalImageSHA256:sourceSHA256,
  observedDecodedRGBSHA256:decodedRGBSHA256,
  canonicalSourceRGBContentSHA256:view.canonicalDecodedRGBSHA256,
  jpegByteEncodingMayVaryButExactRGBMustMatch:true,
  sourcePixelDimensions:Object.freeze([width,height]),
  sourceImageRoleViewLabel:view.researchViewLabel,
  sourceMuseumExactCaption:view.catalogCaptionExact,
  photographicPartAndViewIndependentlyVerified:view.sourcePartViewVerified,
  verifiedSourcePhotoPart:view.part,
  verifiedSourcePhotoSide:view.museumVerifiedSide,
  proposedPartForSourceResearch:view.provisionalPartForSourceResearch,
  physicallyVerifiedReversePhotoForSamePart:false,
  partBOrReverseRoleRemainsProvisional:!view.sourcePartViewVerified,
  sourceImageCountInOfficialGallery:4,
  imageColorTextileProxyNotFullGarmentMask:true,
  creamWaistbandMayBeExcluded:true,
  backgroundShadowOrColoredNonGarmentPixelsCanInfluenceEnvelope:true,
  chromaticTextileCandidatePixelCount:chromaticPixels,
  colorFabricFirstSourcePixelRow:first,
  colorFabricLastSourcePixelRow:last,
  sevenMeasuredChromaticImageBands:frozen(bands),
  bottomToUpperColorRegionWidthRatio:lastWidth/firstWidth,
  immutableCatalogPartMeasurementsMm:MET_70759_89.parts.map(p=>Object.freeze({
   part:p.part,recordedLengthMm:roundMm(p.lengthInches*25.4),
   recordedWidthAtBottomMm:roundMm(p.widthAtBottomInches*25.4),
   recordedWaistbandFlatWidthExcludingFastenerMm:
    roundMm(p.waistbandWidthWithoutLoopButtonInches*25.4),
   notAVerifiedPhotographicPixelScale:true
  })),
  noOriginalSourcePartMixedWithHonolulu:true,
  catalogDimensionCannotConvertObservedPixelsWithoutCameraAndFlattening:true,
  fullGarmentAlphaOrDepthNotObserved:true,
  sourcePhotographsNotPerspectiveRectified:true,
  originalCameraFocalAndExtrinsicCalibrationMissing:true,
  originalGarmentPhysicalBodyFitNotProven:true,
  source2DPhotographRetained:true,consumer3DAdmitted:false,
  mayCalibrateOriginalHonoluluGarment:false,
  physicalClothFitCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
