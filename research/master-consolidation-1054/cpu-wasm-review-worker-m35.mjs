/** M25 isolated CPU-only WASM, no deployment or private owner storage.
 * Same original P82 full-vocabulary/abstention/owner contract, but an explicit
 * different ONNX backend, separately version/SHA-pinned. DO NOT import from
 * public app controllers; experiment only via injected owner request adapter.
 */
import {VERSION82,MODEL_ASSETS82,validateRequest82,codeHash82} from '/dual-core-82.mjs';
import {ASSETS82} from '/dual-model-lock-82.mjs';
import {MODELS81,observation81} from '/model-arbitration-81.mjs';
import {localCandidates} from '/local-catalog.mjs';
import {hash80} from '/subtype-review-80.mjs';
import {makeVectorScorer,normalizedVector} from '/vector-scorer.mjs';
import {prepareRecognitionPhoto,fitWholePhoto} from '/recognition-photo.mjs';
import {recognizeWithRecovery} from '/recognition-engine-dual82.mjs';
import {corroborateAmbiguousType} from '/recognition-confusion-guard.mjs';
import {safeFailureMark35} from './webkit-phase-classifier-m35.mjs';

const runtimeVersion='1.22.0-dev.20250409-89f8206ba4';
const runtimeFiles={
 'ort.wasm.min.mjs':'0cb5ac5be2c414d5b9e361f857108630c6d6e24a5ab9be3cf5f761de55289e94',
 'ort-wasm-simd-threaded.wasm':'f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b'
};
const runtimeRoot=new URL('/_cpu25/runtime/',self.location.href);
const modelRoot=new URL('/_dual82/',self.location.href);
const progress=(r,stage)=>self.postMessage({type:'progress',requestId:r?.requestId,stage});
const fail=(r,e)=>self.postMessage({type:'error',requestId:r?.requestId,
 code:/^P82_[A-Z_]+$/.test(e?.message||'')?e.message:'P82_MODEL_UNAVAILABLE'});
let once=false;
self.onmessage=async({data:r})=>{
 if(once)return;once=true;
 const originalFetch=globalThis.fetch;
 let phase35='REQUEST_VALIDATE';
 try{
  const input=await validateRequest82(r);
  phase35='SOURCE_LOCK';
  const sourceHash=await codeHash82();
  if(sourceHash!==r.sourceCodeSha256)throw Error('P82_SOURCE_CHANGED');
  if(r.evidence.segmented)throw Error('P82_SEGMENTED_MANUAL_REVIEW');
  // After original SHA and consent checks, no network except identical-site
  // verified publicly pinned development models/vectors and CPU-WASM runtime.
  globalThis.fetch=async(resource,options={})=>{
   const u=new URL(typeof resource==='string'?resource:resource?.url||String(resource),self.location.href);
   const method=options.method||resource?.method||'GET';
   const model=u.href.startsWith(modelRoot.href);
   const runtime=u.href.startsWith(runtimeRoot.href);
   if(method!=='GET'||(!model&&!runtime))throw Error('P82_NETWORK_DENIED');
   const path=model?u.href.slice(modelRoot.href.length):u.href.slice(runtimeRoot.href.length);
   const pinned=model?ASSETS82.files[path]?.sha256:runtimeFiles[path];
   const limit=model?ASSETS82.files[path]?.bytes:30000000;
   if(!pinned||!limit)throw Error('P82_NETWORK_DENIED');
   const response=await originalFetch(u.href,{...options,method:'GET',redirect:'error',signal:AbortSignal.timeout(90000)});
   if(!response.ok)throw Error('P82_ASSET_MISSING');
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length!==limit&&model)throw Error('P82_ASSET_SIZE');
   if(bytes.length>limit||await hash80(bytes)!==pinned)throw Error('P82_ASSET_SHA');
   return new Response(bytes,{headers:response.headers});
  };
  // Import only the SAME pinned transformer image preprocessor; never its JSEP
  // model executor. Actual ONNX load is directly from the separate CPU build.
  phase35='RUNTIME_ASSETS';
  progress(r,'Verifying local CPU runtime');
  await fetch(new URL('ort.wasm.min.mjs',runtimeRoot));
  await fetch(new URL('ort-wasm-simd-threaded.wasm',runtimeRoot));
  phase35='RUNTIME_IMPORT';
  const [{env,RawImage,AutoProcessor},{InferenceSession,Tensor,env:ortEnv}]=await Promise.all([
    import('/_dual82/runtime/transformers.min.js'),
    import('/_cpu25/runtime/ort.wasm.min.mjs')
  ]);
  env.allowRemoteModels=false;env.allowLocalModels=true;
  env.localModelPath=new URL('models/',modelRoot).href;
  env.useBrowserCache=false;env.useFSCache=false;
  ortEnv.wasm.numThreads=1;ortEnv.wasm.simd=true;ortEnv.wasm.proxy=false;
  ortEnv.wasm.wasmPaths=runtimeRoot.href;
  phase35='IMAGE_PREPROCESS';
  const image=(await RawImage.fromBlob(new Blob([input],{type:'image/jpeg'}))).rgb();
  if(image.width*image.height>20000000)throw Error('P82_PIXEL_LIMIT');
  phase35='VECTOR_ASSETS';
  const meta=await(await fetch(new URL('native/recognition-vectors.json',modelRoot))).json();
  const clipBytes=await(await fetch(new URL('native/recognition-vectors.bin',modelRoot))).arrayBuffer();
  if(meta.revision!==MODELS81.fashionclip.revision||await hash80(new Uint8Array(clipBytes))!==meta.sha256)
   throw Error('P82_CLIP_VECTORS');
  const siglipBytes=await(await fetch(new URL('siglip-text/fashion-text-vectors.bin',modelRoot))).arrayBuffer();
  const text=new Float32Array(siglipBytes);
  if(text.length!==47*768||text.some(v=>!Number.isFinite(v)))throw Error('P82_TEXT');
  const labels=localCandidates.map(x=>x.label);
  const allStart=performance.now(),observations=[],timings=[];
  let baseline,verifiedModels=0;
  for(const [key,pin] of Object.entries(MODELS81)){
   progress(r,key==='fashionclip'?'Comparing first model':'Comparing second model');
   phase35=key==='fashionclip'?'CLIP_MODEL_BYTES':'SIGLIP_MODEL_BYTES';
   const name='models/'+pin.id+'/onnx/vision_model_quantized.onnx';
   const expected=ASSETS82.files[name];
   if(!expected)throw Error('P82_MODEL_ASSET_UNKNOWN');
   const bytes=new Uint8Array(await(await fetch(new URL(name,modelRoot))).arrayBuffer());
   if(bytes.length!==expected.bytes||await hash80(bytes)!==expected.sha256)
    throw Error('P82_MODEL_SOURCE');
   const load=performance.now();
   phase35=key==='fashionclip'?'CLIP_SESSION':'SIGLIP_SESSION';
   const session=await InferenceSession.create(bytes,{executionProviders:['wasm'],
    intraOpNumThreads:1,graphOptimizationLevel:'all'});
   const loadMs=performance.now()-load;
   try{
    if(session.inputNames.length!==1||session.inputNames[0]!=='pixel_values')
     throw Error('P82_MODEL_SIGNATURE');
    phase35=key==='fashionclip'?'CLIP_PREPROCESSOR':'SIGLIP_PREPROCESSOR';
    const processor=await AutoProcessor.from_pretrained(pin.id,{revision:pin.revision});
    const encode=async im=>{
     const processed=await processor(im);
     const pixels=processed.pixel_values;
     if(!pixels?.data||!Array.isArray(pixels.dims)||pixels.data.length<100)
      throw Error('P82_IMAGE_TENSOR_INVALID');
     const data=pixels.data instanceof Float32Array?pixels.data:Float32Array.from(pixels.data);
     const prediction=await session.run({pixel_values:new Tensor('float32',data,pixels.dims)});
     const vector=prediction.image_embeds?.data;
     if(!vector||vector.length!==(key==='fashionclip'?512:768)||Array.from(vector).some(x=>!Number.isFinite(x)))
      throw Error('P82_MODEL_OUTPUT');
     return vector;
    };
    const start=performance.now();
    phase35=key==='fashionclip'?'CLIP_INFERENCE':'SIGLIP_INFERENCE';
    let scores;
    if(key==='fashionclip'){
     const vectors=new Float32Array(clipBytes);
     const make=(settings={})=>makeVectorScorer(async im=>
      encode(await prepareRecognitionPhoto(im,RawImage,settings)),meta,vectors);
     const whole=make(),center=make({confirmation:true});
     scores=await whole(image,labels);
     baseline=await recognizeWithRecovery(whole,image,{confirmationModel:center,
      skirtPaddingModel:make({contentSizeOverride:288}),
      coatNearFullModel:make({contentSizeOverride:334}),
      recoveryModel:makeVectorScorer(async im=>encode(await fitWholePhoto(im,RawImage)),meta,vectors),
      recoveryConfirmationModel:makeVectorScorer(async im=>encode(im),meta,vectors)});
     baseline=await corroborateAmbiguousType(baseline);
    }else{
     const vector=normalizedVector(await encode(image),768);
     scores=labels.map((label,i)=>{
      const part=normalizedVector(text.subarray(i*768,(i+1)*768),768);
      return {label,score:part.reduce((sum,n,j)=>sum+n*vector[j],0)};
     });
    }
    const inferenceMs=performance.now()-start;
    timings.push({key,loadMs,inferenceMs});
    observations.push(observation81({modelKey:key,binding:r.binding,scores,
     workerSourceSha256:sourceHash,
     vectorSha256:key==='fashionclip'?meta.sha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256,
     latencyMs:inferenceMs}));
    verifiedModels++;
   }finally{
    phase35=key==='fashionclip'?'CLIP_RELEASE':'SIGLIP_RELEASE';
    await session.release();
   }
  }
  phase35='OUTPUT_VALIDATE';
  const output={schema:VERSION82,assets:MODEL_ASSETS82,requestId:r.requestId,
   createdAt:Date.now(),sourceCodeSha256:sourceHash,observations,
   baseline:{strong:baseline?.strong??false,choices:baseline?.choices||[],reason:baseline?.reason??null},
   timings,totalMs:performance.now()-allStart,verifiedAssets:verifiedModels*2+4,
   researchRuntime:'m25-cpu-only-wasm',runtimeVersion,
   runtimeJS_SHA256:runtimeFiles['ort.wasm.min.mjs'],
   runtimeWASM_SHA256:runtimeFiles['ort-wasm-simd-threaded.wasm'],
   hostedWrites:0,automaticAdmissions:0,productionAdoption:false};
  self.postMessage({type:'result',requestId:r.requestId,output});
 }catch(e){
  // Diagnostics never contain the raw error, URL, identity, photo or stack.
  const evidence=safeFailureMark35(phase35,e);
  progress(r,evidence.mark);
  fail(r,e);
 }
};
