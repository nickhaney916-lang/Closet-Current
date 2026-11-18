import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {auditOriginalSkirtSourceSelfCrossings89 as audit}
 from '../research/parallel89/skirt-original-self-crossing89.mjs';
const SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
function originalStyleSkirt(){
 const positions=new Float32Array(343*3),ix=new Uint16Array(576*3);
 for(let r=0;r<7;r++)for(let j=0;j<=48;j++){
  const a=2*Math.PI*j/48,idx=r*49+j;
  positions.set([.2*Math.sin(a),1.4-r*.1,.2*Math.cos(a)],idx*3);
 }
 for(let r=0;r<6;r++)for(let j=0;j<48;j++){
  const p=r*49+j,q=p+49,at=(r*48+j)*6;
  ix.set([p,q,p+1,p+1,q,q+1],at);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setIndex(new THREE.BufferAttribute(ix,1));
 return g;
}
function props(g=originalStyleSkirt()){
 return {source:g,avatar:'female',pose:'source',originalPhotoSHA256:SHA,
  sourceAttestationStatus:'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
  originalSource163BoneRigVerified:true};
}
test('actual original 7x49 topology without nonlocal fold: no invented self-crossing, consumer 3D remains denied',()=>{
 const x=props(),before=x.source.getAttribute('position').array.slice(),
  old=x.source.index.array.slice(),r=audit(x);
 assert.equal(r.originalPhotoTriangleCount,576);
 assert.equal(r.sourceRingCount,7);
 assert.equal(r.originalSourceUVSplitSeamPairs,7);
 assert.equal(r.originalStrictNonlocalTriangleSelfCrossings,0);
 assert.equal(r.status,'NO_STRICT_NONLOCAL_SELF_CROSSING_WITNESSED_NOT_REAL_CLOTH_CERTIFIED');
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.continuousNonlinearBoneMotionAndClothDrapeNotCertified,true);
 assert.equal(r.coplanarFoldsAndNearContactsNotResolved,true);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(x.source.getAttribute('position').array,before);
 assert.deepEqual(x.source.index.array,old);
});
test('geometrically crossing NONLOCAL original source faces are witnessed with exact source band/surface conservation',()=>{
 const x=props(),pos=x.source.getAttribute('position').array;
 // Two distant genuine indexed triangles are forced into transverse 3D
 // intersection WITHOUT changing immutable original 576-face topology.
 const a=[1*49+5,2*49+5,1*49+6],
  b=[4*49+26,5*49+26,4*49+27];
 [[-.2,0,0],[.2,0,0],[0,.2,0]].forEach((xyz,i)=>pos.set(xyz,3*a[i]));
 [[0,0,-.1],[0,.2,.1],[0,.2,-.1]].forEach((xyz,i)=>pos.set(xyz,3*b[i]));
 const r=audit(x);
 assert.ok(r.originalStrictNonlocalTriangleSelfCrossings>=1,
  'distinct original source faces must witness a transverse nonlocal cloth crossing');
 assert.equal(r.status,'ORIGINAL_SOURCE_SKIRT_SELF_INTERSECTION_WITNESSED_BLOCKED');
 assert.ok(r.originalSourceNonlocalTriangleAabbCandidatePairs>=r.originalStrictNonlocalTriangleSelfCrossings);
 assert.equal(Object.values(r.originalSelfCrossingPairsBySourceSurface).reduce((a,v)=>a+v,0),
  r.originalStrictNonlocalTriangleSelfCrossings);
 assert.equal(r.originalSelfCrossingFaceHitsBySixSourceBands.reduce((a,v)=>a+v,0),
  2*r.originalStrictNonlocalTriangleSelfCrossings);
 assert.equal(r.originalPhotoAndSkinnedRigNotExported,true);
 assert.equal(r.rawSourceTrianglePairIDsNotExported,true);
 assert.equal(r.consumer3DAdmitted,false);
});
test('fake source/photo/skin 163bone attestation, avatar, or pose are refused',()=>{
 const good=props();
 for(const bad of [
  {...good,avatar:'child'}, {...good,pose:'not-a-real-pose'},
  {...good,originalPhotoSHA256:'0'.repeat(64)},
  {...good,sourceAttestationStatus:'OWNER_APPROVED'},
  {...good,originalSource163BoneRigVerified:false},
  {...good,source:null}
 ])assert.throws(()=>audit(bad),/P89-original-source-cloth-self-crossing/);
});
test('reindexed, nonfinite, detached texture seam, and degenerate source face fail closed',()=>{
 for(const tweak of [
  g=>g.index.array[0]=2,
  g=>g.getAttribute('position').array[100]=NaN,
  g=>g.getAttribute('position').array[0]=Infinity,
  g=>g.getAttribute('position').array[48*3]+=.01,
  g=>{const a=g.getAttribute('position').array;a.set(a.slice(0,3),49*3);},
  g=>g.setIndex(new Uint16Array(40))
 ]){const g=originalStyleSkirt();tweak(g);
  assert.throws(()=>audit(props(g)),/P89-original-source-cloth-self-crossing/);}
});
test('all authentic original poses, both gender rigs, and photographed front remain HOLD even without detected crossing',()=>{
 for(const avatar of ['female','male'])
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed']){
   const r=audit({...props(),avatar,pose});
   assert.equal(r.avatar,avatar);assert.equal(r.pose,pose);
   assert.equal(r.phototexturedSourceFrontNotTheActualRear,true);
   assert.equal(r.actualGarmentPhysicalDimensionsUnverified,true);
   assert.equal(r.independentOwner3DApproved,false);
   assert.equal(r.familyAlpha,'HOLD');
  }
});
