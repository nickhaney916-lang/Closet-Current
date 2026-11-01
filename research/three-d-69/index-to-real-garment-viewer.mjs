/**
 * 3D-69 — bridge category-verified SAVED wardrobe metadata to ACTUAL existing
 * separately skinned anatomical photographed-garment engine.
 *
 * Only existing independently SHA-checked source photographs and derived
 * mask sources can render. Arbitrary personal camera photo does NOT become
 * a made-up 3D garment: it remains the saved original/2D fallback.
 * Research source ids are license-locked; do not mislabel licensed benchmarks
 * as a user's closet. No network, DB, identity or export in this module.
 */
import {requireAnatomicalShirtPreview} from '../three-d-07/rig-shirt-transfer.mjs';
import {requireReviewedPhotoPants,PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND} from '../three-d-30/reviewed-photo-pants.mjs';

const denimSources=Object.freeze([PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND]);
export const VERIFIED_PUBLIC_SHIRT_SHA256='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const verifiedDecodedImages=new WeakMap();
const hex64=/^[0-9a-f]{64}$/;
const sameString=(a,b)=>typeof a==='string'&&a.length>0&&a===b;
const freeze=o=>Object.freeze(o);
function sourceNotReady(reason){return freeze({
 status:'original-photo-fallback',reason,actual3DMeshReady:false,
 fallback:'existing-2d-board-and-original-photo',
 humanPhotorealismApproved:false,physicalPhoneAccepted:false,
 releaseAuthorized:false
});}
function verifyPlan(plan){
 if(!plan?.ownerId||!Number.isSafeInteger(plan.generation)||plan.generation<0||
    plan.releaseAuthorized!==false||plan.actual3DMeshReady!==false||
    plan.sourceClothingCategoryVerified!==true||
    plan.sourcePhotoIdentityPreserved!==true||!plan.selected||
    typeof plan.selected!=='object')
  throw Error('Verified authenticated saved closet-to-3D category plan required');
 const slots=Object.keys(plan.selected);
 for(const slot of slots){
  const piece=plan.selected[slot];
  if(!piece||typeof piece.itemId!=='string'||!hex64.test(piece.sourceSHA256||'')||
    piece.actual3DMeshReady!==false)
   throw Error('Source garment missing verified original photo SHA or item identity');
 }
 return slots;
}
function verifyShirt(piece,candidate){
 if(piece.category!=='Tops'||piece.anatomicalSlot!=='shirt-or-dress'||
    !sameString(candidate?.id,'commons-0003')||
    !sameString(piece.sourceSHA256,candidate.sourceSHA256)||
    candidate.sourceSHA256!==VERIFIED_PUBLIC_SHIRT_SHA256)
  throw Error('Indexed top does not match exact reviewed photographed shirt source');
 requireAnatomicalShirtPreview(candidate,{acknowledged:true});
 if(!candidate.original||!candidate.cutout||
    candidate.originalVerified===false||candidate.cutoutVerified===false)
  throw Error('Original shirt source JPEG/cutout must be independently byte verified');
 return candidate;
}
function verifyPants(piece,candidate){
 if(piece.category!=='Bottoms'||piece.anatomicalSlot!=='pants')
  throw Error('Indexed bottoms not compatible with an actual photographic pant mesh');
 const pinned=denimSources.find(s=>s.id===candidate?.id);
 if(!pinned||!sameString(piece.sourceSHA256,candidate.sourceSHA256)||
    candidate.sourceSHA256!==pinned.originalSHA256||
    candidate.cutoutSHA256!==pinned.cutoutSHA256)
  throw Error('Indexed denim source SHA and vetted research cutout mismatch');
 requireReviewedPhotoPants(candidate,{reviewed:true});
 return candidate;
}
/**
 * Identity checked from auth-bound plan and actual source asset bytes (by
 * existing source loaders) before the anatomical renderer can be invoked.
 * If there is not a recognized source/type, return fallback, never auto
 * convert any privately photographed clothing.
 */
export function prepareIndexedGarmentsFor3D(plan,{shirtCandidate=null,pantsCandidate=null}={}){
 const slots=verifyPlan(plan);
 if(slots.some(s=>!['top','bottom'].includes(s)))
  return sourceNotReady('Original photographed layers/shoes/dress/accessories still require independently built 3D meshes');
 if(!slots.length)return sourceNotReady('Select existing indexed clothes first');
 const top=plan.selected.top,bottom=plan.selected.bottom;
 if(top?.category==='Dresses')
  return sourceNotReady('Source-specific dress mesh not certified in this integration');
 if(top&&top.category!=='Tops'||bottom&&bottom.category!=='Bottoms')
  throw Error('Indexed source item category conflicts with the anatomical garment slot');
 if(top&&!shirtCandidate)return sourceNotReady('This original top has not yet been verified and fitted as 3D fabric');
 if(bottom&&!pantsCandidate)return sourceNotReady('This original bottom has not yet been verified and fitted as 3D fabric');
 if(top)verifyShirt(top,shirtCandidate);
 if(bottom)verifyPants(bottom,pantsCandidate);
 const mode=top&&bottom?'shirt-pants':top?'shirt':'pants';
 const prepared=freeze({
  status:'source-bound-3d-ready-for-provisional-preview',
  ownerId:plan.ownerId,generation:plan.generation,
  mode,originalIndexedIds:freeze([top?.itemId,bottom?.itemId].filter(Boolean)),
  sourceSHA256s:freeze({...(top?{top:top.sourceSHA256}:{}),...(bottom?{bottom:bottom.sourceSHA256}:{})}),
  // Actual loaded image-bearing candidates never appear in logged JSON.
  // Real decoded source photos are retained only in a private WeakMap.
  reviewedBenchmarkAssets:true,originalFrontOnly:true,
  originalUnphotographedBack:'neutral-fabric-no-invented-details',
  sourcePhotosNotModified:true,actual3DMeshReady:true,
  certifiedHumanAppearance:false,physicalPhoneAccepted:false,
  releaseAuthorized:false
 });
 verifiedDecodedImages.set(prepared,freeze({shirt:top?shirtCandidate:null,pants:bottom?pantsCandidate:null}));
 return prepared;
}
export function applyIndexed3DSelection(viewer,prepared,{checkCurrentSession}={}){
 if(!prepared||!verifiedDecodedImages.has(prepared)||prepared.status!=='source-bound-3d-ready-for-provisional-preview'||
    !prepared.actual3DMeshReady||prepared.releaseAuthorized!==false)
  throw Error('Actual approved source-bound 3D garment or original-photo fallback required');
 if(typeof checkCurrentSession!=='function')throw Error('Live authenticated session check required');
 const now=checkCurrentSession();
 if(!now?.authenticated||now.ownerId!==prepared.ownerId||now.generation!==prepared.generation)
  throw Error('Authenticated wardrobe switched before 3D garment activation');
 if(typeof viewer?.applyOutfit!=='function'||typeof viewer?.getState!=='function')
  throw Error('Actual skinned Three.js anatomical showroom required');
 const state=viewer.getState();
 if(state?.stats?.bones!==163||state.loaded!==true||state.releaseAuthorized!==false)
  throw Error('Original licensed 163-joint anatomical figure not loaded');
 const {shirt,pants}=verifiedDecodedImages.get(prepared);
 if(shirt)requireAnatomicalShirtPreview(shirt,{acknowledged:true});
 if(pants)requireReviewedPhotoPants(pants,{reviewed:true});
 viewer.applyOutfit(prepared.mode,shirt,{
  reviewed:!!shirt,pantsCandidate:pants,pantsReviewed:!!pants
 });
 const actual=viewer.getState().outfit;
 if(actual?.mode!==prepared.mode||
    (shirt&&!actual.shirt)||
    (pants&&(
      actual.pants?.photoApplied!==true||
      actual.pants?.sourceSHA256!==prepared.sourceSHA256s.bottom)))
  throw Error('Real skinned garment did not apply genuine photographed original; HOLD');
 if(shirt&&
    actual.shirt?.sourceSHA256!==prepared.sourceSHA256s.top)
  throw Error('Original photographed shirt image source was substituted; HOLD');
 // Do not return original decoded JPEG image objects to the host app.
 return freeze({status:'actual-separate-skinned-garments-displayed',
  ownerId:prepared.ownerId,generation:prepared.generation,
  selectedIds:prepared.originalIndexedIds,mode:actual.mode,
  originalPhotoSHA256s:prepared.sourceSHA256s,
  sourceFrontOnly:true,rearPhotoVerified:false,
  real3DSkinnedGarmentMeshes:actual.garmentMeshes,
  anatomicalSkeletonBones:state.stats.bones,
  realPhotoApplied:true,poseCollisionAndAestheticsApproval:false,
  humanPhotorealismApproved:false,physicalPhoneAccepted:false,
  releaseAuthorized:false
 });
}
