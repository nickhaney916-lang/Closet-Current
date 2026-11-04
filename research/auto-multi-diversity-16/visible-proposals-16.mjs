/**
 * AUTO-MULTI-DIVERSITY-16: conservative proposal-only postprocessing of the
 * unchanged genuine SegFormer clothing label map. Not instance segmentation,
 * not a learned layer splitter, and NEVER permission to auto-save garments.
 */
import {visibleGarmentGroups24} from '../multi-garment-capture-01/visible-groups.mjs';
import {clothingRegions} from '../../public/outfit-segmentation.mjs';
const EXTRA=new Set([1,3,8,16,17]); // accessories excluded from MULTI24
const regionById=new Map(clothingRegions.map(x=>[x.id,x]));
const neighbors=(i,w,h)=>{const x=i%w,y=Math.floor(i/w),r=[];
 if(x>0)r.push(i-1);if(x+1<w)r.push(i+1);
 if(y>0)r.push(i-w);if(y+1<h)r.push(i+w);
 return r;};
function connectedComponents(selected,width,height){
 const seen=new Uint8Array(selected.length),out=[];
 for(let start=0;start<selected.length;start++){
  if(!selected[start]||seen[start])continue;
  const stack=[start];seen[start]=1;
  let minX=width,minY=height,maxX=-1,maxY=-1,count=0;
  for(let at=0;at<stack.length;at++){
   const index=stack[at],x=index%width,y=Math.floor(index/width);
   count++;minX=Math.min(minX,x);minY=Math.min(minY,y);
   maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   for(const n of neighbors(index,width,height))if(selected[n]&&!seen[n]){
    seen[n]=1;stack.push(n);
   }
  }
  out.push({count,bounds:{left:minX,top:minY,right:maxX+1,bottom:maxY+1}});
 }
 return out.sort((a,b)=>b.count-a.count);
}
function rectArea(b){return (b.right-b.left)*(b.bottom-b.top);}
function overlap(a,b){
 const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
 const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 const shared=w*h,union=rectArea(a)+rectArea(b)-shared;
 return union?shared/union:0;
}
export function visibleGarmentGroups16(map,{limit=16,accessories=true}={}){
 const {labels,confidence,width:w,height:h}=map||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>512*512||
  labels?.length!==w*h||confidence?.length!==w*h||
  !Number.isInteger(limit)||limit<1||limit>24)throw Error('MULTI16 invalid map or limit');
 const base=visibleGarmentGroups24(map,{limit:24}).map(group=>{
  const components=connectedComponents(group.selected,w,h);
  const shoePieces=group.id===9?components.filter(x=>x.count>=Math.max(4,Math.ceil(w*h*.0002))):[];
  return {...group,needsReview:true,
   inferredHiddenPixels:0,sourceOriginalUnchanged:true,
   // A pair is one review item, with both visible shoes localized separately.
   shoePartBoxes:shoePieces.map(x=>x.bounds),
   shoePairCandidate:shoePieces.length===2,
   requiresLayerReview:group.id===4,
   proposalOnly:true};
 });
 const candidates=[...base];
 if(accessories){
  const seen=new Uint8Array(w*h);
  for(let start=0;start<labels.length;start++){
   const id=labels[start];if(seen[start]||!EXTRA.has(id))continue;
   seen[start]=1;const stack=[start],pixels=[];
   let sum=0,left=w,top=h,right=0,bottom=0;
   for(let i=0;i<stack.length;i++){
    const p=stack[i],x=p%w,y=Math.floor(p/w);
    pixels.push(p);sum+=confidence[p];
    left=Math.min(left,x);top=Math.min(top,y);
    right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
    for(const n of neighbors(p,w,h))if(!seen[n]&&labels[n]===id){
     seen[n]=1;stack.push(n);
    }
   }
   const threshold=Math.max(8,Math.ceil(w*h*((id===8||id===3)?.0006:.0010)));
   const avg=sum/pixels.length;
   if(pixels.length<threshold||right-left<3||bottom-top<3||
    avg<(map.personDetected?.89:.94))continue;
   const bounds={left,top,right,bottom};
   if(candidates.some(x=>overlap(x.bounds,bounds)>.87))continue;
   const info=regionById.get(id),selected=new Uint8Array(w*h);
   for(const p of pixels)selected[p]=1;
   candidates.push({id,label:info.label,categories:info.categories,types:info.types||[],
    selected,count:pixels.length,confidence:avg,bounds,
    clipped:left===0||top===0||right===w||bottom===h,
    instanceKey:'seg-'+id+'-'+left+'-'+top+'-'+right+'-'+bottom+'-1',
    needsReview:true,proposalOnly:true,personDetected:!!map.personDetected,
    sourceOriginalUnchanged:true,inferredHiddenPixels:0,requiresLayerReview:false,
    shoePartBoxes:[],shoePairCandidate:false});
  }
 }
 // Preserve distinct connected instances of one semantic class and never
 // merge adjacent distinct garments to increase a score.
 return candidates.sort((a,b)=>a.bounds.top-b.bounds.top||
  a.bounds.left-b.bounds.left||a.id-b.id).slice(0,limit);
}
