/** 3D57: selected-pose-responsive real source-photographed sleeve cloth.
 * Unlike fixed source-stage creases, source skinned garment local geometry
 * varies deterministically as arms move between the approved original source
 * and relaxed poses. Uses genuine elbow/wrist source bone landmarks.
 *
 * This is NOT arbitrary real-time cloth dynamics, continuous swept contact,
 * signed garment-body penetration certification, generated reverse photos,
 * nor permission for Family Alpha or production.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {setResearchPose} from '../three-d-43/intermediate-pose.mjs';
const smooth=THREE.MathUtils.smoothstep;
const fractions=Object.freeze({source:0,'blend-25':.25,'blend-50':.5,'blend-75':.75,relaxed:1});
const protectedAttributes=['panelPosition','panelNormal','skinIndex','skinWeight'];
const pointKey=q=>q.toArray().map(v=>v.toFixed(5)).join(':');

export function preparePhotographedPoseResponsiveElbows(root,shirt,{enabled=true}={}){
 if(!enabled)return null;
 if(!shirt?.stats?.originalSourceElbowClothCreases||
    !shirt?.stats?.sourceMeasuredNaturalSleeveHang||
    !shirt?.stats?.naturalSourceShoulderSleeveTransition)
  throw Error('3D57 needs existing true source photographed 3D54/55/56 physical elbow cloth');
 setResearchPose(root,'source');
 root.updateMatrixWorld(true);
 const arms={};
 for(const side of ['L','R']){
  const find=name=>{
   let b;root.traverse(o=>{if(o.isBone&&o.name===name+side)b=o;});
   if(!b)throw Error('3D57 missing original source anatomical bone '+name+side);
   return b.getWorldPosition(new THREE.Vector3());
  };
  const elbow=find('lowerarm01'),wrist=find('wrist');
  const axis=wrist.clone().sub(elbow),lengthSq=axis.lengthSq();
  if(lengthSq<.01||!Number.isFinite(lengthSq))throw Error('3D57 invalid source elbow-wrist axis');
  arms[side]={elbow,wrist,axis,lengthSq};
 }
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh);
 const shells=meshes.filter(m=>m.name==='Work56-independent-shirt-shell');
 const caps=meshes.filter(m=>Boolean(m.userData.work45IndependentShoulderCap));
 if(!shells.length||!caps.some(m=>m.userData.work45IndependentShoulderCap==='L')||
    !caps.some(m=>m.userData.work45IndependentShoulderCap==='R'))
  throw Error('3D57 genuine original source sewn bilateral independent shoulder caps absent');
 const baseline=new Map(meshes.map(m=>[m,m.geometry.attributes.position.array.slice()]));
 const originalNormals=new Map(meshes.map(m=>[m,m.geometry.attributes.normal.array.slice()]));
 const originalProtected=new Map(meshes.map(m=>[m,new Map(protectedAttributes.map(name=>{
  const a=m.geometry.getAttribute(name);
  if(!a)throw Error('3D57 original licensed source image/rig field missing: '+name);
  return [name,a.array.slice()];
 }))]));
 const deltas=new Map(),bySide={L:{moved:0,max:0},R:{moved:0,max:0}};
 let moved=0,maxMove=0,protectedFront=0,protectedCuff=0;
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);
  const p=mesh.geometry.getAttribute('position'),idx=mesh.geometry.index;
  if(!idx||!p)throw Error('3D57 requires actual original triangulated skinned source shirt');
  const delta=new Float32Array(p.array.length),grouped=new Map(),used=new Set();
  for(let at=0;at<idx.count;at++){
   const i=idx.getX(at);
   if(!Number.isInteger(i)||i<0||i>=p.count)throw Error('3D57 invalid original source rendered triangle');
   used.add(i);
  }
  for(const i of used){
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   const k=pointKey(q);
   if(!grouped.has(k))grouped.set(k,{q,ids:[]});
   grouped.get(k).ids.push(i);
  }
  const inv=mesh.matrixWorld.clone().invert();
  for(const {q,ids} of grouped.values()){
   const x=Math.abs(q.x);
   if(x<=.31){protectedFront+=ids.length;continue;}
   const side=Math.sign(q.x)===Math.sign(arms.L.wrist.x)?'L':'R';
   const arm=arms[side],t=q.clone().sub(arm.elbow).dot(arm.axis)/arm.lengthSq;
   if(t<.10||t>.77){protectedCuff+=ids.length;continue;}
   const center=arm.elbow.clone().addScaledVector(arm.axis,t);
   const radial=q.clone().sub(center),radius=radial.length();
   if(radius<.03||radius>.19)continue;
   const region=smooth(t,.10,.23)*(1-smooth(t,.61,.77))*
    smooth(radius,.03,.07)*(1-smooth(radius,.14,.19));
   if(region<.06)continue;
   const theta=Math.atan2(radial.z,radial.y);
   const fold=.5+.5*Math.cos(7*(t-.31)+.45*Math.sin(theta+(side==='L'?.24:-.24)));
   const amplitude=(.0025+.0045*fold)*region;
   const gravity=.0012*region*(.5+.5*smooth(t,.25,.60));
   const move=radial.normalize().multiplyScalar(amplitude).add(new THREE.Vector3(0,-gravity,0));
   const length=move.length();
   if(length<.00015)continue;
   if(length>.00801||!Number.isFinite(length))throw Error('3D57 source photographed relaxed pose crease exceeds 8 mm');
   const sourceLocal=q.clone().applyMatrix4(inv);
   const afterLocal=q.clone().add(move).applyMatrix4(inv);
   const offset=afterLocal.sub(sourceLocal);
   for(const i of ids){
    delta[i*3]=offset.x;delta[i*3+1]=offset.y;delta[i*3+2]=offset.z;
    moved++;bySide[side].moved++;bySide[side].max=Math.max(bySide[side].max,length);
   }
   maxMove=Math.max(maxMove,length);
  }
  deltas.set(mesh,delta);
 }
 if(moved<40||maxMove<.001||maxMove>.00801||protectedFront<100||
    ['L','R'].some(s=>bySide[s].moved<20))
  throw Error('3D57 actual male/female original photo elbow bend fabric unavailable '+
   JSON.stringify({moved,maxMove,protectedFront,protectedCuff,bySide}));

 function restoreSource(){
  for(const mesh of meshes){
   const g=mesh.geometry;
   g.attributes.position.array.set(baseline.get(mesh));
   g.attributes.position.needsUpdate=true;
   g.attributes.normal.array.set(originalNormals.get(mesh));
   g.attributes.normal.needsUpdate=true;
   g.computeBoundingBox();g.computeBoundingSphere();
  }
 }
 function apply(pose){
  if(!Object.hasOwn(fractions,pose))throw Error('3D57 only approved source/25/50/75/relaxed source-rig pose samples');
  const factor=fractions[pose];
  restoreSource();
  for(const [mesh,offset] of deltas){
   const g=mesh.geometry,p=g.attributes.position.array,baselineLocal=baseline.get(mesh);
   for(let i=0;i<p.length;i++)p[i]=baselineLocal[i]+offset[i]*factor;
   g.attributes.position.needsUpdate=true;
   g.computeVertexNormals();smoothSurfaceNormals(g,g.attributes.position.count);
   g.computeBoundingBox();g.computeBoundingSphere();
  }
  for(const mesh of meshes){
   for(const [name,before] of originalProtected.get(mesh)){
    const now=mesh.geometry.getAttribute(name).array;
    if(now.length!==before.length||!now.every((value,i)=>value===before[i]))
     throw Error('3D57 changed original licensed garment photo/UV or source bone weights: '+name);
   }
  }
  return {pose,blendFactor:factor,realSourceSkinnedElbowVertices:moved,
   maximumAddedLocalClothMove:maxMove*factor,originalPhotoAndSourceRigPreserved:true,
   independentCapsPinned:true,releaseAuthorized:false};
 }
 function snapshot(){
  return new Map(meshes.map(m=>[m,{
   positions:m.geometry.attributes.position.array.slice(),
   normals:m.geometry.attributes.normal.array.slice()
  }]));
 }
 function restoreSnapshot(snapshot){
  for(const mesh of meshes){
   const saved=snapshot.get(mesh),g=mesh.geometry;
   g.attributes.position.array.set(saved.positions);g.attributes.position.needsUpdate=true;
   g.attributes.normal.array.set(saved.normals);g.attributes.normal.needsUpdate=true;
   g.computeBoundingBox();g.computeBoundingSphere();
  }
 }
 return {apply,restoreSource,snapshot,restoreSnapshot,baseline,
  summary:{sourceMeasuredPoseResponsiveElbow:true,
   poseResponseRealVertices:moved,poseResponseMaxMove:maxMove,
   poseResponseProtectedFrontVertices:protectedFront,
   poseResponseProtectedCuffVertices:protectedCuff,
   poseResponseBySide:bySide,originalSourceSleevePhotoAndRigUnchanged:true,
   signedVolumeContainmentCertified:false,
   continuousSweptMotionCertified:false,arbitraryContinuousAnimationCertified:false,
   humanVisualApproved:false,releaseAuthorized:false}};
}

/** Uses the true original posed garment triangle contact solver *after*
 * fitting the genuine pose-dependent source cloth; no collision bypass.
 * Existing research pose iteration and deterministic returning-pose checks
 * continue to use the independent 28-record skinned BVH verification.
 */
export function createPoseResponsivePhotographedElbowContact(root,shirt,pants,baseFactory){
 if(typeof baseFactory!=='function')throw Error('Original true skinned garment pose contact solver must be provided');
 const profile=preparePhotographedPoseResponsiveElbows(root,shirt);
 const cache=new Map();
 Object.assign(shirt.stats,profile.summary);
 function fit(pose){
  setResearchPose(root,pose);
  if(cache.has(pose)){
   const saved=cache.get(pose);
   profile.restoreSnapshot(saved.meshes);
   shirt.stats.poseTriangleContact=saved.contact;
   shirt.stats.poseResponsiveElbowState=saved.response;
   return;
  }
  const response=profile.apply(pose);
  const originalContact=baseFactory(root,shirt,pants);
  try{originalContact.fit(pose);}finally{originalContact.dispose();}
  const contact={...shirt.stats.poseTriangleContact,
   sourceMeasuredPoseResponsiveElbow:true,poseResponseBlendFactor:response.blendFactor};
  cache.set(pose,{meshes:profile.snapshot(),contact,response});
  shirt.stats.poseTriangleContact=contact;
  shirt.stats.poseResponsiveElbowState=response;
 }
 return {fit,dispose(){cache.clear();profile.restoreSource();}};
}
