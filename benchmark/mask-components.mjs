import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Diagnostic only: disconnected islands may be genuine clothing. Never delete them automatically.
export function maskComponents(prediction){
 const {width,height}=prediction,mask=decodeReferenceMask(prediction),seen=new Uint8Array(mask.length),components=[];
 for(let start=0;start<mask.length;start++){
  if(!mask[start]||seen[start])continue;
  const queue=[start];seen[start]=1;let left=width,top=height,right=0,bottom=0;
  for(let k=0;k<queue.length;k++){
   const i=queue[k],x=i%width,y=(i/width)|0;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
    const next=ny*width+nx;if(mask[next]&&!seen[next]){seen[next]=1;queue.push(next);}
   }
  }
  components.push({pixels:queue.length,bounds:{left,top,width:right-left+1,height:bottom-top+1}});
 }
 components.sort((a,b)=>b.pixels-a.pixels);
 return {count:components.length,components:components.slice(0,12),smallComponents:components.slice(1).length,detachedPixels:components.slice(1).reduce((s,c)=>s+c.pixels,0)};
}
