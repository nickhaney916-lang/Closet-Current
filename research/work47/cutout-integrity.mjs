/**
 * Family Alpha #57: assess actual reviewed RGBA cutout transparency.
 * A file being encoded as image/png is NOT proof the background was removed.
 *
 * Conservative guard: block only a clearly unisolated opaque rectangle.
 * Lesser alpha / border concerns are REVIEW, not automatic erasure or approval.
 *
 * This consumes a temporary in-memory downsampled ImageData buffer only.
 * No RGB edits, cloud, storage, network, recognition, source replacement, or AI.
 */
export function inspectReviewedCutoutAlpha(rgba,width,height){
 if(!(rgba instanceof Uint8ClampedArray)||
    !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<16||height<16||width*height>240*240||
    rgba.length!==width*height*4)
  throw Error('A bounded decoded cutout alpha sample is required');
 const total=width*height;
 let solid=0,transparent=0,translucent=0;
 let borderSolid=0,borderTotal=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const alpha=rgba[(y*width+x)*4+3];
  if(alpha>=250)solid++;
  else if(alpha<=16)transparent++;
  else translucent++;
  if(x===0||y===0||x===width-1||y===height-1){
   borderTotal++;
   if(alpha>=250)borderSolid++;
  }
 }
 const cornerIndices=[0,width-1,(height-1)*width,total-1];
 const solidCorners=cornerIndices.reduce((n,i)=>n+(rgba[i*4+3]>=250?1:0),0);
 const solidRatio=solid/total;
 const transparentRatio=transparent/total;
 const perimeterSolidRatio=borderSolid/borderTotal;
 const nearOpaqueRectangle=solidCorners===4&&solidRatio>=.98&&perimeterSolidRatio>=.95;
 const unisolated=solid===total||nearOpaqueRectangle;
 const borderRisk=solidCorners>=3||perimeterSolidRatio>=.80;
 const status=unisolated?'BLOCK_UNISOLATED_RECTANGLE':
  borderRisk?'REVIEW_POSSIBLE_BACKGROUND':
  translucent===0?'REVIEW_HARD_BINARY_EDGE':'REVIEW_REAL_CUTOUT';
 return Object.freeze({
  status,
  previewAllowed:!unisolated,
  // Not an aesthetic assessment. Review every passed mask manually.
  humanVisualApproval:false,
  total,solid,transparent,translucent,solidCorners,
  solidRatio,transparentRatio,perimeterSolidRatio
 });
}
export function requireIsolatedCutoutForPreview(assessment){
 if(!assessment||assessment.previewAllowed!==true||
    !['REVIEW_POSSIBLE_BACKGROUND','REVIEW_HARD_BINARY_EDGE','REVIEW_REAL_CUTOUT'].includes(assessment.status)||
    assessment.humanVisualApproval!==false)
  throw Error('Cutout is opaque or rectangular; return to original photo and review background removal');
 return assessment;
}
