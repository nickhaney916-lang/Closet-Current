import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {auditSourceDressSweptBody39,assertSourceDressSweptBody39}
 from '../research/mission2-source-length/source-dress-swept-body.mjs';
import {sampleSourceDressMotion36}
 from '../research/mission2-source-length/source-dress-motion.mjs';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const stats=()=>({
 sourceId:'commons-0053',sourceSHA256:SHA,
 photographedDressDrape61:true,originalRestPhotoCoordinatesUnchanged61:true,
 sourceTextureAndMaterialPreserved61:true,skinIndicesAndWeightsPreserved61:true,
 collisionValidated:false,releaseAuthorized:false
});
function base(){
 const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone());
 bones[3].name='spine04';bones[3].position.y=1.01;
 root.add(...bones);
 const skeleton=new THREE.Skeleton(bones);
 function skinned(g,garment=false){
  const n=g.getAttribute('position').count;
  const indices=new Uint16Array(4*n),weights=new Float32Array(4*n);
  for(let i=0;i<n;i++)weights[4*i]=1;
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.bind(skeleton);
  m.userData.work56Garment=garment;
  root.add(m);
  return m;
 }
 return {root,bones,skinned};
}
function plane(z){
 // Fixed posed source-body quad in world coordinates. The winding is not
 // relied on: the ray tests both triangle sides.
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.6,.25,z, .6,.25,z, .6,.90,z, -.6,.90,z
 ],3));
 g.setIndex([0,1,2,0,2,3]);
 return g;
}
const snapshot=mesh=>Object.fromEntries(
 Object.entries(mesh.geometry.attributes).map(([name,attr])=>[name,attr.array.slice()])
);
test('C39: actual posed 163-bone body triangle catches a vertex crossing BETWEEN two clear phase endpoints',()=>{
 const f=base();
 f.skinned(plane(0));
 const garmentGeometry=new THREE.BufferGeometry();
 garmentGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
  0,.6,-.010, .20,.6,-.010, 0,.8,-.010
 ],3));
 const dress={mesh:f.skinned(garmentGeometry,true),stats:stats()};
 const original=snapshot(dress.mesh);
 const start=dress.mesh.geometry.getAttribute('position').array.slice(),end=start.slice();
 end[2]=.010;
 const evidence=auditSourceDressSweptBody39({
  root:f.root,dress,startPositions:start,endPositions:end
 });
 assert.equal(evidence.schema,'M2-source-dress-swept-vertex-body-v1');
 assert.equal(evidence.crossedSegments,1);
 assert.equal(evidence.bodyMeshCount,1);
 assert.equal(evidence.bodyTriangles,2);
 assert.equal(evidence.staticBodyPoseOnly,true);
 assert.equal(evidence.continuousCollisionCertified,false);
 assert.equal(evidence.sourcePhotoAndSkinUnmodified,true);
 assert.equal(evidence.releaseAuthorized,false);
 assert.throws(()=>assertSourceDressSweptBody39(evidence),/crosses body/);
 assert.deepEqual(snapshot(dress.mesh),original,'a diagnostic cannot alter an original');
});
test('C39: clear bounded source trajectory is only research admissible, never a full collision certificate',()=>{
 const f=base();f.skinned(plane(0));
 const garmentGeometry=new THREE.BufferGeometry();
 garmentGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
  0,.6,-.010, .2,.6,-.010, 0,.8,-.010
 ],3));
 const dress={mesh:f.skinned(garmentGeometry,true),stats:stats()};
 const start=dress.mesh.geometry.getAttribute('position').array.slice(),end=start.slice();
 end[2]=-.005;
 const receipt=auditSourceDressSweptBody39({
  root:f.root,dress,startPositions:start,endPositions:end
 });
 assert.equal(receipt.crossedSegments,0);
 assert.equal(receipt.movedVertices,1);
 const decision=assertSourceDressSweptBody39(receipt);
 assert.equal(decision.crossingVetoPassed,true);
 assert.equal(decision.wholeClothSafe,false);
 assert.equal(decision.releaseAuthorized,false);
 assert.equal(receipt.sweptFabricTrianglesTested,false);
 assert.equal(receipt.selfLayerCollisionTested,false);
 assert.equal(receipt.movingBodyTested,false);
});
test('C39: stale, corrupt, unsupported and incomplete segments refuse without writing original photo',()=>{
 const f=base();f.skinned(plane(0));
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  0,.6,-.01,.2,.6,-.01,0,.8,-.01
 ],3));
 const dress={mesh:f.skinned(g,true),stats:stats()};
 const original=snapshot(dress.mesh);
 const start=g.getAttribute('position').array.slice(),end=start.slice();
 end[2]=.01;
 const evaluate=(extra={})=>auditSourceDressSweptBody39({
  root:f.root,dress,startPositions:start,endPositions:end,...extra
 });
 const stale=start.slice();stale[2]=-.02;
 const nan=end.slice();nan[2]=NaN;
 for(const extra of [
  {startPositions:stale},{endPositions:nan},
  {maxMovedVertices:0},{maxBodyTriangles:1},
  {maxTriangleCandidates:0},{maxSegmentMeters:.001},
  {maxCrossedSegments:0}
 ])assert.throws(()=>evaluate(extra),/M2 C39/);
 assert.throws(()=>assertSourceDressSweptBody39({schema:'M2-source-dress-swept-vertex-body-v1',
   sourceVerified:true,completeBoundedSweep:true,bodyMeshCount:1,
   bodyTriangles:2,crossedSegments:0,continuousCollisionCertified:true,
   releaseAuthorized:true,familyAlpha:'HOLD'}),/M2 C39/);
 assert.deepEqual(snapshot(dress.mesh),original);
 dress.stats.sourceSHA256='0'.repeat(64);
 assert.throws(()=>evaluate(),/M2 C39/);
 assert.deepEqual(snapshot(dress.mesh),original);
});
function fullDress(zBody){
 const f=base();
 const g=new THREE.CylinderGeometry(.33,.33,.86,96,32,true);
 g.translate(0,.85,0);
 g.setAttribute('dressRest',g.getAttribute('position').clone());
 g.deleteAttribute('uv');
 g.setAttribute('dressPhotoCoords',g.getAttribute('dressRest').clone());
 const dress={mesh:f.skinned(g,true),stats:stats()};
 f.skinned(plane(zBody));
 return {...f,dress};
}
test('C39: original 163-bone source dress refuses a proposed swept crossing BEFORE mutating any photo, UV, normals or vertices',()=>{
 const f=fullDress(-.332);
 const original=snapshot(f.dress.mesh);
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptBodyAudit39:auditSourceDressSweptBody39
 }),/M2 C36 source dress motion C39 incomplete or intersecting/);
 assert.deepEqual(snapshot(f.dress.mesh),original);
});
test('C39: explicit guarded research garment can pass a clear sweep without being approved for release',()=>{
 const f=fullDress(-2);
 const original=snapshot(f.dress.mesh);
 const result=sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptBodyAudit39:auditSourceDressSweptBody39
 });
 assert.equal(result.stats.sourceDressMotionSweptVertexAuditObserved39,true);
 assert.equal(result.stats.sourceDressMotionSweptWholeFabricCertified39,false);
 assert.equal(result.stats.sourceDressMotionRealClothPhysics,false);
 assert.equal(result.stats.sourceDressMotionSweptCollisionCertified,false);
 assert.equal(result.stats.releaseAuthorized,false);
 assert.notDeepEqual(snapshot(f.dress.mesh).position,original.position);
 for(const key of ['dressRest','dressPhotoCoords','skinIndex','skinWeight'])
  assert.deepEqual(snapshot(f.dress.mesh)[key],original[key]);
});
