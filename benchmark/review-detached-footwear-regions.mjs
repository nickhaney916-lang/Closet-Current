import {decodeReferenceMask} from './garment-mask-metrics.mjs';

// Review-only 8-connected foreground analysis. A separate shoe lace, heel, or
// detached garment part must not be deleted just because it is small.
export function reviewDetachedFootwearRegions(prediction,{bottomFraction=.35,maxFraction=.015}={}){
 if(!Number.isFinite(bottomFraction)||bottomFraction<=0||bottomFraction>1||!Number.isFinite(maxFraction)||maxFraction<=0||maxFraction>1)throw Error('Invalid review parameters');
 const {width,height}=prediction,mask=decodeReferenceMask(prediction),seen=new Uint8Array(mask.length),components=[];
 for(let start=0;start<mask.length;start++){
  if(!mask[start]||seen[start])continue;
  let minX=width,maxX=-1,minY=height,maxY=-1;
  const queue=[start];seen[start]=1;
  for(let k=0;k<queue.length;k++){
   const i=queue[k],x=i%width,y=Math.floor(i/width);
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const nx=x+dx,ny=y+dy;
    if(nx<0||nx>=width||ny<0||ny>=height)continue;
    const n=ny*width+nx;if(mask[n]&&!seen[n]){seen[n]=1;queue.push(n);}
   }
  }
  components.push({pixels:queue.length,bounds:{minX,minY,maxX,maxY},bottomRegion:maxY>=Math.floor(height*(1-bottomFraction)),small:queue.length<=Math.max(1,Math.floor(mask.length*maxFraction))});
 }
 const candidates=components.filter(c=>c.small&&c.bottomRegion);
 return {components,candidates,candidatePixels:candidates.reduce((total,c)=>total+c.pixels,0),reviewOnly:true,removedPixels:0,requiresApprovedReference:true};
}
