import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {inverseSkinTransform87} from '../research/mission2-p87/skinned-pose-preview.mjs';
const make=({weights=[.6,.4,0,0]}={})=>{
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([
  .20,.55,.08,.34,.61,.12,.24,.70,.14
 ],3));
 const indices=[],values=[];
 for(let i=0;i<3;i++){indices.push(0,1,0,0);values.push(...weights);}
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(values,4));
 const a=new THREE.Bone(),b=new THREE.Bone();
 b.position.set(.2,.1,0);a.add(b);
 const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshBasicMaterial());
 mesh.add(a);
 const skeleton=new THREE.Skeleton([a,b]);mesh.bind(skeleton);
 a.rotation.z=.31;b.rotation.y=-.24;
 mesh.updateMatrixWorld(true);skeleton.update();
 return {mesh,skeleton,geometry,a,b};
};
test('P87 exactly inverts genuine two-bone linear blend at three source vertices',()=>{
 const {mesh,geometry}=make();
 const original=geometry.attributes.position.array.slice();
 for(let i=0;i<3;i++){
  const rest=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i);
  const posed=mesh.applyBoneTransform(i,rest.clone());
  const desired=posed.clone().add(new THREE.Vector3(.006,-.002,.003));
  const fitted=inverseSkinTransform87(mesh,i,desired);
  const actual=mesh.applyBoneTransform(i,fitted);
  assert.ok(actual.distanceTo(desired)<1e-6,'fitted genuine LBS source pose matches numeric target');
  assert.ok(fitted.distanceTo(rest)>0,'fit must not be inert');
 }
 assert.deepEqual(geometry.attributes.position.array,original,'original garment rest positions unchanged');
});
test('P87 rejects singular unweighted source bones rather than faking a fitted mesh',()=>{
 const {mesh,geometry}=make({weights:[0,0,0,0]});
 const old=geometry.attributes.position.array.slice();
 assert.throws(()=>inverseSkinTransform87(mesh,0,new THREE.Vector3(.1,.3,.2)),/noninvertible/);
 assert.deepEqual(geometry.attributes.position.array,old);
});
test('P87 inverse remains accurate after authentic articulated source pose transition',()=>{
 const {mesh,a,b,geometry}=make();
 for(const t of [0,.25,.5,.75,1]){
  a.rotation.z=.31*t;b.rotation.y=-.24*t;
  mesh.updateMatrixWorld(true);mesh.skeleton.update();
  for(let i=0;i<3;i++){
   const input=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i);
   const desired=mesh.applyBoneTransform(i,input).add(new THREE.Vector3(.005*t,.002*t,-.002*t));
   const actual=mesh.applyBoneTransform(i,inverseSkinTransform87(mesh,i,desired));
   assert.ok(actual.distanceTo(desired)<1e-6,'genuine pose fraction '+t);
  }
 }
});
