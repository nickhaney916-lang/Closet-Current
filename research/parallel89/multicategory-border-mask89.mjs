/** Public research only: conservative source-pixel background separation.
 * Does not identify garment class, approve segmentation, infer hidden surfaces,
 * or admit any consumer mesh. Ambiguous colors remain explicitly uncertain.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {attestOriginalSource89} from './source-contract.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const hold={consumer3DAdmitted:false,maskGroundTruthApproved:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const refuse=reason=>({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,...hold});
export function proposeBorderMask89({rgb,width:w,height:h}={}){
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<8||h<8||w>256||h>256||!(rgb instanceof Uint8Array)||rgb.length!==w*h*3)return refuse('invalid-bounded-rgb');
 const n=w*h,border=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1)border.push(y*w+x);
 const median=c=>border.map(i=>rgb[3*i+c]).sort((a,b)=>a-b)[Math.floor(border.length/2)];
 const bg=[median(0),median(1),median(2)];
 const dist=new Uint16Array(n);
 const color=i=>[rgb[3*i],rgb[3*i+1],rgb[3*i+2]];
 const gap=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
 let model='uniform-border-median';
 for(let i=0;i<n;i++)dist[i]=gap(bg,color(i));
 let consensus=border.filter(i=>dist[i]<=18).length/border.length;
 if(consensus<0.8){
  // A smooth lighting/backdrop gradient is a distinct model, not a looser
  // foreground threshold. Validate the field on all four observed borders.
  const corners=[color(0),color(w-1),color((h-1)*w),color(n-1)];
  for(let i=0;i<n;i++){
   const x=(i%w)/(w-1),y=Math.floor(i/w)/(h-1);
   const expected=corners[0].map((v,c)=>(1-y)*((1-x)*v+x*corners[1][c])+y*((1-x)*corners[2][c]+x*corners[3][c]));
   dist[i]=Math.round(gap(expected,color(i)));
  }
  consensus=border.filter(i=>dist[i]<=18).length/border.length;
  const sides=[border.filter(i=>i<w),border.filter(i=>i>=n-w),border.filter(i=>i%w===0),border.filter(i=>i%w===w-1)];
  if(consensus>=0.8&&sides.every(side=>side.filter(i=>dist[i]<=18).length/side.length>=0.65))model='bilinear-corner-field';
  else{
   // A bounded palette must have evidence on multiple border sides.
   // Colors supported only by an isolated edge object cannot seed a model.
   const candidates=border.filter((_,j)=>j%2===0).map(color);
   const entries=candidates.map(c=>({c,cover:border.filter(i=>gap(c,color(i))<=18),sides:sides.filter(side=>side.filter(i=>gap(c,color(i))<=18).length>=Math.max(3,side.length*.05)).length}))
    .filter(e=>e.sides>=2&&e.cover.length>=border.length*.05);
   const covered=new Set(),palette=[];
   while(palette.length<8){
    let best=null,gain=0;
    for(const e of entries){const g=e.cover.filter(i=>!covered.has(i)).length;if(g>gain){best=e;gain=g}}
    if(!best||gain<border.length*.02)break;
    palette.push(best.c);for(const i of best.cover)covered.add(i);
    if(covered.size/border.length>=0.9)break;
   }
   if(!palette.length)return refuse('border-color-not-consistent');
   for(let i=0;i<n;i++)dist[i]=Math.min(...palette.map(c=>gap(c,color(i))));
   consensus=border.filter(i=>dist[i]<=18).length/border.length;
   if(consensus<0.8||!sides.every(side=>side.filter(i=>dist[i]<=18).length/side.length>=0.65))return refuse('border-color-not-consistent');
   model='cross-side-color-palette';
  }
 }
 function flood(max){
  const seen=new Uint8Array(n),q=new Int32Array(n);let end=0,start=0;
  function add(i){if(!seen[i]&&dist[i]<=max){seen[i]=1;q[end++]=i;}}
  for(const i of border)add(i);
  while(start<end){const i=q[start++],x=i%w,y=Math.floor(i/w);if(x>0)add(i-1);if(x<w-1)add(i+1);if(y>0)add(i-w);if(y<h-1)add(i+w);}
  return seen;
 }
 const strict=flood(18),loose=flood(36);
 const alpha=new Uint8Array(n),uncertain=new Uint8Array(n),background=new Uint8Array(n);
 let foregroundPixels=0,uncertainPixels=0,backgroundPixels=0;
 for(let i=0;i<n;i++){
  if(strict[i]){background[i]=255;backgroundPixels++;}
  else if(loose[i]||dist[i]<=36){uncertain[i]=255;uncertainPixels++;}
  else{alpha[i]=255;foregroundPixels++;}
 }
 if(foregroundPixels<Math.max(4,n*.01)||backgroundPixels<n*.05)return refuse('insufficient-foreground-or-background');
 return {status:'UNREVIEWED_BORDER_MASK_PROPOSAL',width:w,height:h,alpha,uncertain,background,foregroundPixels,uncertainPixels,backgroundPixels,borderConsensus:consensus,backgroundModel:model,backgroundMedianRGB:bg,maskSHA256:sha(alpha),uncertaintySHA256:sha(uncertain),backgroundSHA256:sha(background),...hold};
}
export async function proposeOriginalPhotoMask89({sourceId,originalBytes,lockedRecord}={}){
 const source=attestOriginalSource89({sourceId,originalBytes,lockedRecord});
 if(source.status!=='ORIGINAL_JPEG_VERIFIED')return refuse('original-source-not-attested');
 try{
  const {data,info}=await sharp(originalBytes,{failOn:'error',limitInputPixels:16000000}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  if(info.channels!==3||data.length!==info.width*info.height*3)return refuse('invalid-decoded-rgb');
  const identity={sourceId,category:source.category,originalSHA256:source.originalSHA256,decodedRGBSHA256:sha(data),decodedDimensions:[info.width,info.height]};
  const scale=Math.min(1,192/Math.max(info.width,info.height)),w=Math.max(1,Math.round(info.width*scale)),h=Math.max(1,Math.round(info.height*scale));
  const rgb=new Uint8Array(w*h*3);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.floor((x+.5)*info.width/w),sy=Math.floor((y+.5)*info.height/h);
   const i=3*(sy*info.width+sx);rgb.set(data.subarray(i,i+3),3*(y*w+x));
  }
  return {...proposeBorderMask89({rgb,width:w,height:h}),...identity,sampledRGBSHA256:sha(rgb),sampling:'nearest decoded original full-image RGB; no EXIF rotation'};
 }catch{return refuse('original-decode-failed');}
}
