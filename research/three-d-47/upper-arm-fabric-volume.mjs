/** 3D47 research-only garment construction: soften the inflated upper-arm
 * fabric volume seen in independent Chromium front/side/back comparisons.
 * Operates on REAL 3D45 physically separate shoulder-cap and shirt shell
 * coordinates after the 3D46 seam-locked shoulder profile. It does not
 * alter original garment photographs, the front printed panel, UV, rig, skin,
 * body, denim or default user-facing outfit experience.
 * This is deterministic garment seam tailoring, not cloth simulation.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=THREE.MathUtils.smoothstep;
const pointKey=p=>p.toArray().map(x=>x.toFixed(5)).join(':');
export function tailorIndependentUpperArmVolume(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.independentShoulderClothContour || !shirt?.stats?.independentArmholeCapPanels)
  throw Error('3D47 requires original photographed 3D46 cloth shoulders and separate 3D45 cap meshes');
 root.updateMatrixWorld(true);
 const bones={};
 root.traverse(o=>{
  if(o.isBone&&(o.name==='upperarm01L'||o.name==='upperarm01R'))
   bones[o.name.endsWith('L')?'L':'R']=o.getWorldPosition(new THREE.Vector3());
 });
 if(!bones.L||!bones.R)throw Error('Original male/female rig shoulder landmarks missing');
 const meshes=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap);
 if(meshes.length<3||!['L','R'].every(side=>meshes.some(m=>m.userData.work45IndependentShoulderCap===side)))
  throw Error('Independent upper-arm garment fabric panels not available');
 const groups=new Map(),protectedValues=new Map();
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position');
  if(!p)throw Error('No upper-arm garment position attribute');
  const attributes=['panelPosition','panelNormal','skinIndex','skinWeight'];
  const originals={};
  for(const name of attributes){
   const attr=g.getAttribute(name);
   if(!attr||attr.count!==p.count)throw Error('3D47 missing original source or anatomical rig attribute '+name);
   originals[name]=attr.array.slice();
  }
  protectedValues.set(mesh,originals);
  for(let i=0;i<p.count;i++){
   const world=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   const key=pointKey(world);
   if(!groups.has(key))groups.set(key,{world,refs:[]});
   groups.get(key).refs.push({mesh,index:i});
  }
 }
 const perSide={L:{changed:0,caps:0,torso:0,max:0},R:{changed:0,caps:0,torso:0,max:0}};
 let changed=0,maxMove=0,seamGroups=0,maxGap=0,protectedFront=0,depthMoves=0;
 for(const {world,refs} of groups.values()){
  const x=Math.abs(world.x),z=Math.abs(world.z);
  // The central source-photographed chest, print and neckline stay unmoved.
  if(x<=.35){protectedFront+=refs.length;continue;}
  const side=world.x<0?'L':'R',shoulder=bones[side];
  const dy=world.y-shoulder.y;
  const across=smooth(x,.35,.44)*(1-smooth(x,.59,.72));
  const down=smooth(dy,-.30,-.18)*(1-smooth(dy,.035,.15));
  const depth=smooth(z,.055,.13);
  const envelope=across*down;
  if(envelope<.12)continue;
  // Independent cloth silhouette is softened across arm width, while
  // source-neutral front/back fabric volume is drawn slightly toward its
  // anatomical plane. Shared cut-seam vertices are moved as one group.
  const dx=-Math.sign(world.x)*.014*envelope;
  const dz=-Math.sign(world.z)*.017*envelope*depth;
  const delta=new THREE.Vector3(dx,0,dz),length=delta.length();
  if(length<.002)continue;
  if(length>.023)throw Error('3D47 unbounded upper-arm fabric volume movement');
  const moved=world.clone().add(delta);
  for(const {mesh,index} of refs){
   const p=mesh.geometry.getAttribute('position');
   const v=moved.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
   p.setXYZ(index,v.x,v.y,v.z);
   const stats=perSide[side];
   stats.changed++;
   if(mesh.userData.work45IndependentShoulderCap)stats.caps++;else stats.torso++;
   stats.max=Math.max(stats.max,length);
   changed++;
  }
  if(Math.abs(dz)>.002)depthMoves+=refs.length;
  maxMove=Math.max(maxMove,length);
  if(new Set(refs.map(r=>r.mesh)).size>1){
   seamGroups++;
   const first=moved;
   for(const {mesh,index} of refs){
    const p=mesh.geometry.getAttribute('position');
    const other=new THREE.Vector3().fromBufferAttribute(p,index).applyMatrix4(mesh.matrixWorld);
    maxGap=Math.max(maxGap,first.distanceTo(other));
   }
  }
 }
 for(const mesh of meshes){
  const g=mesh.geometry,p=g.getAttribute('position');
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,before] of Object.entries(protectedValues.get(mesh))){
   const after=g.getAttribute(name).array;
   if(after.length!==before.length||!after.every((value,i)=>value===before[i]))
    throw Error('3D47 changed protected original photo/UV or skeleton: '+name);
  }
 }
 if(changed<50||depthMoves<15||maxMove<.006||maxGap>5e-5||
   ['L','R'].some(side=>perSide[side].caps<10||perSide[side].torso<5))
  throw Error('3D47 missing distinct symmetric genuine garment tailoring '+JSON.stringify({changed,depthMoves,maxMove,maxGap,perSide,seamGroups}));
 return {...shirt,stats:{...shirt.stats,
  upperArmFabricVolumeTailored:true,
  upperArmFabricEditedVertices:changed,
  upperArmFabricDepthMoves:depthMoves,
  upperArmFabricMaxMove:maxMove,
  upperArmFabricSeamGroups:seamGroups,
  upperArmFabricSeamGap:maxGap,
  upperArmFabricProtectedFrontVertices:protectedFront,
  upperArmFabricBySide:perSide,
  originalPhotographicSourceAndPanelCoordinatesUnchanged:true,
  realIndependentGarmentCapMeshesPreserved:true,
  signedVolumeContainmentCertified:false,
  continuousFabricMotionCertified:false,
  humanVisualApproved:false,
  releaseAuthorized:false}};
}
