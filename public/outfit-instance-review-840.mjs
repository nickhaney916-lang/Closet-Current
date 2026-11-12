// P841/Parallel #70 HOLD: preserve every already-accepted source shoe pixel.
// Small or low-confidence connected regions are unresolved evidence for review,
// not discarded, auto-paired, or silently counted as owned footwear.
import {clothingMaskGroups} from './outfit-segmentation.mjs';
export function clothingReviewInstances840(map){
 const original=clothingMaskGroups(map),output=[];
 for(const group of original){
  if(group.id!==9){output.push({...group,requiresReview:true,instanceMethod:'native_semantic_group'});continue;}
  const {width,height}=map,seen=new Uint8Array(width*height),minimum=Math.max(12,Math.ceil(width*height*.001));
  const unresolved=[];
  function emit(indices,method){
   if(!indices.length)return;
   const selected=new Uint8Array(width*height);
   let minX=width,minY=height,maxX=-1,maxY=-1,sum=0;
   for(const i of indices){
    selected[i]=1;const x=i%width,y=Math.floor(i/width);
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);sum+=map.confidence[i];
   }
   output.push({...group,selected,count:indices.length,confidence:sum/indices.length,
    bounds:{left:minX,top:minY,right:maxX+1,bottom:maxY+1},
    clipped:minX===0||minY===0||maxX===width-1||maxY===height-1,
    requiresReview:true,instanceMethod:method});
  }
  for(let start=0;start<group.selected.length;start++){
   if(seen[start]||!group.selected[start])continue;
   const queue=[start];seen[start]=1;let sum=0;
   for(let head=0;head<queue.length;head++){
    const i=queue[head],x=i%width,y=Math.floor(i/width);sum+=map.confidence[i];
    for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1])
     if(n>=0&&!seen[n]&&group.selected[n]){seen[n]=1;queue.push(n);}
   }
   if(queue.length<minimum||sum/queue.length<.8)unresolved.push(...queue);
   else emit(queue,'connected_footwear_component');
  }
  // Keep tiny or weak regions in a separate uncertain review proposal rather
  // than losing pixels or inventing independent footwear inventory units.
  emit(unresolved,'unresolved_footwear_fragments');
 }
 return output;
}
