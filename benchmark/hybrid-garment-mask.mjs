// Review-only fusion of semantic clothing labels and object-level alpha.
// NEVER used by the shipping app. No heuristic can certify a clothing-only mask.
import {selectedCategoryMask} from './clothing-only-comparison.mjs';

export function protectedBodyFromLogits(data,dims){
  if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18
      ||!Number.isInteger(dims[2])||!Number.isInteger(dims[3])
      ||dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512
      ||data?.length!==dims.reduce((a,b)=>a*b,1))throw Error('Invalid semantic logits');
  const area=dims[2]*dims[3],protectedPixels=new Uint8Array(area);
  const body=new Set([2,11,12,13,14,15]);
  for(let i=0;i<area;i++){
    let best=-Infinity,label=-1;
    for(let c=0;c<18;c++){
      const score=data[c*area+i];
      if(!Number.isFinite(score))throw Error('Non-finite semantic class');
      if(score>best){best=score;label=c;}
    }
    if(body.has(label))protectedPixels[i]=1;
  }
  return protectedPixels;
}

export function hybridGarmentAlpha(objectAlpha,nativeWidth,nativeHeight,map,category,{
  protectedBody=null,haloCells=2,minSemanticPixels=10,objectThreshold=128
}={}){
  if(!Number.isInteger(nativeWidth)||!Number.isInteger(nativeHeight)||nativeWidth<1||nativeHeight<1
      ||nativeWidth*nativeHeight>12000000||objectAlpha?.length!==nativeWidth*nativeHeight
      ||!Number.isInteger(haloCells)||haloCells<0||haloCells>4
      ||!Number.isInteger(objectThreshold)||objectThreshold<1||objectThreshold>255)
    throw Error('Invalid alpha or fusion configuration');
  const semantic=selectedCategoryMask(map,category,{minimumPixels:minSemanticPixels});
  const width=map.width,height=map.height,area=width*height;
  if(map.personDetected&&protectedBody?.length!==area)throw Error('Person detected without verified body exclusion labels');
  if(protectedBody&&protectedBody.length!==area)throw Error('Invalid protected body shape');
  const distances=new Int16Array(area).fill(-1),queue=new Uint32Array(area);let read=0,write=0;
  for(let i=0;i<area;i++){
    if(!semantic.alpha[i]||protectedBody?.[i])continue;
    distances[i]=0;queue[write++]=i;
  }
  // Grow at most two semantic cells from the *target category*, never through
  // known body, other garment classes, or standalone foreground components.
  while(read<write){
    const i=queue[read++],distance=distances[i];
    if(distance>=haloCells)continue;
    const x=i%width,y=Math.floor(i/width);
    for(const n of [x>0?i-1:-1,x<width-1?i+1:-1,y>0?i-width:-1,y<height-1?i+width:-1]){
      if(n<0||distances[n]>=0||protectedBody?.[n]||map.labels[n]&&semantic.selectedClasses.includes(map.labels[n])===false)continue;
      distances[n]=distance+1;queue[write++]=n;
    }
  }
  const out=new Uint8Array(objectAlpha.length);
  let objectPixels=0,keptPixels=0,bodyVetoedPixels=0,seedOverlap=0;
  for(let y=0;y<nativeHeight;y++){
    const coarseY=Math.min(height-1,Math.floor(y*height/nativeHeight));
    for(let x=0;x<nativeWidth;x++){
      const index=y*nativeWidth+x,sourceAlpha=objectAlpha[index];
      if(!Number.isInteger(sourceAlpha)||sourceAlpha<0||sourceAlpha>255)throw Error('Invalid 8-bit object alpha');
      if(sourceAlpha<objectThreshold)continue;
      objectPixels++;
      const c=coarseY*width+Math.min(width-1,Math.floor(x*width/nativeWidth));
      if(protectedBody?.[c]){bodyVetoedPixels++;continue;}
      if(distances[c]<0)continue;
      out[index]=255;keptPixels++;
      if(semantic.alpha[c])seedOverlap++;
    }
  }
  return {alpha:out,category,semanticPixels:semantic.foregroundPixels,
    seedDetected:semantic.detected&&write>0,objectPixels,keptPixels,
    removedPixels:objectPixels-keptPixels,bodyVetoedPixels,seedOverlap,
    haloCells,sourceRgbUnchanged:true,accuracyMeasured:false,garmentOnlyVerified:false,
    releaseApproved:false};
}
