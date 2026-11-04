import {decodeReferenceMask} from './garment-mask-metrics.mjs';

export function alphaPrediction(alpha,{width,height,image,sourceSha256},threshold=128){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>12e6||alpha?.length!==width*height||!image||!sourceSha256||!Number.isInteger(threshold)||threshold<1||threshold>255)throw Error('Invalid alpha dimensions, identity or threshold');
 const runs=[];let previous=0,count=0,foregroundPixels=0;
 for(const score of alpha){
  if(!Number.isInteger(score)||score<0||score>255)throw Error('Expected 8-bit alpha');
  const bit=score>=threshold?1:0;foregroundPixels+=bit;
  if(bit!==previous){runs.push(count);count=0;previous=bit;}count++;
 }
 runs.push(count);
 return {image,sourceSha256,width,height,runs,foregroundPixels,foregroundThreshold:threshold};
}
export function compareCutoutMasks(baseline,candidate){
 if(baseline.image!==candidate.image||baseline.sourceSha256!==candidate.sourceSha256||baseline.width!==candidate.width||baseline.height!==candidate.height)throw Error('Cutout source or dimensions mismatch');
 const a=decodeReferenceMask(baseline),b=decodeReferenceMask(candidate);let addedPixels=0,removedPixels=0,sharedPixels=0;
 for(let i=0;i<a.length;i++){if(a[i]&&b[i])sharedPixels++;else if(b[i])addedPixels++;else if(a[i])removedPixels++;}
 return {addedPixels,removedPixels,sharedPixels,notAccuracy:true,verifiedShadowRemoval:false,verifiedGarmentRecovery:false};
}
export function sharpSourceCutout(rgb,prediction){
 const mask=decodeReferenceMask(prediction);
 if(rgb?.length!==mask.length*3)throw Error('Expected original RGB pixels');
 const rgba=new Uint8Array(mask.length*4);
 for(let i=0;i<mask.length;i++){rgba[4*i]=rgb[3*i];rgba[4*i+1]=rgb[3*i+1];rgba[4*i+2]=rgb[3*i+2];rgba[4*i+3]=mask[i]?255:0;}
 return rgba;
}
