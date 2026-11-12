// Actual locally pinned SegFormer WASM inference; DEV photos only.
import {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env} from '/node_modules/@huggingface/transformers/dist/transformers.min.js';
import {clothingLabelMap,clothingMaskGroups} from '../../public/outfit-segmentation.mjs';
import {clothingInstances68} from './semantic-instances.mjs';
const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
env.allowLocalModels=true;env.allowRemoteModels=false;env.localModelPath='/models/';env.useBrowserCache=false;
env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
env.backends.onnx.wasm.wasmPaths='/node_modules/@huggingface/transformers/dist/';
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
let loaded,chain=Promise.resolve();
async function load(){
 if(!loaded)loaded=(async()=>{const started=performance.now();const processor=await AutoProcessor.from_pretrained(modelId,{revision});const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,dtype:'fp32',device:'wasm'});return {model,processor,loadMs:performance.now()-started};})();
 return loaded;
}
async function summarize(groups,map,image){
 const result=[];
 for(const group of groups){
  const full=new Uint8Array(image.width*image.height);
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)full[y*image.width+x]=group.selected[Math.min(map.height-1,Math.floor(y*map.height/image.height))*map.width+Math.min(map.width-1,Math.floor(x*map.width/image.width))];
  result.push({label:group.label,categories:group.categories,count:group.count,confidence:group.confidence,bounds:group.bounds,selectedMaskSha256:await digest(group.selected),originalResolutionMaskSha256:await digest(full),originalResolutionPixels:full.reduce((a,b)=>a+b,0),instanceMethod:group.instanceMethod||'native_semantic_group',requiresReview:true});
 }
 return result;
}
self.onmessage=({data:request})=>{chain=chain.then(async()=>{
 try{
  if(typeof request.id!=='string')throw Error('Invalid job');
  const {processor,model,loadMs}=await load();
  if(request.type==='load'){self.postMessage({id:request.id,type:'ready',loadMs});return;}
  if(request.type!=='infer'||!(request.bytes instanceof ArrayBuffer)||request.bytes.byteLength>12*1024*1024)throw Error('Invalid original');
  const sha256=await digest(request.bytes);if(sha256!==request.sha256)throw Error('Original SHA mismatch');
  const bytes=new Uint8Array(request.bytes);if(bytes[0]!==255||bytes[1]!==216)throw Error('JPEG required');
  const start=performance.now(),image=await RawImage.fromBlob(new Blob([request.bytes],{type:'image/jpeg'}));
  const inputs=await processor(image),output=await model(inputs),map=clothingLabelMap(output.logits.data,output.logits.dims);
  const native=map.personDetected?clothingMaskGroups(map):[],candidate=map.personDetected?clothingInstances68(map):[];
  const result={id:request.id,type:'result',sha256,width:image.width,height:image.height,semanticWidth:map.width,semanticHeight:map.height,personDetected:map.personDetected,baseline:await summarize(native,map,image),candidate:await summarize(candidate,map,image),elapsedMs:performance.now()-start,automaticSave:false,requiresReview:true};
  for(const value of Object.values(inputs))value?.dispose?.();output.logits.dispose?.();
  self.postMessage(result);
 }catch{self.postMessage({id:request.id,type:'error',code:'P68_BROWSER_MODEL_FAILED',automaticSave:false,requiresReview:true});}
});};
