import {attestOriginalJPEGBytes92} from '../native-original-photo-integrity-92/original-jpeg-byte-attestation.mjs';
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
 // P188: the owner's actual reviewed cutout is a JPEG, whereas P62's
 // source-fitted silhouette is a separate PNG. Requiring identical SHA
 // values accidentally made all genuinely reviewed private JPEGs impossible.
 // A DIFFERENT JPEG can be admitted ONLY if its own reverified texels
 // were actually composited into the anatomical skinned front mesh.
 const independentOwnerTexture188=render?.privateCutoutTexelsOnMesh188===true&&
  render?.ownerCutoutMaskFromOwnerPhoto188===false&&
  render?.reviewedPrivateCutoutJPEG_SHA188===r?.cutoutSHA256&&
  render?.reviewedSourceMaskSHA188===mesh?.cutoutSHA256&&
  SHA.test(r?.cutoutSHA256||'')&&r.cutoutSHA256!==mesh.cutoutSHA256&&
  render?.privateCutoutHumanApprovalIndependentlyVerified188===false;
 if(r?.ownerId!==selection.ownerId||r?.garmentId!==selection.slots.top||
  r?.sourceId!=='commons-0016'||
  r?.originalSourceSHA256!==LICENSED_BLOUSE_SHA||
  (render?.privateCutoutTexelsOnMesh188===true||render?.reviewedPrivateCutoutJPEG_SHA188!=null)&&!independentOwnerTexture188||
  r?.cutoutSHA256!==mesh.cutoutSHA256&&!independentOwnerTexture188||
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
  actualPrivateJPEGTexelsOnSkinnedMesh188:independentOwnerTexture188,
  ownerPrivateJPEGCutoutVsPinnedPNGMaskSeparated188:independentOwnerTexture188,
  ownerSpecificAlphaSegmentationVerified188:false,
  pinSourcePNGAlphaNotUserOwned188:independentOwnerTexture188,
  independentlyReviewedByHuman:false,ownerApprovalProves3DRealism:false,
  arbitraryPrivatePhotosSupported:false,collisionCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'});
}

/**
 * Hash BOTH real bytes inside BOARD04's owner-private closure.
 * P119's saved review fields are owner assertions, not independent reviews.
 * This never creates review data, returns image pixels, or mutates the wardrobe.
 */
export async function attestOwnerReviewedCutoutBytes186({
 row,ownerId,cryptoImpl,decodeBase64
}={}){
 const hint=row?.segmentHint;
 if(!row||row.ownerId!==ownerId||row.sourceId!=='commons-0016'||
  row.category!=='Tops'||row.itemType!=='Blouse'||
  row.sourceSHA256!==LICENSED_BLOUSE_SHA||row.sourceHashVerified!==true||
  row.ownerReviewed!==true||row.humanReviewedSource!==true||
  row.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'||
  hint?.verified!==true||hint?.ownerReviewedInstance!==true||
  hint?.originalSHA256!==LICENSED_BLOUSE_SHA||
  !SHA.test(row.cutoutSHA256||'')||
  hint.cutoutSHA256!==row.cutoutSHA256||
  row.cutoutSHA256===LICENSED_BLOUSE_SHA||
  typeof hint.cutoutImage!=='string'||
  !hint.cutoutImage.startsWith('data:image/jpeg;base64,'))
  throw Error('P186 real P119 owner-reviewed source and separated JPEG cutout required');
 // Preserve the full review + image identity across both asynchronous SHA
 // operations. An attacker must not flip approved/review flags, provenance,
 // cutout hash or image bytes between the two digests without detection.
 const identity=()=>[row.id,row.ownerId,row.sourceId,row.sourceSHA256,
  row.sourceHash,row.sourceHashVerified,row.category,row.itemType,
  row.ownerReviewed,row.humanReviewedSource,row.reviewProvenance,
  row.cutoutSHA256,row.originalPhoto?.image,row.originalPhoto?.sha256,
  row.segmentHint?.verified,row.segmentHint?.ownerReviewedInstance,
  row.segmentHint?.originalSHA256,row.segmentHint?.cutoutSHA256,
  row.segmentHint?.cutoutImage];
 const originalIdentity=identity();
 const ensureSame=()=>{if(identity().some((value,i)=>value!==originalIdentity[i]))
  throw Error('P186 owner review or cutout changed during JPEG SHA verification');};
 const original=await attestOriginalJPEGBytes92({
  row,ownerId,cryptoImpl,decodeBase64
 });
 ensureSame();
 const cropped=await attestOriginalJPEGBytes92({
  row:{id:row.id,ownerId:row.ownerId,sourceSHA256:row.cutoutSHA256,
   originalPhoto:{sha256:row.cutoutSHA256,image:hint.cutoutImage}},
  ownerId,cryptoImpl,decodeBase64
 });
 ensureSame();
 return Object.freeze({ownerId,garmentId:row.id,sourceId:'commons-0016',
  originalSourceSHA256:original.sha256,cutoutSHA256:cropped.sha256,
  ownerReviewed:true,humanReviewedSource:true,reviewedInstance:true,
  reviewProvenance:row.reviewProvenance,verifiedCutoutSeparatedFromOriginal:true,
  originalJPEGBytesSHA256Verified:true,cutoutJPEGBytesSHA256Verified:true,
  independentHumanReviewerVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
