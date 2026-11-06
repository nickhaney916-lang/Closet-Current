/**
 * PHOTO103 — actual independently skinned CC0 163-bone photographed-jeans
 * sampled knee transition, source-pose-relative rather than accumulating.
 *
 * This is real anatomical bone deformation of source-verified garment mesh.
 * NO user photo ingestion, invented back photograph, self-claimed cloth
 * simulation, continuous swept collision safety or physical-phone approval.
 *
 * For donor research worktree: copy both PHOTO103 modules to
 * research/three-d-103, and apply P103 renderer-adapter.patch to the
 * exact CC0/source-photographed PR541 renderer. Main/default app unchanged.
 */
import * as T from 'three';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {findOriginalLowerLegBones78}
 from '../three-d-78/genuine-skinned-denim-knee-poses.mjs';
import {auditTrueSkinnedPhotographedDenimContact77}
 from '../three-d-77/true-skinned-denim-body-intersections.mjs';
import {isSourceVerifiedDenimId}
 from '../three-d-30/reviewed-photo-pants.mjs';
import {validatePhotographedDenimKnees103}
 from './knee-angles-policy.mjs';

const protectedAttrs=['position','pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const fail=msg=>{throw Error('3D103 '+msg);};
const source=Object.freeze({
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const actualSourceIds=Object.keys(source);
const assertOriginal=(root,pants)=>{
 const mesh=pants?.meshes?.[0],geometry=mesh?.geometry,position=geometry?.getAttribute('position');
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||pants.meshes.length!==1||
   mesh.skeleton?.bones?.length!==163||!position||position.count<400||
   !isSourceVerifiedDenimId(pants.stats?.sourceId)||
   !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
   !pants.stats?.originalPhotoUVRestFrontSkinPositionsBytePreserved77||
   !pants.stats?.sourcePhotoDenimSeamContinuity76||
   !pants.stats?.photoApplied||!actualSourceIds.includes(pants.stats?.sourceId)||
   pants.stats?.sourceSHA256!==source[pants.stats.sourceId]||
   protectedAttrs.some(n=>geometry.getAttribute(n)?.count!==position.count))
  fail('verified original 163-bone skinned and source-SHA-bound photographic jeans required');
 return mesh;
};
/** Research anatomy, not a physics/frame interpolation engine. */
export function setPhotographedDenimKneeStep103(root,pants,{left,right}={}){
 const value=validatePhotographedDenimKnees103(left,right);
 const mesh=assertOriginal(root,pants);
 const snapshots=new Map(protectedAttrs.map(name=>[
  name,mesh.geometry.getAttribute(name).array.slice()]));
 // The source pose is a fixed canonical anchor; earlier pose changes are
 // NEVER multiplied into new joint angles. This limits transition drift.
 setFashionPose(root,'source');
 const limbs=findOriginalLowerLegBones78(root,pants);
 for(const [i,degrees] of [value.leftDegrees,value.rightDegrees].entries()){
  if(!degrees)continue;
  limbs[i].quaternion.multiply(new T.Quaternion().setFromAxisAngle(
   new T.Vector3(1,0,0),T.MathUtils.degToRad(degrees)));
 }
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 for(const [name,old] of snapshots){
  const arr=mesh.geometry.getAttribute(name).array;
  if(arr.length!==old.length||!arr.every((v,i)=>v===old[i])){
   setFashionPose(root,'source');
   fail('source-true photographed garment rest/photo/UV/skin mutated: '+name);
  }
 }
 return Object.freeze({
  leftDegrees:value.leftDegrees,rightDegrees:value.rightDegrees,
  actualAnatomicalLowerLegBones:limbs.map(x=>x.name),
  genuineOriginal163BoneRig:true,actualSkinnedDenim:true,
  originalSourceSHA256:pants.stats.sourceSHA256,
  originalSourcePixelsPreserved:true,originalPhotoUVRestAndSkinPreserved:true,
  sourcePoseRelative:true,anatomicalBoneAnglesSet:true,
  contactAuditRequired:true,realDynamicClothPhysics:false,
  continuousFrameSimulationCertified:false,fullSweptCollisionCertified:false,
  physicalAndroidIphoneTested:false,humanVisualRealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
/** Audit each distinct real body / jeans skinned-triangle sample; unresolved
 * collisions are reported, never hidden as a "collision-free" assertion. */
export function auditPhotographedDenimKneeStep103(pants,root,{left,right}={}){
 const step=setPhotographedDenimKneeStep103(root,pants,{left,right});
 try{
  const tested=auditTrueSkinnedPhotographedDenimContact77(pants,root,{
   pose:'source-photographed-knees-'+left+'-'+right
  });
  const segments=tested.stats?.actualSkinnedDenimBodyCrossingSegments77;
  if(!Number.isSafeInteger(segments)||segments<0)
   fail('missing real posed skinned garment-body triangle contact count');
  return {...tested,stats:{...tested.stats,
   sampledPhotoDenimKnee103:true,
   real163BoneSampledKnee103:step,
   intermediateKneeCrossings103:segments,
   intermediateContactClassification103:tested.stats.actualSkinnedDenimBodyCrossingCategories77,
   originalJPEGAndSourceMappedFabricPreserved103:true,
   noInventedBackPhoto103:true,
   sampleOnlyNoContinuousPhysics103:true,
   sampledPoseNeedsHumanVisualReview103:true,
   releaseAuthorized:false,familyAlpha:'HOLD'
  }};
 }catch(e){
  setFashionPose(root,'source');root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  throw e;
 }
}
