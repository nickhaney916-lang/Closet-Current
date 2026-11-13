/** Opt-in research transport and evidence checks. No persistence or automatic acceptance. */
import {hash80,jpeg80,canonical,validEvidence80} from './subtype-review-80.mjs';
import {ASSETS82} from './dual-model-lock-82.mjs';
import {MODELS81,arbitrate81} from './model-arbitration-81.mjs';
export const MODEL_ASSETS82=Object.freeze({fashionclip:{visionSha256:ASSETS82.files['models/ff13/fashion-clip/onnx/vision_model_quantized.onnx'].sha256,vectorsSha256:'e1e0415f2272e81c0f3ce2f08fd5fd5c2a9eb6481437d696936c723e8e1abb2f'},fashionSiglip:{visionSha256:ASSETS82.files['models/Marqo/marqo-fashionSigLIP/onnx/vision_model_quantized.onnx'].sha256,vectorsSha256:ASSETS82.files['siglip-text/fashion-text-vectors.bin'].sha256}});
Object.values(MODEL_ASSETS82).forEach(Object.freeze);
let busy82=false;
export const VERSION82='dual-browser-review-82-v1';
export const SOURCE82=['app.js','dual-core-82.mjs','dual-worker-82.mjs','dual-panel-82.mjs','dual-model-lock-82.mjs','model-arbitration-81.mjs','local-catalog.mjs','recognition-engine.mjs','recognition-confusion-guard.mjs','recognition-photo.mjs','vector-scorer.mjs','subtype-review-80.mjs'];
export async function codeHash82(){
 const hashes=[];
 for(const name of SOURCE82){const r=await fetch(new URL(name,import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('P82_SOURCE_UNAVAILABLE');const b=await r.arrayBuffer();if(b.byteLength>250000)throw Error('P82_SOURCE_LIMIT');hashes.push([name,await hash80(new Uint8Array(b))]);}
 return hash80(canonical(hashes));
}
export function bind82(e){
 if(!validEvidence80(e))throw Error('P82_EVIDENCE');
 return {sourceSha256:e.sourceSha256,inputSha256:e.inputSha256,ownerSession:e.sessionId,photoRevision:e.revisionSha256,cropRevision:e.inputSha256,maskRevision:e.maskDescriptorSha256,unitRevision:e.unitStatus,instanceId:e.itemId};
}
export async function validateRequest82(r){
 if(r?.schema!==VERSION82||r.enabled!==true||r.consent!==true||r.detailVisible!==true||!/^[-a-zA-Z0-9]{16,80}$/.test(r.requestId||'')||!/^[a-f0-9]{64}$/.test(r.sourceCodeSha256||'')||!validEvidence80(r.evidence))throw Error('P82_OPT_IN_OR_EVIDENCE');
 // #68 masks and physical-unit transforms are not re-certified by this runner.
 if(r.evidence.segmented)throw Error('P82_SEGMENTED_MANUAL_REVIEW');
 const original=jpeg80(r.original),input=jpeg80(r.image);
 if(await hash80(original)!==r.evidence.sourceSha256||await hash80(input)!==r.evidence.inputSha256)throw Error('P82_PHOTO_SWAP');
 if(canonical(r.binding)!==canonical(bind82(r.evidence)))throw Error('P82_BINDING');
 return input;
}
export function validateResponse82(output,request,{now=Date.now()}={}){
 if(canonical(output?.assets)!==canonical(MODEL_ASSETS82))throw Error('P82_ASSET_PROVENANCE');
 if(output?.schema!==VERSION82||output.requestId!==request.requestId||output.sourceCodeSha256!==request.sourceCodeSha256||!Number.isFinite(output.createdAt)||now<output.createdAt||now-output.createdAt>60000||!Array.isArray(output.observations)||output.observations.length!==2||new Set(output.observations.map(x=>x.modelKey)).size!==2)throw Error('P82_STALE_RESPONSE');
 for(const o of output.observations){const m=MODELS81[o.modelKey];if(!m||o.vectorSha256!==MODEL_ASSETS82[o.modelKey].vectorsSha256||o.workerSourceSha256!==request.sourceCodeSha256||Object.keys(m).some(k=>o.model?.[k]!==m[k]))throw Error('P82_MODEL_SOURCE');}
 return arbitrate81({binding:request.binding,observations:output.observations});
}
export function browserRequest82(request,{signal,onProgress=()=>{},timeoutMs=240000}={}){
 // One worker capability per explicit action. Cancel and timeout destroy all model state.
 return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(Error('P82_CANCELLED'));
  if(busy82)return reject(Error('P82_BUSY'));
  let worker;try{worker=new Worker(new URL('./dual-worker-82.mjs',import.meta.url),{type:'module'});}catch{return reject(Error('P82_WORKER_UNAVAILABLE'));}busy82=true;
  let finished=false;
  const end=(error,value)=>{if(finished)return;finished=true;busy82=false;clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();error?reject(error):resolve(value);};
  const cancel=()=>end(Error('P82_CANCELLED')),timer=setTimeout(()=>end(Error('P82_TIMEOUT')),timeoutMs);
  signal?.addEventListener('abort',cancel,{once:true});
  worker.onerror=()=>end(Error('P82_WORKER_FAILURE'));
  worker.onmessage=({data})=>{if(data?.requestId!==request.requestId)return;if(data.type==='progress')onProgress(data.stage);else if(data.type==='result'){try{validateResponse82(data.output,request);end(null,data.output);}catch(e){end(e);}}else if(data.type==='error')end(Error(/^P82_[A-Z_]+$/.test(data.code||'')?data.code:'P82_MODEL_UNAVAILABLE'));};
  worker.postMessage(request);
 });
}
