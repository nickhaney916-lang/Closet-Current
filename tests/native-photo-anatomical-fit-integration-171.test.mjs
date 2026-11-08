import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectNativePhotoFit171,requireNativePhotoFit171,PHOTO_SOURCES_171}
 from '../research/native-photo-anatomical-fit-integration-171/admission.mjs';

const owner='owner-p171-a';
const ids={dress:'owned-dress-id',shirt:'owned-shirt-id',pants:'owned-denim-id'};
const dresses=PHOTO_SOURCES_171['commons-0053'];
const shirts=PHOTO_SOURCES_171['commons-0003'];
const denims=PHOTO_SOURCES_171['commons-public-domain-jeans-2005'];
const source=(id,garment)=>({sourceId:id,sourceSHA256:PHOTO_SOURCES_171[id].sha,
 accepted:true,mode:'source-photo-on-anatomical-skinned-mesh',
 meshCount:2,vertices:1200,triangles:650,originalPhotoPixelsUsed:true,
 originalSourceIdentityChecked:true,common163BoneSkeletonChecked:true,
 maxSkinWeightSumError:0.001,rearPhotoProvenance:'INFERRED_UNVERIFIED_NEUTRAL',
 arbitraryOwnerPhoto3DApproved:false,humanPhotorealismApproved:false,releaseAuthorized:false});
const wrapped=(id,garment)=>({receipt:source(id,garment),photoFabricPBR164:true,
 sourceSHA256:PHOTO_SOURCES_171[id].sha});
const setup=(mode='dress')=>{
 const dress=mode==='dress';
 const slots=dress?{top:ids.dress,layer2:'owner-jacket-id'}:
  mode==='shirt'?{top:ids.shirt}:{top:ids.shirt,bottom:ids.pants};
 const src=dress?[{id:ids.dress,sha256:dresses.sha},{id:'owner-jacket-id',sha256:'a'.repeat(64)}]:
  mode==='shirt'?[{id:ids.shirt,sha256:shirts.sha}]:
  [{id:ids.shirt,sha256:shirts.sha},{id:ids.pants,sha256:denims.sha}];
 return {selection:{ownerId:owner,slots},sources:{ownerId:owner,sources:src},
  render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:mode,
   productionDeployed:false,releaseAuthorized:false,
   fitReceipts171:{dress:wrapped('commons-0053','dress'),
    shirt:wrapped('commons-0003','shirt'),
    pants:wrapped('commons-public-domain-jeans-2005','pants')}}
 };
};
test('P171 authentic public licensed dress with independently checked 163-bone P60 receipt admitted only as research proof',()=>{
 const d=inspectNativePhotoFit171(setup());
 assert.equal(d.admitted,true);assert.equal(d.mode,'verified-public-photo-skeleton-bound-research-3d');
 assert.equal(d.renderedItems.length,1);assert.equal(d.renderedItems[0].sha256,dresses.sha);
 assert.equal(d.realism3DVerified,false);
 assert.equal(d.arbitraryOwnerPhoto3DApproved,false);
 assert.equal(d.releaseAuthorized,false);assert.equal(d.familyAlpha,'HOLD');
});
test('P171 source-reviewed photographed T-shirt & denim require separate exact source SHA and 163-bone fit receipts',()=>{
 for(const mode of ['shirt','shirt-pants']){
  const p=inspectNativePhotoFit171(setup(mode));
  assert.equal(p.admitted,true);
  assert.equal(p.renderedItems.length,mode==='shirt'?1:2);
 }
 const broken=setup('shirt-pants');
 broken.render.fitReceipts171.pants.sourceSHA256='f'.repeat(64);
 assert.equal(inspectNativePhotoFit171(broken).admitted,false);
 assert.match(inspectNativePhotoFit171(broken).reason,/denim/);
});
test('P171 never treats a generic unverified personal JPEG as the original photograph fitted in 3D',()=>{
 const x=setup('dress');x.sources.sources[0].sha256='b'.repeat(64);
 const v=inspectNativePhotoFit171(x);
 assert.equal(v.admitted,false);
 assert.equal(v.mode,'verified-original-photo-2d-fallback');
 assert.equal(v.arbitraryOwnerPhoto3DApproved,false);
 assert.throws(()=>requireNativePhotoFit171(x),/source-saved-photo-is-not-fitted/);
});
test('P171 metadata spoofing without real valid P60 source-projected skinned mesh or 163-bone rig is rejected',()=>{
 for(const mutation of [
  x=>{x.render.bones=162;},
  x=>{x.render.fitReceipts171.dress.receipt.common163BoneSkeletonChecked=false;},
  x=>{x.render.fitReceipts171.dress.receipt.originalPhotoPixelsUsed=false;},
  x=>{x.render.fitReceipts171.dress.receipt.rearPhotoProvenance='PHOTOGRAPHED_BACK';},
  x=>{x.render.fitReceipts171.dress.receipt.humanPhotorealismApproved=true;},
  x=>{x.render.fitReceipts171.dress.photoFabricPBR164=false;},
  x=>{x.render.fitReceipts171.dress.receipt.releaseAuthorized=true;},
  x=>{x.render.fitReceipts171.dress.receipt.maxSkinWeightSumError=.2;},
  x=>{x.render.fitReceipts171.dress.receipt.sourceId='commons-0003';},
  x=>{x.render.fitReceipts171.dress=null;},
  x=>{x.render.privateVisible=false;},
  x=>{x.render.viewerReady=false;},
  x=>{x.render.productionDeployed=true;}
 ]){
  const x=setup();
  x.render.fitReceipts171.dress={...x.render.fitReceipts171.dress,
   receipt:{...x.render.fitReceipts171.dress.receipt}};
  mutation(x);assert.equal(inspectNativePhotoFit171(x).admitted,false);
 }
});
test('P171 owner source IDs, same owner and private source records must match active saved outfit, not screenshot hash alone',()=>{
 for(const mutation of [
  x=>{x.sources.ownerId='foreign-owner';},
  x=>{x.sources.sources[0].id='foreign-garment';},
  x=>{x.selection.slots.top='old-other-garment';},
  x=>{x.selection.ownerId='owner-other';},
  x=>{x.sources.sources=[];}
 ]){
  const x=setup();mutation(x);
  assert.equal(inspectNativePhotoFit171(x).admitted,false);
 }
});
test('P171 actual pinned donor installer exposes ONLY read-only P60 mesh metadata; no photo, vertex or wardrobe mutations',()=>{
 const s=readFileSync('scripts/install-native-photo-anatomical-fit-171.mjs','utf8');
 assert.match(s,/photoAnatomicalFitReceipt60/);
 assert.match(s,/photoFabricPBR164/);
 assert.match(s,/scene\?\.getState\(\)\?\.outfit/);
 assert.match(s,/dress-mobile-01\/dress-outfit-controller\.mjs/);
 assert.match(s,/inspectPhotographedFit60\(built\[slot\],root\)/);
 assert.match(s,/applyPhotoFabricPBR164\(built\[slot\]\)/);
 assert.match(s,/attachPhotographedFitReceipt60\(pbr\.garment,root\)/);
 assert.doesNotMatch(s,/geometry\.setAttribute|texture\.image=|IndexedDB|localStorage\.setItem/);
});
test('P171 real native 3D bridge opt-in requires the real source SHA proof before reporting success',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 for(const needle of [
  "params?.get('photoFit171')==='research'",
  "import('../native-photo-anatomical-fit-integration-171/admission.mjs')",
  "fitModule.inspectNativePhotoFit171(",
  "await attestOriginalBytes92();",
  "verifiedPhotographicFit171=proof171;",
  "photoSourceFit171:active&&verifiedPhotographicFit171?.admitted===true",
  "verifiedPhotographicFit171=null"
 ])assert.ok(s.includes(needle),'missing source-bound native 3D integration '+needle);
});
