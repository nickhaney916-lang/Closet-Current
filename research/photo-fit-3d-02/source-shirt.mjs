/** PHOTO-FIT-3D-02 — one *new* independently locked original JPEG.
 * This is a research-derived alpha/color/shape capability, NOT an arbitrary-photo
 * 3D fitter and not a release or human approval. Original input is immutable.
 */
export const RED_SHIRT=Object.freeze({
  id:'commons-0002',kind:'shirt',category:'Tops',itemType:'T-shirt',
  sha256:'fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667',
  licensedFrom:'https://commons.wikimedia.org/wiki/File:Rood_t-shirt,_merk_Diesel,_maat_M,_objectnr_86503.JPG',
  license:'CC BY-SA 3.0',credit:'Diesel / Museum Rotterdam',
  donorMeshReused:false,photographedRear:false,productionAuthorized:false
});
const issued=new WeakSet();
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
export async function verifyRedSourceBytes(bytes,{subtle=globalThis.crypto?.subtle}={}){
 if(!(bytes instanceof Uint8Array)||bytes.length<1000||bytes.length>10000000||
    bytes[0]!==255||bytes[1]!==216||
    bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217||!subtle?.digest)
  throw Error('PHOTO22: complete original JPEG and SHA-256 required');
 const sha=hex(new Uint8Array(await subtle.digest('SHA-256',bytes)));
 if(sha!==RED_SHIRT.sha256)throw Error('PHOTO22: unrecognized original source SHA');
 return Object.freeze({sha256:sha,byteLength:bytes.length,originalUnmodified:true});
}
export function verifySavedRedShirt({item,saved,ownerId,generation}={}){
 if(typeof ownerId!=='string'||!ownerId||!Number.isSafeInteger(generation)||
    generation<0||!item||!saved||item.ownerId!==ownerId||
    saved.ownerId!==ownerId||saved.slots?.top!==item.id||
    item.category!=='Tops'||item.itemType!=='T-shirt'||
    item.userAdjusted!==true||item.sourceSHA256!==RED_SHIRT.sha256||
    item.originalPhoto?.sha256!==RED_SHIRT.sha256||
    typeof item.originalPhoto?.image!=='string'||
    !item.originalPhoto.image.startsWith('data:image/jpeg;base64,')||
    typeof saved.id!=='string'||!saved.id)
  throw Error('PHOTO22: authenticated owner-saved original shirt ID/slot/source needed');
 return Object.freeze({itemId:item.id,savedId:saved.id,ownerId,generation,
   sourceSHA256:RED_SHIRT.sha256,outfit3dId:saved.outfit3dId||null,
   originalImage:item.originalPhoto.image,readOnly:true,metadataUntouched:true});
}
const clip=(v,a,b)=>Math.max(a,Math.min(b,v));
/** Derive a front-only silhouette from red original pixels.
 * Uses per-row red contour and retains non-red logo pixels inside the contour;
 * the opening in the top of the collar is never filled. No output writes JPEG.
 */
export function deriveRedShirtCutout(image,{documentRef=globalThis.document}={}){
 if(!image?.naturalWidth||!image?.naturalHeight||!documentRef?.createElement)
  throw Error('PHOTO22: decoded original RGB pixels required');
 const width=Math.round(clip(image.naturalWidth,64,480));
 const height=Math.round(width*image.naturalHeight/image.naturalWidth);
 const canvas=documentRef.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('PHOTO22: unavailable original source pixel decoding');
 ctx.drawImage(image,0,0,width,height);
 const raw=ctx.getImageData(0,0,width,height),d=raw.data,lines=[];
 let x0=width,y0=height,x1=0,y1=0,valid=0;
 function red(x,y){const i=(y*width+x)*4,r=d[i],g=d[i+1],b=d[i+2];
   return r>65&&r>g*1.22&&r>b*1.12&&r-g>27;}
 for(let y=0;y<height;y++){
  const xs=[];
  for(let x=0;x<width;x++)if(red(x,y))xs.push(x);
  if(xs.length<Math.max(9,width*.045)){lines[y]=null;continue;}
  const l=xs[Math.floor(xs.length*.025)],r=xs[Math.floor(xs.length*.975)];
  if(r-l<width*.12){lines[y]=null;continue;}
  lines[y]=[l,r];valid++;x0=Math.min(x0,l);x1=Math.max(x1,r);
  y0=Math.min(y0,y);y1=Math.max(y1,y);
 }
 if(valid<height*.14||x1-x0<width*.22||y1-y0<height*.16)
  throw Error('PHOTO22: actual red garment silhouette cannot be isolated safely');
 // Fill only small incomplete contour rows, never fabricate missing neckline/rear.
 for(let y=y0+1;y<y1;y++)if(!lines[y]){
  let a=y-1,b=y+1;while(a>=y0&&!lines[a])a--;
  while(b<=y1&&!lines[b])b++;
  if(a>=y0&&b<=y1&&b-a<=13){
   const t=(y-a)/(b-a);
   lines[y]=[Math.round(lines[a][0]*(1-t)+lines[b][0]*t),
    Math.round(lines[a][1]*(1-t)+lines[b][1]*t)];
  }
 }
 const mask=documentRef.createElement('canvas');mask.width=width;mask.height=height;
 const cx=mask.getContext('2d');const derived=cx.createImageData(width,height);
 const colors=[[],[],[]];let alphaPixels=0;
 for(let y=y0;y<=y1;y++){
  if(!lines[y])continue;
  const [l,r]=lines[y],center=(l+r)/2;
  for(let x=l;x<=r;x++){
   const i=(y*width+x)*4;
   const neckline=(y-y0)<(y1-y0)*.11 && Math.abs(x-center)<(r-l)*.17&&!red(x,y);
   if(neckline)continue;
   // Source RGB is copied exactly from decoded original, not recolored.
   derived.data[i]=d[i];derived.data[i+1]=d[i+1];derived.data[i+2]=d[i+2];
   derived.data[i+3]=255;alphaPixels++;
   if(red(x,y)&&x%7===0&&y%7===0)for(let k=0;k<3;k++)colors[k].push(d[i+k]);
  }
 }
 if(alphaPixels<width*height*.025||colors.some(a=>a.length<50))
  throw Error('PHOTO22: source print/color isolation not trustworthy');
 cx.putImageData(derived,0,0);
 const median=colors.map(v=>(v.sort((a,b)=>a-b),v[Math.floor(v.length/2)]/255));
 const sampleRow=t=>{const y=Math.round(y0+(y1-y0)*t);
   for(let k=0;k<15;k++)if(lines[y+k])return lines[y+k][1]-lines[y+k][0];
   return x1-x0;};
 const span=x1-x0;
 const contour=Object.freeze({bbox:Object.freeze([x0,y0,x1,y1]),
   sourceSize:Object.freeze([width,height]),
   shoulderToHemRatio:clip(sampleRow(.20)/Math.max(1,sampleRow(.88)),.65,1.7),
   sleeveToHemRatio:clip(sampleRow(.35)/Math.max(1,sampleRow(.88)),.7,2.3),
   hemWidthRatio:clip(sampleRow(.88)/Math.max(1,span),.25,1),
   neckline:'original-red-crew-neck-unverified-edge',sleeves:'original-short-sleeve',
   noRearPixels:true,derivedOnly:true});
 const candidate=Object.freeze({id:RED_SHIRT.id,type:'shirt',
  sourceSHA256:RED_SHIRT.sha256,originalVerified:true,sourcePixelsCopiedWithoutRecolor:true,
  textureImage:mask,cropRect:Object.freeze([x0/width,y0/height,(x1-x0+1)/width,(y1-y0+1)/height]),
  baseColor:Object.freeze(median),contour,originalByteMutation:false,
  rear:'neutral-unphotographed',humanVisualApproval:false,releaseAuthorized:false});
 issued.add(candidate);return candidate;
}
export function requireRedShirtSource(candidate){
 if(!issued.has(candidate)||candidate?.sourceSHA256!==RED_SHIRT.sha256||
    candidate.originalVerified!==true||candidate.releaseAuthorized!==false)
  throw Error('PHOTO22: genuine SHA-locked photo/derived shape capability required');
 return candidate;
}
