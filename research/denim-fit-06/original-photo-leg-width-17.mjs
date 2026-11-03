/**
 * W17: measure silhouettes ONLY from the exact already-reviewed, SHA-bound
 * original photographed denim cutout. No network, generation, persistence,
 * synthetic rear imagery, private photos or production behavior.
 */
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function validSHA(s){return typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);}
export function deriveOriginalPhotoLegWidth17({data,width,height,sourceId,sourceSHA256,cutoutSHA256}){
 if(!isSourceVerifiedDenimId(sourceId)||!validSHA(sourceSHA256)||!validSHA(cutoutSHA256)||
  !(data instanceof Uint8ClampedArray)||!Number.isSafeInteger(width)||
  !Number.isSafeInteger(height)||width<64||height<80||width*height>1e6||
  data.length!==width*height*4)
  throw Error('W17 requires exact original licensed SHA-bound sampled RGBA jeans cutout');
 let minX=width,minY=height,maxX=-1,maxY=-1,visible=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(data[(y*width+x)*4+3]<160)continue;
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);
  minY=Math.min(minY,y);maxY=Math.max(maxY,y);visible++;
 }
 if(visible<width*height*.045||maxX-minX<width*.14||
  maxY-minY<height*.43)throw Error('W17 original photo has insufficient actual jean mask evidence');
 const mid=(minX+maxX)*.5;
 const band=(fraction,side)=>{
  const span=maxY-minY+1,start=Math.round(minY+fraction*span),
    half=Math.max(2,Math.round(.018*span));
  const counts=[];
  for(let y=Math.max(minY,start-half);y<=Math.min(maxY,start+half);y++){
   let count=0;
   const lo=side===0?minX:Math.ceil(mid),hi=side===0?Math.floor(mid):maxX;
   for(let x=lo;x<=hi;x++)if(data[(y*width+x)*4+3]>=160)count++;
   if(count>=Math.max(4,width*.017))counts.push(count);
  }
  if(counts.length<2)throw Error('W17 missing photographed per-leg knee/hem alpha bands');
  return counts.sort((a,b)=>a-b)[Math.floor(counts.length*.5)];
 };
 const knees=[band(.60,0),band(.60,1)];
 const hems=[band(.90,0),band(.90,1)];
 if([...knees,...hems].some(n=>n<4)||knees.some(n=>n>width*.38)||
  hems.some(n=>n>width*.38))throw Error('W17 incorrect original separate-leg segmentation');
 // P18: preserve additional original-photo width stations from BOTH
 // legs. This is real cutout alpha evidence, not procedural wrinkles.
 const stationFractions18=[.60,.675,.75,.825,.90];
 const stations18=[0,1].map(side=>stationFractions18.map(f=>band(f,side)));
 const normalized18=stations18.map((values,side)=>values.map(x=>x/knees[side]));
 if(normalized18.some(values=>values.some(x=>!Number.isFinite(x)||x<.26||x>2.5)))
  throw Error('P18 untrustworthy original photographed multi-station leg profile');
 const ratio=hems.map((v,i)=>v/knees[i]);
 if(ratio.some(n=>!Number.isFinite(n)||n<.26||n>2.5))
  throw Error('W17 original photographed leg ratio cannot be trusted');
 return Object.freeze({sourceId,sourceSHA256,cutoutSHA256,
  originalPhotoWidthRatios17:Object.freeze(ratio),
  originalPhotoCalfProfileStations18:Object.freeze(normalized18.map(x=>Object.freeze(x))),
  originalPhotoCalfPixelStations18:Object.freeze(stations18.map(x=>Object.freeze(x))),
  originalPhotoCalfFractions18:Object.freeze(stationFractions18),
  sourceMeasuredLegProfiles18:true,
  kneePixelWidths17:Object.freeze(knees),hemPixelWidths17:Object.freeze(hems),
  photoAlphaSampleWidth17:width,photoAlphaSampleHeight17:height,
  originalPhotographedCutoutMeasured17:true,
  syntheticReverseImage:false,releaseAuthorized:false});
}
export function measureReviewedDenimOriginalWidth17(source){
 if(!source?.cutout||source.ownerApproved!==false||source.releaseAuthorized!==false||
  source.originalVerified!==true||source.cutoutVerified!==true||
  source.visibleSourceRGBPreserved!==true||!source.frontOrientationReviewed||
  !isSourceVerifiedDenimId(source.id)||!validSHA(source.sourceSHA256)||
  !validSHA(source.cutoutSHA256))
  throw Error('W17 requires previously verified original cutout and exact SHA/owner gate');
 const width=source.cutout.naturalWidth||source.cutout.width,
  height=source.cutout.naturalHeight||source.cutout.height;
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<64||height<80)
  throw Error('W17 original full-resolution cutout dimensions not available');
 const scale=Math.min(1,220/Math.max(width,height)),w=Math.max(64,Math.round(width*scale)),
  h=Math.max(80,Math.round(height*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('W17 local original-alpha reader unavailable');
 ctx.clearRect(0,0,w,h);ctx.drawImage(source.cutout,0,0,w,h);
 return deriveOriginalPhotoLegWidth17({...{
  data:ctx.getImageData(0,0,w,h).data,width:w,height:h},
  sourceId:source.id,sourceSHA256:source.sourceSHA256,cutoutSHA256:source.cutoutSHA256});
}
// Visible, photo-calibrated, conservative SOURCE-NEUTRAL side/rear calf ease;
// actual image front remains geometrically and photometrically unchanged.
export function sourcePhotoCalibratedCalfEase17(phase,ratio){
 if(!Number.isFinite(phase)||phase<0||phase>1||
  !Number.isFinite(ratio)||ratio<.26||ratio>2.5)
  throw Error('W17 requires observed anatomical calf phase and actual original alpha ratio');
 const t=clamp(phase,0,1);
 const smooth=(a,b,v)=>{const z=clamp((v-a)/(b-a),0,1);return z*z*(3-2*z);};
 const falloff=smooth(.03,.17,t)*(1-smooth(.39,.70,t));
 return (.007+.011*clamp((ratio-.30)/1.75,0,1))*falloff;
}

// P18: continuous broad silhouette eased along multiple ACTUAL source alpha
// stations (not fabricated fold texture). A real source-image width profile
// affects side/rear drape; the photographed front surface remains fixed.
export function sourceMeasuredLegRelief18(phase,stations){
 if(!Number.isFinite(phase)||phase<0||phase>1||
  !Array.isArray(stations)||stations.length!==5||
  stations.some(x=>!Number.isFinite(x)||x<.26||x>2.5)||
  Math.abs(stations[0]-1)>.025)
  throw Error('P18 needs five finite true original-photo normalized calf widths');
 const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
 const u=1-phase,pos=u*4,i=Math.min(3,Math.floor(pos));
 const t=smooth(0,1,pos-i);
 const measured=stations[i]*(1-t)+stations[i+1]*t;
 const linear=1+(stations[4]-1)*u;
 // Measured non-linear source outline, with a larger broad side/rear cloth
 // silhouette so genuine source width can meaningfully influence the model.
 const magnitude=clamp(.008+.006*(measured-.65),.005,.016);
 const sourceCurve=clamp((measured-linear)*.018,-.005,.005);
 const taper=smooth(.03,.22,phase)*(1-smooth(.75,.99,phase));
 return clamp((magnitude+sourceCurve)*taper,0,.018);
}
