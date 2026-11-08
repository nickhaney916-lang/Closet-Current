import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectNativePhotoTorso173,requireNativePhotoTorso173,SHIRT_SOURCE_173}
 from '../research/native-photo-torso-173/admission.mjs';
const owner='p173-owner-A',item='p173-owned-shirt';
const valid=()=>({
 selection:{ownerId:owner,slots:{top:item}},
 sources:{ownerId:owner,sources:[{id:item,sha256:SHIRT_SOURCE_173.sha256}]},
 proof171:{admitted:true,mode:'verified-public-photo-skeleton-bound-research-3d',
  renderedItems:[{itemId:item,part:'shirt',sha256:SHIRT_SOURCE_173.sha256}]},
 render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:'shirt',
  releaseAuthorized:false,productionDeployed:false,
  fitReceipts171:{shirt:{
   sourceSHA256:SHIRT_SOURCE_173.sha256,photoFabricPBR164:true,
   receipt:{accepted:true,mode:'source-photo-on-anatomical-skinned-mesh',
    sourceId:'commons-0003',sourceSHA256:SHIRT_SOURCE_173.sha256,
    common163BoneSkeletonChecked:true,originalPhotoPixelsUsed:true},
   torsoContour173:{
    sourcePhotoTorsoContour172:true,
    originalFrontPhotoSourceSHA172:SHIRT_SOURCE_173.sha256,
    sourcePhotoPixelsAndRigUnchanged172:true,
    anatomical163BoneSkeletonPreserved172:true,
    originalPhotographedBackVerified:false,
    humanVisualApproved:false,releaseAuthorized:false,
    physicalTorsoContourMovedVertices172:152,
    physicalTorsoContourFrontVertices172:112,
    physicalTorsoContourProtectedBackVertices172:240,
    physicalTorsoContourMaxMeters172:.01325
   }
  }}
 }
});
test('P173 admits only an actual 163-bone source-original physically altered shirt with prior valid P171 owner proof',()=>{
 const p=inspectNativePhotoTorso173(valid());
 assert.equal(p.admitted,true);
 assert.equal(p.selectedItemId,item);
 assert.equal(p.sourceSHA256,SHIRT_SOURCE_173.sha256);
 assert.equal(p.physicalTorsoMovedVertices,152);
 assert.equal(p.actualSkinnedMeshChanged,true);
 assert.equal(p.arbitraryOwnerPhoto3DApproved,false);
 assert.equal(p.photorealismApproved,false);
 assert.equal(p.releaseAuthorized,false);
 assert.equal(p.familyAlpha,'HOLD');
});
test('P173 never approves private arbitrary photo, wrong owner, substituted saved ID, mismatched P171 source evidence',()=>{
 for(const change of [
  d=>d.sources.ownerId='owner-B',
  d=>d.sources.sources[0].id='other-item',
  d=>d.selection.ownerId='owner-B',
  d=>d.selection.slots.top='different-item',
  d=>d.sources.sources[0].sha256='a'.repeat(64),
  d=>d.proof171.renderedItems[0].sha256='b'.repeat(64),
  d=>d.proof171.admitted=false,
  d=>d.proof171.mode='image-shader-only'
 ]){
  const x=valid();change(x);
  const r=inspectNativePhotoTorso173(x);assert.equal(r.admitted,false,r.reason);
  assert.equal(r.mode,'verified-original-photo-2d-fallback');
  assert.equal(r.releaseAuthorized,false);
 }
});
test('P173 rejects fake geometric statistics, unmeasured deformation, wrong photo source, or false rear and realism approvals',()=>{
 const changes=[
  d=>{d.render.fitReceipts171.shirt.torsoContour173=null;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.sourcePhotoTorsoContour172=false;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.physicalTorsoContourMovedVertices172=0;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.physicalTorsoContourFrontVertices172=0;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.physicalTorsoContourProtectedBackVertices172=1;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.physicalTorsoContourMaxMeters172=.2;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.physicalTorsoContourMaxMeters172=NaN;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.originalFrontPhotoSourceSHA172='a'.repeat(64);},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.originalPhotographedBackVerified=true;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.humanVisualApproved=true;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.releaseAuthorized=true;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.sourcePhotoPixelsAndRigUnchanged172=false;},
  d=>{d.render.fitReceipts171.shirt.torsoContour173.anatomical163BoneSkeletonPreserved172=false;}
 ];
 for(const change of changes){const x=valid();change(x);
  assert.equal(inspectNativePhotoTorso173(x).admitted,false);
 }
});
test('P173 cross-stream actual P60 skinned photographic pixels and P164 PBR are mandatory',()=>{
 for(const change of [
  d=>d.render.fitReceipts171.shirt.receipt.accepted=false,
  d=>d.render.fitReceipts171.shirt.receipt.common163BoneSkeletonChecked=false,
  d=>d.render.fitReceipts171.shirt.receipt.originalPhotoPixelsUsed=false,
  d=>d.render.fitReceipts171.shirt.receipt.sourceId='commons-0053',
  d=>d.render.fitReceipts171.shirt.receipt.sourceSHA256='a'.repeat(64),
  d=>d.render.fitReceipts171.shirt.photoFabricPBR164=false,
  d=>d.render.fitReceipts171.shirt.sourceSHA256='a'.repeat(64)
 ]){const x=valid();change(x);assert.equal(inspectNativePhotoTorso173(x).admitted,false);}
});
test('P173 rejects hidden, unreleased, non-163, no-WebGL, wrong scene, or fabricated dress geometry',()=>{
 for(const change of [
  d=>d.render.privateVisible=false,
  d=>d.render.viewerReady=false,
  d=>d.render.bones=80,
  d=>d.render.productionDeployed=true,
  d=>d.render.releaseAuthorized=true,
  d=>d.render.viewerMode='dress',
  d=>d.render.viewerMode='none'
 ]){const x=valid();change(x);assert.equal(inspectNativePhotoTorso173(x).admitted,false);}
 const d=valid();d.render.viewerMode='dress';
 assert.equal(inspectNativePhotoTorso173(d).reason,'only-source-verified-shirt-is-contoured');
 assert.throws(()=>requireNativePhotoTorso173(d),/P173 measured photographed 3D shirt unavailable/);
});
test('P173 pants may coexist only with the existing P171 exact owner-bound photo outfit admission',()=>{
 const d=valid();d.render.viewerMode='shirt-pants';
 assert.equal(inspectNativePhotoTorso173(d).admitted,true);
 d.proof171.admitted=false;
 assert.equal(inspectNativePhotoTorso173(d).admitted,false);
});
test('P173 actual research installer imports immutable P172 source and inserts before real dress-mobile P60 fit, no production edits',()=>{
 const script=readFileSync('scripts/install-native-photo-torso-173.mjs','utf8');
 assert.ok(script.includes("research/dress-mobile-01/dress-outfit-controller.mjs"));
 assert.ok(script.includes("research/outfit-3d-01/research-panel.mjs"));
 assert.ok(script.includes("cb83ce59cd88ca207e2e08d943374460effd1b345")===false);
 assert.ok(script.includes("cb83ce59cd88ca207b1d6d82b7682635589f8c4f"));
 assert.ok(script.includes("if(built.shirt)built.shirt=contourSourceVerifiedShirt172(built.shirt,root)"));
 assert.ok(script.includes("P171 transplant the VERIFIED P60/P164"));
 assert.ok(script.includes("sourcePhotoTorsoContour172"));
 assert.ok(!script.includes("public/app.js"));
 assert.ok(!script.includes("supabase/cloud-backup.sql"));
});
test('P173 owner-private normal Outfit Builder keeps existing P171 immutable P172 geometry provenance hidden behind explicit research gate',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const testBrowser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const needle of ["params?.get('photoTorso173')==='research'",
  "params?.get('photoFit171')!=='research'",
  "import('../native-photo-torso-173/admission.mjs')",
  "await attestOriginalBytes92();",
  "verifiedPhotographicTorso173=null",
  "photoSourceTorso173:active&&verifiedPhotographicTorso173?.admitted===true",
  "physicalShirtVertices173:",
  "physicalShirtMaxMoveMeters173:"])
  assert.ok(bridge.includes(needle),'P173 missing original source owner-bound native gate '+needle);
 for(const needle of ["Source-true original photographed shirt",
  "photoTorso173=research","photoSourceTorso173","physicalShirtVertices173>30",
  "06-owner-physical-shirt-front","07-owner-physical-shirt-side",
  "08-owner-shirt-neutral-inferred-rear",
  "assert.deepEqual(await readBoard(page),ownerOriginal)"])
  assert.ok(testBrowser.includes(needle),'P173 authentic mobile browser pathway missing '+needle);
});
