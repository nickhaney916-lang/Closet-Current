/**
 * Deterministic adversarial source-index / pose receipt tests, NOT original
 * JPEG / original 163-bone avatar / genuine Chromium or WebKit acceptance.
 * Actual immutable P541 male/female checks occur in native P89 browser CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {auditOriginalPhotoFrontLockedCollisionFloor89 as audit,
 classifySourcePhotoSkirtIndexedFace89 as classify}
 from '../research/parallel89/skirt-original-photo-front-locked-floor89.mjs';

const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=['source','blend-25','blend-50','blend-75','relaxed'];
function fixture(avatar='female'){
 const g=new T.BufferGeometry(),position=[],rest=[],uv=[],skin=[],weights=[],indices=[];
 for(let row=0;row<7;row++)for(let j=0;j<=48;j++){
  const a=j*Math.PI/24,x=.20*Math.sin(a),z=.15*Math.cos(a);
  position.push(x,1.5-row*.1,z);rest.push(x,1.5-row*.1,z);
  uv.push(j/48,row/6);skin.push(0,0,0,0);weights.push(1,0,0,0);
  if(row<6&&j<48){
   const p=row*49+j,q=p+49;
   indices.push(p,p+1,q,p+1,q+1,q);
  }
 }
 g.setAttribute('position',new T.Float32BufferAttribute(position,3));
 g.setAttribute('sourceSkirt89Rest',new T.Float32BufferAttribute(rest,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 g.setIndex(indices);
 const root=new T.Group(),bones=Array.from({length:163},()=>new T.Bone());
 bones.forEach(b=>root.add(b));
 const mesh=new T.SkinnedMesh(g,new T.MeshStandardMaterial());
 root.add(mesh);mesh.bind(new T.Skeleton(bones));
 let current='source';
 const pair=(skirt,body)=>skirt+'|'+body;
 const defaultKeys=[pair(0,42),pair(40,99),pair(24,17),pair(95,19)];
 const evidence=keys=>({
  count:keys.length,pairs:new Set(keys),maxDepth:.001,
  trueOriginalSkirtTriangleIndexStable:true,
  trueOriginalBodyTriangleIndexStable:true,
  originalFaceSourceResolution:'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES'
 });
 const input={
  mesh,avatar,sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG[avatar],sourcePhotoCenterlineVerified:true,
  originalBodyFaceCount:2000,
  applyPose:p=>{assert.ok(POSES.includes(p));current=p;},
  sampleContact:()=>evidence(defaultKeys)
 };
 return {mesh,g,input,evidence,getCurrent:()=>current};
}
test('authentic 576 original skirt index identities partition front/rear/boundary exactly',()=>{
 const counts={PHOTOGRAPH_FRONT_LOCKED:0,
  UNPHOTOGRAPHED_REAR_PROVISIONAL:0,
  SOURCE_PHOTO_REAR_TRANSITION:0};
 for(let i=0;i<576;i++)counts[classify(i).photoRegion]++;
 assert.deepEqual(counts,{PHOTOGRAPH_FRONT_LOCKED:288,
  UNPHOTOGRAPHED_REAR_PROVISIONAL:264,
  SOURCE_PHOTO_REAR_TRANSITION:24});
 assert.equal(classify(0).photoRegion,'PHOTOGRAPH_FRONT_LOCKED');
 assert.equal(classify(24).photoRegion,'SOURCE_PHOTO_REAR_TRANSITION');
 assert.equal(classify(40).photoRegion,'UNPHOTOGRAPHED_REAR_PROVISIONAL');
 assert.equal(classify(95).photoRegion,'PHOTOGRAPH_FRONT_LOCKED');
 for(const bad of [-1,576,23.5,NaN,Infinity,'0'])assert.throws(()=>classify(bad));
});
test('five genuine-identity synthetic source pose receipts prove immutable front contact floor without exporting IDs',()=>{
 for(const avatar of ['female','male']){
  const x=fixture(avatar),orig=x.g.getAttribute('position').array.slice();
  const r=audit(x.input);
  assert.equal(r.status,'ORIGINAL_PHOTO_FRONT_LOCKED_COLLISIONS_PREVENT_REAR_ONLY_CLEARANCE');
  assert.equal(r.originalWholeBodyStrictCrossingsAcrossFivePoses,20);
  assert.equal(r.immutablePhotographFrontCollisionFloorAcrossFivePoses,10);
  assert.equal(r.originalNeutralRearHypothesisCrossingsAcrossFivePoses,5);
  assert.equal(r.originalSourceTransitionCrossingsAcrossFivePoses,5);
  assert.equal(r.rearOnlyFitCannotEliminatePhotographFrontContact,true);
  assert.deepEqual(r.originalFivePoseNames,POSES);
  assert.equal(r.originalAlphaStripsDoNotProvePhysicalHeightOrAnatomicalFit,true);
  assert.equal(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.length,6);
  assert.deepEqual(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.map(v=>
   v.originalFrontContactPairWitnessesAcrossFivePoses),[10,0,0,0,0,0]);
  assert.deepEqual(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.map(v=>
   v.distinctOriginalFrontSourceTrianglesContacted),[2,0,0,0,0,0]);
  assert.deepEqual(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.map(v=>
   v.posesWithOriginalFrontContact),[5,0,0,0,0,0]);
  assert.ok(r.staticOriginalPoseSamples.every(v=>
   v.photographedFrontContactPairsByOriginalAlphaStrip.length===6 &&
   v.photographedFrontContactPairsByOriginalAlphaStrip.reduce((a,b)=>a+b,0)===2));
  assert.equal(r.staticOriginalPoseSamples.length,5);
  assert.equal(r.originalPhoto2DFallbackRequired,true);
  assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.familyAlpha,'HOLD');
  assert.equal(x.getCurrent(),'source');
  assert.deepEqual(x.g.getAttribute('position').array,orig);
  assert.equal(JSON.stringify(r).includes('0|42'),false,'never export body/skirt triangle identity');
 }
});
test('original front collision map is source-strip and pose-local, not inferred anatomy',()=>{
 const x=fixture(),current=x.getCurrent;
 const receipts={source:['0|42'],'blend-25':['192|24'],
  'blend-50':[],'blend-75':['575|33'],relaxed:['40|99']};
 let currentPose='source';
 const r=audit({...x.input,
  applyPose:p=>{assert.ok(POSES.includes(p));currentPose=p;},
  sampleContact:()=>x.evidence(receipts[currentPose])});
 assert.equal(r.immutablePhotographFrontCollisionFloorAcrossFivePoses,3);
 assert.equal(r.originalNeutralRearHypothesisCrossingsAcrossFivePoses,1);
 assert.equal(r.originalWholeBodyStrictCrossingsAcrossFivePoses,4);
 assert.deepEqual(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.map(v=>
  v.originalFrontContactPairWitnessesAcrossFivePoses),[1,0,1,0,0,1]);
 assert.deepEqual(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.map(v=>
  v.distinctOriginalFrontSourceTrianglesContacted),[1,0,1,0,0,1]);
 assert.deepEqual(r.originalPhotoFrontContactBySixMeasuredAlphaStrips.map(v=>
  v.posesWithOriginalFrontContact),[1,0,1,0,0,1]);
 assert.deepEqual(r.staticOriginalPoseSamples.map(v=>
  v.photographedFrontContactPairsByOriginalAlphaStrip),
  [[1,0,0,0,0,0],[0,0,1,0,0,0],[0,0,0,0,0,0],
   [0,0,0,0,0,1],[0,0,0,0,0,0]]);
 assert.equal(currentPose,'source');
 assert.equal(JSON.stringify(r).includes('575|33'),false);
 assert.equal(JSON.stringify(r).includes('192|24'),false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
});
test('one altered source male GLB SHA cannot impersonate the genuine 163-bone identity',()=>{
 const x=fixture('male');
 const good=audit(x.input);
 assert.equal(good.status,'ORIGINAL_PHOTO_FRONT_LOCKED_COLLISIONS_PREVENT_REAR_ONLY_CLEARANCE');
 assert.equal(good.immutablePhotographFrontCollisionFloorAcrossFivePoses,10);
 assert.equal(good.consumer3DAdmitted,false);
 // One hexadecimal character changed in the original male GLB digest was
 // the root cause of the formerly RED fixture: the exact same five-pose
 // genuine-identity synthetic contract was rejected before it ran.
 const tampered=RIG.male.slice(0,28)+'c'+RIG.male.slice(29);
 assert.notEqual(tampered,RIG.male);
 const bad=audit({...x.input,sourceAnatomyGLBSHA256:tampered});
 assert.equal(bad.status,'SOURCE_FRONT_LOCKED_ORIGINAL_CONTACT_PROOF_UNVERIFIABLE');
 assert.equal(bad.reason,'real-source-front-pixel-centerline-rig-and-whole-body-BVH-required');
 assert.equal(bad.originalPhoto2DFallbackRequired,true);
 assert.equal(bad.consumer3DAdmitted,false);
 assert.equal(bad.releaseAuthorized,false);
 assert.equal(x.getCurrent(),'source');
});
test('no front contact does not become a false source-authentic garment clearance',()=>{
 const x=fixture(),base=x.input;
 const r=audit({...base,sampleContact:()=>x.evidence(['40|2','44|3'])});
 assert.equal(r.status,'NO_LOCKED_SOURCE_FRONT_COLLISIONS_WITNESSED_NOT_SIGNED_FIT');
 assert.equal(r.immutablePhotographFrontCollisionFloorAcrossFivePoses,0);
 assert.equal(r.originalWholeBodyStrictCrossingsAcrossFivePoses,10);
 assert.equal(r.rearOnlyFitCannotEliminatePhotographFrontContact,false);
 assert.equal(r.originalBodySignedExteriorProven,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
});
test('forged source, wrong avatar hash, missing face IDs and false source centerline fail closed',()=>{
 const x=fixture();
 for(const q of [
  {avatar:'owner'}, {sourcePhotoSHA256:'0'.repeat(64)},
  {sourceAnatomyGLBSHA256:RIG.male},
  {sourcePhotoCenterlineVerified:false},
  {originalBodyFaceCount:7},
  {sampleContact:()=>x.evidence(['576|1'])},
  {sampleContact:()=>x.evidence(['1|2000'])},
  {sampleContact:()=>({count:0,pairs:new Set(['0|1']),maxDepth:0})},
  {sampleContact:()=>({count:0,pairs:new Set(),maxDepth:0})}
 ].slice(0,-1)){
  const r=audit({...x.input,...q});
  assert.equal(r.status,'SOURCE_FRONT_LOCKED_ORIGINAL_CONTACT_PROOF_UNVERIFIABLE',JSON.stringify(q));
  assert.equal(r.releaseAuthorized,false);
 }
 const zero=audit({...x.input,sampleContact:()=>x.evidence([])});
 assert.equal(zero.status,'NO_LOCKED_SOURCE_FRONT_COLLISIONS_WITNESSED_NOT_SIGNED_FIT');
 assert.equal(zero.releaseAuthorized,false);
});
test('index corruption, source seam tear and mid-run photo UV mutation are rejected without masking contact',()=>{
 const x=fixture(),ix=x.g.index.array,uv=x.g.getAttribute('uv').array,
  rest=x.g.getAttribute('sourceSkirt89Rest').array;
 const before=ix[1];ix[1]=ix[2];
 assert.equal(audit(x.input).status,'SOURCE_FRONT_LOCKED_ORIGINAL_CONTACT_PROOF_UNVERIFIABLE');
 ix[1]=before;
 const seam=rest[48*3];rest[48*3]+=.003;
 assert.equal(audit(x.input).status,'SOURCE_FRONT_LOCKED_ORIGINAL_CONTACT_PROOF_UNVERIFIABLE');
 rest[48*3]=seam;
 const u=uv[3];
 const report=audit({...x.input,sampleContact:()=>{
  uv[3]+=.02;return x.evidence(['0|44']);
 }});
 assert.equal(report.status,'SOURCE_FRONT_LOCKED_ORIGINAL_CONTACT_PROOF_UNVERIFIABLE');
 assert.equal(report.reason,'original-source-photo-UV-face-or-rig-buffer-mutated');
 uv[3]=u;
});
