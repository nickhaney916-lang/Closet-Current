/**
 * MAIN1054 M48. Read-only contract that rejects promotion of a real original-
 * photograph M47 V-neck *fragment visibility* receipt to physical 3D clothing.
 * It cannot authorize any consumer garment. It does not change a single
 * image, skeleton, 3D source mesh, owner account or production file.
 */
import {M47} from '../main1054-3d47/fragment-visibility-trial.mjs';

export const M48=Object.freeze({
 schema:'MAIN1054_M48_SOURCE_VNECK_PHYSICAL_EDGE_ADMISSION_VETO/v1',
 priorReceipt:'MAIN1054_M47_ORIGINAL_P93_M45_BLEND_VS_TRUE_FRAGMENT_ALPHA_HOLE_AB/v1',
 sourceSHA256:M47.originalSHA256,
 reason:'Shader discard is NOT a cut mesh, collar binding, sewn edge, underside or photographed back',
 consumer3DAdmitted:false,
 releaseAuthorized:false,
 familyAlpha:'HOLD'
});
const deny=reason=>{throw Error('MAIN1054 M48 VNECK PHOTO GEOMETRY EVIDENCE BLOCKED: '+reason);};
const goodNum=x=>Number.isSafeInteger(x)&&x>=0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const variants=['P93','M45','M45_HOLE'];
const figures=['female','male'],poses=['source','blend-50','relaxed'],views=['front','side'];

/**
 * Validate a genuinely executed M47 browser receipt, and produce a
 * conservative NO-ADMISSION verdict. Tests use synthetic fixtures; only the
 * separately executed M47 native Chrome/WebKit jobs generate real evidence.
 */
export function auditNativePhotoNecklinePhysicalEdge48(receipt,{expectedEngine}={}){
 if(!receipt||typeof receipt!=='object'||
    !['chromium','webkit'].includes(expectedEngine)||
    receipt.engine!==expectedEngine||receipt.schema!==M48.priorReceipt||
    receipt.originalLicensedSourceSHA256!==M48.sourceSHA256||
    receipt.originalSourceRGBPreserved!==true||
    receipt.originalWork47AndDonorManifestsUnchanged!==true||
    receipt.actualResearchNativeWebGL2!==true||
    receipt.exactAnatomical163Bones!==true||
    receipt.realPhotographedMaskTextureCompared!==true||
    receipt.originalPhotoUVProjectionCropIdentical!==true||
    receipt.photoUVGeometryCrossConditionIdentityNotYetProven!==false||
    receipt.noActualClothGeometryCutOrNewSeam!==true||
    receipt.noPhysicalOriginalDressMeshHoleCreated!==true||
    receipt.sourceAlphaOnlyVisibilityExperimentValid!==true||
    receipt.sourceAlphaOnlyVisibilityChangeMeasured!==true||
    receipt.noIndependentHumanOriginalTextureAcceptance!==true||
    receipt.originalPhoto2DFallbackRequired!==true||
    receipt.continuousClothBodyOrSelfCollisionNotCertified!==true||
    receipt.sourcePhotoRearUnobserved!==true||
    receipt.realOwnerSigned3DAdmitted!==false||
    receipt.consumer3DAdmitted!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD'||
    !same(receipt.variants,variants)||!same(receipt.figures,figures)||
    !same(receipt.poses,poses)||!same(receipt.views,views)||
    !goodNum(receipt.originalSourceP93AlphaChanged)||
    receipt.originalSourceP93AlphaChanged!==12961||
    receipt.m45ExtraSourceAlphaTransparent!==4890||
    !goodNum(receipt.incrementalTrueFragmentAlphaHoleChangedPixels)||
    receipt.incrementalTrueFragmentAlphaHoleChangedPixels===0||
    receipt.actualViewsWithIncrementalShaderCutoutPixels!==12)
  deny('missing exact original source 163-bone photo/renderer/release-denial facts');

 const proof=receipt.sourceVisibilitySafety47;
 if(!proof||proof.schema!=='MAIN1054_M47_AUTHENTIC_SOURCE_ALPHA_VISIBILITY_COMPARISON_CHECK/v1'||
    proof.actualSource3DScenes!==36||proof.matchedNative3DSourceMaskComparisons!==12||
    proof.originalLicensedJPEGVerified!==true||
    proof.originalProjectedPhotoCropSameAcrossAllVariants!==true||
    proof.alphaVisibilityCutNotPhysicalClothGeometry!==true||
    proof.humanPhotoAndMaterialReviewNotPerformed!==true||
    proof.contactSweepContinuousNotCertified!==true||
    proof.sourceBacksideNotPhotographed!==true||
    proof.noConsumer3DAdmission!==true||proof.releaseAuthorized!==false)
  deny('original 3D visibility source audit is missing or misrepresented');

 const crops=variants.map(v=>receipt.sourceCropRects?.[v]);
 if(crops.some(c=>!Array.isArray(c)||c.length!==4||
    c.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>1))||
    !crops.every(c=>same(c,crops[0])))
  deny('one original photo must use identical actual projected source crops');

 const scenes=receipt.scenes;
 if(!Array.isArray(scenes)||scenes.length!==36)
  deny('36 actually rendered skinned source scenes missing');
 const keys=new Set(),physicalByPose=new Map();
 for(const scene of scenes){
  const key=[scene.variant,scene.figure,scene.pose,scene.view].join('/');
  if(keys.has(key)||!variants.includes(scene.variant)||
     !figures.includes(scene.figure)||!poses.includes(scene.pose)||
     !views.includes(scene.view)||scene.nativeBrowserScreenshot!==true||
     !/^[a-f0-9]{64}$/.test(scene.screenshotSHA256||'')||
     scene.originalPhotographerSourceSHA256!==M48.sourceSHA256||
     scene.actualBoneCount!==163||
     scene.originalGeometryAndPhotoUVUntouched!==true||
     !goodNum(scene.sourceGarmentParts)||scene.sourceGarmentParts===0||
     !goodNum(scene.fittedVertices)||scene.fittedVertices<1000||
     !goodNum(scene.anatomicalBodyFaces)||scene.anatomicalBodyFaces<100000||
     !goodNum(scene.sourceGarmentTriangles)||scene.sourceGarmentTriangles<3000||
     scene.sampledCrossBodyStrictWitnesses!==0||
     scene.sampledSelfStrictWitnesses!==0||
     !goodNum(scene.ambiguousBodyNearUnresolved)||
     !goodNum(scene.ambiguousSelfNearUnresolved)||
     scene.photo2DFallbackRequired!==true||scene.releaseAuthorized!==false)
   deny('invalid original source photograph/posed scene/unchanged geometry claim');
  keys.add(key);
  const poseKey=[scene.figure,scene.pose,scene.view].join('/');
  const shape=[scene.fittedVertices,scene.anatomicalBodyFaces,
   scene.sourceGarmentTriangles,scene.sourceGarmentParts,
   scene.ambiguousBodyNearUnresolved,scene.ambiguousSelfNearUnresolved];
  const previous=physicalByPose.get(poseKey);
  if(previous&&!same(previous,shape))
   deny('fragment effect changed actual source garment geometry or sampled contact');
  physicalByPose.set(poseKey,shape);
 }
 if(keys.size!==36||physicalByPose.size!==12)
  deny('missing figure, pose, camera or original mask condition');

 // M47 loops P93 -> M45 then M45 -> [M45, M45_HOLE]. Its
 // SAME-BYTES M45__M45 row group is an independent 12-scene zero-change
 // control, not evidence of real-world garment geometry or color.
 const comparisonSets=receipt.comparisons;
 const expectedPairs=[
  ['P93','M45'],['M45','M45'],['M45','M45_HOLE']
 ];
 const labels=expectedPairs.map(([a,b])=>a+'__'+b);
 if(!comparisonSets||typeof comparisonSets!=='object'||
    !same(Object.keys(comparisonSets).sort(),[...labels].sort()))
  deny('all three original native screenshot pairs, including zero-change control, required');
 const totals={};
 for(const [a,b] of expectedPairs){
  const name=a+'__'+b,rows=comparisonSets[name];
  if(!Array.isArray(rows)||rows.length!==12)
   deny('each original source photo comparison must contain 12 camera/pose combinations');
  const seen=new Set();
  let total=0,visible=0;
  for(const row of rows){
   const k=[row.figure,row.pose,row.view].join('/');
   if(seen.has(k)||!figures.includes(row.figure)||!poses.includes(row.pose)||
      !views.includes(row.view)||!goodNum(row.changedRGBPixelsAbove8)||
      row.sourceVariantA!==a||row.sourceVariantB!==b||
      row.changesOutsideObservedNecklineROI!==0||
      row.sourceNecklineScreenRegionChanges!==row.changedRGBPixelsAbove8||
      row.actualFragmentHoleIsNotPhysicalOpening!==true||
      row.originalJpegAndUVUnchanged!==true||
      row.releaseAuthorized!==false||
      (a===b&&row.changedRGBPixelsAbove8!==0))
    deny('original-source ROI or zero-change same-byte control mismatch');
   seen.add(k);
   total+=row.changedRGBPixelsAbove8;
   if(row.changedRGBPixelsAbove8>0)visible++;
  }
  totals[name]={total,visible};
 }
 if(totals.P93__M45.total!==receipt.baselineSourceAlphaBlendChangedPixels||
    totals.M45__M45.total!==0||
    totals.M45__M45_HOLE.total!==receipt.incrementalTrueFragmentAlphaHoleChangedPixels||
    totals.M45__M45_HOLE.visible!==receipt.actualViewsWithIncrementalShaderCutoutPixels)
  deny('native original-photo browser totals or 12-view visual effect inconsistent');
 return Object.freeze({
  schema:M48.schema,engine:expectedEngine,originalPhotoSHA256:M48.sourceSHA256,
  genuineSourceScenesAudited:36,matchedNativePoseViews:12,
  observedFragmentVisibilityPixels:receipt.incrementalTrueFragmentAlphaHoleChangedPixels,
  documentedTransparentSourceVs3DPhysicalEdgeGap:true,
  actualSewnCollarEdgeReconstructed:false,
  originalBacksidePhotographicallyObserved:false,
  continuousFitAndContactAccepted:false,
  humanOriginalPhotoVisualReviewAccepted:false,
  ownerAuthenticated3DConsumerApproved:false,
  verdict:'BLOCK_PHYSICAL_3D_ADMISSION_RETAIN_OWNER_ORIGINAL_PHOTO_2D',
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
