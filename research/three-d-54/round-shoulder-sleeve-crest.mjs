/** 3D54 — seam-locked source-photographic shoulder/sleeve crest rounding.
 * Isolated opt-in research; not a generic cylinder or fabricated garment
 * photograph. Gradually lowers the remaining shoulder ridge over the existing
 * original separated left/right cap and matching real shirt torso faces.
 *
 * No source pixels, printed chest, original UV, skin weights, mannequin body,
 * denim, collar, cuff, side hem, private photos or 2D default is altered.
 * It does not claim signed volume clearance, swept collision or cloth physics.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const smooth=THREE.MathUtils.smoothstep;
const stamp=p=>p.toArray().map(n=>n.toFixed(5)).join(':');
const protectedAttrs=['panelPosition','panelNormal','skinIndex','skinWeight'];
export function roundRealShoulderSleeveCrest(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.independentArmholeCapPanels||
    !shirt?.stats?.independentShoulderClothContour||
    !shirt?.stats?.upperArmFabricVolumeTailored||
    !shirt?.stats?.sourceNeutralCollarRoll||
    !shirt?.stats?.sourceNeutralRearFabricRelief)
  throw Error('3D54 requires actual original photo, detached bilateral caps, proven fabric/rear collar fit');
 root.updateMatrixWorld(true);
 const arms={};
 root.traverse(b=>{
  if(b.isBone&&['upperarm01L','upperarm01R'].includes(b.name))
   arms[b.name.endsWith('L')?'L':'R']=b.getWorldPosition(new THREE.Vector3());
 });
 if(!arms.L||!arms.R||Math.sign(arms.L.x)===Math.sign(arms.R.x))
  throw Error('3D54 actual anatomical left and right source shoulder bones unavailable');
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh&&
  (m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap));
 if(!meshes.some(m=>m.userData.work45IndependentShoulderCap==='L')||
    !meshes.some(m=>m.userData.work45IndependentShoulderCap==='R'))
  throw Error('3D54 requires original left and right separate skinned sewn shoulder panels');
 const groupBySource=new Map(),preserved=new Map();
 let protectedFront=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),indices=g.index;
  if(!p||!indices||indices.count<3)throw Error('3D54 requires actual rendered indexed cloth triangles');
  const records=new Map(protectedAttrs.map(name=>{
   const a=g.getAttribute(name);
   if(!a||a.count!==p.count)throw Error('3D54 original photograph/rig source attribute unavailable '+name);
   return [name,a.array.slice()];
  }));
  preserved.set(mesh,records);
  // Cap clipping leaves unused shell buffer vertices. They must NOT count
  // as garment movement or seam evidence; use actual rendered triangles.
  const rendered=new Set();
  for(let at=0;at<indices.count;at++){
   const i=indices.getX(at);
   if(!Number.isInteger(i)||i<0||i>=p.count)throw Error('3D54 invalid original source triangle index');
   rendered.add(i);
  }
  for(const i of rendered){
   const world=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(![world.x,world.y,world.z].every(Number.isFinite))throw Error('3D54 non-finite original source garment position');
   if(Math.abs(world.x)<.255)protectedFront++;
   const id=stamp(world);
   if(!groupBySource.has(id))groupBySource.set(id,{world,refs:[]});
   groupBySource.get(id).refs.push({mesh,i});
  }
 }
 const sides={L:{rendered:0,caps:0,shells:0,maxMove:0},R:{rendered:0,caps:0,shells:0,maxMove:0}};
 let moved=0,maxMove=0,realSeamWitnesses={L:0,R:0},seamGap=0;
 for(const group of groupBySource.values()){
  const q=group.world,x=Math.abs(q.x);
  const side=Math.sign(q.x)===Math.sign(arms.L.x)?'L':'R';
  const cap=group.refs.some(r=>Boolean(r.mesh.userData.work45IndependentShoulderCap));
  const shell=group.refs.some(r=>r.mesh.name==='Work56-independent-shirt-shell');
  if(cap&&shell)realSeamWitnesses[side]++;
  // Do not affect neck, front print (x<=.255), lower sleeves, waist or cuffs.
  if(x<=.305||x>=.62)continue;
  const dy=q.y-arms[side].y;
  const across=smooth(x,.305,.375)*(1-smooth(x,.505,.62));
  const height=smooth(dy,-.050,.020)*(1-smooth(dy,.09,.17));
  const weight=across*height;
  if(weight<.075)continue;
  // A source-bone referenced crest that eases to zero on both sides of
  // the shoulder: reduce the square high ridge, transitioning smoothly
  // into the sleeve instead of adding a surface cap/foam bulge.
  const excessive=Math.max(0,dy-.013);
  const drop=(.003+.009*smooth(excessive,.015,.095))*weight;
  const inward=.0035*weight;
  const step=new THREE.Vector3(-Math.sign(q.x)*inward,-drop,0);
  const length=step.length();
  if(length<.001)continue;
  if(!Number.isFinite(length)||length>.014)
   throw Error('3D54 source shoulder crest outside strict 14mm fabric profile envelope');
  const target=q.clone().add(step);
  for(const {mesh,i} of group.refs){
   const local=target.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
   mesh.geometry.getAttribute('position').setXYZ(i,local.x,local.y,local.z);
   moved++;const stat=sides[side];stat.rendered++;
   if(mesh.userData.work45IndependentShoulderCap)stat.caps++;else stat.shells++;
   stat.maxMove=Math.max(stat.maxMove,length);
  }
  maxMove=Math.max(maxMove,length);
 }
 // The source cut must stay physically sewn. Measure actual triangle-used
 // bilateral cap/shell coincident points, including those not reshaped.
 for(const group of groupBySource.values()){
  const participants=new Set(group.refs.map(r=>r.mesh));
  if(participants.size<2)continue;
  const first=group.refs[0];
  const anchor=new THREE.Vector3().fromBufferAttribute(first.mesh.geometry.getAttribute('position'),first.i).applyMatrix4(first.mesh.matrixWorld);
  for(const {mesh,i} of group.refs.slice(1)){
   const p=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),i).applyMatrix4(mesh.matrixWorld);
   seamGap=Math.max(seamGap,anchor.distanceTo(p));
  }
 }
 for(const mesh of meshes){
  const g=mesh.geometry,p=g.getAttribute('position');p.needsUpdate=true;
  g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,bytes] of preserved.get(mesh)){
   const after=g.getAttribute(name).array;
   if(after.length!==bytes.length||!after.every((v,i)=>v===bytes[i]))
    throw Error('3D54 altered original source photograph, UV or body skin weights: '+name);
  }
 }
 if(protectedFront<100||moved<30||maxMove<.003||maxMove>.014||
    ['L','R'].some(s=>sides[s].caps<5||sides[s].shells<5||realSeamWitnesses[s]<3)||
    !Number.isFinite(seamGap)||seamGap>5e-5)
  throw Error('3D54 actual source sewn-shoulder geometry unsafe or visually unchanged '+
   JSON.stringify({protectedFront,moved,maxMove,sides,realSeamWitnesses,seamGap}));
 return {...shirt,stats:{...shirt.stats,
  naturalSourceShoulderSleeveTransition:true,
  shoulderRoundMovedRenderedVertices:moved,
  shoulderRoundMaximumMove:maxMove,
  shoulderRoundBySide:sides,
  shoulderRoundSharedCapTorsoSeamWitnesses:realSeamWitnesses,
  shoulderRoundRealSeamGap:seamGap,
  shoulderRoundProtectedPhotoFrontVertices:protectedFront,
  shoulderRoundMethod:'source-bone deltoid crest easing on independent original skinned cloth caps and shirt shell, shared seam locked',
  originalPhotoUVAndSourceSkinWeightsUnchanged:true,
  independentRealGarmentCapsAndCollarPreserved:true,
  signedContainmentCertified:false,
  continuousSweptMotionCertified:false,
  humanVisualApproved:false,
  releaseAuthorized:false}};
}
