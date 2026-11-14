/**
 * P89 synthetic topology integrity tests; a "green" fixture cannot prove
 * an actual photographed skirt fit or actual real anatomical 163-bone rig.
 * True original browser/skinned body evidence is in separate CI jobs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {countStableOriginalBodyContacts89}
 from '../research/parallel89/skirt-stable-source-contacts89.mjs';

const bytes=geometry=>({
 index:geometry.index.array.slice(),
 position:geometry.getAttribute('position').array.slice()
});
const stable=(geom,copy)=>{
 assert.deepEqual(geom.index.array,copy.index);
 assert.deepEqual(geom.getAttribute('position').array,copy.position);
};
test('indirect BVH keeps original indexed source triangles and genuine pair identities stable across repeated builds',()=>{
 const a=new THREE.BoxGeometry(1,1,1),
  b=new THREE.BoxGeometry(1,1,1);
 b.translate(.35,.12,.10);
 const aa=bytes(a),bb=bytes(b);
 const first=countStableOriginalBodyContacts89(a,b);
 assert.ok(first.count>0,'two partially overlapping mesh surfaces should cross');
 assert.equal(first.count,first.pairs.size);
 assert.equal(first.trueOriginalSkirtTriangleIndexStable,true);
 assert.equal(first.trueOriginalBodyTriangleIndexStable,true);
 assert.equal(first.originalFaceSourceResolution,
  'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES');
 assert.equal(first.releaseAuthorized,false);
 const again=countStableOriginalBodyContacts89(a,b);
 assert.equal(again.count,first.count);
 assert.deepEqual([...again.pairs].sort(),[...first.pairs].sort());
 stable(a,aa);stable(b,bb);
});
test('original triangle stable identity stays within original mesh face bounds across an actual geometry movement',()=>{
 const a=new THREE.SphereGeometry(.7,16,10);
 const b=new THREE.BoxGeometry(1,1,1);
 b.translate(.20,.10,.05);
 const beforeA=bytes(a),beforeB=bytes(b);
 const original=countStableOriginalBodyContacts89(a,b);
 assert.ok(original.count>0);
 const shifted=b.clone();shifted.translate(.04,0,0);
 const moved=countStableOriginalBodyContacts89(a,shifted);
 assert.ok(moved.count>0);
 const maxA=a.index.count/3,maxB=b.index.count/3;
 for(const id of [...original.pairs,...moved.pairs]){
  const [i,j]=id.split('|').map(Number);
  assert.ok(Number.isSafeInteger(i)&&i>=0&&i<maxA);
  assert.ok(Number.isSafeInteger(j)&&j>=0&&j<maxB);
 }
 stable(a,beforeA);stable(b,beforeB);
 assert.equal(moved.originalFaceSourceResolution,
  'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES');
});
test('reject incorrect original immutable source indices, nonindexed buffers and nonfinite vertices',()=>{
 const good=new THREE.BoxGeometry(1,1,1);
 const unindexed=new THREE.BufferGeometry();
 unindexed.setAttribute('position',new THREE.Float32BufferAttribute(
  [0,0,0,1,0,0,0,1,0],3));
 assert.throws(()=>countStableOriginalBodyContacts89(unindexed,good),/source-geometry-required/);
 const invalid=new THREE.BoxGeometry(1,1,1);
 invalid.index.array[0]=90000;
 assert.throws(()=>countStableOriginalBodyContacts89(good,invalid),/face-reference-out-of-range/);
 const corrupted=new THREE.BoxGeometry(1,1,1);
 corrupted.getAttribute('position').setX(0,NaN);
 assert.throws(()=>countStableOriginalBodyContacts89(corrupted,good),/vertex-not-finite/);
});
