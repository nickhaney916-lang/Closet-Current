/**
 * M251 research only: prove the actual pinned Transformers.js 3.8.1
 * from_pretrained option has an unchanged source path to ORT's *JS*
 * InferenceSession.create. This is NOT proof of native C ABI propagation,
 * ORT allocator state or a permanent WebKit fix.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {configuredOriginalWorker} from '../scripts/main250-original-jsep-mempattern-study.mjs';

const PINNED={
 worker:'d66651b616de54c51eb7ef986324b30f1580888f',
 models:'bb0c0ff1f4745241a45e7a123f21806de7ebae3a',
 backend:'3e49ece2367ba4286014c4dc6ab65ee75c378451',
 transformersVersion:'3.8.1',
 ortVersion:'1.22.0-dev.20250409-89f8206ba4'
};
function gitBlob(data){
 const bytes=Buffer.from(data,'utf8');
 return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
}
function once(source,fragment,label){
 assert.equal(source.split(fragment).length,2,'Missing or ambiguous '+label);
}
function validateRealJavaScriptHandoff({worker,models,backend,transformers,ort},strict=true){
 assert.equal(transformers.version,PINNED.transformersVersion,'Transformers package changed');
 assert.equal(transformers.dependencies?.['onnxruntime-web'],PINNED.ortVersion,'Transitive ORT contract changed');
 assert.equal(ort.version,PINNED.ortVersion,'Installed ONNX Runtime Web differs from pinned source');
 if(strict){
  assert.equal(gitBlob(worker),PINNED.worker,'Original installed P94 Worker changed');
  assert.equal(gitBlob(models),PINNED.models,'Exact upstream Transformers 3.8.1 models.js changed');
  assert.equal(gitBlob(backend),PINNED.backend,'Exact upstream Transformers 3.8.1 ONNX backend changed');
 }
 const anchor="from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:";
 once(worker,anchor,'original P94 fp32 WASM call');
 assert.ok(!worker.includes('session_options:{enableMemPattern:false}'),'Consumer P94 Worker may not silently change');
 const alternative=configuredOriginalWorker(worker,'pattern_off');
 const baseline=configuredOriginalWorker(worker,'baseline');
 assert.equal(baseline,worker);
 assert.equal(alternative.replace(
  "from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',session_options:{enableMemPattern:false},progress_callback:",
  anchor
 ),worker,'Experimental M250 Worker changed more than its one option request');
 once(models,'session_options = {},','Transformers from_pretrained parameter');
 once(models,'            session_options,','Transformers option carried into local options');
 once(models,'const session_options = { ...options.session_options };','Transformers session options spread');
 once(models,'return { buffer_or_path, session_options, session_config };','Transformers getSession result');
 once(models,'const { buffer_or_path, session_options, session_config } = await getSession(pretrained_model_name_or_path, names[name], options);','Transformers constructed session options');
 once(models,'const session = await createInferenceSession(buffer_or_path, session_options, session_config);','Transformers ONNX backend handoff');
 once(backend,'const sessionPromise = InferenceSession.create(buffer_or_path, session_options);','ONNX Runtime JavaScript handoff');
 return Object.freeze({
  schema:'M251_SOURCE_PINNED_TRANSFORMERS_381_ORT_JS_HANDOFF/v1',
  originalConsumerWorkerUnmodified:true,
  originalTransformers381GitBlobVerified:strict,
  originalOrtPinnedDependencyVerified:true,
  onlyDisposableMemPatternOffRequest:true,
  actualJavascriptSessionCreateOptionsPathVerified:true,
  actualNativeCAbiOptionValueObserved:false,
  actualNativeHeapPolicyObserved:false,
  originalIntermittentWebkitFailureCausallyRepaired:false,
  noOriginalOwnerOrModelDataTouched:true,
  familyAlphaHold:true,
  releaseAuthorized:false
 });
}
const read=path=>readFile(path,'utf8');
const inputs=async()=>({
 worker:await read('public/outfit-worker-p94.mjs'),
 models:await read('node_modules/@huggingface/transformers/src/models.js'),
 backend:await read('node_modules/@huggingface/transformers/src/backends/onnx.js'),
 transformers:JSON.parse(await read('node_modules/@huggingface/transformers/package.json')),
 ort:JSON.parse(await read('node_modules/onnxruntime-web/package.json'))
});

test('M251 installed, exact-source v3.8.1 WASM session options reach ORT JavaScript create call (native ABI unproven)',async()=>{
 const data=await inputs();
 const receipt=validateRealJavaScriptHandoff(data);
 assert.equal(receipt.actualJavascriptSessionCreateOptionsPathVerified,true);
 assert.equal(receipt.actualNativeCAbiOptionValueObserved,false);
 assert.equal(receipt.originalIntermittentWebkitFailureCausallyRepaired,false);
 assert.equal(receipt.releaseAuthorized,false);
 console.log('M251_GENUINE_INSTALLED_SOURCE_HANDOFF',JSON.stringify(receipt));
});
test('M251 reject wrong ORT dependency, package identity and forged session-options propagation',async()=>{
 const data=await inputs();
 const mutations=[
  {...data,transformers:{...data.transformers,version:'4.0.0'}},
  {...data,transformers:{...data.transformers,dependencies:{...data.transformers.dependencies,'onnxruntime-web':'1.23.0'}}},
  {...data,ort:{...data.ort,version:'1.23.0'}},
  {...data,models:data.models.replace('const session_options = { ...options.session_options };','const session_options = {};')},
  {...data,models:data.models.replace('const session = await createInferenceSession(buffer_or_path, session_options, session_config);','const session = null;')},
  {...data,backend:data.backend.replace('InferenceSession.create(buffer_or_path, session_options)','InferenceSession.create(buffer_or_path, {})')},
  {...data,worker:data.worker.replace("dtype:'fp32'","dtype:'q8'")},
  {...data,worker:data.worker.replace('progress_callback:',"session_options:{enableMemPattern:false},progress_callback:")}
 ];
 for(let i=0;i<mutations.length;i++){
  assert.throws(()=>validateRealJavaScriptHandoff(mutations[i],false),'Fake handoff was accepted: '+i);
 }
});
test('M251 source proof does not infer downstream native WASM call or repaired WebKit memory',async()=>{
 const data=await inputs();
 const r=validateRealJavaScriptHandoff(data);
 assert.deepEqual([
  r.actualNativeCAbiOptionValueObserved,
  r.actualNativeHeapPolicyObserved,
  r.originalIntermittentWebkitFailureCausallyRepaired,
  r.releaseAuthorized
 ],[false,false,false,false]);
 assert.equal(r.familyAlphaHold,true);
});
