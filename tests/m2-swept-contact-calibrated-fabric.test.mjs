import test from 'node:test';
import assert from 'node:assert/strict';
import {
 evaluateSweptIndexedContact,assessPhysicalFitEvidence,
 simulateResearchFabricPatch
} from '../research/parallel89/swept-contact-calibrated-fabric89.mjs';

const tri=(dx=0,dy=0,z=0)=>[
 [0+dx,0+dy,z],[1+dx,0+dy,z],[0+dx,1+dy,z]
];
const original='a'.repeat(64);
const source={
 frontStart:[tri()],frontEnd:[tri()],
 bodyStart:[tri(0,0,2)],bodyEnd:[tri(0,0,2)]
};

test('actual linear swept original-face boxes are fully separated',()=>{
 const evidence=evaluateSweptIndexedContact({
  ...source,motionModel:'linear-vertex'});
 assert.equal(evidence.decision,'CLEAR_LINEAR_SWEPT_BOXES_ONLY');
 assert.equal(evidence.fullPairEnumeration,true);
 assert.equal(evidence.sweptOverlappingTrianglePairs,0);
 assert.equal(evidence.physicallyCalibratedFit,false);
 assert.equal(evidence.consumer3DAdmitted,false);
 assert.equal(evidence.familyAlpha,'HOLD');
});

test('contact between two nominally clear endpoint poses is detected',()=>{
 const evidence=evaluateSweptIndexedContact({
  frontStart:[tri(0,0,2)],frontEnd:[tri(0,0,-2)],
  bodyStart:[tri()],bodyEnd:[tri()],
  motionModel:'linear-vertex'});
 assert.equal(evidence.decision,'BLOCKED_OBSERVED_SWEPT_CONTACT');
 assert.equal(evidence.witness.t,.5);
 assert.equal(evidence.witness.contactClass,'COPLANAR_OVERLAP');
 assert.equal(evidence.fullPairEnumeration,false);
 assert.equal(evidence.consumer3DAdmitted,false);
});

test('overlapping swept boxes without sampled triangle hit remain BLOCKED',()=>{
 const b=tri(.9,.9,0);
 const evidence=evaluateSweptIndexedContact({
  frontStart:[tri()],frontEnd:[tri()],bodyStart:[b],bodyEnd:[b],
  motionModel:'linear-vertex'});
 assert.equal(evidence.decision,'BLOCKED_UNRESOLVED_INTER_SAMPLE_CONTACT');
 assert.equal(evidence.sweptOverlappingTrianglePairs,1);
 assert.equal(evidence.fullPairEnumeration,true);
});

test('genuine non-linear bone rotation may not masquerade as linear clearance',()=>{
 const evidence=evaluateSweptIndexedContact({...source,
  motionModel:'bone-rotation'});
 assert.equal(evidence.decision,'BLOCKED_MOTION_BOUND_UNPROVEN');
 assert.equal(evidence.consumer3DAdmitted,false);
 assert.equal(evidence.originalPhoto2DFallbackRequired,true);
});

test('pair-cap and malformed triangles fail closed',()=>{
 const b=tri(.9,.9,0);
 const capped=evaluateSweptIndexedContact({
  frontStart:[tri(),tri()],frontEnd:[tri(),tri()],
  bodyStart:[b,b],bodyEnd:[b,b],
  motionModel:'linear-vertex',maxPairs:1
 });
 assert.equal(capped.decision,'BLOCKED_SWEPT_RESOURCE_LIMIT');
 assert.equal(capped.fullPairEnumeration,false);
 assert.throws(()=>evaluateSweptIndexedContact({
  frontStart:[tri()],frontEnd:[tri()],
  bodyStart:[[[Infinity,0,0],[1,0,0],[0,1,0]]],
  bodyEnd:[tri()],motionModel:'linear-vertex'
 }),/original-swept-indexed-faces-invalid/);
 for(const invalid of [NaN,0,-1,1.5,Infinity]){
  assert.throws(()=>evaluateSweptIndexedContact({...source,
   motionModel:'linear-vertex',maxPairs:invalid}),
   /swept-contact-budget-or-sample-grid-invalid/);
 }
});

test('actual museum source without measured camera/garment/cloth stays BLOCKED',()=>{
 const result=assessPhysicalFitEvidence({originalPhotoSHA256:original});
 assert.equal(result.evidenceStatus,'BLOCKED_MISSING_PHYSICAL_EVIDENCE');
 assert.ok(result.missingEvidence.includes('photoAlignedPhysicalReference'));
 assert.ok(result.missingEvidence.includes('testedOriginalFabricSpecimen'));
 assert.equal(result.measuredReferenceScaleMmPerPixel,null);
 assert.equal(result.physicalFitCertified,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('measured synthetic calibration derives only conditional dimensions, never physical fit proof',()=>{
 const complete={
  originalPhotoSHA256:original,approvedOriginalFrontMask:true,
  humanReviewedSourceMask:true,observedOriginalReverse:true,
  physicalReference:{
   spanPixels:250,spanMm:500,sourcePhotoSHA256:original,sameGarmentPlane:true
  },
  camera:{focalLengthPixels:1050,distanceMm:1100,opticalAxisReviewed:true},
  wearerMeasurements:{scaleMeasured:true,chestCircumferenceMm:940,
   chestUncertaintyMm:8},
  garmentMeasurements:{chestCircumferenceMm:1000,chestUncertaintyMm:7},
  materialMeasurements:{independentlyMeasured:true,
   arealDensityKgM2:.25,stretchStiffnessNPerM:650,bendingStiffnessNm:.05}
 };
 const result=assessPhysicalFitEvidence(complete);
 assert.deepEqual(result.missingEvidence,[]);
 assert.equal(result.measuredReferenceScaleMmPerPixel,2);
 assert.equal(result.conservativeMinimumChestEaseMm,45);
 assert.equal(result.chestDimensionalConflict,false);
 assert.equal(result.evidenceStatus,'MEASUREMENTS_PRESENT_NOT_INDEPENDENTLY_ATTESTED');
 assert.equal(result.physicalFitCertified,false);
 const unsafe=assessPhysicalFitEvidence({...complete,garmentMeasurements:{
  chestCircumferenceMm:900,chestUncertaintyMm:7
 }});
 assert.equal(unsafe.chestDimensionalConflict,true);
 assert.equal(unsafe.conservativeMinimumChestEaseMm,-55);
 assert.equal(unsafe.consumer3DAdmitted,false);
});

test('research gravity patch sags, remains pinned, has finite bounded strain',()=>{
 const cloth=simulateResearchFabricPatch();
 assert.equal(cloth.pinnedEdgeUnchanged,true);
 assert.ok(cloth.minHeightM<cloth.originalTopPinHeightM-.002);
 assert.ok(cloth.positionsM.every(p=>p.every(Number.isFinite)));
 assert.ok(cloth.maximumStructuralStrain>=0);
 assert.equal(cloth.originalPhotoSourceFabricBehaviorCertified,false);
 assert.equal(cloth.avatarCollisionConstraintsIntegrated,false);
 assert.equal(cloth.consumer3DAdmitted,false);
 assert.equal(cloth.familyAlpha,'HOLD');
});

test('no-gravity cloth remains at original neutral plane and invalid fabric data is refused',()=>{
 const flat=simulateResearchFabricPatch({gravityMS2:0,steps:30});
 assert.ok(flat.positionsM.every(p=>Math.abs(p[1]-1.2)<1e-10));
 for(const bad of [
  {arealDensityKgM2:0},{stretchStiffnessNPerM:NaN},
  {bendingStiffnessNm:-1},{steps:Infinity},{columns:0},
  {dtSeconds:.1},{dampingRatio:1}
 ])assert.throws(()=>simulateResearchFabricPatch(bad),
  /fabric-physics-parameters-invalid/);
});


test('physical reference must be bound to a valid source SHA, not undefined equals undefined',()=>{
 const incomplete=assessPhysicalFitEvidence({
  physicalReference:{spanPixels:200,spanMm:400,sameGarmentPlane:true}
 });
 assert.equal(incomplete.measuredReferenceScaleMmPerPixel,null);
 assert.ok(incomplete.missingEvidence.includes('originalPhotoSHA256'));
 assert.ok(incomplete.missingEvidence.includes('photoAlignedPhysicalReference'));
 assert.equal(incomplete.physicalFitCertified,false);
});

test('synthetic sphere proxy projects vertices without certifying real body-face collision',()=>{
 const sphere={centerM:[.3,.95,.3],radiusM:.3,clearanceM:.005};
 const cloth=simulateResearchFabricPatch({collisionSphere:sphere});
 assert.ok(cloth.proxySphereVertexCorrections>0);
 assert.equal(cloth.proxySphereVertexOnlyConstraint,true);
 assert.ok(cloth.approximateBendingSpringNPerM>0);
 assert.equal(cloth.pinnedEdgeUnchanged,true);
 assert.equal(cloth.originalBodyTriangleContactsProved,false);
 assert.equal(cloth.referenceMaterialMeasurementsVerified,false);
 for(let i=7;i<cloth.positionsM.length;i++){
  const p=cloth.positionsM[i];
  assert.ok(Math.hypot(...p.map((v,k)=>v-sphere.centerM[k]))>=
   sphere.radiusM+sphere.clearanceM-1e-6);
 }
 assert.equal(cloth.realisticDrapeCertified,false);
 assert.equal(cloth.consumer3DAdmitted,false);
 assert.throws(()=>simulateResearchFabricPatch({
  collisionSphere:{centerM:[0,0,0],radiusM:NaN}
 }),/fabric-proxy-collider-invalid/);
});
