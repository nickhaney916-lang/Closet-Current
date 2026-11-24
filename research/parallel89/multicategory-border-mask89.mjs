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
 for(let i=0;i<n;i++)dist[i]=Math.max(...bg.map((v,c)=>Math.abs(v-rgb[3*i+c])));
 const consensus=border.filter(i=>dist[i]<=18).length/border.length;
 if(consensus<0.8)return refuse('border-color-not-consistent');
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
 return {status:'UNREVIEWED_BORDER_MASK_PROPOSAL',width:w,height:h,alpha,uncertain,background,foregroundPixels,uncertainPixels,backgroundPixels,borderConsensus:consensus,backgroundMedianRGB:bg,maskSHA256:sha(alpha),uncertaintySHA256:sha(uncertain),backgroundSHA256:sha(background),...hold};
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
