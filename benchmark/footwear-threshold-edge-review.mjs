// Compare TWO pinned model thresholds on the same ORIGINAL sneaker photo.
// Model disagreement is a review priority, never recovered material or accuracy.
import {decodeReferenceMask} from './garment-mask-metrics.mjs';

export function footwearThresholdEdgeReview(standard,strict,{lowerFraction=.30}={}){
 if(!standard||!strict||standard.image!==strict.image||
   standard.sourceSha256!==strict.sourceSha256||
   standard.width!==strict.width||standard.height!==strict.height||
   standard.foregroundThreshold!==128||strict.foregroundThreshold!==224||
   !Number.isFinite(lowerFraction)||lowerFraction<=0||lowerFraction>.5)
  throw Error('Different shoe sources, dimensions or unpinned alpha thresholds');
 const a=decodeReferenceMask(standard),b=decodeReferenceMask(strict);
 const {width:w,height:h}=standard;
 let minY=h,maxY=-1,maxX=-1,minX=w,positive=0,strictTotal=0;
 for(let i=0;i<a.length;i++){
  if(b[i]&&!a[i])throw Error('Strict alpha mask must be subset of 128 alpha mask');
  if(!a[i])continue;
  positive++;
  const x=i%w,y=Math.floor(i/w);
  minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);
 }
 if(!positive)return {sourceSha256:standard.sourceSha256,standardPixels:0,
  strictPixels:0,discardedPixels:0,lowerCandidatePixels:0,lowerDiscardedPixels:0,
  lowerBandStartRow:null,lowerBandFractionOfCandidate:lowerFraction,
  discardShare:null,lowerDiscardShare:null,reviewOnly:true,
  verifiedSoleOrToeRetention:false,pixelAccuracyMeasured:false,
  productionAuthorized:false,originalSourceChanged:false};
 const cutoff=Math.max(minY,Math.floor(maxY-(maxY-minY)*lowerFraction));
 let lower=0,lowerRemoved=0,removed=0;
 for(let i=0;i<a.length;i++){
  if(!a[i])continue;
  const y=Math.floor(i/w);
  if(!b[i])removed++;
  if(y>=cutoff){lower++;if(!b[i])lowerRemoved++;}
 }
 strictTotal=positive-removed;
 return {sourceSha256:standard.sourceSha256,
  standardPixels:positive,strictPixels:strictTotal,discardedPixels:removed,
  predictedBounds:{left:minX,top:minY,right:maxX+1,bottom:maxY+1},
  lowerBandStartRow:cutoff,lowerBandFractionOfCandidate:lowerFraction,
  lowerCandidatePixels:lower,lowerDiscardedPixels:lowerRemoved,
  discardShare:+(removed/positive).toFixed(5),
  lowerDiscardShare:lower?+(lowerRemoved/lower).toFixed(5):null,
  // The toe may point horizontally or upward. This bottom-of-model-mask
  // band is NOT guaranteed to contain the true sole or heel.
  lowerBandIsNotAnApprovedSoleMask:true,
  reviewOnly:true,verifiedSoleOrToeRetention:false,
  pixelAccuracyMeasured:false,productionAuthorized:false,
  originalSourceChanged:false};
}
