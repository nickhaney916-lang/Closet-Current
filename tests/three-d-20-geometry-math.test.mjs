import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {pointAgainstActualSkinTriangles} from '../research/three-d-20/triangle-contact.mjs';
const skinTriangle=()=>new THREE.Triangle(
 new THREE.Vector3(-.12,-.12,0),
 new THREE.Vector3(.12,-.12,0),
 new THREE.Vector3(0,.15,0)
);
test('TRUE closest skin triangle surface beats nearest original corner-vertex sample',()=>{
 const p=new THREE.Vector3(0,0,.025),center=new THREE.Vector3(0,0,-.06);
 const tri=skinTriangle();
 const r=pointAgainstActualSkinTriangles(p,center,[tri]);
 assert.ok(Math.abs(r.nearestDistance-.025)<1e-6);
 assert.ok(Math.abs(r.inwardSurfaceHit-.025)<1e-6);
 assert.equal(r.outwardSurfaceHit,null);
 const vertexDistance=Math.min(...[tri.a,tri.b,tri.c].map(x=>p.distanceTo(x)));
 assert.ok(vertexDistance>r.nearestDistance*3,
  'Nearest vertex is not a valid proxy for nearest point on triangle');
});
test('Opposite source side changes ray direction but does not manufacture signed collision',()=>{
 const tri=skinTriangle(),p=new THREE.Vector3(0,0,-.04);
 const center=new THREE.Vector3(0,0,-.2);
 const r=pointAgainstActualSkinTriangles(p,center,[tri]);
 assert.ok(Math.abs(r.nearestDistance-.04)<1e-6);
 assert.equal(r.inwardSurfaceHit,null);
 assert.ok(Math.abs(r.outwardSurfaceHit-.04)<1e-6);
 assert.equal(Object.keys(r).includes('signedClearance'),false);
});
test('Surface contact exactly at triangle plane produces zero nearest distance, not fake penetrations',()=>{
 const tri=skinTriangle(),p=new THREE.Vector3(0,0,0);
 const r=pointAgainstActualSkinTriangles(p,new THREE.Vector3(0,0,-.05),[tri]);
 assert.ok(r.nearestDistance<1e-12,'Floating-point triangle contact is numerically zero');
 assert.equal(r.inwardSurfaceHit,null);
 assert.equal(r.outwardSurfaceHit,null);
});
test('Outside triangle computes actual edge/vertex distance, not infinite planar distance',()=>{
 const tri=skinTriangle(),p=new THREE.Vector3(.27,-.12,.05);
 const r=pointAgainstActualSkinTriangles(p,new THREE.Vector3(.27,-.12,-.05),[tri]);
 assert.ok(r.nearestDistance>.13&&r.nearestDistance<.19);
 assert.equal(r.inwardSurfaceHit,null);
});
test('Non-rigged, malformed and missing surfaces fail closed',()=>{
 const p=new THREE.Vector3(0,0,.02),center=new THREE.Vector3(0,0,-.04);
 for(const v of [
  [null,center,[skinTriangle()]],[p,null,[skinTriangle()]],[p,center,[]],
  [p,center,[{}]],[new THREE.Vector3(NaN,0,0),center,[skinTriangle()]],
  [p,new THREE.Vector3(0,0,.02),[skinTriangle()]]
 ])assert.throws(()=>pointAgainstActualSkinTriangles(...v));
});
