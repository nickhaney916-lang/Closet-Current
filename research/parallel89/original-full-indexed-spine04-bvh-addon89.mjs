/**
 * Test-only additive extension loaded in memory into SHA-pinned original
 * photograph/163bone THREE viewer, never edits the original JPEG,
 * machine-unreviewed mask, source UV, GLBs, pose, or protected app.
 * This is a full ORIGINAL INDEXED FRONT+BODY independent angle-BVH witness
 * and no consumer 3D gate.
 */
import {evaluateAllIndexedOriginalSpine04AngularBroadphase}
 from './all-indexed-original-angular-bvh89.mjs';

window.__M2RealRigPhotoTrial.verifyAllOriginalIndexedSpine04SweptBVH=()=>{
 const x=sourceSkinResearch;
 invariant(x?.mesh?.isSkinnedMesh&&x?.model?.snapshots?.length>0&&
  x.body?.skeleton?.bones?.length===163&&
  x.mesh.skeleton===x.body.skeleton&&x.upperName==='spine04',
  'full-original-swept-real-163bone-skeleton-missing');
 const model=x.model,frontCount=range.sourcePhotoFront.count/3;
 invariant(frontCount===35262&&x.sourceFrontN>frontCount/3,
  'full-original-front-not-real-verified-museum-indexed-scope');
 const frontIndex=faces.slice(
  range.sourcePhotoFront.start,
  range.sourcePhotoFront.start+range.sourcePhotoFront.count);
 invariant(frontIndex.length===frontCount*3,
  'full-original-photograph-front-index-not-complete');
 for(const k of frontIndex)
  invariant(k<x.sourceFrontN,'original-front-vertex-outside-photograph');
 const bodyParts=model.snapshots.map(s=>{
  const mesh=s.mesh,g=mesh.geometry,
   p=g.getAttribute('position'),ind=g.getIndex(),
   count=ind?ind.count:p.count;
  invariant(mesh?.isSkinnedMesh&&mesh.skeleton.bones.length===163&&
   count>0&&count%3===0&&p.count>2,
   'original-licensed-component-face-scope-invalid');
  return {mesh,index:ind,vertexCount:p.count,count};
 });
 let bodyVertexCount=0,totalBodyIndexCount=0;
 for(const s of bodyParts){
  bodyVertexCount+=s.vertexCount;
  totalBodyIndexCount+=s.count;
 }
 const bodyIndices=new Uint32Array(totalBodyIndexCount);
 let indexOffset=0,vertexOffset=0;
 for(const s of bodyParts){
  for(let j=0;j<s.count;j++){
   const k=s.index?s.index.getX(j):j;
   invariant(Number.isSafeInteger(k)&&k>=0&&k<s.vertexCount,
    'original-licensed-global-index-invalid');
   bodyIndices[indexOffset+j]=vertexOffset+k;
  }
  indexOffset+=s.count;vertexOffset+=s.vertexCount;
 }
 const originalBodyIndexedFaces=totalBodyIndexCount/3;
 invariant(bodyVertexCount>30000&&
  originalBodyIndexedFaces===109064&&
  frontIndex.length/3===35262,
  'real-original-licensed-anatomy-all-indexed-triangles-not-present');
 // A corrected original skinning helper reads true local XYZ from immutable
 // geometry.getAttribute('position') before applyBoneTransform. Record
 // numerical error of historical zero-vector implementation as a control.
 const firstIndex=frontIndex[0];
 const trueSource=originalSkinnedVertexWorld(x.mesh,firstIndex);
 const wrongSource=x.mesh.applyBoneTransform(firstIndex,new THREE.Vector3())
  .applyMatrix4(x.mesh.matrixWorld);
 const wrongZeroSeedDelta=trueSource.distanceTo(wrongSource);
 invariant(Number.isFinite(wrongZeroSeedDelta)&&wrongZeroSeedDelta>.0001,
  'old-zero-seeded-original-coordinate-collapse-not-excluded');
 const poseBones=x.body.skeleton.bones,
  old=x.posedBone.quaternion.clone();
 const immutableOtherBonePose=poseBones.map((bone,i)=>({
  index:i,p:bone.position.toArray(),q:bone.quaternion.toArray(),
  s:bone.scale.toArray()}));
 const allOtherLocalPosesFrozen=()=>{
  for(const p of immutableOtherBonePose){
   if(p.index===x.upperIndex)continue;
   const b=poseBones[p.index];
   if(b.position.toArray().some((v,k)=>v!==p.p[k])||
    b.quaternion.toArray().some((v,k)=>v!==p.q[k])||
    b.scale.toArray().some((v,k)=>v!==p.s[k]))return false;
  }
  return true;
 };
 const originalSpineAngles=[-12,-6,0,6,12],
  frontPoses=[],bodyPoses=[];
 try{
  for(const angle of originalSpineAngles){
   x.posedBone.quaternion.copy(x.originalPose);
   x.posedBone.rotateZ(angle*Math.PI/180);
   model.root.updateMatrixWorld(true);
   x.body.skeleton.update();
   x.mesh.updateWorldMatrix(true,false);
   for(const part of bodyParts){
    part.mesh.updateWorldMatrix(true,false);
    part.mesh.skeleton.update();
   }
   invariant(allOtherLocalPosesFrozen(),
    'original-163bone-poses-besides-spine04-incorrectly-mutated');
   const fp=new Float64Array(x.sourceFrontN*3);
   for(let i=0;i<x.sourceFrontN;i++){
    const v=originalSkinnedVertexWorld(x.mesh,i);
    invariant(v.toArray().every(Number.isFinite),
     'full-original-front-true-vertex-nonfinite');
    fp[3*i]=v.x;fp[3*i+1]=v.y;fp[3*i+2]=v.z;
   }
   const bp=new Float64Array(bodyVertexCount*3);
   let start=0;
   for(const part of bodyParts){
    for(let i=0;i<part.vertexCount;i++){
     const v=originalSkinnedVertexWorld(part.mesh,i);
     invariant(v.toArray().every(Number.isFinite),
      'all-indexed-true-licensed-anatomy-vertex-nonfinite');
     const j=start+3*i;
     bp[j]=v.x;bp[j+1]=v.y;bp[j+2]=v.z;
    }
    start+=part.vertexCount*3;
   }
   invariant(start===bp.length,'original-licensed-body-pose-vertex-short');
   frontPoses.push(fp);bodyPoses.push(bp);
  }
  const result=evaluateAllIndexedOriginalSpine04AngularBroadphase({
   frontPoses,bodyPoses,frontIndices:frontIndex,
   bodyIndices,deltaRadians:24*Math.PI/180,
   expectedFrontFaces:35262,expectedBodyFaces:109064,
   maxBodyBVHVisits:3000000,maxLeafPairTests:500000,
   maxNarrowphasePairs:60000,maxTotalFaces:200000,
   maxTotalVertices:250000,
   sourceWitness:{
    actualRigBoneCount:163,
    singleMovingNamedBone:'spine04',
    allOtherBoneLocalTransformsFrozen:allOtherLocalPosesFrozen(),
    sourceCoordinatesReadFromOriginalPositionAttribute:true,
    originalSourceSkinnedMesh:x.mesh.isSkinnedMesh,
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    actualLicensedRigSHA256:model.sha256
   }
  });
  sourceSkinProvenanceUnchanged();
  assertModelUnchanged(model);
  invariant(result.consumer3DAdmitted===false&&result.familyAlpha==='HOLD',
   'original-all-indexed-research-must-never-admit-consumer-wearable');
  return {
   schema:'M2-original-Met-front-and-licensed-163bone-all-indexed-true-spine04-continuum-research/v1',
   originalMetImageId:2551406,
   originalJPEG_SHA256:payload.originalJPEGByteSHA256,
   originalDecodedRGB_SHA256:required.sourceRGB,
   originalMachineMaskSHA256:required.conservativeMaskPNG,
   actualLicensed163boneRigKind:x.kind,
   actualLicensedOriginalGLBSHA256:model.sha256,
   exactRigOriginalSourceSkinnedMeshes:model.snapshots.length,
   originalSourceFrontIndexedFaces:frontCount,
   originalBodyIndexedFaces:originalBodyIndexedFaces,
   originalSourceFrontVertices:x.sourceFrontN,
   originalBodyVertices:bodyVertexCount,
   trueOriginalFullIndexedFrontAndBodyVertexPosesGenerated:true,
   actualFiveGenuineSpine04AnglesDegrees:originalSpineAngles,
   allOther163boneLocalTransformsFrozen:true,
   historicalZeroSeedFaultActuallyExcluded:true,
   historicalWrongZeroSeedDistanceRigUnits:wrongZeroSeedDelta,
   trueOriginalSourceAndRigXYZUsedNotZeroVectors:true,
   provenanceOriginalJPEGAndGLBExternallySHAProvedByNativeHarness:true,
   actualAllOriginalIndexedAngularBroadphase:result,
   sourceCameraScaleMetricUnknown:true,
   originalGarmentActualBackUnseen:true,
   noApprovedGarmentAlpha:true,noMeasuredFabricSample:true,
   fullPhysicalWearabilityProved:false,
   originalFabricBehaviorCertified:false,
   sourcePhoto2DFallbackRequired:true,consumer3DAdmitted:false,
   familyAlpha:'HOLD'
  };
 }finally{
  x.posedBone.quaternion.copy(old);
  model.root.updateMatrixWorld(true);x.body.skeleton.update();
 }
};
