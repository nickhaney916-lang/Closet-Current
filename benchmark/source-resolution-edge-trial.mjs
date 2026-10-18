// EXPERIMENT ONLY — original-pixel edge comparison at photo resolution.
// Does not write back to the model, user photos, recognition data, or app.
// Synthetic reference masks measure controlled failure modes; they do NOT
// qualify models for real users without separately reviewed real-photo masks.
import {scoreGarmentMask} from './garment-mask-metrics.mjs';

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function sourceResolutionEdgeTrial(image,map,group,{
 haloPixels=2,maxColorDistance=28,minOutsideContrast=65,maxGrowthFraction=.12
}={}){
 const w=image?.width,h=image?.height,n=w*h,mw=map?.width,mh=map?.height,
  coarse=group?.selected,labels=map?.labels,semantic=map?.semanticLabels;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<12||h<12||n>4_000_000||
  ![3,4].includes(image.channels)||image.data?.length!==n*image.channels||
  !Number.isInteger(mw)||!Number.isInteger(mh)||mw<2||mh<2||mw*mh>262144||
  coarse?.length!==mw*mh||(labels&&labels.length!==coarse.length)||
  (semantic&&semantic.length!==coarse.length)||
  !Number.isInteger(group.id)||group.id<1||group.id>17||
  !Number.isInteger(haloPixels)||haloPixels<1||haloPixels>3||
  !Number.isFinite(maxColorDistance)||maxColorDistance<0||maxColorDistance>65||
  !Number.isFinite(minOutsideContrast)||minOutsideContrast<25||minOutsideContrast>180||
  !Number.isFinite(maxGrowthFraction)||maxGrowthFraction<0||maxGrowthFraction>.2)
  throw Error('Invalid experimental original-pixel edge evidence');
 for(const v of coarse)if(v!==0&&v!==1&&v!==255)throw Error('Invalid predicted mask');
 const base=new Uint8Array(n),candidate=new Uint8Array(n);
 // Map the production coarse mask to the original photo with the same
 // nearest-cell convention as the current display engine.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=Math.min(mh-1,Math.floor(y*mh/h))*mw+Math.min(mw-1,Math.floor(x*mw/w));
  base[y*w+x]=coarse[k]?1:0;
 }
 candidate.set(base);
 let originalCount=0,proposals=0,rejectedSemantic=0,rejectedWeakContrast=0;
 for(const v of base)originalCount+=v;
 const budget=Math.floor(originalCount*maxGrowthFraction),accepted=[];
 const rgb=(x,y)=>{const k=(y*w+x)*image.channels;return [image.data[k],image.data[k+1],image.data[k+2]];};
 for(let y=haloPixels;y<h-haloPixels;y++)for(let x=haloPixels;x<w-haloPixels;x++){
  const index=y*w+x;if(base[index])continue;
  const mapped=Math.min(mh-1,Math.floor(y*mh/h))*mw+Math.min(mw-1,Math.floor(x*mw/w));
  if(labels?.[mapped]&&labels[mapped]!==group.id||
    semantic?.[mapped]&&semantic[mapped]!==group.id){rejectedSemantic++;continue;}
  let nearest=null,minDistance=Infinity;
  for(let dy=-haloPixels;dy<=haloPixels;dy++)for(let dx=-haloPixels;dx<=haloPixels;dx++){
   const d=dx*dx+dy*dy;if(!d||d>haloPixels*haloPixels||!base[(y+dy)*w+x+dx])continue;
   if(d<minDistance){nearest=[x+dx,y+dy];minDistance=d;}
  }
  if(!nearest)continue;
  proposals++;
  const foreground=rgb(...nearest),pixel=rgb(x,y);
  if(distance(foreground,pixel)>maxColorDistance){rejectedWeakContrast++;continue;}
  const dirX=Math.sign(x-nearest[0]),dirY=Math.sign(y-nearest[1]);
  let contrast=0,backgroundSamples=0;
  // Only look away from the confirmed garment. A uniform similarly-colored
  // backdrop cannot be distinguished from fabric and must fail closed.
  for(const step of [3,4,5,6]){
   const xx=x+dirX*step,yy=y+dirY*step;
   if(xx<0||yy<0||xx>=w||yy>=h||base[yy*w+xx])continue;
   backgroundSamples++;
   if(distance(rgb(xx,yy),pixel)>=minOutsideContrast)contrast++;
  }
  if(backgroundSamples<3||contrast<3){rejectedWeakContrast++;continue;}
  accepted.push(index);
 }
 const refusedForBudget=accepted.length>budget;
 if(!refusedForBudget)for(const i of accepted)candidate[i]=1;
 return {baseline:base,candidate,addedPixels:refusedForBudget?0:accepted.length,
  proposals,rejectedSemantic,rejectedWeakContrast,budget,refusedForBudget,
  originalPixelsOnly:true,modifiesRecognition:false,modifiesSourcePhoto:false,
  modelPromoted:false,realPhotoAccuracyMeasured:false,productionAuthorized:false};
}
export function scoreSyntheticEdgeTrial(truth,trial,width,height,{label='synthetic'}={}){
 if(truth?.length!==width*height||trial.baseline?.length!==truth.length||
    trial.candidate?.length!==truth.length)throw Error('Synthetic mask length mismatch');
 const a=scoreGarmentMask(truth,trial.baseline,width,height),
  b=scoreGarmentMask(truth,trial.candidate,width,height);
 return {label,baseline:{recall:a.garmentRecall,precision:a.garmentPrecision,
   falsePositive:a.falsePositive,falseNegative:a.falseNegative,iou:a.intersectionOverUnion},
  candidate:{recall:b.garmentRecall,precision:b.garmentPrecision,
   falsePositive:b.falsePositive,falseNegative:b.falseNegative,iou:b.intersectionOverUnion},
  addedPixels:trial.addedPixels,
  passesSyntheticNoNewBackground:b.falsePositive<=a.falsePositive,
  gainsSyntheticRecall:b.garmentRecall>a.garmentRecall,
  independentlyReviewedRealMasks:false,productionAuthorized:false};
}
