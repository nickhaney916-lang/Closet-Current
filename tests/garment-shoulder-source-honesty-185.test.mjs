import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shapeReviewedBlouseShoulder185,fitReviewedUpperPhoto62,UPPER_PHOTO_SOURCES_62}
 from '../research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs';
import {verifyGarmentShoulderEvidence185}
 from '../research/garment-shoulder-source-honesty-185/evidence.mjs';

test('P185 corrects reversed 2D image top-to-world-high-Y shoulder/hem endpoints',()=>{
 const x=.3;
 const high=shapeReviewedBlouseShoulder185({x,y:1.75,shoulderToTorso:1.04,hemToTorso:.9});
 const low=shapeReviewedBlouseShoulder185({x,y:1.08,shoulderToTorso:1.04,hemToTorso:.9});
 assert.ok(high.upperBodyPhotoBand>.99);
 assert.ok(low.upperBodyPhotoBand<.01);
 assert.ok(high.x>x,'actual shoulder-width ratio belongs to high source Y');
 assert.ok(low.x<x,'hem-width ratio belongs to low source Y');
 assert.ok(high.y<1.75,'outer shoulder falls slightly downward rather than square');
 assert.equal(low.y,1.08,'hem does not receive shoulder fall');
});
test('P185 shoulder shape is left-right symmetric and never leaves the 24mm physical budget',()=>{
 for(const y of [1.1,1.26,1.45,1.6,1.75,1.9]){
  for(const x of [.01,.21,.37,.6,1.6]){
   const a=shapeReviewedBlouseShoulder185({x,y,shoulderToTorso:.88,hemToTorso:1.14});
   const b=shapeReviewedBlouseShoulder185({x:-x,y,shoulderToTorso:.88,hemToTorso:1.14});
   assert.ok(Math.abs(a.x+b.x)<1e-10);
   assert.equal(a.y,b.y);
   assert.ok(a.displacementMeters<=.02400001);
   assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));
   assert.equal(a.zChange,0,'never project fabricated rear photo detail');
  }
 }
});
test('P185 denies invalid photo silhouette coordinates without deforming image or rig',()=>{
 for(const bad of [
  {x:NaN,y:1.5,shoulderToTorso:1,hemToTorso:1},
  {x:.4,y:Infinity,shoulderToTorso:1,hemToTorso:1},
  {x:.4,y:1.5,shoulderToTorso:0,hemToTorso:1},
  {x:.4,y:1.5,shoulderToTorso:1,hemToTorso:-1}
 ])assert.throws(()=>shapeReviewedBlouseShoulder185(bad),/finite, positive/);
 const p={accepted:true,sourceSHA256:UPPER_PHOTO_SOURCES_62['commons-0016'].sourceSHA256,
  itemType:'Blouse',inferredBack:true,releaseAuthorized:false};
 assert.throws(()=>fitReviewedUpperPhoto62({stats:{sourceSHA256:'a'.repeat(64)},meshes:[]},
  {traverse(){}},p,{naturalShoulder185:true}),/exact reviewed/);
});
test('P185 real donor installer applies only original garment to correct source and discloses figure base shorts',()=>{
 const install=readFileSync('scripts/install-photographed-garment-shoulder-185.mjs','utf8');
 for(const anchor of [
  "donor===cwd||cwd.startsWith(donor+'/')",
  "fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62,{naturalShoulder185:true})",
  "'outfit3D01AnatomyCover185'",
  'BOTTOMS: NONE SELECTED',
  'not to your closet or this saved outfit',
  'shoulderHemWorldAxisCorrected185',
  "originalPhotoSHAAndCutoutUnchanged:true",
  "ownerWardrobeWritten:false"
 ])assert.ok(install.includes(anchor),anchor);
 const native=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 for(const token of ['photoShoulder185','sourceShoulderEased185',
  'photoSourceShoulder185:active','mannequinBaseCoverDisclosure185',
  'await attestOriginalBytes92();requireFresh()'])
  assert.ok(native.includes(token),token);
});
test('P185 actual-browser dual figure acceptance asserts real shoulder mesh and non-owned shorts, keeps fallback',()=>{
 const script=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const token of ['PHOTO_SHOULDER185',"'&photoShoulder185=research'",
  "blouseState.photoSourceShoulder185,true",
  "maleProof.state?.photoSourceShoulder185,true",
  "'#outfit3D01AnatomyCover185'",
  'BOTTOMS: NONE SELECTED',
  'noSelectedOrSavedBottomFabricated185:true',
  'provisionalCutoutNeedsHumanReview:true',
  "'06-male-inferred-rear-provisional-blouse'",
  'assert.deepEqual(await readBoard(page),ownerOriginal)'])
  assert.ok(script.includes(token),token);
 const inspect=readFileSync('research/garment-shoulder-source-honesty-185/evidence.mjs','utf8');
 assert.ok(inspect.includes('verifyDualGarmentScreens184(record,{root,engine})'));
 assert.equal(typeof verifyGarmentShoulderEvidence185,'function');
});
