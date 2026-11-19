/**
 * M246 — same-version real original SegFormer GRAPH WASM binary identity.
 * The independent local graph harness and installed P94 Worker must never be
 * treated as equivalent merely because they share the ORT npm version.
 * The real M243 loopback HTTP server observes which actual .wasm bytes it
 * returned during true native WebKit / Chromium session creation.
 * Never record model/photograph/owner/linear-memory bytes.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const ORIGINAL_GRAPH_SHA='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
export const ORIGINAL_GRAPH_REVISION='a2489ea8e7ec1ee912190546bad31a4906ccca76';
export const ORIGINAL_WORKER_JSEP={
 name:'ort-wasm-simd-threaded.jsep.wasm',
 sha256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
 bytes:21596019
};
export const OTHER_PINNED_ORT={
 name:'ort-wasm-simd-threaded.wasm',
 sha256:'f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b',
 bytes:11133407
};
export const PINNED_ORT='1.22.0-dev.20250409-89f8206ba4';
const ORIGINAL=[ORIGINAL_WORKER_JSEP,OTHER_PINNED_ORT];
const sha256=b=>createHash('sha256').update(b).digest('hex');

export function attestLocalWasmServed(name,bytes){
 assert.ok(ORIGINAL.some(x=>x.name===name),'An unexpected local WASM variant was actually requested');
 assert.ok(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array,'Real original server WASM bytes missing');
 const actual={name,sha256:sha256(bytes),bytes:bytes.length};
 const expected=ORIGINAL.find(x=>x.name===name);
 assert.deepEqual(actual,expected,'Actual native-model WASM binary differs from exact pinned distribution');
 return {...actual,realLocalHttpResponse:true,originalBrowserResponseHashObserved:false,
  originalWorkerUnmodified:true};
}
export function acceptRealOriginalNativeGraphAsset({assets,session,engine,arm}){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok(['baseline','pattern_off'].includes(arm));
 assert.equal(session.engine,engine);
 assert.equal(session.arm,arm);
 assert.equal(session.originalGraphSha256,ORIGINAL_GRAPH_SHA);
 assert.equal(session.modelRevision,ORIGINAL_GRAPH_REVISION);
 assert.equal(session.originalPublicGraph,true);
 assert.equal(session.success,true,'Genuine original graph session RED');
 assert.equal(session.stage,'model_session_complete');
 assert.equal(session.originalOwnerPhotoJourneyNotRun,true);
 assert.equal(session.apiCalls?.length,1);
 assert.equal(session.apiCalls[0].actualCall,true);
 assert.equal(session.apiCalls[0].memPatternFlag,arm==='baseline');
 assert.equal(session.apiCalls[0].handleReturned,true);
 assert.equal(session.nativeCalls?.length,1);
 assert.equal(session.nativeCalls[0].actualNativeExportCalled,true);
 assert.equal(session.nativeCalls[0].returnedHandle,true);
 assert.ok(session.grownMemoryTargetCount>0);
 assert.ok(session.jsGrowCalls>0);
 assert.ok(Number.isInteger(session.finalHeapPages)&&session.finalHeapPages>0);
 assert.ok(Array.isArray(assets));
 assert.equal(assets.length,1,'Actual native model must have loaded exactly one real WASM binary');
 const asset=assets[0],expected=ORIGINAL.find(x=>x.name===asset.name);
 assert.ok(expected,'Wrong original ORT variant');
 assert.deepEqual([asset.name,asset.sha256,asset.bytes],
  [expected.name,expected.sha256,expected.bytes],
  'Actual served WASM does not match pinned binary identity');
 assert.equal(asset.realLocalHttpResponse,true);
 return {
  schema:'M246_TRUE_ORIGINAL_GRAPH_WASM_ASSET/v1',engine,arm,
  source:'actual-loopback-http-server-for-native-original-session',
  originalSegFormerGraphSha256:ORIGINAL_GRAPH_SHA,originalGraphRevision:ORIGINAL_GRAPH_REVISION,
  modelSessionNativeExportObserved:true,originalNativeSessionPassed:true,
  actualLoadedName:asset.name,actualLoadedSha256:asset.sha256,
  actualLoadedBytes:asset.bytes,actualWasmResponseReadAtSource:true,
  originalP94WorkerJsepName:ORIGINAL_WORKER_JSEP.name,
  originalP94WorkerJsepSha256:ORIGINAL_WORKER_JSEP.sha256,
  sameAsOriginalWorkerJsepBinary:asset.sha256===ORIGINAL_WORKER_JSEP.sha256,
  distinctWasmMemoryAllocatorBehaviorNotProven:true,
  actualOriginalWorkerSessionNotRunInThisHarness:true,
  realCPlusPlusAllocatorStateObserved:false,realWebkitRedBeforeGreenAfter:false,
  originalPhotoPrivateOwnerNotRead:true,releaseAuthorized:false,familyAlphaHold:true
 };
}
