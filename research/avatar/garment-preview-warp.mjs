/**
 * Local-only, deterministic garment positioning with inverse-mapped bilinear sampling.
 * This is 2D preview warping, NOT realistic drape, physical fit or generative try-on.
 * Caller must provide a licensed original RGBA image and reviewed original-resolution mask.
 */
import {isolateLicensedGarment} from './licensed-garment-transfer.mjs';

function validBox(b) {
 return b && [b.x,b.y,b.width,b.height].every(Number.isFinite) &&
 b.width>0 && b.height>0;
}
export function composeGarmentPreview({accountId,garment,mask,canvasWidth,canvasHeight,sourceBox,targetBox}) {
 if(!Number.isInteger(canvasWidth)||!Number.isInteger(canvasHeight)||canvasWidth<1||canvasHeight<1||
 canvasWidth*canvasHeight>16000000)throw new Error('Invalid output dimensions');
 if(!validBox(sourceBox)||!validBox(targetBox))throw new Error('Invalid placement geometry');
 const src=isolateLicensedGarment({accountId,garment,mask});
 if(sourceBox.x<0||sourceBox.y<0||sourceBox.x+sourceBox.width>src.width||
 sourceBox.y+sourceBox.height>src.height)throw new Error('Source bounds exceeded');
 const out=new Uint8ClampedArray(canvasWidth*canvasHeight*4);
 const minX=Math.max(0,Math.floor(targetBox.x)),maxX=Math.min(canvasWidth,Math.ceil(targetBox.x+targetBox.width));
 const minY=Math.max(0,Math.floor(targetBox.y)),maxY=Math.min(canvasHeight,Math.ceil(targetBox.y+targetBox.height));
 for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
  const u=(x+.5-targetBox.x)/targetBox.width,v=(y+.5-targetBox.y)/targetBox.height;
  if(u<0||u>=1||v<0||v>=1)continue;
  const sx=sourceBox.x+u*sourceBox.width-.5,sy=sourceBox.y+v*sourceBox.height-.5;
  const x0=Math.max(0,Math.min(src.width-1,Math.floor(sx)));
  const y0=Math.max(0,Math.min(src.height-1,Math.floor(sy)));
  const x1=Math.min(src.width-1,x0+1),y1=Math.min(src.height-1,y0+1);
  const fx=Math.max(0,Math.min(1,sx-x0)),fy=Math.max(0,Math.min(1,sy-y0));
  const samples=[[x0,y0,(1-fx)*(1-fy)],[x1,y0,fx*(1-fy)],[x0,y1,(1-fx)*fy],[x1,y1,fx*fy]];
  let alpha=0,red=0,green=0,blue=0;
  for(const [px,py,w] of samples){
   const i=(py*src.width+px)*4,a=src.pixels[i+3]/255*w;
   alpha+=a;red+=src.pixels[i]*a;green+=src.pixels[i+1]*a;blue+=src.pixels[i+2]*a;
  }
  const j=(y*canvasWidth+x)*4;
  if(alpha>0){out[j]=red/alpha;out[j+1]=green/alpha;out[j+2]=blue/alpha;out[j+3]=Math.round(alpha*255);}
 }
 return {width:canvasWidth,height:canvasHeight,pixels:out,originalSha256:src.originalSha256,fitSimulation:false,renderMethod:'2d-masked-bilinear-preview'};
}
