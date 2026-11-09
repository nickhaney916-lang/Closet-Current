/** Research-only boundary candidates from real logits, never an accepted garment mask. */
import {clothingLabelMap} from '../../public/outfit-segmentation.mjs';
const SUPPORTED=new Set([4,5,6,7,9]);
export function seededBoundaryReview({data,dims,map,groups,recoverFootwear=false}){
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||!Number.isInteger(dims[2])||!Number.isInteger(dims[3])||dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512)throw Error('Invalid review logits dimensions');
 if(typeof recoverFootwear!=='boolean')throw Error('Invalid footwear research option');
 const h=dims[2],w=dims[3],n=w*h;
 if(data?.length!==18*n||map?.width!==w||map?.height!==h||map.labels?.length!==n||!Array.isArray(groups)||groups.length>24)throw Error('Mismatched source map');
 const actual=clothingLabelMap(data,dims);
 for(let i=0;i<n;i++)if(actual.labels[i]!==map.labels[i])throw Error('Source map does not match logits');
 const keys=new Set();
 const eligible=new Uint8Array(n),probability=new Float32Array(n),weights=new Float64Array(18);
 for(let i=0;i<n;i++){
  let max=-Infinity;
  for(let c=0;c<18;c++){const v=data[c*n+i];if(!Number.isFinite(v))throw Error('Nonfinite real logits');max=Math.max(max,v);}
  weights.fill(0);let total=0;
  for(let c=0;c<18;c++){const v=Math.exp(data[c*n+i]-max);weights[c===10?9:c]+=v;total+=v;}
  let best=0,second=0,id=0;
  for(let c=0;c<18;c++)if(weights[c]>best){second=best;best=weights[c];id=c;}else second=Math.max(second,weights[c]);
  if(SUPPORTED.has(id)&&(id!==9||recoverFootwear)&&best/total>=.5&&(best-second)/total>=.1){eligible[i]=id;probability[i]=best/total;}
 }
 const ownership=new Int16Array(n);ownership.fill(-1);
 const output=groups.map((g,k)=>{
  if(!SUPPORTED.has(g.id)||g.selected?.length!==n||typeof g.instanceKey!=='string'||!g.instanceKey||keys.has(g.instanceKey)||!Number.isFinite(g.confidence)||g.confidence<.8||g.confidence>1||g.selected.some(x=>x!==0&&x!==1))throw Error('Invalid admitted seed group');
  keys.add(g.instanceKey);const selected=Uint8Array.from(g.selected);let count=0;
  for(let i=0;i<n;i++)if(selected[i]){
   if(map.labels[i]!==g.id||ownership[i]!==-1)throw Error('Overlapping or wrong-class seed');
   ownership[i]=k;count++;
  }
  if(!count)throw Error('Empty seed group');
  return {...g,selected,count,seedPixelCount:count,addedPixelCount:0,
   maximumAddedPixels:Math.floor(count*.5),seedConfidence:g.confidence,confidence:null,needsReview:true,accepted:false,
   boundaryReviewConfidence:null,source:'original-logits-seeded-boundary-review'};
 });
 // Breadth-first multi-source ownership keeps separate original proposals separate.
 // Only rejected/uncertain original pixels are eligible; no confident label changes.
 const queue=[];for(let i=0;i<n;i++)if(ownership[i]>=0)queue.push(i);
 for(let at=0;at<queue.length;at++){
  const i=queue[at],k=ownership[i],g=output[k],x=i%w,y=Math.floor(i/w);
  for(const j of [x?i-1:-1,x+1<w?i+1:-1,y?i-w:-1,y+1<h?i+w:-1]){
   if(j<0||ownership[j]!==-1||map.labels[j]!==0||eligible[j]!==g.id||g.addedPixelCount>=g.maximumAddedPixels)continue;
   ownership[j]=k;g.selected[j]=1;g.count++;g.addedPixelCount++;queue.push(j);
  }
 }
 for(const [k,g] of output.entries()){
  const bounds={left:w,top:h,right:0,bottom:0};let minimum=1;
  for(let i=0;i<n;i++)if(g.selected[i]){const x=i%w,y=Math.floor(i/w);bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x+1);bounds.bottom=Math.max(bounds.bottom,y+1);if(!groups[k].selected[i])minimum=Math.min(minimum,probability[i]);}
  g.bounds=bounds;g.clipped=bounds.left===0||bounds.top===0||bounds.right===w||bounds.bottom===h;
  g.boundaryReviewConfidence=g.addedPixelCount?minimum:null;
 }
 return output;
}
