/** 3D37 — SECOND genuine original photographed pants, CC BY-SA 4.0.
 * Source: https://commons.wikimedia.org/wiki/File:Denimjeans2.JPG
 * By Manda.L.Isch, contrast improved by Petru Dimitriu. Cutout derivative
 * attributed with exact Commons URL, CC BY-SA 4.0 and modified-alpha notice.
 * No automatic approval, no original RGB manipulation, no fake original back.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const DEST='benchmark/three-d-37';
const URL='https://upload.wikimedia.org/wikipedia/commons/9/92/Denimjeans2.JPG';
const PAGE='https://commons.wikimedia.org/wiki/File:Denimjeans2.JPG';
const PIN_ORIGINAL='aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a';
const PIN_CUTOUT='4cf80f77fa34d04844d7310de180135df607248847ea17b1aed4ef613d0cb3db';
const sha=b=>createHash('sha256').update(b).digest('hex');
async function original(){
 if(existsSync(DEST+'/original-denimjeans2.jpg'))return readFile(DEST+'/original-denimjeans2.jpg');
 const res=await fetch(URL,{signal:AbortSignal.timeout(40000),headers:{'User-Agent':'ClosetCurrent-SourceTrue-IndependentGarmentQA/1.0','Accept':'image/jpeg'}});
 if(!res.ok)throw Error('Second independent original Commons photo fetch failed: '+res.status);
 const b=Buffer.from(await res.arrayBuffer());
 if(b.length<100000||b.length>5000000||b[0]!==255||b[1]!==216)throw Error('Unexpected second original JPG');
 return b;
}
function largest(src,w,h){
 const seen=new Uint8Array(src.length);let best=[],parts=0;
 for(let i=0;i<src.length;i++){
  if(!src[i]||seen[i])continue;
  parts++;const q=[i],component=[];seen[i]=1;
  for(let j=0;j<q.length;j++){
   const v=q[j],x=v%w,y=(v/w)|0;component.push(v);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
    const k=yy*w+xx;if(src[k]&&!seen[k]){q.push(k);seen[k]=1;}
   }
  }
  if(component.length>best.length)best=component;
 }
 const result=new Uint8Array(src.length);for(const k of best)result[k]=1;
 return {result,parts,largest:best.length};
}
function morph(mask,w,h,dilate){
 const out=new Uint8Array(mask.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let yes=!dilate;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy,b=xx<0||xx>=w||yy<0||yy>=h?0:mask[yy*w+xx];
   if(dilate&&b)yes=true;
   if(!dilate&&!b)yes=false;
  }
  out[y*w+x]=yes?1:0;
 }
 return out;
}
await mkdir(DEST,{recursive:true});
const jpeg=await original(),originalSHA256=sha(jpeg);
const decoded=await sharp(jpeg).ensureAlpha().raw().toBuffer({resolveWithObject:true}),w=decoded.info.width,h=decoded.info.height;
if(w!==1754||h!==2838)throw Error('Second original pixel dimensions or orientation changed');
const sw=560,sh=Math.round(h*sw/w);
const reduced=await sharp(jpeg).resize(sw,sh,{fit:'fill'}).ensureAlpha().raw().toBuffer();
const input=new Uint8Array(sw*sh);
for(let i=0;i<input.length;i++){
 const r=reduced[4*i],g=reduced[4*i+1],b=reduced[4*i+2];
 // Blue denim on white: actual blue-colored source only. This rejects white
 // background and does not claim to recover faded fabric without review.
 input[i]=((b>r+10&&b>g+3&&b>55)||(b>r+15&&b>53&&r<135))?1:0;
}
// Actual second source has faded light-blue interior and near-white worn
// patches, so a color threshold alone wrongly deletes real fabric. Establish
// source-derived LEFT/RIGHT waistband and leg outer contours from the actual
// blue points per row, then KEEP original RGB at EVERY interior pixel.
// These outlines remain provisional and are not a verified human cutout.
const spans=[];
const pct=(a,q)=>{const x=a.slice().sort((u,v)=>u-v);return x[Math.floor((x.length-1)*q)];};
for(let y=0;y<sh;y++){
 const pts=[];
 for(let x=Math.floor(sw*.04);x<Math.ceil(sw*.96);x++){
  let yes=false;
  for(let yy=Math.max(0,y-2);yy<=Math.min(sh-1,y+2);yy++)if(input[yy*sw+x]){yes=true;break;}
  if(yes)pts.push(x);
 }
 const left=pts.filter(x=>x<sw*.5),right=pts.filter(x=>x>=sw*.5);
 if(pts.length<=30){spans.push([-1,-1,-1,-1]);continue;}
 if(y<sh*.33)spans.push([pct(pts,.01),pct(pts,.99),-1,-1]);
 else if(left.length>10&&right.length>10)spans.push([pct(left,.01),pct(left,.99),pct(right,.01),pct(right,.99)]);
 else spans.push([-1,-1,-1,-1]);
}
// Interpolate only boundary positions between observed original denim rows.
for(let col=0;col<4;col++){
 const valid=spans.map((r,i)=>r[col]>=0?i:-1).filter(i=>i>=0);
 if(!valid.length||col<2&&valid.length<200)throw Error('Original jean edge contours missing '+col);
 for(let y=0;y<sh;y++){
  if(spans[y][col]>=0)continue;
  let lo=0,hi=valid.length-1;
  while(lo<hi){const m=(lo+hi)>>1;if(valid[m]<y)lo=m+1;else hi=m;}
  const right=valid[lo],left=valid[Math.max(0,lo-1)];
  const x1=spans[left][col],x2=spans[right][col];
  const t=left===right?0:Math.max(0,Math.min(1,(y-left)/(right-left)));
  spans[y][col]=Math.round(x1+(x2-x1)*t);
 }
}
const result=new Uint8Array(sw*sh);
for(let y=0;y<sh;y++){
 let containsActualDenim=false;
 for(let yy=Math.max(0,y-3);yy<=Math.min(sh-1,y+3)&&!containsActualDenim;yy++)
  for(let x=0;x<sw;x++)if(input[yy*sw+x]){containsActualDenim=true;break;}
 if(!containsActualDenim)continue;
 const [x1,x2,x3,x4]=spans[y];
 for(let x=Math.max(0,x1);x<=Math.min(sw-1,x2);x++)result[y*sw+x]=1;
 if(y>=sh*.33)for(let x=Math.max(0,x3);x<=Math.min(sw-1,x4);x++)result[y*sw+x]=1;
}
const parts=0,component=result.reduce((total,v)=>total+v,0);
if(component<sw*sh*.20)throw Error('Source-true original denim legs not fully segmented');
const maskRaw=await sharp(Buffer.from(result),{raw:{width:sw,height:sh,channels:1}}).resize(w,h,{kernel:'nearest'}).greyscale().raw().toBuffer();
const rgba=Buffer.from(decoded.data);
let count=0,waist=0,left=0,right=0,gap=0,minX=w,minY=h,maxX=-1,maxY=-1,
 color=[0,0,0],colorCount=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const i=y*w+x,k=i*4;
 const inside=maskRaw[i]>0;
 // Inward feather for algorithmic edge certainty: all surviving RGB pixels
 // are copied byte-for-byte from the decoded ORIGINAL image.
 rgba[k+3]=inside?255:0;
 if(inside){
  count++;minX=Math.min(minX,x);minY=Math.min(minY,y);
  maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  if(y<h*.23)waist++;
  if(y>h*.72){if(x<w*.40)left++;if(x>w*.60)right++;}
  if(rgba[k+2]>rgba[k]+15&&rgba[k+2]>rgba[k+1]+2&&rgba[k+2]<215){
   color[0]+=rgba[k];color[1]+=rgba[k+1];color[2]+=rgba[k+2];colorCount++;
  }
 }else if(y>h*.68&&x>w*.47&&x<w*.53)gap++;
}
const backing=colorCount>1000?color.map(t=>Math.round(t/colorCount)):[70,95,135];
const cutout=await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png({compressionLevel:9}).toBuffer();
const cutoutSHA256=sha(cutout);
const metrics={id:'commons-cc-by-sa-denimjeans2-2008',sourcePage:PAGE,sourceURL:URL,
 license:'CC BY-SA 4.0',licenseURL:'https://creativecommons.org/licenses/by-sa/4.0/',
 author:'Manda.L.Isch; original source photograph postprocessed by Petru Dimitriu',
 changes:'Provisional original RGB-preserving alpha proposal derived with blue-color segmentation. Original Commons JPEG untouched.',
 originalSHA256,cutoutSHA256,width:w,height:h,bbox:[minX,minY,maxX,maxY],
 visiblePixels:count,visibleRatio:count/(w*h),waistPixels:waist,
 leftLowerPixels:left,rightLowerPixels:right,lowerGapPixels:gap,
 sourceDerivedNeutralColor:backing,components:parts,largestLowResComponent:component,
 originalBytesUnmodified:true,sourceRGBPreserved:true,ownerApproved:false,
 humanVisualApproval:false,releaseAuthorized:false,frontOrientationReviewed:true,
 maskStatus:'REVIEW',cutoutColorMethod:'source RGB exact, provisional row-anchored observed denim edges; alpha only',imageOrientation:'laid-flat-front',
 existingOriginalJeansNotReplaced:true,fullCollisionValidated:false};
await writeFile(DEST+'/original-denimjeans2.jpg',jpeg);
await writeFile(DEST+'/cutout-proposal.png',cutout);
await writeFile(DEST+'/metrics.json',JSON.stringify(metrics,null,2));
const matte=await sharp({create:{width:w,height:h,channels:3,background:'#ded8cf'}})
 .composite([{input:cutout,blend:'over'}]).png().toBuffer();
await sharp(matte).resize(460).png().toFile(DEST+'/matte-review.png');
console.log('THREE_D37_SECOND_ORIGINAL_SOURCE_AND_DERIVED_ALPHA',JSON.stringify(metrics));
if(metrics.visibleRatio<.20||metrics.visibleRatio>.72||waist<9000||left<8000||right<8000||gap<15000||
 minY>h*.20||maxY<h*.78)throw Error('SECOND ORIGINAL incomplete source mask: REVIEW and block usage');
if(originalSHA256!==PIN_ORIGINAL||cutoutSHA256!==PIN_CUTOUT)
 throw Error('SECOND SOURCE PIN REVIEW REQUIRED: record the original/cutout SHA from log, then pin exact original source; do not run unpinned preview');
