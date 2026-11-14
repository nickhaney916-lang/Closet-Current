/** P91 genuine inherited original-photo/5-pose source 3D safety gate.
 * No independent physical fabric/photographic quality approval.
 */
import {verifyActualFivePosePhotoContact90,POSES90} from '../mission2-p90/five-pose-contact-gate.mjs';
import {SOURCE_SKIRT91} from './photographed-skirt-relief.mjs';
const id='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const figures=['female','male'];
const views=['front','side','rear'];
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const finite=n=>Number.isFinite(n)&&n>=0;
export function verifySourceSkirtRelief91({baseline=[],relief=[],visual=[]}={}){
 const issues=[];
 const required=(v,msg)=>{if(!v)issues.push(msg);};
 const base=verifyActualFivePosePhotoContact90(baseline);
 const shaped=verifyActualFivePosePhotoContact90(relief);
 required(base.status==='TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE',
  'original authenticated 5-pose skinned source baseline failed: '+base.issues.join(','));
 required(shaped.status==='TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE',
  'actual relived source skinned cloth collision/strain or source topology failed: '+shaped.issues.join(','));
 required(baseline.length===10&&relief.length===10&&visual.length===30,
  'exact real source 10 pose receipts + 30 triple-view original RGB comparisons required');
 let sampledSourceVertices=0,peak=0,sourcePixelsChanged=0,changedViews=0,comparisons=0;
 for(const [figureIndex,figure] of figures.entries()){
  for(const [poseIndex,pose] of POSES90.entries()){
   const i=figureIndex*5+poseIndex;
   const b=baseline[i],r=relief[i],p=r?.preview,d=p?.sourceSkirtDrapeResearch91;
   required(b?.figure===figure&&b?.pose===pose&&
    r?.figure===figure&&r?.pose===pose,'source figure/bone pose lost at '+i);
   required(p?.actualSkinnedMeshClone===true&&p?.liveSkeletonShared===true&&
    p?.realSkinBoneCount===163&&p?.originalSHA256===id&&
    p?.originalGeometryAndPhotoUVUntouched===true&&p?.releaseAuthorized===false,
    'real original photo/163-bone source unchanged proof absent at '+i);
   required(d?.schema==='M2-P91-provisional-sourced-hem-fall-true-SkinnedMesh'&&
    d?.sourceSHA256===id&&d?.actualGarmentGeometryBandMeasured===true&&
    d?.heuristicNotHumanDrapeAnnotation===true&&
    d?.originalSourceRestPhotoUVSkinAndPixelsUntouched===true&&
    d?.noClothPhysicsOrIndependentPhotoDrapeCertification===true&&
    d?.onlyOriginalPhotographedMainDressComponent===true&&
    d?.releaseAuthorized===false&&d?.familyAlpha==='HOLD',
    'experimental source-height candidate lacks photo and release safeguards at '+i);
   required(finite(d?.sourceHeightMeters)&&d.sourceHeightMeters>=.35&&
    d.sourceHeightMeters<=2&&
    d?.experimentalWaistAtActualGarmentFraction===
     SOURCE_SKIRT91.waistAtFractionOfActualGarmentHeight&&
    d?.drapeAmplitudeMeters===SOURCE_SKIRT91.amplitudeMeters&&
    d?.sourceSkirtHemWaveCount===SOURCE_SKIRT91.lobes&&
    uint(d?.movedRealSkinnedPhotoVertices)&&d.movedRealSkinnedPhotoVertices>=100&&
    finite(d?.maximumSampledHemReliefMeters)&&d.maximumSampledHemReliefMeters>.001&&
    d.maximumSampledHemReliefMeters<=SOURCE_SKIRT91.maxAllowedAmplitudeMeters&&
    finite(d?.maximumPoseSkinInverseResidualMeters)&&
    d.maximumPoseSkinInverseResidualMeters<=.00005,
    'measured actual source SkinnedMesh hem movement/residual invalid at '+i);
   if(uint(d?.movedRealSkinnedPhotoVertices))
    sampledSourceVertices+=d.movedRealSkinnedPhotoVertices;
   if(finite(d?.maximumSampledHemReliefMeters))
    peak=Math.max(peak,d.maximumSampledHemReliefMeters);
   for(let j=0;j<3;j++){
    const k=i*3+j,v=visual[k];
    required(v?.figure===figure&&v?.pose===pose&&v?.view===views[j],
     'authentic camera view/figure/pose RGB proof missing at '+k);
    required(uint(v?.originalVsBaselineChangedRGBPixelsAbove8)&&
     v.originalVsBaselineChangedRGBPixelsAbove8>0&&
     uint(v?.baselineVsReliefChangedRGBPixelsAbove8)&&
     uint(v?.restoredOriginalChangedRGBPixelsAbove8)&&
     v.restoredOriginalChangedRGBPixelsAbove8===0,
     'RGB original/Baseline/Hem/Restored evidence missing or source not restored at '+k);
    if(uint(v?.baselineVsReliefChangedRGBPixelsAbove8)){
     sourcePixelsChanged+=v.baselineVsReliefChangedRGBPixelsAbove8;
     changedViews+=Number(v.baselineVsReliefChangedRGBPixelsAbove8>0);
    }
    comparisons++;
   }
  }
 }
 required(changedViews>=6&&sourcePixelsChanged>=100,
  'hypothetical sourced skirt fall did not change enough actual WebGL pixels to evaluate');
 return Object.freeze({
  schema:'M2-P91-actual-licensed-source-photo-skirt-hem-five-pose-bounded-research',
  status:issues.length?'BLOCKED':'ACTUAL_SOURCE_DRAPE_HYPOTHESIS_RENDERED_NOT_PHOTOREALISM',
  authenticSourcePoseSamples:relief.length,
  actualWebGLRGBComparisons:comparisons,
  sourceAdjustedVerticesAcrossTenSamples:sampledSourceVertices,
  maximumActualFittedSourceHemReliefMeters:peak,
  actualRenderedBaselineVersusDrapeChangedRGBPixelsAbove8:sourcePixelsChanged,
  actualViewsWithMeasurableDrapeChange:changedViews,
  originalSourceRestoredWithoutPixelDifferences:issues.length===0,
  originalSourcePhotoSHA256:id,
  basePoseSourceContactGate:base.status,
  reliefPoseSourceContactGate:shaped.status,
  issues:[...new Set(issues)],
  allZeroSelfTopologyStillUncertifiedAsSewnSeams:true,
  skinContinuousSweptCollisionUnmeasured:true,
  noUserSourcePhotoHiddenDepthOrFabricPhysicsRecovered:true,
  noIndependentHumanPhotoDrapeApproval:true,
  consumer3DAdmission:false,physicalPhones:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
