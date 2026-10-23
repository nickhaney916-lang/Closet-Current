/**
 * Offline 2D outfit compositor. Strictly a preview, not a fit simulator.
 * Source photos and masks are never modified.
 */
import {composeGarmentPreview} from './garment-preview-warp.mjs';
import {planPosePlacement} from './pose-placement.mjs';
const order=['shoes','bottom','dress','top','jacket','coat'];
export function composeOutfitPreview({accountId,pose,canvasWidth,canvasHeight,items}) {
 if(!Array.isArray(items)||items.length>6)throw new Error('Invalid outfit items');
 const slots=new Set();
 for(const item of items){
  if(!item||!order.includes(item.slot)||slots.has(item.slot))throw new Error('Duplicate or invalid garment slot');
  slots.add(item.slot);
 }
 if(slots.has('dress')&&['bottom','top'].some(s=>slots.has(s)))throw new Error('Dress conflicts with separates');
 const sorted=[...items].sort((a,b)=>order.indexOf(a.slot)-order.indexOf(b.slot));
 let output=null;
 const sources=[];
 for(const item of sorted){
  const {targetBox}=planPosePlacement({slot:item.slot,pose,canvasWidth,canvasHeight});
  const layer=composeGarmentPreview({accountId,garment:item.garment,mask:item.mask,canvasWidth,canvasHeight,sourceBox:item.sourceBox,targetBox});
  if(!output)output=new Uint8ClampedArray(layer.pixels.length);
  for(let i=0;i<output.length;i+=4){
   const sa=layer.pixels[i+3]/255,da=output[i+3]/255,a=sa+da*(1-sa);
   if(!a)continue;
   for(let c=0;c<3;c++)output[i+c]=Math.round((layer.pixels[i+c]*sa+output[i+c]*da*(1-sa))/a);
   output[i+3]=Math.round(a*255);
  }
  sources.push({slot:item.slot,originalSha256:layer.originalSha256});
 }
 if(!output){
  planPosePlacement({slot:'top',pose,canvasWidth,canvasHeight});
  output=new Uint8ClampedArray(canvasWidth*canvasHeight*4);
 }
 return {width:canvasWidth,height:canvasHeight,pixels:output,sources,fitSimulation:false,renderMethod:'offline-2d-layer-composition'};
}
