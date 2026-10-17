import {decodeReferenceMask} from './garment-mask-metrics.mjs';
import {scoreReviewedShadowCleanup} from './score-reviewed-shadow-cleanup.mjs';
import {validateShadowAnnotation} from './shadow-annotation-validator.mjs';

// Rasterize independently reviewed, normalized polygons at the model's native
// dimensions. A pixel is included when its center is inside any polygon.
// This module never changes the source model prediction or app photo.
function containsPoint(polygon,x,y){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function rasterizeReviewedPolygons(polygons,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>12e6||!Array.isArray(polygons)||!polygons.length)throw Error('Invalid reviewed polygon dimensions or regions');
 for(const polygon of polygons)if(!Array.isArray(polygon)||polygon.length<3||polygon.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('Invalid reviewed polygon coordinates');
 const pixels=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const px=(x+.5)/width,py=(y+.5)/height;
  if(polygons.some(polygon=>containsPoint(polygon,px,py)))pixels[y*width+x]=1;
 }
 return pixels;
}
export function compareApprovedShadowCleanup({annotation,entry,baseline,candidate}){
 const reviewed=validateShadowAnnotation(annotation,entry);
 if(!reviewed.valid)throw Error('Unapproved or invalid shadow outline: '+reviewed.issues.join('; '));
 if(!baseline||!candidate||baseline.width!==candidate.width||baseline.height!==candidate.height||
  baseline.image!==entry.image||candidate.image!==entry.image||
  baseline.sourceSha256!==entry.sourceSha256||candidate.sourceSha256!==entry.sourceSha256)throw Error('Prediction source identity or dimensions mismatch');
 const {width,height}=baseline;
 const garment=rasterizeReviewedPolygons(annotation.regions.garment,width,height);
 const shadow=rasterizeReviewedPolygons(annotation.regions.shadow,width,height);
 const baselineMask=decodeReferenceMask(baseline),candidateMask=decodeReferenceMask(candidate);
 const metrics=scoreReviewedShadowCleanup({baseline:baselineMask,candidate:candidateMask,garment,shadow});
 return {imageId:entry.id,sourceSha256:entry.sourceSha256,width,height,annotationStatus:'independently-approved',experimental:true,productionAuthorized:false,...metrics};
}
