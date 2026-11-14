import test from 'node:test';
import assert from 'node:assert/strict';
import {SOURCE_SKIRT91,calculateSourceSkirtRelief91,deriveSourceSkirtBand91} from '../research/mission2-p91/photographed-skirt-relief.mjs';
import {verifySourceSkirtRelief91} from '../research/mission2-p91/drape-source-gate.mjs';
import {POSES90} from '../research/mission2-p90/five-pose-contact-gate.mjs';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const good=()=>['female','male'].flatMap(figure=>['source','blend-50','relaxed'].map(pose=>({
 figure,pose,contact:{
  schema:'M2-P88-original-photo-real-skinned-source-contact-sampled-v1',
  originalSourceId:'commons-0053',sourceDressOriginalSHA256:SHA,
  originalSourceTriangles:3836,actualAnatomicalBodyFaces:109064,
  genuineSource163BoneSkeleton:true,
  sampledBaselineBodyStrictPairWitnesses:196,
  sampledCandidateBodyStrictPairWitnesses:0,
  sampledCandidateSelfStrictPairWitnesses:0,
  sampledCandidateBodyNearOrZeroUnresolved:20,
  sampledCandidateSelfGeometricZeroOrOverlapUnresolved:4,
  completedOriginalBodyAudit:true,completedCandidateBodyAudit:true,
  completedCandidateSelfAudit:true,completedCandidateSelfDistanceAudit:true,
  candidateSourceShapeGuardPassed:true,
  candidateSourceTriangleFacesAbove5PercentStrain:0,
  candidateSourceTriangleFacesAbove10PercentAreaDrift:0,
  candidateSourceTriangleNormalsFlipped:0,
  candidateSourceTriangleFacesCollapsed:0,
  maximumSampledPhotoSourceEdgeStrain:.024,
  maximumSampledPhotoSourceAreaDrift:.049,
  sampledStrictBodyAndSelfNoncrossingWithShapeGuard:true,
  sampledStatus:'SAMPLED_STRICT_CROSSINGS_NOT_OBSERVED',
  sourcePhotoRestUVSkinAndGeometryUnchanged:true,
  noOriginalSourceVerticesOrFaceIDsOrPhotoExported:true,
  geometricZeroOrNearNotProvenCollisionFree:true,
  continuousMotionCollisionCertification:false,
  independentPhotographicRealismApproved:false,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 }})));

const tagged=()=>good().map(row=>{
 const t={
  schema:'M2-original-source-zero-contact-topology-C54',
  zeroDistancePairsClassified:4,classificationComplete:true,
  sourceCoincidentFaceCandidates:1,
  sourceCoincidentEdgeCandidates:1,
  sourceCoincidentSinglePointCandidates:2,
  sourceCoincidentButUnsafeSkinRestOrPose:0,
  sourceIndependentZeroDistancePairs:0,
  allSourceCorrespondencesCheckedAgainst163BonePose:true,
  sourceCoincidenceNotAHumanVerifiedSewingSeam:true,
  sourceCoordinateDuplicateNotPermissionToWeld:true,
  releaseAuthorized:false
 };
 const e={
  schema:'M2-original-photograph-source-edge-winding-C55',
  sourceEdgeAuditComplete:true,sourceEdgePairsClassified:1,
  sourceTwoFaceOppositeWindingCandidates:1,
  sourceTwoFaceSameWindingCandidates:0,
  sourceThreePlusIncidentFaceNonmanifoldCandidates:0,
  sourceUnsafeOrAmbiguousCoordinateGroupCandidates:0,
  sourceEdgeUnpairedOrUnresolvedCandidates:0,
  sourceEdgeWindingOnlyCandidateNotSewnSeam:true,
  oppositeWindingCannotAuthorizeWelding:true,
  sourceManifoldEstimateNotPhysicalFabricCertificate:true,
  photoUVSkinAndSourceMeshUnchanged:true,
  releaseAuthorized:false
 };
 row.contact.sampledCandidateSelfSourceTopology54=t;
 row.contact.sampledCandidateSelfSourceEdgeWinding55=e;
 row.contact.sourceCoincidentOrTwoFaceEdgeCannotProveSewnSeam=true;
 row.contact.secondaryGarmentSurfacesAndRimsNotAudited=true;
 return row;
});

const ten=()=>{
 const six=tagged();
 return ['female','male'].flatMap(figure=>POSES90.map(pose=>{
  const src=six.find(x=>x.figure===figure&&x.pose===(pose==='blend-25'||pose==='blend-75'?'blend-50':pose));
  return {...structuredClone(src),pose};
 }));
};
const PASS='TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE';

const SOURCE='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const valid=()=>{
 const baseline=ten();
 const relief=structuredClone(baseline).map(row=>{
  row.preview={
   actualSkinnedMeshClone:true,liveSkeletonShared:true,realSkinBoneCount:163,
   originalSHA256:SOURCE,originalGeometryAndPhotoUVUntouched:true,
   releaseAuthorized:false,
   sourceSkirtDrapeResearch91:{
    schema:'M2-P91-provisional-sourced-hem-fall-true-SkinnedMesh',
    actualGarmentGeometryBandMeasured:true,sourceHeightMeters:.85,
    experimentalWaistAtActualGarmentFraction:.48,
    heuristicNotHumanDrapeAnnotation:true,
    drapeAmplitudeMeters:SOURCE_SKIRT91.amplitudeMeters,
    sourceSkirtHemWaveCount:5,
    movedRealSkinnedPhotoVertices:1500,
    maximumSampledHemReliefMeters:.0037,
    maximumPoseSkinInverseResidualMeters:1e-6,sourceSHA256:SOURCE,
    originalSourceRestPhotoUVSkinAndPixelsUntouched:true,
    noClothPhysicsOrIndependentPhotoDrapeCertification:true,
    onlyOriginalPhotographedMainDressComponent:true,
    releaseAuthorized:false,familyAlpha:'HOLD'
   }
  };
  return row;
 });
 const visual=['female','male'].flatMap(figure=>POSES90.flatMap(pose=>
  ['front','side','rear'].map(view=>({
   figure,pose,view,originalVsBaselineChangedRGBPixelsAbove8:1000,
   baselineVsReliefChangedRGBPixelsAbove8:35,
   restoredOriginalChangedRGBPixelsAbove8:0
  }))));
 return {baseline,relief,visual};
};
test('P91 authentic source bounds from measured posed garment not arbitrary owner sizing',()=>{
 const band=deriveSourceSkirtBand91({hemY:.78,topY:1.73});
 assert.equal(band.hemY,.78);
 assert.ok(band.waistY>.78&&band.waistY<1.73);
 assert.equal(band.sourceBandMeasured,true);
 assert.equal(band.originalSourcePhotoDrapeCertified,false);
 assert.equal(band.releaseAuthorized,false);
 for(const x of [{hemY:1,topY:1.1},{hemY:1,topY:3.5},{hemY:NaN,topY:2}])
  assert.throws(()=>deriveSourceSkirtBand91(x),/invalid/);
});
test('P91 waist anchor remains exactly static and hem relief bounded by genuine source envelope',()=>{
 const input={centerX:0,centerZ:0,hemY:.8,waistY:1.2,x:.22,z:.08};
 for(const y of [1.2,1.45]){
  const o=calculateSourceSkirtRelief91({...input,y});
  assert.equal(o.fall,0);assert.equal(o.magnitudeMeters,0);
 }
 const hem=calculateSourceSkirtRelief91({...input,y:.8});
 assert.equal(hem.fall,1);
 assert.ok(hem.magnitudeMeters<=SOURCE_SKIRT91.maxAllowedAmplitudeMeters);
 const mid=calculateSourceSkirtRelief91({...input,y:1.0});
 assert.ok(mid.fall>0&&mid.fall<1);
 assert.ok(mid.magnitudeMeters<hem.magnitudeMeters+1e-12);
});
test('P91 actual radial original source skirt hem waves alternate but do not invent bones or size',()=>{
 const v=[];
 for(let a=0;a<12;a++){
  const angle=2*Math.PI*a/12;
  const o=calculateSourceSkirtRelief91({
   centerX:0,centerZ:0,hemY:.7,waistY:1.2,
   x:.3*Math.cos(angle),y:.7,z:.3*Math.sin(angle)
  });
  const radial=o.dx*Math.cos(angle)+o.dz*Math.sin(angle);
  v.push(radial);
  assert.ok(o.magnitudeMeters<=SOURCE_SKIRT91.maxAllowedAmplitudeMeters);
  assert.ok(Number.isFinite(o.dx+o.dy+o.dz));
 }
 assert.ok(v.some(x=>x>0)&&v.some(x=>x<0));
});
test('P91 impossible pose, memory-free silhouette and unbounded material warp refuse closed',()=>{
 const sample={centerX:0,centerZ:0,hemY:.8,waistY:1.2,x:.2,y:.8,z:.1};
 for(const broken of [
  {...sample,amplitudeMeters:.02},
  {...sample,amplitudeMeters:-.001},
  {...sample,waistY:.81},
  {...sample,lobes:0},{...sample,lobes:40},
  {...sample,x:Infinity},{...sample,y:NaN}
 ])assert.throws(()=>calculateSourceSkirtRelief91(broken),/invalid/);
 assert.equal(calculateSourceSkirtRelief91({...sample,x:0,z:0}).magnitudeMeters,0);
});
test('P91 synthetic fixture validates structure but cannot claim independent photographic quality',()=>{
 const g=verifySourceSkirtRelief91(valid());
 assert.equal(g.status,'ACTUAL_SOURCE_DRAPE_HYPOTHESIS_RENDERED_NOT_PHOTOREALISM');
 assert.equal(g.authenticSourcePoseSamples,10);
 assert.equal(g.actualWebGLRGBComparisons,30);
 assert.equal(g.sourceAdjustedVerticesAcrossTenSamples,15000);
 assert.equal(g.actualRenderedBaselineVersusDrapeChangedRGBPixelsAbove8,1050);
 assert.equal(g.releaseAuthorized,false);
 assert.equal(g.noIndependentHumanPhotoDrapeApproval,true);
 assert.equal(g.originalSourceRestoredWithoutPixelDifferences,true);
});
test('P91 fitted garment collision/strain never waived for visual change',()=>{
 for(const mutate of [
  x=>x.relief[8].contact.sampledCandidateBodyStrictPairWitnesses=1,
  x=>x.relief[2].contact.sampledCandidateSelfStrictPairWitnesses=1,
  x=>x.relief[4].contact.candidateSourceShapeGuardPassed=false,
  x=>x.relief[5].contact.candidateSourceTriangleFacesAbove5PercentStrain=1,
  x=>x.relief[6].contact.completedCandidateSelfDistanceAudit=false,
  x=>x.baseline[2].contact.sourceDressOriginalSHA256='0'.repeat(64)
 ]){
  const x=valid();mutate(x);
  assert.equal(verifySourceSkirtRelief91(x).status,'BLOCKED');
 }
});
test('P91 source pixels/rig/provenance, genuine moved vertices and zero release stay mandatory',()=>{
 for(const mutate of [
  x=>x.relief[1].preview.realSkinBoneCount=150,
  x=>x.relief[1].preview.sourceSkirtDrapeResearch91.drapeAmplitudeMeters=.04,
  x=>x.relief[1].preview.sourceSkirtDrapeResearch91.movedRealSkinnedPhotoVertices=0,
  x=>x.relief[1].preview.sourceSkirtDrapeResearch91.maximumPoseSkinInverseResidualMeters=.01,
  x=>x.relief[1].preview.sourceSkirtDrapeResearch91.heuristicNotHumanDrapeAnnotation=false,
  x=>x.relief[1].preview.originalGeometryAndPhotoUVUntouched=false,
  x=>x.relief[1].preview.releaseAuthorized=true,
  x=>x.relief[1].preview.sourceSkirtDrapeResearch91.familyAlpha='OPEN',
  x=>x.relief.pop()
 ]){
  const x=valid();mutate(x);
  assert.equal(verifySourceSkirtRelief91(x).status,'BLOCKED');
 }
});
test('P91 original restored exactly, drape pixels visible; fail if only decorative receipts',()=>{
 for(const mutate of [
  x=>x.visual[0].restoredOriginalChangedRGBPixelsAbove8=1,
  x=>x.visual[3].baselineVsReliefChangedRGBPixelsAbove8=NaN,
  x=>x.visual.forEach(v=>v.baselineVsReliefChangedRGBPixelsAbove8=0),
  x=>x.visual.pop(),
  x=>x.visual[1].figure='male',
  x=>x.visual[2].pose='unknown',
  x=>x.visual[5].originalVsBaselineChangedRGBPixelsAbove8=0
 ]){
  const x=valid();mutate(x);
  assert.equal(verifySourceSkirtRelief91(x).status,'BLOCKED');
 }
});
