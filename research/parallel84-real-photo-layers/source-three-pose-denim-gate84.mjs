/**
 * P84 scoped original-photo jeans safe acceptance gate across three real
 * approved static 163-bone arm poses. It does NOT certify swept pose motion,
 * real cloth dynamics, sign-correct penetration depth, or human photorealism.
 * Only opt-in disposable P541 research donor calls this module.
 *
 * Preserve exact original photographed front, source UV, skeleton, source
 * JPEG/SHA, geometry faces, owner privacy, and whole-body geometry. No deploy.
 */
import * as T from 'three';
import {posedSource84,countSourceContacts84} from './source-bone-yoke-trial84.mjs';
import {trialSourceMeasuredDenimSide84} from './source-denim-side-trial84.mjs';
import {auditRealSourceGarmentArmPoses84} from './source-pose-sweep84.mjs';
const POSES=Object.freeze(['source','blend-50','relaxed']);
const DENIMS=Object.freeze({
 'commons-public-domain-jeans-2005':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'commons-cc-by-sa-denimjeans2-2008':'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const base=Object.freeze({
 schema:'P84-original-denim-three-static-pose-acceptance-gate/v1',
 researchOnly:true,unchangedPhotoSourceUVAnd163BoneRig:true,
 originalPhotoFrontVertexNeverMoved:true,originalBodyMeshesNotChanged:true,
 continuousMotionClothPhysicsNotCertified:true,
 humanVisualRealismNotCertified:true,physicalDeviceNotTested:true,
 noAutomatedRelease:true,releaseAuthorized:false
});
const refuse=(reason,extra={})=>Object.freeze({...base,status:'REFUSED_ORIGINAL_GEOMETRY_RESTORED',
 reason,trialApplied:false,originalGeometryRestored:true,...extra});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const added=(before,after)=>{
 let count=0;for(const key of after.pairs)if(!before.pairs.has(key))count++;
 return count;
};
function contacts(a,b,c){
 return {
  shirtBody:countSourceContacts84(a.g,b.g),
  jeansBody:countSourceContacts84(c.g,b.g),
  shirtJeans:countSourceContacts84(a.g,c.g)
 };
}
function witness(root,shirt,pants,bodies,applyPose){
 const out=[];
 for(const name of POSES){
  applyPose(name);
  root.updateMatrixWorld(true);
  let shirtPose,bodyPose,pantsPose;
  try{
   shirtPose=posedSource84(shirt.meshes);
   bodyPose=posedSource84(bodies);
   pantsPose=posedSource84(pants.meshes);
   out.push({name,contact:contacts(shirtPose,bodyPose,pantsPose)});
  }finally{
   shirtPose?.g.dispose();bodyPose?.g.dispose();pantsPose?.g.dispose();
  }
 }
 return out;
}
export function gateActualSourceDenimAcrossStaticPoses84({
 root,shirt,pants,avatar,applyPose,sideEaseMeters=.011,rearEaseMeters=.004
}={}){
 if(!['male','female'].includes(avatar)||!root?.isObject3D||
   typeof applyPose!=='function'||!shirt?.meshes?.length||
   shirt.stats?.sourceSHA256!==SHIRT||
   !pants?.stats?.photoApplied||!Object.hasOwn(DENIMS,pants.stats.sourceId)||
   pants.stats.sourceSHA256!==DENIMS[pants.stats.sourceId]||
   !Array.isArray(pants?.meshes)||pants.meshes.length!==1)
  return refuse('verified-licensed-source-photos-and-rig-required');
 const m=pants.meshes[0],g=m?.geometry,
  pos=g?.getAttribute('position'),norm=g?.getAttribute('normal');
 if(!m?.isSkinnedMesh||m.skeleton?.bones.length!==163||
   !pos||!norm||pos.count!==norm.count||
   !finite(sideEaseMeters)||sideEaseMeters<.002||sideEaseMeters>.025||
   !finite(rearEaseMeters)||rearEaseMeters<0||rearEaseMeters>.018)
  return refuse('original-photo-mesh-or-safe-ease-invalid');
 const bodies=[],bones=[];
 root.traverse(o=>{
  if(o.isBone)bones.push(o);
  if(o.isSkinnedMesh&&!o.userData.work56Garment)bodies.push(o);
 });
 if(!bodies.length||!bodies.every(x=>x.skeleton?.bones.length===163)||
   !shirt.meshes.every(x=>x.isSkinnedMesh&&x.skeleton?.bones.length===163)||
   bones.length<160)
  return refuse('full-original-anatomical-163-bone-source-required');
 const beforeP=pos.array.slice(),beforeN=norm.array.slice(),index=g.index;
 const beforeFaces=index?.array.slice()??null;
 const preserved=new Map(['pantsRest','pantsSourceUV','pantsSourceFront',
  'skinIndex','skinWeight','uv'].filter(x=>g.getAttribute(x))
  .map(name=>[name,{attr:g.getAttribute(name),old:g.getAttribute(name).array.slice()}]));
 const joints=bones.map(b=>({b,q:b.quaternion.clone(),p:b.position.clone(),s:b.scale.clone()}));
 const restoreJoints=()=>{
  for(const {b,q,p,s} of joints){b.quaternion.copy(q);b.position.copy(p);b.scale.copy(s);}
  root.updateMatrixWorld(true);
  for(const x of [...bodies,...shirt.meshes,...pants.meshes])x.skeleton.update();
 };
 const restoreOriginal=()=>{
  pos.array.set(beforeP);norm.array.set(beforeN);
  pos.needsUpdate=true;norm.needsUpdate=true;
  g.computeBoundingBox();g.computeBoundingSphere();
 };
 const protectedUnchanged=()=>{
  if(m.geometry!==g||g.index!==index||
    (index&&(!beforeFaces||!beforeFaces.every((v,i)=>v===index.array[i]))))
   return false;
  for(const [name,{attr,old}] of preserved){
   if(g.getAttribute(name)!==attr||attr.array.length!==old.length||
     !old.every((v,i)=>Object.is(v,attr.array[i])))return false;
  }
  const front=g.getAttribute('pantsSourceFront');
  if(!front)return false;
  for(let i=0;i<pos.count;i++)if(front.getX(i)>=.18){
   for(let k=0;k<3;k++)if(!Object.is(pos.array[i*3+k],beforeP[i*3+k]))
    return false;
  }
  return true;
 };
 let trial=null,results=[],restored=false;
 try{
  // First confirm the unchanged *genuine source* has all three legitimate
  // named poses before touching ANY original source garment coordinates.
  const dry=auditRealSourceGarmentArmPoses84({
   root,shirt,pants,avatar,applyPose
  });
  if(!dry.actualPoseAuditCompleted)
   return refuse('original-photos-or-source-pose-validation-refused',{
    auditedPoseCount:0
   });
  const original=witness(root,shirt,pants,bodies,applyPose);
  restoreJoints();
  trial=trialSourceMeasuredDenimSide84({
   root,shirt,pants,avatar,sideEaseMeters,rearEaseMeters
  });
  if(!trial.trialApplied){
   restoreOriginal();restored=true;
   return refuse('candidate-source-pose-fit-refused',{underlyingFitStatus:trial.status});
  }
  if(!protectedUnchanged())throw Error('original-photographed-front-or-UV-mutated');
  const modified=witness(root,shirt,pants,bodies,applyPose);
  for(let i=0;i<POSES.length;i++){
   const a=original[i].contact,b=modified[i].contact;
   const one={pose:POSES[i],newBodyShirtTrianglePairs:added(a.shirtBody,b.shirtBody),
    newBodyDenimTrianglePairs:added(a.jeansBody,b.jeansBody),
    newShirtDenimTrianglePairs:added(a.shirtJeans,b.shirtJeans),
    originalBodyDenimPairs:a.jeansBody.count,
    trialBodyDenimPairs:b.jeansBody.count,
    originalShirtDenimPairs:a.shirtJeans.count,
    trialShirtDenimPairs:b.shirtJeans.count,
    originalShirtBodyPairs:a.shirtBody.count,
    trialShirtBodyPairs:b.shirtBody.count,
    maximumOrientedPlaneDepthWorsened:
     b.shirtBody.maxDepth>a.shirtBody.maxDepth+.0005||
     b.jeansBody.maxDepth>a.jeansBody.maxDepth+.0005||
     b.shirtJeans.maxDepth>a.shirtJeans.maxDepth+.0005};
   results.push(Object.freeze(one));
  }
  const firstUnsafe=results.find(x=>
   x.newBodyShirtTrianglePairs>0||
   x.newBodyDenimTrianglePairs>0||
   x.newShirtDenimTrianglePairs>0||
   x.maximumOrientedPlaneDepthWorsened);
  if(firstUnsafe){
   restoreOriginal();restored=true;
   return refuse('new-original-source-triangle-crossing-at-'+firstUnsafe.pose,{
    fullOriginalFaceSampledPoses:POSES.length,poseResults:results,
    underlyingFitStatus:trial.status
   });
  }
  if(!protectedUnchanged())throw Error('original-photo-protection-incomplete');
  return Object.freeze({...base,status:'THREE_STATIC_POSES_NO_NEW_SOURCE_CROSSINGS_NOT_MOTION_CERTIFIED',
   trialApplied:true,originalGeometryRestored:false,
   originalPhotoSourceId:pants.stats.sourceId,avatar,
   sourcePoseOriginalProtected:true,
   exactPairIdentityComparison:true,
   allSourceFacesAudited:true,fullOriginalFaceSampledPoses:POSES.length,
   maxWorldSourcePanelChangeMeters:trial.maxAppliedWorldShiftMeters,
   actualFullContactPoseComparisons:results,
   candidateSourceFitStatus:trial.status});
 }catch(e){
  restoreOriginal();restored=true;
  return refuse('error-closed-restored-original-denim-source',{
   code:'static-contact-evaluation-incomplete',
   failedAtOriginalSourceGuard:e?.message==='original-photographed-front-or-UV-mutated'
  });
 }finally{
  restoreJoints();
 }
}
