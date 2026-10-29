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
const PIN_ORIGINAL='AUDIT_ONLY_PIN_AFTER_FIRST_SOURCE_HASH';
const PIN_CUTOUT='AUDIT_ONLY_PIN_AFTER_FIRST_DERIVED_HASH';
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
const closed=morph(morph(input,sw,sh,true),sw,sh,false);
const {result,parts,largest:component}=largest(closed,sw,sh);
if(component<sw*sh*.17)throw Error('Second source alpha segmentation lacks complete denim');
const maskRaw=await sharp(Buffer.from(result),{raw:{width:sw,height:sh,channels:1}}).resize(w,h,{kernel:'nearest'}).raw().toBuffer();
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
 maskStatus:'REVIEW',cutoutColorMethod:'source RGB exact, alpha only',
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
