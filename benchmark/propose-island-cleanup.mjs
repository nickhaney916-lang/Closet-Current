import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Experimental candidate: retain all substantial islands, never assume only one garment piece.
export function proposeIslandCleanup(prediction,{minimumFraction=0.002}={}){
 const {width,height}=prediction,mask=decodeReferenceMask(prediction),n=mask.length;
 if(!Number.isFinite(minimumFraction)||minimumFraction<0||minimumFraction>1)throw Error('Invalid minimum fraction');
 const seen=new Uint8Array(n),removed=new Uint8Array(n),components=[];const threshold=Math.max(2,Math.ceil(n*minimumFraction));
 for(let start=0;start<n;start++){
  if(!mask[start]||seen[start])continue;
  const q=[start];seen[start]=1;
  for(let k=0;k<q.length;k++){
   const i=q[k],x=i%width,y=(i/width)|0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;
    if(xx<0||xx>=width||yy<0||yy>=height)continue;
    const j=yy*width+xx;if(mask[j]&&!seen[j]){seen[j]=1;q.push(j);}
   }
  }
  const candidate=q.length<threshold;components.push({size:q.length,candidate});
  if(candidate)for(const i of q)removed[i]=1;
 }
 const cleaned=new Uint8Array(n);let removedPixels=0;
 for(let i=0;i<n;i++){cleaned[i]=mask[i]&&!removed[i]?1:0;removedPixels+=removed[i];}
 return {cleaned,removed,removedPixels,threshold,components,flaggedComponents:components.filter(c=>c.candidate).length,retainedPixels:cleaned.reduce((a,b)=>a+b,0)};
}
