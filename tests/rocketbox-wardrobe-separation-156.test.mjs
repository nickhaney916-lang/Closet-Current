import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessRockboxSeparation156} from
 '../research/rocketbox-wardrobe-separation-156/analyze-source-anatomy.mjs';
import {CANDIDATES155,FOUNDATION155,chooseFoundation155}
 from '../research/dual-human-foundation-candidate-155/foundation-manifest.mjs';
const report=(extra={})=>({
 originalRigBones:80,figure:'female',sourceMeshCount:1,
 sourceMeshAndPrimitiveCounts:[1,3],
 headNamedBones:['Head'],
 originalGenuineBodySkinSufficientlyUnclothed:false,
 photoBasedGarmentFitAfterRemovalProven:false,
 sourceRig80ToOriginal163MappingComplete:false,
 syntacticDedicatedGarmentPrimitivePresent:false,
 primitives:[{materialName:'Body',meshName:'Mesh0',vertices:1000},
  {materialName:'Hair',meshName:'Mesh0',vertices:300},
  {materialName:'Fabric',meshName:'Mesh0',vertices:1200}],...extra
});
test('P156 refuses source-clothing mesh removal without actual anatomical body/garment/rig proof',()=>{
 const v=assessRockboxSeparation156(report());
 assert.equal(v.canAutoStripClothes,false);
 assert.equal(v.canReplaceOriginalPhotographedOutfit,false);
 assert.equal(v.originalStandaloneNudeBodyExists,false);
 assert.equal(v.originalFigure163BoneModelPreserved,true);
 assert.equal(v.releaseAuthorized,false);
 assert.equal(v.familyAlpha,'HOLD');
});
test('P156 never approves a baked dressed avatar merely on its material or separate mesh names',()=>{
 for(const p of [
  report({syntacticDedicatedGarmentPrimitivePresent:true}),
  report({sourceMeshCount:2,syntacticDedicatedGarmentPrimitivePresent:true}),
  report({primitives:[{materialName:'JACKET'}, {materialName:'Body'}],
   syntacticDedicatedGarmentPrimitivePresent:true}),
  report({syntacticDedicatedGarmentPrimitivePresent:true,
   originalGenuineBodySkinSufficientlyUnclothed:true}),
  report({syntacticDedicatedGarmentPrimitivePresent:true,
   photoBasedGarmentFitAfterRemovalProven:true}),
  report({syntacticDedicatedGarmentPrimitivePresent:true,
   sourceRig80ToOriginal163MappingComplete:true})
 ]){
  assert.equal(assessRockboxSeparation156(p).canReplaceOriginalPhotographedOutfit,false);
 }
});
test('P156 source report rejects fabricated or unverified 163-bone original-bridge data',()=>{
 assert.throws(()=>assessRockboxSeparation156(null),/genuine pinned/);
 assert.throws(()=>assessRockboxSeparation156({originalRigBones:163,primitives:[]}),/genuine pinned/);
 assert.throws(()=>assessRockboxSeparation156({originalRigBones:80,primitives:null}),/genuine pinned/);
});
test('P156 owner original photograph remains the only source for a saved outfit across both genders',()=>{
 for(const c of CANDIDATES155){
  for(const count of [1,9,1000]){
   const v=chooseFoundation155({figure:c.key,ownerSavedOutfit:true,
    ownerPhotoItemCount:count,previewOptIn:true,
    sourceManifestAuthenticated:true});
   assert.equal(v.model,'original-163-bone-photographed-outfit');
   assert.equal(v.vendorClothingMisrepresentedAsOwned,false);
  }
 }
 assert.equal(FOUNDATION155.originalLicense,'MIT');
});
test('P156 original skinned-source parsing explicitly records material mesh and skeleton provenance',()=>{
 const s=readFileSync('research/rocketbox-wardrobe-separation-156/analyze-source-anatomy.mjs','utf8');
 assert.match(s,/inspectPinnedCandidate155\(bytes,candidate\)/);
 assert.match(s,/gitBlobSHA1/);
 assert.match(s,/componentMap/);
 assert.match(s,/prim\.material/);
 assert.match(s,/sourceRig80ToOriginal163MappingComplete:false/);
 assert.match(s,/photoBasedGarmentFitAfterRemovalProven:false/);
 assert.doesNotMatch(s,/https?:\/\//);
});
