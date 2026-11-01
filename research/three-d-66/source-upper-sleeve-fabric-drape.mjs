/** 3D-66 research/HOLD — source-rig upper-sleeve textile gravity drape.
 * Source garment uses its actual photographed pixel/UV panels and the SAME
 * original 163-bone anatomy. Adds spatially distinct soft upper-arm folds to
 * independent skinned fabric (NOT printed crease/shader/pasted-on clothes).
 * Natural seam transitions: sewn cap/torso coincident vertices travel together.
 * External-side radial movement prevents driving cloth toward humerus; the
 * existing 3D56 post-fit BVH pose contact solver remains mandatory.
 * No synthesized rear photo, inferred textile colors, paid AI or deploy.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=THREE.MathUtils.smoothstep;
const key=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
const protectedNames=['panelPosition','panelNormal','skinIndex','skinWeight','uv'];
export function drapeSourceUpperSleeveFabric(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.trueSourceShoulderTopSlope||
    !shirt?.stats?.sourceRigNaturalShoulderFall||
    !shirt?.stats?.sourceMeasuredNaturalSleeveHang||
    !shirt?.stats?.independentArmholeCapPanels)
  throw Error('3D66 needs genuine source photo, bone-aligned high shoulder, sewn armhole and sleeve drape');
 root.updateMatrixWorld(true);
 const bones={};
 for(const side of ['L','R']){
  const actual={};
  root.traverse(b=>{if(b.isBone&&(b.name==='upperarm01'+side||b.name==='lowerarm01'+side))
   actual[b.name.slice(0,-1)]=b.getWorldPosition(new THREE.Vector3());});
  const shoulder=actual.upperarm01,elbow=actual.lowerarm01;
  if(!shoulder||!elbow)throw Error('3D66 missing actual source shoulder/elbow '+side);
  const axis=elbow.clone().sub(shoulder),length=axis.length();
  if(!Number.isFinite(length)||length<.16||length>.8)
   throw Error('3D66 invalid true upper-arm bone segment '+side);
  bones[side]={shoulder,elbow,axis,len2:axis.lengthSq()};
 }
 if(Math.sign(bones.L.shoulder.x)===Math.sign(bones.R.shoulder.x))
  throw Error('3D66 bilateral real arm model is not anatomical');
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh&&
  (m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap));
 if(meshes.length<3||!['L','R'].every(side=>meshes.some(m=>m.userData.work45IndependentShoulderCap===side)))
  throw Error('3D66 independently skinned genuine source shirt panels unavailable');
 const groups=new Map(),snapshot=new Map();
 let sourceCenterProtected=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),ix=g.index;
  if(!p||!ix||ix.count<3)throw Error('3D66 indexed real garment face unavailable');
  const original=new Map();
  for(const name of protectedNames){
   const attr=g.getAttribute(name);
   if(name==='uv'&&!attr)continue;
   if(!attr||attr.count!==p.count)throw Error('3D66 source pixel/UV/skin missing '+name);
   original.set(name,attr.array.slice());
  }
  snapshot.set(mesh,original);
  for(const i of new Set(ix.array)){
   if(!Number.isInteger(i)||i<0||i>=p.count)throw Error('3D66 bad rendered source triangle');
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('3D66 nonfinite real cloth');
   if(Math.abs(q.x)<.31)sourceCenterProtected++;
   const stamp=key(q);
   if(!groups.has(stamp))groups.set(stamp,{q,refs:[]});
   groups.get(stamp).refs.push({mesh,i});
  }
 }
 const stats={L:{moved:0,caps:0,shells:0,foldNear:0,foldFar:0,maxMove:0},
              R:{moved:0,caps:0,shells:0,foldNear:0,foldFar:0,maxMove:0}};
 let moved=0,maxMove=0,seamGap=0;
 const witnesses={L:0,R:0};
 for(const {q,refs} of groups.values()){
  const side=Math.sign(q.x)===Math.sign(bones.L.shoulder.x)?'L':'R';
  const arm=bones[side];
  const hasCap=refs.some(r=>!!r.mesh.userData.work45IndependentShoulderCap);
  const hasTorso=refs.some(r=>r.mesh.name==='Work56-independent-shirt-shell');
  if(hasCap&&hasTorso)witnesses[side]++;
  const x=Math.abs(q.x);
  if(x<=.39)continue; // real front print / neckline remains unaltered
  const t=q.clone().sub(arm.shoulder).dot(arm.axis)/arm.len2;
  if(t<=.18||t>=.84)continue; // top cap and real elbow seam fixed
  const center=arm.shoulder.clone().addScaledVector(arm.axis,t);
  const radial=q.clone().sub(center);
  const radius=radial.length();
  if(radius<.03||radius>.23)continue;
  const along=smooth(t,.18,.30)*(1-smooth(t,.72,.84));
  const radialWeight=smooth(radius,.03,.068)*(1-smooth(radius,.185,.23));
  const lateral=smooth(x,.39,.47);
  const envelope=along*radialWeight*lateral;
  if(envelope<.07)continue;
  // The source photographs and true 163-joint upper-arm proportions determine
  // placement. Two broad displaced folds, no fake repetitive procedural print.
  const near=Math.exp(-Math.pow((t-.37)/.14,2));
  const far=Math.exp(-Math.pow((t-.67)/.13,2));
  const frontBack=Math.abs(radial.z)/radius;
  const directionWeight=.65+.35*smooth(frontBack,.12,.72);
  const expansion=(.0037*near+.0065*far)*envelope*directionWeight;
  const gravity=.0017*envelope*(.6+.4*far);
  if(expansion<.00018)continue;
  // An outward anatomical separation offsets the slight downward fabric
  // weight, preventing synthetic inward body-cloth inflation.
  const shift=radial.multiplyScalar(expansion/radius).add(new THREE.Vector3(0,-gravity,0));
  const distance=shift.length();
  if(!Number.isFinite(distance)||distance>.01301)
   throw Error('3D66 cloth fall beyond strict real source 13mm envelope');
  const target=q.clone().add(shift);
  const s=stats[side];
  for(const {mesh,i} of refs){
   const local=target.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
   mesh.geometry.getAttribute('position').setXYZ(i,local.x,local.y,local.z);
   moved++;s.moved++;
   if(mesh.userData.work45IndependentShoulderCap)s.caps++;else s.shells++;
   if(near>=far)s.foldNear++;else s.foldFar++;
   s.maxMove=Math.max(s.maxMove,distance);
  }
  maxMove=Math.max(maxMove,distance);
 }
 for(const {refs} of groups.values()){
  if(new Set(refs.map(r=>r.mesh)).size<2)continue;
  const a=refs[0];
  const first=new THREE.Vector3().fromBufferAttribute(a.mesh.geometry.getAttribute('position'),a.i).applyMatrix4(a.mesh.matrixWorld);
  for(const {mesh,i} of refs.slice(1)){
   const p=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),i).applyMatrix4(mesh.matrixWorld);
   seamGap=Math.max(seamGap,first.distanceTo(p));
  }
 }
 for(const mesh of meshes){
  const g=mesh.geometry,p=g.getAttribute('position');
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,before] of snapshot.get(mesh)){
   const after=g.getAttribute(name)?.array;
   if(!after||after.length!==before.length||!after.every((v,i)=>v===before[i]))
    throw Error('3D66 altered original source garment pixel/UV or 163-joint skin metadata '+name);
  }
 }
 if(moved<40||maxMove<.001||maxMove>.01301||sourceCenterProtected<100||
    !Number.isFinite(seamGap)||seamGap>5e-5||
    ['L','R'].some(side=>stats[side].moved<20||stats[side].foldNear<8||
     stats[side].foldFar<8||witnesses[side]<3))
  throw Error('3D66 authentic upper-sleeve sewn source folds unavailable '+JSON.stringify(
    {moved,maxMove,sourceCenterProtected,seamGap,stats,witnesses}));
 return {...shirt,stats:{...shirt.stats,
  actualUpperSleeveGravityDrape:true,upperSleeveDrapeRealMovedVertices:moved,
  upperSleeveDrapeMaximumMove:maxMove,upperSleeveDrapeBySide:stats,
  upperSleeveDrapeRealCapTorsoWitnesses:witnesses,
  upperSleeveDrapeRealSeamGap:seamGap,
  upperSleeveDrapeProtectedPhotoCenterVertices:sourceCenterProtected,
  upperSleeveDrapeMethod:'two bone-relative original upperarm longitudinal soft folds, outwards fabric clearance, original UV and skin identical',
  originalPhotographicPixelsUVAndSkinUnchanged:true,
  signedAllPoseCollisionCertified:false,physicalAndroidIphoneCertified:false,
  humanPhotorealismApproved:false,releaseAuthorized:false
 }};
}