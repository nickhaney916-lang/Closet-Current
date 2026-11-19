/**
 * ADDITIVE native ONLY. The SHA-pinned original browser runner concatenates
 * this module's source IN MEMORY to the unchanged licensed P89/Met viewer.
 * No original public photo/mask/GLB or app files altered.
 *
 * Tests a THREE-LEG piecewise sequential path:
 *  - spine04 -12..+12, spine03 held -8
 *  - spine03  -8.. +8, spine04 held +12
 *  - spine04 +12..-12, spine03 held +8
 * One local spine bone changes in each segment, ALL other local bones frozen.
 * Full original indexed photo-front and anatomical body faces at every pose.
 */
import {evaluateOriginalFullIndexedSequentialTwoSpinePath,sequentialLegs}
 from './original-two-spine-sequential-angular-path89.mjs';

window.__M2RealRigPhotoTrial.verifyOriginalTwoSpineSequentialFullFaces=()=>{
 const x=sourceSkinResearch;
 invariant(x?.mesh?.isSkinnedMesh&&x.model?.snapshots?.length>0&&
  x.body?.skeleton?.bones?.length===163&&
  x.mesh.skeleton===x.body.skeleton&&
  x.upperName==='spine04'&&x.lowerName==='spine03'&&
  x.lowerIndex!==x.upperIndex&&
  x.lowerBone===x.body.skeleton.bones[x.lowerIndex]&&
  x.posedBone===x.body.skeleton.bones[x.upperIndex],
  'genuine-original-licensed-two-spine-bones-not-present');
 const model=x.model,
  frontIndex=faces.slice(range.sourcePhotoFront.start,
   range.sourcePhotoFront.start+range.sourcePhotoFront.count),
  frontFaces=frontIndex.length/3;
 invariant(frontFaces===35262&&x.sourceFrontN===17985,
  'authentic-original-photograph-full-front-and-vertex-count-missing');
 for(const i of frontIndex)invariant(
  Number.isSafeInteger(i)&&i>=0&&i<x.sourceFrontN,
  'source-original-front-index-outside-authentic-position');
 const bodyParts=model.snapshots.map(s=>{
  const mesh=s.mesh,geo=mesh.geometry,
   attr=geo.getAttribute('position'),idx=geo.getIndex(),
   n=idx?idx.count:attr.count;
  invariant(mesh.isSkinnedMesh&&mesh.skeleton===x.body.skeleton&&
   n%3===0&&attr.count>2,'real-original-163bone-submesh-invalid');
  return {mesh,idx,count:n,verts:attr.count};
 });
 const bodyVertices=bodyParts.reduce((n,v)=>n+v.verts,0),
  bodyIndexN=bodyParts.reduce((n,v)=>n+v.count,0);
 invariant(bodyVertices===72771&&bodyIndexN/3===109064,
  'original-real-body-all-indexed-faces-or-original-vertices-missing');
 const bodyIndices=new Uint32Array(bodyIndexN);
 let bodyIdxBase=0,bodyVertexBase=0;
 for(const p of bodyParts){
  for(let j=0;j<p.count;j++){
   const index=p.idx?p.idx.getX(j):j;
   invariant(Number.isSafeInteger(index)&&index>=0&&index<p.verts,
    'real-163bone-original-body-index-invalid');
   bodyIndices[bodyIdxBase+j]=bodyVertexBase+index;
  }
  bodyIdxBase+=p.count;bodyVertexBase+=p.verts;
 }
 invariant(bodyVertexBase===bodyVertices&&bodyIdxBase===bodyIndexN,
  'real-original-body-all-indexed-sections-short');
 const boneList=x.body.skeleton.bones,
  lowerRest=x.lowerBone.quaternion.clone(),
  upperBefore=x.posedBone.quaternion.clone(),
  upperRest=x.originalPose.clone(),
  immutableOtherBoneTransforms=boneList.map(b=>({
   position:b.position.toArray(),quaternion:b.quaternion.toArray(),
   scale:b.scale.toArray()}));
 const checkOther161=()=>{
  for(let i=0;i<boneList.length;i++){
   if(i===x.lowerIndex||i===x.upperIndex)continue;
   const b=boneList[i],old=immutableOtherBoneTransforms[i];
   if(b.position.toArray().some((v,k)=>v!==old.position[k])||
    b.quaternion.toArray().some((v,k)=>v!==old.quaternion[k])||
    b.scale.toArray().some((v,k)=>v!==old.scale[k]))
    return false;
  }
  return true;
 };
 const frontIndex0=frontIndex[0],
  correct=originalSkinnedVertexWorld(x.mesh,frontIndex0),
  wrong=x.mesh.applyBoneTransform(frontIndex0,new THREE.Vector3())
   .applyMatrix4(x.mesh.matrixWorld);
 const historicalZeroSeedError=correct.distanceTo(wrong);
 invariant(Number.isFinite(historicalZeroSeedError)&&historicalZeroSeedError>.0001,
  'real-original-source-position-zero-seed-bug-not-excluded');
 const entireOriginalPose=()=>{
  model.root.updateMatrixWorld(true);
  x.body.skeleton.update();
  x.mesh.updateWorldMatrix(true,false);
  for(const part of bodyParts){
   part.mesh.updateWorldMatrix(true,false);part.mesh.skeleton.update();
  }
  const front=new Float64Array(x.sourceFrontN*3);
  for(let i=0;i<x.sourceFrontN;i++){
   const p=originalSkinnedVertexWorld(x.mesh,i),idx=3*i;
   invariant([p.x,p.y,p.z].every(Number.isFinite),
    'real-original-photo-front-posed-point-nonfinite');
   front[idx]=p.x;front[idx+1]=p.y;front[idx+2]=p.z;
  }
  const body=new Float64Array(bodyVertices*3);
  let offset=0;
  for(const part of bodyParts){
   for(let i=0;i<part.verts;i++){
    const p=originalSkinnedVertexWorld(part.mesh,i);
    invariant([p.x,p.y,p.z].every(Number.isFinite),
     'real-original-163bone-posed-body-point-nonfinite');
    const k=offset+3*i;
    body[k]=p.x;body[k+1]=p.y;body[k+2]=p.z;
   }
   offset+=part.verts*3;
  }
  invariant(offset===body.length,'all-original-real-anatomy-posed-buffer-missing');
  return {front,body};
 };
 const maxDisplacement=(a,b)=>{
  invariant(a.length===b.length,'original-two-spine-vertex-count-shifted');
  let largest=0;
  for(let k=0;k<a.length;k++)
   largest=Math.max(largest,Math.abs(a[k]-b[k]));
  return largest;
 };
 const segments=[],segmentDisplacement=[],originalRestBoneIdentity={
  originalLowerQuaternion:lowerRest.toArray(),
  originalUpperQuaternion:upperRest.toArray()};
 try{
  for(const spec of sequentialLegs){
   const originalFrontPoseBuffers=[],originalBodyPoseBuffers=[];
   let fixedQuaternion=null;
   for(const deg of spec.anglesDegrees){
    const lowerDeg=spec.movingJoint==='spine03'?deg:spec.fixedDegrees,
     upperDeg=spec.movingJoint==='spine04'?deg:spec.fixedDegrees;
    x.lowerBone.quaternion.copy(lowerRest);
    x.lowerBone.rotateZ(lowerDeg*Math.PI/180);
    x.posedBone.quaternion.copy(upperRest);
    x.posedBone.rotateZ(upperDeg*Math.PI/180);
    invariant(checkOther161(),'other-original-161-licensed-joint-local-pose-mutated');
    const hold=spec.fixedJoint==='spine03'?
     x.lowerBone.quaternion:x.posedBone.quaternion;
    if(!fixedQuaternion)fixedQuaternion=hold.clone();
    else invariant(hold.equals(fixedQuaternion),
     'within-original-segment-other-spine-joint-not-frozen');
    const pose=entireOriginalPose();
    originalFrontPoseBuffers.push(pose.front);
    originalBodyPoseBuffers.push(pose.body);
   }
   const frontD=maxDisplacement(originalFrontPoseBuffers[0],
    originalFrontPoseBuffers[4]),
    bodyD=maxDisplacement(originalBodyPoseBuffers[0],
    originalBodyPoseBuffers[4]);
   invariant(frontD>1e-6&&bodyD>1e-6,
    'true-original-photo-and-body-do-not-move-for-named-spine-joint');
   segmentDisplacement.push({
    realNamedMovingJoint:spec.movingJoint,
    actualMaxOriginalFrontVertexMotionRigUnits:frontD,
    actualMaxOriginalAnatomyVertexMotionRigUnits:bodyD
   });
   segments.push({
    movingJoint:spec.movingJoint,fixedJoint:spec.fixedJoint,
    fixedDegrees:spec.fixedDegrees,anglesDegrees:[...spec.anglesDegrees],
    allOtherLocalBonesFrozenWithinSegment:checkOther161(),
    frontPoses:originalFrontPoseBuffers,
    bodyPoses:originalBodyPoseBuffers
   });
  }
  const report=evaluateOriginalFullIndexedSequentialTwoSpinePath({
   segments,frontIndices:frontIndex,bodyIndices,
   expectedFrontFaces:35262,expectedBodyFaces:109064,
   sourceWitness:{
    actualRigBoneCount:163,originalSourceSkinnedMesh:true,
    sourceCoordinatesReadFromOriginalPositionAttribute:true,
    allOther161BoneLocalPosesUnchanged:checkOther161(),
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    actualLicensedRigSHA256:model.sha256
   },
   simultaneousMotionRequested:false,
   maxSegmentBoundaryMismatch:1e-7,
   maxBodyBVHVisits:3000000,maxLeafPairTests:500000,
   maxNarrowphasePairs:60000
  });
  invariant(report.segmentCount===3&&report.segmentResults.length===3&&
   report.originalFrontFacesSubmittedPerSegment===35262&&
   report.originalBodyFacesSubmittedPerSegment===109064&&
   report.maximumBoundaryVertexMismatchRigUnits<=1e-7&&
   report.consumer3DAdmitted===false&&report.familyAlpha==='HOLD',
   'original-two-named-spine-connected-full-face-scope-not-proved');
  sourceSkinProvenanceUnchanged();
  assertModelUnchanged(model);
  return {
   schema:'M2-real-original-Met-dual-163bone-three-segment-two-spine-piecewise-v1-HOLD',
   originalInstitutionalMetSourceId:2551406,
   originalSourceJPEG_SHA256:payload.originalJPEGByteSHA256,
   originalMachineUnreviewedMask_SHA256:required.conservativeMaskPNG,
   realLicensedRigOriginalSHA256:model.sha256,
   realOriginalLicensedRigKind:x.kind,
   realOriginalFullPhotoFrontFaces:frontFaces,
   realOriginalFullBodyFaces:bodyIndexN/3,
   realOriginalFrontPosedVertices:x.sourceFrontN,
   realOriginalBodyPosedVertices:bodyVertices,
   realLicensedNamedMovingBones:['spine03','spine04'],
   actualJointOnlySequentialNotSimultaneous:true,
   originalActualSpinePoseBaseIdentity:originalRestBoneIdentity,
   historicalRealSourceVsZeroSeedErrorRigUnits:historicalZeroSeedError,
   actualOriginalNamedBoneMeasuredVertexDisplacements:segmentDisplacement,
   originalSourceAndRigUnchanged:true,
   originalCameraMetricCalibrationProved:false,
   originalActualGarmentReverseObserved:false,
   actualMaterialClothDrapeCertified:false,
   piecewiseOriginalBodyFrontContactReport:report,
   allPhysicalWearableAdmissionGatesSatisfied:false,
   consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
   familyAlpha:'HOLD'
  };
 }finally{
  x.lowerBone.quaternion.copy(lowerRest);
  x.posedBone.quaternion.copy(upperBefore);
  model.root.updateMatrixWorld(true);x.body.skeleton.update();
  invariant(checkOther161(),'original-spine-multijoint-research-mutated-other-bones');
 }
};
