import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DRESS_DRAPE_61,refinePhotographedDress61,skirtFold61}
 from '../research/photo-dress-anatomical-drape-61/dress-drape.mjs';
import {ORIGINAL_DRESS_SHA175,inspectNativeDressDrape175}
 from '../research/native-original-dress-drape-175/admission.mjs';
const owner='P175-private-owner-A',id='P175-existing-saved-dress-A';
const valid=()=>({
 selection:{ownerId:owner,slots:{top:id,bottom:undefined}},
 sources:{ownerId:owner,sources:[{id,sha256:ORIGINAL_DRESS_SHA175}]},
 proof171:{admitted:true,mode:'verified-public-photo-skeleton-bound-research-3d',
  renderedItems:[{itemId:id,part:'dress',sha256:ORIGINAL_DRESS_SHA175}]},
 render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:'dress',
  releaseAuthorized:false,productionDeployed:false,
  fitReceipts171:{dress:{sourceSHA256:ORIGINAL_DRESS_SHA175,photoFabricPBR164:true,
   receipt:{accepted:true,sourceId:'commons-0053',
    sourceSHA256:ORIGINAL_DRESS_SHA175,
    mode:'source-photo-on-anatomical-skinned-mesh',
    originalPhotoPixelsUsed:true,common163BoneSkeletonChecked:true,
    originalSourceIdentityChecked:true,releaseAuthorized:false},
   dressDrape175:{photographedDressDrape61:true,torsoVertices61:1442,
    skirtVertices61:3000,maxTorsoMovementMeters61:.012899,
    maxSkirtMovementMeters61:.01875,frontProtectedVertices61:1180,
    originalRestPhotoCoordinatesUnchanged61:true,sourceSHA256Preserved61:true,
    sourceTextureAndMaterialPreserved61:true,skinIndicesAndWeightsPreserved61:true,
    armholeAndShoulderTopologyPreserved61:true,physicsSimulation:false,
    bodyIntersectionAudit:false,arbitraryOwnerPhotos3DApproved:false,
    humanVisualApproval:false,releaseAuthorized:false}
  }}
 }
});
test('P175 pins the exact independently verified photographic P61 dress, photo, UV and armhole contract',()=>{
 assert.equal(DRESS_DRAPE_61.sourceId,'commons-0053');
 assert.equal(ORIGINAL_DRESS_SHA175.length,64);
 assert.equal(DRESS_DRAPE_61.releaseAuthorized,false);
 assert.equal(DRESS_DRAPE_61.humanVisualApproval,false);
 assert.equal(DRESS_DRAPE_61.collisionValidated,false);
 const original=skirtFold61({theta:0,t:1});
 assert.deepEqual(original,{outward:0,drop:0});
 const skirt=skirtFold61({theta:Math.PI/2,t:.95});
 assert.ok(skirt.outward>0&&skirt.outward<=.018);
 assert.ok(skirt.drop>0&&skirt.drop<=.006);
});
test('P175 only admits actual owner-saved original source SHA on 163 bone dress with independent P171 receipt and P61 movement',()=>{
 const r=inspectNativeDressDrape175(valid());
 assert.equal(r.admitted,true);assert.equal(r.ownerId,owner);
 assert.equal(r.itemId,id);assert.equal(r.originalSourceSHA256,ORIGINAL_DRESS_SHA175);
 assert.equal(r.real163BonePhotoDressPhysicallyReshaped,true);
 assert.equal(r.bodiceMovedVertices,1442);
 assert.equal(r.skirtMovedVertices,3000);
 assert.equal(r.originalPixelsUVSkinAndMaterialUnchanged,true);
 assert.equal(r.arbitraryOwnerPhoto3DApproved,false);
 assert.equal(r.photorealismApproved,false);
 assert.equal(r.releaseAuthorized,false);assert.equal(r.familyAlpha,'HOLD');
});
test('P175 rejects another owner, edited photo with same ID, false P171 source admission or unsupported source',()=>{
 const changes=[
  d=>d.selection.ownerId='different-owner',
  d=>d.sources.ownerId='different-owner',
  d=>d.selection.slots.top='different-id',
  d=>d.sources.sources[0].id='different-id',
  d=>d.sources.sources[0].sha256='a'.repeat(64),
  d=>d.proof171.admitted=false,
  d=>d.proof171.mode='generic-mannequin-3d',
  d=>d.proof171.renderedItems[0].sha256='b'.repeat(64),
  d=>d.proof171.renderedItems[0].part='shirt'
 ];
 for(const change of changes){const d=valid();change(d);
  const v=inspectNativeDressDrape175(d);
  assert.equal(v.admitted,false,v.reason);
  assert.equal(v.mode,'verified-original-photo-2d-fallback');
  assert.equal(v.releaseAuthorized,false);
 }
});
test('P175 rejects hidden, wrong viewer mode, stale skeleton or production attestation',()=>{
 for(const change of [
  d=>d.render.privateVisible=false,
  d=>d.render.viewerReady=false,
  d=>d.render.bones=162,
  d=>d.render.viewerMode='shirt',
  d=>d.render.viewerMode='shirt-pants',
  d=>d.render.productionDeployed=true,
  d=>d.render.releaseAuthorized=true
 ]){const d=valid();change(d);assert.equal(inspectNativeDressDrape175(d).admitted,false);}
});
test('P175 requires actual P60 anatomical original JPEG + P164 fabric with the same source SHA',()=>{
 for(const change of [
  d=>d.render.fitReceipts171.dress.receipt.accepted=false,
  d=>d.render.fitReceipts171.dress.receipt.originalPhotoPixelsUsed=false,
  d=>d.render.fitReceipts171.dress.receipt.common163BoneSkeletonChecked=false,
  d=>d.render.fitReceipts171.dress.receipt.sourceSHA256='c'.repeat(64),
  d=>d.render.fitReceipts171.dress.receipt.sourceId='commons-0003',
  d=>d.render.fitReceipts171.dress.photoFabricPBR164=false,
  d=>d.render.fitReceipts171.dress.sourceSHA256='d'.repeat(64)
 ]){const d=valid();change(d);assert.equal(inspectNativeDressDrape175(d).admitted,false);}
});
test('P175 refuses forged, shader-only or inflated P61 physical bodice/skirt movement and unverifiable source fields',()=>{
 for(const change of [
  d=>d.render.fitReceipts171.dress.dressDrape175.photographedDressDrape61=false,
  d=>d.render.fitReceipts171.dress.dressDrape175.torsoVertices61=20,
  d=>d.render.fitReceipts171.dress.dressDrape175.skirtVertices61=20,
  d=>d.render.fitReceipts171.dress.dressDrape175.frontProtectedVertices61=0,
  d=>d.render.fitReceipts171.dress.dressDrape175.maxTorsoMovementMeters61=NaN,
  d=>d.render.fitReceipts171.dress.dressDrape175.maxTorsoMovementMeters61=.5,
  d=>d.render.fitReceipts171.dress.dressDrape175.maxSkirtMovementMeters61=.12,
  d=>d.render.fitReceipts171.dress.dressDrape175.sourceSHA256Preserved61=false,
  d=>d.render.fitReceipts171.dress.dressDrape175.originalRestPhotoCoordinatesUnchanged61=false,
  d=>d.render.fitReceipts171.dress.dressDrape175.sourceTextureAndMaterialPreserved61=false,
  d=>d.render.fitReceipts171.dress.dressDrape175.skinIndicesAndWeightsPreserved61=false,
  d=>d.render.fitReceipts171.dress.dressDrape175.armholeAndShoulderTopologyPreserved61=false,
  d=>d.render.fitReceipts171.dress.dressDrape175.physicsSimulation=true,
  d=>d.render.fitReceipts171.dress.dressDrape175.bodyIntersectionAudit=true,
  d=>d.render.fitReceipts171.dress.dressDrape175.arbitraryOwnerPhotos3DApproved=true,
  d=>d.render.fitReceipts171.dress.dressDrape175.humanVisualApproval=true,
  d=>d.render.fitReceipts171.dress.dressDrape175.releaseAuthorized=true
 ]){const d=valid();change(d);assert.equal(inspectNativeDressDrape175(d).admitted,false);}
});
test('P175 P61 mesh changes refuse private owner photography, and opt-out preserves original input',()=>{
 const fake={mesh:{isSkinnedMesh:true},stats:{sourceId:'owner-private-dress'}};
 assert.equal(refinePhotographedDress61(fake,{}, {enabled:false}),fake);
 assert.throws(()=>refinePhotographedDress61(fake,{}),/pinned unapproved anatomical Commons 0053/);
});
test('P175 actual native source dress is installed only after P61 pinned source SHA and P174 shirt remains distinct',()=>{
 const s=readFileSync('scripts/install-native-original-dress-drape-175.mjs','utf8');
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const needle of ['9d795a439eb3491e8f1d1f95873a8bcb7cc27bf6',
   'research/dress-mobile-01/dress-outfit-controller.mjs',
   'refinePhotographedDress61(fitted,root)',
   'if(anatomyEnabled&&skirtDrape&&dressMobile74)fitted=tailorSourceDress74(fitted,root)',
   'dressDrape175:k===','photoDress175'])assert.ok(s.includes(needle),needle);
 for(const needle of ["params?.get('photoDress175')==='research'",
   "if(render?.viewerMode==='dress')",
   "import('../native-original-dress-drape-175/admission.mjs')",
   'verifiedPhotographicDress175=null',
   'photoSourceDress175:active&&verifiedPhotographicDress175?.admitted===true',
   'await attestOriginalBytes92();'])assert.ok(bridge.includes(needle),needle);
 for(const needle of ["process.env.PHOTO_DRESS175==='1'",
   'photoSourceDress175','physicalDressBodiceVertices175>=100',
   'physicalDressSkirtVertices175>=100',
   'actualSignedOwnerPhotographedDressPhysicallyReshaped175'])assert.ok(browser.includes(needle),needle);
 assert.equal(s.includes('public/app.js'),false);
});
