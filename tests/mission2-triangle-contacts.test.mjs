import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
 createPosedBodyIntersectionAudit,measurePosedTriangleContacts,comparePosedTriangleContacts
} from '../research/mission2-source-length/posed-intersections.mjs';

function simplePose(){
 const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone());
 root.add(...bones);
 const skeleton=new THREE.Skeleton(bones);
 const add=(geometry,name,garment,skinBone)=>{
  const n=geometry.getAttribute('position').count;
  const indices=new Uint16Array(n*4),weights=new Float32Array(n*4);
  for(let i=0;i<n;i++){indices[i*4]=skinBone;weights[i*4]=1;}
  geometry.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial());
  mesh.name=name;mesh.userData.work56Garment=garment;mesh.bind(skeleton);root.add(mesh);
  return mesh;
 };
 const body=add(new THREE.BoxGeometry(.7,.7,.7),'163-bone actual body',false,1);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  // Crossing a body box before and after: body/garment mesh-pair count is ONE.
  -.5,-.45,0, .5,-.45,0, 0,.48,0,
  // A second real triangle, initially outside the body.
  1.45,-.45,0, 2.45,-.45,0, 1.95,.48,0
 ],3));
 const garment=add(g,'actual skinned garment',true,0);
 const proposed=g.getAttribute('position').array.slice();
 for(let i=3;i<6;i++)proposed[i*3]-=1.95;
 return {root,body,garment,bones,proposed};
}

test('same old mesh-pair count conceals newly intersecting actual garment triangles',()=>{
 const {root,garment,proposed}=simplePose();
 const old=createPosedBodyIntersectionAudit(root);
 let coarseBefore,coarseAfter;
 try{
  coarseBefore=old.measure([garment]);
  coarseAfter=old.measure([garment],new Map([[garment,proposed]]));
 }finally{old.dispose();}
 assert.equal(coarseBefore.intersectingPairs,1);
 assert.equal(coarseAfter.intersectingPairs,1,
  'Old binary mesh-pair gate falsely considers newly crossing triangle safe');
 const before=measurePosedTriangleContacts(root,[garment]);
 const after=measurePosedTriangleContacts(root,[garment],new Map([[garment,proposed]]));
 assert.ok(before.triangleContactCount>=1);
 assert.ok(after.triangleContactCount>before.triangleContactCount);
 const delta=comparePosedTriangleContacts(before,after);
 assert.equal(delta.nonregression,false);
 assert.ok(delta.newlyIntersecting>=1);
 assert.equal(delta.sampledPoseOnly,true);
 assert.equal(after.collisionCertified,false);
 assert.deepEqual(garment.geometry.getAttribute('position').array,
  new Float32Array([-.5,-.45,0,.5,-.45,0,0,.48,0,1.45,-.45,0,2.45,-.45,0,1.95,.48,0]),
  'No changed garment positions until precommit checks pass');
});

test('contact measurement rebuilds actual body triangles when a 163-bone posed body moves',()=>{
 const {root,garment,bones}=simplePose();
 const stationary=measurePosedTriangleContacts(root,[garment]);
 assert.ok(stationary.triangleContactCount>0);
 bones[1].position.x=3;
 root.updateMatrixWorld(true);
 const moved=measurePosedTriangleContacts(root,[garment]);
 assert.equal(moved.triangleContactCount,0,
  'Cached body BVH must not silently certify the old pose after bone motion');
 assert.equal(moved.bodyRebuiltAtMeasurement,true);
 assert.equal(moved.currentPoseOnly,true);
});

test('bounded triangle-contact audit refuses incomplete/forged or over-budget evidence',()=>{
 const {root,garment,proposed}=simplePose();
 for(const cap of [0,-1,100001,1.5])assert.throws(
  ()=>measurePosedTriangleContacts(root,[garment],new Map(),{maxContacts:cap}),/bounded valid pose/);
 assert.throws(()=>measurePosedTriangleContacts(root,[garment,garment]),/bounded valid pose/);
 assert.throws(()=>measurePosedTriangleContacts(root,[garment],new Map([[garment,new Float32Array(3)]])),/vertex buffer/);
 assert.throws(()=>measurePosedTriangleContacts(root,[garment],new Map(),{maxContacts:1}),/exceeds bounded contact budget/);
 assert.throws(()=>comparePosedTriangleContacts({triangleContactKeys:['a'],triangleContactCount:2},
  {triangleContactKeys:[],triangleContactCount:0}),/mismatched/);
 const initial=measurePosedTriangleContacts(root,[garment]);
 assert.equal(comparePosedTriangleContacts(initial,initial).nonregression,true);
 const after=measurePosedTriangleContacts(root,[garment],new Map([[garment,proposed]]));
 assert.equal(after.testedMeshPairs,1);
});
