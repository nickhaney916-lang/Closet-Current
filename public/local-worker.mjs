import {scannerErrorCode} from './scanner-errors.mjs';
let scannerStage='idle';
// Register the message handler before downloading dependencies, so import
// failures become explicit job errors instead of an unexplained setup wait.
let classifierPromise,RawImageClass;
async function load(){
 if(!classifierPromise)classifierPromise=(async()=>{
  scannerStage='runtime_import';self.postMessage({type:'progress',stage:'runtime',phase:scannerStage});
  const {CLIPVisionModelWithProjection,AutoProcessor,env,RawImage}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  RawImageClass=RawImage;
  env.allowLocalModels=false;env.useBrowserCache=true;
  env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  scannerStage='catalog_import';const version=new URL(import.meta.url).search;
  const {makeVectorScorer,loadVectorAssets}=await import('./vector-scorer.mjs'+version);
  const {fitWholePhoto}=await import('./recognition-photo.mjs'+version);
  const {metadata,vectors}=await loadVectorAssets('recognition-vectors.json'+version,'recognition-vectors.bin'+version);
  const processor=await AutoProcessor.from_pretrained(metadata.model,{revision:metadata.revision});
  const vision=await CLIPVisionModelWithProjection.from_pretrained(metadata.model,{revision:metadata.revision,device:'wasm',dtype:'q8',progress_callback:event=>{
   const weights=String(event.file||'').endsWith('.onnx');if(weights)scannerStage='model_download';
   self.postMessage({type:'progress',stage:weights?'weights':'runtime',phase:scannerStage,percent:weights&&Number.isFinite(event.progress)?Math.round(event.progress):null});
  }});
  const whole=makeVectorScorer(async image=>{
   const fitted=await fitWholePhoto(image,RawImageClass),result=await vision(await processor(fitted));
   return result.image_embeds.data;
  },metadata,vectors);
  const center=makeVectorScorer(async image=>(await vision(await processor(image))).image_embeds.data,metadata,vectors);
  scannerStage='ready';return {whole,center};
 })().catch(error=>{classifierPromise=null;throw error;});
 return classifierPromise;
}
let chain=Promise.resolve();
self.onmessage=event=>{const request=event.data;chain=chain.then(async()=>{
 try{
  const model=await load();
  if(request.type==='load'){self.postMessage({type:'ready',id:request.id});return;}
  if(request.type!=='classify'||typeof request.image!=='string'||!request.image.startsWith('data:image/jpeg;base64,'))throw Error('Invalid captured image.');
  scannerStage='catalog_import';const {recognizeGarment}=await import('./recognition-engine.mjs'+new URL(import.meta.url).search);
  scannerStage='identify';const image=await RawImageClass.read(request.image);
  const result=await recognizeGarment(model.whole,image,{
   confirmationModel:model.center,
   onStage:stage=>{scannerStage=stage;},
   onIdentified:choice=>self.postMessage({type:'identified',id:request.id,choice})
  });
  self.postMessage({type:'result',id:request.id,...result});
 }catch(error){
  self.postMessage({type:'error',id:request.id,stage:scannerStage,code:scannerErrorCode(error,scannerStage),text:'Recognition could not finish on this device. Try again or use Adjust.'});
 }
}).catch(()=>{self.postMessage({type:'error',id:request.id,text:'Recognition stopped. Try again or use Adjust.'});});};
