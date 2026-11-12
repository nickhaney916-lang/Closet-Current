// #68 detection only. No #67 classifier/encoder or Mission1 save gate edits.
import {AutoProcessor,AutoModelForZeroShotObjectDetection} from '@huggingface/transformers';
export const DETECTOR68=Object.freeze({model:'onnx-community/grounding-dino-tiny-ONNX',revision:'ff690b0a8050566c290287545bd059350f3e9096',dtype:'q8',modelBytes:203824675,modelSha256:'70bf2d3310d1ae73769c96a71e00cbf2861eb33a1f4d97d84a108a7bf02c03c9'});
export const QUERIES68=Object.freeze(['shirt','top','sweater','jacket','coat','vest','cardigan','pants','shorts','skirt','dress','jumpsuit','shoe','sock','hat','glasses','tie','glove','watch','belt','bag','scarf','umbrella']);
const groups=[['Tops',/\b(shirt|top|sweater)\b/],['Outerwear',/\b(jacket|coat|vest|cardigan)\b/],['Bottoms',/\b(pants|shorts|skirt)\b/],['Dresses',/\b(dress|jumpsuit)\b/],['Shoes',/\bshoe\b/],['Accessories',/\b(sock|hat|glasses|tie|glove|watch|belt|bag|scarf|umbrella)\b/]];
export function categories68(label){return groups.filter(([,r])=>r.test(label)).map(([name])=>name);}
export function validateDetections68(result,width,height){
 if(!result||!Array.isArray(result.boxes)||!Array.isArray(result.labels)||!Array.isArray(result.scores)||result.labels.length!==result.boxes.length||result.scores.length!==result.boxes.length)throw Error('Invalid actual detector output');
 return result.boxes.map((b,i)=>{
  if(!Array.isArray(b)||b.length!==4||b.some(x=>!Number.isFinite(x))||!Number.isFinite(result.scores[i])||result.scores[i]<0||result.scores[i]>1||typeof result.labels[i]!=='string')throw Error('Invalid detection geometry/score');
  const box=[Math.max(0,b[0]),Math.max(0,b[1]),Math.min(width,b[2]),Math.min(height,b[3])];
  if(box[2]<=box[0]||box[3]<=box[1])throw Error('Empty detection box');
  return {label:result.labels[i],box,originalBox:b,edgeClipped:b.some((v,j)=>v!==box[j]),categories:categories68(result.labels[i]),score:result.scores[i],scoreCalibrated:false,itemType:'Unknown',requiresReview:true,strong:false};
 }).filter(x=>x.categories.length);
}
export const FACTORED_QUERIES68=Object.freeze([['shirt','pants','dress','shoe'],['jacket','coat'],['hat','bag','glasses','belt','scarf']]);
export async function loadDetector68({dtype='q8',strategy='full'}={}){
 if(!['q8','fp32'].includes(dtype))throw Error('Unknown detector precision');
 const opts={revision:DETECTOR68.revision,dtype,device:'cpu',session_options:{intraOpNumThreads:2,interOpNumThreads:1}};
 const processor=await AutoProcessor.from_pretrained(DETECTOR68.model,{revision:DETECTOR68.revision});
 const model=await AutoModelForZeroShotObjectDetection.from_pretrained(DETECTOR68.model,opts);
 return {async detect(image){
  const batches=strategy==='factored'?FACTORED_QUERIES68:[QUERIES68],raw={scores:[],boxes:[],labels:[]},queries=[];
  for(const batch of batches){
  const inputs=await processor(image,batch.join('. ')+'.');let output;
  try{
   output=await model(inputs);
   const [result]=processor.post_process_grounded_object_detection(output,inputs.input_ids,{box_threshold:.3,text_threshold:.3,target_sizes:[[image.height,image.width]]});
   raw.scores.push(...result.scores);raw.boxes.push(...result.boxes);raw.labels.push(...result.labels);queries.push({query:batch.join('. ')+'.',result});
  }finally{for(const x of Object.values(inputs))x?.dispose?.();if(output)for(const x of Object.values(output))x?.dispose?.();}
  }
  return {raw,queries,regions:validateDetections68(raw,image.width,image.height)};
 },dispose:()=>model.dispose()};
}
export function maskIoU68(a,b){
 if(a.length!==b.length)throw Error('Mask size mismatch');let intersection=0,union=0;
 for(let i=0;i<a.length;i++){if(a[i]&&b[i])intersection++;if(a[i]||b[i])union++;}
 return union?intersection/union:0;
}
// Masks describing the same visible pixels are one ambiguous proposal. Do not
// count synonyms as extra garments or silently resolve conflicting categories.
export function deduplicateMasks68(regions,masks){
 if(regions.length!==masks.length)throw Error('Missing actual masks');
 const ordered=regions.map((region,i)=>({region,mask:masks[i],index:i})).sort((a,b)=>b.region.score-a.region.score||a.index-b.index),kept=[];
 for(const item of ordered){
  const duplicate=kept.find(x=>maskIoU68(x.mask,item.mask)>=.85);
  if(duplicate){duplicate.region.evidence.push({label:item.region.label,box:item.region.box,score:item.region.score});duplicate.region.categories=[...new Set([...duplicate.region.categories,...item.region.categories])];duplicate.region.categoryAmbiguous=duplicate.region.categories.length>1;}
  else kept.push({...item,region:{...item.region,evidence:[{label:item.region.label,box:item.region.box,score:item.region.score}],categoryAmbiguous:item.region.categories.length>1}});
 }
 return kept;
}
