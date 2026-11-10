/**
 * Mission 1 P776: source-conserving disconnected garment review.
 * These are uncertain, human-review-only alternative instance proposals.
 * Disconnection is not proof of separate garments (e.g. occlusions);
 * touching garments may stay joined. Never auto-save or infer hidden pixels.
 */
import {clothingLabelMap} from '../../public/outfit-segmentation.mjs';
const FAMILIES=new Set([4,5,6,7,9]);
const fail=why=>{throw Error('MISSION1_COMPONENT_776: '+why)};
const countOK=x=>Number.isInteger(x)&&x>=0;
// Verify each soft boundary pixel actually won its family in the unchanged
// 18-class original softmax, using the exact P767 thresholds. A label=0
// alone is not evidence that the pixel belongs to any garment.
function sourceSupportedWeak(data,n,i,family){
 let peak=-Infinity;
 for(let c=0;c<18;c++)peak=Math.max(peak,data[c*n+i]);
 const weights=new Float64Array(18);let sum=0;
 for(let c=0;c<18;c++){
  const x=Math.exp(data[c*n+i]-peak);
  weights[c===10?9:c]+=x;sum+=x;
 }
 let winner=0,first=0,second=0;
 for(let c=0;c<18;c++){
  if(weights[c]>first){second=first;first=weights[c];winner=c;}
  else second=Math.max(second,weights[c]);
 }
 return winner===family&&first/sum>=.5&&(first-second)/sum>=.1;
}
function neighbors(i,w,h){
 const x=i%w,y=Math.floor(i/w);
 return [x?i-1:-1,x+1<w?i+1:-1,y?i-w:-1,y+1<h?i+w:-1].filter(i=>i>=0);
}
function proposal(g,indices,w,h,labels,part,total){
 const selected=new Uint8Array(w*h);
 let left=w,top=h,right=0,bottom=0;
 for(const k of indices){
  selected[k]=1;const x=k%w,y=Math.floor(k/w);
  left=Math.min(left,x);top=Math.min(top,y);
  right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
 }
 const bounds={left,top,right,bottom};
 const localSeeds=indices.reduce((a,i)=>a+Number(labels[i]===g.id),0);
 const localAdded=indices.length-localSeeds;
 return {...g,selected,count:indices.length,bounds,
  seedPixelCount:localSeeds,addedPixelCount:localAdded,
  maximumAddedPixels:Math.floor(localSeeds*.5),seedConfidence:null,
  sourceGroupSeedPixelCount:g.seedPixelCount,
  sourceGroupAddedPixelCount:g.addedPixelCount,
  clipped:left===0||top===0||right===w||bottom===h,
  instanceKey:total>1?g.instanceKey+'-component-'+part:g.instanceKey,
  sourceGroupId:g.instanceKey,sourceComponentCount:total,componentOrdinal:part,
  sourcePixelPartitionExact:true,source:'real-segformer-component-review-only',
  confidence:null,needsReview:true,accepted:false,autoIndex:false,
  subtype:'Unknown',primaryColor:'Unknown'};
}
export function sourceComponentReview776({data,dims,map,groups}={}){
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||
    !Number.isInteger(dims[2])||!Number.isInteger(dims[3])||
    dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512)
  fail('frozen model dimensions missing');
 const h=dims[2],w=dims[3],n=w*h;
 if(data?.length!==18*n||map?.width!==w||map?.height!==h||
    map.labels?.length!==n||!Array.isArray(groups)||groups.length>24)
  fail('mismatched real model logits, source map or review groups');
 const original=clothingLabelMap(data,dims);
 for(let i=0;i<n;i++)if(original.labels[i]!==map.labels[i])
  fail('source map does not match unmodified SegFormer logits');
 const owned=new Uint8Array(n),keys=new Set(),out=[];
 for(const g of groups){
  if(!g||!FAMILIES.has(g.id)||typeof g.instanceKey!=='string'||!g.instanceKey||
     keys.has(g.instanceKey)||g.selected?.length!==n||
     !countOK(g.seedPixelCount)||!countOK(g.addedPixelCount)||
     !countOK(g.maximumAddedPixels)||!countOK(g.count)||
     g.selected.some(v=>v!==0&&v!==1)||
     g.accepted!==false||g.needsReview!==true)
   fail('only distinct existing human-review-required source masks accepted');
  keys.add(g.instanceKey);
  let seed=0,added=0,total=0;
  for(let i=0;i<n;i++)if(g.selected[i]){
   if(owned[i]||!(map.labels[i]===g.id||map.labels[i]===0))
    fail('duplicated, fabricated or other-class source pixel');
   owned[i]=1;total++;
   if(map.labels[i]===g.id)seed++;
   else{
    if(!sourceSupportedWeak(data,n,i,g.id))
     fail('weak source pixel lacks original SegFormer class confidence and margin');
    added++;
   }
  }
  if(!total||seed!==g.seedPixelCount||added!==g.addedPixelCount||
     total!==g.count||added>g.maximumAddedPixels||
     g.maximumAddedPixels!==Math.floor(seed*.5))
   fail('source seed, weak pixel counts or growth budget mismatch');
  const seen=new Uint8Array(n),components=[];
  for(let i=0;i<n;i++){
   if(!g.selected[i]||seen[i])continue;
   const component=[i];seen[i]=1;
   for(let q=0;q<component.length;q++)for(const j of neighbors(component[q],w,h)){
    if(g.selected[j]&&!seen[j]){seen[j]=1;component.push(j);}
   }
   components.push(component);
  }
  // Small occluded regions, noise and all footwear remain one reviewed mask.
  const min=Math.max(12,Math.ceil(n*.001),Math.ceil(total*.08));
  const canSplit=g.id!==9&&components.length>=2&&components.length<=6&&
   components.every(c=>{
    if(c.length<min)return false;
    const localSeed=c.reduce((a,i)=>a+Number(map.labels[i]===g.id),0);
    return localSeed>0&&c.length-localSeed<=Math.floor(localSeed*.5);
   })&&out.length+components.length<=24;
  const chosen=canSplit?components:[Array.from(g.selected,(_,i)=>i).filter(i=>g.selected[i])];
  for(let i=0;i<chosen.length;i++)out.push(proposal(g,chosen[i],w,h,map.labels,i+1,chosen.length));
 }
 if(out.length>24)fail('too many review-only proposals');
 return out;
}
