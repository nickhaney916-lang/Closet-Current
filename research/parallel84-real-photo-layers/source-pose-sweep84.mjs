/**
 * Parallel Work #84 — REAL fully posed 163-bone licensed shirt+jeans audit.
 * Immutable P541 donor only. No private wardrobe, no generated source photos.
 * This is a diagnostic of discrete source/blend/relaxed RESEARCH arm poses,
 * never a swept-collision clearance certificate or a modification of the fit.
 *
 * A known approved P541 setResearchPose callback is supplied by the disposable
 * donor. ALL skeletal transforms are restored even on failure.
 */
import * as T from 'three';
import {posedSource84,countSourceContacts84} from './source-bone-yoke-trial84.mjs';

const DENIMS=Object.freeze({
 'commons-public-domain-jeans-2005':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'commons-cc-by-sa-denimjeans2-2008':'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const POSES=Object.freeze(['source','blend-50','relaxed']);
const base=Object.freeze({
 schema:'P84-authentic-163-bone-multiple-static-poses/v1',
 originalPhotoAndGarmentPositionsPreserved:true,
 noOwnerWardrobeOrRemoteRequests:true,
 staticPoseContactOnly:true,continuousOrSweptCollisionCertified:false,
 safe3DClearanceProven:false,fullPhysicalClothDynamics:false,
 independentHumanApproval:false,realPhoneAcceptance:false,releaseAuthorized:false
});
const failed=reason=>Object.freeze({...base,status:'UNVERIFIED_FAIL_CLOSED',
 reason,actualPoseAuditCompleted:false,poseResults:[]});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
// Each reason is a vetted research capability category, never raw fabric XYZ,
// owner identifiers, photo bytes, skeletal quaternions or private face indices.
const meshIssue=source=>{
 if(!Array.isArray(source)||!source.length)return 'mesh-list-empty';
 for(const m of source){
  if(!m?.isSkinnedMesh)return 'non-skinned-source-mesh';
  if(m.skeleton?.bones?.length!==163)return 'source-mesh-rig-not-163-bones';
  const g=m.geometry,count=g?.index?.count??g?.getAttribute('position')?.count;
  if(!Number.isSafeInteger(count)||count<3)return 'mesh-without-source-triangles';
  if(count%3!==0)return 'non-triangulated-source-face-topology';
 }
 return null;
};
const clean=source=>meshIssue(source)===null;
const meshSnapshot=meshes=>meshes.map(m=>({
 m,geometry:m.geometry,index:m.geometry.index,material:m.material,
 indices:m.geometry.index?.array.slice()??null,
 attrs:Object.entries(m.geometry.attributes).map(([name,attr])=>({
  name,attr,old:attr.array.slice()
 }))
}));
const unchanged=parts=>parts.every(({m,geometry,index,material,indices,attrs})=>
 m.geometry===geometry&&m.geometry.index===index&&m.material===material&&
 (index?(indices!==null&&index.array.length===indices.length&&
   indices.every((v,i)=>v===index.array[i])):indices===null)&&
 attrs.every(({name,attr,old})=>
  m.geometry.getAttribute(name)===attr&&attr.array.length===old.length&&
  old.every((v,i)=>Object.is(v,attr.array[i]))));
function samplePose(a,b,c){
 const layers=[[a,b,'shirtBody'],[c,b,'jeansBody'],[a,c,'shirtJeans']];
 const result={};
 for(const [left,right,label] of layers){
  const contact=countSourceContacts84(left.g,right.g);
  result[label]=contact.count;
 }
 return result;
}
/**
 * The callback may ONLY change pose of the already-authorized original
 * anatomical skeleton. It may not replace geometry or source materials.
 * Capture and restore all original joint transforms transactionally, even
 * if any pose fails, and exclude raw XYZ/bone quaternion/photo data from JSON.
 */
export function auditRealSourceGarmentArmPoses84({
 root,shirt,pants,avatar,applyPose,poses=POSES
}={}){
 if(!['male','female'].includes(avatar)||!root?.isObject3D||
    typeof applyPose!=='function')
  return failed('real-anatomical-figure-and-static-pose-callback-required');
 if(shirt?.stats?.sourceSHA256!==SHIRT)
  return failed('original-licensed-shirt-source-hash-unverified');
 if(pants?.stats?.photoApplied!==true||
    !Object.hasOwn(DENIMS,pants.stats?.sourceId)||
    DENIMS[pants.stats.sourceId]!==pants.stats.sourceSHA256)
  return failed('original-licensed-denim-source-hash-unverified');
 const shirtIssue=meshIssue(shirt?.meshes),pantsIssue=meshIssue(pants?.meshes);
 if(shirtIssue)return failed('shirt-'+shirtIssue);
 if(pantsIssue||pants.meshes.length!==1)
  return failed('denim-'+(pantsIssue||'not-one-original-sourced-piece'));
 if(!Array.isArray(poses)||poses.length!==3||
    poses.some((name,i)=>name!==POSES[i]))
  return failed('unapproved-static-research-pose-label');
 const bones=[],body=[];
 root.traverse(m=>{
  if(m.isBone)bones.push(m);
  if(m.isSkinnedMesh&&!m.userData.work56Garment)body.push(m);
 });
 if(bones.length<160||!clean(body)||
    !shirt.meshes.every(m=>m.skeleton.bones.length===163)||
    !pants.meshes.every(m=>m.skeleton.bones.length===163))
  return failed('real-anatomical-body-163-skeleton-required');
 const shoulders=bones.filter(b=>['upperarm01L','upperarm01R'].includes(b.name));
 if(shoulders.length!==2)return failed('named-real-shoulder-joints-required');
 const boneOriginal=bones.map(b=>({
  b,position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()
 }));
 const sources=meshSnapshot([...body,...shirt.meshes,...pants.meshes]);
 const restore=()=>{
  for(const {b,position,quaternion,scale} of boneOriginal){
   b.position.copy(position);b.quaternion.copy(quaternion);b.scale.copy(scale);
  }
  root.updateMatrixWorld(true);
  for(const {m} of sources)m.skeleton.update();
 };
 const receipts=[],qSamples=[];
 try{
  for(const name of POSES){
   applyPose(name);
   root.updateMatrixWorld(true);
   if(!unchanged(sources))
    throw Error('source-photo-or-skinned-geometry-mutated-in-pose');
   const arms=shoulders.map(b=>b.quaternion.clone());
   qSamples.push(arms);
   let a,b,c;
   try{
    a=posedSource84(shirt.meshes);
    b=posedSource84(body);
    c=posedSource84(pants.meshes);
    const sample=samplePose(a,b,c);
    const count=sample.shirtBody+sample.jeansBody+sample.shirtJeans;
    receipts.push(Object.freeze({
     pose:name,actual163BoneSkinnedSourceMesh:true,
     shirtBodyCrossingTrianglePairs:sample.shirtBody,
     denimBodyCrossingTrianglePairs:sample.jeansBody,
     shirtDenimCrossingTrianglePairs:sample.shirtJeans,
     witnessedCrossingCount:count,
     status:count>0?'CROSSING_WITNESSED':'NO_TRANSVERSE_CROSSING_WITNESSED_NOT_CLEARANCE'
    }));
   }finally{a?.g.dispose();b?.g.dispose();c?.g.dispose();}
  }
  const maxArmDifference=(left,right)=>Math.max(...left.map((q,i)=>q.angleTo(right[i])));
  const offset=maxArmDifference(qSamples[0],qSamples[2]),
   half0=maxArmDifference(qSamples[0],qSamples[1]),
   half1=maxArmDifference(qSamples[1],qSamples[2]);
  // No cosmetic reuse of the identical pose under three names.
  if(![offset,half0,half1].every(finite)||
     offset<.04||half0<.015||half1<.015||
     Math.abs(half0+half1-offset)>.025)
   throw Error('actual-original-bone-pose-motion-not-witnessed');
  if(!unchanged(sources))
   throw Error('source-photo-or-skinned-geometry-mutated-in-pose');
  return Object.freeze({...base,
   status:receipts.some(x=>x.witnessedCrossingCount>0)?
    'SOME_STATIC_POSES_WITNESS_CONTACT':'NO_STATIC_TRANSVERSE_CONTACT_WITNESSED_NOT_CLEARANCE',
   avatar,denimSourceId:pants.stats.sourceId,
   actualPoseAuditCompleted:true,poseResults:receipts,
   distinctJointRotationVerified:true,
   actualShoulderPoseEndToEndRadians:offset,
   staticPoseCount:receipts.length,
   allSourceTrianglesExaminedAtEachPose:true,
   noSourceGeometryModified:true,
   poseContactsCrossingWitnessOnly:true,
   originalPoseRestored:true
  });
 }catch(e){
  const known=new Set(['source-photo-or-skinned-geometry-mutated-in-pose',
   'actual-original-bone-pose-motion-not-witnessed']);
  return failed(known.has(e?.message)?e.message:'pose-contact-evaluation-incomplete');
 }finally{
  restore();
 }
}
