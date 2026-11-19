import assert from 'node:assert/strict';
import test from 'node:test';
import {evaluateOriginalFullIndexedSequentialTwoSpinePath as examine,
 sequentialLegs} from '../research/parallel89/original-two-spine-sequential-angular-path89.mjs';
const witness={
 actualRigBoneCount:163,
 originalJPEG_SHA256:'a'.repeat(64),
 actualLicensedRigSHA256:'b'.repeat(64),
 originalSourceSkinnedMesh:true,
 sourceCoordinatesReadFromOriginalPositionAttribute:true,
 allOther161BoneLocalPosesUnchanged:true
};
const indices=Uint32Array.from([0,1,2]);
const model=(zFront=3,zBody=0,rotate=false)=>{
 const at=(z,l,u)=>{
  const a=rotate?(l+u)*Math.PI/180:0,c=Math.cos(a),s=Math.sin(a);
  return Float64Array.from([0,0,z,c,s,z,-s,c,z]);
 };
 const segments=sequentialLegs.map(step=>{
  const fp=[],bp=[];
  for(const angle of step.anglesDegrees){
   const lower=step.movingJoint==='spine03'?angle:step.fixedDegrees,
    upper=step.movingJoint==='spine04'?angle:step.fixedDegrees;
   fp.push(at(zFront,lower,upper));
   bp.push(at(zBody,lower,upper));
  }
  return {
   movingJoint:step.movingJoint,fixedJoint:step.fixedJoint,
   fixedDegrees:step.fixedDegrees,anglesDegrees:[...step.anglesDegrees],
   allOtherLocalBonesFrozenWithinSegment:true,
   frontPoses:fp,bodyPoses:bp
  };
 });
 return {segments,frontIndices:indices,bodyIndices:indices,
  expectedFrontFaces:1,expectedBodyFaces:1,sourceWitness:witness};
};
test('three WHOLE original front/body indexed segments join at identical true vertex positions',()=>{
 const result=examine(model(3,0,true));
 assert.equal(result.decision,
  'RESEARCH_ONLY_ORIGINAL_TWO_SPINE_PIECEWISE_FULL_FACE_SWEEPS_SEPARATED');
 assert.equal(result.segmentCount,3);
 assert.equal(result.numberCompletedFullAngularBroadphases,3);
 assert.equal(result.maximumBoundaryVertexMismatchRigUnits,0);
 assert.deepEqual(result.segmentResults.map(x=>x.movingOriginalLicensedBone),
  ['spine04','spine03','spine04']);
 assert.deepEqual(result.segmentResults.map(x=>x.originalFrontFaceCount),[1,1,1]);
 assert.equal(result.completeAllThreeSequentialOriginalSweptSegments,true);
 assert.equal(result.simultaneousTwoJointMotionCertified,false);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.familyAlpha,'HOLD');
});
test('actual contact in original source rejects entire sequential path',()=>{
 const result=examine(model(0,0,true));
 assert.equal(result.decision,'BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_REAL_CONTACT');
 assert.equal(result.numberActualContactSegments,3);
 assert.equal(result.completeAllThreeSequentialOriginalSweptSegments,false);
 assert.equal(result.consumer3DAdmitted,false);
});
test('mismatched actual source face vertex at segment boundary refuses geometry continuity',()=>{
 const v=model(3,0,true);
 v.segments[1].frontPoses[0][0]+=.01;
 const result=examine(v);
 assert.equal(result.decision,'BLOCKED_REAL_ORIGINAL_SKINNED_SEGMENT_BOUNDARY_DISCONTINUITY');
 assert.equal(result.offendingSegment,1);
});
test('mismatched real body pose vertex at second sequential splice refuses',()=>{
 const v=model(3,0,true);
 v.segments[2].bodyPoses[0][5]+=.02;
 assert.equal(examine(v).decision,'BLOCKED_REAL_ORIGINAL_SKINNED_SEGMENT_BOUNDARY_DISCONTINUITY');
});
test('simultaneous two named original-bone rotations NOT covered by sequential proof',()=>{
 const v=model();v.simultaneousMotionRequested=true;
 const q=examine(v);
 assert.equal(q.decision,'BLOCKED_SIMULTANEOUS_TWO_JOINT_PATH_NOT_PROVEN');
 assert.equal(q.consumer3DAdmitted,false);
});
test('missing / reordered original joint motion segment cannot be accepted',()=>{
 const missing=model();missing.segments.pop();
 assert.equal(examine(missing).decision,'BLOCKED_INVALID_SEQUENTIAL_TWO_SPINE_PATH_INPUT');
 const wrong=model();wrong.segments[1].movingJoint='spine04';
 assert.equal(examine(wrong).decision,'BLOCKED_ORIGINAL_SEQUENTIAL_KINEMATIC_SEGMENT_MISMATCH');
 const frozen=model();frozen.segments[1].allOtherLocalBonesFrozenWithinSegment=false;
 assert.equal(examine(frozen).decision,'BLOCKED_ORIGINAL_SEQUENTIAL_KINEMATIC_SEGMENT_MISMATCH');
});
test('original complete face counts required; never sampled-only approval',()=>{
 const v=model();v.expectedBodyFaces=109064;
 assert.equal(examine(v).decision,'BLOCKED_INCOMPLETE_SEQUENTIAL_ORIGINAL_INDEXED_SCOPE');
 assert.equal(examine(v).consumer3DAdmitted,false);
});
test('wrong original source or rig digest and missing actual 163-bone provenance refused',()=>{
 const v=model();v.sourceWitness={...witness,originalJPEG_SHA256:'bad'};
 assert.equal(examine(v).decision,'BLOCKED_UNVERIFIED_ORIGINAL_TWO_SPINE_SOURCE_WITNESS');
 const y=model();y.sourceWitness={...witness,actualRigBoneCount:162};
 assert.equal(examine(y).decision,'BLOCKED_UNVERIFIED_ORIGINAL_TWO_SPINE_SOURCE_WITNESS');
});
test('nonfinite boundary original source position cannot pass even with valid labels',()=>{
 const v=model();v.segments[1].frontPoses[0][0]=NaN;
 assert.equal(examine(v).decision,
  'BLOCKED_REAL_ORIGINAL_SKINNED_SEGMENT_BOUNDARY_DISCONTINUITY');
});
test('finite computational cap causes BLOCK not fake complete-sequence clearance',()=>{
 const v=model(3,0);v.maxBodyBVHVisits=1;
 // With 1 face, the one BVH-node visit is allowed and completed.
 assert.equal(examine(v).numberCompletedFullAngularBroadphases,3);
 const x=model(0,0);x.maxLeafPairTests=1;
 // A genuine contact may be found on first pair. It must remain BLOCKED.
 assert.equal(examine(x).consumer3DAdmitted,false);
});
test('the sequential vertex motion cannot silently change the originally submitted pose arrays',()=>{
 const v=model(3,0,true);
 const before=v.segments.map(s=>s.frontPoses.map(p=>Array.from(p)));
 examine(v);
 assert.deepEqual(v.segments.map(s=>s.frontPoses.map(p=>Array.from(p))),before);
});
