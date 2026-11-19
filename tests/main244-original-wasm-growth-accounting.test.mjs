import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeOriginalNativeGrowth,assertGenuineOriginalGrowth}
 from '../scripts/main244-native-wasm-growth-attribution.mjs';

const native=(a,b)=>({
 actualNativeExportCalled:true,
 before:{targetCount:1,nowPages:a,jsGrowCalls:1},
 after:{targetCount:1,nowPages:b,jsGrowCalls:5},
 returnedHandle:true,threw:false
});
const grow=(beforePages,afterPages,duringNative=true,ok=true)=>({
 duringNative,ok,beforePages,afterPages,
 deltaPages:afterPages-beforePages
});
test('M244 real successful native boundary with all growth JS-visible is distinguishable',()=>{
 const result=summarizeOriginalNativeGrowth(native(364,756),[
  grow(256,364,false),grow(364,450),grow(450,600),grow(600,756)]);
 assert.equal(result.nativeDeltaPages,392);
 assert.equal(result.jsVisibleAddedPagesDuringNative,392);
 assert.equal(result.residualUnattributedPages,0);
 assert.equal(result.nativeInternalGrowInstructionObserved,false);
 assert.equal(result.nativeCAllocatorStateObserved,false);
});
test('M244 unobserved growth is residual NOT an invented native allocator instruction',()=>{
 const result=summarizeOriginalNativeGrowth(native(364,756),[
  grow(256,364,false)]);
 assert.equal(result.residualUnattributedPages,392);
 assert.equal(result.nativeInternalGrowInstructionObserved,false);
 assert.equal(result.permanentRepairProven,false);
});
test('M244 native JS growth failure never counts as added pages',()=>{
 const result=summarizeOriginalNativeGrowth(native(364,500),[
  grow(364,364,true,false),grow(364,400,true)]);
 assert.equal(result.jsVisibleGrowFailuresDuringNative,1);
 assert.equal(result.jsVisibleAddedPagesDuringNative,36);
 assert.equal(result.residualUnattributedPages,100);
});
test('M244 fail closed on tampered/incoherent memory receipts',()=>{
 assert.throws(()=>summarizeOriginalNativeGrowth(native(600,300),[]),/shrank/);
 assert.throws(()=>summarizeOriginalNativeGrowth(native(364,756),Array(25).fill(grow(364,365))),/Unbounded/);
 const r=summarizeOriginalNativeGrowth(native(364,756),[grow(364,800)]);
 assert.equal(r.residualInterpretable,false);
 assert.equal(r.residualUnattributedPages,null);
});
test('M244 cannot count a genuine failed source/model session as accepted',()=>{
 const source={sha256:'a'.repeat(64)};
 const valid={
  engine:'webkit',arm:'baseline',originalPublicGraph:true,
  installedConsumerWorkerUnchanged:true,success:false,
  originalGraphSha256:source.sha256,
  nativeCalls:[{...native(364,364),returnedHandle:false,threw:true}],
  apiCalls:[{memPatternFlag:true}],growEvents:[]
 };
 assert.throws(()=>assertGenuineOriginalGrowth(valid,source,'webkit','baseline'),/genuine RED/);
 assert.throws(()=>assertGenuineOriginalGrowth({...valid,success:true,originalGraphSha256:'b'.repeat(64)},
  source,'webkit','baseline'),/SHA changed/);
});
test('M244 source guard forbids product writes, retries and fabricated success',async()=>{
 const code=await readFile('scripts/test-main244-original-wasm-grow-attribution-browser.mjs','utf8');
 assert.match(code,/fdfb979ca3783cb362cb5eb909612902af0c3b70/);
 assert.match(code,/Original pinned SegFormer native model session RED/);
 assert.match(code,/M244_ORIGINAL_NATIVE_GROWTH_ATTRIBUTION/);
 assert.equal(code.includes('public/outfit-worker-p94.mjs'),true);
 for(const forbidden of ['HeapU8[','originalModelBytes:Buffer','retryOriginal','releaseAuthorized:true'])
  assert.ok(!code.includes(forbidden),forbidden);
});
