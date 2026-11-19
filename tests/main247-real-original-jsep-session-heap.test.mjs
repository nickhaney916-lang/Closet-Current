import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deriveOriginalP94JsepObserver,sanitizeRealWorkerJsepMessage,
 verifySameOriginalJsepModelBoundary,ORIGINAL_JSEP_SHA,ORIGINAL_WORKER_BLOB}
 from '../scripts/main247-original-worker-jsep-heap-observer.mjs';

const asset=()=>({
 originalP94Worker:true,originalTransformersVersion:'3.8.1',
 originalWasmHTTP200Count:1,independentPublicPinnedWasmBodySHA256Count:1,
 actualOriginalWasmResponseBytesVerified:true,
 independentPublicWasm:[{
  name:'ort-wasm-simd-threaded.jsep.wasm',sha256:ORIGINAL_JSEP_SHA,
  matchesInstalledLocalWasm:true,bytes:21596019,
  source:'independent-public-CDN-GET',browserResponseBytes:false
 }]
});
const event=()=>({
 phase:'m247_jsep_memory',outcome:'ready',hookInstalled:true,
 growCalls:5,growErrors:0,targetCount:1,validTargets:1,
 firstPages:256,terminalPages:767
});
test('M247 actual original source is byte-pinned; disposable JS memory probe leaves inference and fallback',async()=>{
 const bytes=await readFile('public/outfit-worker-p94.mjs');
 const derived=deriveOriginalP94JsepObserver(bytes.toString('utf8'));
 assert.ok(derived.includes("m247Emit(requestId,'ready')"));
 assert.ok(derived.includes("m247Emit(requestId,'error');loader=null;throw error"));
 assert.ok(derived.includes("device:'wasm',dtype:'fp32'"));
 assert.ok(derived.includes("reason:'P94_'+diagnosticStage"));
 assert.ok(derived.includes("self.postMessage({type:'piece'"));
 assert.equal(derived.includes('heapU8'),false);
 assert.equal(derived.includes('memory.buffer.slice'),false);
 assert.equal(ORIGINAL_WORKER_BLOB.length,40);
 assert.throws(()=>deriveOriginalP94JsepObserver('new fake worker'),/original consumer P94 source byte drift/i);
});
test('M247 accepts only one real JSEP model-ready/real browser hash/retained numeric memory',()=>{
 const accepted=verifySameOriginalJsepModelBoundary([event()],asset(),'webkit');
 assert.equal(accepted.actualOriginalP94SegFormerModel,true);
 assert.equal(accepted.retainedWasmMemoryRefs,1);
 assert.equal(accepted.firstObservedPages,256);
 assert.equal(accepted.terminalPages,767);
 assert.equal(accepted.originalJsepWasmSha256,ORIGINAL_JSEP_SHA);
 assert.equal(accepted.realWebkitNaturalRedSeen,false);
 assert.equal(accepted.realRedToGreenFixProven,false);
 assert.equal(accepted.familyAlphaHold,true);
});
test('M247 original native failure stays RED; cannot be upgraded by a good downloaded JSEP hash',()=>{
 const bad=event();bad.outcome='error';
 assert.throws(()=>verifySameOriginalJsepModelBoundary([bad],asset(),'webkit'),/model-load failed/);
 assert.throws(()=>verifySameOriginalJsepModelBoundary([],asset(),'webkit'),/Missing\/ambiguous/);
 assert.throws(()=>verifySameOriginalJsepModelBoundary([event(),event()],asset(),'webkit'),/Missing\/ambiguous/);
});
test('M247 fails source-provenance substitution and unreadable original WebKit body',()=>{
 const wrong=asset();wrong.independentPublicWasm[0].sha256='f'.repeat(64);
 assert.throws(()=>verifySameOriginalJsepModelBoundary([event()],wrong,'webkit'),/Expected values/);
 const wrongName=asset();wrongName.independentPublicWasm[0].name='ort-wasm-simd-threaded.wasm';
 assert.throws(()=>verifySameOriginalJsepModelBoundary([event()],wrongName,'webkit'),/Expected values/);
 const originalUnreadable=asset();originalUnreadable.actualOriginalWasmResponseBytesVerified=false;
 assert.throws(()=>verifySameOriginalJsepModelBoundary([event()],originalUnreadable,'webkit'),
  /WebKit JSEP browser bytes still not attested/);
 assert.equal(verifySameOriginalJsepModelBoundary([event()],originalUnreadable,'chromium')
  .actualOriginalBrowserJsepBodyHash,false);
});
test('M247 model loader must retain actual original JS Memory hook and no grow error',()=>{
 const noHook=event();noHook.hookInstalled=false;
 assert.throws(()=>verifySameOriginalJsepModelBoundary([noHook],asset(),'webkit'),/observer absent/);
 const noGrow=event();noGrow.growCalls=0;
 assert.throws(()=>verifySameOriginalJsepModelBoundary([noGrow],asset(),'webkit'),/not observed/);
 const badGrow=event();badGrow.growErrors=1;
 assert.throws(()=>verifySameOriginalJsepModelBoundary([badGrow],asset(),'webkit'),/Native memory grow threw/);
 const noRefs=event();noRefs.validTargets=0;
 assert.throws(()=>verifySameOriginalJsepModelBoundary([noRefs],asset(),'webkit'),/falsy value|false == true/);
});
test('M247 sanitize discards owner/photo/model/request details and unexpected event',()=>{
 const source={type:'diagnostic',phase:'m247_jsep_memory',outcome:'ready',
  hookInstalled:true,growCalls:4,growErrors:0,targetCount:1,validTargets:1,
  firstPages:256,terminalPages:767,image:'private_image',
  ownerId:'sensitive',access_token:'secret',buffer:new Uint8Array([1,2])};
 const safe=sanitizeRealWorkerJsepMessage(source);
 assert.ok(safe);
 for(const secret of ['private_image','sensitive','secret','image','ownerId','access_token','buffer'])
  assert.equal(JSON.stringify(safe).includes(secret),false);
 assert.equal(sanitizeRealWorkerJsepMessage({...source,phase:'unrelated'}),null);
 assert.equal(sanitizeRealWorkerJsepMessage({...source,outcome:'invented'}),null);
 assert.equal(sanitizeRealWorkerJsepMessage({...source,growCalls:100000000}).growCalls,null);
});
test('M247 preserved original browser pass/fail and owner-private 2D/v4 acceptance',async()=>{
 const script=await readFile('scripts/test-main247-real-p94-jsep-model-heap-browser.mjs','utf8');
 assert.ok(script.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));
 assert.ok(script.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.ok(script.includes('assert.ok(state.cards>0&&state.cards<=12'));
 assert.ok(script.includes('M58_REAL_P88_WORKER_FAIL'));
 assert.ok(script.includes('assert.equal(run.status,0'));
 assert.ok(script.includes('noRetries:true'));
 assert.equal(script.includes("return route.fulfill({status:200,contentType:'image/jpeg'"),false);
});
