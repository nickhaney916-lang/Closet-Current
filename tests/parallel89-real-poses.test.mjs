import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {VERIFIED_DONOR89 as P} from '../research/parallel89/verify-p84-public-pair.mjs';
import {auditActualPhotoPoseAB89} from '../research/parallel89/verify-p84-three-pose.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const poses=['source','blend-50','relaxed'];
const angles=[0,90],figures=['female','male'],denims=['public','second'],
 variants=['baseline','gated'];
/** Entirely SYNTHETIC test rows. The genuine-source, real Chromium/WebKit
 * scene + actual PNG byte+RGB verifier runs separately in no-deploy CI.
 */
function mock(){
 const engine='chromium',images={},recomputedDiffs={};
 const result={
  schema:'P84-real-original-photo-163-bone-static-arm-pose-A-B/v1',engine,width:390,
  sourceSHA256:{shirt:P.shirt.originalSHA256,
   public:P.denims.public.originalSHA256,second:P.denims.second.originalSHA256},
  actualLicensedPhotographedSamples:true,sourceDetachedImmutableDonor:true,
  actualPoseLabels:poses,poseComparisons:3,sourceOutfits:4,totalScreenshotCount:48,
  originalSourcePhotoBytesUnmodified:true,sourceAlphaAndUVUnmodified:true,
  browserEmulationNotPhysicalDevice:true,sourceNeutralRearOnly:true,
  skinnedBoneRotationNotTrueFabricDrape:true,safeMotionCertified:false,
  humanRealismApproved:false,productionChanged:false,
  familyAlpha:'HOLD',releaseAuthorized:false,captures:[],samples:[]
 };
 const n=(figure,denim,variant,pose,angle)=>
  ['P84',engine,figure,denim,variant,pose,angle].join('-')+'.png';
 for(const figure of figures)for(const denim of denims){
  for(const variant of variants)for(const pose of poses)for(const angle of angles){
   const name=n(figure,denim,variant,pose,angle),sha256=sha(name);
   images[name]={sha256,width:390,height:600};
   result.captures.push({name,pose,angle,figure,denim,variant,
    sha256,realOriginalLicensedPhotographed163BoneSkinnedWebGL:true,
    realPhone:false,dynamicClothRefit:false,ownerPhoto:false,
    realismApproved:false});
  }
  const poseWitnesses=poses.map(pose=>({pose,
   baseline:{shirtBody:0,denimBody:2,shirtDenim:0},
   refined:{shirtBody:0,denimBody:2,shirtDenim:0},
   contactPairCountDeltas:{shirtBody:0,denimBody:0,shirtDenim:0},
   anyIncreaseOverBaseline:false,safeMotionNotProven:true}));
  const pixelDiffs=[];
  for(const pose of poses)for(const angle of angles){
   const left=n(figure,denim,'baseline',pose,angle);
   const right=n(figure,denim,'gated',pose,angle);
   recomputedDiffs[left+'|'+right]=30;
   pixelDiffs.push({pose,angle,changedRGBChannelsAbove12:30});
  }
  for(const [from,to] of [['source','blend-50'],['blend-50','relaxed']])
   recomputedDiffs[n(figure,denim,'gated',from,0)+'|'+n(figure,denim,'gated',to,0)]=6001;
  result.samples.push({
   figure,denim,baselineMs:200,refinedMs:250,
   originalPhotoUnchanged:true,originalSkinned163BoneCloth:true,
   shapeTrialApplied:true,
   visibleDistinctOriginalJointPoses:[
    {from:'source',to:'blend-50',channelsChangedAbove12:6001},
    {from:'blend-50',to:'relaxed',channelsChangedAbove12:6001}
   ],
   rigidPoseIsNotFabricDynamicMotion:true,
   sourcePoseNewContactPairs:0,
   poseWitnesses,pixelDiffs,
   additionalStaticPoseContactReleaseBlock:false,
   continuousPoseSafetyCertified:false,
   independentRealismApproved:false
  });
 }
 return {result,images,recomputedDiffs,engine};
}
test('synthetic three-pose proof-shape only: separate actual PNG proof requires real CI',()=>{
 const receipt=auditActualPhotoPoseAB89(mock());
 assert.equal(receipt.status,'ACTUAL_THREE_RIG_POSES_REHASHED_NOT_MOTION_CLEARED');
 assert.equal(receipt.independentPNGHashMatches,48);
 assert.equal(receipt.independentlyRecomputedRGBChecks,32);
 assert.equal(receipt.appliedSourceFittingTrials,4);
 assert.equal(receipt.consumer3DAuthorized,false);
 assert.equal(receipt.sweptCollisionCertified,false);
 assert.equal(receipt.fittedCrossingPairSumAcrossNineLayerPoseTypes,24);
 assert.deepEqual(receipt.nativeSourcePoseFrameDimensions,{width:390,height:600});
 assert.equal(receipt.sourcePairContactLedger.length,4);
 assert.ok(receipt.sourcePairContactLedger.every(row=>
  row.originalSourcePoseCount===3&&row.candidateStaticCrossingsRemain===true&&
  row.sourcePhoto2DFallbackRequired===true&&row.consumer3DAuthorized===false&&
  row.candidateStrictSourceCrossingsByLayer.denimBody===6));
 assert.equal(receipt.originalPhotoTwoPieceClearanceProved,false);
 assert.ok(receipt.sourcePairContactLedger.every(row=>
  row.originalSourcePoseContactWitnesses.length===3&&
  row.originalSourcePoseContactWitnesses.every(p=>
   p.staticSurfaceCrossingsOnly===true&&p.continuousContactNotMeasured===true&&
   p.candidate.denimBody===2&&p.baseline.denimBody===2&&p.perLayerDelta.denimBody===0)&&
  row.zeroStaticTriangleCrossingsStillNotPhysicalClearance===true&&
  row.signedDistanceAndBodyContainmentNotMeasured===true&&
  row.physicallySweptInterposeMotionNotMeasured===true));
});
test('all-zero measured static photo/rig crossings still cannot prove true garment clearance or admit consumer 3D',()=>{
 const row=mock();
 for(const outfit of row.result.samples)for(const pose of outfit.poseWitnesses){
  for(const key of ['shirtBody','denimBody','shirtDenim']){
   pose.baseline[key]=0;pose.refined[key]=0;pose.contactPairCountDeltas[key]=0;
  }
 }
 const receipt=auditActualPhotoPoseAB89(row);
 assert.equal(receipt.status,'ACTUAL_THREE_RIG_POSES_REHASHED_NOT_MOTION_CLEARED');
 assert.equal(receipt.fittedCrossingPairSumAcrossNineLayerPoseTypes,0);
 assert.ok(receipt.sourcePairContactLedger.every(x=>
  x.candidateStaticCrossingsRemain===false&&
  x.zeroStaticTriangleCrossingsStillNotPhysicalClearance===true&&
  x.originalSourcePoseContactWitnesses.every(p=>
   Object.values(p.candidate).every(v=>v===0))));
 assert.equal(receipt.originalPhotoTwoPieceClearanceProved,false);
 assert.equal(receipt.continuousClothDynamicsProved,false);
 assert.equal(receipt.sweptCollisionCertified,false);
 assert.equal(receipt.consumer3DAuthorized,false);
 assert.equal(receipt.sourcePhoto2DFallbackRequired,true);
});
const negative=[
 ['fake human realism',x=>x.result.humanRealismApproved=true],
 ['fake swept motion',x=>x.result.safeMotionCertified=true],
 ['incorrect original JPEG hash',x=>x.result.sourceSHA256.second='a'.repeat(64)],
 ['incorrect source photo owner',x=>x.result.productionChanged=true],
 ['incorrect source rights',x=>x.result.sourceNeutralRearOnly=false],
 ['missing real frame',x=>x.result.captures.pop()],
 ['inconsistent native screenshot dimensions',x=>x.images[x.result.captures[0].name].height=610],
 ['fabric fit asserted without a boolean trial decision',x=>x.result.samples[0].shapeTrialApplied='true'],
 ['applied fit has newly increased witnessed collision counts',x=>{
   const row=x.result.samples[0],w=row.poseWitnesses[0];
   w.refined.shirtDenim=1;w.contactPairCountDeltas.shirtDenim=1;
   w.anyIncreaseOverBaseline=true;row.additionalStaticPoseContactReleaseBlock=true;
 }],
 ['duplicate original image',x=>x.result.captures[0]=x.result.captures[1]],
 ['mismatched source PNG hash',x=>x.images[x.result.captures[0].name].sha256='b'.repeat(64)],
 ['wrong photograph pose',x=>x.result.captures[0].pose='walking'],
 ['fake posed WebGL',x=>x.result.captures[0].realOriginalLicensedPhotographed163BoneSkinnedWebGL=false],
 ['missing mannequin',x=>x.result.samples.pop()],
 ['duplicate outfit',x=>x.result.samples[0]=x.result.samples[1]],
 ['fake original pose restoration',x=>x.result.sourceAlphaAndUVUnmodified=false],
 ['static pose not all present',x=>x.result.samples[0].poseWitnesses.pop()],
 ['witness pose identity wrong',x=>x.result.samples[0].poseWitnesses[0].pose='relaxed'],
 ['false contact delta',x=>x.result.samples[0].poseWitnesses[0].contactPairCountDeltas.denimBody=1],
 ['falsely hidden increased contact',x=>x.result.samples[0].poseWitnesses[0].refined.denimBody=3],
 ['fake motion contact approval',x=>x.result.samples[0].continuousPoseSafetyCertified=true],
 ['trial introduced crossing',x=>x.result.samples[0].sourcePoseNewContactPairs=1],
 ['refined image RGB mismatch',x=>x.recomputedDiffs[Object.keys(x.recomputedDiffs)[0]]=99],
 ['pose names without changed pixels',x=>x.result.samples[0].visibleDistinctOriginalJointPoses[0].channelsChangedAbove12=5],
 ['real source diff forged',x=>x.result.samples[0].visibleDistinctOriginalJointPoses[0].channelsChangedAbove12=7000],
 ['missing diff observation',x=>x.result.samples[0].pixelDiffs.pop()],
 ['incorrect source waist crossing class',x=>x.result.samples[0].poseWitnesses[0].baseline.shirtBody=-3],
 ['false device claim',x=>x.result.browserEmulationNotPhysicalDevice=false],
 ['fake release authorization',x=>x.result.releaseAuthorized=true],
 ['extra unproven file',x=>x.images['user-private-avatar.png']={sha256:sha('x'),width:390,height:600}]
];
for(const [name,mutate] of negative)test('P89 pose certificate rejects '+name,()=>{
 const row=mock();mutate(row);
 const receipt=auditActualPhotoPoseAB89(row);
 assert.equal(receipt.status,'SOURCE_POSE_NOT_VERIFIED');
 assert.equal(receipt.sourcePhoto2DFallbackRequired,true);
 assert.equal(receipt.approvedReal3D,false);
 assert.equal(receipt.releaseAuthorized,false);
});
test('a measured original crossing is recorded as failure of original clearance, not a non-crossing certificate',()=>{
 const row=mock(),target=row.result.samples[0].poseWitnesses[0];
 target.baseline.shirtDenim=2;
 target.refined.shirtDenim=3;
 target.contactPairCountDeltas.shirtDenim=1;
 target.anyIncreaseOverBaseline=true;
 row.result.samples[0].additionalStaticPoseContactReleaseBlock=true;
 row.result.samples[0].shapeTrialApplied=false;
 const report=auditActualPhotoPoseAB89(row);
 assert.equal(report.status,'ACTUAL_THREE_RIG_POSES_REHASHED_NOT_MOTION_CLEARED');
 assert.equal(report.increasedContactPoseWitnesses,1);
 assert.equal(report.consumer3DAuthorized,false);
 assert.equal(report.sourcePairContactLedger[0].witnessedIncreasedContactAtAnyPose,true);
 assert.equal(report.sourcePairContactLedger[0].candidateStrictSourceCrossingsByLayer.shirtDenim,3);
});
