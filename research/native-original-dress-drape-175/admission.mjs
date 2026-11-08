/** P175: source-verified and owner-scoped admission of actual P61 *physical*
 * photographed-dress 163-bone geometry into the native saved Outfit viewer.
 * This never certifies arbitrary private photos or photorealistic human fit.
 */
export const ORIGINAL_DRESS_SHA175='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const refuse=reason=>Object.freeze({admitted:false,
 mode:'verified-original-photo-2d-fallback',reason,
 arbitraryOwnerPhoto3DApproved:false,photorealismApproved:false,
 releaseAuthorized:false,familyAlpha:'HOLD'});
export function inspectNativeDressDrape175({selection,sources,render,proof171}={}){
 if(!selection?.ownerId||!selection?.slots?.top||
    sources?.ownerId!==selection.ownerId||
    !Array.isArray(sources.sources)||!proof171?.admitted||
    proof171.mode!=='verified-public-photo-skeleton-bound-research-3d')
  return refuse('current-original-owner-P171-source-admission-required');
 const item=sources.sources.find(s=>s?.id===selection.slots.top);
 if(!item||item.sha256!==ORIGINAL_DRESS_SHA175||
    !proof171.renderedItems?.some(x=>x?.itemId===item.id&&
      x.part==='dress'&&x.sha256===item.sha256))
  return refuse('saved-original-dress-photo-SHA-or-item-changed');
 if(render?.privateVisible!==true||render.viewerReady!==true||
    render.bones!==163||render.viewerMode!=='dress'||
    render.productionDeployed===true||render.releaseAuthorized===true)
  return refuse('actual-owner-163-bone-dress-WebGL-not-current');
 const fitting=render.fitReceipts171?.dress,source=fitting?.receipt;
 const physical=fitting?.dressDrape175;
 if(!source||source.accepted!==true||
    source.sourceId!=='commons-0053'||
    source.sourceSHA256!==item.sha256||
    source.mode!=='source-photo-on-anatomical-skinned-mesh'||
    source.originalPhotoPixelsUsed!==true||
    source.common163BoneSkeletonChecked!==true||
    source.originalSourceIdentityChecked!==true||
    source.releaseAuthorized!==false||
    fitting.sourceSHA256!==item.sha256||
    fitting.photoFabricPBR164!==true)
  return refuse('verified-original-P60-and-P164-skinned-dress-required');
 if(!physical||physical.photographedDressDrape61!==true||
    physical.sourceSHA256Preserved61!==true||
    physical.originalRestPhotoCoordinatesUnchanged61!==true||
    physical.sourceTextureAndMaterialPreserved61!==true||
    physical.skinIndicesAndWeightsPreserved61!==true||
    physical.armholeAndShoulderTopologyPreserved61!==true||
    physical.physicsSimulation!==false||
    physical.bodyIntersectionAudit!==false||
    physical.arbitraryOwnerPhotos3DApproved!==false||
    physical.humanVisualApproval!==false||
    physical.releaseAuthorized!==false||
    !Number.isSafeInteger(physical.torsoVertices61)||physical.torsoVertices61<100||
    !Number.isSafeInteger(physical.skirtVertices61)||physical.skirtVertices61<100||
    !Number.isSafeInteger(physical.frontProtectedVertices61)||physical.frontProtectedVertices61<100||
    !Number.isFinite(physical.maxTorsoMovementMeters61)||
    physical.maxTorsoMovementMeters61<.001||
    physical.maxTorsoMovementMeters61>.0129001||
    !Number.isFinite(physical.maxSkirtMovementMeters61)||
    physical.maxSkirtMovementMeters61<.001||
    physical.maxSkirtMovementMeters61>.01905)
  return refuse('actual-source-dress-bodice-skirt-geometry-and-provenance-not-independently-verified');
 return Object.freeze({admitted:true,mode:'source-verified-physical-dress-bodice-skirt-research-3d',
  ownerId:selection.ownerId,itemId:item.id,originalSourceSHA256:item.sha256,
  real163BonePhotoDressPhysicallyReshaped:true,
  bodiceMovedVertices:physical.torsoVertices61,skirtMovedVertices:physical.skirtVertices61,
  maxBodiceMeters:physical.maxTorsoMovementMeters61,
  maxSkirtMeters:physical.maxSkirtMovementMeters61,
  frontPhotoProtectedVertices:physical.frontProtectedVertices61,
  originalPixelsUVSkinAndMaterialUnchanged:true,
  rearProvenance:'inferred-unphotographed',
  arbitraryOwnerPhoto3DApproved:false,photorealismApproved:false,
  physicalPhoneTested:false,collisionCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'});
}