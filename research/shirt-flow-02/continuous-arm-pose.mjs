/** SHIRT-FLOW-02. Original 163-bone source-to-relaxed fractions only.
 * 17 deterministic samples; not arbitrary cloth physics or swept safety proof.
 * Every sample is recomputed from unmodified canonical original joint rotations.
 */
import * as T from 'three';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {setResearchPose as setDiscretePose} from '../three-d-43/intermediate-pose.mjs';
export const CONTINUOUS_ARM_RESEARCH=Object.freeze({
 fractions:Object.freeze(Array.from({length:17},(_,i)=>i/16)),
 modelBones:163,defaultOff:true,releaseAuthorized:false,
 arbitraryContinuousClothCertified:false,sweptCollisionCertified:false
});
export function verifiedArmFraction(fraction){
 if(typeof fraction!=='number'||!Number.isFinite(fraction)||
    fraction<0||fraction>1||Math.abs(fraction*16-Math.round(fraction*16))>1e-9)
  throw Error('Only 17 deterministic reviewed anatomical arm fractions permitted');
 return Math.round(fraction*16)/16;
}
export function setResearchPose(root,phase){
 if(typeof phase==='string')return setDiscretePose(root,phase);
 const fraction=verifiedArmFraction(phase);
 const bones=[];root.traverse(obj=>{if(obj.isBone)bones.push(obj);});
 if(bones.length!==163)throw Error('Only unmodified original 163-bone anatomical figures accepted');
 setFashionPose(root,'source');
 const originals=bones.map(b=>b.quaternion.clone());
 setFashionPose(root,'relaxed');
 const relaxed=bones.map(b=>b.quaternion.clone());
 for(let i=0;i<bones.length;i++)bones[i].quaternion.copy(originals[i]).slerp(relaxed[i],fraction);
 root.updateMatrixWorld(true);
 root.traverse(obj=>{if(obj.isSkinnedMesh)obj.skeleton.update();});
 return {mode:phase,fraction,bones:bones.length,canonicalSourceReset:true,
  originalJointRotations:true,sourcePhotosUnchanged:true,
  continuousClothPhysicsCertified:false,sweptCollisionCertified:false,releaseAuthorized:false};
}
