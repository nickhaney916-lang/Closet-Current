/** 3D43: deterministic research-only quarter-step arm-pose interpolation.
 * Both endpoints are the original approved source/relaxed bone rotations.
 * No new anatomy, no saved user measurements, no altered body/garment assets.
 * Animation between sampled poses is NOT swept collision certification.
 */
import * as T from 'three';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
export const APPROVED_RESEARCH_POSES=Object.freeze(['source','blend-25','blend-50','blend-75','relaxed']);
const fractions=Object.freeze({'blend-25':.25,'blend-50':.50,'blend-75':.75});
function bones(root){const out=[];root.traverse(o=>{if(o.isBone)out.push(o);});return out;}
export function setResearchPose(root,pose){
 if(pose==='source'||pose==='relaxed')return setFashionPose(root,pose);
 if(!Object.hasOwn(fractions,pose))throw Error('Only original source/relaxed and bounded research quarter-step poses allowed');
 const list=bones(root);
 if(list.length<25)throw Error('Original anatomical skeleton unavailable for interpolated pose');
 setFashionPose(root,'source');const source=list.map(b=>b.quaternion.clone());
 setFashionPose(root,'relaxed');const relaxed=list.map(b=>b.quaternion.clone());
 for(let i=0;i<list.length;i++)list[i].quaternion.copy(source[i]).slerp(relaxed[i],fractions[pose]);
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return {mode:pose,fraction:fractions[pose],bones:list.length,sourceRigUnchanged:true,
  intermediateStaticPoseOnly:true,sweptCollisionCertified:false,releaseAuthorized:false};
}
