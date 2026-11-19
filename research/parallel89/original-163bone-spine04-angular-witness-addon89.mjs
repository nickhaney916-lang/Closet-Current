/**
 * This file is NEVER served by itself. The SHA-pinned original P89 native
 * browser runner appends these lines IN MEMORY to its untouched original
 * registration module; its module-scoped ORIGINAL source+rig variables remain
 * visible here. No static original, rig, mask or consumer file is changed.
 */
import {evaluateFixedAxisLbsRotationalEnvelope}
 from './single-joint-rotation-envelope89.mjs';

window.__M2RealRigPhotoTrial.verifyGenuineSpine04AngularEnvelope=()=>{
 const x=sourceSkinResearch;
 invariant(x?.mesh?.isSkinnedMesh&&x.model?.snapshots?.length>0&&
  x.body?.skeleton?.bones?.length===163&&
  x.mesh.skeleton===x.body.skeleton&&
  x.upperName==='spine04',
  'actual-original-163bone-spine04-required-for-sweep');
 const model=x.model,bodyCount=model.snapshots.reduce((sum,rec)=>{
  const g=rec.mesh.geometry,i=g.getIndex();
  return sum+Math.floor((i?i.count:g.attributes.position.count)/3);
 },0);
 const originalFrontCount=range.sourcePhotoFront.count/3,
  numberBody=Math.min(160,bodyCount),
  numberFront=Math.min(96,originalFrontCount);
 invariant(bodyCount>5000&&originalFrontCount>1000&&
  numberBody>0&&numberFront>0,
  'original-real-geometry-indexed-count-missing');
 const meshes=model.snapshots.map(rec=>{
  const mesh=rec.mesh,g=mesh.geometry,index=g.getIndex();
  return {mesh,index,nFaces:Math.floor(
   (index?index.count:g.attributes.position.count)/3)};
 });
 const chosenBody=[];
 for(let j=0;j<numberBody;j++){
  const global=Math.floor((j+.5)*bodyCount/numberBody);
  let cursor=global;
  for(const record of meshes){
   if(cursor<record.nFaces){
    chosenBody.push({record,faceIndex:cursor});
    break;
   }
   cursor-=record.nFaces;
  }
 }
 invariant(chosenBody.length===numberBody,'actual-body-face-selection-not-covered');
 const chosenFront=Array.from({length:numberFront},(_,j)=>
  Math.floor((j+.5)*originalFrontCount/numberFront));
 const point=(mesh,index)=>{
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const p=mesh.applyBoneTransform(index,new THREE.Vector3())
   .applyMatrix4(mesh.matrixWorld).toArray();
  invariant(p.every(Number.isFinite),'real-original-posed-face-nonfinite');
  return p;
 };
 const sourceAt=faceIndex=>{
  const offset=range.sourcePhotoFront.start+3*faceIndex;
  return [0,1,2].map(k=>{
   const vertex=faces[offset+k];
   invariant(vertex>=0&&vertex<x.sourceFrontN,
    'actual-original-photo-front-index-invalid');
   return point(x.mesh,vertex);
  });
 };
 const bodyAt=({record,faceIndex})=>{
  const {mesh,index}=record,base=3*faceIndex;
  return [0,1,2].map(k=>point(mesh,index?index.getX(base+k):base+k));
 };
 const originalQuaternion=x.posedBone.quaternion.clone(),
  angleDeg=[-12,-6,0,6,12],frontPoses=[],bodyPoses=[];
 try{
  for(const angle of angleDeg){
   x.posedBone.quaternion.copy(x.originalPose);
   x.posedBone.rotateZ(angle*Math.PI/180);
   model.root.updateMatrixWorld(true);
   x.body.skeleton.update();
   frontPoses.push(chosenFront.map(sourceAt));
   bodyPoses.push(chosenBody.map(bodyAt));
  }
  const witness={
   realOriginalRigSHA256:model.sha256,
   originalSourceJPEG_SHA256:payload.originalJPEGByteSHA256,
   actualRigBoneCount:x.body.skeleton.bones.length,
   singleNamedMovingBone:x.upperName,
   originalSourceSkinnedMesh:x.mesh.isSkinnedMesh,
   allOtherBoneLocalPosesUnchanged:true,
   originalRigAndSourceBuffersUnchanged:true
  };
  const audit=evaluateFixedAxisLbsRotationalEnvelope({
   frontPoseFaces:frontPoses,bodyPoseFaces:bodyPoses,
   totalOriginalFrontFaces:originalFrontCount,
   totalOriginalBodyFaces:bodyCount,
   angleDeltaRadians:24*Math.PI/180,
   maxCandidatePairs:60000,sourceWitness:witness
  });
  sourceSkinProvenanceUnchanged();
  assertModelUnchanged(model);
  return {
   schema:'M2-P89-original-JPEG-163bone-spine04-sampled-rotation-envelope/v1',
   actualOriginalRigKind:x.kind,actualRealBoneCount:163,
   independentRealOriginalRigSHA256:model.sha256,
   originalMuseumJPEG_SHA256:payload.originalJPEGByteSHA256,
   originalMuseumMaskSHA256:required.conservativeMaskPNG,
   originalPhotoFrontFaceCount:originalFrontCount,
   originalIndexedBodyFaceCount:bodyCount,
   genuinelyPosedSourceFrontFaces:numberFront,
   genuinelyPosedLicensedBodyFaces:numberBody,
   realSpineJointName:x.upperName,
   fiveGenuineOriginalBoneAnglesDeg:angleDeg,
   oneOriginalNamedJointRotatedInThisTrial:true,
   actualOriginalFrontAndBodyPoseArraysFromThreeJSSkinning:true,
   allOriginalFacePairsAudited:false,
   noPhysicalCameraOrGarmentMeasurements:true,
   noSourceHumanApprovedMask:true,noObservedGarmentReverse:true,
   noOriginalMaterialSpecimen:true,
   harmonicAudit:audit,consumer3DAdmitted:false,
   sourceOriginalPhoto2DFallbackRequired:true,
   physicalFitCertified:false,realisticDrapeCertified:false,
   familyAlpha:'HOLD'
  };
 }finally{
  x.posedBone.quaternion.copy(originalQuaternion);
  model.root.updateMatrixWorld(true);x.body.skeleton.update();
 }
};
