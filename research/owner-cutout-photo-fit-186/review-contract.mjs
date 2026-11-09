/**
 * MAIN P186: real owner-private wardrobe review and cutout SHA admission.
 * A source-verified 163-bone mesh is NOT evidence that its cropped JPEG
 * was owner reviewed. This contract requires a separate read-only P119
 * persisted review + original and cutout byte-SHA proof from BOARD04.
 *
 * Explicit research-only native preview; no production release or writes.
 */
const LICENSED_BLOUSE_SHA='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const SHA=/^[a-f0-9]{64}$/;
const denied=reason=>Object.freeze({admitted:false,
 mode:'original-photo-2d-fallback',reason,cutoutVerified:false,
 independentlyReviewedByHuman:false,releaseAuthorized:false,familyAlpha:'HOLD'});
export function inspectOwnerReviewedCutout186({
 selection,sources,render,proof62,verifiedCutout
}={}){
 if(!selection?.ownerId||sources?.ownerId!==selection.ownerId||
  !Array.isArray(sources?.sources)||!proof62?.admitted||
  proof62.ownerId!==selection.ownerId||
  !selection.slots?.top||proof62.itemId!==selection.slots.top)
  return denied('current-owner-source-and-P62-admission-required');
 const selected=sources.sources.find(r=>r?.id===selection.slots.top);
 if(!selected||selected.sha256!==LICENSED_BLOUSE_SHA||
  selected.category!=='Tops'||selected.itemType!=='Blouse')
  return denied('review-must-match-saved-source-type');
 if(render?.privateVisible!==true||render?.viewerReady!==true||
  render.bones!==163||!['shirt','shirt-pants'].includes(render.viewerMode)||
  render.productionDeployed===true||render.releaseAuthorized===true)
  return denied('current-private-163-bone-view-not-verified');
 const mesh=render.fitReceipts171?.shirt?.silhouette62;
 if(mesh?.sourcePhotoSilhouetteFit62!==true||
  mesh?.sourceShoulderEased185!==true||
  mesh?.shoulderHemWorldAxisCorrected185!==true||
  mesh?.independentShoulderCapSeamsRetained185!==true||
  mesh?.independentlyJoinedShoulderCapMeshes185<2||
  mesh?.silhouetteSourceSHA256!==LICENSED_BLOUSE_SHA||
  !SHA.test(mesh.cutoutSHA256||'')||
  proof62.sourceSHA256!==LICENSED_BLOUSE_SHA||
  proof62.cutoutSHA256!==mesh.cutoutSHA256)
  return denied('actual-physical-source-and-cutout-mesh-proof-mismatch');
 const r=verifiedCutout;
 if(r?.ownerId!==selection.ownerId||r?.garmentId!==selection.slots.top||
  r?.sourceId!=='commons-0016'||
  r?.originalSourceSHA256!==LICENSED_BLOUSE_SHA||
  r?.cutoutSHA256!==mesh.cutoutSHA256||
  r?.ownerReviewed!==true||r?.humanReviewedSource!==true||
  r?.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'||
  r?.originalJPEGBytesSHA256Verified!==true||
  r?.cutoutJPEGBytesSHA256Verified!==true||
  r?.reviewedInstance!==true||r?.verifiedCutoutSeparatedFromOriginal!==true)
  return denied('owner-reviewed-cutout-and-original-JPEG-byte-proof-required');
 return Object.freeze({admitted:true,mode:'owner-reviewed-exact-cutout-research-only',
  originalAndCutoutJPEGBytesIndependentlySHA256Verified:true,
  sourceAndSavedGarmentBound:true,ownerReviewMetadataMatched:true,
  mesh163BoneSourceEased185:true,inferredRearNotPhotographed:true,
  independentlyReviewedByHuman:false,ownerApprovalProves3DRealism:false,
  arbitraryPrivatePhotosSupported:false,collisionCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'});
}
