import {AutoProcessor,Florence2ForConditionalGeneration} from '@huggingface/transformers';
import {performance} from 'node:perf_hooks';
import {mergeReferenceRegions67} from './regions.mjs';
export const FLORENCE67=Object.freeze({model:'onnx-community/Florence-2-base-ft',revision:'e88a44eaf3791a35eae0c5a47b3dbcd36e67eb6f',dtype:'q8'});
export async function loadFlorenceGrounder67(){
 const model=await Florence2ForConditionalGeneration.from_pretrained(FLORENCE67.model,{revision:FLORENCE67.revision,dtype:FLORENCE67.dtype,device:'cpu',session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
 const processor=await AutoProcessor.from_pretrained(FLORENCE67.model,{revision:FLORENCE67.revision});
 const generate=async(image,task,input='')=>{
  const start=performance.now(),inputs=await processor(image,processor.construct_prompts(task+input));
  let tokens;
  try{
   tokens=await model.generate({...inputs,max_new_tokens:160,do_sample:false,num_beams:1});
   const raw=processor.batch_decode(tokens,{skip_special_tokens:false})[0];
   const parsed=processor.post_process_generation(raw,task,image.size)[task];
   return {task,input,raw,parsed,elapsedMs:performance.now()-start};
  }finally{
   tokens?.dispose?.();for(const value of Object.values(inputs))value?.dispose?.();
  }
 };
 return {async detect(image){
  const objectDetection=await generate(image,'<OD>');
  const caption=await generate(image,'<MORE_DETAILED_CAPTION>');
  if(typeof caption.parsed!=='string'||!caption.parsed.trim())throw Error('No actual generated caption');
  const grounded=await generate(image,'<CAPTION_TO_PHRASE_GROUNDING>',caption.parsed);
  const merged=mergeReferenceRegions67([{stage:'object_detection',...objectDetection.parsed},{stage:'generated_caption_grounding',...grounded.parsed}],image.width,image.height);
  return {...merged,stages:{objectDetection,caption,grounded},requiresReview:true,automaticSave:false};
 },dispose:()=>model.dispose()};
}
