// Research-only adapter; no account, wardrobe save, cloud or production route.
import {AutoProcessor,SiglipVisionModel,CLIPVisionModelWithProjection,RawImage,env} from '/node_modules/@huggingface/transformers/dist/transformers.min.js';
import {independentScorer67,loadIndependentVectors67,MODELS67,reviewOnly67} from './independent-scorer.mjs';
import {makeVectorScorer,loadVectorAssets} from '../../public/vector-scorer.mjs';
import {prepareRecognitionPhoto,fitWholePhoto} from '../../public/recognition-photo.mjs';
import {recognizeWithRecovery} from '../../public/recognition-engine.mjs';
import {localCandidates} from '../../public/local-catalog.mjs';
env.allowLocalModels=true;env.allowRemoteModels=false;env.localModelPath='/models/';env.useBrowserCache=false;
env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
env.backends.onnx.wasm.wasmPaths='/node_modules/@huggingface/transformers/dist/';
let chain=Promise.resolve(),loaded;
async function load(key){
 if(loaded){if(loaded.key!==key)throw Error('Use a fresh worker for another model');return loaded;}
 const start=performance.now();
 const {metadata,vectors}=key==='baseline'?await loadVectorAssets('/public/recognition-vectors.json','/public/recognition-vectors.bin'):await loadIndependentVectors67('./assets/'+key+'.json','./assets/'+key+'.bin');
 const spec=key==='baseline'?metadata:MODELS67[key];if(!spec)throw Error('Unknown candidate');
 const processor=await AutoProcessor.from_pretrained(spec.model,{revision:spec.revision});
 const vision=await (key==='marqo'?SiglipVisionModel:CLIPVisionModelWithProjection).from_pretrained(spec.model,{revision:spec.revision,device:'wasm',dtype:'q8'});
 const scorer=prepare=>(key==='baseline'?makeVectorScorer:independentScorer67)(async image=>(await vision(await processor(await prepare(image)))).image_embeds.data,metadata,vectors);
 const whole=scorer(image=>prepareRecognitionPhoto(image,RawImage));
 loaded={key,whole,loadMs:performance.now()-start,options:{confirmationModel:scorer(image=>prepareRecognitionPhoto(image,RawImage,{confirmation:true})),skirtPaddingModel:scorer(image=>prepareRecognitionPhoto(image,RawImage,{contentSizeOverride:288})),coatNearFullModel:scorer(image=>prepareRecognitionPhoto(image,RawImage,{contentSizeOverride:334})),recoveryModel:scorer(image=>fitWholePhoto(image,RawImage)),recoveryConfirmationModel:scorer(async image=>image)}};
 return loaded;
}
self.onmessage=({data:request})=>{chain=chain.then(async()=>{
 try{
  if(!['baseline','marqo','marqoclip'].includes(request.model)||typeof request.id!=='string')throw Error('Invalid request');
  const model=await load(request.model);
  if(request.type==='load'){self.postMessage({id:request.id,type:'ready',loadMs:model.loadMs});return;}
  if(request.type!=='classify'||!(request.bytes instanceof ArrayBuffer)||request.bytes.byteLength>12*1024*1024)throw Error('Invalid source');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',request.bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==request.sha256)throw Error('Original JPEG SHA mismatch');
  const bytes=new Uint8Array(request.bytes);if(bytes[0]!==255||bytes[1]!==216)throw Error('Original JPEG required');
  const start=performance.now(),image=await RawImage.fromBlob(new Blob([request.bytes],{type:'image/jpeg'}));
  const raw=await model.whole(image,localCandidates.map(x=>x.label));
  const proposal=await recognizeWithRecovery(model.whole,image,model.options);
  self.postMessage({id:request.id,type:'result',sha256:digest,raw:raw.slice(0,3),proposal,
   result:request.model==='baseline'?proposal:reviewOnly67(proposal,request.model),elapsedMs:performance.now()-start});
 }catch{self.postMessage({id:request.id,type:'error',code:'INDEPENDENT_RECOGNITION_FAILED',requiresReview:true});}
});};
