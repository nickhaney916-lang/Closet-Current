/** 3D-64 RESEARCH/HOLD — correct original source upper-shoulder crest, NOT
 * lower-sleeve pixel movement. Works on original independently sewn skinned
 * shirt cap and torso triangles; root upper-arm joints set the y landmark.
 * Original image RGB, panel UV, source/rest geometry metadata, 163-bone
 * weights, neutral unphotographed back material and source identity preserved.
 * Continuous collision, cloth dynamics, phone and human visual approval: NO.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const sm=THREE.MathUtils.smoothstep;
const stamp=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
const protectedNames=['panelPosition','panelNormal','skinIndex','skinWeight','uv'];
export function slopeTruePhotographedShoulderTop(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.sourceRigNaturalShoulderFall||
    !shirt?.stats?.measuredNaturalShirtSideFlow||
    !shirt?.stats?.independentArmholeCapPanels||
    !shirt?.stats?.naturalSourceShoulderSleeveTransition)
   throw Error('3D64 requires verified real photo source, true 3D61 upper arm, 3D59 anatomical body and independent sewn shoulders');
 root.updateMatrixWorld(true);
 const bones={};root.traverse(b=>{
  if(b.isBone&&['upperarm01L','upperarm01R'].includes(b.name))
   bones[b.name.slice(-1)]=b.getWorldPosition(new THREE.Vector3());
 });
 if(!bones.L||!bones.R||Math.sign(bones.L.x)===Math.sign(bones.R.x))
  throw Error('3D64 two original upper arm shoulder bones missing');
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh&&
   (m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap));
 if(meshes.length<3||!['L','R'].every(s=>meshes.some(m=>m.userData.work45IndependentShoulderCap===s)))
  throw Error('3D64 missing independently skinned original sewn shoulder caps');
 const groups=new Map(),snapshots=new Map();let originalFrontProtected=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const geo=mesh.geometry,p=geo.getAttribute('position'),idx=geo.index;
  if(!p||!idx||idx.count<3)throw Error('3D64 only authentic indexed garment triangles may change');
  const originals=new Map();
  for(const name of protectedNames){
   const a=geo.getAttribute(name);
   if(name==='uv'&&!a)continue;
   if(!a||a.count!==p.count)throw Error('3D64 immutable original photo or skin missing '+name);
   originals.set(name,a.array.slice());
  }
  snapshots.set(mesh,originals);
  for(const i of new Set(idx.array)){
   if(!Number.isInteger(i)||i<0||i>=p.count)throw Error('3D64 invalid genuine garment face');
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('3D64 nonfinite original source garment');
   if(Math.abs(q.x)<.255)originalFrontProtected++;
   const key=stamp(q);if(!groups.has(key))groups.set(key,{q,refs:[]});
   groups.get(key).refs.push({mesh,i});
  }
 }
 let moved=0,maxMove=0,nearBoneHeight=0,otherHeight=0,skippedVertices=0,seamGap=0;
 const witness={L:0,R:0},stats={L:{caps:0,shells:0,max:0},R:{caps:0,shells:0,max:0}};
 for(const {q,refs} of groups.values()){
  const side=Math.sign(q.x)===Math.sign(bones.L.x)?'L':'R';
  const isCap=refs.some(r=>!!r.mesh.userData.work45IndependentShoulderCap);
  const isShell=refs.some(r=>r.mesh.name==='Work56-independent-shirt-shell');
  if(isCap&&isShell)witness[side]++;
  const x=Math.abs(q.x),dy=q.y-bones[side].y;
  // The 3D61 A/B images changed lower sleeves at y=170..250px, not
  // the squared shoulder top at y=120..170px. Limit this operator to a
  // bone-relative high yoke, and use a source-continuous neutral taper.
  // Protected inner front print/neck x<.255; no cuffs, waist or back art.
  if(x<=.255||x>=.565||dy<=-.155||dy>=.265){skippedVertices+=refs.length;continue;}
  const across=sm(x,.255,.325)*(1-sm(x,.455,.565));
  const high=sm(dy,-.155,-.055)*(1-sm(dy,.125,.265));
  const weight=across*high;
  if(weight<.075)continue;
  const upperInfluence=sm(dy,-.065,.065);
  const drop=(.0095+.0145*upperInfluence)*weight;
  // Keep the cloth OUTSIDE the actual anatomical deltoid: the previous
  // inward taper caused 110 source-pose crossing triangle pairs on the
  // genuine male rig even after the validated pose-contact fitter.
  // An outward clearance ease is preferable to fabric intersecting skin;
  // only the actual joint-anchored high-yoke profile is still lowered.
  const clearanceOut=(.0035+.006*upperInfluence)*weight;
  const move=new THREE.Vector3(Math.sign(q.x)*clearanceOut,-drop,0);
  const distance=move.length();
  if(distance<.0005)continue;
  if(!Number.isFinite(distance)||distance>.02801)
   throw Error('3D64 original shoulder crest outside strict 28mm fabric envelope');
  const target=q.clone().add(move);
  for(const {mesh,i} of refs){
   const inv=mesh.matrixWorld.clone().invert();
   const local=target.clone().applyMatrix4(inv);
   mesh.geometry.getAttribute('position').setXYZ(i,local.x,local.y,local.z);
   const item=stats[side];if(mesh.userData.work45IndependentShoulderCap)item.caps++;
   else item.shells++;
   item.max=Math.max(item.max,distance);moved++;
  }
  if(dy>-.04)nearBoneHeight+=refs.length;else otherHeight+=refs.length;
  maxMove=Math.max(maxMove,distance);
 }
 for(const {refs} of groups.values()){
  if(new Set(refs.map(r=>r.mesh)).size<2)continue;
  const first=refs[0];
  const origin=new THREE.Vector3().fromBufferAttribute(first.mesh.geometry.getAttribute('position'),first.i).applyMatrix4(first.mesh.matrixWorld);
  for(const {mesh,i} of refs.slice(1)){
   const point=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),i).applyMatrix4(mesh.matrixWorld);
   seamGap=Math.max(seamGap,origin.distanceTo(point));
  }
 }
 for(const mesh of meshes){
  const geo=mesh.geometry,p=geo.getAttribute('position');
  p.needsUpdate=true;geo.computeVertexNormals();smoothSurfaceNormals(geo,p.count);
  geo.computeBoundingBox();geo.computeBoundingSphere();
  for(const [name,old] of snapshots.get(mesh)){
   const now=geo.getAttribute(name)?.array;
   if(!now||old.length!==now.length||!now.every((v,i)=>v===old[i]))
    throw Error('3D64 original photograph, UV, anatomical source or 163-bone skin weights changed: '+name);
  }
 }
 if(moved<30||nearBoneHeight<15||maxMove<.005||maxMove>.02801||
    originalFrontProtected<100||seamGap>5e-5||!Number.isFinite(seamGap)||
    ['L','R'].some(side=>stats[side].caps<5||stats[side].shells<5||witness[side]<3))
  throw Error('3D64 real upper shoulder top failed source-bone, two-sided real seam or visible material checks '+JSON.stringify(
   {moved,nearBoneHeight,otherHeight,maxMove,skippedVertices,originalFrontProtected,seamGap,witness,stats}));
 return {...shirt,stats:{...shirt.stats,
  trueSourceShoulderTopSlope:true,shoulderTopMovedOriginalRenderedVertices:moved,
  shoulderTopNearRealBoneHeightVertices:nearBoneHeight,shoulderTopLowerBandVertices:otherHeight,
  shoulderTopMaximumWorldMove:maxMove,shoulderTopBySide:stats,
  shoulderTopSewnCapTorsoSeamWitnesses:witness,shoulderTopSeamGap:seamGap,
  shoulderTopOriginalPhotoFrontProtected:originalFrontProtected,
  shoulderTopMethod:'source upper-arm joint referenced upper yoke, original photographic skinned cap+torso shared vertex taper without generated pixels',
  originalSourcePhotographUVAndSkinBytesIdentical:true,
  allPoseSignedCollisionCertified:false,physicalAndroidOrIphoneTested:false,
  humanPhotorealismApproved:false,releaseAuthorized:false
 }};
}