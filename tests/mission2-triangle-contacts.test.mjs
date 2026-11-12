import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
 createPosedBodyIntersectionAudit,measurePosedTriangleContacts,comparePosedTriangleContacts,measurePosedGarmentPartContacts,measurePosedGarmentSelfContacts,measureChangedFaceSelfContactDelta,summarizeChangedFaceSelfContactRegions,classifyNewSourceSelfContactTypes,buildContactLinkedShortEdgeDepthCounterfactual,buildOneRingShortEdgeDepthFeather,buildResidualSourcePairZDirectionTrial,capturePhotoConstructionFaceAreas,comparePhotoConstructionAreaStages,summarizeCanonicalSourceFaceQuality,summarizePosedBodyContactDistribution,summarizeNewPosedBodyContactRegions
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


test('new self folds are allocated by exact staged 163-bone original-face height pairs, without private geometry',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0,.5,-.5,0,0,.5,0,
  1.2,-.2,-.25,1.2,.2,.25,1.2,.2,-.25
 ],3));
 const weights=new Float32Array(6*4);for(let i=0;i<6;i++)weights[i*4]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(6*4),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const original=g.getAttribute('position').array.slice(),staged=original.slice();
 for(let i=3;i<6;i++)staged[i*3]-=1.2;
 const overrides=new Map([[mesh,staged]]);
 const delta=measureChangedFaceSelfContactDelta(root,[mesh],overrides);
 assert.equal(delta.newlyIntersecting,1);
 const report=summarizeChangedFaceSelfContactRegions(root,[mesh],overrides,delta);
 assert.equal(report.newSelfContactCount,1);
 assert.deepEqual(report.byGarmentMesh,[1]);
 assert.equal(report.byHeightBandPair.length,10);
 assert.equal(report.byHeightBandPair.reduce((a,n)=>a+n,0),1);
 assert.equal(report.byHeightSeparation.reduce((a,n)=>a+n,0),1);
 assert.equal(report.heightPairOrder,'00,01,02,03,11,12,13,22,23,33');
 assert.equal(report.originalSourceFaceIdentity,true);
 assert.equal(report.completeChangedFaceComparison,true);
 assert.equal(report.noPhotoOrOwnerFields,true);
 assert.equal(report.signedPenetrationDepthVerified,false);
 assert.equal(report.selfCollisionCertified,false);
 assert.equal(report.releaseAuthorized,false);
 assert.equal(JSON.stringify(report).includes('sourceSHA256'),false);
 assert.equal(JSON.stringify(report).includes('newlyIntersectingSourceKeys'),false);
 assert.deepEqual(g.getAttribute('position').array,original);
 const empty=measureChangedFaceSelfContactDelta(root,[mesh]);
 const zero=summarizeChangedFaceSelfContactRegions(root,[mesh],new Map(),empty);
 assert.equal(zero.newSelfContactCount,0);
 assert.deepEqual(zero.byHeightBandPair,[0,0,0,0,0,0,0,0,0,0]);
 assert.throws(()=>summarizeChangedFaceSelfContactRegions(root,[mesh],overrides,
  {...delta,newlyIntersectingSourceKeys:['0:9:10']}),/original-face source bounds/);
 assert.throws(()=>summarizeChangedFaceSelfContactRegions(root,[mesh],overrides,
  {...delta,newlyIntersectingSourceKeys:['0:0:1','0:0:1'],newlyIntersecting:2}),/complete bounded original-face delta/);
 assert.throws(()=>summarizeChangedFaceSelfContactRegions(root,[mesh],new Map([[mesh,new Float32Array(3)]]),delta),
  /finite staged garment vertices/);
 assert.deepEqual(g.getAttribute('position').array,original);
});


test('new genuine nonadjacent fold is two-sided triangle-plane crossing, never collision-whitelisted',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0, .5,-.5,0, 0,.5,0,
  1.2,-.2,-.25, 1.2,.2,.25, 1.2,.2,-.25
 ],3));
 const w=new Float32Array(6*4);for(let i=0;i<6;i++)w[4*i]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(6*4),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const before=g.getAttribute('position').array.slice(),after=before.slice();
 for(let i=3;i<6;i++)after[i*3]-=1.2;
 const overrides=new Map([[mesh,after]]);
 const proof=measureChangedFaceSelfContactDelta(root,[mesh],overrides);
 assert.equal(proof.newlyIntersecting,1);
 const report=classifyNewSourceSelfContactTypes(root,[mesh],overrides,proof);
 assert.equal(report.newSelfContactCount,1);
 assert.equal(report.byContactGeometry.twoSidedPlaneStraddle,1);
 assert.equal(report.byPairAreaProvenance.bothRegular,1);
 assert.equal(report.uniqueAffectedSourceFaceCount,2);
 assert.equal(report.byUniqueFaceAreaProvenance.bothRegular,2);
 assert.equal(Object.values(report.byPhotoOwnerFittedSourceLocalShape).reduce((a,n)=>a+n,0),2);
 assert.deepEqual(report.uniqueAffectedByGarmentMesh,[2]);
 assert.equal(report.affectedIndexedBoundaryFaces,2);
 assert.equal(report.affectedIndexedInteriorFaces,0);
 assert.equal(report.affectedIndexedNonManifoldFaces,0);
 assert.equal(report.sourceLocalMorphologyAtOwnerFitNotUntouchedAnatomy,true);
 assert.equal(report.indexedBoundaryDoesNotProveSewnSeam,true);
 assert.equal(report.noSourcePositionsOrFaceKeysExported,true);
 assert.equal(report.noSmallAreaWaiver,true);
 assert.deepEqual(report.byOriginalCoincidentCorners,[1,0,0,0]);
 assert.deepEqual(report.byStagedCoincidentCorners,[1,0,0,0]);
 assert.deepEqual(report.byGarmentMesh,[1]);
 assert.equal(report.noContactWaived,true);
 assert.equal(report.topologyGapIsNotASafetyExemption,true);
 assert.equal(report.signedPenetrationDepthVerified,false);
 assert.equal(report.releaseAuthorized,false);
 assert.equal(report.noPhotoOrOwnerFields,true);
 assert.equal(JSON.stringify(report).includes('sourceSHA256'),false);
 assert.equal(JSON.stringify(report).includes('newlyIntersectingSourceKeys'),false);
 assert.deepEqual(g.getAttribute('position').array,before);
});

test('coplanar overlap is diagnosed independently from transverse fold, without ignoring it',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0, .5,-.5,0, 0,.5,0,
  1.2,-.5,0, 2.2,-.5,0, 1.7,.5,0
 ],3));
 const w=new Float32Array(6*4);for(let i=0;i<6;i++)w[4*i]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(6*4),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const before=g.getAttribute('position').array.slice(),after=before.slice();
 for(let i=3;i<6;i++)after[3*i]-=1.25;
 const overrides=new Map([[mesh,after]]);
 const proof=measureChangedFaceSelfContactDelta(root,[mesh],overrides);
 assert.equal(proof.newlyIntersecting,1);
 const report=classifyNewSourceSelfContactTypes(root,[mesh],overrides,proof);
 assert.equal(report.newSelfContactCount,1);
 assert.equal(report.byContactGeometry.nearCoplanarOverlap,1);
 assert.equal(report.byContactGeometry.twoSidedPlaneStraddle,0);
 assert.equal(report.noContactWaived,true,'Even coplanar new contact must be a strict 3D refusal');
 assert.deepEqual(g.getAttribute('position').array,before);
});

test('geometrically coincident disconnected UV seam remains counted as unsafe even when corners match',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  0,0,0, 1,0,0, 0,1,0,
  0,0,0, 1,0,0, 1,1,0
 ],3));
 const w=new Float32Array(6*4);for(let i=0;i<6;i++)w[4*i]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(6*4),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const original=g.getAttribute('position').array.slice();
 // A deliberately injected complete-form evidence record tests only typing
 // of a disconnected geometric seam. It cannot approve a garment by itself.
 const supplied={
  completedUniqueAffectedPairComparison:true,originalSourceFaceIdentity:true,
  sampledPoseOnly:true,newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:1']
 };
 const report=classifyNewSourceSelfContactTypes(root,[mesh],new Map(),supplied);
 assert.deepEqual(report.byOriginalCoincidentCorners,[0,0,1,0]);
 assert.deepEqual(report.byStagedCoincidentCorners,[0,0,1,0]);
 assert.equal(report.newSelfContactCount,1);
 assert.equal(report.noContactWaived,true);
 assert.equal(report.topologyGapIsNotASafetyExemption,true);
 assert.equal(report.byContactGeometry.nearCoplanarOverlap,1);
 assert.deepEqual(g.getAttribute('position').array,original);
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,[mesh],new Map(),
  {...supplied,newlyIntersectingSourceKeys:['0:0:1','0:0:1'],newlyIntersecting:2}),
 /complete bounded original-source self delta/);
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,[mesh],new Map(),
  {...supplied,newlyIntersectingSourceKeys:['0:0:12']}),/source triangle outside/);
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,[mesh],new Map(),supplied,
  {maxPairs:0}),/complete bounded/);
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,[mesh],new Map(),supplied,
  {maxPairs:1-0-0.5}),/complete bounded/);
});


test('area provenance identifies newly collapsed versus already tiny source faces without bypass',()=>{
 const originalTriangles=[
  -.5,-.5,0, .5,-.5,0, 0,.5,0,
  1.2,0,0, 1.4,.2,0, 1.2,.3,.1
 ];
 const posed2=(positions,stage)=>{
  const {root,garment}=simplePose();
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const w=new Float32Array(6*4);for(let i=0;i<6;i++)w[i*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(6*4),4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.userData.work56Garment=true;m.bind(garment.skeleton);root.add(m);
  const baseline=g.getAttribute('position').array.slice();
  const receipt={completedUniqueAffectedPairComparison:true,originalSourceFaceIdentity:true,
   sampledPoseOnly:true,newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:1']};
  // The hand-constructed receipt exercises typing only; it is NOT a
  // collision-audit completion or permission to admit an actual 3D fit.
  const result=classifyNewSourceSelfContactTypes(root,[m],new Map([[m,stage]]),receipt);
  assert.deepEqual(g.getAttribute('position').array,baseline);
  assert.equal(result.noContactWaived,true);
  assert.equal(result.noSmallAreaWaiver,true);
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.uniqueAffectedSourceFaceCount,2);
  assert.equal(Object.values(result.byUniqueFaceAreaProvenance).reduce((a,n)=>a+n,0),2);
  assert.equal(Object.values(result.byPairAreaProvenance).reduce((a,n)=>a+n,0),1);
  return result;
 };
 const regular=Float32Array.from(originalTriangles);
 const collapsed=regular.slice();
 collapsed.set([1.3,.1,0],15);
 const introduced=posed2(originalTriangles,collapsed);
 assert.equal(introduced.byPairAreaProvenance.newlySmall,1);
 assert.equal(introduced.byUniqueFaceAreaProvenance.newlySmall,1);
 assert.equal(introduced.byUniqueFaceAreaProvenance.bothRegular,1);
 assert.equal(introduced.sourceAreaCrossSquaredThreshold,1e-10);
 const alreadySmall=posed2([...originalTriangles.slice(0,15),1.3,.1,0],
  Float32Array.from([...originalTriangles.slice(0,15),1.3,.1,0]));
 assert.equal(alreadySmall.byPairAreaProvenance.preexistingSmall,1);
 assert.equal(alreadySmall.byUniqueFaceAreaProvenance.preexistingSmall,1);
 assert.equal(alreadySmall.byUniqueFaceAreaProvenance.bothRegular,1);
 assert.equal(alreadySmall.byPairAreaProvenance.newlySmall,0);
});


test('real 163-bone source shell with multiple left/right cap meshes pinpoints face collapse without mutation',()=>{
 const {root,garment}=simplePose(),meshes=[];
 const input=[
  0,0,0, 1,0,0, 0,1,0,
  2,0,0, 3,0,0, 2,1,0
 ];
 for(const [n,side] of [
  ['Work56-independent-shirt-shell',null],
  ['Left-actual-independent-cap','L'],
  ['Right-actual-independent-cap','R'],
  ['Second-left-source-cap','L'],
  ['Work56-independent-shirt-shell',null]
 ]){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(input,3));
  const weights=new Float32Array(6*4);
  for(let i=0;i<6;i++)weights[i*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(24),4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  mesh.name=n;mesh.userData.work56Garment=true;
  if(side)mesh.userData.work45IndependentShoulderCap=side;
  mesh.bind(garment.skeleton);root.add(mesh);meshes.push(mesh);
 }
 const shirt={meshes};
 const before=meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 const first=capturePhotoConstructionFaceAreas(root,shirt);
 assert.equal(first.faceTotal,10);
 assert.equal(first.smallTotal,0);
 assert.equal(first.transientPrivateSourceFaceIds,true);
 const shell=meshes[0].geometry.getAttribute('position');
 shell.setXYZ(2,.5,0,0);shell.needsUpdate=true;
 const photo=capturePhotoConstructionFaceAreas(root,shirt);
 assert.equal(photo.smallTotal,1);
 shell.setXYZ(2,0,1,0);shell.needsUpdate=true;
 const left=meshes[1].geometry.getAttribute('position');
 left.setXYZ(5,2.5,0,0);left.needsUpdate=true;
 const owner=capturePhotoConstructionFaceAreas(root,shirt);
 assert.equal(owner.smallTotal,1);
 const delta=comparePhotoConstructionAreaStages(first,photo,owner);
 assert.deepEqual(delta.stages,[
  'anatomicalBeforePhoto','afterP62P185Photo','afterP190P195Owner']);
 assert.equal(delta.totalOriginalSourceFaces,10);
 assert.equal(delta.smallAtAnatomicalConstruction,0);
 assert.equal(delta.sourceLocalSmallAtAnatomicalConstruction,0);
 assert.equal(delta.sourceTopologyQuality.totalSourceFaces,10);
 assert.equal(delta.sourceTopologyQuality.originalLocalTinyFaces,0);
 assert.equal(delta.sourceTopologyQuality.tinyShape.smallButWellShaped,0);
 assert.equal(delta.sourceTopologyQuality.noGeometryChanged,true);
 assert.equal(delta.sourceTopologyQuality.exactIndexedAdjacencyNotPhysicalSewing,true);
 assert.equal(delta.noMeshRepairApplied,true);
 assert.equal(delta.sourceQualityIsDiagnosticOnly,true);
 assert.equal(delta.sourceWorldPosedSmallAtAnatomicalConstruction,0);
 assert.equal(delta.sourceLocalSmallOnlyBeforePose,0);
 assert.equal(delta.sourceWorldPosedSmallOnlyAfterTransform,0);
 assert.equal(delta.sourceSmallInBothLocalAndWorldPose,0);
 assert.equal(delta.sourceRepeatedIndexFacesAtAnatomicalConstruction,0);
 assert.equal(delta.sourceExactCoincidentCornerFacesAtAnatomicalConstruction,0);
 assert.equal(delta.sourceLocalSmallAfterPhotoFit,1);
 assert.equal(delta.sourceLocalSmallAfterOwnerFit,1);
 assert.equal(delta.worldPoseIncludesSkinAndMeshTransforms,true);
 assert.equal(delta.sourceLocalVsWorldAreaThresholdIsDiagnosticOnly,true);
 assert.equal(delta.localSourceFaceNonregressionOnly,true);
 assert.equal(delta.smallAfterPhotoFit,1);
 assert.equal(delta.smallAfterOwnerMaskFit,1);
 assert.equal(delta.newlySmallDuringPhotoFit,1);
 assert.equal(delta.recoveredDuringPhotoFit,0);
 assert.equal(delta.newlySmallDuringOwnerMaskFit,1);
 assert.equal(delta.recoveredDuringOwnerMaskFit,1);
 assert.equal(delta.persistentlySmallFromAnatomicalStage,0);
 assert.equal(delta.sourceTriangleIdentityUnchanged,true);
 assert.equal(delta.noSourceFaceIdsCoordinatesOrOwnerFields,true);
 assert.equal(delta.noCollisionWaived,true);
 assert.equal(delta.releaseAuthorized,false);
 assert.equal(delta.physicalClearanceVerified,false);
 assert.equal(delta.sourcePieceCount,5);
 assert.deepEqual(delta.byGarmentMesh.map(m=>m.sourceFaceCount),[2,2,2,2,2]);
 assert.deepEqual(delta.byGarmentMesh.map(m=>m.photoFitNewSmall),[1,0,0,0,0]);
 assert.deepEqual(delta.byGarmentMesh.map(m=>m.ownerFitNewSmall),[0,1,0,0,0]);
 assert.equal(JSON.stringify(delta).includes('sourceSHA256'),false);
 assert.equal(JSON.stringify(delta).includes('indices'),false);
 assert.equal(JSON.stringify(delta).includes('originalVertex'),false);
 // Ephemeral audit flags are NOT allowed to be published as count-only source receipts.
 assert.equal(first.witnesses[0].indices instanceof Uint32Array,true);
 const tampered={...photo,witnesses:photo.witnesses.map((w,i)=>
  i? w:{...w,indices:w.indices.slice()})};
 tampered.witnesses[0].indices[0]=5;
 assert.throws(()=>comparePhotoConstructionAreaStages(first,tampered,owner),
  /source triangle identity changed/);
 assert.throws(()=>capturePhotoConstructionFaceAreas(root,{meshes:[meshes[0]]}),
  /canonical original torso shell and verified left\/right sewn cap/);
 // Original vertices have been changed in this test fixture only; no source
 // photographed JPEG or persistent account record was ever used or changed.
 assert.deepEqual(meshes[2].geometry.getAttribute('position').array,before[2]);
 assert.deepEqual(delta.photoStageBlendFeasibility.map(x=>x.fraction),[0,.25,.5,.75,1]);
 assert.deepEqual(delta.ownerStageBlendFeasibility.map(x=>x.fraction),[0,.25,.5,.75,1]);
 assert.equal(delta.photoStageBlendFeasibility[0].smallSourceFaces,first.smallTotal);
 assert.equal(delta.photoStageBlendFeasibility[4].smallSourceFaces,photo.smallTotal);
 assert.equal(delta.photoStageBlendFeasibility[4].newlySmallSourceFaces,1);
 assert.equal(delta.ownerStageBlendFeasibility[4].smallSourceFaces,owner.smallTotal);
 assert.equal(delta.ownerStageBlendFeasibility[4].newlySmallSourceFaces,1);
 assert.equal(delta.partialBlendNotApplied,true);
 assert.equal(delta.sourcePhotoShapeUnverifiedForBlend,true);
 assert.equal(delta.onlyOneRealSampledPose,true);
 assert.equal(first.witnesses[0].posedXYZ instanceof Float32Array,true);
 assert.equal(JSON.stringify(delta).includes('posedXYZ'),false);
 assert.equal(JSON.stringify(delta).includes('sourceFaceIds'),false);
 assert.equal(JSON.stringify(delta).includes('sourceSHA256'),false);

 // Regular BEFORE and AFTER faces can still collapse at the midpoint:
 // scan every intermediate original face rather than trusting endpoints.
 const start=capturePhotoConstructionFaceAreas(root,shirt);
 const firstTriangle=meshes[0].geometry.getAttribute('position');
 firstTriangle.setXYZ(2,0,-1,0);firstTriangle.needsUpdate=true;
 const end=capturePhotoConstructionFaceAreas(root,shirt);
 const mid=comparePhotoConstructionAreaStages(start,end,end);
 assert.equal(mid.photoStageBlendFeasibility[0].newlySmallSourceFaces,0);
 assert.equal(mid.photoStageBlendFeasibility[2].newlySmallSourceFaces,1);
 assert.equal(mid.photoStageBlendFeasibility[4].newlySmallSourceFaces,0);
 assert.equal(mid.photoStageBlendFeasibility[2].smallSourceFaces,start.smallTotal+1);
 assert.equal(mid.partialBlendNotApplied,true);
 // Finite, in-bounds original source posed vertices are mandatory.
 const invalid={...end,witnesses:end.witnesses.map((w,i)=>i?w:
  {...w,posedXYZ:new Float32Array(2)})};
 assert.throws(()=>comparePhotoConstructionAreaStages(start,invalid,end),
  /canonical original garment identity changed/);
});


test('P2-C17 distinguishes repeated original indices, source-local tiny faces, and world-pose-only tiny faces without disclosure',()=>{
 const {root,garment}=simplePose();
 const vertices=[0,0,0,1,0,0,0,1,0, 2,0,0,3,0,0,2,1,0];
 const make=(name,side,indices,scale)=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  if(indices)g.setIndex(indices);
  const weight=new Float32Array(6*4);
  for(let i=0;i<6;i++)weight[i*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(24),4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(weight,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.name=name;m.userData.work56Garment=true;
  if(side)m.userData.work45IndependentShoulderCap=side;
  m.scale.x=scale;
  m.bind(garment.skeleton);root.add(m);
  return m;
 };
 const shell=make('Work56-independent-shirt-shell',null,null,1e-6);
 const left=make('Left-canonical-shoulder','L',[0,1,1,3,4,5],1);
 const right=make('Right-canonical-shoulder','R',null,1);
 const meshes=[shell,left,right],shirt={meshes};
 const originals=meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 const stage=capturePhotoConstructionFaceAreas(root,shirt);
 const result=comparePhotoConstructionAreaStages(stage,stage,stage);
 assert.equal(result.totalOriginalSourceFaces,6);
 assert.equal(result.sourceLocalSmallAtAnatomicalConstruction,1);
 assert.equal(result.sourceWorldPosedSmallAtAnatomicalConstruction,3);
 assert.equal(result.sourceLocalSmallOnlyBeforePose,0);
 assert.equal(result.sourceWorldPosedSmallOnlyAfterTransform,2);
 assert.equal(result.sourceSmallInBothLocalAndWorldPose,1);
 assert.equal(result.sourceRepeatedIndexFacesAtAnatomicalConstruction,1);
 assert.equal(result.sourceExactCoincidentCornerFacesAtAnatomicalConstruction,1);
 assert.equal(result.smallAtAnatomicalConstruction,3);
 assert.deepEqual(result.byGarmentMesh.map(m=>m.worldPosedSmallOnlyAfterTransform),[2,0,0]);
 assert.deepEqual(result.byGarmentMesh.map(m=>m.repeatedSourceVertexIndexFaces),[0,1,0]);
 assert.equal(result.noCollisionWaived,true);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.worldPoseIncludesSkinAndMeshTransforms,true);
 assert.equal(result.sourceLocalVsWorldAreaThresholdIsDiagnosticOnly,true);
 for(let i=0;i<meshes.length;i++)
  assert.deepEqual(meshes[i].geometry.getAttribute('position').array,originals[i]);
 const redacted=JSON.stringify(result);
 for(const field of ['localFlags','repeatIndexFlags','coincidentCornerFlags','posedXYZ','indices','sourceSHA256','ownerId'])
  assert.equal(redacted.includes('"'+field+'"'),false);
 const forged={...stage,witnesses:stage.witnesses.map((w,i)=>i?w:{...w,localFlags:w.localFlags.slice()})};
 forged.witnesses[0].localFlags[0]=1;
 assert.throws(()=>comparePhotoConstructionAreaStages(stage,forged,stage),
  /source-local canonical original face flags invalid|collapsed source-face tally mismatch|original local source face aggregate mismatch/);
});


test('P2-C18 canonical indexed source topology separates slivers, microscopic detail, duplicates and nonmanifold seams without repairs',()=>{
 const {root,garment}=simplePose();
 const specs=[
  {name:'Work56-independent-shirt-shell',side:null,
   p:[0,0,0,1,0,0,0,1,0,1,1,0,1e-8,1e-8,0],
   indices:[0,1,2,1,3,2,0,4,1,0,1,2,0,0,1]},
  {name:'Left-source-shoulder-cap',side:'L',
   p:[0,0,0,1,0,0,.5,1e-6,0, 2,0,0,2.000001,0,0,2,.000001,0],
   indices:null},
  {name:'Right-source-shoulder-cap',side:'R',
   p:[0,0,0,.002,0,0,.001,.00173205,0],indices:null}
 ];
 const meshes=specs.map(({name,side,p,indices})=>{
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  if(indices)geo.setIndex(indices);
  const n=p.length/3,w=new Float32Array(n*4);
  for(let i=0;i<n;i++)w[i*4]=1;
  geo.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(n*4),4));
  geo.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
  const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshStandardMaterial());
  mesh.name=name;mesh.userData.work56Garment=true;
  if(side)mesh.userData.work45IndependentShoulderCap=side;
  mesh.bind(garment.skeleton);root.add(mesh);
  return mesh;
 });
 const sourceBefore=meshes.map(m=>m.geometry.attributes.position.array.slice());
 const stage=capturePhotoConstructionFaceAreas(root,{meshes});
 const topology=summarizeCanonicalSourceFaceQuality(stage);
 assert.equal(topology.totalSourceFaces,8);
 assert.equal(topology.originalLocalTinyFaces,5);
 assert.deepEqual(topology.byMesh.map(m=>m.localSmallFaces),[2,2,1]);
 assert.deepEqual(topology.tinyShape,{
  pointMicro:1,nearCoincidentEdge:2,thinSliver:1,smallButWellShaped:1
 });
 assert.equal(topology.duplicateCanonicalIndexFaces,1);
 assert.equal(topology.sourceNonManifoldFaceCount>0,true);
 assert.equal(topology.sourceBoundaryFaceCount>0,true);
 assert.equal(topology.byMesh[0].localTinyBoundaryFaces>0,true);
 assert.equal(topology.noGeometryChanged,true);
 assert.equal(topology.exactIndexedAdjacencyNotPhysicalSewing,true);
 assert.equal(topology.normalsAndUVSeamsUnverified,true);
 assert.equal(topology.releaseAuthorized,false);
 const summary=comparePhotoConstructionAreaStages(stage,stage,stage);
 assert.equal(summary.sourceTopologyQuality.originalLocalTinyFaces,5);
 assert.equal(summary.sourceTopologyQuality.duplicateCanonicalIndexFaces,1);
 assert.equal(summary.noMeshRepairApplied,true);
 const safe=JSON.stringify(summary);
 for(const privateField of ['localXYZ','posedXYZ','indices','faceKey','sourceSHA256','ownerId','skinWeight'])
  assert.equal(safe.includes('"'+privateField+'"'),false);
 for(let i=0;i<meshes.length;i++)
  assert.deepEqual(meshes[i].geometry.attributes.position.array,sourceBefore[i]);
 const forged={...stage,witnesses:stage.witnesses.map((w,i)=>i?w:
  {...w,localXYZ:new Float32Array(w.localXYZ)})};
 forged.witnesses[0].localXYZ[1]=NaN;
 assert.throws(()=>summarizeCanonicalSourceFaceQuality(forged),
  /finite coordinates required/);
 const forgedFlag={...stage,witnesses:stage.witnesses.map((w,i)=>i?w:
  {...w,localFlags:w.localFlags.slice()})};
 forgedFlag.witnesses[0].localFlags[2]=0;
 assert.throws(()=>summarizeCanonicalSourceFaceQuality(forgedFlag),
  /differs from canonical original flags/);
});


test('P2-C19 ties genuinely skinned source face sliver and regular neighbor to exact contact keys without exposing geometry',()=>{
 const {root,garment}=simplePose();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,0,0,.5,0,0,0,.000001,0,
  1,0,0,2,0,0,1.5,1,0
 ],3));
 const w=new Float32Array(6*4);for(let i=0;i<6;i++)w[i*4]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(24),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 m.userData.work56Garment=true;m.bind(garment.skeleton);root.add(m);
 const original=g.getAttribute('position').array.slice();
 // An explicitly hand-constructed exact-source contact claim tests only
 // classification and privacy; it does NOT authorize a genuine 3D fit.
 const proof={completedUniqueAffectedPairComparison:true,originalSourceFaceIdentity:true,
  sampledPoseOnly:true,newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:1']};
 const result=classifyNewSourceSelfContactTypes(root,[m],new Map(),proof);
 assert.equal(result.newSelfContactCount,1);
 assert.equal(result.uniqueAffectedSourceFaceCount,2);
 assert.deepEqual(result.byPhotoOwnerFittedSourceLocalShape,{
  regularNotTiny:1,pointMicro:0,nearCoincidentEdge:0,thinSliver:1,smallButWellShaped:0
 });
 assert.deepEqual(result.uniqueAffectedByGarmentMesh,[2]);
 assert.equal(result.affectedIndexedBoundaryFaces,2);
 assert.equal(result.affectedIndexedInteriorFaces,0);
 assert.equal(result.affectedIndexedNonManifoldFaces,0);
 assert.equal(result.sourceLocalMorphologyAtOwnerFitNotUntouchedAnatomy,true);
 assert.equal(result.indexedBoundaryDoesNotProveSewnSeam,true);
 assert.equal(result.noSourcePositionsOrFaceKeysExported,true);
 const short=result.contactLinkedShortEdgeStageUVSkinEvidence;
 assert.equal(short.nearCoincidentAffectedFaces,0);
 assert.equal(short.stageSourceEvidenceComplete,false);
 assert.equal(short.shortEdgeShapeBySourceStage,null);
 assert.equal(short.nearEdgeFirstObservedStage,null);
 assert.deepEqual(short.shortEdgeUVEndpointEvidence,{unavailable:0,nearSameUV:0,differentUV:0});
 assert.deepEqual(short.shortEdge163BoneInfluenceEvidence,{same:0,different:0});
 assert.equal(short.noGeometryEdited,true);
 assert.equal(short.noContactWaived,true);
 assert.equal(result.noContactWaived,true);
 assert.equal(result.releaseAuthorized,false);
 for(const term of ['newlyIntersectingSourceKeys','faceKey','localXYZ','sourceSHA256','ownerId'])
  assert.equal(JSON.stringify(result).includes('\"'+term+'\"'),false);
 assert.deepEqual(m.geometry.getAttribute('position').array,original);
 const forged={...proof,newlyIntersectingSourceKeys:['0:0:999']};
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,[m],new Map(),forged),
  /source triangle outside complete posed garment/);
});


test('P2-C20 original contacted short edge first appears in owner mask, with genuine 163-bone influence and UV difference; all source buffers stay byte-identical',()=>{
 const {root,garment}=simplePose(),meshObjects=[];
 const make=(name,side,coords)=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([
   0,0,1,0,.3,.4, 0,0,1,0,0,1
  ],2));
  const bones=new Uint16Array(24),weights=new Float32Array(24);
  for(let i=0;i<6;i++)weights[i*4]=1;
  // A distinct weight on the short-edge endpoint, not a claim of defect.
  bones[2*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(bones,4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.name=name;m.userData.work56Garment=true;
  if(side)m.userData.work45IndependentShoulderCap=side;
  m.bind(garment.skeleton);root.add(m);meshObjects.push(m);return m;
 };
 const input=[
  0,0,0,1,0,0,0,.05,0,
  3,0,0,4,0,0,3,1,0
 ];
 const shell=make('Work56-independent-shirt-shell',null,input);
 make('Independent-left-cap','L',input);
 make('Independent-right-cap','R',input);
 const shirt={meshes:meshObjects};
 const before=capturePhotoConstructionFaceAreas(root,shirt);
 const pos=shell.geometry.getAttribute('position');
 pos.setY(2,.002);pos.needsUpdate=true;
 const photo=capturePhotoConstructionFaceAreas(root,shirt);
 pos.setY(2,.000001);pos.needsUpdate=true;
 const owner=capturePhotoConstructionFaceAreas(root,shirt);
 const fixed=meshObjects.map(m=>({
  position:m.geometry.getAttribute('position').array.slice(),
  uv:m.geometry.getAttribute('uv').array.slice(),
  skin:m.geometry.getAttribute('skinWeight').array.slice()
 }));
 // A synthetic exact-face pair exercises lineage only. This deliberate hand
 // claim never authorizes an actual intersection or a user-photo 3D outfit.
 const proof={completedUniqueAffectedPairComparison:true,originalSourceFaceIdentity:true,
  sampledPoseOnly:true,newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:1']};
 const result=classifyNewSourceSelfContactTypes(root,meshObjects,new Map(),proof,
  {sourceAreaStages:[before,photo,owner]});
 const lineage=result.contactLinkedShortEdgeStageUVSkinEvidence;
 assert.equal(lineage.nearCoincidentAffectedFaces,1);
 assert.equal(lineage.stageSourceEvidenceComplete,true);
 assert.deepEqual(lineage.shortEdgeShapeBySourceStage.map(x=>x.stage),
  ['anatomical','afterPhoto62','afterOwner190']);
 assert.deepEqual(lineage.shortEdgeShapeBySourceStage.map(x=>x.counts.nearCoincidentEdge),
  [0,0,1]);
 assert.deepEqual(lineage.nearEdgeFirstObservedStage,
  {anatomical:0,photoFit:0,ownerFit:1});
 assert.deepEqual(lineage.shortEdgeUVEndpointEvidence,
  {unavailable:0,nearSameUV:0,differentUV:1});
 assert.deepEqual(lineage.shortEdge163BoneInfluenceEvidence,
  {same:0,different:1});
 assert.equal(lineage.noGeometryEdited,true);
 assert.equal(lineage.noContactWaived,true);
 assert.equal(lineage.releaseAuthorized,false);
 assert.equal(lineage.uvSamenessIsNotProofOfSewnSeams,true);
 assert.equal(lineage.skinDisagreementIsNotProofOfRigDefect,true);
 for(let i=0;i<meshObjects.length;i++){
  assert.deepEqual(meshObjects[i].geometry.getAttribute('position').array,fixed[i].position);
  assert.deepEqual(meshObjects[i].geometry.getAttribute('uv').array,fixed[i].uv);
  assert.deepEqual(meshObjects[i].geometry.getAttribute('skinWeight').array,fixed[i].skin);
 }
 const redacted=JSON.stringify(result);
 for(const forbidden of ['sourceSHA256','localXYZ','posedXYZ','sourceFaceIds',
  'newlyIntersectingSourceKeys','skinWeight','skinIndex','sourceUV','sourceFaceKeys'])
  assert.equal(redacted.includes('"'+forbidden+'"'),false);
 const corrupted={...owner,witnesses:owner.witnesses.map((w,i)=>
  i? w:{...w,indices:new Uint32Array(w.indices)})};
 corrupted.witnesses[0].indices[1]=2;
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,meshObjects,new Map(),proof,
  {sourceAreaStages:[before,photo,corrupted]}),
  /original three-stage face identity mismatch/);
 const stale={...owner,witnesses:owner.witnesses.map((w,i)=>
  i? w:{...w,localXYZ:new Float32Array(w.localXYZ)})};
 stale.witnesses[0].localXYZ[7]=.08;
 assert.throws(()=>classifyNewSourceSelfContactTypes(root,meshObjects,new Map(),proof,
  {sourceAreaStages:[before,photo,stale]}),
  /owner stage changed before depth trial/);
});


test('P2-C21 depth-only counterfactual preserves photographed XY and source geometry while changing only contact-linked short-edge Z',()=>{
 const {root,garment}=simplePose();
 const build=(positions)=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const n=positions.length/3;
  const weights=new Float32Array(n*4);for(let i=0;i<n;i++)weights[i*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(n*4),4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.userData.work56Garment=true;m.bind(garment.skeleton);root.add(m);return m;
 };
 const m=build([
  0,0,0, 1,0,0, 0,.000001,0,
  2,0,0, 3,0,0, 2,1,0
 ]);
 const unchanged=m.geometry.attributes.position.array.slice(),staged=unchanged.slice();
 staged[2]=.02;staged[8]=.009;staged[3*3+2]=.02;
 const savedStaged=staged.slice(),overrides=new Map([[m,staged]]);
 const newContacts={newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:1'],
  completedUniqueAffectedPairComparison:true,originalSourceFaceIdentity:true,sampledPoseOnly:true};
 const result=buildContactLinkedShortEdgeDepthCounterfactual([m],overrides,newContacts);
 assert.equal(result.countOnly.originallyNewSelfContactPairs,1);
 assert.equal(result.countOnly.implicatedNearEdgeVertices,2);
 assert.equal(result.countOnly.actuallyChangedDepthVertices,2);
 assert.equal(result.countOnly.maximumDepthAdjustmentMeters>0,true);
 assert.equal(result.countOnly.maximumDepthAdjustmentMeters<=.012000001,true);
 assert.equal(result.countOnly.originalSourcePhotoXYBitIdentical,true);
 assert.equal(result.countOnly.originalSourceAndStagedArraysUnchanged,true);
 assert.equal(result.countOnly.seamAndBoneWeightsUnchanged,true);
 assert.equal(result.countOnly.notAdmissibleFor3DOrRelease,true);
 assert.equal(result.countOnly.releaseAuthorized,false);
 const alternate=result.privateOverrides.get(m);
 assert.ok(Math.abs(alternate[2]-(staged[2]-.012))<1e-8);
 assert.equal(alternate[8],unchanged[8]);
 assert.equal(alternate[3*3+2],staged[3*3+2]);
 for(let i=0;i<unchanged.length/3;i++){
  assert.equal(alternate[3*i],savedStaged[3*i]);
  assert.equal(alternate[3*i+1],savedStaged[3*i+1]);
 }
 assert.deepEqual(m.geometry.attributes.position.array,unchanged);
 assert.deepEqual(staged,savedStaged);
 assert.equal(JSON.stringify(result.countOnly).includes('newlyIntersectingSourceKeys'),false);
 assert.equal(JSON.stringify(result.countOnly).includes('sourceSHA256'),false);
 assert.equal(JSON.stringify(result.countOnly).includes('skinIndex'),false);
 // A counterfactual Map must NEVER enter the signed browser/owner receipt.
 assert.equal(Object.hasOwn(result.countOnly,'privateOverrides'),false);
 assert.throws(()=>buildContactLinkedShortEdgeDepthCounterfactual([m],overrides,
  {...newContacts,newlyIntersectingSourceKeys:['0:0:9000']}),
  /outside bounded original geometry/);
 assert.throws(()=>buildContactLinkedShortEdgeDepthCounterfactual([m],new Map(),
  newContacts),/complete private original self contact delta required/);
 const corrupt=new Float32Array(staged);corrupt[7]=NaN;
 assert.throws(()=>buildContactLinkedShortEdgeDepthCounterfactual([m],
  new Map([[m,corrupt]]),newContacts),/actual finite 163-bone original/);
 const none=buildContactLinkedShortEdgeDepthCounterfactual([m],overrides,
  {...newContacts,newlyIntersecting:0,newlyIntersectingSourceKeys:[]});
 assert.equal(none.countOnly.implicatedNearEdgeVertices,0);
 assert.equal(none.countOnly.actuallyChangedDepthVertices,0);
 assert.deepEqual(none.privateOverrides.get(m),savedStaged);
});


test('P2-C22 feathered one-ring 163-bone short-edge correction touches only source indexed faces and never joins separate seams',()=>{
 const {root,garment}=simplePose();
 const positions=[
  0,0,0, 1,0,0, 0,.000001,0,
  2,0,0, 3,0,0, 2,1,0
 ];
 const make=(indexed)=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  if(indexed)g.setIndex([0,1,2,0,3,4,3,4,5]);
  const weights=new Float32Array(6*4);for(let v=0;v<6;v++)weights[v*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(24),4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.userData.work56Garment=true;m.bind(garment.skeleton);root.add(m);
  return m;
 };
 for(const indexed of [false,true]){
  const m=make(indexed);
  const original=m.geometry.attributes.position.array.slice();
  const next=original.slice();
  for(const v of [0,1,2,3,4])next[v*3+2]=.02;
  const reference=next.slice();
  const overrides=new Map([[m,next]]);
  const originalProof={newlyIntersecting:1,
   newlyIntersectingSourceKeys:indexed?['0:0:2']:['0:0:1'],
   completedUniqueAffectedPairComparison:true,originalSourceFaceIdentity:true,sampledPoseOnly:true};
  const held=buildContactLinkedShortEdgeDepthCounterfactual([m],overrides,originalProof);
  const result=buildOneRingShortEdgeDepthFeather([m],overrides,held);
  const counts=result.countOnly,arr=result.privateOverrides.get(m),
   heldArray=held.privateOverrides.get(m);
  assert.equal(counts.originalShortEdgeAnchors,2);
  assert.equal(counts.oneRingPropagationWeight,.5);
  assert.equal(counts.photoXYSilhouetteBitIdentical,true);
  assert.equal(counts.sourceMeshAndShortEdgeProposalUnchanged,true);
  assert.equal(counts.originalSourceIndexedAdjacencyOnly,true);
  assert.equal(counts.nonIndexedVerticesNeverReconnected,true);
  assert.equal(counts.noCrossSeamInference,true);
  assert.equal(counts.noUVSkinWeightOrOriginalPhotoMutation,true);
  assert.equal(counts.requiresIndependentBodyPanelSelfAudits,true);
  assert.equal(counts.notAdmissibleFor3DOrRelease,true);
  assert.equal(counts.noContactWaived,true);
  assert.equal(counts.releaseAuthorized,false);
  assert.ok(counts.oneRingVerticesMoved>=1);
  assert.ok(counts.maximumOneRingDepthMeters<=.00900001);
  // Hold the P2-C21 exact affected original source vertices byte-identical.
  assert.equal(arr[2],heldArray[2]);
  assert.equal(arr[8],heldArray[8]);
  assert.ok(arr[5]<heldArray[5]&&arr[5]>reference[5]-.00900001);
  if(indexed){
   assert.ok(arr[3*3+2]<heldArray[3*3+2]);
   assert.ok(arr[3*4+2]<heldArray[3*4+2]);
   assert.equal(counts.oneRingVerticesMoved,3);
  }else{
   assert.equal(arr[3*3+2],heldArray[3*3+2]);
   assert.equal(arr[3*4+2],heldArray[3*4+2]);
   assert.equal(counts.oneRingVerticesMoved,1);
  }
  assert.equal(arr[3*5+2],reference[3*5+2]);
  for(let v=0;v<6;v++){
   assert.equal(arr[v*3],reference[v*3]);
   assert.equal(arr[v*3+1],reference[v*3+1]);
  }
  assert.deepEqual(m.geometry.attributes.position.array,original);
  assert.deepEqual(next,reference);
  assert.deepEqual(held.privateOverrides.get(m),heldArray);
  const serial=JSON.stringify(counts);
  for(const hidden of ['privateOverrides','sourceSHA256','originalSourceFaceKeys',
   'sourceXYZ','skinIndex','skinWeight','sourceUV'])
   assert.equal(serial.includes('"'+hidden+'"'),false);
  assert.throws(()=>buildOneRingShortEdgeDepthFeather([m],overrides,held,
   {neighborWeight:1}),/complete private immutable original short-edge trial/);
  if(indexed)
   assert.throws(()=>buildOneRingShortEdgeDepthFeather([m],overrides,held,
    {maxNeighborVertices:1}),/neighbor budget exhausted/);
  else assert.equal(buildOneRingShortEdgeDepthFeather([m],overrides,held,
    {maxNeighborVertices:1}).countOnly.oneRingVerticesMoved,1);
  root.remove(m);
 }
});


test('P2-C23 predeclared 25/50/75 one-ring source-only Z sweep is bounded, monotonic per neighbor, preserves disconnected panel and owner photo',()=>{
 const {root,garment}=simplePose();
 const coords=[0,0,0, 1,0,0, 0,.000001,0,
   2,0,0,3,0,0,2,1,0];
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
 geo.setIndex([0,1,2,0,3,4,3,4,5]);
 const bones=new Uint16Array(6*4),weights=new Float32Array(6*4);
 for(let i=0;i<6;i++)weights[i*4]=1;
 geo.setAttribute('skinIndex',new THREE.BufferAttribute(bones,4));
 geo.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshStandardMaterial());
 mesh.userData.work56Garment=true;mesh.bind(garment.skeleton);root.add(mesh);
 const original=geo.getAttribute('position').array.slice();
 const proposed=original.slice();
 for(const v of [0,1,2,3,4])proposed[v*3+2]=.02;
 const savedProposal=proposed.slice(),input=new Map([[mesh,proposed]]);
 const sourcePair={newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:2'],
  originalSourceFaceIdentity:true,completedUniqueAffectedPairComparison:true,sampledPoseOnly:true};
 const held=buildContactLinkedShortEdgeDepthCounterfactual([mesh],input,sourcePair);
 const seen=[];
 for(const weight of [.25,.5,.75]){
  const sw=buildOneRingShortEdgeDepthFeather([mesh],input,held,
   {neighborWeight:weight,maxNeighborVertices:512});
  const rec=sw.countOnly,alt=sw.privateOverrides.get(mesh);
  assert.equal(rec.oneRingPropagationWeight,weight);
  assert.equal(rec.originalShortEdgeAnchors,2);
  assert.equal(rec.oneRingVerticesMoved,3);
  assert.equal(rec.photoXYSilhouetteBitIdentical,true);
  assert.equal(rec.originalSourceIndexedAdjacencyOnly,true);
  assert.equal(rec.nonIndexedVerticesNeverReconnected,true);
  assert.equal(rec.noCrossSeamInference,true);
  assert.equal(rec.sourceMeshAndShortEdgeProposalUnchanged,true);
  assert.equal(rec.noUVSkinWeightOrOriginalPhotoMutation,true);
  assert.equal(rec.requiresIndependentBodyPanelSelfAudits,true);
  assert.equal(rec.notAdmissibleFor3DOrRelease,true);
  assert.equal(rec.releaseAuthorized,false);
  assert.ok(rec.maximumOneRingDepthMeters>=0&&rec.maximumOneRingDepthMeters<=.00900001);
  for(const vertex of [0,2]){
   assert.equal(alt[vertex*3+2],held.privateOverrides.get(mesh)[vertex*3+2]);
  }
  assert.equal(alt[5*3+2],savedProposal[5*3+2]);
  for(let v=0;v<6;v++){
   assert.equal(alt[v*3],savedProposal[v*3]);
   assert.equal(alt[v*3+1],savedProposal[v*3+1]);
  }
  // Synthetic neighbor 3 shares original indexed face with short-edge anchor.
  const amt=savedProposal[3*3+2]-alt[3*3+2];
  assert.ok(amt>0&&amt<=.00900001);
  seen.push(amt);
  assert.deepEqual(mesh.geometry.getAttribute('position').array,original);
  assert.deepEqual(proposed,savedProposal);
  assert.equal(Object.hasOwn(rec,'privateOverrides'),false);
  for(const forbidden of ['sourceFaceKeys','newlyIntersectingSourceKeys','localXYZ',
   'sourceSHA256','skinWeight','sourceUV'])
   assert.equal(JSON.stringify(rec).includes('"'+forbidden+'"'),false);
 }
 assert.ok(seen[0]<seen[1]&&seen[1]<seen[2],
  'predeclared local Z neighbor adjustments increase without changing the anchors');
 assert.throws(()=>buildOneRingShortEdgeDepthFeather([mesh],input,held,
   {neighborWeight:.8}),/complete private immutable original short-edge trial/);
});


test('P2-C24 true 163-bone original source residual face pairs get two opposite <=3mm local Z hypotheses, neither saving or welding the photographed garment',()=>{
 const {root,garment}=simplePose();
 const input=[
  0,0,0, 1,0,0, 0,1,0,
  0,0,.002, 1,0,.002, 0,1,.002
 ];
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(input,3));
 const weights=new Float32Array(24);
 for(let i=0;i<6;i++)weights[i*4]=1;
 g.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(24),4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 m.userData.work56Garment=true;m.bind(garment.skeleton);root.add(m);
 const untouched=g.getAttribute('position').array.slice();
 const after=untouched.slice(),saved=after.slice();
 const proposed=new Map([[m,after]]);
 const witness={
  originalSourceFaceIdentity:true,completedUniqueAffectedPairComparison:true,
  sampledPoseOnly:true,newlyIntersecting:1,newlyIntersectingSourceKeys:['0:0:1']
 };
 const apart=buildResidualSourcePairZDirectionTrial([m],proposed,witness);
 const reverse=buildResidualSourcePairZDirectionTrial([m],proposed,witness,
  {direction:'reverse'});
 const receipts=[apart,reverse].map(x=>x.countOnly);
 assert.deepEqual(receipts.map(x=>x.directionHypothesis),['separate','reverse']);
 for(const x of receipts){
  assert.equal(x.residualOriginalSelfContactPairs,1);
  assert.deepEqual(x.distinctOriginalSourceFacesByMesh,[2]);
  assert.equal(x.distinctOriginalSourceFaces,2);
  assert.equal(x.nearEqualLocalDepthResidualPairs,0);
  assert.equal(x.differentLocalDepthResidualPairs,1);
  assert.equal(x.votedOriginalSourceVertices,6);
  assert.equal(x.movedOriginalSourceVertices,6);
  assert.equal(x.maximumDepthMeters,.003);
  assert.ok(x.maximumAppliedLocalZMeters<=.003000001);
  assert.equal(x.bothOppositeSignHypothesesRequired,true);
  assert.equal(x.noPhysicalSewingOrDepthClaim,true);
  assert.equal(x.sourceOriginalAndStagedArraysUnchanged,true);
  assert.equal(x.sourcePhotoXYBitIdentical,true);
  assert.equal(x.noUVSkinWeightOrSourcePhotoMutation,true);
  assert.equal(x.residualOriginalFaceKeysNeverExported,true);
  assert.equal(x.noGeometryApplied,true);
  assert.equal(x.independentFullBodyPanelSelfAuditMandatory,true);
  assert.equal(x.noContactWaived,true);
  assert.equal(x.notAdmissibleFor3DOrRelease,true);
  assert.equal(x.releaseAuthorized,false);
  assert.equal(Object.hasOwn(x,'privateOverrides'),false);
  for(const key of ['localXYZ','newlyIntersectingSourceKeys','originalSourceFaceKeys',
   'ownerId','sourceSHA256','skinIndex','skinWeight','sourceUV'])
   assert.equal(JSON.stringify(x).includes('"'+key+'"'),false);
 }
 const a=apart.privateOverrides.get(m),b=reverse.privateOverrides.get(m);
 assert.notEqual(a,b);
 for(let v=0;v<6;v++){
  const k=v*3+2,expectedSign=v<3?-1:1;
  assert.ok(Math.abs(a[k]-(after[k]+expectedSign*.003))<1e-8);
  assert.ok(Math.abs(b[k]-(after[k]-expectedSign*.003))<1e-8);
  for(const offset of [0,1]){
   assert.equal(a[v*3+offset],saved[v*3+offset]);
   assert.equal(b[v*3+offset],saved[v*3+offset]);
  }
 }
 assert.deepEqual(g.getAttribute('position').array,untouched);
 assert.deepEqual(after,saved);
 const forged={...witness,newlyIntersectingSourceKeys:['0:0:999']};
 assert.throws(()=>buildResidualSourcePairZDirectionTrial([m],proposed,forged),
  /original residual source face pair out of bounds/);
 assert.throws(()=>buildResidualSourcePairZDirectionTrial([m],proposed,witness,
  {maxDepthMeters:.008}),/complete bounded exact residual original-face pair evidence/);
 assert.throws(()=>buildResidualSourcePairZDirectionTrial([m],proposed,witness,
  {maxVertices:2}),/narrow original source vertex budget/);
 const malformed=new Float32Array(after);malformed[6]=NaN;
 assert.throws(()=>buildResidualSourcePairZDirectionTrial([m],
  new Map([[m,malformed]]),witness),/full finite 163-bone original source/);
 const sameFace={...witness,newlyIntersectingSourceKeys:['0:0:0']};
 assert.throws(()=>buildResidualSourcePairZDirectionTrial([m],proposed,sameFace),
  /original residual source face pair out of bounds/);
});
