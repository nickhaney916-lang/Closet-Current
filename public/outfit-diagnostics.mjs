// Opt-in, aggregate diagnostic for the existing semantic outfit worker.
// Counts model decisions, NOT garment instance recall, mask precision or truth.
// No photographs, pixel coordinates, clothing colors, faces or account data leave the worker.
const REGION_IDS=[1,3,4,5,6,7,8,9,16,17];
const REGION_NAMES={1:'Hat',3:'Sunglasses',4:'Upper garment',5:'Skirt',6:'Bottoms',7:'Dress',8:'Belt',9:'Shoes',16:'Bag',17:'Scarf'};
export function diagnoseOutfitRegions(logits,dims,map,groups){
 const [batch,classes,height,width]=dims||[],area=height*width;
 if(batch!==1||classes!==18||!Number.isInteger(height)||!Number.isInteger(width)||
   height<1||width<1||height>512||width>512||!logits||logits.length!==18*area||
   map?.width!==width||map?.height!==height||map.labels?.length!==area||
   map.confidence?.length!==area||!Array.isArray(groups))throw Error('Invalid outfit diagnostic input');
 const winners=new Uint32Array(18),trusted=new Uint32Array(18),weighted=new Float64Array(18);
 for(let i=0;i<area;i++){
  let max=-Infinity;
  for(let c=0;c<18;c++){const value=logits[c*area+i];if(!Number.isFinite(value))throw Error('Invalid diagnostic logits');if(value>max)max=value;}
  weighted.fill(0);
  for(let c=0;c<18;c++)weighted[c===10?9:c]+=Math.exp(logits[c*area+i]-max);
  let best=0,bestMass=-1;
  for(let c=0;c<18;c++)if(weighted[c]>bestMass){bestMass=weighted[c];best=c;}
  winners[best]++;
  if(map.labels[i])trusted[map.labels[i]]++;
 }
 const minComponent=Math.max(4,Math.ceil(area*.0007));
 const minGroup=Math.max(12,Math.ceil(area*.001));
 const regions=REGION_IDS.map(id=>{
  const seen=new Uint8Array(area),queue=[],sizes=[];let retained=0,confidenceSum=0;
  for(let start=0;start<area;start++){
   if(seen[start]||map.labels[start]!==id)continue;
   queue.length=0;queue.push(start);seen[start]=1;
   for(let head=0;head<queue.length;head++){
    const index=queue[head],x=index%width,y=Math.floor(index/width);
    for(const neighbor of [x>0?index-1:-1,x+1<width?index+1:-1,y>0?index-width:-1,y+1<height?index+width:-1]){
     if(neighbor>=0&&!seen[neighbor]&&map.labels[neighbor]===id){seen[neighbor]=1;queue.push(neighbor);}
    }
   }
   sizes.push(queue.length);
   if(queue.length>=minComponent){retained+=queue.length;for(const p of queue)confidenceSum+=map.confidence[p];}
  }
  const emitted=groups.some(group=>group.id===id);
  const reason=emitted?'emitted':!map.personDetected?'person-evidence-gate':
   winners[id]===0?'not-predicted':trusted[id]===0?'uncertain-model-pixels':
   retained===0?'small-disconnected-regions':retained<minGroup?'insufficient-mask-area':
   confidenceSum/retained<.8?'low-group-confidence':'not-emitted';
  return {id,label:REGION_NAMES[id],winningModelPixels:winners[id],trustedMaskPixels:trusted[id],
   uncertainWinningPixels:Math.max(0,winners[id]-trusted[id]),eligibleComponentPixels:retained,
   discardedSmallComponentPixels:trusted[id]-retained,componentCount:sizes.length,
   eligibleComponentCount:sizes.filter(size=>size>=minComponent).length,
   emitted,reason};
 });
 return {version:1,model:'semantic-clothes-18-class',width,height,personGatePassed:!!map.personDetected,
  minimumComponentPixels:minComponent,minimumGroupPixels:minGroup,emittedGroups:groups.length,
  sourcePixelsUnchanged:true,independentGarmentMasksVerified:false,realPhotoAccuracy:null,regions};
}
