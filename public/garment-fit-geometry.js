'use strict';
// Pure local sizing for an already verified, alpha-matted display crop.
// Preserve garment aspect ratio and PR #33's distinct figure slot anchors.
// Do not infer fit, sizing, fabric behavior, original-photo type or color.
(function(root){
 const FIGURE_WIDTH=647,FIGURE_HEIGHT=1199;
 // The total pixel budget bounds memory; a 1MP tall cutout can legitimately
 // exceed 1600px on one edge. Rejecting it hid long pants and dresses on retina.
 const safePositiveInt=x=>Number.isSafeInteger(x)&&x>=12;
 const validRect=rect=>!!rect&&['left','top','width','height'].every(k=>Number.isFinite(rect[k]))&&
  rect.left>=0&&rect.top>=0&&rect.width>0&&rect.height>0&&
  rect.left+rect.width<=100&&rect.top+rect.height<=100;
 // Measure an upper-garment silhouette centerline from verified *transparent*
 // cutout pixels only. This is not pose estimation, a body measurement, or
 // a claim that sleeves/necklines were correctly segmented.
 function silhouetteAnchor(pixels,width,height,category){
  if(!['Tops','Bottoms','Dresses','Outerwear'].includes(category)||
   !safePositiveInt(width)||!safePositiveInt(height)||width*height>1024*1024||
   !(pixels instanceof Uint8Array||pixels instanceof Uint8ClampedArray)||
   pixels.length!==width*height*4)return null;
  const start=Math.floor(height*(category==='Bottoms'?.09:.12));
  const end=Math.ceil(height*(category==='Bottoms'?.34:.44));
  const midpoints=[];let spreadSum=0;
  for(let y=start;y<Math.min(height,end);y++){
   let first=width,last=-1,visible=0;
   for(let x=0;x<width;x++){
    if(pixels[(y*width+x)*4+3]<128)continue;
    first=Math.min(first,x);last=x;visible++;
   }
   const span=last-first+1;
   if(last<first||span<width*.18||visible<width*.08)continue;
   midpoints.push((first+last+1)/(2*width));
   spreadSum+=span/width;
  }
  if(midpoints.length<Math.max(6,Math.ceil((end-start)*.35)))return null;
  midpoints.sort((a,b)=>a-b);
  const center=midpoints[Math.floor(midpoints.length/2)];
  const deviation=midpoints.reduce((sum,value)=>sum+Math.abs(value-center),0)/midpoints.length;
  // Irregular visible shapes indicate occlusion, an ambiguous mask or
  // disconnected items. Keep the existing rectangular centering in that case.
  if(deviation>.10||spreadSum/midpoints.length<.22||center<.25||center>.75)return null;
  return Object.freeze({center,verifiedOnlyOnApprovedCutout:true,
   physicalFitOrPoseVerified:false,sourcePixelsChanged:false});
 }
 function fitPlacement(rect,width,height,{slot,category,silhouetteCenter}={}){
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
  // Cap apparent centerline corrections at six percent of the slot and
  // keep the entire image inside the already-calibrated male/female rectangle.
  const adjustment=Number.isFinite(silhouetteCenter)&&silhouetteCenter>=.25&&silhouetteCenter<=.75&&slot!=='shoes'
   ?Math.max(-rect.width*.06,Math.min(rect.width*.06,(0.5-silhouetteCenter)*w)):0;
  const x=Math.min(rect.left+rect.width-w,Math.max(rect.left,
   rect.left+(rect.width-w)/2+adjustment));
  const y=slot==='shoes'?rect.top+rect.height-h:rect.top;
  if(![w,h,x,y].every(Number.isFinite)||w<=0||h<=0)return null;
  return Object.freeze({left:x,top:y,width:w,height:h,
   anchor:slot==='shoes'?'sole-bottom':slot==='bottom'?'waist-top':'upper-garment',
   aspectPreserved:true,sourcePixelsChanged:false,fitVerified:false});
 }
 root.ClosetGarmentFitGeometry=Object.freeze({fitPlacement,silhouetteAnchor});
 if(typeof module!=='undefined')module.exports=root.ClosetGarmentFitGeometry;
})(typeof window!=='undefined'?window:globalThis);
