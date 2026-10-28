/**
 * 3D-02: carry an EXISTING licensed Work47 cutout into the real 3D mesh.
 * Work47 PNG derivatives are provisional; no AI/manual approval inferred.
 * No source editing, cloud, accounts, persistence or browser identity.
 */
import {adaptGarmentFor3D} from '../three-d-01/garment-adapter.mjs';
const allowed=Object.freeze({
 'commons-0003':Object.freeze({type:'shirt',category:'Tops',slot:'top'}),
 'commons-0053':Object.freeze({type:'dress',category:'Dresses',slot:'dress'})
});
export const SAMPLES=allowed;
export const FALLBACK=Object.freeze({type:'pants',id:'commons-0021',
 reason:'no-reliable-source-bound-cutout',releaseAuthorized:false});
const shaHex=async bytes=>{
 if(!globalThis.crypto?.subtle)throw Error('Secure hash unavailable: cannot trust local candidate');
 const out=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
export async function readVerifiedAsset(url,expectedSha,{fetcher=fetch}={}){
 if(typeof url!=='string'||!/^[a-f0-9]{64}$/.test(expectedSha||'')||
  !/^\/benchmark\/work47\/assets\/commons-[0-9]{4}\.(png|jpg)$/.test(url))
  throw Error('Unexpected research-only asset');
 const res=await fetcher(url,{cache:'no-store'});
 if(!res.ok)throw Error('License-locked local asset unavailable');
 const data=await res.arrayBuffer();
 if(data.byteLength>10e6||data.byteLength<200||await shaHex(data)!==expectedSha)
  throw Error('Source file hash mismatch');
 return new Blob([data],{type:url.endsWith('.png')?'image/png':'image/jpeg'});
}
async function imageFromBlob(blob){
 const u=URL.createObjectURL(blob),image=new Image();
 try{image.src=u;await image.decode();return image;}
 finally{URL.revokeObjectURL(u);}
}
const sampleImage=image=>{
 const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<32||height<32||width*height>8e6)throw Error('Invalid licensed cutout dimensions');
 const scale=Math.min(1,240/Math.max(width,height));
 const sw=Math.max(16,Math.round(width*scale)),sh=Math.max(16,Math.round(height*scale));
 const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('No local pixel inspection possible');
 ctx.clearRect(0,0,sw,sh);ctx.drawImage(image,0,0,sw,sh);
 return {data:ctx.getImageData(0,0,sw,sh).data,width:sw,height:sh};
};
export function cropFromAlpha({data,width,height}){
 if(!(data instanceof Uint8ClampedArray)||!Number.isSafeInteger(width)||
  !Number.isSafeInteger(height)||width<16||height<16||
  data.length!==width*height*4)throw Error('Invalid garment alpha sample');
 let l=width,r=-1,t=height,b=-1,visible=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)
  if(data[(y*width+x)*4+3]>=128){
   if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;visible++;
  }
 if(visible<64||r<l||b<t)throw Error('No usable garment alpha');
 // Conservative rectangular UV crop around actual nontransparent fabric.
 // This does not solve cloth drape, side texture or model silhouette.
 const padx=Math.max(2,Math.round((r-l+1)*.035));
 const pady=Math.max(2,Math.round((b-t+1)*.035));
 l=Math.max(0,l-padx);r=Math.min(width-1,r+padx);
 t=Math.max(0,t-pady);b=Math.min(height-1,b+pady);
 const rect=[l/width,t/height,(r-l+1)/width,(b-t+1)/height];
 if(rect[2]<=.1||rect[3]<=.1)throw Error('Garment cutout too narrow for 3D');
 return {cropRect:rect,visiblePixels:visible,alphaBounds:{left:l,top:t,right:r+1,bottom:b+1}};
}
export async function loadLicensedCutout(id,{manifest,reviewConfirmed=false,fetcher=fetch}={}){
 const p=allowed[id];
 if(!p||reviewConfirmed!==true)throw Error('Explicit provisional mask review required');
 const row=manifest?.rows?.find(x=>x.id===id);
 if(!row?.hasCutout||row.ownerApproved!==false||
  !/^[a-f0-9]{64}$/.test(row.sourceSHA256||'')||
  !/^[a-f0-9]{64}$/.test(row.cutoutSHA256||'')||
  row.attribution?.license===undefined)throw Error('No source-bound provisional cutout');
 // Byte-level verification of ORIGINAL image and derived cutout.
 const [originalBlob,cutoutBlob]=await Promise.all([
  readVerifiedAsset('/benchmark/work47/assets/'+id+'.jpg',row.sourceSHA256,{fetcher}),
  readVerifiedAsset('/benchmark/work47/assets/'+id+'.png',row.cutoutSHA256,{fetcher})
 ]);
 const [original,cutout]=await Promise.all([imageFromBlob(originalBlob),imageFromBlob(cutoutBlob)]);
 const sample=sampleImage(cutout);
 const decision=adaptGarmentFor3D({
  category:p.category,slot:p.slot,sourceSHA256:row.sourceSHA256,
  reviewConfirmed:true,sampleRGBA:sample.data,sampleWidth:sample.width,sampleHeight:sample.height
 });
 if(decision.status!=='preview')throw Error('Cutout integrity failed: '+decision.reason);
 const crop=cropFromAlpha(sample);
 return Object.freeze({
  id,type:p.type,original,cutout,sourceSHA256:row.sourceSHA256,
  alphaStatus:decision.alphaStatus,visiblePixels:crop.visiblePixels,
  cropRect:crop.cropRect,ownerApproved:false,releaseAuthorized:false,
  realFabricTexture:true,backMaterial:'unverified-neutral',
  humanVisualApproval:false
 });
}
