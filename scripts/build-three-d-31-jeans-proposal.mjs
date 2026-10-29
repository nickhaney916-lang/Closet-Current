/** 3D31: PUBLIC-DOMAIN LICENSED PHOTOGRAPH, SOURCE-TRUE ALPHA PROPOSAL ONLY.
 * Original remains byte-exact, no remote runtime / app / customer photo writes.
 * Do not promote as approved cutout: source SHA to be pinned after first run.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const URL='https://upload.wikimedia.org/wikipedia/commons/5/5a/Jeans.jpg';
const DEST='benchmark/three-d-31';
const sha=b=>createHash('sha256').update(b).digest('hex');
async function acquire(){
 const {existsSync}=await import('node:fs');
 if(existsSync(DEST+'/original-jeans.jpg'))return readFile(DEST+'/original-jeans.jpg');
 const res=await fetch(URL,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'ClosetCurrent-CC0-Original-Photo-Research/1.0 (no customer data)','Accept':'image/jpeg'}});
 if(!res.ok)throw Error('Pinned public-domain Wikimedia original unavailable: '+res.status);
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<10000||bytes.length>2000000||bytes[0]!==255||bytes[1]!==216)throw Error('Source JPEG size or file signature invalid');
 return bytes;
}
function maxComponent(input,w,h){
 const seen=new Uint8Array(w*h);let best=[],componentCount=0;
 for(let start=0;start<w*h;start++){
  if(!input[start]||seen[start])continue;componentCount++;
  const q=[start],part=[];seen[start]=1;
  for(let k=0;k<q.length;k++){const i=q[k],x=i%w,y=(i/w)|0;part.push(i);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;
    const j=ny*w+nx;if(input[j]&&!seen[j]){seen[j]=1;q.push(j);}
   }
  }
  if(part.length>best.length)best=part;
 }
 const out=new Uint8Array(w*h);for(const i of best)out[i]=1;
 return {out,largest:best.length,componentCount};
}
function morphology(mask,w,h,expand){
 const out=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let match=!expand;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy,v=xx>=0&&xx<w&&yy>=0&&yy<h?mask[yy*w+xx]:0;
   if(expand&&v)match=true;
   if(!expand&&!v)match=false;
  }
  out[y*w+x]=match?1:0;
 }
 return out;
}
export function proposalFromOriginal(image,w,h){
 if(!(image instanceof Uint8Array)||image.length!==w*h*4||w<200||h<300||w>2000||h>2000)throw Error('Invalid decoded original jeans RGB');
 const N=w*h,guess=new Uint8Array(N);
 for(let i=0;i<N;i++){
  const r=image[i*4],g=image[i*4+1],b=image[i*4+2];
  // Object is visibly blue denim, carpet is neutral warm. Conservative
  // blue-dominance estimate: no fabricated color, cutout only.
  guess[i]=(b-r>=17&&b-g>=10&&b>65&&r<205)?1:0;
 }
 const {out:chosen,largest,componentCount}=maxComponent(morphology(morphology(guess,w,h,true),w,h,false),w,h);
 // Keep actual visible original RGB, transparency only. Tiny edge feather uses
 // the original pixel color at every opacity; never paints synthetic fabric.
 const result=new Uint8Array(image),mask=new Uint8Array(N);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!chosen[i]){mask[i]=0;result[4*i+3]=0;continue;}
  let border=false;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h||!chosen[yy*w+xx]){border=true;break;}
  }
  mask[i]=border?176:255;result[4*i+3]=mask[i];
 }
 let minX=w,minY=h,maxX=-1,maxY=-1,count=0,bottomLeft=0,bottomRight=0,waist=0,gap=0;
 for(let i=0;i<N;i++)if(mask[i]>0){
  const x=i%w,y=(i/w)|0;count++;minX=Math.min(minX,x);minY=Math.min(minY,y);
  maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  if(y>.75*h){if(x<.45*w)bottomLeft++;if(x>.55*w)bottomRight++;}
  if(y<.25*h)waist++;
 }
 for(let y=Math.floor(h*.70);y<h;y++)for(let x=Math.floor(w*.46);x<Math.floor(w*.54);x++)if(mask[y*w+x]===0)gap++;
 const metrics={width:w,height:h,largest,componentCount,visiblePixels:count,visibleRatio:count/N,
  bbox:[minX,minY,maxX,maxY],waistPixels:waist,lowerLeftPixels:bottomLeft,lowerRightPixels:bottomRight,separatedLowerCenter:gap};
 return {rgba:result,metrics};
}
await mkdir(DEST,{recursive:true});
const original=await acquire(),originalSHA256=sha(original);
const expected=process.env.CC31_ORIGINAL_SHA256||'';
if(expected&&originalSHA256!==expected)throw Error('Exact original photo SHA256 mismatch: expected '+expected+' actual '+originalSHA256);
await writeFile(DEST+'/original-jeans.jpg',original);
const {data,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {rgba,metrics}=proposalFromOriginal(new Uint8Array(data),info.width,info.height);
const png=await sharp(Buffer.from(rgba),{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9}).toBuffer();
const output={id:'commons-public-domain-jeans-2005',sourceURL:URL,sourcePage:'https://commons.wikimedia.org/wiki/File:Jeans.jpg',license:'public domain',author:'Oktaeder; uploaded by Juanmak',imageOrientation:'laid-flat-front',originalSHA256,cutoutSHA256:sha(png),...metrics,
 originalPreserved:true,sourceRGBPreserved:true,cutoutMethod:'blue-dominance + bounded morphology provisional',ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,fullBoundaryReviewed:false};
await writeFile(DEST+'/cutout-proposal.png',png);
const matte=await sharp({create:{width:info.width,height:info.height,channels:3,background:'#d5c9be'}}).composite([{input:png,blend:'over'}]).png().toBuffer();
await writeFile(DEST+'/matte-preview.png',matte);
await writeFile(DEST+'/metrics.json',JSON.stringify(output,null,2));
console.log('SOURCE_TRUE_PD_JEANS_PROPOSAL',JSON.stringify(output));
if(output.visibleRatio<.18||output.visibleRatio>.80||output.waistPixels<300||
 output.lowerLeftPixels<300||output.lowerRightPixels<300||output.separatedLowerCenter<300||
 output.bbox[1]>.3*info.height||output.bbox[3]<.8*info.height)
 throw Error('Cutout review threshold failed: preserve original, do not authorize');
