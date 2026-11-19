/**
 * Genuine original Met museum JPEG + independently reproduced conservative
 * OpenCV alpha -> original source RGB on a photo-space UV FRONT only.
 *
 * IMPORTANT: mask is machine-proposed and UNAPPROVED, not ground truth.
 * Only museum photo 2551406 has a VERIFIED "a) front" caption. Other
 * views have no verified part/side, even if visually plausible.
 *
 * No wearer, calibrated camera, hidden cloth, 163-bone skinning, contact,
 * consumer garment, real human rating, private photo, or deployment.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {buildObservedPhotoPanel86} from '../mission2-p86/photo-panel.mjs';
import {assessMet70759PhotoPartViewEvidence89 as roleGate}
 from './met-four-photo-chromatic-silhouette89.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const evidence=Object.freeze({
 2551406:Object.freeze({
  h:933,decoded:'e0b7738db57ac4b7c27d4f03f724442f53c8e85f09f7a139839dfaa04c86cbec',
  maskPNG:'34a93a1a8a2ea58f92a560703936a83b390e92a50d7103ff7ff1586ffe0841aa',
  maskRaw:'757b7c16161de68151c98d514907a6a1004259ae43fcfb7c1a8aa1fa72febfd4',
  corePixels:689892,uncertainPixels:13913
 }),
 2551408:Object.freeze({
  h:978,decoded:'dddbda448c32667a0ab5c1b90a43d139b5917c1b9955dc428987beec035e06c0',
  maskPNG:'c16a1610430c76fbeca0a2bb8f6dd1f667853a6c40df01857ee816406cc1b0a5',
  maskRaw:'5bdacf5496d6502f867864bdcfacca009922d11491f0bf30bf57c5845efe9002',
  corePixels:734563,uncertainPixels:629
 })
});
const refusal=reason=>Object.freeze({
 schema:'M2-Met-original-museum-photo-conservative-mask-UV-front/v1',
 status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,
 genuineSourceJPEGAndMaskAccepted:false,
 masksHumanApproved:false,sourceBackObserved:false,
 consumer3DAdmitted:false,releaseAuthorized:false,
 originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
});
/** The institutional JPEG and conservative mask PNG must already have been
 * sourced by scripts/test-parallel89-met-four-original-photo-silhouettes.mjs
 * and scripts/test-parallel89-met-four-real-full-masks.py respectively.
 * Those scripts separately verify institutional origin / algorithm receipts.
 * This function verifies the actual BYTES again, rather than trusting caller
 * flags, passed-in captions, fake hashes, or a fabricated source-role.
 */
export async function buildMetOriginalMaskTexturedFront89({
 imageId, originalJPEGBytes, conservativeMaskPNGBytes, sampleWidth=192
}={}){
 const rec=evidence[imageId];
 if(!rec||!Number.isSafeInteger(imageId))return refusal('unknown-original-Met-gallery-photo');
 if(!(originalJPEGBytes instanceof Uint8Array)||
    originalJPEGBytes.length<10000||originalJPEGBytes[0]!==255||
    originalJPEGBytes[1]!==216||originalJPEGBytes[2]!==255)
  return refusal('actual-institutional-original-JPEG-required');
 if(!(conservativeMaskPNGBytes instanceof Uint8Array)||
    sha(conservativeMaskPNGBytes)!==rec.maskPNG)
  return refusal('conservative-original-mask-PNG-hash-mismatch');
 if(!Number.isSafeInteger(sampleWidth)||sampleWidth<32||sampleWidth>256)
  return refusal('bounded-photo-front-sampling-required');
 try{
  const jpegSHA256=sha(originalJPEGBytes);
  const {data:rgb,info:src}=await sharp(originalJPEGBytes,{
   failOn:'error',limitInputPixels:1500000
  }).removeAlpha().raw().toBuffer({resolveWithObject:true});
  if(src.width!==1200||src.height!==rec.h||src.channels!==3||
     rgb.length!==1200*rec.h*3||sha(rgb)!==rec.decoded)
   return refusal('institutional-JPEG-decoded-RGB-source-identity-wrong');
  const {data:mask,info:mi}=await sharp(conservativeMaskPNGBytes,{
   failOn:'error',limitInputPixels:1500000
  }).greyscale().raw().toBuffer({resolveWithObject:true});
  if(mi.width!==1200||mi.height!==rec.h||mi.channels!==1||
    mask.length!==1200*rec.h||sha(mask)!==rec.maskRaw)
   return refusal('original-full-resolution-alpha-proposal-not-bitwise-verified');
  let foreground=0;
  for(const v of mask){if(v!==0&&v!==255)
    return refusal('nonbinary-original-foreground-alpha');if(v===255)foreground++;}
  if(foreground!==rec.corePixels)
   return refusal('conservative-foreground-pixel-count-mismatch');
  const role=roleGate({
   imageId,decodedRGBSHA256:sha(rgb),
   originalMuseumObjectNumber:'1983.21a, b',
   actualOriginalJPEGAttested:true,actualDecodedRGBHashIndependentlyChecked:true
  });
  if(role.source2DPhotographAllowed!==true||role.consumer3DAdmitted!==false)
   return refusal('source-role-and-2d-eligibility-not-verified');
  const w=sampleWidth,h=Math.round(sampleWidth*rec.h/1200);
  const alpha=new Uint8Array(w*h),texture=new Uint8Array(w*h*4);
  let kept=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.min(1199,Math.floor((x+.5)*1200/w));
   const sy=Math.min(rec.h-1,Math.floor((y+.5)*rec.h/h));
   const sourceIdx=sy*1200+sx,destIdx=y*w+x;
   // Conservative core only: NOT union, disputed region or source background.
   if(mask[sourceIdx]!==255)continue;
   alpha[destIdx]=255;kept++;
   const sr=sourceIdx*3,d=destIdx*4;
   texture[d]=rgb[sr];texture[d+1]=rgb[sr+1];
   texture[d+2]=rgb[sr+2];texture[d+3]=255;
  }
  const alphaDigest=sha(alpha);
  const front=buildObservedPhotoPanel86({
   alpha,width:w,height:h,sourceSHA256:jpegSHA256,maskSHA256:alphaDigest
  });
  if(kept!==front.receipt.foregroundPixels)
   return refusal('original-photo-front-geometry-and-mask-disagree');
  // Critical: this is an observed pixel-domain surface, not a physical
  // reconstructed garment. The only acceptable consumer mode is ORIGINAL 2D.
  return {
   schema:'M2-Met-original-museum-photo-conservative-mask-UV-front/v1',
   status:'REAL_ORIGINAL_PHOTO_SOURCE_MASK_TEXTURED_FRONT_RESEARCH_UNAPPROVED',
   imageId,sourceMuseumObjectNumber:'1983.21a, b',
   actualOriginalJPEGByteSHA256:jpegSHA256,
   independentlyValidatedOriginalDecodedRGBSHA256:sha(rgb),
   originalMaskPNG_SHA256:sha(conservativeMaskPNGBytes),
   originalConservativeMaskRawSHA256:sha(mask),
   originalMaskForegroundPixels:foreground,
   originalSourceBoundaryUncertaintyExcludedPixels:rec.uncertainPixels,
   downsampledWidth:w,downsampledHeight:h,
   conservativeSampledSourcePixels:kept,provisionalSampleAlphaSHA256:alphaDigest,
   textureRGBA: texture,originalSourceTextureRGBA_SHA256:sha(texture),
   originalPixelUV:front.uv,positions:front.positions,indices:front.indices,
   originalPixelTransfer:'source-RGB-nearest-sample-masked-core-only',
   museumExactCaption:role.museumExactCaption,
   museumCaptionVerified:role.museumCaptionVerified,
   institutionallyVerifiedPart:role.institutionallyVerifiedPart,
   institutionallyVerifiedSide:role.institutionallyVerifiedSide,
   twoIndependentPhotoSeededMasksNotExpertGroundTruth:true,
   maskBoundaryDisputedNotHumanApproved:true,
   sourceCameraAndGarmentScaleUnverified:true,
   sourceFrontPanelNotWearableVolume:true,
   original3DBackSideUnverified:true,
   sourceFitted163BoneAvatars:false,
   sourceLayeredOutfitFitProved:false,
   sourceRealismHumanAccepted:false,
   consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
   releaseAuthorized:false,familyAlpha:'HOLD'
  };
 }catch{return refusal('decoded-museum-source-or-mask-proposal-invalid');}
}
