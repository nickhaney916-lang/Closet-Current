'use strict';
// Pure local sizing for an already verified, alpha-matted display crop.
// Preserve garment aspect ratio and PR #33's distinct figure slot anchors.
// Do not infer fit, sizing, fabric behavior, original-photo type or color.
(function(root){
 const FIGURE_WIDTH=647,FIGURE_HEIGHT=1199;
 const safePositiveInt=x=>Number.isSafeInteger(x)&&x>=12&&x<=1600;
 const validRect=rect=>!!rect&&['left','top','width','height'].every(k=>Number.isFinite(rect[k]))&&
  rect.left>=0&&rect.top>=0&&rect.width>0&&rect.height>0&&
  rect.left+rect.width<=100&&rect.top+rect.height<=100;
 function fitPlacement(rect,width,height,{slot,category}={}){
  if(!validRect(rect)||!safePositiveInt(width)||!safePositiveInt(height)||
   width*height>1024*1024||
   !['top','bottom','layer','layer2','layer3','shoes'].includes(slot)||
   !['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(category))return null;
  if((slot==='bottom'&&category!=='Bottoms')||
     (slot==='shoes'&&category!=='Shoes')||
     (slot==='top'&&!['Tops','Dresses'].includes(category))||
     (['layer','layer2','layer3'].includes(slot)&&!['Tops','Outerwear'].includes(category))||
     (slot!=='shoes'&&category==='Shoes'))return null;
  const boxW=rect.width*FIGURE_WIDTH/100,boxH=rect.height*FIGURE_HEIGHT/100;
  const scale=Math.min(boxW/width,boxH/height);
  const w=100*width*scale/FIGURE_WIDTH,h=100*height*scale/FIGURE_HEIGHT;
  const x=rect.left+(rect.width-w)/2;
  const y=slot==='shoes'?rect.top+rect.height-h:rect.top;
  if(![w,h,x,y].every(Number.isFinite)||w<=0||h<=0)return null;
  return Object.freeze({left:x,top:y,width:w,height:h,
   anchor:slot==='shoes'?'sole-bottom':slot==='bottom'?'waist-top':'upper-garment',
   aspectPreserved:true,sourcePixelsChanged:false,fitVerified:false});
 }
 root.ClosetGarmentFitGeometry=Object.freeze({fitPlacement});
 if(typeof module!=='undefined')module.exports=root.ClosetGarmentFitGeometry;
})(typeof window!=='undefined'?window:globalThis);
