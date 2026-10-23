/**
 * Family Alpha — RESEARCH-ONLY reviewed REAL-JPEG photo preparation.
 *
 * Unlike the strictly synthetic ground-truth fixtures, this uses the actual
 * app-retained JPEG and browser image decoding. Only simple, high-contrast,
 * near-uniform-background images are candidates. No machine-only decision can
 * claim perfect garment isolation; explicit in-session visual approval is
 * required before a result is supplied to the source-bound 2D adapter.
 *
 * Not loaded by the app. NO cloud requests, persistent storage, paid AI or
 * automatic inclusion in the user's wardrobe. Approval is a UX quality gate,
 * NOT proof of Supabase owner authorization, human fit, or security.
 */
import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';
import {auditMask,fingerprintSavedCrop} from '../family-alpha-16/source-mask-audit.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment}
 from '../../public/family-alpha-2d-saved-board.mjs';

const MAX_PIXELS=8_000_000;
const MAX_IMAGE_BYTES=8_000_000;
const sourceOf=item=>item?.originalPhoto===undefined?item?.image:item?.originalPhoto?.image;
const decision=(status,reason,extra={})=>Object.freeze({status,reason,presentation:null,...extra});
const validScope=(getScope,ownerId,epoch,isCurrent)=>{
 const next=getScope?.();
 if(!next||next.ownerId!==ownerId||!Number.isSafeInteger(next.epoch)||next.epoch<1||
  epoch!==undefined&&next.epoch!==epoch||isCurrent?.()!==true)
  throw Error('Family Alpha account or session changed');
 return next.epoch;
};
function validateLiveRecord(item,getItem){
 const current=getItem?.(item.id);
 if(!current||current.id!==item.id||current.image!==item.image||
  sourceOf(current)!==sourceOf(item)||
  identityForSavedGarment(current)!==identityForSavedGarment(item))
  throw Error('Saved original or wardrobe identity changed');
}
function validateFrame(frame){
 if(!frame||!Number.isInteger(frame.width)||!Number.isInteger(frame.height)||
  frame.width<32||frame.height<32||frame.width*frame.height>MAX_PIXELS||
  !(frame.data instanceof Uint8Array||frame.data instanceof Uint8ClampedArray)||
  frame.data.length!==frame.width*frame.height*4)
  throw Error('Invalid decoded JPEG frame');
}
async function jpegDecodedFrame(value){
 if(typeof value!=='string'||!/^data:image\/jpeg;base64,/.test(value)||value.length>11_000_000)
  throw Error('Retained JPEG unavailable');
 if(typeof Image!=='function'||(typeof document==='undefined'||typeof document.createElement!=='function'))
  throw Error('Browser JPEG decoder unavailable');
 const image=new Image();
 image.src=value;
 await image.decode();
 const w=image.naturalWidth,h=image.naturalHeight;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<32||h<32||w*h>MAX_PIXELS)
  throw Error('Retained JPEG dimensions unsafe');
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('JPEG decoding canvas unavailable');
 context.drawImage(image,0,0);
 const frame={width:w,height:h,data:context.getImageData(0,0,w,h).data};
 validateFrame(frame);
 return frame;
}
async function pngImageFromPrepared(prepared){
 if(typeof Image!=='function'||(typeof document==='undefined'||typeof document.createElement!=='function'))
  throw Error('Transparent preview decoder unavailable');
 const {width:w,height:h,rgba}=prepared;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_PIXELS||
  rgba?.length!==w*h*4)throw Error('Invalid prepared image');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Transparent preview canvas unavailable');
 const pixels=ctx.createImageData(w,h);pixels.data.set(rgba);ctx.putImageData(pixels,0,0);
 const preview=new Image();
 preview.src=canvas.toDataURL('image/png');
 await preview.decode();
 if(!preview.complete||preview.naturalWidth!==w||preview.naturalHeight!==h)
  throw Error('Transparent preview decode failed');
 return preview;
}
function reviewOnly(status,reason){return decision(status,reason,{sourceMaskProofPending:true});}

/**
 * Caller must obtain the REAL private owner-scoped item and protect its scope
 * using #263 / #264 before invoking. getScope() must expose {ownerId,epoch}.
 *
 * reviewPreview callback must represent a DIRECT user action in a trusted
 * staging UI ("Use this isolated photo"), not an automatic Boolean. Until
 * explicit approval, no image is returned as an approved garment.
 *
 * Tests can inject decoder and PNG converter with only synthetic JPEGs. In a
 * browser, the defaults decode the REAL retained JPEG and output a PNG image.
 */
export async function prepareReviewedPhotoPresentation({
 item,ownerId,getScope,getItem,isCurrent=()=>true,reviewPreview,
 decodeOriginal=jpegDecodedFrame,makeTransparentImage=pngImageFromPrepared,
 cryptoProvider=globalThis.crypto
}={}){
 if(!item||typeof item.id!=='string'||typeof ownerId!=='string'||
  typeof getScope!=='function'||typeof getItem!=='function'||
  typeof decodeOriginal!=='function'||typeof makeTransparentImage!=='function'||
  typeof isCurrent!=='function')
  return reviewOnly('reject','invalid-owner-or-source-interface');
 let epoch;
 try{
  epoch=validScope(getScope,ownerId,undefined,isCurrent);
  validateLiveRecord(item,getItem);
  const original=sourceOf(item),sourceIdentity=identityForSavedGarment(item);
  const sourceVersion=await fingerprintAlphaRetainedOriginal(original,cryptoProvider);
  const cropSha=await fingerprintSavedCrop(item,cryptoProvider);
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem);
  // Browser default: decode from actual retained JPEG bytes. Decode AGAIN in
  // independent audit so the producer cannot merely attest its own output.
  const frame=await decodeOriginal(original);
  validateFrame(frame);
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem);
  const raw=prepareSyntheticGarmentOriginal(frame,{
   category:item.category,sourceIdentity,sourceVersion
  });
  if(raw.status!=='prepared')return reviewOnly('review',raw.reason);
  if(raw.rgba?.byteLength>MAX_IMAGE_BYTES*4)
   return reviewOnly('review','prepared-garment-too-large');
  const evidence={...raw,itemId:item.id,ownerId,originalSha:sourceVersion,cropSha};
  const audited=await auditMask({
   item,prepared:evidence,ownerId,getScope,getItem,
   decodeOriginal,cryptoProvider,isCurrent
  });
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem);
  // No synthetic ground-truth: even an exact RGB match is REVIEW only.
  if(audited.status!=='review'||audited.reason!=='source-pixels-match-but-matting-unverified')
   return reviewOnly(audited.status==='reject'?'reject':'review',audited.reason);
  if(typeof reviewPreview!=='function')
   return reviewOnly('review','explicit-preview-confirmation-required');
  const preview=await makeTransparentImage(raw);
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem);
  // Keep candidate image ephemeral; never upload or store it. The reviewer
  // must see the actual transparent image next to the original for approval.
  const approved=await reviewPreview(Object.freeze({
   itemId:item.id,ownerId,originalImage:original,transparentImage:preview,
   sourceIdentity,sourceVersion,
   description:'Automatic isolation preview; not realistic fit',
   verifiedOriginalPixels:true,segmentationGroundTruthUnavailable:true
  }));
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem);
  if(approved!==true)return reviewOnly('review','preview-not-approved');
  if(await fingerprintAlphaRetainedOriginal(sourceOf(getItem(item.id)),cryptoProvider)!==sourceVersion||
     await fingerprintSavedCrop(getItem(item.id),cryptoProvider)!==cropSha)
   return reviewOnly('reject','original-or-crop-changed');
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem);
  // A human-approved visual presentation is NOT independent source-mask
  // segmentation proof or an authorization verdict. Caller still requires
  // real Auth + Supabase RLS and must never claim physical virtual try-on.
  return Object.freeze({
   status:'approved-for-staging-preview',reason:'visually-confirmed-source-pixels',
   presentation:Object.freeze({
    itemId:item.id,ownerId,sourceIdentity,sourceVersion,
    approved:true,image:preview,
    humanPreviewConfirmed:true,sourcePixelAuditPassed:true,
    sourceMaskGroundTruthUnverified:true,stagingPreviewOnly:true
   }),
   originalPhotoPreserved:true,syntheticTestsOnlyUntilStagingApproval:true
  });
 }catch(error){
  return reviewOnly('reject',/account|session|identity|wardrobe/i.test(error.message)?
   'account-or-photo-changed':'invalid-retained-original-or-derivative');
 }
}
