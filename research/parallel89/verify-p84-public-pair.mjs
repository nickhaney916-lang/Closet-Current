/**
 * Parallel #89 P2 — independent verification of immutable P84/P541 GENUINE
 * photographed shirt+denim browser outputs, NEVER consumer 3D permission.
 * All photographic source identities and screenshot digests are checked from
 * BYTES by a separate CLI. Synthetic tests of this contract prove rejection.
 */
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const VERIFIED_DONOR89=Object.freeze({
 p84:'8385c308df215bcf80eb95b8c37660307dc80536',
 p541:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 shirt:Object.freeze({id:'commons-0003',
   originalSHA256:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
   license:'CC BY-SA 3.0',path:'benchmark/work47/assets/commons-0003.jpg',
   cutout:'benchmark/work47/assets/commons-0003.png'}),
 denims:Object.freeze({
  public:Object.freeze({id:'commons-public-domain-jeans-2005',license:'public domain',
   sourcePage:'https://commons.wikimedia.org/wiki/File:Jeans.jpg',
   originalSHA256:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
   cutoutSHA256:'e51ed275c6ff1c18d37dfbb821d8994576868f707c551da4fcccea1eaa4b9441',
   path:'benchmark/three-d-31/original-jeans.jpg',cutout:'benchmark/three-d-31/cutout-proposal.png',
   metrics:'benchmark/three-d-31/metrics.json'}),
  second:Object.freeze({id:'commons-cc-by-sa-denimjeans2-2008',license:'CC BY-SA 4.0',
   sourcePage:'https://commons.wikimedia.org/wiki/File:Denimjeans2.JPG',
   originalSHA256:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
   cutoutSHA256:'4cf80f77fa34d04844d7310de180135df607248847ea17b1aed4ef613d0cb3db',
   path:'benchmark/three-d-37/original-denimjeans2.jpg',cutout:'benchmark/three-d-37/cutout-proposal.png',
   metrics:'benchmark/three-d-37/metrics.json'})
 })
});
const widths=[320,390,430],figures=['female','male'],denims=['public','second'],angles=[0,45,90,180];
const no=reason=>Object.freeze({status:'SOURCE_OR_RENDER_EVIDENCE_REJECTED',reason,
   sourcePhoto2DFallbackRequired:true,certified3D:false,releaseAuthorized:false,familyAlpha:'HOLD'});
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const exactKeys=(obj,allowed)=>obj&&Object.keys(obj).every(k=>allowed.includes(k));
/** src: independently byte-digested sources and license/owner-unapproved metrics.
 * images: byte-digested PNG filenames in the actual source P84 artifact folder.
 * No signature, hash or screenshot is trusted merely because a browser says so.
 */
export function verifyActualPublicPair89({result,source,images,engine}={}){
 try{
  check(['chromium','webkit'].includes(engine),'invalid-browser');
  check(result?.schema==='parallel84-actual-licensed-photo-two-piece-browser/v1'&&
   result?.engine===engine&&result.browserEngineReal===engine&&
   JSON.stringify(result.widths)===JSON.stringify(widths)&&
   JSON.stringify(result.figures)===JSON.stringify(figures)&&
   JSON.stringify(result.denimSources)===JSON.stringify(denims)&&
   JSON.stringify(result.angles)===JSON.stringify(angles),
   'incorrect-original-P84-source-pair-schema');
  check(result.familyAlpha==='HOLD'&&result.releaseAuthorized===false&&
   result.privateAccountDataAccessed===false&&result.realAndroidIphoneTested===false&&
   result.productionModified===false&&result.threeDContactClearanceCertified===false&&
   result.photographedRearObserved===false&&
   result.independentHumanPhotorealismCertified===false&&
   result.originalLicensedPhotoSHAAndCutoutValidatedByP69===true,
   'false-source-consumer-safety-claims');
  check(source?.shirt?.originalSHA256===VERIFIED_DONOR89.shirt.originalSHA256&&
   source.shirt.license===VERIFIED_DONOR89.shirt.license&&
   sha(source.shirt.cutoutSHA256)&&
   source.shirt.ownerApproved===false,'incorrect-original-shirt-or-provisional-cutout');
  for(const denim of denims){
   const pin=VERIFIED_DONOR89.denims[denim],v=source?.denims?.[denim];
   check(v?.id===pin.id&&v.originalSHA256===pin.originalSHA256&&
    v.cutoutSHA256===pin.cutoutSHA256&&v.sourcePage===pin.sourcePage&&
    v.license===pin.license&&v.ownerApproved===false&&
    v.humanVisualApproval===false&&v.releaseAuthorized===false,
    'incorrect-original-denim-or-provisional-matte');
  }
  check(Array.isArray(result.captures)&&result.captures.length===48&&
   result.screenshotCount===48&&Array.isArray(result.samples)&&
   result.samples.length===12&&result.sourcePairPoseSamples===12&&
   Array.isArray(result.fallbacks)&&result.fallbacks.length===3&&
   result.originalPhoto2DFallbackImages===3,
   'incomplete-genuine-3d-render-matrix');
  check(images&&typeof images==='object','missing-independent-png-digests');
  const expectedCaptures=new Set();
  for(const width of widths)for(const figure of figures)for(const denim of denims)for(const angle of angles)
   expectedCaptures.add(['source-pair',engine,width,figure,denim,angle].join('-')+'.png');
  let crossingVetoCases=0,uncertainCases=0,omittedFaces=0,faceCounts=0;
  const expectedSamples=new Set();
  for(const width of widths)for(const figure of figures)for(const denim of denims)
   expectedSamples.add([width,figure,denim].join('/'));
  for(const row of result.samples){
   const key=[row?.width,row?.figure,row?.denim].join('/');
   check(expectedSamples.delete(key),'missing-or-duplicate-real-rig-sample');
   check(Number.isFinite(row.loadMs)&&row.loadMs>=0&&
    Number.isFinite(row.medianRafIntervalMs)&&row.medianRafIntervalMs>0&&
    Number.isFinite(row.p95RafIntervalMs)&&row.p95RafIntervalMs>0&&
    Number.isSafeInteger(row.geometries)&&row.geometries>0&&
    Number.isSafeInteger(row.textures)&&row.textures>0,
    'missing-measured-browser-source-pair-sample');
   const layer=row.layer;
   check(layer?.schema==='parallel84-distinct-source-layer-contact/v1'&&
    layer.avatar===row.figure&&layer.pose==='relaxed'&&
    layer.sourcePair==='top-bottom'&&layer.actualSkinnedPoseSampled===true&&
    layer.sourceBuffersPreserved===true&&layer.anatomicalBodyMeshes>=1&&
    layer.distinctSourcePhotoMeshClaims===2&&
    layer.safe3D===false&&layer.contactClearanceProved===false&&
    layer.releaseAuthorized===false&&layer.humanRealismApproved===false&&
    layer.originalGarmentGeometryEdited===false&&layer.unobservedBacks===2&&
    layer.sampledPoseIsNotWholeGarmentClearance===true,
    'unsafe-or-forged-inherited-contact-claim');
   check(['STRICT_CROSSING_VETO','SOURCE_FACE_DEFECTS_UNRESOLVED','INCOMPLETE_BUDGET','UNCERTAIN_NOT_CLEARANCE'].includes(layer.status)&&
    Number.isSafeInteger(layer.fullOriginalSourceFaceCount)&&layer.fullOriginalSourceFaceCount>=1000&&
    Number.isSafeInteger(layer.sampledSourceFaceCount)&&layer.sampledSourceFaceCount>0&&
    Number.isSafeInteger(layer.originalFacesOmittedByBudget)&&
    layer.originalFacesOmittedByBudget===layer.fullOriginalSourceFaceCount-layer.sampledSourceFaceCount&&
    Number.isSafeInteger(layer.sourceFaceSamplingStride)&&layer.sourceFaceSamplingStride>=1&&
    typeof layer.budgetComplete==='boolean'&&
    Number.isSafeInteger(layer.strictTransverseCrossings)&&layer.strictTransverseCrossings>=0&&
    layer.anyCrossingVeto===(layer.strictTransverseCrossings>0)&&
    (layer.status!=='INCOMPLETE_BUDGET'||!layer.budgetComplete)&&
    (layer.status!=='STRICT_CROSSING_VETO'||layer.strictTransverseCrossings>0),
    'unmeasured-source-collision-or-false-clearance');
   if(layer.anyCrossingVeto)crossingVetoCases++;
   if(layer.status!=='STRICT_CROSSING_VETO')uncertainCases++;
   omittedFaces+=layer.originalFacesOmittedByBudget;
   faceCounts+=layer.sampledSourceFaceCount;
  }
  check(expectedSamples.size===0,'missing-original-shots');
  for(const capture of result.captures){
   check(expectedCaptures.delete(capture?.name)&&
    capture.actualLicensedPhotoMeshPair===true&&capture.real163BoneWebGL===true&&
    capture.photoRearUnobserved===true&&capture.changedGeometryByP84===false&&
    capture.sourceLayerProof&&
    sha(capture.sha256)&&images[capture.name]===capture.sha256&&
    Number.isSafeInteger(capture.imageWidth)&&capture.imageWidth>100&&
    Number.isSafeInteger(capture.imageHeight)&&capture.imageHeight>100,
    'missing-mismatched-or-forged-original-3d-screenshot');
  }
  check(expectedCaptures.size===0,'missing-webgl-pose-view');
  const expectedFallbacks=new Set(widths.map(x=>'original-2d-'+x+'.png'));
  for(const row of result.fallbacks){
   check(expectedFallbacks.delete(row?.name)&&row.actualLicensedOriginalPhoto2D===true&&
    sha(row.sha256)&&images[row.name]===row.sha256,
    '2d-photo-fallback-corrupt-or-missing');
  }
  check(expectedFallbacks.size===0&&Object.keys(images).length===51&&
    exactKeys(images,[...result.captures.map(x=>x.name),...result.fallbacks.map(x=>x.name)]),
    'extra-or-omitted-unverified-images');
  return Object.freeze({schema:'M2-P89-source-locked-genuine-P84-P541-two-piece-browser/v1',
   status:'TWO_GENUINE_PHOTOGRAPHED_ITEMS_RENDERED_NOT_3D_ACCEPTED',
   engine,exactP84:VERIFIED_DONOR89.p84,exactP541:VERIFIED_DONOR89.p541,
   sourcePhotosVerified:3,publicPhotoPairVariants:2,garmentCategories:2,
   originalJPEGsMatched:3,sourceCutoutsMatched:3,
   original163BoneAvatarsObserved:2,viewportWidths:widths,
   actualScreenshotCount:48,actual2DFallbacks:3,sampledPairs:12,
   sampledOriginalSourceFaces:faceCounts,
   excludedOriginalSourceFaces:omittedFaces,
   crossingVetoCases,nonCertifyingContactCases:uncertainCases,
   independentReviewerApproval:false,observedGarmentBacks:false,
   realContinuousClothProved:false,fullyMeasuredLayerClearance:false,
   physicalPhoneVerified:false,consumer3DAdmitted:false,
   sourcePhoto2DFallbackRequired:true,
   releaseAuthorized:false,familyAlpha:'HOLD'});
 }catch(e){return no(String(e.message).replace(/[^a-z0-9-]/gi,'').slice(0,80));}
}