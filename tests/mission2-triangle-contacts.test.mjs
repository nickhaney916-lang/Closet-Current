import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
 createPosedBodyIntersectionAudit,measurePosedTriangleContacts,comparePosedTriangleContacts,measurePosedGarmentPartContacts,measurePosedGarmentSelfContacts,measureChangedFaceSelfContactDelta,summarizePosedBodyContactDistribution,summarizeNewPosedBodyContactRegions
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


test('distinct shoulder/torso triangle collision is detected even when body mesh-pair gate cannot see it',()=>{
 const {root,garment,proposed}=simplePose();
 const secondaryGeometry=new THREE.BufferGeometry();
 secondaryGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
  -.15,-.2,-.3, .15,-.2,-.3, 0,-.2,.3
 ],3));
 secondaryGeometry.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(12),4));
 secondaryGeometry.setAttribute('skinWeight',new THREE.BufferAttribute(new Float32Array([
  1,0,0,0,1,0,0,0,1,0,0,0
 ]),4));
 const secondary=new THREE.SkinnedMesh(secondaryGeometry,new THREE.MeshStandardMaterial());
 secondary.userData.work56Garment=true;
 secondary.bind(garment.skeleton);root.add(secondary);
 const originalFirst=garment.geometry.getAttribute('position').array.slice();
 const originalSecond=secondary.geometry.getAttribute('position').array.slice();
 const before=measurePosedGarmentPartContacts(root,[garment,secondary]);
 const after=measurePosedGarmentPartContacts(root,[garment,secondary],new Map([[garment,proposed]]));
 assert.ok(before.triangleContactCount>=1,'existing sleeve seam still present');
 const result=comparePosedTriangleContacts(before,after);
 assert.ok(result.newlyIntersecting>=1,'new inter-panel surface crossing must be vetoed');
 assert.equal(result.nonregression,false);
 assert.equal(after.distinctGarmentPartsOnly,true);
 assert.equal(after.collisionCertified,false);
 assert.equal(after.fullSelfLayerCollision,false);
 assert.equal(after.testedMeshPairs,1);
 assert.deepEqual(garment.geometry.getAttribute('position').array,originalFirst);
 assert.deepEqual(secondary.geometry.getAttribute('position').array,originalSecond);
 const one=measurePosedGarmentPartContacts(root,[garment]);
 assert.equal(one.triangleContactCount,0,'one panel is not a full self-collision audit');
 for(const cap of [0,-1,100001,2.5])assert.throws(
  ()=>measurePosedGarmentPartContacts(root,[garment,secondary],new Map(),{maxContacts:cap}),/bounded valid pose/);
 assert.throws(()=>measurePosedGarmentPartContacts(root,[garment,garment]),/bounded valid pose/);
 assert.throws(()=>measurePosedGarmentPartContacts(root,[garment,secondary],
  new Map([[garment,new Float32Array(2)]])),/vertex buffer/);
 assert.throws(()=>measurePosedGarmentPartContacts(root,[garment,secondary],
  new Map(),{maxContacts:1}),/bounded contact budget/);
});


test('same skinned mesh: nonadjacent triangles crossing after fitting are detected with stable IDs',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0, .5,-.5,0, 0,.5,0,
  1.2,-.2,-.25, 1.2,.2,.25, 1.2,.2,-.25
 ],3));
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(6*4),4));
 const w=new Float32Array(6*4);
 for(let i=0;i<6;i++)w[i*4]=1;
 g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const initial=g.getAttribute('position').array.slice();
 const staged=initial.slice();
 for(let i=3;i<6;i++)staged[i*3]-=1.2;
 const before=measurePosedGarmentSelfContacts(root,[mesh]);
 const after=measurePosedGarmentSelfContacts(root,[mesh],new Map([[mesh,staged]]));
 assert.equal(before.triangleContactCount,0);
 assert.equal(after.triangleContactCount,1,'3D crossing within one mesh must be detected exactly once');
 assert.equal(after.candidateTests,1,'Self BVH traverses one unique original face pair, not both orientations');
 assert.equal(after.uniqueSourceTriangleCandidateBudget,true);
 assert.ok(Number.isSafeInteger(after.duplicateCandidateCallbacksSkipped)&&after.duplicateCandidateCallbacksSkipped>=0);
 const comparison=comparePosedTriangleContacts(before,after);
 assert.equal(comparison.newlyIntersecting,1);
 assert.equal(comparison.nonregression,false);
 assert.equal(after.withinOneMeshOnly,true);
 assert.equal(after.fullSelfLayerCollision,false);
 assert.equal(after.collisionCertified,false);
 assert.deepEqual(g.getAttribute('position').array,initial,'inspection cannot mutate saved source');
 assert.throws(()=>measurePosedGarmentSelfContacts(root,[mesh],
  new Map([[mesh,staged]]),{maxContacts:1}),/bounded contact budget/);
 assert.throws(()=>measurePosedGarmentSelfContacts(root,[mesh],
  new Map([[mesh,new Float32Array(1)]])),/finite staged vertex buffer/);
 for(const maxCandidateTests of [0,-1,2000001,1.2])
  assert.throws(()=>measurePosedGarmentSelfContacts(root,[mesh],new Map(),{maxCandidateTests}),/bounded valid pose/);
 assert.throws(()=>measurePosedGarmentSelfContacts(root,[mesh,mesh]),/bounded valid pose/);
});

test('actual indexed shared-edge garment triangles do not invent self-crossings at normal seams',()=>{
 const {root,garment}=simplePose();
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0, .5,-.5,0, .5,.5,0, -.5,.5,0
 ],3));
 geometry.setIndex([0,1,2,0,2,3]);
 geometry.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(4*4),4));
 const w=new Float32Array(4*4);
 for(let i=0;i<4;i++)w[i*4]=1;
 geometry.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 const seam=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial());
 seam.userData.work56Garment=true;seam.bind(garment.skeleton);root.add(seam);
 const proof=measurePosedGarmentSelfContacts(root,[seam]);
 assert.equal(proof.triangleContactCount,0);
 assert.equal(proof.excludedOriginalSharedVertexPairs,true);
 assert.equal(proof.triangleSurfaces,2);
});


test('indirect BVH rebuild cannot invent new triangle identities when distant source triangles reorder',()=>{
 const {root,garment}=simplePose();
 const positions=[-.5,-.45,0,.5,-.45,0,0,.48,0];
 for(let i=1;i<80;i++){
  const x=(i%2?1:-1)*(2+i*.09);
  positions.push(x,-.3,-.25,x+.2,-.3,.25,x+.1,.35,0);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const n=g.getAttribute('position').count;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(n*4),4));
 const weights=new Float32Array(n*4);
 for(let i=0;i<n;i++)weights[i*4]=1;
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const before=measurePosedTriangleContacts(root,[mesh]);
 assert.ok(before.triangleContactCount>0);
 assert.ok(before.triangleContactKeys.every(key=>key.split(':')[2]==='0'),
  'Only original source face zero intersects body');
 const original=g.getAttribute('position').array.slice(),staged=original.slice();
 for(let i=3;i<n;i++)staged[i*3]=-staged[i*3];
 const after=measurePosedTriangleContacts(root,[mesh],new Map([[mesh,staged]]));
 assert.deepEqual(after.triangleContactKeys,before.triangleContactKeys,
  'BVH rebuilt with reordered distant triangles must retain original source face IDs');
 assert.equal(comparePosedTriangleContacts(before,after).newlyIntersecting,0);
 assert.deepEqual(g.getAttribute('position').array,original);
});


test('privacy-safe attribution counts exact original-face contacts by garment and body mesh',()=>{
 const keys=['0:0:0:1','0:2:1:3','1:2:8:0'];
 const result=summarizePosedBodyContactDistribution({
  triangleContactKeys:keys,triangleContactCount:keys.length
 },3);
 assert.deepEqual(result.byGarmentMesh,[2,1,0]);
 assert.deepEqual(result.byBodyMesh,[{meshIndex:2,contacts:2},{meshIndex:0,contacts:1}]);
 assert.equal(result.total,3);
 assert.equal(result.signedPenetrationVerified,false);
 assert.equal(result.collisionCertified,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(JSON.stringify(result).includes('sourceSHA256'),false);
 assert.throws(()=>summarizePosedBodyContactDistribution({
  triangleContactKeys:['0:0:1:1','0:0:1:1'],triangleContactCount:2
 },3),/complete bounded original-face evidence/);
 for(const bad of ['4:0:0:0','0:4096:0:0','-1:0:0:0','0:0:NaN:0','0:0:0:10000001','01:0:0:0']){
  assert.throws(()=>summarizePosedBodyContactDistribution({
   triangleContactKeys:[bad],triangleContactCount:1
  },3),/canonical original-face|bounded source-face/);
 }
 assert.throws(()=>summarizePosedBodyContactDistribution({
  triangleContactKeys:[],triangleContactCount:0
 },0),/complete bounded original-face/);
 const {root,garment}=simplePose();
 const actual=measurePosedTriangleContacts(root,[garment]);
 const summary=summarizePosedBodyContactDistribution(actual,1);
 assert.equal(summary.total,actual.triangleContactCount);
 assert.equal(summary.byGarmentMesh.reduce((a,b)=>a+b,0),actual.triangleContactCount);
});


test('changed-source-face audit catches a new 163-bone internal fold and preserves the original garment',()=>{
 const {root,garment}=simplePose();
 const source=garment.geometry.getAttribute('position').array.slice(),stage=source.slice();
 for(let i=3;i<6;i++)stage[i*3]-=1.95;
 const evidence=measureChangedFaceSelfContactDelta(root,[garment],new Map([[garment,stage]]));
 assert.equal(evidence.changedFaces,1);
 assert.equal(evidence.newlyIntersecting,1);
 assert.deepEqual(evidence.newlyIntersectingSourceKeys,['0:0:1']);
 assert.equal(evidence.noNewSelfContacts,false);
 assert.equal(evidence.completedUniqueAffectedPairComparison,true);
 assert.equal(evidence.fullPreexistingContactEnumeration,false);
 assert.equal(evidence.signedClearanceVerified,false);
 assert.equal(evidence.releaseAuthorized,false);
 assert.deepEqual(garment.geometry.getAttribute('position').array,source);
 const unmodified=measureChangedFaceSelfContactDelta(root,[garment],new Map([[garment,source.slice()]]));
 assert.equal(unmodified.newlyIntersecting,0);
 assert.equal(unmodified.changedFaces,0);
 assert.equal(unmodified.unchangedMeshesSkipped,1);
 assert.throws(()=>measureChangedFaceSelfContactDelta(root,[garment],
  new Map([[garment,stage]]),{maxCandidateTests:1-1}),/bounded valid pose/);
 assert.throws(()=>measureChangedFaceSelfContactDelta(root,[garment],
  new Map([[garment,new Float32Array(1)]])),/finite complete staged vertex buffer/);
 assert.throws(()=>measureChangedFaceSelfContactDelta(root,[garment,garment]),/bounded valid pose/);
});

test('unchanged pre-existing self contacts never exhaust a changed-face-specific comparison',()=>{
 const {root,garment}=simplePose();
 const n=300,position=new Float32Array(n*9);
 for(let face=0;face<n;face++){
  position.set([-.3,-.3,0,.3,-.3,0,0,.4,0],face*9);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(position,3));
 const indices=new Uint16Array(n*3*4),weights=new Float32Array(n*3*4);
 for(let i=0;i<n*3;i++)weights[i*4]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const saved=position.slice(),next=position.slice();
 // Change just source face #0. Remaining ~45K old intersections are
 // irrelevant for determining whether this altered face adds a new one.
 for(let j=0;j<3;j++)next[j*3]+=5;
 const proof=measureChangedFaceSelfContactDelta(root,[mesh],new Map([[mesh,next]]));
 assert.equal(proof.changedFaces,1);
 assert.equal(proof.newlyIntersecting,0);
 assert.equal(proof.retainedExistingContacts,0);
 assert.equal(proof.completedUniqueAffectedPairComparison,true);
 assert.ok(proof.candidateTests<=300000);
 assert.deepEqual(g.getAttribute('position').array,saved);
 // The complete baseline is deliberately too large for a default-budget
 // full self-pair audit; it is neither claimed absent nor required for delta.
 assert.throws(()=>measurePosedGarmentSelfContacts(root,[mesh],
  new Map(),{maxContacts:100}),/bounded contact budget/);
});

test('indexed topological neighbors and unchanged parts do not create false new-contact alerts',()=>{
 const {root,garment}=simplePose();
 const geom=new THREE.PlaneGeometry(1,1,1,1);
 const pos=geom.getAttribute('position'),n=pos.count;
 geom.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(n*4),4));
 const weights=new Float32Array(n*4);for(let i=0;i<n;i++)weights[4*i]=1;
 geom.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(geom,new THREE.MeshStandardMaterial());
 mesh.bind(garment.skeleton);mesh.userData.work56Garment=true;root.add(mesh);
 const before=pos.array.slice(),next=before.slice();next[2]=.2;
 const result=measureChangedFaceSelfContactDelta(root,[mesh,garment],new Map([[mesh,next]]));
 assert.equal(result.newlyIntersecting,0);
 assert.ok(result.changedFaces>=1);
 assert.equal(result.unchangedMeshesSkipped,1);
 assert.equal(result.noNewSelfContacts,true);
 assert.deepEqual(pos.array,before);
});


test('changed-face detector reuses correct baseline SAT cache for retained and genuinely new pairs',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0,.5,-.5,0,0,.5,0,
  -.5,-.5,0,.5,-.5,0,0,.5,0,
  .9,-.5,0,1.9,-.5,0,1.4,.5,0
 ],3));
 const n=g.getAttribute('position').count;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(n*4),4));
 const weights=new Float32Array(n*4);for(let i=0;i<n;i++)weights[i*4]=1;
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const source=g.getAttribute('position').array.slice(),stage=source.slice();
 for(let vertex=0;vertex<3;vertex++)stage[vertex*3]+=.6;
 const proof=measureChangedFaceSelfContactDelta(root,[mesh],new Map([[mesh,stage]]));
 assert.equal(proof.changedFaces,1);
 assert.equal(proof.newlyIntersecting,1);
 assert.deepEqual(proof.newlyIntersectingSourceKeys,['0:0:2']);
 assert.equal(proof.retainedExistingContacts,1,
  'Original overlapping face remains a retained, not newly introduced, intersection');
 assert.deepEqual(mesh.geometry.getAttribute('position').array,source);
});


test('original-face newly intersecting body contacts are allocated by garment mesh and height without identifying wearers',()=>{
 const {root,garment,proposed}=simplePose();
 const original=garment.geometry.getAttribute('position').array.slice();
 const baseline=measurePosedTriangleContacts(root,[garment]);
 const staged=measurePosedTriangleContacts(root,[garment],new Map([[garment,proposed]]));
 const novelty=summarizeNewPosedBodyContactRegions(root,[garment],baseline,staged);
 const delta=comparePosedTriangleContacts(baseline,staged);
 assert.equal(novelty.newContactCount,delta.newlyIntersecting);
 assert.deepEqual(novelty.byGarmentMesh,[delta.newlyIntersecting]);
 assert.equal(novelty.byHeightQuartile.length,4);
 assert.equal(novelty.byHeightQuartile.reduce((a,n)=>a+n,0),delta.newlyIntersecting);
 assert.equal(novelty.byGarmentAndHeight[0].reduce((a,n)=>a+n,0),delta.newlyIntersecting);
 assert.equal(novelty.byBodyMesh.reduce((a,v)=>a+v.contacts,0),delta.newlyIntersecting);
 assert.equal(novelty.originalFaceIdentity,true);
 assert.equal(novelty.noPhotoOrOwnerFields,true);
 assert.equal(novelty.signedDepthVerified,false);
 assert.equal(novelty.releaseAuthorized,false);
 assert.equal(JSON.stringify(novelty).includes('sourceSHA256'),false);
 const zero=summarizeNewPosedBodyContactRegions(root,[garment],baseline,baseline);
 assert.equal(zero.newContactCount,0);
 assert.deepEqual(zero.byHeightQuartile,[0,0,0,0]);
 assert.deepEqual(garment.geometry.getAttribute('position').array,original);
 assert.throws(()=>summarizeNewPosedBodyContactRegions(root,[garment],baseline,{
  triangleContactKeys:[...baseline.triangleContactKeys,'0:0:999999:0'],
  triangleContactCount:baseline.triangleContactCount+1
 }),/outside original posed garment/);
 assert.throws(()=>summarizeNewPosedBodyContactRegions(root,[garment],baseline,{
  triangleContactKeys:['garment-name'],
  triangleContactCount:1
 }),/canonical original source face/);
 assert.throws(()=>summarizeNewPosedBodyContactRegions(root,[garment,garment],baseline,staged),
  /complete original-face contact witnesses/);
});
