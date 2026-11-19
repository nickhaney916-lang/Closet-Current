/**
 * M251 source-only preflight: identify the EXACT pinned JSEP glue that the
 * original P94 Worker loads (NOT a non-JSEP standalone graph runtime).
 * Public npm JS excerpts only, no original photo/owner/private/model bytes.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
export const PINNED_JS='08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9';
export const PINNED_WASM='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const PINNED_WORKER='d66651b616de54c51eb7ef986324b30f1580888f';
export const PINNED_M250_WORKER='55325ef58db3e6f5df55499948e708e2e40766f9';
export async function probeM251NativeGlue(){
 const original=await readFile('public/outfit-worker-p94.mjs');
 assert.equal(gitBlob(original),PINNED_WORKER,'Original shipped Worker drift');
 const paths=[
 'node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs',
 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',
 'node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm',
 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm'
 ];
 const markers=['_OrtCreateSessionOptions','OrtCreateSessionOptions',
  'createSessionOptions','_OrtCreateSession','instantiateWasm','instantiateStreaming',
  'WebAssembly.instantiate','_OrtDisableMemPattern','memPattern','enableMemPattern',
  'getImports','exports','wasmExports'];
 const files=[];
 for(const path of paths){
  let b;
  try{b=await readFile(path)}catch{files.push({path,exists:false});continue;}
  const text=path.endsWith('.mjs')?b.toString('utf8'):'';
  const counts={},publicSnippets={};
  if(text)for(const marker of markers){
   const indices=[...text.matchAll(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))].map(m=>m.index);
   counts[marker]=indices.length;
   // Only safe snippets of PUBLIC pinned JS; never private content.
   if(indices.length)publicSnippets[marker]=indices.slice(0,3).map(i=>text.slice(Math.max(0,i-90),Math.min(text.length,i+110)));
  }
  files.push({path,exists:true,bytes:b.length,sha256:sha(b),counts,publicSnippets});
 }
 assert.equal(files.filter(f=>f.exists&&f.sha256===PINNED_JS).length,1,
  'Exact original JSEP JS loader absent or ambiguous');
 assert.ok(files.some(f=>f.exists&&f.sha256===PINNED_WASM),
  'Original JSEP pinned WASM absent from installed npm dependencies');
 return {schema:'M251_PINNED_ORIGINAL_JSEP_ABI_GLUE_PREFLIGHT/v1',
  originalConsumerWorkerImmutable:true,files,
  originalModelAndPhotoUnchanged:true,actualNativeAbiCallNotYetObserved:true,
  nativeCAllocatorNotObserved:true,releaseAuthorized:false,familyAlphaHold:true};
}
if(process.argv[1]?.endsWith('main251-original-jsep-abi-probe.mjs')){
 const data=await probeM251NativeGlue();
 console.log('M251_ORIGINAL_JSEP_PUBLIC_ABI_PREFLIGHT',JSON.stringify(data));
}
