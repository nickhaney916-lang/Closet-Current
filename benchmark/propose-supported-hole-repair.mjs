import {decodeReferenceMask} from './garment-mask-metrics.mjs';

// Review-only repair: model agreement is evidence for a candidate, not ground truth.
// Never subtract foreground or fill a gap connected to the image boundary.
export function proposeSupportedHoleRepair(baseline,support,{minimumSupport=0.98,maximumHoleFraction=0.02}={}){
 if(!baseline?.sourceSha256||baseline.sourceSha256!==support?.sourceSha256||baseline.image!==support?.image||baseline.width!==support?.width||baseline.height!==support?.height)throw Error('Source identity or dimensions mismatch');
 if(!Number.isFinite(minimumSupport)||minimumSupport<0||minimumSupport>1||!Number.isFinite(maximumHoleFraction)||maximumHoleFraction<0||maximumHoleFraction>1)throw Error('Invalid repair limits');
 const original=decodeReferenceMask(baseline),other=decodeReferenceMask(support),candidate=new Uint8Array(original);
 const {width,height}=baseline,n=original.length,seen=new Uint8Array(n),queue=new Int32Array(n),regions=[];
 const foreground=original.reduce((a,b)=>a+b,0);let addedPixels=0;
 for(let start=0;start<n;start++){
  if(original[start]||seen[start])continue;
  let tail=1,touchesBorder=false,supported=0;queue[0]=start;seen[start]=1;
  for(let head=0;head<tail;head++){
   const i=queue[head],x=i%width,y=Math.floor(i/width);supported+=other[i];
   if(x===0||y===0||x===width-1||y===height-1)touchesBorder=true;
   // Eight-way connectivity avoids filling a real opening connected diagonally.
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;
    const j=yy*width+xx;if(!original[j]&&!seen[j]){seen[j]=1;queue[tail++]=j;}
   }
  }
  if(touchesBorder)continue;
  const supportFraction=supported/tail,accepted=supportFraction>=minimumSupport&&addedPixels+tail<=foreground*maximumHoleFraction;
  regions.push({pixels:tail,supportFraction,accepted});
  if(accepted)for(let k=0;k<tail;k++){candidate[queue[k]]=1;addedPixels++;}
 }
 const runs=[];let previous=0,count=0;
 for(const value of candidate){if(value!==previous){runs.push(count);count=0;previous=value;}count++;}runs.push(count);
 return {prediction:{image:baseline.image,sourceSha256:baseline.sourceSha256,width,height,runs},regions,addedPixels,removedPixels:0,reviewOnly:true,verifiedGarmentRecovery:false,verifiedShadowRemoval:false,productionAuthorized:false};
}
