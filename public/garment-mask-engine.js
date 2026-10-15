'use strict';
(function(root){
 // Shared pixel-mask operations for camera captures, imported pictures and outfit cutouts.
 // Keep the original image separately: a mask is always reversible.
 function create(width,height,filled=true){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>12000000)throw Error('Invalid mask dimensions');
  const alpha=new Uint8Array(width*height);if(filled)alpha.fill(255);
  return {width,height,alpha};
 }
 function paint(mask,cx,cy,radius,mode='add'){
  if(!mask||mask.alpha?.length!==mask.width*mask.height||![cx,cy,radius].every(Number.isFinite)||radius<=0||!['add','erase'].includes(mode))throw Error('Invalid mask brush');
  const left=Math.max(0,Math.floor(cx-radius)),right=Math.min(mask.width-1,Math.ceil(cx+radius));
  const top=Math.max(0,Math.floor(cy-radius)),bottom=Math.min(mask.height-1,Math.ceil(cy+radius));
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if((x-cx)**2+(y-cy)**2<=radius**2)mask.alpha[y*mask.width+x]=mode==='add'?255:0;
  return mask;
 }
 function stroke(mask,x0,y0,x1,y1,radius,mode='add'){
  if(![x0,y0,x1,y1].every(Number.isFinite))throw Error('Invalid mask stroke');
  const steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/Math.max(1,radius/2)));
  for(let i=0;i<=steps;i++)paint(mask,x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps,radius,mode);
  return mask;
 }
 function apply(pixels,mask,{background=[255,255,255],transparent=false}={}){
  if(!mask||pixels?.length!==mask.width*mask.height*4||mask.alpha?.length!==mask.width*mask.height||background.length!==3)throw Error('Invalid mask image');
  const output=new Uint8ClampedArray(pixels.length);
  for(let i=0;i<mask.alpha.length;i++){
   const offset=i*4,a=mask.alpha[i]/255*(pixels[offset+3]/255);
   for(let c=0;c<3;c++)output[offset+c]=transparent?pixels[offset+c]:Math.round(pixels[offset+c]*a+background[c]*(1-a));
   output[offset+3]=transparent?Math.round(a*255):255;
  }
  return output;
 }
 const api={create,paint,stroke,apply};root.GarmentMaskEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
