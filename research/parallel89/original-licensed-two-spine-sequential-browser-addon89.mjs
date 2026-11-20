/**
 * Research-only additive in-memory witness for authentic original source photo
 * and both licensed original CC0 163bone skinned anatomies. Consecutive
 * spine03 then spine04, never concurrent. Original JPEG, mask, GLB, UV,
 * weights, geometry, user privacy, and consumer app are never edited.
 */
import {evaluateTwoSequentialOriginalNamedSpineJoints}
 from './two-sequential-original-spine-joint-audit89.mjs';

window.__M2RealRigPhotoTrial.verifyRealTwoSequentialSpineJointFullSurface=()=>{
 const x=sourceSkinResearch;
 invariant(x?.model?.snapshots?.length>0&&
  x?.body?.skeleton?.bones?.length===163&&
  x?.mesh?.isSkinnedMesh&&x.mesh.skeleton===x.body.skeleton&&
  x.lowerName==='spine03'&&x.upperName==='spine04'&&
  x.lowerBone&&x.posedBone&&x.lowerBone!==x.posedBone,
  'original-real-163bone-spine03-spine04-needed-for-consecutive-path');
 const model=x.model;
 const frontIndices=faces.slice(range.sourcePhotoFront.start,
  range.sourcePhotoFront.start+range.sourcePhotoFront.count);
 const frontFaces=frontIndices.length/3;
 invariant(frontFaces===35262&&x.sourceFrontN>17000,
  'all-original-museum-front-faces-required');
 const parts=model.snapshots.map(v=>{
  const mesh=v.mesh,p=mesh.geometry.getAttribute('position'),
   i=mesh.geometry.getIndex();
  invariant(mesh.isSkinnedMesh&&mesh.skeleton.bones.length===163&&
   p.count>2,'real-original-body-component-missing');
  const size=i?i.count:p.count;
  invariant(size%3===0&&size>0,'original-body-index-count-invalid');
  return {mesh,index:i,vertices:p.count,n:size};
 });
 const originalBodyVerts=parts.reduce((v,s)=>v+s.vertices,0);
 const bodyIndices=new Uint32Array(parts.reduce((v,s)=>v+s.n,0));
 let idxOffset=0,vertexOffset=0;
 for(const part of parts){
  for(let i=0;i<part.n;i++){
   const k=part.index?part.index.getX(i):i;
   invariant(k>=0&&k<part.vertices,
    'original-real-body-vertex-outside-original-attribute');
   bodyIndices[idxOffset+i]=vertexOffset+k;
  }
  idxOffset+=part.n;vertexOffset+=part.vertices;
 }
 invariant(originalBodyVerts===72771&&
  bodyIndices.length/3===109064,
  'authentic-original-licensed-body-full-indexed-scope-required');
 const allBones=x.body.skeleton.bones,
  qLower=x.lowerBone.quaternion.clone(),
  qUpper=x.posedBone.quaternion.clone(),
  others=allBones.map(b=>({
   b,position:b.position.toArray(),
   quaternion:b.quaternion.toArray(),scale:b.scale.toArray()
  }));
 const frozenExceptBoth=()=>others.every(q=>{
  if(q.b===x.lowerBone||q.b===x.posedBone)return true;
  return q.position.every((v,i)=>q.b.position.toArray()[i]===v)&&
   q.quaternion.every((v,i)=>q.b.quaternion.toArray()[i]===v)&&
   q.scale.every((v,i)=>q.b.scale.toArray()[i]===v);
 });
 const originalFrontSeed=frontIndices[0],
  correct=originalSkinnedVertexWorld(x.mesh,originalFrontSeed),
  wrong=x.mesh.applyBoneTransform(originalFrontSeed,
   new THREE.Vector3()).applyMatrix4(x.mesh.matrixWorld),
  historicalZeroVectorSkinningError=correct.distanceTo(wrong);
 invariant(Number.isFinite(historicalZeroVectorSkinningError)&&
  historicalZeroVectorSkinningError>.0001,
  'authentic-original-XYZ-skinning-not-proven');
 const collect=(mesh,n)=>{
  const a=new Float64Array(n*3);
  mesh.updateWorldMatrix(true,false);
  mesh.skeleton.update();
  for(let i=0;i<n;i++){
   const v=originalSkinnedVertexWorld(mesh,i),j=3*i;
   invariant([v.x,v.y,v.z].every(Number.isFinite),
    'authentic-original-posed-vertex-nonfinite');
   a[j]=v.x;a[j+1]=v.y;a[j+2]=v.z;
  }
  return a;
 };
 const trajectory=[
  {movingNamedJoint:'spine03',anglesDeg:[-6,-3,0,3,6],
   otherOriginalSpineJointHeldDeg:-12},
  {movingNamedJoint:'spine04',anglesDeg:[-12,-6,0,6,12],
   otherOriginalSpineJointHeldDeg:6}
 ];
 try{
  const segments=[];
  for(const stage of trajectory){
   const originalFront=[],originalBody=[];
   for(const d of stage.anglesDeg){
    const lowerDeg=stage.movingNamedJoint==='spine03'?d:6,
     upperDeg=stage.movingNamedJoint==='spine04'?d:-12;
    x.lowerBone.quaternion.copy(qLower);
    x.lowerBone.rotateZ(lowerDeg*Math.PI/180);
    x.posedBone.quaternion.copy(qUpper);
    x.posedBone.rotateZ(upperDeg*Math.PI/180);
    model.root.updateMatrixWorld(true);
    x.body.skeleton.update();
    invariant(frozenExceptBoth(),
     'other-161-original-licensed-bones-must-remain-frozen');
    const fp=collect(x.mesh,x.sourceFrontN),
     bp=new Float64Array(originalBodyVerts*3);
    let offset=0;
    for(const part of parts){
     const chunk=collect(part.mesh,part.vertices);
     bp.set(chunk,offset);
     offset+=chunk.length;
    }
    invariant(offset===bp.length,'true-original-body-data-omitted');
    originalFront.push(fp);
    originalBody.push(bp);
   }
   segments.push({...stage,frontPoses:originalFront,
    bodyPoses:originalBody});
  }
  const audit=evaluateTwoSequentialOriginalNamedSpineJoints({
   segments,frontIndices,bodyIndices,
   expectedFrontFaces:35262,expectedBodyFaces:109064,
   sourceWitness:{
    actualRigBoneCount:163,
    allOtherBoneLocalTransformsFrozen:frozenExceptBoth(),
    sourceCoordinatesReadFromOriginalPositionAttribute:true,
    originalSourceSkinnedMesh:true,
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    actualLicensedRigSHA256:model.sha256
   }
  });
  invariant(audit.consumer3DAdmitted===false&&
   audit.familyAlpha==='HOLD'&&
   audit.originalFrontFacesPresentInEachSegment===35262&&
   audit.originalLicensedBodyFacesPresentInEachSegment===109064&&
   audit.continuousJoinVerifiedForEveryOriginalSourceAndBodyVertex===true&&
   audit.bothSegmentsComputed===true,
   'two-original-named-joint-full-face-motion-witness-must-fail-closed');
  sourceSkinProvenanceUnchanged();
  assertModelUnchanged(model);
  return {
   schema:'M2-original-Met163bone-two-ordered-single-joint-full-surface-research/v1',
   actualOriginalLicensedRigKind:x.kind,
   originalPublicMuseumSourceJPEG_SHA256:payload.originalJPEGByteSHA256,
   originalPublicMachineUnreviewedMaskSHA256:required.conservativeMaskPNG,
   actualOriginalLicensedRigSHA256:model.sha256,
   originalFrontIndexedFaceCount:frontFaces,
   originalBodyIndexedFaceCount:bodyIndices.length/3,
   originalFrontSkinnedVertexCount:x.sourceFrontN,
   originalBodySkinnedVertexCount:originalBodyVerts,
   originalNamedMovingJointsInOrder:['spine03','spine04'],
   originalJointPoseSamplesInOrder:trajectory.map(a=>({
    joint:a.movingNamedJoint,anglesDeg:a.anglesDeg,
    frozenSecondJointAngleDeg:a.otherOriginalSpineJointHeldDeg
   })),
   authenticOriginalSkinnedLocalXYZNotZeroVector:true,
   historicalIncorrectZeroSeedDisplacementRigUnits:
    historicalZeroVectorSkinningError,
   allOther161BoneLocalPosesFrozen:true,
   fullOriginalTwoSegmentAudits:audit,
   concurrentJointMovementNotProven:true,
   originalFrontCurrentlyArbitrarilyFloatingNotFit:true,
   realMeasuredSourceCameraAndGarmentScale:null,
   realGarmentReverseVerified:false,
   actualOriginalFabricMeasured:false,
   ownerApprovedMask:false,
   physicalFitCertified:false,originalPhoto2DFallbackRequired:true,
   consumer3DAdmitted:false,familyAlpha:'HOLD'
  };
 }finally{
  x.lowerBone.quaternion.copy(qLower);
  x.posedBone.quaternion.copy(qUpper);
  model.root.updateMatrixWorld(true);
  x.body.skeleton.update();
 }
};
