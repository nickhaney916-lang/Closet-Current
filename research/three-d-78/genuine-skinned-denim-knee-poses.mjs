/**
 * Closet Current 3D78 — REAL anatomical CC0 163-bone lower-leg articulation
 * of independently skinned, genuine source-photographed jeans. Research HOLD.
 *
 * This moves original rig bones, NOT JPEG pixels, meshes, rest vertices,
 * photo-front UV, original alpha, skin data, anatomical proportions or identity.
 * Snapshots are discrete static poses; no dynamics / swept collision claims.
 */
import * as T from 'three';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {auditTrueSkinnedPhotographedDenimContact77} from '../three-d-77/true-skinned-denim-body-intersections.mjs';

export const KNEE_RESEARCH_POSES78=Object.freeze(['source','left-12','right-12','both-16']);
const limits=Object.freeze({'left-12':[12,0],'right-12':[0,12],'both-16':[16,16]});
const locatorName=name=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
const kneeName=name=>/(?:lowerleg|shin|calf|knee|leg02)/.test(locatorName(name));
const signature=root=>{
 const result=[];
 root.traverse(b=>{if(b.isBone)result.push([b,b.quaternion.toArray().map(v=>+v.toFixed(9))]);});
 return result;
};
const near=(root,p)=>{
 const v=new T.Vector3();root.updateMatrixWorld(true);root.getWorldPosition(v);
 return v.distanceTo(p);
};
function findOriginalLowerLegBones78(root,pants){
 const bones=[];root.updateMatrixWorld(true);
 root.traverse(n=>{if(n.isBone&&kneeName(n.name))bones.push(n);});
 const legs=pants.stats?.landmarks;
 if(!Array.isArray(legs)||legs.length!==2||
  legs.some(l=>!Array.isArray(l.knee)||l.knee.length!==3||l.knee.some(v=>!Number.isFinite(v))))
  throw Error('3D78 authentic photographed denim anatomical knee landmarks required');
 if(bones.length<2)throw Error('3D78 no verified lower-leg bones on original 163-bone anatomical rig: '+
  bones.map(x=>x.name).join(','));
 const closest=legs.map(l=>{
  const p=new T.Vector3(...l.knee);
  return bones.map(b=>({bone:b,distance:near(b,p)})).sort((a,b)=>a.distance-b.distance)[0];
 });
 if(closest.some(x=>!x||x.distance>.19)||closest[0].bone===closest[1].bone)
  throw Error('3D78 named lower-leg joint is not within 19cm of distinct actual photo-denim left/right knees: '+
   JSON.stringify(closest.map(x=>({name:x?.bone?.name,distance:x?.distance}))));
 return closest.map(x=>x.bone);
}
/** Actual static joint change, no mesh/photo copying and no extra skeleton. */
export function setTrueDenimKneePose78(root,pants,pose='source'){
 if(!KNEE_RESEARCH_POSES78.includes(pose))
  throw Error('3D78 only approved source, left-12, right-12 or both-16 research poses');
 if(!root?.isObject3D||pants?.meshes?.length!==1||!pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  !pants.stats?.originalPhotoUVRestFrontSkinPositionsBytePreserved77)
  throw Error('3D78 requires original source photo and verified actual 3D77 mesh');
 const mesh=pants.meshes[0];
 if(mesh?.skeleton?.bones?.length!==163)throw Error('3D78 actual original 163-bone denim required');
 // Always reset via original saved source pose; bone rotations never accumulate.
 setFashionPose(root,'source');
 const limbs=findOriginalLowerLegBones78(root,pants),angles=limits[pose]||[0,0];
 for(let i=0;i<2;i++)if(angles[i]){
  limbs[i].quaternion.multiply(new T.Quaternion().setFromAxisAngle(
   new T.Vector3(1,0,0),T.MathUtils.degToRad(angles[i])));
 }
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return {pose,actualKneeBones:limbs.map(x=>x.name),
  kneeJointDegrees:angles.slice(),original163BoneRig:true,
  sourceJPEGUnchanged:true,sourceFrontUVUnchanged:true,
  poseStaticOnly:true,sweptCollisionCertified:false,
  releaseAuthorized:false};
}
export function auditSourcePhotoDenimAlternativeKneePose78(pants,root,{pose='left-12'}={}){
 if(!KNEE_RESEARCH_POSES78.includes(pose))
  throw Error('3D78 unsupported anatomical knee research pose');
 if(!pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)
  throw Error('3D78 requires verified source 3D77 denim baseline');
 const before=signature(root);
 const step=setTrueDenimKneePose78(root,pants,pose);
 let audited;
 try{
  audited=auditTrueSkinnedPhotographedDenimContact77(pants,root,{pose});
  const count=audited.stats.actualSkinnedDenimBodyCrossingSegments77;
  if(!Number.isInteger(count)||count<0)
   throw Error('3D78 missing actual bone-skinned triangle contact result');
  return {...audited,stats:{...audited.stats,
   realKneeArticulationAudited78:true,originalRigKneePose78:step,
   realKneeSkinnedBodyToDenimCrossings78:count,
   originalPhotoCoordinatesPreserved78:true,releaseAuthorized:false,
   poseResearchAssessment78:count?'REVIEW_REAL_POSE_CROSSINGS':'PASS_SAMPLED_KNEE_POSE_ONLY',
   humanPhotorealismApproved78:false,physicalAndroidIphoneVerified78:false,
   dynamicFabricPhysicsCertified78:false,sweptCollisionCertified78:false}};
 }catch(e){
  // Restore source pose after any failure; callers may explicitly reset after
  // a successful audit to inspect the bent authentic skinned garment.
  setFashionPose(root,'source');
  throw e;
 }
}
