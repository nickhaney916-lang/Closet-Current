'use strict';
// Local display-only alpha bounds and aspect-preserving figure placement.
// These are NOT inferred sleeve, body-pose or fit measurements. Never modify
// the original high-resolution classification/photo source or upload pixels.
(function(root){
 const MAX_PIXELS=1024*1024,FIGURE_WIDTH=647,FIGURE_HEIGHT=1199;
 const CATEGORIES=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
 const valid=(v)=>Number.isFinite(v);
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 function inspectAlpha(rgba,width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<24||height<24||
   width*height>MAX_PIXELS||
   !(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray)||
   rgba.length!==width*height*4)return null;
  let opaque=0,clear=0,minX=width,minY=height,maxX=-1,maxY=-1;
  const threshold=48;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const a=rgba[(y*width+x)*4+3];
   if(a<=24)clear++;
   if(a>=threshold){
    opaque++;minX=Math.min(minX,x);minY=Math.min(minY,y);
    maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   }
  }
  const n=width*height;
  // Entirely opaque photos, tiny flecks and near-empty or ambiguous
  // transparent masks must remain review-only instead of overlaying a box.
  if(clear/n<.04||opaque/n<.025||opaque/n>.94||maxX<minX)return null;
  const boxWidth=maxX-minX+1,boxHeight=maxY-minY+1;
  if(boxWidth<12||boxHeight<12)return null;
  const px=Math.max(2,Math.ceil(boxWidth*.025));
  const py=Math.max(2,Math.ceil(boxHeight*.025));
  const x=Math.max(0,minX-px),y=Math.max(0,minY-py);
  const right=Math.min(width,maxX+px+1),bottom=Math.min(height,maxY+py+1);
  return Object.freeze({
   bounds:Object.freeze({x:minX,y:minY,width:boxWidth,height:boxHeight}),
   crop:Object.freeze({x,y,width:right-x,height:bottom-y}),
   clearFraction:clear/n,visibleFraction:opaque/n,
   originalPhotoChanged:false,sourceColorOrTypeInferred:false,
   fitVerified:false
  });
 }
 function fitPlacement(rect,cutoutWidth,cutoutHeight,category){
  if(!CATEGORIES.includes(category)||!rect||
   !Number.isInteger(cutoutWidth)||!Number.isInteger(cutoutHeight)||
   cutoutWidth<12||cutoutHeight<12||cutoutWidth*cutoutHeight>MAX_PIXELS||
   !['left','top','width','height'].every(k=>valid(rect[k]))||
   rect.left<0||rect.top<0||rect.width<=0||rect.height<=0||
   rect.left+rect.width>100||rect.top+rect.height>100)return null;
  const availWidth=rect.width*FIGURE_WIDTH/100,availHeight=rect.height*FIGURE_HEIGHT/100;
  const scale=Math.min(availWidth/cutoutWidth,availHeight/cutoutHeight);
  const finalWidth=cutoutWidth*scale/FIGURE_WIDTH*100;
  const finalHeight=cutoutHeight*scale/FIGURE_HEIGHT*100;
  // Keep a shirt collar, waistband, dress neckline or coat shoulder at the
  // upper anchor. Shoes anchor against the lower figure/ground baseline.
  const left=rect.left+(rect.width-finalWidth)/2;
  const top=category==='Shoes'?rect.top+rect.height-finalHeight:rect.top;
  if(![left,top,finalWidth,finalHeight].every(valid))return null;
  return Object.freeze({left:clamp(left,0,100),top:clamp(top,0,100),
   width:finalWidth,height:finalHeight,
   aspectPreserved:true,physicalSizeOrDrapeInferred:false,
   anchor:category==='Shoes'?'sole-bottom':'upper-garment'});
 }
 root.ClosetGarmentFitGeometry=Object.freeze({inspectAlpha,fitPlacement});
 if(typeof module!=='undefined')module.exports=root.ClosetGarmentFitGeometry;
})(typeof window!=='undefined'?window:globalThis);
