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
  const {prepareRecognitionPhoto,fitWholePhoto}=await import('./recognition-photo.mjs'+version);
  const {metadata,vectors}=await loadVectorAssets('recognition-vectors.json'+version,'recognition-vectors.bin'+version);
  const processor=await AutoProcessor.from_pretrained(metadata.model,{revision:metadata.revision});
  const vision=await CLIPVisionModelWithProjection.from_pretrained(metadata.model,{revision:metadata.revision,device:'wasm',dtype:'q8',progress_callback:event=>{
   const weights=String(event.file||'').endsWith('.onnx');if(weights)scannerStage='model_download';
   self.postMessage({type:'progress',stage:weights?'weights':'runtime',phase:scannerStage,percent:weights&&Number.isFinite(event.progress)?Math.round(event.progress):null});
  }});
  const whole=makeVectorScorer(async image=>{
   const fitted=await prepareRecognitionPhoto(image,RawImageClass),result=await vision(await processor(fitted));
   return result.image_embeds.data;
  },metadata,vectors);
  const center=makeVectorScorer(async image=>{
   const fitted=await prepareRecognitionPhoto(image,RawImageClass,{confirmation:true});
   return (await vision(await processor(fitted))).image_embeds.data;
  },metadata,vectors);
  // Secondary padding only for unresolved skirt-versus-dress disagreements.
  const skirtPadding=makeVectorScorer(async image=>{
   const fitted=await prepareRecognitionPhoto(image,RawImageClass,{contentSizeOverride:288});
   return (await vision(await processor(fitted))).image_embeds.data;
  },metadata,vectors);
  const originalWhole=makeVectorScorer(async image=>{
   const fitted=await fitWholePhoto(image,RawImageClass);
   return (await vision(await processor(fitted))).image_embeds.data;
  },metadata,vectors);
  const originalCenter=makeVectorScorer(async image=>(await vision(await processor(image))).image_embeds.data,metadata,vectors);
  scannerStage='ready';return {whole,center,skirtPadding,originalWhole,originalCenter,RawImage,prepareRecognitionPhoto,modelKey:'fashion-clip/whole-v1/'+metadata.revision};
 })().catch(error=>{classifierPromise=null;throw error;});
 return classifierPromise;
}
let chain=Promise.resolve();
self.onmessage=event=>{const request=event.data;chain=chain.then(async()=>{
 try{
  const model=await load();
  if(request.type==='load'){self.postMessage({type:'ready',id:request.id});return;}
  if(!['classify','features','benchmark-frames'].includes(request.type)||typeof request.image!=='string'||!request.image.startsWith('data:image/jpeg;base64,'))throw Error('Invalid captured image.');
  scannerStage='catalog_import';const {recognizeWithRecovery,classifyIsolatedGarment}=await import('./recognition-engine.mjs'+new URL(import.meta.url).search);
  scannerStage='identify';const image=await RawImageClass.read(request.image);
  if(request.type==='benchmark-frames'){
   // Offline test only. Do not save garments or alter production recognition.
   const {localCandidates}=await import('./local-catalog.mjs'+new URL(import.meta.url).search);
   const labels=localCandidates.map(x=>Array.isArray(x)?x[0]:x.label);
   const variants=[];
   for(const size of (request.benchmarkId==='commons-0070'?[256,320,328,332,334,336]:request.benchmarkId==='commons-0045'?[256,288,320,336]:[320,328,336])){
    const framed=await model.prepareRecognitionPhoto(image,RawImageClass,{contentSizeOverride:size});
    const ranked=await model.originalCenter(framed,labels);
    variants.push({contentSize:size,top:ranked.slice(0,5)});
   }
   self.postMessage({type:'result',id:request.id,variants});return;
  }
  if(request.type==='features'){const features=await model.whole.features(image);self.postMessage({type:'result',id:request.id,recognitionMemory:{version:1,modelKey:model.modelKey,features}});return;}
  const classify=request.hint?classifyIsolatedGarment:recognizeWithRecovery;
  const result=await classify(model.whole,image,{
   hint:request.hint,
   confirmationModel:model.center,skirtPaddingModel:model.skirtPadding,
   recoveryModel:model.originalWhole,recoveryConfirmationModel:model.originalCenter,
   onStage:stage=>{scannerStage=stage;},
   onIdentified:choice=>self.postMessage({type:'identified',id:request.id,choice})
  });
  let recognitionMemory;try{if(model.whole.features)recognitionMemory={version:1,modelKey:model.modelKey,features:await model.whole.features(image)};}catch{/* Optional memory cannot reject a garment. */}
  self.postMessage({type:'result',id:request.id,...result,recognitionMemory});
 }catch(error){
  self.postMessage({type:'error',id:request.id,stage:scannerStage,code:scannerErrorCode(error,scannerStage),text:'Recognition could not finish on this device. Try again or use Adjust.'});
 }
}).catch(()=>{self.postMessage({type:'error',id:request.id,text:'Recognition stopped. Try again or use Adjust.'});});};
