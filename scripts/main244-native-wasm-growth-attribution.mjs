/**
 * Mission 4 M244: measure and attribute original ONNX WASM memory growth.
 * All receipt fields are bounded non-sensitive page counts and control flags.
 * Native growth UNATTRIBUTED to JS is an upper-bound residual, NOT proof of
 * a specific native allocator instruction or cause of an intermittent crash.
 */
import assert from 'node:assert/strict';

const pages=n=>Number.isSafeInteger(n)&&n>=0&&n<=65536;
export function summarizeOriginalNativeGrowth(call,grows){
 assert.ok(call?.actualNativeExportCalled===true,'No genuine original native model-session export');
 assert.ok(call?.before&&call?.after,'No original native call entry/exit witness');
 assert.ok(pages(call.before.nowPages)&&pages(call.after.nowPages),'Invalid WASM native memory pages');
 assert.ok(Array.isArray(grows)&&grows.length<=24,'Unbounded/untrusted JS growth receipts');
 const nativeDelta=call.after.nowPages-call.before.nowPages;
 assert.ok(nativeDelta>=0,'WASM memory unexpectedly shrank across native model session');
 let jsPages=0,jsGrowEvents=0,jsGrowFailures=0;
 for(const g of grows){
  assert.ok(typeof g?.duringNative==='boolean'&&typeof g?.ok==='boolean','Incomplete visibility classification');
  assert.ok(pages(g.beforePages)&&pages(g.afterPages),'Unsafe grow page counts');
  if(!g.duringNative)continue;
  jsGrowEvents++;
  if(g.ok){
   assert.ok(g.afterPages>=g.beforePages,'Successful JS-visible memory.grow shrank');
   jsPages+=g.afterPages-g.beforePages;
  } else jsGrowFailures++;
 }
 // Snapshots are endpoint counts and the JS hook is not a native instruction
 // trace. Differencing is only a bounded residual, not "native instructions".
 const residual=nativeDelta-jsPages;
 const coherent=residual>=0&&pages(residual);
 return {
  actualOriginalModelNativeExport:true,
  nativeEntryPages:call.before.nowPages,
  nativeReturnPages:call.after.nowPages,
  nativeDeltaPages:nativeDelta,
  jsVisibleGrowEventsDuringNative:jsGrowEvents,
  jsVisibleGrowFailuresDuringNative:jsGrowFailures,
  jsVisibleAddedPagesDuringNative:jsPages,
  residualUnattributedPages:coherent?residual:null,
  residualInterpretable:coherent,
  nativeInternalGrowInstructionObserved:false,
  nativeCAllocatorStateObserved:false,
  originalModelSessionSucceeded:call.returnedHandle===true&&!call.threw,
  naturalWebKitFailureObserved:call.threw===true,
  permanentRepairProven:false,
  releaseAuthorized:false,
  familyAlphaHold:true
 };
}
export function assertGenuineOriginalGrowth(result,source,engine,arm){
 assert.ok(result?.originalPublicGraph&&result?.installedConsumerWorkerUnchanged,
  'Original immutable source or real graph witness missing');
 assert.equal(result.engine,engine);assert.equal(result.arm,arm);
 assert.equal(result.success,true,'Original native model session genuine RED must stay RED');
 assert.equal(result.nativeCalls?.length,1,'Original native model-session export missing');
 assert.equal(result.apiCalls?.length,1,'Original native options export missing');
 assert.equal(result.apiCalls[0].memPatternFlag,arm==='baseline','Real native memory pattern A/B mismatched');
 assert.equal(result.originalGraphSha256,source.sha256,'Original SegFormer graph SHA changed');
 const a=summarizeOriginalNativeGrowth(result.nativeCalls[0],result.growEvents);
 assert.ok(a.residualInterpretable,'Native memory growth could not be decomposed');
 return a;
}
