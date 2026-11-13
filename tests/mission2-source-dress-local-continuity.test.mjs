import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {sampleSourceDressMotion36} from '../research/mission2-source-length/source-dress-motion.mjs';

// C38: deliberately no invented reviewer, phone, source JPEG or real-owner data.
// These are deterministic structural tests of the pinned source dress sampler.
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
function fixture(){
 const root=new THREE.Group();
 const bones=Array.from({length:163},()=>new THREE.Bone());
 bones[3].name='spine04';
 bones[3].position.y=1.01;
 root.add(...bones);
 const g=new THREE.CylinderGeometry(.33,.33,.86,96,32,true);
 g.translate(0,.85,0);
 g.setAttribute('dressRest',g.getAttribute('position').clone());
 const n=g.getAttribute('position').count;
 const ids=new Uint16Array(n*4),weights=new Float32Array(n*4);
 for(let i=0;i<n;i++)weights[4*i]=1;
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 // Mirror genuine P61 garment's custom photo projection without inventing UV.
 g.deleteAttribute('uv');
 g.setAttribute('dressCustomPhotoProjection',g.getAttribute('dressRest').clone());
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.bind(new THREE.Skeleton(bones));
 root.add(mesh);
 const dress={mesh,stats:{
  sourceId:'commons-0053',sourceSHA256:SHA,
  photographedDressDrape61:true,originalRestPhotoCoordinatesUnchanged61:true,
  sourceTextureAndMaterialPreserved61:true,skinIndicesAndWeightsPreserved61:true,
  collisionValidated:false,releaseAuthorized:false
 }};
 return {root,dress,g};
}
const copy=mesh=>({
 position:mesh.geometry.getAttribute('position').array.slice(),
 normal:mesh.geometry.getAttribute('normal').array.slice(),
 dressRest:mesh.geometry.getAttribute('dressRest').array.slice(),
 sourceProjection:mesh.geometry.getAttribute('dressCustomPhotoProjection').array.slice(),
 skinIndex:mesh.geometry.getAttribute('skinIndex').array.slice(),
 skinWeight:mesh.geometry.getAttribute('skinWeight').array.slice()
});
function maxCoordinateDifference(a,b){
 assert.equal(a.length,b.length);
 let max=0;
 for(let i=0;i<a.length;i++)max=Math.max(max,Math.abs(a[i]-b[i]));
 return max;
}
function maxVertexStep(a,b){
 assert.equal(a.length,b.length);
 let max=0;
 for(let i=0;i<a.length;i+=3)
  max=Math.max(max,Math.hypot(a[i]-b[i],a[i+1]-b[i+1],a[i+2]-b[i+2]));
 return max;
}
test('C38: source photograph front remains unchanged during 180-degree humanoid turn, including translation, tilt and return',()=>{
 const {root,dress}=fixture(),mesh=dress.mesh,source=copy(mesh);
 const originalMaterial=mesh.material;
 const first=sampleSourceDressMotion36(dress,root,{phase:.25});
 const baseline=copy(mesh);
 assert.equal(first.stats.sourceDressMotionGarmentLocalFront38,true);
 assert.equal(first.stats.sourceDressMotionGarmentLocalRadialRelief38,true);
 assert.equal(first.stats.sourceDressMotionSweptContinuityCertified38,false);
 assert.ok(first.stats.sourceDressMotionMovedVertices36>100);
 let live=first;
 for(const [yaw,tilt,tx,ty,tz] of [
  [Math.PI/2,0,0,0,0], [Math.PI,0,0,0,0],
  [-Math.PI/3,.18,2,.4,-3],[0,0,0,0,0]
 ]){
  root.rotation.set(tilt,yaw,0);
  root.position.set(tx,ty,tz);
  live=sampleSourceDressMotion36(live,root,{phase:.25});
  const now=copy(mesh);
  assert.ok(maxCoordinateDifference(now.position,baseline.position)<1e-6,
   'root turning must not distort any garment-local source vertex');
  assert.ok(maxCoordinateDifference(now.normal,baseline.normal)<1e-6,
   'root turning must not switch which source dress panel is shaded');
  for(const key of ['dressRest','sourceProjection','skinIndex','skinWeight'])
   assert.deepEqual(now[key],source[key]);
  for(let i=0;i<source.position.length;i+=3){
   const theta=Math.atan2(source.position[i],source.position[i+2]);
   if(Math.cos(theta)>=.68){
    for(let k=0;k<3;k++)
     assert.equal(now.position[i+k],source.position[i+k],
      'photographed front must be identical even when root turns');
   }
  }
 }
 assert.equal(mesh.material,originalMaterial);
 assert.equal(live.stats.releaseAuthorized,false);
 assert.equal(live.stats.familyAlpha,'HOLD');
});
test('C38: 17 sampled chronological phase frames have bounded adjacent vertex movement and a seam-free period',()=>{
 const {root,dress}=fixture(),mesh=dress.mesh;
 const source=copy(mesh);
 let live=dress,first=null,previous=null,maximumStep=0,actualFrames=0;
 for(let step=0;step<=16;step++){
  live=sampleSourceDressMotion36(live,root,{phase:step/16});
  const frame=copy(mesh);
  if(!first)first=frame;
  if(previous){
   const moved=maxVertexStep(previous.position,frame.position);
   maximumStep=Math.max(maximumStep,moved);
   if(moved>1e-5)actualFrames++;
   assert.ok(moved<.0045,'consecutive 1/16-phase source-frame vertex jump exceeds 4.5mm');
  }
  previous=frame;
 }
 assert.ok(actualFrames>=12,'phase progression must show nonzero real cloth movement');
 assert.ok(maximumStep>.0002);
 assert.ok(maxCoordinateDifference(first.position,previous.position)<1e-6,
  '0 and 1 phase must join without a visible skirt vertex teleport');
 assert.ok(maxCoordinateDifference(first.normal,previous.normal)<1e-6,
  'original photo normal continuity must also hold at the motion loop seam');
 for(const key of ['dressRest','sourceProjection','skinIndex','skinWeight'])
  assert.deepEqual(copy(mesh)[key],source[key]);
 assert.equal(live.stats.sourceDressMotionRealClothPhysics,false);
 assert.equal(live.stats.sourceDressMotionSweptCollisionCertified,false);
 assert.equal(live.stats.releaseAuthorized,false);
});
test('C38: singular and mirrored garment transforms fail closed without partial garment or source writes',()=>{
 const {root,dress}=fixture(),mesh=dress.mesh;
 const first=sampleSourceDressMotion36(dress,root,{phase:.25});
 const frozen=copy(mesh);
 for(const scale of [0,-1,Number.POSITIVE_INFINITY]){
  root.scale.set(scale,1,1);
  assert.throws(()=>sampleSourceDressMotion36(first,root,{phase:.5}),
   /M2 C36 source dress motion/);
  const after=copy(mesh);
  for(const key of Object.keys(frozen))assert.deepEqual(after[key],frozen[key]);
 }
 root.scale.set(1,1,1);
 const again=sampleSourceDressMotion36(first,root,{phase:.25});
 assert.equal(again.stats.sourceDressMotionGarmentLocalFront38,true);
 assert.ok(maxCoordinateDifference(copy(mesh).position,frozen.position)<1e-6);
});

test('C38: real meter cap survives non-unit rig scaling without reassigning original photo-facing front',()=>{
 const {root,dress}=fixture(),mesh=dress.mesh;
 const original=copy(mesh);
 let live=dress;
 for(const [sx,sy,sz] of [[2,2,2],[.5,.5,.5],[2.5,1.4,.75],[1,1,1]]){
  root.scale.set(sx,sy,sz);
  live=sampleSourceDressMotion36(live,root,{phase:.25});
  const now=copy(mesh),m=mesh.matrixWorld,at=new THREE.Vector3(),shifted=new THREE.Vector3();
  let maximum=0;
  for(let i=0;i<original.position.length;i+=3){
   at.fromArray(original.position,i).applyMatrix4(m);
   shifted.fromArray(now.position,i).applyMatrix4(m);
   const traveled=at.distanceTo(shifted);
   maximum=Math.max(maximum,traveled);
   assert.ok(traveled<=.01235+1e-6,
    'real 3D source-cloth displacement must be capped in physical world meters');
   const theta=Math.atan2(original.position[i],original.position[i+2]);
   if(Math.cos(theta)>=.68){
    for(let k=0;k<3;k++)
     assert.equal(now.position[i+k],original.position[i+k],
      'photographed front must stay byte-identical under scaled 163-bone rig');
   }
  }
  assert.ok(maximum>.0002);
  assert.ok(live.stats.sourceDressMotionMaxMeters36<=.01235+1e-6);
  for(const key of ['dressRest','sourceProjection','skinIndex','skinWeight'])
   assert.deepEqual(now[key],original[key]);
 }
 assert.equal(live.stats.releaseAuthorized,false);
});
