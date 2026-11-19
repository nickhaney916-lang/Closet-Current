/**
 * M245 read-only ORIGINAL P94 Worker CDN runtime fingerprint.
 * Only public @huggingface/transformers@3.8.1 JavaScript/WASM CDN responses
 * are hashed. Never read photo, ONNX model weights, auth, URLs with queries,
 * private source buffers or browser WASM memory. This is network asset
 * provenance, NOT native C++ allocator introspection or WebKit repair.
 */
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const PREFIX='/npm/@huggingface/transformers@3.8.1/dist/';
const HASH_RE=/^[0-9a-f]{64}$/;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function classifyPinnedPublicRuntime(url){
 let u;
 try{u=new URL(url);}catch{return null;}
 if(u.protocol!=='https:'||u.hostname!=='cdn.jsdelivr.net')return null;
 if(!u.pathname.startsWith(PREFIX)||u.search||u.hash)return null;
 const base=u.pathname.slice(PREFIX.length);
 if(!/^[a-zA-Z0-9_.-]{1,90}$/.test(base))return null;
 if(base==='transformers.min.js')return {kind:'transformers-entry',name:base};
 if(/^ort[-.][a-z0-9_.-]+\.wasm$/.test(base))return {kind:'onnx-wasm',name:base};
 if(/^ort[-.][a-z0-9_.-]+\.(?:js|mjs)$/.test(base))return {kind:'onnx-loader',name:base};
 return null;
}
export function digestPublicRuntimeResponse(asset,responseStatus,bytes){
 assert.ok(asset&&['transformers-entry','onnx-wasm','onnx-loader'].includes(asset.kind),
  'Non-public/runtime-only CDN artifact cannot be processed');
 if(responseStatus!==200||!bytes){
  return {kind:asset.kind,name:asset.name,status:responseStatus,
   available:false,sha256:null,bytes:null};
 }
 assert.ok(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array);
 return {kind:asset.kind,name:asset.name,status:200,available:true,
  sha256:sha256(bytes),bytes:bytes.byteLength};
}
export async function installedOrtWasmFingerprints(root=process.cwd()){
 const pkg=JSON.parse(await readFile(join(root,'node_modules/onnxruntime-web/package.json'),'utf8'));
 assert.equal(pkg.version,'1.22.0-dev.20250409-89f8206ba4','Local ORT runtime version drift');
 const dir=join(root,'node_modules/onnxruntime-web/dist');
 const names=(await readdir(dir)).filter(x=>/^ort[-.][a-z0-9_.-]+\.wasm$/.test(x)).sort();
 return Promise.all(names.map(async name=>{
  const bytes=await readFile(join(dir,name));
  return {name,sha256:sha256(bytes),bytes:bytes.length};
 }));
}
export function attestP94LoadedRuntime(network,installed){
 const publicAssets=network.filter(a=>a.available&&a.status===200);
 const entry=publicAssets.filter(a=>a.kind==='transformers-entry');
 const wasm=publicAssets.filter(a=>a.kind==='onnx-wasm');
 assert.ok(entry.length===1,'Exactly one real original Transformers entry JS body required');
 assert.ok(wasm.length>=1,'Original Worker downloaded no independently SHA-attested public ONNX WASM');
 assert.ok(network.every(a=>a.status===200&&a.available),
  'Original public WASM/JS response unavailable; do not infer runtime identity');
 const unique=new Set();
 for(const item of publicAssets){
  assert.match(item.sha256,HASH_RE);
  assert.ok(Number.isInteger(item.bytes)&&item.bytes>0);
  assert.ok(!unique.has(item.name),'Original runtime identity repeated or ambiguous: '+item.name);
  unique.add(item.name);
 }
 const localHashes=new Set(installed.map(x=>x.sha256));
 const items=publicAssets.map(a=>({
  name:a.name,kind:a.kind,sha256:a.sha256,bytes:a.bytes,
  matchesInstalledLocalWasm:a.kind==='onnx-wasm'&&localHashes.has(a.sha256)
 }));
 return {
  schema:'M245_ORIGINAL_WORKER_CDN_RUNTIME_IDENTITY/v1',
  originalP94Worker:true,originalTransformersVersion:'3.8.1',
  pinnedOriginalSourceSHAObservedExternally:true,
  actualCDNEntryCount:entry.length,actualCDNWasmCount:wasm.length,
  assets:items,localOrtVersion:'1.22.0-dev.20250409-89f8206ba4',
  localWasmAssets:installed,
  localAndCDNWasmBinaryIdentical:wasm.some(a=>localHashes.has(a.sha256)),
  cdnAndLocalRuntimePathsIndependent:true,
  originalNativeCAllocatorStateObserved:false,
  provenOriginalWebkitRepair:false,releaseAuthorized:false,hold:true
 };
}
