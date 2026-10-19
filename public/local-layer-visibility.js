'use strict';
// Local diagnostic for ALREADY decoded/approved transparent outfit layers.
// It measures what remains visible after OVERLYING GARMENTS only; it does
// not predict fit, anatomy, skin/hair/hand occlusion, or photorealism.
(function(root){
 const WIDTH=160,HEIGHT=297,MAX_LAYERS=6,PIXELS=WIDTH*HEIGHT;
 function auditAlphaMasks(alphaMasks,width=WIDTH,height=HEIGHT){
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
   width<24||height<24||width*height>60000||
   !Array.isArray(alphaMasks)||alphaMasks.length>MAX_LAYERS||
   !alphaMasks.every(a=>(a instanceof Uint8Array||a instanceof Uint8ClampedArray)&&
    a.length===width*height))return null;
  const remaining=new Float64Array(width*height).fill(1),results=new Array(alphaMasks.length);
  for(let layer=alphaMasks.length-1;layer>=0;layer--){
   const alpha=alphaMasks[layer];
   let total=0,visible=0;
   for(let i=0;i<alpha.length;i++){
    const amount=alpha[i]/255;
    total+=amount;
    visible+=amount*remaining[i];
    remaining[i]*=1-amount;
   }
   const fraction=total>0?Math.min(1,visible/total):null;
   results[layer]=Object.freeze({visibleFraction:fraction,
    measuredAlphaPixels:total,mostlyConcealed:fraction!==null&&fraction<.03,
    sourcePixelsChanged:false,bodyOcclusionMeasured:false,
    visualQualityVerified:false});
  }
  return Object.freeze(results);
 }
 function auditPlacedLayers(layers,createCanvas){
  if(!Array.isArray(layers)||layers.length>MAX_LAYERS||
   typeof createCanvas!=='function')return null;
  const masks=[];
  for(const layer of layers){
   if(!layer||!layer.image||!layer.image.naturalWidth||!layer.image.naturalHeight||
    !layer.rect||!['left','top','width','height'].every(k=>
     Number.isFinite(layer.rect[k])&&layer.rect[k]>=0&&layer.rect[k]<=100)||
    layer.rect.width<=0||layer.rect.height<=0||
    layer.rect.left+layer.rect.width>100.001||
    layer.rect.top+layer.rect.height>100.001)return null;
   try{
    const canvas=createCanvas();
    canvas.width=WIDTH;canvas.height=HEIGHT;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return null;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.drawImage(layer.image,
     layer.rect.left*WIDTH/100,layer.rect.top*HEIGHT/100,
     layer.rect.width*WIDTH/100,layer.rect.height*HEIGHT/100);
    const pixels=ctx.getImageData(0,0,WIDTH,HEIGHT).data;
    if(pixels.length!==PIXELS*4)return null;
    const alpha=new Uint8ClampedArray(PIXELS);
    for(let i=0;i<PIXELS;i++)alpha[i]=pixels[i*4+3];
    masks.push(alpha);
   }catch{return null;}
  }
  return auditAlphaMasks(masks);
 }
 const api=Object.freeze({auditAlphaMasks,auditPlacedLayers,WIDTH,HEIGHT,MAX_LAYERS});
 root.ClosetLayerVisibility=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
