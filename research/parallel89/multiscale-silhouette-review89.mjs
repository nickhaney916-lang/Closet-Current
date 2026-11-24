/** Public research only. Compare the existing automatic extraction with
 * separately sampled resolutions. Agreement is NOT human mask ground truth.
 * Never promote an uncertain or background baseline pixel to foreground.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {attestOriginalSource89} from './source-contract.mjs';
import {proposeBorderMask89,proposeOriginalPhotoMask89} from './multicategory-border-mask89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const hold={consumer3DAdmitted:false,maskGroundTruthApproved:false,originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'};
const refuse=(reason,identity={})=>({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,...identity,...hold});
function valid(p){
 return p?.status==='UNREVIEWED_BORDER_MASK_PROPOSAL'&&Number.isSafeInteger(p.width)&&Number.isSafeInteger(p.height)&&p.width>=8&&p.height>=8&&p.width<=256&&p.height<=256&&
  [p.alpha,p.uncertain,p.background].every(a=>a instanceof Uint8Array&&a.length===p.width*p.height)&&
  sha(p.alpha)===p.maskSHA256&&sha(p.uncertain)===p.uncertaintySHA256&&sha(p.background)===p.backgroundSHA256&&
  p.alpha.every((a,i)=>[a,p.uncertain[i],p.background[i]].every(x=>x===0||x===255)&&a+p.uncertain[i]+p.background[i]===255);
}
export function compareMaskScales89(primary,alternates){
 if(!valid(primary)||!Array.isArray(alternates)||alternates.length!==2||!alternates.every(valid))return refuse('all-three-bounded-mask-proposals-required');
 const {width:w,height:h}=primary,n=w*h;
 const alpha=new Uint8Array(n),uncertain=new Uint8Array(n),background=new Uint8Array(n),disagreement=new Uint8Array(n);
 const label=(p,i)=>p.alpha[i]?1:p.background[i]?2:0;
 let foregroundPixels=0,uncertainPixels=0,backgroundPixels=0,disagreementPixels=0,withdrawnForegroundPixels=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,a=label(primary,i);
  const votes=alternates.map(p=>label(p,Math.floor((y+.5)*p.height/h)*p.width+Math.floor((x+.5)*p.width/w)));
  if(votes.some(v=>v!==a)){disagreement[i]=255;disagreementPixels++;}
  if(a===1&&votes.every(v=>v===1)){alpha[i]=255;foregroundPixels++;}
  else if(a===2&&votes.every(v=>v===2)){background[i]=255;backgroundPixels++;}
  else {uncertain[i]=255;uncertainPixels++;if(a===1)withdrawnForegroundPixels++;}
 }
 const reviewPriority=foregroundPixels===0||uncertainPixels>foregroundPixels?'HIGH_UNCERTAINTY_REVIEW_REQUIRED':'UNREVIEWED_STABLE_CANDIDATE';
 return {status:'MULTISCALE_SILHOUETTE_REVIEW_ONLY',width:w,height:h,alpha,uncertain,background,disagreement,foregroundPixels,uncertainPixels,backgroundPixels,disagreementPixels,withdrawnForegroundPixels,reviewPriority,maskSHA256:sha(alpha),uncertaintySHA256:sha(uncertain),backgroundSHA256:sha(background),disagreementSHA256:sha(disagreement),baselineMaskSHA256:primary.maskSHA256,...hold};
}
export async function reviewOriginalSilhouette89({sourceId,originalBytes,lockedRecord}={}){
 try{
  if(!(originalBytes instanceof Uint8Array)||originalBytes.length>32*1024*1024)return refuse('invalid-original');
  const bytes=Buffer.from(originalBytes),record=structuredClone(lockedRecord);
  const s=attestOriginalSource89({sourceId,originalBytes:bytes,lockedRecord:record});
  if(s.status!=='ORIGINAL_JPEG_VERIFIED')return refuse('source-not-attested');
  const identity={sourceId,category:s.category,originalSHA256:s.originalSHA256};
  const primary=await proposeOriginalPhotoMask89({sourceId,originalBytes:bytes,lockedRecord:record});
  if(!valid(primary))return refuse('baseline-mask-abstained',identity);
  const {data,info}=await sharp(bytes,{failOn:'error',limitInputPixels:16000000}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  if(info.channels!==3||data.length!==info.width*info.height*3||sha(data)!==primary.decodedRGBSHA256)return refuse('decoded-source-mismatch',identity);
  const alt=[128,256].map(max=>{
   const scale=Math.min(1,max/Math.max(info.width,info.height)),w=Math.round(info.width*scale),h=Math.round(info.height*scale);
   const rgb=new Uint8Array(w*h*3);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sx=Math.floor((x+.5)*info.width/w),sy=Math.floor((y+.5)*info.height/h),i=3*(sy*info.width+sx);
    rgb.set(data.subarray(i,i+3),3*(y*w+x));
   }
   return proposeBorderMask89({rgb,width:w,height:h});
  });
  const result=compareMaskScales89(primary,alt);
  return {...result,...identity,decodedRGBSHA256:sha(data),primaryDimensions:[primary.width,primary.height],alternateDimensions:alt.map(p=>[p.width??null,p.height??null]),baselineForegroundPixels:primary.foregroundPixels,baselineUncertainPixels:primary.uncertainPixels};
 }catch{return refuse('review-processing-failed');}
}
