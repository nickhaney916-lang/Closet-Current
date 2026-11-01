/** 3D69 licensed ORIGINAL benchmark JPEG + alpha integrity boundary.
 * Only exact trusted same-origin fixtures become a source capability.
 * This cannot authorize arbitrary personal wardrobe photographs; doing so
 * requires independently verified garment segmentation/fit and true account.
 */
import {loadLicensedCutout} from '../three-d-02/reviewed-texture.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../three-d-30/reviewed-photo-pants.mjs';

const trusted=new WeakSet();
const pinned=Object.freeze({
 public: Object.freeze({source:A,original:'/benchmark/three-d-31/original-jeans.jpg',mask:'/benchmark/three-d-31/cutout-proposal.png',metrics:'/benchmark/three-d-31/metrics.json',width:435,height:650}),
 second: Object.freeze({source:B,original:'/benchmark/three-d-37/original-denimjeans2.jpg',mask:'/benchmark/three-d-37/cutout-proposal.png',metrics:'/benchmark/three-d-37/metrics.json',width:1754,height:2838})
});
export function isVettedOriginalGarmentCandidate(c){return !!c&&typeof c==='object'&&trusted.has(c);}
const sourceHash=async(bytes)=>{
 if(!crypto?.subtle)throw Error('SHA256 required for original photographic fabric');
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
};
async function downloadFixedSource(path,sha,fetcher){
 if(!/^\/benchmark\/(?:three-d-(?:31|37)\/(?:original-(?:jeans|denimjeans2)\.jpg|cutout-proposal\.png)|work47\/assets\/commons-0003\.(?:jpg|png))$/.test(path))
  throw Error('Untrusted garment photo asset path');
 const r=await fetcher(path,{cache:'no-store'});
 if(!r?.ok)throw Error('Pinned original photographic asset not available');
 const bytes=await r.arrayBuffer();
 if(bytes.byteLength<1000||bytes.byteLength>10_000_000||await sourceHash(bytes)!==sha)
  throw Error('Actual original photograph/mask SHA mismatch');
 return new Blob([bytes],{type:path.endsWith('.png')?'image/png':'image/jpeg'});
}
async function decode(blob,urls){
 const url=URL.createObjectURL(blob);urls.push(url);
 const im=new Image();im.src=url;await im.decode();return im;
}
function compareVisibleSourcePixels(original,cutout,reference){
 const w=original.naturalWidth,h=original.naturalHeight;
 if(w!==reference.width||h!==reference.height||
    cutout.naturalWidth!==w||cutout.naturalHeight!==h)
  throw Error('Photographed denim source/mask dimensions changed');
 const rgba=img=>{
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Original JPEG pixel access unavailable');
  ctx.drawImage(img,0,0);
  return ctx.getImageData(0,0,w,h).data;
 };
 const a=rgba(original),b=rgba(cutout);let n=0,broken=0;
 const colors=[[],[],[]];
 for(let i=0;i<a.length;i+=4)if(b[i+3]){
  n++;
  if(Math.abs(a[i]-b[i])>2||Math.abs(a[i+1]-b[i+1])>2||Math.abs(a[i+2]-b[i+2])>2)broken++;
  if(i%16===0&&b[i+3]>=240&&b[i+2]>b[i]&&b[i+2]>b[i+1])
   for(let k=0;k<3;k++)colors[k].push(b[i+k]);
 }
 if(n<60000||broken>0||colors.some(c=>c.length<100))
  throw Error('Original denim visible color pixels do not match SHA-pinned source');
 const neutralColorRGB=colors.map(c=>{c.sort((x,y)=>x-y);return c[Math.floor(c.length/2)];});
 return {visible:n,neutralColorRGB};
}
export async function loadSourceVetted3D69ResearchBundle({denim='public',fetcher=fetch}={}){
 if(typeof location!=='undefined'&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
  throw Error('Original owner-review photo-to-3D study only runs on localhost');
 const config=pinned[denim];
 if(!config||typeof fetcher!=='function')throw Error('Only pinned, licensed photographed denim is available');
 const urls=[];
 try{
  const [sourceBlob,cutoutBlob,metricsResponse,manifestResponse]=await Promise.all([
   downloadFixedSource(config.original,config.source.originalSHA256,fetcher),
   downloadFixedSource(config.mask,config.source.cutoutSHA256,fetcher),
   fetcher(config.metrics,{cache:'no-store'}),
   fetcher('/benchmark/work47/manifest.json',{cache:'no-store'})
  ]);
  if(!metricsResponse?.ok||!manifestResponse?.ok)throw Error('Original licensed source manifest unavailable');
  const [metrics,manifest]=await Promise.all([metricsResponse.json(),manifestResponse.json()]);
  const [original,cutout,shirt]=await Promise.all([
    decode(sourceBlob,urls),decode(cutoutBlob,urls),
    loadLicensedCutout('commons-0003',{manifest,reviewConfirmed:true,fetcher})
  ]);
  const shirtHash='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
  if(shirt.sourceSHA256!==shirtHash)throw Error('Pinned photographed Armani Jeans shirt source not identical');
  const matched=compareVisibleSourcePixels(original,cutout,config);
  if(metrics.originalSHA256!==config.source.originalSHA256||
     metrics.cutoutSHA256!==config.source.cutoutSHA256||
     metrics.imageOrientation!=='laid-flat-front'||metrics.ownerApproved!==false||
     metrics.releaseAuthorized!==false||metrics.humanVisualApproval!==false||
     metrics.width!==config.width||metrics.height!==config.height||
     !Array.isArray(metrics.bbox)||metrics.bbox.length!==4)
   throw Error('Original source measured denim silhouette/provenance changed');
  const [l,t,r,b]=metrics.bbox;
  if(![l,t,r,b].every(Number.isFinite)||l<0||t<0||r>=config.width||b>=config.height||
     r-l<config.width*.35||b-t<config.height*.4)
   throw Error('Photo silhouette cannot create a believable verified lower body');
  const pant=Object.freeze({
   id:config.source.id,type:'pants',sourceSHA256:config.source.originalSHA256,
   cutoutSHA256:config.source.cutoutSHA256,original,cutout,
   originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true,
   visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
   cropRect:[l/config.width,t/config.height,(r-l+1)/config.width,(b-t+1)/config.height],
   neutralColorRGB:matched.neutralColorRGB,
   ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true
  });
  trusted.add(pant);trusted.add(shirt);
  return Object.freeze({shirt,pants:pant,denim:config.source.id,
   originalVisibleSourcePixels:matched.visible,
   provenance:'locked-public-licensed-benchmark-sources-not-a-real-users-closet',
   humanAppearanceApproved:false,physicalPhoneAccepted:false,
   releaseAuthorized:false,dispose(){for(const url of urls)URL.revokeObjectURL(url);}});
 }catch(e){for(const url of urls)URL.revokeObjectURL(url);throw e;}
}
