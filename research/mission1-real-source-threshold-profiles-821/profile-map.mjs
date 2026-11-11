/**
 * MISSION 1 P821 — RESEARCH ONLY, not a model improvement or an inference deploy.
 * Compare the exact original pinned SegFormer B0 logits under predeclared fixed
 * source-label probability/margin gates. Source JPEG/weights remain untouched.
 * This duplicates the native label calculation intentionally; the default
 * profile must be tested against clothingLabelMap bit for bit.
 */
import {clothingRegions} from '../../public/outfit-segmentation.mjs';

export const THRESHOLD_PROFILES_821=Object.freeze([
 Object.freeze({name:'native-70-15',minProbability:.70,minMargin:.15}),
 Object.freeze({name:'exploratory-65-12',minProbability:.65,minMargin:.12}),
 Object.freeze({name:'exploratory-60-10',minProbability:.60,minMargin:.10}),
 Object.freeze({name:'exploratory-55-08',minProbability:.55,minMargin:.08}),
 Object.freeze({name:'strict-80-20',minProbability:.80,minMargin:.20})
]);

export function clothingLabelMapThreshold821(data,dims,{minProbability,minMargin}={}){
 if(!Number.isFinite(minProbability)||!Number.isFinite(minMargin)||
    minProbability<.5||minProbability>.9||minMargin<.05||minMargin>.3)
  throw Error('M1_P821_INVALID_RESEARCH_SCORE_THRESHOLD');
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||
    !Number.isInteger(dims[2])||!Number.isInteger(dims[3])||
    dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512||
    !data||data.length!==dims.reduce((a,b)=>a*b,1))
  throw Error('M1_P821_BAD_FROZEN_ORIGINAL_LOGITS_DIMENSIONS');
 const height=dims[2],width=dims[3],area=height*width,
  labels=new Uint8Array(area),confidence=new Float32Array(area),
  groups=new Float64Array(18),bodyCounts=new Uint32Array(18);
 for(let i=0;i<area;i++){
  let max=-Infinity;
  for(let c=0;c<18;c++){
   const value=data[c*area+i];
   if(!Number.isFinite(value))throw Error('M1_P821_NONFINITE_SOURCE_LOGITS');
   max=Math.max(max,value);
  }
  groups.fill(0);let total=0;
  for(let c=0;c<18;c++){
   const weight=Math.exp(data[c*area+i]-max);
   groups[c===10?9:c]+=weight;
   total+=weight;
  }
  let first=0,second=0,id=0;
  for(let c=0;c<18;c++){
   if(groups[c]>first){second=first;first=groups[c];id=c;}
   else if(groups[c]>second)second=groups[c];
  }
  const score=first/total;
  if(score>=minProbability&&(first-second)/total>=minMargin){
   if([2,11,12,13,14,15].includes(id))bodyCounts[id]++;
   if(clothingRegions.some(x=>x.id===id)){
    labels[i]=id;confidence[i]=score;
   }
  }
 }
 const head=bodyCounts[2]+bodyCounts[11],
  limbs=bodyCounts[12]+bodyCounts[13]+bodyCounts[14]+bodyCounts[15];
 const personDetected=head+limbs>=Math.max(8,Math.ceil(area*.005))&&
  (head>=Math.max(4,Math.ceil(area*.002))||
   limbs>=Math.max(8,Math.ceil(area*.02)));
 return {labels,confidence,width,height,personDetected};
}


/**
 * P827: one pass over the SAME unchanged frozen original model logits.
 * Compute softmax once per pixel, then apply all pre-registered thresholds.
 * No adaptive tuning, no weights, no new classes or owner confirmation.
 * Returned maps must match the independently implemented P821 reference.
 */
export function clothingLabelMapsFused827(data,dims,profiles=THRESHOLD_PROFILES_821){
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||
    !Number.isInteger(dims[2])||!Number.isInteger(dims[3])||
    dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512||
    !data||data.length!==dims.reduce((a,b)=>a*b,1))
  throw Error('M1_P827_BAD_ORIGINAL_LOGIT_DIMENSIONS');
 if(!Array.isArray(profiles)||profiles.length!==THRESHOLD_PROFILES_821.length||
    profiles.some((p,i)=>!p||p.name!==THRESHOLD_PROFILES_821[i].name||
      p.minProbability!==THRESHOLD_PROFILES_821[i].minProbability||
      p.minMargin!==THRESHOLD_PROFILES_821[i].minMargin))
  throw Error('M1_P827_UNREGISTERED_THRESHOLD_PROFILE');
 const height=dims[2],width=dims[3],area=height*width;
 const maps=profiles.map(profile=>({
  name:profile.name,
  map:{labels:new Uint8Array(area),confidence:new Float32Array(area),
   width,height,personDetected:false},
  bodyCounts:new Uint32Array(18)
 }));
 const groups=new Float64Array(18);
 const clothingIDs=new Set(clothingRegions.map(x=>x.id));
 for(let i=0;i<area;i++){
  let max=-Infinity;
  for(let c=0;c<18;c++){
   const v=data[c*area+i];
   if(!Number.isFinite(v))throw Error('M1_P827_NONFINITE_ORIGINAL_LOGITS');
   if(v>max)max=v;
  }
  groups.fill(0);
  let total=0;
  for(let c=0;c<18;c++){
   const weight=Math.exp(data[c*area+i]-max);
   groups[c===10?9:c]+=weight;
   total+=weight;
  }
  let first=0,second=0,id=0;
  for(let c=0;c<18;c++){
   if(groups[c]>first){second=first;first=groups[c];id=c;}
   else if(groups[c]>second)second=groups[c];
  }
  const score=first/total,margin=(first-second)/total;
  for(let k=0;k<profiles.length;k++){
   const profile=profiles[k],target=maps[k];
   if(score<profile.minProbability||margin<profile.minMargin)continue;
   if([2,11,12,13,14,15].includes(id))target.bodyCounts[id]++;
   if(clothingIDs.has(id)){
    target.map.labels[i]=id;
    target.map.confidence[i]=score;
   }
  }
 }
 const minAll=Math.max(8,Math.ceil(area*.005)),
       minHead=Math.max(4,Math.ceil(area*.002)),
       minLimbs=Math.max(8,Math.ceil(area*.02));
 return maps.map(({name,map,bodyCounts})=>{
  const head=bodyCounts[2]+bodyCounts[11],
    limbs=bodyCounts[12]+bodyCounts[13]+bodyCounts[14]+bodyCounts[15];
  map.personDetected=head+limbs>=minAll&&(head>=minHead||limbs>=minLimbs);
  return {name,map};
 });
}
