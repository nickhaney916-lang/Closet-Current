import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FOUNDATION155,CANDIDATES155,chooseFoundation155}
 from '../research/dual-human-foundation-candidate-155/foundation-manifest.mjs';
import {inspectPinnedCandidate155}
 from '../research/dual-human-foundation-candidate-155/inspect-gltf.mjs';
test('P155 human-figure foundation is exact-pinned MIT source and never an assumed wardrobe garment',()=>{
 assert.equal(FOUNDATION155.parentMain,'c7fe572a5e6c4a18b1cef9ffbd550aee473f2f4c');
 assert.equal(FOUNDATION155.originalLicense,'MIT');
 assert.equal(FOUNDATION155.sourcePinnedCommit.length,40);
 assert.equal(FOUNDATION155.original163BoneFallback.length,40);
 assert.equal(FOUNDATION155.rocketboxAssetGarmentsBaked,true);
 assert.equal(FOUNDATION155.existingWardrobePhotographsCompatible,false);
 assert.equal(FOUNDATION155.licensedReleaseReviewPending,true);
 assert.equal(FOUNDATION155.releaseAuthorized,false);
 assert.equal(FOUNDATION155.familyAlpha,'HOLD');
 assert.deepEqual(CANDIDATES155.map(x=>x.key),['female','male']);
 assert.ok(CANDIDATES155.every(x=>x.size>4400000&&x.size<5100000&&x.bakedClothes));
 assert.ok(CANDIDATES155.every(x=>/^[0-9a-f]{40}$/.test(x.gitBlobSHA1)));
});
test('P155 never replaces saved owner-owned outfit GLB even with exact vendor SHA, explicit opt-in and rendered research proof',()=>{
 for(const c of CANDIDATES155){
  const conditions=[
   {ownerSavedOutfit:true},
   {ownerPhotoItemCount:1},
   {ownerPhotoItemCount:2000},
   {hasAnyOwnedGarment:true},
   {ownerSavedOutfit:true,ownerPhotoItemCount:50}
  ];
  for(const cond of conditions){
   const v=chooseFoundation155({figure:c.key,previewOptIn:true,
    sourceManifestAuthenticated:true,...cond});
   assert.equal(v.model,'original-163-bone-photographed-outfit');
   assert.equal(v.reason,'REAL_OWNER_CLOTHING_REQUIRES_SOURCE_BRIDGE');
   assert.equal(v.ownerWardrobeUnmodified,true);
   assert.equal(v.vendorClothingMisrepresentedAsOwned,false);
   assert.equal(v.releaseAuthorized,false);
  }
 }
});
test('P155 external baked-clothing avatar is restricted to explicit source-verified isolated gallery WITHOUT owner clothes',()=>{
 for(const c of CANDIDATES155){
  assert.equal(chooseFoundation155({figure:c.key}).model,'original-163-bone-photographed-outfit');
  assert.equal(chooseFoundation155({figure:c.key,previewOptIn:true}).model,'original-163-bone-photographed-outfit');
  const good=chooseFoundation155({figure:c.key,
   previewOptIn:true,sourceManifestAuthenticated:true});
  assert.equal(good.model,'licensed-external-research-preview');
  assert.equal(good.asset,c.file);
  assert.equal(good.advertisedOriginalOwnedClothes,false);
  assert.equal(good.photoTo3DFittingStatus,'NOT_VERIFIED');
  assert.equal(good.releaseAuthorized,false);
 }
});
test('P155 malformed owner count/gender rejects rather than falling to an unlicensed body',()=>{
 assert.throws(()=>chooseFoundation155({figure:'young girl'}),/invalid figure/);
 assert.throws(()=>chooseFoundation155({figure:'male',ownerPhotoItemCount:-1}),/invalid original/);
 assert.throws(()=>chooseFoundation155({figure:'female',ownerPhotoItemCount:1.5}),/invalid original/);
});
test('P155 GLB model scanner refuses placeholder and substituted/manipulated vendor binaries',()=>{
 const c=CANDIDATES155[0];
 assert.throws(()=>inspectPinnedCandidate155(Buffer.from('glTF'),c),/size mismatch/);
 assert.throws(()=>inspectPinnedCandidate155(Buffer.alloc(c.size),c),/Git blob SHA mismatch/);
 assert.throws(()=>inspectPinnedCandidate155(Buffer.alloc(c.size),{...c}),/pinned and licensed/);
});
test('P155 gallery must load real local GLBs with browser WebGL and contain no owner-photo collection UI',()=>{
 const src=readFileSync('research/dual-human-foundation-candidate-155/licensed-visual-lab.html','utf8');
 assert.match(src,/GLTFLoader/);
 assert.match(src,/new THREE\.WebGLRenderer/);
 assert.match(src,/sourceAsset:allowed\[figure\]/);
 assert.match(src,/Original owner photographed clothing NOT fitted|owner.photographed.clothing NOT fitted|Original owner photographed clothing NOT fitted/);
 assert.match(src,/ownerClothesApplied:false/);
 assert.match(src,/model\/gltf-binary|glb/);
 assert.doesNotMatch(src,/api\.openai\.com|supabase\.co|sentry\.io|readyplayerme\.com/);
});
