import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCE_SHA_174,easeOffset174,easeSourceShoulderSleeve174}
 from '../research/source-shoulder-seam-174/seam-ease.mjs';
import {inspectNativeShoulder174}
 from '../research/source-shoulder-seam-174/admission.mjs';
const owner='local-owner-A',id='local-original-shirt-A';
const good=()=>({selection:{ownerId:owner,slots:{top:id}},
 sources:{ownerId:owner,sources:[{id,sha256:SOURCE_SHA_174}]},
 proof173:{admitted:true,mode:'verified-public-photo-physical-torso-research-3d',
  ownerId:owner,selectedItemId:id,sourceSHA256:SOURCE_SHA_174},
 render:{viewerReady:true,privateVisible:true,bones:163,viewerMode:'shirt',
  productionDeployed:false,releaseAuthorized:false,fitReceipts171:{shirt:{
   photoFabricPBR164:true,sourceSHA256:SOURCE_SHA_174,
   receipt:{accepted:true,sourceSHA256:SOURCE_SHA_174,
    common163BoneSkeletonChecked:true,originalPhotoPixelsUsed:true},
   armhole174:{
    sourcePhotoShoulderSleeve174:true,shoulder174SourceSHA:SOURCE_SHA_174,
    shoulder174MovedVertices:322,shoulder174MaxMeters:.0095,
    shoulder174ProtectedCenter:580,shoulder174SharedSeams:18,
    shoulder174GapBefore:0,shoulder174GapAfter:0,
    shoulder174Sides:{L:{moved:160,caps:56,shells:104,shared:9},
      R:{moved:162,caps:54,shells:108,shared:9}},
    shoulder174OriginalPixelsUVSkinAnd163BonesPreserved:true,
    shoulder174RearPhotoVerified:false,shoulder174HumanApproved:false,
    shoulder174AllPoseCollisionCertified:false,releaseAuthorized:false
   }
  }}
 }});
test('P174 original anatomical bilateral easing physically changes upper arm not torso or cuff',()=>{
 const a=easeOffset174({x:.44,y:1.42,shoulderY:1.46,sign:1});
 const b=easeOffset174({x:-.44,y:1.42,shoulderY:1.46,sign:-1});
 assert.ok(a.move>.004&&a.move<.00961);
 assert.equal(a.dx,-b.dx);assert.equal(a.dy,b.dy);assert.equal(a.move,b.move);
 for(const x of [.0,.20,.25,.275,.75])assert.equal(
  easeOffset174({x,y:1.42,shoulderY:1.46,sign:1}).move,0);
 for(const y of [.8,1,1.75,2])assert.equal(
  easeOffset174({x:.44,y,shoulderY:1.46,sign:1}).move,0);
});
test('P174 refuses forged original joint coords and duplicate/unknown source',()=>{
 for(const q of [
 {x:NaN,y:1.3,shoulderY:1.4,sign:1},
 {x:.4,y:Infinity,shoulderY:1.4,sign:1},
 {x:.4,y:1.3,shoulderY:1.4,sign:0},
 {x:.4,y:1.3,shoulderY:1.4,sign:-2}
 ])assert.throws(()=>easeOffset174(q),/P174/);
 assert.equal(easeSourceShoulderSleeve174(undefined,{}, {enabled:false}),undefined);
 assert.throws(()=>easeSourceShoulderSleeve174({},{}),/P174 requires/);
 assert.throws(()=>easeSourceShoulderSleeve174(
  {stats:{sourcePhotoShoulderSleeve174:true}},{}),/duplicate/);
});
test('P174 only admits real original owner-saved physically sewn photographed shirt on P173',()=>{
 const a=inspectNativeShoulder174(good());
 assert.equal(a.admitted,true);assert.equal(a.ownerId,owner);
 assert.equal(a.sourceSHA256,SOURCE_SHA_174);
 assert.equal(a.actual163BoneSkinnedSeamsMoved,true);
 assert.equal(a.movedVertices,322);
 assert.equal(a.arbitraryOwnerPhoto3DApproved,false);
 assert.equal(a.humanPhotorealismApproved,false);
 assert.equal(a.physicalPhoneVerified,false);
 assert.equal(a.releaseAuthorized,false);
});
test('P174 protected against owner switching, same-ID altered photograph, invented private photo, forged P173 source proof',()=>{
 const scenarios=[
 d=>d.selection.ownerId='different-owner',
 d=>d.sources.ownerId='different-owner',
 d=>d.selection.slots.top='different-id',
 d=>d.sources.sources[0].id='different-id',
 d=>d.sources.sources[0].sha256='b'.repeat(64),
 d=>d.proof173.admitted=false,
 d=>d.proof173.sourceSHA256='b'.repeat(64),
 d=>d.proof173.ownerId='different-owner',
 d=>d.proof173.mode='fake-geometry'
 ];
 for(const scenario of scenarios){const d=good();scenario(d);
  const verdict=inspectNativeShoulder174(d);
  assert.equal(verdict.admitted,false,verdict.reason);
  assert.equal(verdict.mode,'verified-original-photo-2d-fallback');
 }
});
test('P174 refuses absent actual WebGL, wrong rig, dress, cloud deployment, shader-only garment',()=>{
 const scenarios=[
 d=>d.render.viewerReady=false,d=>d.render.privateVisible=false,
 d=>d.render.bones=162,d=>d.render.viewerMode='dress',
 d=>d.render.productionDeployed=true,d=>d.render.releaseAuthorized=true,
 d=>d.render.fitReceipts171.shirt.photoFabricPBR164=false,
 d=>d.render.fitReceipts171.shirt.receipt.originalPhotoPixelsUsed=false,
 d=>d.render.fitReceipts171.shirt.receipt.common163BoneSkeletonChecked=false
 ];
 for(const scenario of scenarios){const d=good();scenario(d);
  assert.equal(inspectNativeShoulder174(d).admitted,false);
 }
});
test('P174 original source UV skin+bilateral physical moved seam evidence must independently pass',()=>{
 const scenarios=[
 d=>d.render.fitReceipts171.shirt.armhole174.sourcePhotoShoulderSleeve174=false,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174SourceSHA='a'.repeat(64),
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174MovedVertices=0,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174MaxMeters=.055,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174GapAfter=.01,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174SharedSeams=0,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174Sides.L.caps=0,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174Sides.R.shells=0,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174OriginalPixelsUVSkinAnd163BonesPreserved=false,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174RearPhotoVerified=true,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174HumanApproved=true,
 d=>d.render.fitReceipts171.shirt.armhole174.shoulder174AllPoseCollisionCertified=true,
 d=>d.render.fitReceipts171.shirt.armhole174.releaseAuthorized=true
 ];
 for(const scenario of scenarios){const d=good();scenario(d);
  assert.equal(inspectNativeShoulder174(d).admitted,false,
   'fake shoulder seam or source attributes must never be approved');
 }
});
test('P174 actual detached donor receives bounded geometry BEFORE P60 source fit and after P172 physical torso',()=>{
 const installer=readFileSync('scripts/install-source-shoulder-seam-174.mjs','utf8');
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const needle of ['dress-mobile-01/dress-outfit-controller.mjs',
  'contourSourceVerifiedShirt172(built.shirt,root)',
  'easeSourceShoulderSleeve174(built.shirt,root)',
  "new URLSearchParams(globalThis.location?.search||'').get('photoSleeve174')",
  'sourcePhotoShoulderSleeve174','shoulder174Sides'])
  assert.ok(installer.includes(needle),needle);
 for(const needle of ["params?.get('photoSleeve174')==='research'",
  "import('../source-shoulder-seam-174/admission.mjs')",
  'verifiedPhotographicShoulder174=null',
  'photoSourceShoulder174:active&&verifiedPhotographicShoulder174?.admitted===true',
  'await attestOriginalBytes92();'])
  assert.ok(bridge.includes(needle),needle);
 for(const needle of ["const photoSleeve174=process.env.PHOTO_SLEEVE174==='1';",
  "photoSleeve174?'&photoSleeve174=research':''",
  'shoulderMovedVertices174>=40','actualSignedOwnerBilateralShoulderSeamPhysicallyEased174',
  "06-owner-physical-shirt-front"])
  assert.ok(browser.includes(needle),needle);
 assert.ok(!installer.includes('public/app.js'));
});
