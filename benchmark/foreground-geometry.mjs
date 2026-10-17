import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Diagnostics only: touching frame edges or wide foreground spans are review signals, not deletion rules.
export function foregroundGeometry(prediction){
 const {width,height}=prediction,mask=decodeReferenceMask(prediction);
 let foreground=0,minX=width,minY=height,maxX=-1,maxY=-1,top=0,bottom=0,left=0,right=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(!mask[y*width+x])continue;
  foreground++;if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;
  if(y===0)top++;if(y===height-1)bottom++;if(x===0)left++;if(x===width-1)right++;
 }
 return {foregroundPixels:foreground,frameContacts:{top,bottom,left,right},bounds:foreground?{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}:null,foregroundFraction:foreground/mask.length,needsVisualReview:(top+bottom+left+right)>0};
}
