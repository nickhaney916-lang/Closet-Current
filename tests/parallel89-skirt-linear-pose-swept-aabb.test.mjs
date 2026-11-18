import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalPhotoSkirtLinearSweep89 as audit}
 from '../research/parallel89/skirt-linear-pose-swept-aabb89.mjs';
const photo='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
function frames({bodyX=.08,firstY=1,lastY=-1}={}){
 const skirtIndices=new Uint16Array(576*3),bodyIndices=new Uint16Array(1000*3),
  a=new Float32Array(343*3),b=new Float32Array(343*3),
  body=new Float32Array(350*3);
 let n=0;
 for(let r=0;r<6;r++)for(let j=0;j<48;j++){
  const p=r*49+j,q=(r+1)*49+j;
  skirtIndices.set([p,q,p+1,p+1,q,q+1],n);n+=6;
 }
 for(let r=0;r<7;r++)for(let j=0;j<=48;j++){
  const i=r*49+j,angle=2*Math.PI*j/48;
  const x=.2*Math.sin(angle),z=.2*Math.cos(angle);
  a.set([x,firstY-r*.06,z],i*3);
  b.set([x,lastY-r*.06,z],i*3);
 }
 body.set([bodyX,0,.12,bodyX+.05,0,.14,bodyX+.02,.09,.20]);
 for(let i=0;i<bodyIndices.length;i+=3)bodyIndices.set([0,1,2],i);
 const make=(s)=>({
  skirt:{positions:s,indices:skirtIndices.slice()},
  body:{positions:body.slice(),indices:bodyIndices.slice()},
  strictPairs:new Set()
 });
 return {start:make(a),end:make(b),fromPose:'source',toPose:'blend-25',
  avatar:'female',sourcePhotoSHA256:photo,
  sourceAttestationStatus:'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'};
}
test('actual original 576 face layout: motion possibility appears even with ZERO original endpoint crossings',()=>{
 const v=frames(),originalPos=v.start.skirt.positions.slice(),originalBody=v.start.body.positions.slice();
 const r=audit(v);
 assert.ok(r.conservativeSourceTrianglePairAABBOverlapCount>0);
 assert.equal(r.potentialPairsNotAlreadyConfirmedByEitherEndpoint,r.conservativeSourceTrianglePairAABBOverlapCount);
 assert.deepEqual(r.originalEndpointStrictBVHPairCounts,[0,0]);
 assert.equal(r.status,'POTENTIAL_OR_ACTUAL_SKIRT_BODY_MOTION_CONTACT_BLOCKED');
 assert.equal(r.original163BonePosesSampledAtBothEndpoints,true);
 assert.equal(r.endpointStaticBVHStrictCrossingsContainedInConservativeBroadphase,true);
 assert.equal(r.continuousTrueSkeletalMotionSafetyCertified,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.deepEqual(v.start.skirt.positions,originalPos);
 assert.deepEqual(v.start.body.positions,originalBody);
 assert.equal(r.originalFacePairIDsPersistedOrEmitted,false);
});
test('separate body source triangle x swept volume proves no linear-box overlap but STILL denies arbitrary bone path',()=>{
 const r=audit(frames({bodyX:6}));
 assert.equal(r.conservativeSourceTrianglePairAABBOverlapCount,0);
 assert.equal(r.status,'NO_LINEAR_SWEPT_AABB_OVERLAP_OBSERVED_NOT_A_TRUE_BONE_MOTION_CERTIFICATE');
 assert.equal(r.continuousTrueSkeletalMotionSafetyCertified,false);
 assert.equal(r.consumer3DAdmitted,false);
});
test('consecutive source poses must retain licensed attestation and exact immutable original mesh indices',()=>{
 const fixture=frames();
 for(const changed of [
  {...fixture,avatar:'owner'}, {...fixture,sourcePhotoSHA256:'0'.repeat(64)},
  {...fixture,sourceAttestationStatus:'OWNER_APPROVED'},
  {...fixture,fromPose:'source',toPose:'relaxed'},
  {...fixture,fromPose:'relaxed',toPose:'source'},
  {...fixture,start:{...fixture.start,skirt:{...fixture.start.skirt,positions:new Float32Array(30)}}},
  {...fixture,end:{...fixture.end,body:{...fixture.end.body,indices:new Uint16Array(3)}}},
 ])assert.throws(()=>audit(changed),/P89-linear-sweep-original-source/);
});
test('invalid indexed face, nonfinite sample, rig index drift and fake strict crossing proof all fail closed',()=>{
 for(const tweak of [
  x=>x.end.skirt.indices[0]=342,
  x=>x.start.skirt.positions[0]=NaN,
  x=>x.end.body.positions[1]=Infinity,
  x=>x.end.body.indices[1]=9,
  x=>x.start.strictPairs.add('576|0'),
  x=>x.start.strictPairs.add('0|1000'),
  x=>x.start.strictPairs.add('0|00'),
 ]){const x=frames();tweak(x);
  assert.throws(()=>audit(x),/P89-linear-sweep-original-source/);}
});
test('original static BVH pair outside envelope is rejected rather than magically credited to motion check',()=>{
 const x=frames({bodyX:6});x.start.strictPairs.add('0|0');
 assert.throws(()=>audit(x),/start-real-static-source-BVH-crossing-not-covered-by-sweep/);
});
test('all four authentic consecutive pose pairs are admitted as distinct research checks only',()=>{
 const pose=['source','blend-25','blend-50','blend-75','relaxed'];
 for(let i=0;i<4;i++){
  const x=frames({bodyX:6});x.fromPose=pose[i];x.toPose=pose[i+1];
  const r=audit(x);
  assert.equal(r.fromPose,pose[i]);assert.equal(r.toPose,pose[i+1]);
  assert.equal(r.originalPhoto2DFallbackRequired,true);
 }
});
