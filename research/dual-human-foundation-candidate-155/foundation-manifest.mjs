/**
 * P155 FIRST REAL HUMANOID FOUNDATION CANDIDATES (research-only).
 *
 * Source Microsoft Rocketbox (MIT, copyright Microsoft 2020), immutable
 * converted GLBs from a public third-party repo, not a vendor SaaS.
 * The originals are FULLY DRESSED avatars and therefore DO NOT replace
 * CC0 body+photo garment integration. Clothing baked into the avatar
 * is never advertised as the account owner's photographed garment.
 * Both originals + all dependencies are kept OUT of production/staging.
 */
export const FOUNDATION155=Object.freeze({
 priority:155,
 parentMain:'c7fe572a5e6c4a18b1cef9ffbd550aee473f2f4c',
 original163BoneFallback:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 sourceRepo:'927tanmay/react-ai-voice-avatar',
 sourcePinnedCommit:'fc1398c2f8ba600c3676a5277684ed4f3e2731d7',
 originalUpstream:'microsoft/Microsoft-Rocketbox',
 originalLicense:'MIT',
 originalCopyright:'Copyright (c) 2020 Microsoft',
 originalLicenseUrl:'https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md',
 convertedAssetLicenseUrl:'https://github.com/927tanmay/react-ai-voice-avatar/blob/fc1398c2f8ba600c3676a5277684ed4f3e2731d7/assets/avatars/LICENSE.md',
 rocketboxAssetGarmentsBaked:true,
 existingWardrobePhotographsCompatible:false,
 aiArbitraryPhotoGarmentFitProven:false,
 originalSourceSkinReplaced:false,
 optInResearchPreviewOnly:true,
 ownerPhotosNeverUploaded:true,
 vendorNetworkAccessOnCustomerDevice:false,
 licensedReleaseReviewPending:true,
 independentHumanPhotorealismApproved:false,
 actualPhysicalAndroidIphoneTested:false,
 familyAlpha:'HOLD',
 releaseAuthorized:false
});
export const CANDIDATES155=Object.freeze([
 Object.freeze({
  key:'female',label:'Rocketbox Adult Female #07',file:'ananya.glb',
  source:'Microsoft Rocketbox Female_Adult_07',
  size:4480100,
  gitBlobSHA1:'41e05337ee06a1b12dc9e76ecce07508ea7fdd1a',
  researchOnly:true,bakedClothes:true,license:'MIT'
 }),
 Object.freeze({
  key:'male',label:'Rocketbox Adult Male #04',file:'aarav.glb',
  source:'Microsoft Rocketbox Male_Adult_04',
  size:4673948,
  gitBlobSHA1:'e5d6c4c3319e0e45f7715b05605f695295849654',
  researchOnly:true,bakedClothes:true,license:'MIT'
 })
]);
const allowed=new Set(CANDIDATES155.map(x=>x.key));
/**
 * Privacy and honesty gate: a dressed vendor avatar can be previewed only
 * without attaching, overwriting, indexing, styling, or displaying it AS an
 * owner's uploaded item. User outfit previews keep the verified original
 * photo and 163-bone outfit renderer, even if the vendor model looks nicer.
 */
export function chooseFoundation155({figure,ownerSavedOutfit=false,
  ownerPhotoItemCount=0,hasAnyOwnedGarment=false,
  previewOptIn=false,sourceManifestAuthenticated=false}={}){
 if(!allowed.has(figure))throw Error('P155 refuses invalid figure/asset gender');
 if(!Number.isInteger(ownerPhotoItemCount)||ownerPhotoItemCount<0)
  throw Error('P155 invalid original account garment count');
 const protectedOutfit=Boolean(ownerSavedOutfit||hasAnyOwnedGarment||ownerPhotoItemCount>0);
 const allowedResearch=previewOptIn===true&&
  sourceManifestAuthenticated===true&&!protectedOutfit;
 if(!allowedResearch){
  return Object.freeze({figure,model:'original-163-bone-photographed-outfit',
   releaseAuthorized:false,ownerWardrobeUnmodified:true,
   sourcePhotoOnlyFallbackPreserved:true,
   vendorClothingMisrepresentedAsOwned:false,
   reason:protectedOutfit?'REAL_OWNER_CLOTHING_REQUIRES_SOURCE_BRIDGE':
   'RESEARCH_PREVIEW_NOT_AUTHORIZED'});
 }
 const candidate=CANDIDATES155.find(x=>x.key===figure);
 return Object.freeze({figure,model:'licensed-external-research-preview',
  asset:candidate.file,sourceGitBlobSHA1:candidate.gitBlobSHA1,
  advertisedOriginalOwnedClothes:false,
  releaseAuthorized:false,ownerWardrobeUnmodified:true,
  vendorClothingMisrepresentedAsOwned:false,
  photoTo3DFittingStatus:'NOT_VERIFIED'});
}
