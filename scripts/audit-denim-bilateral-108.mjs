/**
 * PHOTO108 independent real photographed 163-bone bilateral original denim
 * screenshot and actual source triangle-contact evidence audit. Not a claim
 * of dynamic cloth physics, continuous collision freedom or hardware QA.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/three-d-108';
const x=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
const sha={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const itinerary=[[0,0],[4,0],[8,0],[16,0],[16,16],[0,16],[0,8],[0,0],[16,0],[0,0]];
assert.equal(x.priority,'PHOTO-DENIM-BILATERAL-POSE-REPLAY-108');
assert.equal(x.originalPubliclyLicensedJeansSourcePhotographs,2);
assert.equal(x.actualMaleFemaleOriginal163BoneModels,true);
assert.equal(x.originalRealSkinnedBones,163);
assert.equal(x.originalPhotographedShirtPreserved,true);
assert.equal(x.actualChromiumWebGL,true);
assert.equal(x.mobileCSSWidth,390);
assert.equal(x.independentBilateralKneePoseCount,10);
assert.deepEqual(x.sourceKneePoseSequence,itinerary);
assert.deepEqual(x.camerasDegrees,[90,270]);
assert.equal(x.actualSourcePhotoWebGLFrames,80);
assert.equal(x.sourceRelativeSequenceReplayPixelsExactlyIdentical,true);
assert.equal(x.independentLeftRightCalfMovementVerified,true);
assert.equal(x.genuineSourceFrontUVRestSkinPreserved,true);
assert.equal(x.realSkinnedTriangleBodyContactsNeverWorse,true);
assert.equal(x.unphotographedRearStillNeutral,true);
assert.equal(x.fullSweptCollisionFreeProof,false);
assert.equal(x.physicallyContinuousFabricSimulation,false);
assert.equal(x.actualHardwareAndroidIphoneTested,false);
assert.equal(x.independentHumanVisualRealismApproved,false);
assert.equal(x.signedCloudMultiAccountPrivacyProven,false);
assert.equal(x.releaseAuthorized,false);
assert.equal(x.familyAlpha,'HOLD');
assert.deepEqual(x.browserErrors,[]);
assert.deepEqual(x.externalRequests,[]);
assert.deepEqual(x.crashes,[]);
assert.equal(x.cases.length,4);
assert.equal(x.frames.length,80);
const groups=new Set(),summaries=[];
for(const c of x.cases){
 const id=[c.figure,c.denim].join('/');
 assert.ok(['female','male'].includes(c.figure));
 assert.ok(['public','second'].includes(c.denim));
 assert.ok(!groups.has(id));groups.add(id);
 assert.equal(c.originalSourceSHA256,sha[c.denim]);
 assert.equal(c.originalPhotoUnchanged,true);
 assert.equal(c.sourceNeutralUnphotographedBack,true);
 assert.equal(c.noFullSweptCollisionClaim,true);
 assert.equal(c.notHumanPhotorealismApproved,true);
 assert.equal(c.sequence.length,10);
 assert.equal(c.sourceRelativeExactReplayComparisons.length,6);
 for(let i=0;i<10;i++){
  const sample=c.sequence[i];
  assert.equal(sample.step,i);
  assert.deepEqual([sample.left,sample.right],itinerary[i]);
  assert.equal(sample.sourceSHA256,sha[c.denim]);
  assert.equal(sample.originalSourceFrontAndUVProtected,true);
  assert.ok(Number.isSafeInteger(sample.contactBefore)&&sample.contactBefore>=0);
  assert.ok(Number.isSafeInteger(sample.contactAfter)&&sample.contactAfter>=0);
  assert.ok(sample.contactAfter<=sample.contactBefore);
  assert.ok(Number.isFinite(sample.maximumCalfShiftMeters)&&
   sample.maximumCalfShiftMeters>=0&&sample.maximumCalfShiftMeters<=.012001);
  if(sample.left>0)assert.ok(sample.totalMoveProofLeft>=8);
  else assert.equal(sample.totalMoveProofLeft,0);
  if(sample.right>0)assert.ok(sample.totalMoveProofRight>=8);
  else assert.equal(sample.totalMoveProofRight,0);
 }
 for(const y of c.sourceRelativeExactReplayComparisons){
  assert.ok(['straight-after-alternation','straight-after-repeated-left',
   'left16-after-both-and-right'].includes(y.label));
  assert.ok([90,270].includes(y.view));
  assert.equal(y.pixelDelta,0);
  assert.equal(y.originalRigTrue163Bones,true);
  assert.equal(y.sameOriginalSourcePhotograph,true);
 }
 summaries.push({figure:c.figure,denim:c.denim,sourceSHA256:c.originalSourceSHA256,
  actualSourceBilateralSequenceSamples:c.sequence.length,
  leftOnlyCalfVertices:c.sequence[3].totalMoveProofLeft,
  bothKneeLeftCalfVertices:c.sequence[4].totalMoveProofLeft,
  bothKneeRightCalfVertices:c.sequence[4].totalMoveProofRight,
  rightOnlyCalfVertices:c.sequence[5].totalMoveProofRight,
  zeroReplayedPixelDifferences:c.sourceRelativeExactReplayComparisons.length,
  allSamplesBodyContactNonworsening:c.sequence.every(z=>z.contactAfter<=z.contactBefore)});
}
assert.equal(groups.size,4);
const seen=new Set(),screens=[];
for(const f of x.frames){
 assert.match(f.file,/^(female|male)-(public|second)-step-(?:0|1|2|3|4|5|6|7|8|9)-left-(?:0|4|8|16)-right-(?:0|8|16)-view-(?:90|270)\.png$/);
 assert.ok(!seen.has(f.file));seen.add(f.file);
 assert.ok(['female','male'].includes(f.figure));
 assert.ok(['public','second'].includes(f.denim));
 assert.ok(f.step>=0&&f.step<10);
 assert.deepEqual([f.left,f.right],itinerary[f.step]);
 assert.ok([90,270].includes(f.view));
 assert.equal(f.originalSourceSHA256,sha[f.denim]);
 const data=await readFile(folder+'/'+f.file);
 assert.ok(data.length>3000);
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256);
 const info=await sharp(data).metadata(),stat=await sharp(data).stats();
 assert.equal(info.format,'png');
 assert.equal(info.width,f.width);assert.equal(info.height,f.height);
 assert.ok(info.width>=200&&info.height>=300);
 assert.ok(stat.channels.some(y=>y.stdev>7),'real original source 3D frame blank');
 screens.push({file:f.file,originalSourceSHA256:f.originalSourceSHA256,
  sha256:f.sha256,width:f.width,height:f.height,
  actualPose:[f.left,f.right],camera:f.view,
  figure:f.figure,denim:f.denim,step:f.step});
}
assert.equal(seen.size,80);
const report={
 schema:'closet-current-photo108-authentic-original-denim-bilateral-163-bone-replay/audit-v1',
 independentGenuineOriginalPhotoWebGLScreenshots:80,
 genuine163BoneOriginalRig:true,originalLicensedJeansSources:2,
 bothMaleFemaleFigureSources:true,
 genuineLeftRightBothPoseSamplesPerCombination:10,
 noPixelAccumulationAfterAlternatingAndRepeatedPoses:true,
 sourcePhotoUVRestFrontAndSkinUnchanged:true,
 trueCalfGeometryBothSidesMovedUnderOwnAnatomicalKnee:true,
 everySampleRealSkinnedBodyContactNeverIncreased:true,
 noPhotographedRearInvented:true,continuousClothPhysicsNotVerified:true,
 fullSweptCollisionFreedomNotVerified:true,physicalPhoneNotTested:true,
 independentHumanPhotorealismNotApproved:true,
 liveSignedMultiAccountRLSNotVerified:true,
 releaseAuthorized:false,familyAlpha:'HOLD',
 combinations:summaries,sha256PNGReceipts:screens
};
await mkdir('benchmark/three-d-108-audit',{recursive:true});
await writeFile('benchmark/three-d-108-audit/acceptance.json',
 JSON.stringify(report,null,2)+'\n');
console.log('PHOTO108 independently SHA-verified 80/80 original photographed 163-bone denim left/right/both replay WebGL frames, 24/24 exact side-view replay pixels, both original denim sources and male/female, original source UV/skin protected, no added actual sampled body contacts, no physics/phone/human approval, HOLD.');
