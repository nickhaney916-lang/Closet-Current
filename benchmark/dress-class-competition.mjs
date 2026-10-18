// Experimental competition between a committed dress label and near-runner-up
// shirt / skirt / bottom logits. This is NOT garment instance segmentation.
// Color-coded pixels are model uncertainty, not human-verified fabric.
export function dressClassCompetition(data,dims,map,{maxLogitMargin=2}={}){
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||
  !Number.isInteger(dims[2])||!Number.isInteger(dims[3])||
  dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512||
  data?.length!==dims.reduce((a,b)=>a*b,1)||
  map?.width!==dims[3]||map?.height!==dims[2]||
  map?.labels?.length!==dims[2]*dims[3]||
  !Number.isFinite(maxLogitMargin)||maxLogitMargin<.25||maxLogitMargin>4)
  throw Error('Invalid raw garment competition');
 const w=dims[3],h=dims[2],n=w*h,counts={upper:0,skirt:0,bottoms:0};
 const diagnostics=new Uint8Array(n);
 let dressPixels=0,lowMarginCount=0,minY=h,maxY=-1;
 const classIds=[4,5,6],names=['upper','skirt','bottoms'];
 // The model's raw pre-softmax logits are never thresholded into a revised
 // production mask. Examine committed dress pixels only.
 for(let i=0;i<n;i++){
  if(map.labels[i]!==7)continue;
  const score=data[7*n+i];
  if(!Number.isFinite(score))throw Error('Invalid source logits');
  dressPixels++;let best=-Infinity,cls=-1;
  for(const id of classIds){const s=data[id*n+i];if(!Number.isFinite(s))throw Error('Invalid alternative logits');
   if(s>best){best=s;cls=id;}}
  const margin=score-best;
  if(margin<0)throw Error('Semantic label disagrees with source logits');
  if(margin>maxLogitMargin)continue;
  lowMarginCount++;diagnostics[i]=cls;
  counts[names[classIds.indexOf(cls)]]++;
  const y=Math.floor(i/w);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 // A dress may actually be a dress with sleeves and skirt-like drape; even
 // separate upper and skirt alternatives do NOT prove two physical pieces.
 const splitY=maxY<0?null:Math.floor((minY+maxY)/2);
 const bands={upper:{upper:0,skirt:0,bottoms:0},lower:{upper:0,skirt:0,bottoms:0}};
 if(splitY!==null)for(let i=0;i<n;i++){
  const id=diagnostics[i];if(!id)continue;
  const group=Math.floor(i/w)<=splitY?bands.upper:bands.lower;
  group[names[classIds.indexOf(id)]]++;
 }
 return {analysis:'dress-vs-upper-skirt-bottoms',sourceClass:7,modelOnly:true,
  selectedDressPixels:dressPixels,lowMarginPixels:lowMarginCount,
  lowMarginShareOfDress:dressPixels?lowMarginCount/dressPixels:0,
  upperSkirtBottomsRunnerUp:counts,ambiguousRegionBands:bands,
  marginThreshold:maxLogitMargin,diagnosticLabels:diagnostics,
  independentGarmentCountMeasured:false,
  automaticItemSplittingAuthorized:false,originalSourceModified:false,
  physicalGarmentCountVerified:0,notPixelLevelAccuracy:true};
}
