/**
 * P171: bind Parallel #60's actual 163-bone photo-mesh evidence to the
 * *existing* owner-private saved Outfit → opt-in native WebGL handoff.
 *
 * This is a RESEARCH evidence contract, not new garment geometry, not a
 * private-photo reconstructor and not a realism rating. No image copies,
 * calls to an external service, writes, or simulated source-mesh admission.
 */
const PHOTO_SOURCES_171=Object.freeze({
 'commons-0003':Object.freeze({sha:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',garment:'shirt'}),
 'commons-0053':Object.freeze({sha:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',garment:'dress'}),
 'commons-public-domain-jeans-2005':Object.freeze({sha:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',garment:'pants'}),
 'commons-cc-by-sa-denimjeans2-2008':Object.freeze({sha:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',garment:'pants'})
});
export {PHOTO_SOURCES_171};
const fallback=(reason)=>Object.freeze({admitted:false,
 mode:'verified-original-photo-2d-fallback',reason,
 realism3DVerified:false,arbitraryOwnerPhoto3DApproved:false,
 releaseAuthorized:false,familyAlpha:'HOLD'});
const HEX=/^[a-f0-9]{64}$/;
const fields=Object.freeze({dress:'dress',shirt:'shirt',pants:'pants'});
const same=(a,b)=>a&&b&&a===b;
const safeReceipt=(slot,expectedSHA,sourceEvidence)=>{
 if(!HEX.test(expectedSHA||'')||!sourceEvidence)return false;
 const contract=sourceEvidence.receipt,admitted=Object.entries(PHOTO_SOURCES_171).find(([id,s])=>
   s.sha===expectedSHA&&(contract?.sourceId===id)&&(s.garment===slot));
 if(!admitted)return false;
 return contract?.accepted===true &&
  contract.mode==='source-photo-on-anatomical-skinned-mesh' &&
  contract.sourceSHA256===expectedSHA &&
  contract.common163BoneSkeletonChecked===true &&
  contract.originalSourceIdentityChecked===true &&
  contract.originalPhotoPixelsUsed===true &&
  contract.arbitraryOwnerPhoto3DApproved===false &&
  contract.humanPhotorealismApproved===false &&
  contract.releaseAuthorized===false &&
  contract.rearPhotoProvenance==='INFERRED_UNVERIFIED_NEUTRAL' &&
  Number.isInteger(contract.meshCount)&&contract.meshCount>0&&
  Number.isInteger(contract.vertices)&&contract.vertices>=3&&
  Number.isInteger(contract.triangles)&&contract.triangles>=1&&
  Number.isFinite(contract.maxSkinWeightSumError)&&
  contract.maxSkinWeightSumError<=0.025 &&
  sourceEvidence.photoFabricPBR164===true &&
  sourceEvidence.sourceSHA256===expectedSHA;
};
/**
 * Original bytes/owner/session/wardrobe reads MUST have been cryptographically
 * verified by NATIVE92 before calling; in addition this contract matches the
 * selected garment ID and saved SHA with the actual donor mesh proof.
 */
export function inspectNativePhotoFit171({selection,sources,render}={}){
 if(!selection?.ownerId||!selection?.slots||
    sources?.ownerId!==selection.ownerId||
    !Array.isArray(sources.sources)||sources.sources.length<1)
  return fallback('owner-saved-photo-source-unavailable');
 if(!render?.privateVisible||render?.viewerReady!==true||render?.bones!==163||
    render?.releaseAuthorized===true||render?.productionDeployed===true||
    !['dress','shirt','shirt-pants'].includes(render.viewerMode))
  return fallback('actual-original-163-bone-webgl-view-is-unavailable');
 if(!render.fitReceipts171||typeof render.fitReceipts171!=='object')
  return fallback('independent-parallel-60-mesh-receipts-are-not-present');
 const garmentSlot=render.viewerMode==='dress'?'dress':'shirt';
 const topId=selection.slots.top;
 const top=sources.sources.find(x=>x?.id===topId);
 if(!top||!top.sha256||!safeReceipt(garmentSlot,top.sha256,render.fitReceipts171[garmentSlot]))
  return fallback('source-saved-photo-is-not-fitted-to-the-real-anatomical-donor');
 const bound=[{itemId:topId,sha256:top.sha256,part:garmentSlot}];
 if(render.viewerMode==='shirt-pants'){
  const bottomId=selection.slots.bottom;
  const bottom=sources.sources.find(x=>x?.id===bottomId);
  if(!bottom||!safeReceipt('pants',bottom.sha256,render.fitReceipts171.pants))
   return fallback('saved-denim-does-not-have-verified-source-rig-fit');
  bound.push({itemId:bottomId,sha256:bottom.sha256,part:'pants'});
 }
 // Source metadata equality isn't proof of the appearance of sleeves, actual
 // fit, photorealism, hidden/back photos, or mobile hardware acceptance.
 return Object.freeze({admitted:true,mode:'verified-public-photo-skeleton-bound-research-3d',
  renderedItems:Object.freeze(bound.map(x=>Object.freeze(x))),
  independentlyVerifiedMeshes:true,sourceSHAAndOwnerBinding:true,
  realism3DVerified:false,arbitraryOwnerPhoto3DApproved:false,
  rearPhotoProvenance:'inferred-not-photographed',
  limitedLicensedResearchFixtures:true,releaseAuthorized:false,familyAlpha:'HOLD'});
}
export function requireNativePhotoFit171(args){
 const verdict=inspectNativePhotoFit171(args);
 if(!verdict.admitted)throw Error('P171 verified photographed 3D unavailable: '+verdict.reason);
 return verdict;
}
