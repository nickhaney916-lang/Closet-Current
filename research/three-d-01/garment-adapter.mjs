/**
 * One-way adapter from existing recognition/review to an INFERRED 3D template.
 * Does not write/replace original JPEGs, masks, source hashes, or wardrobe data.
 * Existing Work47 alpha review and Work54 landmarks remain the authorities.
 */
import {inspectReviewedCutoutAlpha,requireIsolatedCutoutForPreview}
 from '../work47/cutout-integrity.mjs';
import {suggestStartingFit} from '../work54/starting-fit.mjs';
import {SLOTS} from './geometry.mjs';
const CATEGORY=Object.freeze({Tops:'shirt',Bottoms:'pants',Dresses:'dress'});
const SHA=/^[0-9a-f]{64}$/;
export function adaptGarmentFor3D({category,slot,sourceSHA256,reviewConfirmed=false,
 sampleRGBA,sampleWidth,sampleHeight,fullFrame=null}={}){
 const type=CATEGORY[category];
 if(!type||slot!==SLOTS[type])return {status:'fallback',reason:'unsupported-3d-category',
  humanVisualApproval:false,releaseAuthorized:false};
 if(!SHA.test(sourceSHA256||'')||reviewConfirmed!==true)
  return {status:'fallback',reason:'source-identity-or-manual-review-missing',
   humanVisualApproval:false,releaseAuthorized:false};
 let cutout;
 try{
  cutout=requireIsolatedCutoutForPreview(inspectReviewedCutoutAlpha(
   sampleRGBA,sampleWidth,sampleHeight));
 }catch{
  return {status:'fallback',reason:'opaque-or-unsafe-cutout',
   humanVisualApproval:false,releaseAuthorized:false};
 }
 let startingFit=null;
 if(fullFrame){
  // Reuse existing alpha shoulders/waist inference; never promote a fit guess
  // to 3D body measurements or automatically modify source pixels.
  try{startingFit=suggestStartingFit(fullFrame,{slot});}catch{
   startingFit={status:'fallback',reason:'no-stable-landmarks',ownerApproved:false};
  }
 }
 return Object.freeze({
  status:'preview',type,slot,sourceSHA256,
  alphaStatus:cutout.status,startingFitStatus:startingFit?.status??'not-evaluated',
  surface:'static-garment-template',frontPhotoTexture:'reviewed-original-rgb',
  backFabric:'unverified-plain-material',humanVisualApproval:false,
  requiresHumanReview:true,ownerApproved:false,releaseAuthorized:false,
  privacyScope:'caller-must-verify-current-owner-session'
 });
}
