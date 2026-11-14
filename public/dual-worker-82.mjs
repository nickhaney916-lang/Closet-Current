/** One-shot browser WASM runner. Fixed same-origin pretrained assets only; no image upload. */
import {VERSION82,MODEL_ASSETS82,validateRequest82,codeHash82} from './dual-core-82.mjs';
import {ASSETS82} from './dual-model-lock-82.mjs';
import {MODELS81,observation81} from './model-arbitration-81.mjs';
import {localCandidates} from './local-catalog.mjs';
import {hash80} from './subtype-review-80.mjs';
import {makeVectorScorer,normalizedVector} from './vector-scorer.mjs';
import {mirrorRGB881,meanUnitEmbeddings881} from './siglip-horizontal-view-881.mjs';
import {prepareRecognitionPhoto,fitWholePhoto} from './recognition-photo.mjs';
import {recognizeWithRecovery} from './recognition-engine.mjs';
import {corroborateAmbiguousType} from './recognition-confusion-guard.mjs';
let started=false;
self.onmessage=async({data:r})=>{
 if(started)return;started=true;
 const progress=stage=>self.postMessage({type:'progress',requestId:r?.requestId,stage});
 try{
  const input=await validateRequest82(r); // no download/import before consent and photo validation
  const sourceHash=await codeHash82();if(sourceHash!==r.sourceCodeSha256)throw Error('P82_SOURCE_CHANGED');
  const root=new URL('./_dual82/',import.meta.url),originalFetch=globalThis.fetch;
  const verified=new Set();let fetchedBytes=0;
  // Only known local bytes. Abort on redirects, altered hashes, non-GET or oversized bodies.
  globalThis.fetch=async(resource,options={})=>{
   const url=new URL(typeof resource==='string'?resource:resource.url||String(resource),self.location.href),path=url.href.slice(root.href.length),entry=ASSETS82.files[path];
   
   if(((options.method||resource?.method||'GET')!=='GET')||!url.href.startsWith(root.href)||!entry)throw Error('P82_NETWORK_DENIED');
   const response=await originalFetch(url.href,{...options,redirect:'error',signal:AbortSignal.timeout(90000)});
   if(!response.ok)throw Error('P82_ASSET_MISSING');
   const limit=entry.bytes,reader=response.body.getReader(),chunks=[];let size=0;
   for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('P82_ASSET_SIZE');}chunks.push(value);}
   const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
   if(entry&&(size!==entry.bytes||await hash80(bytes)!==entry.sha256))throw Error('P82_ASSET_SHA');
   fetchedBytes+=size;verified.add(path);return new Response(bytes,{headers:response.headers});
  };
  progress('Preparing local comparison');const loadStart=performance.now();
  // Hash runtime module bytes before importing the fixed local module URL.
  await fetch(new URL('runtime/transformers.min.js',root).href);
  await fetch(new URL('runtime/ort-wasm-simd-threaded.jsep.mjs',root).href);
  const {env,RawImage,AutoProcessor,CLIPVisionModelWithProjection,SiglipVisionModel}=await import('./_dual82/runtime/transformers.min.js');
  env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath=new URL('models/',root).href;
  env.useBrowserCache=false;env.useFSCache=false;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  env.backends.onnx.wasm.wasmPaths=new URL('runtime/',root).href;
  const image=(await RawImage.fromBlob(new Blob([input],{type:'image/jpeg'}))).rgb();
  if(image.width*image.height>20000000)throw Error('P82_PIXEL_LIMIT');
  const meta=await(await fetch(new URL('native/recognition-vectors.json',root).href)).json(),clipBytes=await(await fetch(new URL('native/recognition-vectors.bin',root).href)).arrayBuffer();
  if(meta.revision!==MODELS81.fashionclip.revision||await hash80(new Uint8Array(clipBytes))!==meta.sha256)throw Error('P82_CLIP_VECTORS');
  const textBytes=await(await fetch(new URL('siglip-text/fashion-text-vectors.bin',root).href)).arrayBuffer(),text=new Float32Array(textBytes);
  if(text.length!==47*768||text.some(x=>!Number.isFinite(x)))throw Error('P82_TEXT');
  const labels=localCandidates.map(x=>x.label),observations=[],timings=[],allStart=performance.now();let baseline,experiment877=null,experiment881=null;
  for(const [key,pin] of Object.entries(MODELS81)){
   progress(key==='fashionclip'?'Comparing first model':'Comparing second model');const load=performance.now();
   const opts={revision:pin.revision,dtype:'q8',device:'wasm'},processor=await AutoProcessor.from_pretrained(pin.id,{revision:pin.revision}),vision=await (key==='fashionclip'?CLIPVisionModelWithProjection:SiglipVisionModel).from_pretrained(pin.id,opts);
   const loadMs=performance.now()-load,start=performance.now();let scores;
   try{
    if(key==='fashionclip'){
     const vectors=new Float32Array(clipBytes),make=(settings={})=>makeVectorScorer(async im=>(await vision(await processor(await prepareRecognitionPhoto(im,RawImage,settings)))).image_embeds.data,meta,vectors),whole=make(),center=make({confirmation:true});
     scores=await whole(image,labels);
     baseline=await recognizeWithRecovery(whole,image,{confirmationModel:center,skirtPaddingModel:make({contentSizeOverride:288}),coatNearFullModel:make({contentSizeOverride:334}),recoveryModel:makeVectorScorer(async im=>(await vision(await processor(await fitWholePhoto(im,RawImage)))).image_embeds.data,meta,vectors),recoveryConfirmationModel:makeVectorScorer(async im=>(await vision(await processor(im))).image_embeds.data,meta,vectors)});
     baseline=await corroborateAmbiguousType(baseline);
    }else{
     // P877: frozen full-frame research only. The ordinary two-model decision
     // continues to use the identical original, processor-defined image view.
     const textUnit=labels.map((_,i)=>normalizedVector(text.subarray(i*768,(i+1)*768),768));
     const scoreImage=vector=>labels.map((label,i)=>({label,score:textUnit[i].reduce((s,x,j)=>s+x*vector[j],0)}));
     const vector=normalizedVector((await vision(await processor(image))).image_embeds.data,768);
     scores=scoreImage(vector);
     // P881: source-locked offline test-time horizontal mirroring only.
     // Never change ordinary FashionSigLIP scores, owner review, or auto saves.
     if(r.researchFlip881==='horizontal-mirror-v1'){
      const flippedStart=performance.now();
      const flipped=mirrorRGB881(image,RawImage);
      const mirrorVector=normalizedVector((await vision(await processor(flipped))).image_embeds.data,768);
      const mean=meanUnitEmbeddings881(vector,mirrorVector);
      const mirrored=observation81({modelKey:key,binding:r.binding,scores:scoreImage(mirrorVector),
       workerSourceSha256:sourceHash,vectorSha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,
       latencyMs:performance.now()-flippedStart});
      const paired=observation81({modelKey:key,binding:r.binding,scores:scoreImage(mean),
       workerSourceSha256:sourceHash,vectorSha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,
       latencyMs:performance.now()-flippedStart});
      experiment881={schema:'p881-optional-horizontal-mirror-v1',modelKey:key,
       mode:'same-original-rgb-horizontal-mirror',sameModelNotIndependent:true,weightsChanged:false,
       sourceCodeSha256:sourceHash,vectorSha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,
       inputSha256:r.binding.inputSha256,mirrorMs:performance.now()-flippedStart,
       mirroredRanking:mirrored.ranking,meanRanking:paired.ranking};
     }
     if(r.researchFrame877==='whole-224-v1'){
      const extraStart=performance.now();
      const padded=await fitWholePhoto(image,RawImage);
      const whole=normalizedVector((await vision(await processor(padded))).image_embeds.data,768);
      const extraScores=scoreImage(whole),extraMs=performance.now()-extraStart;
      const alt=observation81({modelKey:key,binding:r.binding,scores:extraScores,workerSourceSha256:sourceHash,vectorSha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,latencyMs:extraMs});
      experiment877={schema:'p877-optional-full-frame-v1',modelKey:key,mode:'fitWholePhoto224-white',sameModelNotIndependent:true,
       sourceCodeSha256:sourceHash,vectorSha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,
       inputSha256:r.binding.inputSha256,extraMs,ranking:alt.ranking};
     }
    }
    const inferenceMs=performance.now()-start;timings.push({key,loadMs,inferenceMs});
    observations.push(observation81({modelKey:key,binding:r.binding,scores,workerSourceSha256:sourceHash,vectorSha256:key==='fashionclip'?meta.sha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,latencyMs:inferenceMs}));
   }finally{await vision.dispose();}
  }
  // Dynamic-imported runtime glue is fixed same-origin; hashing checks file integrity, not independent scorer custody.
  self.postMessage({type:'result',requestId:r.requestId,output:{schema:VERSION82,assets:MODEL_ASSETS82,requestId:r.requestId,createdAt:Date.now(),sourceCodeSha256:sourceHash,observations,baseline:{strong:baseline.strong,choices:baseline.choices,reason:baseline.reason},experiment877,experiment881,timings,setupMs:allStart-loadStart,totalMs:performance.now()-loadStart,fetchedBytes,verifiedAssets:verified.size,estimatedWeightBytes:ASSETS82.files['models/ff13/fashion-clip/onnx/vision_model_quantized.onnx'].bytes+ASSETS82.files['models/Marqo/marqo-fashionSigLIP/onnx/vision_model_quantized.onnx'].bytes,peakMemoryBytes:null,automaticAdmissions:0}});
 }catch(error){self.postMessage({type:'error',requestId:r?.requestId,code:String(error?.message||'P82_FAILURE').slice(0,100)});}
};
