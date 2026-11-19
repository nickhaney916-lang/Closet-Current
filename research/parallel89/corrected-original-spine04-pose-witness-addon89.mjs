/**
 * This file is NEVER served by itself. The SHA-pinned original P89 native
 * browser runner appends these lines IN MEMORY to its untouched original
 * registration module; its module-scoped ORIGINAL source+rig variables remain
 * visible here. No static original, rig, mask or consumer file is changed.
 */
import {evaluateFixedAxisLbsRotationalEnvelope}
 from './corrected-original-spine04-motion-envelope89.mjs';

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
  const p=originalSkinnedVertexWorld(mesh,index).toArray();
  invariant(p.every(Number.isFinite),'corrected-original-posed-face-nonfinite');
  return p;
 };
 // Regression guard: original x/y/z MUST seed applyBoneTransform. A return
 // of any all-zero-seeded sample would reproduce the genuine #1497 failure.
 const firstOriginalSourceIndex=faces[range.sourcePhotoFront.start];
 const correct=originalSkinnedVertexWorld(x.mesh,firstOriginalSourceIndex);
 const wrong=x.mesh.applyBoneTransform(firstOriginalSourceIndex,
  new THREE.Vector3()).applyMatrix4(x.mesh.matrixWorld);
 const actualOriginalVsZeroSeedRigUnits=correct.distanceTo(wrong);
 invariant(actualOriginalVsZeroSeedRigUnits>.0001,
  'original-face-angular-witness-still-uses-zero-seeded-skinning');
 // Positive double area proves copied vertices have not collapsed to a
 // single skinned origin. All sampled faces in EVERY pose must be finite.
 const doubleArea=t=>{
  const [a,b,c]=t,
   u=b.map((v,k)=>v-a[k]),v=c.map((x,k)=>x-a[k]);
  return Math.hypot(u[1]*v[2]-u[2]*v[1],
   u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
 };
 let minAuthenticFrontDoubleArea=Infinity,
  minAuthenticBodyDoubleArea=Infinity;
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
   const ff=chosenFront.map(sourceAt),
    bb=chosenBody.map(bodyAt);
   for(const t of ff){
    const area=doubleArea(t);
    invariant(Number.isFinite(area)&&area>1e-12,
     'corrected-original-photo-front-sampled-triangle-collapsed');
    minAuthenticFrontDoubleArea=Math.min(minAuthenticFrontDoubleArea,area);
   }
   for(const t of bb){
    const area=doubleArea(t);
    invariant(Number.isFinite(area)&&area>1e-12,
     'corrected-original-real-163bone-body-sampled-triangle-collapsed');
    minAuthenticBodyDoubleArea=Math.min(minAuthenticBodyDoubleArea,area);
   }
   frontPoses.push(ff);
   bodyPoses.push(bb);
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
   originalZeroSeedFaultExcludedInThisWitness:true,
   originalCorrectedVsZeroSeedDistanceRigUnits:
    actualOriginalVsZeroSeedRigUnits,
   minimumTrueOriginalFrontDoubleAreaRigUnitsSquared:
    minAuthenticFrontDoubleArea,
   minimumTrueOriginalBodyDoubleAreaRigUnitsSquared:
    minAuthenticBodyDoubleArea,
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
