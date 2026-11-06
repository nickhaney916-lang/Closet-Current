/**
 * P110 research: fail-closed boundary from an ALREADY owner-scoped, reviewed
 * saved outfit selection to a genuine source-fitted 3D candidate or original
 * photo/2D fallback. This does not perform real authentication or cloud RLS.
 *
 * No original image bytes, masks, user photos, network, storage or rendering
 * claims are returned. Benchmark 3D remains bound to two public-license JPEGs.
 */
export const RESEARCH_OWNER_110='non-user-licensed-research-3d69';
export const RESEARCH_SOURCE_110=Object.freeze({
  shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
  public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const SHA=/^[a-f0-9]{64}$/;
// Preserve an already human-reviewed label, never infer a color from a filename,
// benchmark mesh or 3D appearance. Reject missing/control/unsafe index labels.
const reviewedColor110=c=>typeof c==='string'&&c.length<=48&&c.trim()===c&&
 /^[\p{L}\p{N}]+(?:[ /-][\p{L}\p{N}]+)*$/u.test(c);
const fail=msg=>{throw Error('PHOTO110 '+msg);};
const isRecord=o=>o&&typeof o==='object'&&!Array.isArray(o);
const requireText=(s,max=180)=>typeof s==='string'&&s.length>0&&s.length<=max;
// PHOTO113: freeze the inspected *primitive metadata* before the final live
// session callback. That callback can synchronously observe a wardrobe edit;
// never use a post-callback item value with a pre-callback 3D decision.
const REVIEWED_FIELDS_113=Object.freeze([
 'id','ownerId','sourceId','sourceSHA256','color','category','itemType',
 'ownerReviewed','sourcePhotoOriginal','photographic3DReconstructionApproved',
 'releaseAuthorized','sourceFrom','originalOutfitGroup','garmentMeshVerified'
]);
const snapshotReviewed113=item=>Object.freeze(Object.fromEntries(
 REVIEWED_FIELDS_113.map(key=>[key,item[key]])
));
const sourceUnchanged113=(item,snapshot)=>isRecord(item)&&
 REVIEWED_FIELDS_113.every(key=>Object.is(item[key],snapshot[key]));

function requireFresh110(session,readCurrent){
 if(!session?.authenticated||!requireText(session.ownerId,128)||
    !Number.isSafeInteger(session.generation)||session.generation<0||
    typeof readCurrent!=='function')fail('fresh authenticated owner-scoped source session required');
 const now=readCurrent();
 if(!now?.authenticated||now.ownerId!==session.ownerId||
    now.generation!==session.generation)
  fail('session changed or logged out during original-photo outfit selection');
}
function matchingOriginalItem110(item,ownerId,category,itemType){
 return isRecord(item)&&item.ownerId===ownerId&&
  requireText(item.id)&&requireText(item.sourceId)&&
  SHA.test(item.sourceSHA256||'')&&reviewedColor110(item.color)&&
  item.ownerReviewed===true&&item.sourcePhotoOriginal===true&&
  item.category===category&&item.itemType===itemType&&
  item.photographic3DReconstructionApproved!==true;
}
export function planReviewedSourceLook110({session,indexed,board,
 readCurrentSession}={}){
 requireFresh110(session,readCurrentSession);
 if(!isRecord(indexed)||indexed.ownerId!==session.ownerId||
  indexed.generation!==session.generation||
  indexed.releaseAuthorized!==false||!(indexed.byId instanceof Map)||
  !isRecord(board)||!isRecord(board.slots)||
  !Object.keys(board.slots).every(s=>['top','bottom'].includes(s))||
  Object.keys(board.slots).length!==2||
  !requireText(board.slots.top)||!requireText(board.slots.bottom)||
  board.slots.top===board.slots.bottom)
  fail('two valid owner-scoped saved top/bottom outfit slot records required');
 const topRecord=indexed.byId.get(board.slots.top),bottomRecord=indexed.byId.get(board.slots.bottom);
 if(!matchingOriginalItem110(topRecord,session.ownerId,'Tops','T-shirt')||
    !matchingOriginalItem110(bottomRecord,session.ownerId,'Bottoms','Jeans'))
  fail('saved original shirt and jeans need reviewed same-owner category/subtype/source photo');
 const top=snapshotReviewed113(topRecord),bottom=snapshotReviewed113(bottomRecord);
 const initial=Object.freeze({
  ownerId:session.ownerId,generation:session.generation,
  indexedById:indexed.byId,indexOwner:indexed.ownerId,
  indexGeneration:indexed.generation,indexRelease:indexed.releaseAuthorized,
  topSlot:board.slots.top,bottomSlot:board.slots.bottom
 });
 const benchmark=session.ownerId===RESEARCH_OWNER_110 &&
   top.color==='Black'&&bottom.color==='Blue'&&
   top.id==='licensed-shirt'&&top.sourceId==='licensed-shirt'&&
   top.sourceSHA256===RESEARCH_SOURCE_110.shirt&&
   ((bottom.id==='licensed-jeans-1'&&bottom.sourceId==='licensed-jeans-1'&&
     bottom.sourceSHA256===RESEARCH_SOURCE_110.public)||
    (bottom.id==='licensed-jeans-2'&&bottom.sourceId==='licensed-jeans-2'&&
     bottom.sourceSHA256===RESEARCH_SOURCE_110.second));
 const selected=benchmark?
  (bottom.id==='licensed-jeans-1'?'public':'second'):null;
 requireFresh110(session,readCurrentSession);
 // Defend against same-turn source edits, source-ID rebinding, slot changes,
 // owner rotation and changes to the index generation or release gate.
 // A valid previous decision is NOT a valid ticket for a new source state.
 if(session.ownerId!==initial.ownerId||session.generation!==initial.generation||
    session.authenticated!==true||indexed.ownerId!==initial.indexOwner||
    indexed.generation!==initial.indexGeneration||
    indexed.releaseAuthorized!==initial.indexRelease||
    indexed.byId!==initial.indexedById||
    !isRecord(board.slots)||Object.keys(board.slots).length!==2||
    board.slots.top!==initial.topSlot||board.slots.bottom!==initial.bottomSlot||
    indexed.byId.get(initial.topSlot)!==topRecord||
    indexed.byId.get(initial.bottomSlot)!==bottomRecord||
    !sourceUnchanged113(topRecord,top)||!sourceUnchanged113(bottomRecord,bottom))
  fail('reviewed source, owner, index, or outfit changed during final source admission');
 return Object.freeze({
  status:benchmark?'verified-public-research-3d':'original-photo-2d-fallback',
  selectedPublicDenimSource:selected,
  outfitSlots:Object.freeze({top:top.id,bottom:bottom.id}),
  sourceSHA256s:Object.freeze({top:top.sourceSHA256,bottom:bottom.sourceSHA256}),
  sourceIds:Object.freeze({top:top.sourceId,bottom:bottom.sourceId}),
  reviewedColors:Object.freeze({top:top.color,bottom:bottom.color}),
  reviewedColorProvenance:'owner-reviewed-index-claim-not-independently-model-verified',
  ownerId:session.ownerId,generation:session.generation,
  itemTypeVerified:true,originalSourcePhotoIdentityPreserved:true,
  originalPhotoNotReconstructed:!benchmark,
  truePrivateWardrobe3DReady:false,
  genuineResearch163Bone3DReady:benchmark,
  fallback:benchmark?null:'existing-original-photograph-or-2d-board',
  independentOwnerAuthenticityProven:false,realSignedCloudRLSVerified:false,
  originalPersonalPhotosExposed:false,photographedReverseVerified:false,
  humanPhotorealismApproved:false,physicalPhoneTested:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export function requireUnchangedReviewedLook110(saved,{session,indexed,
 readCurrentSession}={}){
 if(!isRecord(saved)||saved.releaseAuthorized!==false||
    !isRecord(saved.outfitSlots)||!isRecord(saved.sourceSHA256s)||
    !isRecord(saved.sourceIds)||!isRecord(saved.reviewedColors)||
    saved.ownerId!==session?.ownerId||saved.generation!==session?.generation)
  fail('stale or cross-owner saved outfit cannot be reopened');
 const next=planReviewedSourceLook110({
  session,indexed,board:{slots:saved.outfitSlots},readCurrentSession
 });
 if(saved.status!==next.status||
    saved.sourceSHA256s.top!==next.sourceSHA256s.top||
    saved.sourceSHA256s.bottom!==next.sourceSHA256s.bottom||
    saved.sourceIds.top!==next.sourceIds.top||
    saved.sourceIds.bottom!==next.sourceIds.bottom||
    saved.reviewedColors.top!==next.reviewedColors.top||
    saved.reviewedColors.bottom!==next.reviewedColors.bottom||
    saved.selectedPublicDenimSource!==next.selectedPublicDenimSource)
  fail('saved outfit source JPEG, category or owner changed since review');
 return next;
}
