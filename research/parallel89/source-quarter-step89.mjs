/**
 * Mission #89 / HOLD: source-photo quarter-step STATIC pose witnesses.
 * P541's genuine approved 163-bone setResearchPose supports blend-25 and
 * blend-75, between P84's three sampled source/blend-50/relaxed poses.
 * This is NOT continuous swept-trajectory collision certification.
 * Only original SHA-vetted PUBLIC research garments, never private owners.
 */
import {posedSource84,countSourceContacts84} from '../parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';
import {unsignedStaticSourceSurfaceGap89} from './unsigned-surface-core89.mjs';
const POSES=Object.freeze(['blend-25','blend-75']);
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIMS=Object.freeze({
 'commons-public-domain-jeans-2005':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'commons-cc-by-sa-denimjeans2-2008':'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const out=Object.freeze({
 schema:'P89-real-original-shirt-jeans-static-quarterstep-gap/v1',
 signedExteriorClearanceCertified:false,
 bodyContainmentCertified:false,
 sweptContinuousCollisionCertified:false,
 realClothDynamicsCertified:false,
 realMobileOwnerAcceptance:false,
 originalPhoto2DFallbackRequired:true,
 consumer3DAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const deny=reason=>Object.freeze({...out,status:'UNVERIFIED_STATIC_QUARTERSTEP',
 reason,authenticQuarterPoseCount:0,poseWitnesses:[]});
export function auditActualSourceQuarterStepSurfaceGaps89({
 root,shirt,pants,avatar,applyPose
}={}){
 if(!['female','male'].includes(avatar)||!root?.isObject3D||
  shirt?.stats?.sourceSHA256!==SHIRT||
  pants?.stats?.photoApplied!==true||
  !Object.hasOwn(DENIMS,pants?.stats?.sourceId)||
  DENIMS[pants.stats.sourceId]!==pants.stats.sourceSHA256||
  typeof applyPose!=='function'||
  !Array.isArray(shirt?.meshes)||!shirt.meshes.length||
  !Array.isArray(pants?.meshes)||pants.meshes.length!==1)
  return deny('original-public-photo-source-or-bone-pose-required');
 const bones=[],body=[];
 root.traverse(x=>{if(x.isBone)bones.push(x);
  if(x.isSkinnedMesh&&!x.userData.work56Garment)body.push(x);
 });
 const meshes=[...body,...shirt.meshes,...pants.meshes];
 if(bones.length<160||body.length<1||!meshes.every(x=>
  x?.isSkinnedMesh&&x.skeleton?.bones?.length===163))
  return deny('actual-original-163bone-source-missing');
 const joints=bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const protectedSource=meshes.map(m=>({m,geometry:m.geometry,material:m.material,
  index:m.geometry.index,
  attr:Object.entries(m.geometry.attributes).map(([name,a])=>({name,a,array:a.array.slice()}))
 }));
 const unchanged=()=>protectedSource.every(({m,geometry,material,index,attr})=>
  m.geometry===geometry&&m.material===material&&geometry.index===index&&
  attr.every(({name,a,array})=>geometry.getAttribute(name)===a&&
   a.array.length===array.length&&array.every((v,i)=>Object.is(v,a.array[i]))));
 const receipts=[];let outcome;
 try{
  for(const pose of POSES){
   const p=applyPose(pose);
   if(p?.mode!==pose||p?.fraction!==(pose==='blend-25'?.25:.75)||
    p?.sourceRigUnchanged!==true||p?.sweptCollisionCertified!==false)
    throw Error('original-p541-quarterstep-bone-interpolation-unverified');
   root.updateMatrixWorld(true);
   if(!unchanged())throw Error('actual-original-source-buffers-moved');
   const geometries={};
   try{
    for(const [key,collection] of [
     ['shirt',shirt.meshes],['body',body],['denim',pants.meshes]])
     geometries[key]=posedSource84(collection).g;
    const witnessed={};
    for(const [label,left,right] of [
     ['shirtBody','shirt','body'],['denimBody','denim','body'],
     ['shirtDenim','shirt','denim']]){
     const a=geometries[left],b=geometries[right];
     const surface=unsignedStaticSourceSurfaceGap89(a,b);
     const crossing=countSourceContacts84(a,b);
     if(!Number.isSafeInteger(crossing.count)||crossing.count<0)
      throw Error('original-triangle-contact-measure-unavailable');
     witnessed[label]=Object.freeze({
      unsignedMinimumSurfaceDistanceMeters:surface.unsignedMinimumSurfaceDistanceMeters,
      originalTriangleCrossingPairs:crossing.count,
      exactOriginalTriangulatedSurfacesMeasured:true,
      signedInteriorExteriorNotMeasured:true,
      dynamicSweptClothNotMeasured:true
     });
    }
    receipts.push(Object.freeze({pose,originalAnatomicalBonePose:true,
     sourcePairs:witnessed,staticQuarterPoseOnly:true,
     sweptCollisionCertified:false}));
   }finally{
    for(const g of Object.values(geometries))g?.dispose();
   }
  }
  if(!unchanged())throw Error('original-public-geometry-mutated');
  outcome=Object.freeze({...out,
   status:'ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT',
   avatar,originalShirtSHA256:SHIRT,
   originalDenimSourceId:pants.stats.sourceId,
   originalDenimSHA256:pants.stats.sourceSHA256,
   realAnatomical163BoneRig:true,
   authenticQuarterPoseCount:2,
   poseWitnesses:receipts,
   allOriginalFacePairsExamined:true,
   staticQuarterStepNotSweptMotion:true,
   originalSourceGeometryUnchanged:true,
   originalBonesRestored:false
  });
 }catch{
  outcome=deny('source-quarterstep-measurement-or-integrity-unverified');
 }finally{
  try{
   for(const {b,p,q,s} of joints){
    b.position.copy(p);b.quaternion.copy(q);b.scale.copy(s);
   }
   root.updateMatrixWorld(true);
   for(const m of meshes)m.skeleton.update();
   const restored=joints.every(({b,p,q,s})=>
    b.position.toArray().every((v,i)=>Object.is(v,p.getComponent(i)))&&
    b.quaternion.toArray().every((v,i)=>Object.is(v,q.toArray()[i]))&&
    b.scale.toArray().every((v,i)=>Object.is(v,s.getComponent(i))));
   if(!restored||!unchanged())
    outcome=deny('original-anatomical-bones-or-source-buffers-not-restored');
   else if(outcome?.status==='ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT')
    outcome=Object.freeze({...outcome,originalBonesRestored:true});
  }catch{
   outcome=deny('original-anatomical-skeleton-restoration-unverified');
  }
 }
 return outcome;
}
