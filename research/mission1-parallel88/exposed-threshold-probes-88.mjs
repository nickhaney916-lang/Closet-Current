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
