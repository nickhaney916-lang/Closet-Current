// P88 EXPOSED-COHORT RESEARCH ONLY. NEVER import into the consumer worker.
// Compare the exact same pinned SegFormer logits under looser *pixel gates*;
// owner approval, original JPEG identity and all app admission stay unchanged.
import {clothingRegions} from '../../public/outfit-segmentation.mjs';

export const P88_EXPOSED_PIXEL_PROBES=Object.freeze({
 researchLoose65:Object.freeze({pixelConfidence:0.65,pixelMargin:0.12}),
 researchLoose55:Object.freeze({pixelConfidence:0.55,pixelMargin:0.08})
});
const CATEGORIES=new Set(clothingRegions.map(x=>x.id));
const BODY=new Set([2,11,12,13,14,15]);

export function exposedPixelGateMap88(data,dims,settings){
 if (!settings||typeof settings!=='object'||
  !Number.isFinite(settings.pixelConfidence)||!Number.isFinite(settings.pixelMargin)||
  settings.pixelConfidence<0.5||settings.pixelConfidence>0.9||
  settings.pixelMargin<0||settings.pixelMargin>0.5)
  throw Error('P88_RESEARCH_INVALID_PIXEL_GATE');
 if (!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||
  !Number.isInteger(dims[2])||!Number.isInteger(dims[3])||
  dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512||
  data?.length!==dims.reduce((a,b)=>a*b,1))
  throw Error('P88_RESEARCH_INVALID_MODEL_LOGITS');
 const height=dims[2],width=dims[3],area=height*width,
  labels=new Uint8Array(area),confidence=new Float32Array(area),
  weighted=new Float64Array(18),bodyCounts=new Uint32Array(18);
 // This intentionally reproduces the *native source* SegFormer mapping
 // (including id 10 sneaker => id 9 shoe fusion). The sole variable is
 // the confidence and class-margin gate at each original logits pixel.
 for(let i=0;i<area;i++){
  let max=-Infinity;
  for(let c=0;c<18;c++){
   const value=data[c*area+i];
   if(!Number.isFinite(value))throw Error('P88_RESEARCH_NONFINITE_LOGITS');
   max=Math.max(max,value);
  }
  weighted.fill(0);let total=0;
  for(let c=0;c<18;c++){
   const value=Math.exp(data[c*area+i]-max);
   weighted[c===10?9:c]+=value;total+=value;
  }
  let first=0,second=0,id=0;
  for(let c=0;c<18;c++){
   if(weighted[c]>first){second=first;first=weighted[c];id=c;}
   else if(weighted[c]>second)second=weighted[c];
  }
  const score=first/total,margin=(first-second)/total;
  if(score>=settings.pixelConfidence&&margin>=settings.pixelMargin){
   if(BODY.has(id))bodyCounts[id]++;
   if(CATEGORIES.has(id)){labels[i]=id;confidence[i]=score;}
  }
 }
 const head=bodyCounts[2]+bodyCounts[11],
  limbs=bodyCounts[12]+bodyCounts[13]+bodyCounts[14]+bodyCounts[15];
 const personDetected=head+limbs>=Math.max(8,Math.ceil(area*.005))&&
  (head>=Math.max(4,Math.ceil(area*.002))||
   limbs>=Math.max(8,Math.ceil(area*.02)));
 return {labels,confidence,width,height,personDetected};
}


// Research-only COCO detection coverage. The candidate tiny YOLOS is
// COCO-2017 object-detection trained; it is NOT Fashionpedia fine accessory
// recognition and NEVER authorizes saving a wardrobe item.
export const COCO_ACCESSORY_FASHIONPEDIA88=Object.freeze({
  16:'tie',24:'bag',26:'umbrella'
});
const COCO_ALIASES88=Object.freeze({
  tie:'tie',handbag:'bag',backpack:'bag',suitcase:'bag',umbrella:'umbrella'
});
export function cocoAccessoryLabel88(label){
 return typeof label==='string' ? COCO_ALIASES88[label.toLowerCase()]||null : null;
}
export function accessoryBoxIoU88(a,b){
 const values=[a?.xmin,a?.ymin,a?.xmax,a?.ymax,b?.xmin,b?.ymin,b?.xmax,b?.ymax];
 if(values.some(v=>typeof v!=='number'||!Number.isFinite(v)) ||
    a.xmin<0||a.ymin<0||b.xmin<0||b.ymin<0||
    a.xmax<=a.xmin||a.ymax<=a.ymin||
    b.xmax<=b.xmin||b.ymax<=b.ymin)
   throw Error('P88_INVALID_BOX');
 const aw=(a.xmax-a.xmin)*(a.ymax-a.ymin);
 const bw=(b.xmax-b.xmin)*(b.ymax-b.ymin);
 const ix=Math.max(0,Math.min(a.xmax,b.xmax)-Math.max(a.xmin,b.xmin));
 const iy=Math.max(0,Math.min(a.ymax,b.ymax)-Math.max(a.ymin,b.ymin));
 const intersection=ix*iy;
 return intersection/(aw+bw-intersection);
}
export function evaluateCocoAccessoryBoxes88(groundTruth,detections,{iouThreshold=0.5}={}){
 if(!Array.isArray(groundTruth)||!Array.isArray(detections)||
    groundTruth.length>100||detections.length>100||
    typeof iouThreshold!=='number'||!Number.isFinite(iouThreshold)||
    iouThreshold<0.1||iouThreshold>1)throw Error('P88_INVALID_BOX_BENCHMARK');
 const supported=[],unsupported=[];
 for(const gt of groundTruth){
  if(!Number.isInteger(gt.category_id)||gt.category_id<13||gt.category_id>26||
     gt.category_id===21||gt.category_id===23)throw Error('P88_EXPECTED_ACCESSORY_TRUTH_ONLY');
  const kind=COCO_ACCESSORY_FASHIONPEDIA88[gt.category_id];
  if(kind){accessoryBoxIoU88(gt.box,gt.box);supported.push({...gt,kind});}
  else unsupported.push(gt);
 }
 const proposals=[];
 for(const p of detections){
  const kind=cocoAccessoryLabel88(p.label);
  if(!kind)continue; // COCO person/other objects are never garments
  if(typeof p.score!=='number'||!Number.isFinite(p.score)||p.score<0||p.score>1)
   throw Error('P88_INVALID_COCO_CONFIDENCE');
  accessoryBoxIoU88(p.box,p.box);
  proposals.push({...p,kind});
 }
 // Maximum-cardinality (not greedy confidence) 1:1 same-class bbox IoU.
 const edges=supported.map(t=>proposals.map((p,j)=>({
  j,iou:t.kind===p.kind?accessoryBoxIoU88(t.box,p.box):0
 })).filter(v=>v.iou>=iouThreshold).sort((a,b)=>b.iou-a.iou||a.j-b.j));
 const owners=new Map();
 function assign(i,seen){
  for(const v of edges[i]){
   if(seen.has(v.j))continue;seen.add(v.j);
   if(!owners.has(v.j)||assign(owners.get(v.j),seen)){
    owners.set(v.j,i);return true;
   }
  }
  return false;
 }
 for(let i=0;i<supported.length;i++)assign(i,new Set());
 const matches=Array.from(owners.entries()).map(([predictionIndex,truthIndex])=>({
  truthIndex,predictionIndex,iou:accessoryBoxIoU88(
   supported[truthIndex].box,proposals[predictionIndex].box)
 })).sort((a,b)=>a.truthIndex-b.truthIndex);
 return {
  supportedHuman:supported.length,
  unsupportedHuman:unsupported.length,
  proposals:proposals.length,
  matches,
  matched:matches.length,
  falsePositives:proposals.length-matches.length,
  falseNegatives:supported.length-matches.length,
  unsupportedFashionpediaIds:unsupported.map(x=>x.category_id),
  bboxOnlyNotMaskIoU:true,
  notNewIndependentHumanTruth:true,
  noSaveOrModelPromotion:true
 };
}
