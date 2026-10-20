'use strict';
// Safe, bounded pixel sampling for already-transparent, local garment cutouts.
// Not used for recognition/classification. Deliberately retain the established
// 600K conservative sampling for opaque, unapproved product photos.
(function(root){
 const BASE_PIXELS=600000,RETINA_PIXELS=1000000,MAX_DPR=4;
 function size(width,height,dpr=1){
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
   width<24||height<24||width*height>20000000)return null;
  const density=Number.isFinite(dpr)?Math.min(MAX_DPR,Math.max(1,dpr)):1;
  const limit=density>=2?RETINA_PIXELS:BASE_PIXELS;
  const scale=Math.min(1,Math.sqrt(limit/(width*height)));
  const w=Math.max(24,Math.floor(width*scale));
  const h=Math.max(24,Math.floor(height*scale));
  if(w>width||h>height||w*h>limit)return null;
  return Object.freeze({width:w,height:h,scale,pixels:w*h,limit,
   retina:density>=2,recognitionOriginalChanged:false,
   masksAutoApproved:false,figureFitVerified:false});
 }
 const api=Object.freeze({size,BASE_PIXELS,RETINA_PIXELS});
 root.ClosetPreviewSampling=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
