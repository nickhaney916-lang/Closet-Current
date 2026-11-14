// Mission 1 experimental garment-instance proposals only. No save authority.
// The native semantic SegFormer class mask unions disconnected garments of the
// same class. A split is useful for OWNER REVIEW, but not proof of object count.
// Never discard, duplicate or invent any pixel from the accepted source mask.
import {clothingMaskGroups} from './outfit-segmentation.mjs';

const MAX_REVIEW_COMPONENTS=32;
function acceptedComponents(map,group){
 const {width,height}=map,accepted=group.selected,seen=new Uint8Array(accepted.length);
 const minimum=Math.max(12,Math.ceil(width*height*.001)),parts=[];
 for(let start=0;start<accepted.length;start++){
  if(seen[start]||!accepted[start])continue;
  // A noisy mask with too many islands stays as one unresolved source group.
  if(parts.length===MAX_REVIEW_COMPONENTS)return null;
  const queue=[start];seen[start]=1;
  let minX=width,minY=height,maxX=-1,maxY=-1,sum=0;
  for(let head=0;head<queue.length;head++){
   const i=queue[head],x=i%width,y=Math.floor(i/width);
   sum+=map.confidence[i];
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1]){
    if(n>=0&&!seen[n]&&accepted[n]){seen[n]=1;queue.push(n);}
   }
  }
  const confidence=sum/queue.length;
  parts.push({indices:queue,count:queue.length,confidence,
   bounds:{left:minX,top:minY,right:maxX+1,bottom:maxY+1},
   clipped:minX===0||minY===0||maxX===width-1||maxY===height-1,
   usable:queue.length>=minimum&&Number.isFinite(confidence)&&confidence>=.8});
 }
 return parts;
}
// Actual exposed P68 validation (16 genuine photos / 53 independent human
// masks, 2026-11-14) found identical 27/53 matched instances versus shoe-only,
// but six extra false positives from all-class splitting (46 vs 40 proposals).
// Keep the real worker's one-flag review conservative. The all-class candidate
// remains explicitly callable for RESEARCH comparison only; no auto admission.
export function clothingReviewInstances840(map,{splitNonFootwear=false}={}){
 const original=clothingMaskGroups(map),output=[],{width,height}=map;
 for(const group of original){
  const parts=acceptedComponents(map,group);
  // If any accepted fragment is too small/weak, do NOT silently drop it.
  // Keep the entire source mask available for explicit manual grouping.
  if(!parts||!parts.length||parts.some(p=>!p.usable)){
   output.push({...group,requiresReview:true,instanceMethod:'native_semantic_group_unresolved_fragments',
    componentReviewStatus:'unresolved_fragments_keep_source_mask'});
   continue;
  }
  // Preserve legacy single-instance behavior for non-footwear classes. Shoe
  // components stay individually reviewable under the existing P840 contract.
  if(group.id!==9&&(!splitNonFootwear||parts.length===1)){
   output.push({...group,requiresReview:true,instanceMethod:'native_semantic_group'});
   continue;
  }
  for(const part of parts){
   const selected=new Uint8Array(width*height);
   for(const i of part.indices)selected[i]=1;
   output.push({...group,selected,count:part.count,confidence:part.confidence,
    bounds:part.bounds,clipped:part.clipped,requiresReview:true,
    instanceMethod:group.id===9?'connected_footwear_component':'connected_semantic_component_unverified',
    componentReviewStatus:'owner_must_confirm_garment_units'});
  }
 }
 return output;
}
