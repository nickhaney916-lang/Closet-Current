/**
 * Parallel #89: independent PUBLIC-RESEARCH multi-category source provenance.
 * Verifies actual original JPEG bytes, source rights and category before
 * preparing a front-only geometric research panel. Never authorizes 3D release.
 */
import {createHash} from 'node:crypto';
import {buildObservedPhotoPanel86} from '../mission2-p86/photo-panel.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const attestedReceipts=new WeakSet();
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fallback=reason=>Object.freeze({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,
  research3DReady:false,consumer3DAdmitted:false,independentlyReviewed:false,
  releaseAuthorized:false,familyAlpha:'HOLD'});
// Pinned benchmark/locked-photo-sources.json identities, never owner garments.
export const SOURCE_CLASSES89=Object.freeze({
 'commons-0001':Object.freeze({category:'shirt',slot:'top',sha:'d20d66d4173f56c47e35540f081ecdfcee6e019df665ee245d967d126e117684',license:'CC BY-SA 3.0'}),
 'commons-0003':Object.freeze({category:'shirt',slot:'top',sha:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',license:'CC BY-SA 3.0'}),
 'commons-0016':Object.freeze({category:'blouse',slot:'top',sha:'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',license:'CC0'}),
 'commons-0023':Object.freeze({category:'jeans',slot:'bottom',sha:'5be4cb0d7017987d8625caf53ac979f0c78245617dc5828aec5f77ae8f4ea8ef',license:'CC BY-SA 3.0'}),
 'commons-0041':Object.freeze({category:'skirt',slot:'bottom',sha:'0e4d278fe02d2e527a5b73a08407dda8a57e5597260dc08461bc83e720cf2278',license:'CC BY 4.0'}),
 'commons-0053':Object.freeze({category:'dress',slot:'top',sha:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',license:'CC BY 4.0'})
});
export function attestOriginalSource89({sourceId,originalBytes,lockedRecord}={}){
 try{
  const expected=SOURCE_CLASSES89[sourceId];
  if(!expected||!lockedRecord||lockedRecord.id!==sourceId||
    lockedRecord.verified!==true||lockedRecord.sha256!==expected.sha||
    lockedRecord.attribution?.license!==expected.license||
    !lockedRecord.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:')||
    !lockedRecord.attribution?.credit||
    !['CC0','CC BY 4.0','CC BY-SA 3.0'].includes(expected.license))
    throw Error('source-license-or-registry-mismatch');
  if(!(originalBytes instanceof Uint8Array)||originalBytes.byteLength<1000||
    originalBytes[0]!==255||originalBytes[1]!==216||originalBytes[2]!==255)
    throw Error('actual-original-jpeg-bytes-required');
  if(!hex(expected.sha)||digest(originalBytes)!==expected.sha)
    throw Error('original-photo-sha-mismatch');
  const verified=Object.freeze({schema:'M2-P89-public-original-jpeg-attestation-v1',status:'ORIGINAL_JPEG_VERIFIED',
    sourceId,originalSHA256:expected.sha,category:expected.category,slot:expected.slot,
    license:expected.license,originalByteCount:originalBytes.byteLength,
    observedViews:Object.freeze(['single-published-view-angle-unadjudicated']),sideSource:'UNOBSERVED',rearSource:'UNOBSERVED',
    photoIsPublicBenchmark:true,ownerApproved:false,sourceMaskApproved:false,
    actual163BoneFitProved:false,realSourceTextureTransferProved:false,
    consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  attestedReceipts.add(verified);return verified;
 }catch(e){return fallback(['source-license-or-registry-mismatch','actual-original-jpeg-bytes-required',
   'original-photo-sha-mismatch'].includes(e.message)?e.message:'invalid-source-evidence');}
}
export function buildSourceObservedFront89({sourceReceipt,alpha,width,height,sourceMaskSHA256}={}){
 if(!attestedReceipts.has(sourceReceipt)||sourceReceipt?.status!=='ORIGINAL_JPEG_VERIFIED'||
   SOURCE_CLASSES89[sourceReceipt.sourceId]?.sha!==sourceReceipt.originalSHA256||
   sourceReceipt.familyAlpha!=='HOLD'||sourceReceipt.consumer3DAdmitted!==false||
   !(alpha instanceof Uint8Array)||!hex(sourceMaskSHA256)||
   digest(alpha)!==sourceMaskSHA256)
  return fallback('unaligned-source-or-mask-bytes');
 try{
  const panel=buildObservedPhotoPanel86({alpha,width,height,
    sourceSHA256:sourceReceipt.originalSHA256,maskSHA256:sourceMaskSHA256});
  return Object.freeze({status:'OBSERVED_FRONT_GEOMETRY_NOT_FITTED',
   sourceId:sourceReceipt.sourceId,category:sourceReceipt.category,
   slot:sourceReceipt.slot,originalSHA256:sourceReceipt.originalSHA256,
   rawMaskSHA256:sourceMaskSHA256,
   positions:panel.positions,uv:panel.uv,indices:panel.indices,
   triangles:panel.receipt.triangles,foregroundPixels:panel.receipt.foregroundPixels,
   frontOnly:true,frontCameraIndependentlyVerified:false,depthMeasured:false,sourceBackObserved:false,
   textureIsOriginalRGBTransferred:false,maskOwnerApproved:false,
   actual163BoneFitProved:false,collisionClearanceCertified:false,
   releaseAuthorized:false,familyAlpha:'HOLD'});
 }catch{return fallback('invalid-provisional-front-segmentation');}
}
export function auditSourceOutfit89({pieces,avatar,contactReceipt}={}){
 if(!['female','male'].includes(avatar)||!Array.isArray(pieces)||
  pieces.length<2||pieces.length>3)return fallback('two-piece-research-outfit-required');
 const seen=new Set(),slots=new Set();
 for(const p of pieces){
  const source=SOURCE_CLASSES89[p?.sourceId];
  if(!source||!attestedReceipts.has(p)||p?.status!=='ORIGINAL_JPEG_VERIFIED'||
   p.originalSHA256!==source.sha||p.category!==source.category||
   p.slot!==source.slot||seen.has(p.sourceId)||slots.has(p.slot)||
   p.familyAlpha!=='HOLD'||p.releaseAuthorized!==false)
   return fallback('source-slot-or-identity-conflict');
  seen.add(p.sourceId);slots.add(p.slot);
 }
 if(!slots.has('top')||!slots.has('bottom'))
  return fallback('source-supported-upper-and-lower-needed');
 if(pieces.some(p=>p.category==='dress'))
  return fallback('dress-suppresses-bottom-in-3d-but-originals-preserved');
 // A P84 diagnostic is a positive crossing VETO or unresolved uncertainty;
 // zero strict crossings never becomes physical cloth clearance.
 if(contactReceipt?.anyCrossingVeto===true||contactReceipt?.strictTransverseCrossings>0)
  return fallback('measured-intergarment-crossing-veto');
 const externalContactShapeOnly=contactReceipt?.schema==='parallel84-distinct-source-layer-contact/v1'&&
    contactReceipt?.budgetComplete===true&&
    contactReceipt?.contactClearanceProved===false&&
    contactReceipt?.releaseAuthorized===false;
 return Object.freeze({schema:'M2-P89-source-pair-research-not-release-v1',
  status:'MULTICATEGORY_PUBLIC_SOURCE_PAIR_VERIFIED_3D_NOT_CLEARED',
  avatar,sourceIds:Object.freeze(pieces.map(p=>p.sourceId)),
  categories:Object.freeze(pieces.map(p=>p.category)),
  originalSourceJPEGsVerified:pieces.length,
  distinctSourceCategories:new Set(pieces.map(p=>p.category)).size,
  independentLayerContactMeasured:false,
  externalContactReceiptUnverified:externalContactShapeOnly,
  contactStatus:externalContactShapeOnly?'UNVERIFIED_EXTERNAL_RECEIPT':'NOT_TESTED',
  actualPairedSkinnedMeshesValidated:false,
  sourceObservedSideAndRear:false,
  independentHumanRealismAccepted:false,
  safeToRenderPhotorealistic3D:false,
  mode:'original-photo-2d-required',releaseAuthorized:false,familyAlpha:'HOLD'});
}