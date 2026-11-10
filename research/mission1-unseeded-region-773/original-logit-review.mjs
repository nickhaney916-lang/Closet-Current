/**
 * Mission 1 Priority #773: source-logit-supported, previously UNSEEDED
 * garment-region candidates for explicit human review only.
 *
 * This does not edit the app segmentation, infer missing source pixels,
 * label a subtype/color, or claim owner approval. If a garment has NO
 * sufficiently supported logits, it remains missing (not hallucinated).
 */
import {clothingLabelMap,clothingRegions} from '../../public/outfit-segmentation.mjs';

const ALLOWED=new Set([4,5,6,7,9]);
const LABEL=new Map(clothingRegions.map(x=>[x.id,x.label]));
const fail=x=>{throw Error('M1_UNSEEDED_773: '+x)};
const LIMIT=8;
const THRESHOLD=.50;
const MARGIN=.07;
function neighbors(i,w,h){
 const x=i%w,y=Math.floor(i/w);
 return [x?i-1:-1,x+1<w?i+1:-1,y?i-w:-1,y+1<h?i+w:-1].filter(x=>x>=0);
}
export function unseededGarmentReview773({data,dims,map,existingGroups=[]}={}){
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||
    !Number.isInteger(dims[2])||!Number.isInteger(dims[3])||
    dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512)fail('invalid source model dimensions');
 const h=dims[2],w=dims[3],n=h*w;
 if(!data||data.length!==18*n||
    map?.width!==w||map?.height!==h||map.labels?.length!==n||
    !Array.isArray(existingGroups)||existingGroups.length>24)
  fail('mismatched actual logits, immutable source map or existing seed groups');
 // Recompute the exact original 18-class segmentation decision BEFORE
 // any candidate may be constructed. No spoofed source map admitted.
 const original=clothingLabelMap(data,dims);
 for(let i=0;i<n;i++)if(original.labels[i]!==map.labels[i])
  fail('source label SHA-inconsistent with original logits');
 const occupied=new Uint8Array(n),existing=new Set();
 for(const g of existingGroups){
  if(!ALLOWED.has(g?.id)||g.selected?.length!==n||!g.selected.some(Boolean)||
     typeof g.instanceKey!=='string'||!g.instanceKey||existing.has(g.instanceKey)||
     g.selected.some(x=>x!==0&&x!==1))
   fail('untrusted/empty/duplicated source group cannot seed independent review');
  existing.add(g.instanceKey);
  for(let i=0;i<n;i++)if(g.selected[i]){
   if(occupied[i]||!(original.labels[i]===g.id||original.labels[i]===0))
    fail('existing garment group overwrote other class or duplicated pixels');
   occupied[i]=g.id;
  }
 }
 const candidateClass=new Uint8Array(n),confidence=new Float32Array(n),
  probability=new Float64Array(18);
 for(let i=0;i<n;i++){
  if(map.labels[i]||occupied[i])continue; // NEVER change confident pixels.
  let highest=-Infinity;
  for(let c=0;c<18;c++){
   const v=data[c*n+i];
   if(!Number.isFinite(v))fail('nonfinite source model logits');
   highest=Math.max(v,highest);
  }
  probability.fill(0);
  let denominator=0;
  for(let c=0;c<18;c++){
   const p=Math.exp(data[c*n+i]-highest);
   probability[c===10?9:c]+=p;denominator+=p;
  }
  let best=0,second=0,winner=0;
  for(let c=0;c<18;c++){
   const value=probability[c];
   if(value>best){second=best;best=value;winner=c;}
   else second=Math.max(second,value);
  }
  const score=best/denominator,margin=(best-second)/denominator;
  if(ALLOWED.has(winner)&&score>=THRESHOLD&&margin>=MARGIN){
   candidateClass[i]=winner;confidence[i]=score;
  }
 }
 const seen=new Uint8Array(n),cutoff=Math.max(12,Math.ceil(n*.002)),candidates=[];
 for(let i=0;i<n;i++){
  const cls=candidateClass[i];
  if(!cls||seen[i])continue;
  const queue=[i],mask=new Uint8Array(n);seen[i]=1;
  let sum=0,left=w,top=h,right=0,bottom=0,touchesExisting=false;
  for(let p=0;p<queue.length;p++){
   const k=queue[p],x=k%w,y=Math.floor(k/w);
   mask[k]=1;sum+=confidence[k];
   left=Math.min(left,x);right=Math.max(right,x+1);
   top=Math.min(top,y);bottom=Math.max(bottom,y+1);
   for(const j of neighbors(k,w,h)){
    if(occupied[j]===cls)touchesExisting=true;
    if(!seen[j]&&candidateClass[j]===cls){seen[j]=1;queue.push(j);}
   }
  }
  const count=queue.length,mean=sum/count;
  // A candidate touching an already visible same-family garment is merely
  // boundary uncertainty; P767's separate grow-from-real-seed policy owns it.
  if(touchesExisting||count<cutoff||count>n*.3||mean<.54)continue;
  candidates.push({
   id:cls,label:LABEL.get(cls),instanceKey:'m1-unseeded-'+cls+'-'+i,
   selected:mask,count,confidence:mean,
   bounds:{left,top,right,bottom},
   clipped:left===0||top===0||right===w||bottom===h,
   needsReview:true,accepted:false,autoIndex:false,
   source:'real-original-logits-unseeded-review',
   sourceLabelChanged:false,originalSeedCount:0,
   originalPixelMembershipSynthesized:false,
   subtype:'Unknown',primaryColor:'Unknown'
  });
 }
 candidates.sort((a,b)=>b.count-a.count||a.instanceKey.localeCompare(b.instanceKey));
 return candidates.slice(0,LIMIT);
}
