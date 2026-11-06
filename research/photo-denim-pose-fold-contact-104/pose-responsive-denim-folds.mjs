/**
 * Closet Current PHOTO104 — source-original photo-jeans pose-responsive
 * NEUTRAL-REAR knee fabric relief, real skinned 163-bone anatomical rig.
 *
 * Geometry-only, sampled-pose adjustment: does not alter the original
 * photographed front JPEG, RGB, alpha, mask, UVs, immutable pantsRest,
 * original full-photo SHA256, anatomical body, skin indices or weights.
 *
 * Original PR541 donor only, after source-SHA + genuine 3D77 contact and
 * PHOTO103 anatomical joint angle validation. Research-only HOLD; neither
 * dynamic mass/gravity textile physics nor swept interval collision proof.
 */
import * as T from 'three';
import {auditPhotographedDenimKneeStep103}
 from '../three-d-103/actual-skinned-denim-103.mjs';
import {auditTrueSkinnedPhotographedDenimContact77}
 from '../three-d-77/true-skinned-denim-body-intersections.mjs';
import {setFashionPose}
 from '../three-d-09/pose-source.mjs';
import {poseDenimFoldAmplitude104} from './fold-profile.mjs';

const protectedOriginal=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const previous=new WeakMap();
const stamp=q=>q.toArray().map(n=>n.toFixed(5)).join(':');
const valid=v=>Number.isFinite(v);
const fail=message=>{throw Error('PHOTO104 '+message);};
const restore=(mesh,state)=>{
 const g=mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
 if(p.count!==state.vertexCount||p.array.length!==state.rest.length||
    n.array.length!==state.normals.length)fail('original denim topology replaced');
 p.array.set(state.rest);n.array.set(state.normals);
 p.needsUpdate=n.needsUpdate=true;
 g.computeBoundingBox();g.computeBoundingSphere();
};
function getImmutableBase(mesh,pants){
 const g=mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
 if(!p||!n||p.count<400||n.count!==p.count)fail('original independent 163-bone garment mesh required');
 const existing=previous.get(mesh);
 if(existing){
  if(existing.geometry!==g||existing.sourceSHA!==pants.stats.sourceSHA256)
   fail('wrong image or stale 3D donor after outfit change');
  return existing;
 }
 const protectedArrays=new Map();
 for(const name of protectedOriginal){
  const field=g.getAttribute(name);
  if(!field||field.count!==p.count)fail('missing protected source/rest/front/skin: '+name);
  protectedArrays.set(name,field.array.slice());
 }
 const state={geometry:g,rest:p.array.slice(),normals:n.array.slice(),
  protectedArrays,sourceSHA:pants.stats.sourceSHA256,vertexCount:p.count};
 previous.set(mesh,state);
 return state;
}
function inspectUnmodifiedSources(mesh,state){
 const g=mesh.geometry;
 for(const [name,expected] of state.protectedArrays){
  const now=g.getAttribute(name)?.array;
  if(!now||now.length!==expected.length||!now.every((v,i)=>v===expected[i]))
   fail('immutable source photo/rest/UV/front/skin changed: '+name);
 }
}
function foldSourceNeutralPosterior(mesh,pants,left,right,{multiplier=1}={}){
 const g=mesh.geometry,p=g.getAttribute('position'),front=g.getAttribute('pantsSourceFront');
 mesh.updateWorldMatrix(true,false);
 const inverse=mesh.matrixWorld.clone().invert();
 const knees=pants.stats.landmarks?.map(k=>new T.Vector3(...k.knee));
 if(knees?.length!==2||knees.some(k=>!k.toArray().every(valid)))
  fail('verified anatomical male/female source knee landmarks unavailable');
 const originalGroups=new Map();
 for(let i=0;i<p.count;i++){
  const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  if(!q.toArray().every(valid))fail('nonfinite original denim vertex');
  const id=stamp(q);
  if(!originalGroups.has(id))originalGroups.set(id,{q,indices:[],sourceFront:0});
  const group=originalGroups.get(id);
  group.indices.push(i);
  group.sourceFront=Math.max(group.sourceFront,front.getX(i));
 }
 let moved=0,protectedFront=0,maxShift=0,positiveLeg=0,negativeLeg=0;
 let kneeRegion=0,sourceRearOnly=0;
 for(const group of originalGroups.values()){
  const q=group.q;
  if(group.sourceFront>=.16){protectedFront+=group.indices.length;continue;}
  const side=q.x>=0?0:1,angle=side===0?left:right,measured=knees[side];
  const across=q.x-measured.x;
  // Protect crotch, ankle, unphotographed front silhouette, and unsupported
  // knee-side surfaces. Observed PR541 source neutral-rear is negative z.
  if(!angle||Math.abs(across)>.24||
   q.y<measured.y-.16||q.y>measured.y+.075||
   q.z>measured.z+.055)continue;
  kneeRegion+=group.indices.length;
  const rear=T.MathUtils.clamp((measured.z+.055-q.z)/.16,0,1);
  const field=poseDenimFoldAmplitude104({
   degrees:angle,kneeY:measured.y,y:q.y,across,
   rear,sourceFront:group.sourceFront
  });
  const dz=field*multiplier;
  if(Math.abs(dz)<.00013)continue;
  if(Math.abs(dz)>.011001)fail('pose-conditioned source rear exceeded 11 mm');
  const world=q.clone();world.z+=dz;
  const local=world.applyMatrix4(inverse);
  for(const id of group.indices)p.setXYZ(id,local.x,local.y,local.z);
  moved+=group.indices.length;
  sourceRearOnly+=group.indices.length;
  if(side===0)positiveLeg+=group.indices.length;
  else negativeLeg+=group.indices.length;
  maxShift=Math.max(maxShift,Math.abs(dz));
 }
 if((left||right)&&(moved<8||maxShift<.00020))
  fail('real source-neutral photographed jeans knee did not acquire measurable relief: '+
   JSON.stringify({moved,maxShift,kneeRegion,protectedFront,left,right}));
 if(protectedFront<70)fail('actual original photographed front guard coverage missing');
 p.needsUpdate=true;
 g.computeVertexNormals();g.getAttribute('normal').needsUpdate=true;
 g.computeBoundingBox();g.computeBoundingSphere();
 return {moved,protectedFront,maxShift,kneeRegion,sourceRearOnly,
  positiveLeg,negativeLeg,multiplier};
}
/** Returns real 3D77 skinned body/jeans contact diagnostics with fold metrics.
 * Each call resets to original source-rest coordinates FIRST to prevent
 * offset accumulation, regardless of previous knee pose or source material.
 */
export function auditSourceDenimPoseResponsiveFolds104(pants,root,{left,right}={}){
 if(!root?.isObject3D||pants?.meshes?.length!==1||
  !pants?.meshes?.[0]?.isSkinnedMesh||
  pants.meshes[0].skeleton?.bones?.length!==163||
  !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  !pants.stats?.sampledPhotoDenimKnee103&&
     !pants.stats?.sourcePhotoDenimSeamContinuity76)
  fail('exact PHOTO103 SHA-vetted, genuine source jeans 163-bone rig required');
 const mesh=pants.meshes[0];
 const state=getImmutableBase(mesh,pants);
 restore(mesh,state);
 inspectUnmodifiedSources(mesh,state);
 let baseline;
 try{
  baseline=auditPhotographedDenimKneeStep103(pants,root,{left,right});
  const before=baseline.stats.actualSkinnedDenimBodyCrossingSegments77;
  if(!Number.isSafeInteger(before)||before<0)fail('real source pose contact baseline unavailable');
  if(left===0&&right===0){
   // No new fold when the source-pose knee angle is zero.
   return {...baseline,stats:{...baseline.stats,
    poseResponsiveDenim104:true,
    sourceKneeFold104:{moved:0,protectedFront:mesh.geometry.getAttribute('position').count,
     maxShift:0,multiplier:0,contactBefore:before,contactAfter:before},
    originalDenimFrontSourceAndSkinProtected104:true,
    neutralRearOnlyFold104:true,
    realClothPhysicsSimulated104:false,
    continuousSweptCollisionCertified104:false,
    independentHumanPhotorealismApproved104:false,
    releaseAuthorized:false,familyAlpha:'HOLD'
   }};
  }
  let accepted=null;
  // Any unsafe sampled triangle crossing is rejected and the displacement
  // damped. If none is safe, the entire operation fails CLOSED and restores
  // the original source geometry. No 'zero collision' claim between samples.
  for(const multiplier of [1,.5,.25]){
   restore(mesh,state);
   const moved=foldSourceNeutralPosterior(mesh,baseline,left,right,{multiplier});
   inspectUnmodifiedSources(mesh,state);
   const checked=auditTrueSkinnedPhotographedDenimContact77(
    baseline,root,{pose:'photo104-source-knee-'+left+'-'+right+'-fold-'+multiplier});
   const after=checked.stats?.actualSkinnedDenimBodyCrossingSegments77;
   if(!Number.isSafeInteger(after)||after<0)fail('real post-fold skinned contact invalid');
   if(after<=before){
    accepted={checked,moved:{...moved,contactBefore:before,contactAfter:after}};
    break;
   }
  }
  if(!accepted)fail('real skinned body contacts increased for all guarded neutral-rear fold amplitudes');
  inspectUnmodifiedSources(mesh,state);
  return {...accepted.checked,stats:{...accepted.checked.stats,
   poseResponsiveDenim104:true,
   sourceKneeFold104:accepted.moved,
   originalDenimFrontSourceAndSkinProtected104:true,
   neutralRearOnlyFold104:true,
   originalSourceJPEGAndRGBNotModified104:true,
   noInventedBackSourceTexture104:true,
   sourcePoseRelativeNoAccumulation104:true,
   realClothPhysicsSimulated104:false,
   continuousSweptCollisionCertified104:false,
   physicalAndroidIphoneTested104:false,
   independentHumanPhotorealismApproved104:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  }};
 }catch(e){
  restore(mesh,state);
  setFashionPose(root,'source');
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  throw e;
 }
}
