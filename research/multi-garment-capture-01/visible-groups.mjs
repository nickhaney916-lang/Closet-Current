/**
 * MULTI-GARMENT-CAPTURE-01 — conservative connected visible garments.
 * Operates on the EXISTING SegFormer logits-to-label result. Not a new model.
 * A box is only a suggested visible region; it cannot establish garment type,
 * identity, ownership, hidden sides, or ready-to-fit 3D surfaces.
 */
import {clothingRegions} from '../../public/outfit-segmentation.mjs';

const ALLOWED=new Set([4,5,6,7,9]); // top/outerwear, skirt, lower, dress, shoes
const cutoff=(w,h)=>Math.max(12,Math.ceil(w*h*.001));
const pixelNeighbors=(i,w,h)=>{const x=i%w,y=Math.floor(i/w),out=[];
 if(x)out.push(i-1);if(x+1<w)out.push(i+1);
 if(y)out.push(i-w);if(y+1<h)out.push(i+w);return out;
};
export function visibleGarmentGroups24(map,{limit=12}={}){
 const {labels,confidence,width:w,height:h}=map||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>512*512||
    labels?.length!==w*h||confidence?.length!==w*h)throw Error('MULTI24 invalid label map');
 const seen=new Uint8Array(w*h),parts=[];
 for(let start=0;start<labels.length;start++){
  const id=labels[start];if(seen[start]||!ALLOWED.has(id))continue;
  seen[start]=1;const queue=[start],component=[], bounds={left:w,top:h,right:0,bottom:0};let sum=0;
  for(let at=0;at<queue.length;at++){
   const i=queue[at],x=i%w,y=Math.floor(i/w);
   component.push(i);sum+=confidence[i];
   bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);
   bounds.right=Math.max(bounds.right,x+1);bounds.bottom=Math.max(bounds.bottom,y+1);
   for(const n of pixelNeighbors(i,w,h))if(!seen[n]&&labels[n]===id){seen[n]=1;queue.push(n);}
  }
  const avg=sum/component.length;
  if(component.length<cutoff(w,h)||avg<.8||bounds.right-bounds.left<2||bounds.bottom-bounds.top<2)continue;
  parts.push({id,component,bounds,avg});
 }
 // Two anatomically adjacent shoe regions can be one pair; do not join
 // disconnected shirts or confuse distinct shoes across the entire scene.
 const shoes=parts.filter(p=>p.id===9).sort((a,b)=>a.bounds.left-b.bounds.left);
 const paired=new Set(),result=[];
 for(let i=0;i<shoes.length;i++)for(let j=i+1;j<shoes.length;j++){
  const a=shoes[i],b=shoes[j];if(paired.has(a)||paired.has(b))continue;
  const yDelta=Math.abs((a.bounds.top+a.bounds.bottom-b.bounds.top-b.bounds.bottom)/2);
  const separation=Math.max(0,b.bounds.left-a.bounds.right);
  if(yDelta>h*.12||separation>w*.15)continue;
  result.push({id:9,component:[...a.component,...b.component],
   bounds:{left:Math.min(a.bounds.left,b.bounds.left),top:Math.min(a.bounds.top,b.bounds.top),
    right:Math.max(a.bounds.right,b.bounds.right),bottom:Math.max(a.bounds.bottom,b.bounds.bottom)},
   avg:(a.avg*a.component.length+b.avg*b.component.length)/(a.component.length+b.component.length)});
  paired.add(a);paired.add(b);break;
 }
 for(const part of parts)if(!paired.has(part))result.push(part);
 result.sort((a,b)=>a.bounds.top-b.bounds.top||a.bounds.left-b.bounds.left||a.id-b.id);
 const counts=new Map();
 return result.slice(0,Math.max(1,Math.min(24,limit))).map(part=>{
  const selected=new Uint8Array(w*h);for(const i of part.component)selected[i]=1;
  const region=clothingRegions.find(x=>x.id===part.id),n=(counts.get(part.id)||0)+1;counts.set(part.id,n);
  return {id:part.id,label:region.label,categories:region.categories,types:region.types||[],
   selected,count:part.component.length,confidence:part.avg,bounds:part.bounds,
   clipped:part.bounds.left===0||part.bounds.top===0||part.bounds.right===w||part.bounds.bottom===h,
   // Stable within an identical inference result. A crop edit never changes it.
   instanceKey:'seg-'+part.id+'-'+part.bounds.left+'-'+part.bounds.top+'-'+part.bounds.right+'-'+part.bounds.bottom+'-'+n,
   needsReview:true,personDetected:!!map.personDetected};
 });
}
