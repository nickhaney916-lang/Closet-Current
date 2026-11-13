import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDistinctPhotoLayers84,PARALLEL84_SOURCE_REGISTRY as R}
 from '../research/parallel84-real-photo-layers/layer-contact84.mjs';

// Deterministic TRIANGLE fixtures only. These are NEVER called real garment,
// human-segmented, owner-approved, photographed or 3D-visual acceptance.
const horizontal=new Float64Array([
 -.8,-.8,0,.8,-.8,0,0,.8,0
]);
const crossing=new Float64Array([
 0,-.4,-.6,0,-.4,.6,0,.4,0
]);
const nearParallel=new Float64Array([
 -.4,-.4,.000008,.4,-.4,.000008,0,.4,.000008
]);
const far=new Float64Array([
 -.4,-.4,.5,.4,-.4,.5,0,.4,.5
]);
function input(second=far,first=horizontal){
 const proof={
  originalPhotoSHA256Verified:true,actualPhotoTexelsOnSkinnedMesh:true,
  actual163BoneSourceMesh:true,originalSourceGeometryUnmodified:true,
  rearViewPhotographed:false
 };
 return [
  {...proof,slot:'top',sourceId:'licensed-shirt',
    sourceSHA256:R['licensed-shirt'].sha,triangles:first},
  {...proof,slot:'bottom',sourceId:'licensed-jeans-1',
    sourceSHA256:R['licensed-jeans-1'].sha,triangles:second}
 ];
}
const run=(items,extra={})=>auditDistinctPhotoLayers84({
 items,avatar:'female',pose:'neutral',...extra
});
test('P84 separate real-source-claimed top/bottom pose triangles are not clearance',()=>{
 const x=run(input());
 assert.equal(x.status,'UNCERTAIN_NOT_CLEARANCE');
 assert.equal(x.strictTransverseCrossings,0);
 assert.equal(x.aabbCandidatePairs,0);
 assert.equal(x.safe3D,false);
 assert.equal(x.contactClearanceProved,false);
 assert.equal(x.unobservedBacks,2);
 assert.equal(x.releaseAuthorized,false);
});
test('P84 strict noncoplanar crossing vetoes layered garment geometry',()=>{
 const x=run(input(crossing));
 assert.equal(x.status,'STRICT_CROSSING_VETO');
 assert.ok(x.strictTransverseCrossings>=1);
 assert.equal(x.anyCrossingVeto,true);
 assert.equal(x.sourcePair,'top-bottom');
});
test('P84 coplanar / near-parallel photo surfaces never count as clearance or penetration',()=>{
 const x=run(input(nearParallel));
 assert.equal(x.status,'UNCERTAIN_NOT_CLEARANCE');
 assert.equal(x.strictTransverseCrossings,0);
 assert.ok(x.uncertainAabbPairs>=1);
 assert.ok(x.aabbCandidatePairs>=1);
});
test('P84 real 3D interior crossing is symmetric to triangle winding and avatar',()=>{
 const items=input(crossing);
 const flipped=new Float64Array([...crossing.slice(6,9),...crossing.slice(3,6),...crossing.slice(0,3)]);
 const x=run(input(flipped),{avatar:'male',pose:'walking'});
 assert.equal(x.status,'STRICT_CROSSING_VETO');
 assert.equal(x.avatar,'male');assert.equal(x.pose,'walking');
 assert.equal(items[0].triangles[0],horizontal[0]);
});
test('P84 broken source SHA, owner photo identity, texture or 163-bone receipt fails to original-photo fallback',()=>{
 for(const key of ['sourceSHA256','originalPhotoSHA256Verified','actualPhotoTexelsOnSkinnedMesh','actual163BoneSourceMesh','originalSourceGeometryUnmodified']){
  const items=input();items[1][key]=key==='sourceSHA256'?'0'.repeat(64):false;
  const x=run(items);assert.equal(x.status,'ORIGINAL_PHOTO_2D_FALLBACK',key);
  assert.equal(x.safe3D,false);
 }
});
test('P84 unsupported dress+outerwear, shoes and missing back observation do not invent sewn layers',()=>{
 const items=input();
 items[0]={...items[0],sourceId:'commons-0053',
  sourceSHA256:R['commons-0053'].sha};
 assert.equal(run(items).reason,'category-or-layer-not-supported-by-real-source-mesh');
 const shoes=input();shoes[1].slot='shoes';
 assert.equal(run(shoes).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const photographedRear=input();photographedRear[0].rearViewPhotographed=true;
 assert.equal(run(photographedRear).status,'ORIGINAL_PHOTO_2D_FALLBACK');
});
test('P84 pose, avatar and unsafe budgets fail closed',()=>{
 for(const extras of [{avatar:'alien'},{pose:'unobserved'},
   {maxComparisons:0},{maxFaces:1000000},{toleranceMeters:.1}]){
  assert.equal(run(input(),extras).safe3D,false);
  assert.equal(run(input(),extras).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 }
});
test('P84 out-of-budget comparisons explicitly INCOMPLETE not zero-contact success',()=>{
 const many=new Float64Array([...horizontal,...horizontal,...horizontal]);
 const items=input(many,many);
 const x=run(items,{maxComparisons:1,maxCandidatePairs:15});
 assert.equal(x.status,'INCOMPLETE_BUDGET');
 assert.equal(x.budgetComplete,false);
 assert.equal(x.safe3D,false);
});
test('P84 face budget, degenerate, nonfinite and malformed buffer all reject without source mutation',()=>{
 const bad=[new Float32Array([]),new Float64Array([1,2,3]),
  new Float64Array([0,0,0,1,0,0,2,0,0]),
  new Float64Array([0,0,0,1,0,0,0,NaN,0])];
 for(const triangles of bad){
  const items=input();items[0].triangles=triangles;
  assert.equal(run(items).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 }
 assert.equal(run(input(new Float64Array([...horizontal,...horizontal]),horizontal),{maxFaces:2}).status,'ORIGINAL_PHOTO_2D_FALLBACK');
});
test('P84 duplicate source, reversed slots, unknown clothing source never inherit a photo reconstruction',()=>{
 const same=input();same[1].sourceId=same[0].sourceId;
 same[1].sourceSHA256=same[0].sourceSHA256;same[1].slot='top';
 assert.equal(run(same).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const reversed=input().reverse();
 assert.equal(run(reversed).status,'ORIGINAL_PHOTO_2D_FALLBACK');
 const unknown=input();unknown[0].sourceId='owner-private-photo';
 assert.equal(run(unknown).status,'ORIGINAL_PHOTO_2D_FALLBACK');
});
test('P84 audit is read-only, emits aggregate counts only, no raw identity/XYZ/UV/source image',()=>{
 const items=input(crossing);
 const original=items.map(x=>x.triangles.slice());
 items[0].ownerId='private-owner-example';items[1].originalPhotoBytes='secret-JPEG';
 const x=run(items);
 assert.deepEqual(items.map(x=>x.triangles),original);
 const publicReceipt=JSON.stringify(x);
 for(const privateField of ['private-owner-example','secret-JPEG',
  R['licensed-shirt'].sha,'sourceSHA256','triangles','uv','coordinates'])
  assert.equal(publicReceipt.includes(privateField),false,privateField);
 assert.equal(x.originalGarmentGeometryEdited,false);
});
