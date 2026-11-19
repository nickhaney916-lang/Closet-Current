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

/** Playwright cannot always expose worker WASM response.body() even after an
 * observed 200. Independently retrieve the SAME public, pinned CDN artifact
 * in Node and LABEL it a separate GET, not the bytes actually delivered to
 * the Worker. Never silently upgrade independently fetched bytes to direct
 * browser/WASM-memory identity evidence.
 */
export async function independentlyFetchPinnedWasm(name,fetcher=fetch){
 const url='https://cdn.jsdelivr.net'+PREFIX+name;
 const asset=classifyPinnedPublicRuntime(url);
 assert.ok(asset?.kind==='onnx-wasm','Only immutable original public ONNX WASM GET permitted');
 const response=await fetcher(url,{signal:AbortSignal.timeout(180000)});
 assert.equal(response.status,200,'Independent pinned CDN WASM GET did not return 200');
 assert.equal(classifyPinnedPublicRuntime(response.url)?.name,name,
  'Independent CDN WASM GET redirected to an unapproved public path');
 const length=Number(response.headers.get('content-length'));
 if(Number.isFinite(length)&&length>0)assert.ok(length<=128*1024*1024,'Public WASM response oversized');
 const bytes=new Uint8Array(await response.arrayBuffer());
 assert.ok(bytes.length>=100000&&bytes.length<=128*1024*1024,
  'Independent WASM response was missing/oversized');
 return {name,sha256:sha256(bytes),bytes:bytes.length,
  source:'independent-public-CDN-GET',browserResponseBytes:false};
}
export function attestP94LoadedRuntime(network,installed,independentWasm){
 const observedJS=network.filter(a=>a.kind==='transformers-entry'&&a.status===200&&a.available);
 const observedWasm=network.filter(a=>a.kind==='onnx-wasm'&&a.status===200);
 assert.equal(observedJS.length,1,'Exactly one original Transformers JS response body required');
 assert.ok(observedWasm.length>0,'Original Worker WASM HTTP200 response was not observed');
 assert.ok(network.every(a=>a.status===200&&
   (a.available||a.kind==='onnx-wasm')),
   'Non-WASM runtime source unreadable/unavailable or HTTP failure');
 const unique=new Set();
 for(const item of network){
  assert.ok(!unique.has(item.name),'Original runtime resource repeated/ambiguous: '+item.name);
  unique.add(item.name);
  if(item.available){
   assert.match(item.sha256,HASH_RE);
   assert.ok(Number.isInteger(item.bytes)&&item.bytes>0);
  }
 }
 const independentlyAttested=[];
 for(const entry of observedWasm){
  const records=independentWasm.filter(x=>x.name===entry.name);
  assert.equal(records.length,1,'Original WASM URI lacks one independently SHA-attested public fetch');
  const info=records[0];
  assert.match(info.sha256,HASH_RE);
  assert.ok(info.bytes>100000&&info.source==='independent-public-CDN-GET');
  if(entry.available){
   assert.equal(entry.sha256,info.sha256,
    'Actual original browser WASM differs from independent pinned public CDN bytes');
   assert.equal(entry.bytes,info.bytes,'Original and independent CDN byte sizes disagree');
  }
  independentlyAttested.push(info);
 }
 const installedHashes=new Set(installed.map(x=>x.sha256));
 return {
  schema:'M245_ORIGINAL_WORKER_CDN_RUNTIME_IDENTITY/v2',
  originalP94Worker:true,originalTransformersVersion:'3.8.1',
  actualCDNEntryJS:observedJS.length,originalWasmHTTP200Count:observedWasm.length,
  originalWasmBrowserBodySHA256Count:observedWasm.filter(x=>x.available).length,
  actualOriginalWasmResponseBytesVerified:observedWasm.every(x=>x.available),
  independentPublicPinnedWasmBodySHA256Count:independentlyAttested.length,
  independentPublicWasm:independentlyAttested.map(x=>({
   name:x.name,sha256:x.sha256,bytes:x.bytes,source:x.source,
   matchesInstalledLocalWasm:installedHashes.has(x.sha256)
  })),
  observedPublicResources:network.map(x=>({
   kind:x.kind,name:x.name,status:x.status,available:x.available,
   sha256:x.sha256,bytes:x.bytes
  })),
  localOrtVersion:'1.22.0-dev.20250409-89f8206ba4',localWasmAssets:installed,
  browserAndLocalWasmExactParityProven:observedWasm.every(x=>x.available)&&
   observedWasm.every(x=>installedHashes.has(x.sha256)),
  independentlyDownloadedAndLocalIdentical:independentlyAttested.some(x=>installedHashes.has(x.sha256)),
  originalCAllocatorStateObserved:false,originalWebkitRepairProven:false,
  hostedFamilyPhoneVerified:false,releaseAuthorized:false,hold:true
 };
}
