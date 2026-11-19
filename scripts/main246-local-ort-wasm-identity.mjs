/**
 * M246 read-only fingerprint of WASM actually served by the original M243
 * standalone, public SegFormer graph browser session. Only local /ort/*.wasm
 * public runtime assets are inspected, never model/photo/account buffers.
 * Local server response proof is not proof of instantiated C++ allocator state.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const P94_JSEP='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const PINNED_LOCAL_NON_JSEP='f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b';
const wasmName=name=>/^ort[-.][a-z0-9_.-]{1,90}\.wasm$/.test(name);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function classifyLocalRuntimeResponse(url,base){
 try{
  const u=new URL(url),origin=new URL(base);
  if(u.origin!==origin.origin||u.search||u.hash||!u.pathname.startsWith('/ort/'))return null;
  const name=u.pathname.slice('/ort/'.length);
  return wasmName(name)?name:null;
 }catch{return null;}
}
export function summarizeLocalPublicWasm(name,bytes){
 assert.ok(wasmName(name),'Only pinned local ORT WASM runtime permitted');
 assert.ok(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array,'Invalid public WASM response');
 assert.ok(bytes.byteLength>=100000&&bytes.byteLength<=128*1024*1024,'Missing/oversized runtime');
 return {name,sha256:sha256(bytes),bytes:bytes.byteLength};
}
export function attestM246NativeVariant({server,network,installed,engine,arm}){
 assert.ok(['webkit','chromium'].includes(engine),'Invalid native engine');
 assert.ok(['baseline','pattern_off'].includes(arm),'Invalid native arm');
 assert.equal(server.length,1,'Missing/ambiguous actual local runtime WASM server delivery');
 assert.equal(network.length,1,'Missing/ambiguous original real browser WASM response');
 const delivered=server[0],browser=network[0];
 assert.ok(wasmName(delivered.name),'Original source runtime not allowlisted');
 assert.equal(browser.name,delivered.name,'Browser response and original server runtime differ');
 assert.equal(browser.status,200,'Original browser runtime HTTP not successful');
 const installedMatch=installed.filter(x=>x.name===delivered.name);
 assert.equal(installedMatch.length,1,'Missing/duplicate installed pinned ORT binary');
 assert.equal(delivered.sha256,installedMatch[0].sha256,'Server bytes differ from pinned installed runtime');
 assert.equal(delivered.bytes,installedMatch[0].bytes,'Server byte count drift');
 assert.match(delivered.sha256,/^[0-9a-f]{64}$/);
 if(browser.bodyAvailable){
  assert.equal(browser.sha256,delivered.sha256,'Actual browser bytes differ from local server');
  assert.equal(browser.bytes,delivered.bytes,'Actual browser byte count differs');
 }else{
  assert.equal(browser.sha256,null,'Unreadable browser binary cannot have a browser SHA');
  assert.equal(browser.bytes,null,'Unreadable browser body cannot have a byte count');
 }
 let variant='other-onnx-wasm';
 if(delivered.sha256===P94_JSEP)variant='same-byte-JSEP-as-original-P94-WebKit';
 if(delivered.sha256===PINNED_LOCAL_NON_JSEP)variant='local-non-JSEP';
 return {
  schema:'M246_ORIGINAL_NATIVE_GRAPH_WASM_IDENTITY/v1',engine,arm,
  originalGraphSessionSeparateFromOwnerWorker:true,
  localRuntimeName:delivered.name,localRuntimeBytes:delivered.bytes,
  localRuntimeSha256:delivered.sha256,localVariant:variant,
  actualLocalServerWasmDelivered:true,actualBrowserWasmHttp200:true,
  actualBrowserResponseBodyShaVerified:browser.bodyAvailable,
  installedOriginalPinnedBinaryExactMatch:true,
  matchesP94OriginalWebkitJsepBinary:delivered.sha256===P94_JSEP,
  originalP94RealOwnerPathNotRunByThisTest:true,
  jsepAndNonJsepAllocatorParityProven:false,
  originalFailureCaptured:false,permanentWebkitFixProven:false,
  privateDataAccessed:false,releaseAuthorized:false,familyAlphaHold:true
 };
}
