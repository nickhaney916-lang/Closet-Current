/**
 * Parallel #89: research-only UNSIGNED minimum triangle-surface distance for
 * exact world-space posed original photographed shirt/denim and CC0 anatomy.
 * A zero contact-crossing count is not clearance; nor is positive unsigned
 * distance proof that cloth is OUTSIDE a non-watertight anatomical mesh.
 * Never exposes vertices/face IDs, original JPEG bytes, or owner data.
 */
import {unsignedStaticSourceSurfaceGap89} from './unsigned-surface-core89.mjs';
import {auditOriginalAnatomicalBodyIndexTopology89} from './body-topology89.mjs';
import {posedSource84} from '../parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';
const POSES=['source','blend-50','relaxed'];
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIMS=Object.freeze({
 'commons-public-domain-jeans-2005':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'commons-cc-by-sa-denimjeans2-2008':'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const refusal=reason=>Object.freeze({
 schema:'P89-original-source-unsigned-3d-surface-gap/v1',
 status:'SOURCE_STATIC_GAP_UNVERIFIED',reason,
 signedOutwardClearanceProved:false,continuousSweptClothCertified:false,
 humanRealismAccepted:false,sourcePhoto2DFallbackRequired:true,
 consumer3DAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
/** Genuine original photo/rig session only; call on a P84-tested disposable
 * 163-bone source scene. All bone positions/quaternions and meshes unchanged.
 */
export function auditActualOriginalSourcePoseSurfaceGaps89({
 root,shirt,pants,avatar,applyPose,poseContactReceipt
}={}){
 if(!['female','male'].includes(avatar)||!root?.isObject3D||
  typeof applyPose!=='function'||shirt?.stats?.sourceSHA256!==SHIRT||
  !Object.hasOwn(DENIMS,pants?.stats?.sourceId)||
  pants?.stats?.sourceSHA256!==DENIMS[pants.stats.sourceId]||
  pants?.stats?.photoApplied!==true||
  poseContactReceipt?.schema!=='P84-authentic-163-bone-multiple-static-poses/v1'||
  poseContactReceipt?.actualPoseAuditCompleted!==true||
  poseContactReceipt?.originalPoseRestored!==true||
  poseContactReceipt?.safe3DClearanceProven!==false||
  poseContactReceipt?.continuousOrSweptCollisionCertified!==false||
  poseContactReceipt?.avatar!==avatar||
  !Array.isArray(poseContactReceipt.poseResults)||
  poseContactReceipt.poseResults.length!==3||
  !POSES.every((p,i)=>poseContactReceipt.poseResults[i]?.pose===p)||
  !Array.isArray(shirt?.meshes)||!shirt.meshes.length||
  !Array.isArray(pants?.meshes)||pants.meshes.length!==1)
  return refusal('original-public-source-photo-and-static-pose-receipt-required');
 const bodies=[],bones=[];
 root.traverse(o=>{
  if(o.isBone)bones.push(o);
  if(o.isSkinnedMesh&&!o.userData.work56Garment)bodies.push(o);
 });
 const all=[...bodies,...shirt.meshes,...pants.meshes];
 if(bones.length<160||!bodies.length||!all.every(m=>
  m.isSkinnedMesh&&m.skeleton?.bones.length===163))
  return refusal('actual-original-anatomical-rig-required');
 const snapshots=bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const sourceBuffers=all.map(m=>({
  m,g:m.geometry,position:m.geometry.getAttribute('position'),
  material:m.material,index:m.geometry.index
 }));
 const reports=[];let bodyIndexTopology;
 try{
  for(const pose of POSES){
   applyPose(pose);root.updateMatrixWorld(true);
   const prepared={};
   try{
    for(const [key,meshes] of [['shirt',shirt.meshes],['body',bodies],['denim',pants.meshes]])
     prepared[key]=posedSource84(meshes).g;
    if(pose==='source'){
     bodyIndexTopology=auditOriginalAnatomicalBodyIndexTopology89(prepared.body);
     if(bodyIndexTopology.status==='BODY_INDEX_TOPOLOGY_UNVERIFIED')
      throw Error('original-anatomy-source-triangle-topology-unverified');
    }
    const distances={};
    for(const [label,left,right] of [
     ['shirtBody','shirt','body'],['denimBody','denim','body'],['shirtDenim','shirt','denim']])
     distances[label]=unsignedStaticSourceSurfaceGap89(prepared[left],prepared[right]);
    const contacts=poseContactReceipt.poseResults.find(x=>x.pose===pose);
    if(!contacts)throw Error('actual-static-pose-contact-missing');
    reports.push(Object.freeze({pose,distances,
     originalTriangleCrossings:{
      shirtBody:contacts.shirtBodyCrossingTrianglePairs,
      denimBody:contacts.denimBodyCrossingTrianglePairs,
      shirtDenim:contacts.shirtDenimCrossingTrianglePairs
     },
     nearSurfaceThresholdMeters:.002,
     someSourceSurfacesWithin2mm:Object.values(distances).some(x=>
      x.unsignedMinimumSurfaceDistanceMeters<=.002),
     absenceOfTriangleCrossingsCannotCertifyPhysicalSeparation:true
    }));
   }finally{for(const g of Object.values(prepared))g?.dispose();}
  }
  if(!sourceBuffers.every(x=>x.m.geometry===x.g&&
   x.m.material===x.material&&x.g.index===x.index&&
   x.g.getAttribute('position')===x.position))
   throw Error('original-source-buffer-pointer-mutation');
  return Object.freeze({
   schema:'P89-original-source-unsigned-3d-surface-gap/v1',
   status:'THREE_ACTUAL_SOURCE_POSE_UNSIGNED_GAPS_MEASURED_NOT_CLEARANCE',
   originalPublicPhotoId:'commons-0003',
   originalShirtSHA256:SHIRT,denimSourceId:pants.stats.sourceId,
   originalDenimSHA256:pants.stats.sourceSHA256,
   avatar,actualAnatomical163Bones:true,
   originalSourcePoses:POSES.length,sourcePoseMeasurements:reports,
   exactOriginalWorldSpaceTrianglesMeasured:true,
   originalAnatomicalBodyIndexTopology:bodyIndexTopology,
   originalBodyTopologyDoesNotCertifySignedClothClearance:true,
   independentSignedDistanceOrBodyContainmentVerified:false,
   dynamicSweptClothContactVerified:false,
   independentPhotorealismApproved:false,
   sourcePhoto2DFallbackRequired:true,consumer3DAuthorized:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  return refusal('source-mesh-gap-evaluation-incomplete');
 }finally{
  for(const {b,p,q,s} of snapshots){
   b.position.copy(p);b.quaternion.copy(q);b.scale.copy(s);
  }
  root.updateMatrixWorld(true);
  for(const m of all)m.skeleton.update();
 }
}
