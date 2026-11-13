import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
 sourceDressSwayProfile,sampleSourceDressMotion36
} from '../research/mission2-source-length/source-dress-motion.mjs';

const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const fixture=()=>{
 const root=new THREE.Group();
 const bones=Array.from({length:163},(_,i)=>new THREE.Bone());
 bones[3].name='spine04';bones[3].position.y=1.01;
 root.add(...bones);
 const geometry=new THREE.CylinderGeometry(.33,.33,.86,96,32,true);
 geometry.translate(0,.85,0);
 geometry.setAttribute('dressRest',geometry.getAttribute('position').clone());
 const count=geometry.getAttribute('position').count;
 const si=new Uint16Array(count*4),sw=new Float32Array(count*4);
 for(let i=0;i<count;i++)sw[i*4]=1;
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
 const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial());
 mesh.bind(new THREE.Skeleton(bones));root.add(mesh);
 const dress={mesh,stats:{
  sourceId:'commons-0053',sourceSHA256:SHA,
  photographedDressDrape61:true,originalRestPhotoCoordinatesUnchanged61:true,
  sourceTextureAndMaterialPreserved61:true,skinIndicesAndWeightsPreserved61:true,
  collisionValidated:false,releaseAuthorized:false
 }};
 return {root,dress,bones};
};
const snapshot=mesh=>{
 const g=mesh.geometry;
 return Object.fromEntries(['position','normal','dressRest','uv','skinIndex','skinWeight']
  .map(a=>[a,g.getAttribute(a).array.slice()]));
};

test('P2-C36 normalized real source skirt motion is smooth, bounded, cyclical, neutral-front protected',()=>{
 for(const phase of [0,.1,.25,.5,.75,.99,1]){
  for(const theta of [-Math.PI,-Math.PI/2,-.1,0,.1,Math.PI/2,Math.PI]){
   for(const t of [0,.1,.5,.9,1]){
    const o=sourceDressSwayProfile({theta,t,phase});
    assert.ok(o.outward>=0&&o.outward<=.0120001);
    assert.ok(o.drop>=0&&o.drop<=.0025001);
    if(Math.cos(theta)>=.68){assert.equal(o.outward,0);assert.equal(o.drop,0);}
   }
  }
 }
 assert.deepEqual(sourceDressSwayProfile({theta:Math.PI/2,t:.9,phase:0}),
  sourceDressSwayProfile({theta:Math.PI/2,t:.9,phase:1}));
 for(const invalid of [
  {theta:NaN,t:1,phase:.5},
  {theta:0,t:-.1,phase:.5},
  {theta:0,t:.5,phase:1.1},
  {theta:Math.PI*2,t:.5,phase:0}
 ])assert.throws(()=>sourceDressSwayProfile(invalid),/M2 C36/);
});
test('P2-C36 real 163-bone skinned dress: altered physical skirt XYZ, same genuine source UV, skin, front and repeatable pose samples',()=>{
 const {root,dress}=fixture(),m=dress.mesh,g=m.geometry;
 const original=snapshot(m),material=m.material;
 const q1=sampleSourceDressMotion36(dress,root,{phase:.25}),p1=snapshot(m);
 assert.equal(q1.stats.sourceDressMotion36,true);
 assert.ok(q1.stats.sourceDressMotionMovedVertices36>=100);
 assert.ok(q1.stats.sourceDressMotionFrontProtected36>=100);
 assert.ok(q1.stats.sourceDressMotionMaxMeters36>.0002);
 assert.ok(q1.stats.sourceDressMotionMaxMeters36<=.01235);
 assert.equal(q1.stats.sourceDressMotionOutwardOnly36,true);
 assert.equal(q1.stats.sourceDressMotionSweptCollisionCertified,false);
 assert.equal(q1.stats.sourceDressMotionRealClothPhysics,false);
 assert.equal(q1.stats.releaseAuthorized,false);
 assert.notDeepEqual(p1.position,original.position);
 for(const key of ['dressRest','uv','skinIndex','skinWeight'])
  assert.deepEqual(p1[key],original[key]);
 assert.equal(m.material,material);
 const q2=sampleSourceDressMotion36(q1,root,{phase:.75}),p2=snapshot(m);
 assert.notDeepEqual(p2.position,p1.position);
 const repeated=sampleSourceDressMotion36(q2,root,{phase:.25});
 assert.deepEqual(snapshot(m).position,p1.position,
  'source cloth cannot accumulate displacements over animation frames');
 assert.equal(repeated.stats.sourceDressMotionNoAccumulation36,true);
 assert.deepEqual(snapshot(m).dressRest,original.dressRest);
 for(let i=0;i<g.getAttribute('position').count;i++){
  const x=original.position[i*3],z=original.position[i*3+2],rest=original.dressRest[i*3+1];
  if(rest>=1.01)continue;
  if(Math.cos(Math.atan2(x,z))>=.68)
   assert.equal(g.getAttribute('position').array[i*3],original.position[i*3]);
 }
});
test('P2-C36 corrupt SHA, unsupported owner garment, stale source bone or changed skin refuse without partial original-photo mutation',()=>{
 for(const mutate of [
  ({dress})=>{dress.stats.sourceSHA256='0'.repeat(64);},
  ({dress})=>{dress.stats.sourceId='owner-private-dress';},
  ({dress})=>{dress.stats.releaseAuthorized=true;},
  ({dress})=>{dress.stats.photographedDressDrape61=false;},
  ({dress})=>{dress.mesh.skeleton.bones.pop();},
  ({bones})=>{bones[3].name='unsupported-waist';},
  ({dress})=>{dress.mesh.geometry.getAttribute('skinWeight').setX(5,.5);}
 ]){
  const state=fixture();const original=snapshot(state.dress.mesh);
  mutate(state);
  assert.throws(()=>sampleSourceDressMotion36(state.dress,state.root,{phase:.3}),/M2 C36/);
  assert.deepEqual(state.dress.mesh.geometry.getAttribute('position').array,original.position);
 }
 const state=fixture();
 const frame=sampleSourceDressMotion36(state.dress,state.root,{phase:.25});
 const after=snapshot(state.dress.mesh);
 state.dress.mesh.geometry.getAttribute('skinIndex').setX(0,5);
 assert.throws(()=>sampleSourceDressMotion36(frame,state.root,{phase:.3}),
  /original source photograph projection or anatomical skin changed/);
 assert.deepEqual(state.dress.mesh.geometry.getAttribute('position').array,after.position);
 const state2=fixture();
 const frame2=sampleSourceDressMotion36(state2.dress,state2.root,{phase:.25});
 state2.dress.mesh.geometry.getAttribute('position').setX(3,10);
 assert.throws(()=>sampleSourceDressMotion36(frame2,state2.root,{phase:.5}),
  /stale source dress geometry/);
});
