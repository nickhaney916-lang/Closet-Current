/** 3D48 (research only): shape the EXISTING source-neutral collar band.
 * No extra neck mesh, painted piping, invented cloth texture, or user photo edit.
 * The original photographed shirt front and collar-to-shirt outer seam stay
 * fixed; only the band inner lip folds outward/upward by <= 12 mm.
 * This is a static textile construction proposal, not fabric simulation.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const key = p => p.toArray().map(v => v.toFixed(6)).join(':');
const worldPoint = (mesh,index) => new THREE.Vector3()
  .fromBufferAttribute(mesh.geometry.getAttribute('position'),index)
  .applyMatrix4(mesh.matrixWorld);

export function shapeSourceNeutralCollarRoll(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.necklineSeams || !shirt?.meshes?.length) {
  throw Error('3D48 requires an existing original-photographed sewn neckline');
 }
 root.updateMatrixWorld(true);
 let neck=null;
 root.traverse(o=>{if(o.isBone && o.name==='neck01')neck=o.getWorldPosition(new THREE.Vector3());});
 if(!neck)throw Error('Original neck bone landmark unavailable');
 const bands=shirt.meshes.filter(m=>m.name==='Work59-source-neutral-collar-band');
 if(bands.length!==1)throw Error('Expected exactly one existing independent collar band');
 const band=bands[0],g=band.geometry,p=g.getAttribute('position');
 if(!band.isSkinnedMesh || !p || p.count<60 || p.count%6!==0 || g.index) {
  throw Error('Original collar band six-vertex sewn edge topology required');
 }
 band.updateWorldMatrix(true,false);
 const protectedNames=['panelPosition','panelNormal','skinIndex','skinWeight'];
 const originals=new Map(protectedNames.map(name=>{
  const a=g.getAttribute(name);
  if(!a || a.count!==p.count)throw Error('Original collar source or skin field missing: '+name);
  return [name,a.array.slice()];
 }));
 // Work59 emits two triangles per collar seam: outer=[0,1,3],
 // inner=[2,4,5]. We move no outer endpoint, not even by one float.
 const outer=new Map(),inner=new Map();
 for(let i=0;i<p.count;i++){
  const q=worldPoint(band,i),id=key(q);
  if([2,4,5].includes(i%6)){
   if(!inner.has(id))inner.set(id,{q,ids:[]});
   inner.get(id).ids.push(i);
  }else outer.set(i,p.array.slice(i*3,i*3+3));
 }
 if(inner.size<12||outer.size<30)throw Error('Existing reviewed collar rim incomplete');
 const inverse=band.matrixWorld.clone().invert();
 let changed=0,maxMove=0,frontFold=0,backFold=0;
 for(const node of inner.values()){
  const original=node.q,radial=new THREE.Vector3(original.x-neck.x,0,original.z-neck.z);
  if(radial.lengthSq()<.001)throw Error('Collar lip lies inside anatomical neck landmark');
  const front=THREE.MathUtils.smoothstep(original.z-neck.z,-.07,.075);
  // Small real THREE-DIMENSIONAL band fold. A continuous source-neutral
  // lip follows the anatomical neck without a rigid horizontal flat strip.
  // Outward motion, not intrusion toward the neck; the outer photo seam is pinned.
  const outward=.004+.003*front;
  const rise=.002+.006*front;
  const next=original.clone().addScaledVector(radial.normalize(),outward);
  next.y+=rise;
  const moved=next.distanceTo(original);
  if(moved>.011 || !Number.isFinite(moved))throw Error('3D48 collar fold exceeds 11 mm');
  const local=next.applyMatrix4(inverse);
  for(const index of node.ids){
   p.setXYZ(index,local.x,local.y,local.z);
   changed++;
  }
  maxMove=Math.max(maxMove,moved);
  if(front>.5)frontFold++;else backFold++;
 }
 for(const [i,original] of outer){
  for(let j=0;j<3;j++)if(p.array[i*3+j]!==original[j])
   throw Error('3D48 altered real photographed shirt-to-collar seam');
 }
 let seamGap=0;
 for(const node of inner.values()){
  const first=worldPoint(band,node.ids[0]);
  for(const id of node.ids)seamGap=Math.max(seamGap,first.distanceTo(worldPoint(band,id)));
 }
 for(const [name,original] of originals){
  const a=g.getAttribute(name).array;
  if(a.length!==original.length||!a.every((v,i)=>v===original[i]))
   throw Error('3D48 changed original photo/UV/skeleton data: '+name);
 }
 if(changed<25||frontFold<3||backFold<3||maxMove<.004||seamGap>1e-5)
  throw Error('3D48 fails independent natural source-collar roll QA '+JSON.stringify({changed,frontFold,backFold,maxMove,seamGap}));
 p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
 g.computeBoundingBox();g.computeBoundingSphere();
 return {...shirt,stats:{...shirt.stats,
  sourceNeutralCollarRoll:true,
  collarRollChangedVertices:changed,
  collarRollMaximumMove:maxMove,
  collarRollSharedInnerSeamGap:seamGap,
  collarRollOuterPhotoSeamUnchanged:true,
  collarRollSourceUVAndWeightsUnchanged:true,
  collarRollMethod:'Existing independently skinned fabric band; outer photographed seam pinned; original neck referenced 3D inner lip fold',
  originalPhotographicPixelsUnchanged:true,
  clothSimulationCertified:false,
  continuousCollisionCertified:false,
  physicalPhoneTested:false,
  humanVisualApproved:false,
  releaseAuthorized:false}};
}
