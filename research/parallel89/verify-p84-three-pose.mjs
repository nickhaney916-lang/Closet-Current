/**
 * P89 separate audit of P84 REAL original source photographed shirt/jeans
 * across three genuine 163-bone shoulder poses, Chromium or WebKit.
 * Static triangle crossing witnesses are not swept collision/cloth clearance.
 * Every source-frame PNG is independently rehashed and RGB-diffed by CLI.
 */
import {VERIFIED_DONOR89 as P} from './verify-p84-public-pair.mjs';
const poses=['source','blend-50','relaxed'],angles=[0,90],
 figures=['female','male'],denims=['public','second'],variants=['baseline','gated'];
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const positive=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const require89=(condition,reason)=>{if(!condition)throw Error(reason)};
const refused=reason=>Object.freeze({
 schema:'P89-recheck-real-photo-multi-pose/v1',status:'SOURCE_POSE_NOT_VERIFIED',
 reason,sourcePhoto2DFallbackRequired:true,
 approvedReal3D:false,fullContinuousCollisionCertified:false,
 realDynamicClothCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
/** images = file byte digest and dimensions from independent sharp decode.
 * recomputedDiffs = independent PNG raw-RGB changed channels >12. Raw RGB,
 * owner metadata, geometry or private session data never enter output.
 */
export function auditActualPhotoPoseAB89({result,images,recomputedDiffs,engine}={}){
 try{
  require89(['chromium','webkit'].includes(engine)&&result?.engine===engine,
   'browser-engine-or-output-invalid');
  require89(result.schema==='P84-real-original-photo-163-bone-static-arm-pose-A-B/v1'&&
   result.width===390&&result.poseComparisons===3&&result.sourceOutfits===4&&
   result.totalScreenshotCount===48&&
   equal(result.actualPoseLabels,poses)&&
   equal(result.sourceSHA256,{shirt:P.shirt.originalSHA256,
    public:P.denims.public.originalSHA256,second:P.denims.second.originalSHA256})&&
   result.actualLicensedPhotographedSamples===true&&
   result.sourceDetachedImmutableDonor===true&&
   result.originalSourcePhotoBytesUnmodified===true&&
   result.sourceAlphaAndUVUnmodified===true&&
   result.browserEmulationNotPhysicalDevice===true&&
   result.sourceNeutralRearOnly===true&&
   result.skinnedBoneRotationNotTrueFabricDrape===true&&
   result.safeMotionCertified===false&&result.humanRealismApproved===false&&
   result.productionChanged===false&&result.familyAlpha==='HOLD'&&
   result.releaseAuthorized===false,
   'false-discrete-pose-source-or-release-claim');
  require89(Array.isArray(result.captures)&&result.captures.length===48&&
   Array.isArray(result.samples)&&result.samples.length===4&&
   images&&recomputedDiffs,'pose-matrix-or-independent-byte-evidence-incomplete');
  const expected=new Set();
  for(const figure of figures)for(const denim of denims)
   for(const variant of variants)for(const pose of poses)for(const angle of angles)
    expected.add(['P84',engine,figure,denim,variant,pose,angle].join('-')+'.png');
  for(const row of result.captures){
   const key=row?.name;
   require89(expected.delete(key)&&
    key===['P84',engine,row.figure,row.denim,row.variant,row.pose,row.angle].join('-')+'.png'&&
    row.realOriginalLicensedPhotographed163BoneSkinnedWebGL===true&&
    row.realPhone===false&&row.dynamicClothRefit===false&&
    row.ownerPhoto===false&&row.realismApproved===false&&
    hash(row.sha256)&&images[key]?.sha256===row.sha256&&
    images[key]?.width>100&&images[key]?.height>100,
    'missing-duplicate-forged-or-false-3d-pose-png');
   const size={width:images[key].width,height:images[key].height};
   if(frameDimensions)require89(equal(size,frameDimensions),
    'source-webgl-pose-comparison-frame-dimensions-differ');
   else frameDimensions=size;
  }
  require89(expected.size===0&&Object.keys(images).length===48,
   'missing-or-extra-photographic-source-frames');
  const expectedOutfits=new Set(),pairContactLedger=[];
  let frameDimensions=null;
  let originalTotal=0,refinedTotal=0,baselineContactWitnesses=0,
      refinedContactWitnesses=0,increasedPoseWitnesses=0,
      candidateTrials=0,refusedTrials=0,changedPixels=0,independentlyRecheckedTransitions=0;
  for(const row of result.samples){
   const key=[row?.figure,row?.denim].join('/');
   require89(expectedOutfits.has(key)===false&&figures.includes(row?.figure)&&
    denims.includes(row?.denim),'duplicate-or-invalid-outfit-pose');
   expectedOutfits.add(key);
   require89(positive(row.baselineMs)&&positive(row.refinedMs)&&
    row.originalPhotoUnchanged===true&&row.originalSkinned163BoneCloth===true&&
    row.rigidPoseIsNotFabricDynamicMotion===true&&
    row.continuousPoseSafetyCertified===false&&row.independentRealismApproved===false&&
    Array.isArray(row.poseWitnesses)&&row.poseWitnesses.length===3&&
    Array.isArray(row.pixelDiffs)&&row.pixelDiffs.length===6&&
    Array.isArray(row.visibleDistinctOriginalJointPoses)&&
    row.visibleDistinctOriginalJointPoses.length===2,
    'no-verified-genuine-rig-pose-or-false-physics');
   const expectedPoses=new Set(poses),expectedPixels=new Set();
   const perLayerBaseline={shirtBody:0,denimBody:0,shirtDenim:0};
   const perLayerRefined={shirtBody:0,denimBody:0,shirtDenim:0};
   let localIncreased=false;
   for(const witness of row.poseWitnesses){
    require89(expectedPoses.delete(witness?.pose)&&
     witness.safeMotionNotProven===true&&
     witness.baseline&&witness.refined&&witness.contactPairCountDeltas,
     'incomplete-pose-contact-witness');
    const keys=['shirtBody','denimBody','shirtDenim'];
    for(const k of keys){
     const a=witness.baseline[k],b=witness.refined[k],d=witness.contactPairCountDeltas[k];
     require89(integer(a)&&integer(b)&&Number.isSafeInteger(d)&&d===b-a,
      'falsified-source-contact-pose-delta');
     originalTotal+=a;refinedTotal+=b;
     perLayerBaseline[k]+=a;perLayerRefined[k]+=b;
     if(a>0)baselineContactWitnesses++;
     if(b>0)refinedContactWitnesses++;
    }
    const increase=Object.values(witness.contactPairCountDeltas).some(n=>n>0);
    require89(witness.anyIncreaseOverBaseline===increase,'hidden-contact-worsening');
    if(increase)increasedPoseWitnesses++;
    localIncreased||=increase;
   }
   require89(expectedPoses.size===0&&
    row.additionalStaticPoseContactReleaseBlock===localIncreased&&
    integer(row.sourcePoseNewContactPairs),
    'missing-static-pose-or-hidden-contact-block');
   require89(typeof row.shapeTrialApplied==='boolean'&&
    (!row.shapeTrialApplied||!localIncreased),
    'applied-source-shape-trial-has-increased-sampled-layer-contact');
   if(row.shapeTrialApplied){
    candidateTrials++;
    require89(row.sourcePoseNewContactPairs===0,
     'source-fitted-trial-has-new-source-triangle-intersections');
   }else refusedTrials++;
   for(const diff of row.pixelDiffs){
    const k=[diff?.pose,diff?.angle].join('/');
    require89(poses.includes(diff?.pose)&&angles.includes(diff?.angle)&&
     !expectedPixels.has(k),'missing-or-duplicate-genuine-source-ab-view');
    expectedPixels.add(k);
    const frameA=['P84',engine,row.figure,row.denim,'baseline',diff.pose,diff.angle].join('-')+'.png';
    const frameB=['P84',engine,row.figure,row.denim,'gated',diff.pose,diff.angle].join('-')+'.png';
    const rk=frameA+'|'+frameB;
    require89(integer(diff.changedRGBChannelsAbove12)&&
     recomputedDiffs[rk]===diff.changedRGBChannelsAbove12,
     'reported-source-shape-rgb-difference-not-real-pixels');
    changedPixels+=diff.changedRGBChannelsAbove12;
    independentlyRecheckedTransitions++;
   }
   require89(expectedPixels.size===6,'original-vs-candidate-source-AB-not-complete');
   const expectedJoints=[['source','blend-50'],['blend-50','relaxed']];
   for(let i=0;i<2;i++){
    const value=row.visibleDistinctOriginalJointPoses[i],
       [from,to]=expectedJoints[i];
    const frameA=['P84',engine,row.figure,row.denim,'gated',from,0].join('-')+'.png',
      frameB=['P84',engine,row.figure,row.denim,'gated',to,0].join('-')+'.png';
    require89(value?.from===from&&value?.to===to&&
     integer(value.channelsChangedAbove12)&&value.channelsChangedAbove12>5000&&
     recomputedDiffs[frameA+'|'+frameB]===value.channelsChangedAbove12,
     'actual-distinct-anatomical-joint-pose-rgb-not-observed');
    independentlyRecheckedTransitions++;
   }
   pairContactLedger.push(Object.freeze({
    avatar:row.figure,denimSource:row.denim,
    originalSourcePoseCount:3,
    baselineStrictSourceCrossingsByLayer:Object.freeze(perLayerBaseline),
    candidateStrictSourceCrossingsByLayer:Object.freeze(perLayerRefined),
    candidateStaticCrossingsRemain:Object.values(perLayerRefined).some(n=>n>0),
    witnessedIncreasedContactAtAnyPose:localIncreased,
    researchTrialApplied:row.shapeTrialApplied,
    sourcePhoto2DFallbackRequired:true,continuousMotionSafetyProved:false,
    consumer3DAuthorized:false
   }));
  }
  require89(expectedOutfits.size===4,'missing-genuine-source-poses');
  return Object.freeze({
   schema:'P89-recheck-real-photo-multi-pose/v1',
   status:'ACTUAL_THREE_RIG_POSES_REHASHED_NOT_MOTION_CLEARED',
   engine,donorP84:P.p84,donorP541:P.p541,
   realPhotographedSourceFilesVerifiedByCLI:3,
   independentPNGHashMatches:48,actualSourceFittedGarmentPairs:4,
   nativeSourcePoseFrameDimensions:frameDimensions,
   sourcePairContactLedger:Object.freeze(pairContactLedger),
   originalPhotoTwoPieceClearanceProved:false,
   original163BoneAvatarsObserved:2,originalPhotoSourceDenims:2,
   nativeBrowserEmulatedViewport:390,poseCount:3,angles,
   originalVsFittedStaticComparisonViews:24,
   independentlyRecomputedRGBChecks:independentlyRecheckedTransitions,
   sourcePairTriangleCountsAreStrictTransverseWitnessesNotClearance:true,
   baselineCrossingPairSumAcrossNineLayerPoseTypes:originalTotal,
   fittedCrossingPairSumAcrossNineLayerPoseTypes:refinedTotal,
   baselineNonzeroLayerPoseWitesses:baselineContactWitnesses,
   fittedNonzeroLayerPoseWitnesses:refinedContactWitnesses,
   increasedContactPoseWitnesses:increasedPoseWitnesses,
   appliedSourceFittingTrials:candidateTrials,refusedSourceFittingTrials:refusedTrials,
   changedRGBChannelsAbove12InABComparisons:changedPixels,
   continuousClothDynamicsProved:false,sweptCollisionCertified:false,
   signedOwnerGarmentLeaseVerified:false,independentHumanRealismApproval:false,
   physicalPhoneVerified:false,unknownRearStillInferred:true,
   sourcePhoto2DFallbackRequired:true,consumer3DAuthorized:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){return refused(String(e.message).replace(/[^a-z0-9-]/gi,'').slice(0,100));}
}
