/**
 * Mission 4 M248 — strictly FIRST-ATTEMPT original JSEP WebKit evidence ledger.
 * It consumes only allowlisted, already-sanitized scalar receipts from the
 * source-pinned original P94 SegFormer JSEP Worker/owner/2D/v4 M247 harness.
 * Never logs tokens/photos/weights/URLs/heap contents or raw exceptions.
 * A failed attempt is ALWAYS red. No retry, rerun-to-green or sample dropping.
 */
import assert from 'node:assert/strict';
export const M247_EXACT_BROWSER_GIT_BLOB='92670c115a42f6408577de4d08d8dea24c263cd2';
export const M247_EXACT_OBSERVER_GIT_BLOB='ea461a2cc7d06b8b03db0f245f0911c5d4695a20';
export const ORIGINAL_JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';

const RECEIPTS=[
 ['memory','M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '],
 ['model','M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY '],
 ['owner','M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '],
 ['failure','M58_REAL_P88_WORKER_FAIL ']
];
export function parseOriginalEvidence(output){
 const rows=String(output).split(/\r?\n/);
 const data={};
 for(const [name,tag] of RECEIPTS){
  const items=rows.filter(row=>row.startsWith(tag));
  const valid=[];
  for(const line of items){
   try{
    const parsed=JSON.parse(line.slice(tag.length));
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))valid.push(parsed);
   }catch{}
  }
  data[name]={count:items.length,validCount:valid.length,receipt:valid.length===1?valid[0]:null};
 }
 return data;
}
export function classifyOriginalFailure(evidence,status,engine,attempt){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.match(attempt,/^[wc][0-9]{2}$/);
 const event=evidence.memory.receipt;
 const failure=evidence.failure.receipt;
 const rawException=typeof failure?.error==='string'?failure.error.toLowerCase():'';
 let category='unclassified-original-red';
 // Never re-label an assertion/observer/tooling failure as native WebKit fault.
 if(/webassembly\.runtimeerror|runtimeerror.*memory|memory access out of bounds|out of bounds memory access|wasm_memory_access/.test(rawException))
  category='possible-original-wasm-memory-access';
 else if(/out of memory|allocation failed|memory allocation/.test(rawException))
  category='possible-original-memory-allocation';
 else if(event?.outcome==='error')category='original-model-loader-error-unclassified';
 else if(/assertionerror|missing\/ambiguous|original jsep|source drift/.test(rawException))
  category='research-acceptance-or-telemetry-error';
 else if(failure?.stage&&typeof failure.stage==='string')category='original-browser-journey-error';
 const actualNativeRed=(event?.outcome==='error' &&
  (category==='possible-original-wasm-memory-access'||category==='possible-original-memory-allocation'));
 return {
  schema:'M248_FIRST_ORIGINAL_JSEP_WEBKIT_RED_LEDGER/v1',engine,attempt,
  browserProcessExitStatus:Number.isInteger(status)?status:null,
  actualOriginalModelReady:event?.outcome==='ready',
  modelLoadFailureEvent:event?.outcome==='error',
  memoryObserverInstalled:event?.hookInstalled===true,
  actualMemoryGrowCalls:Number.isInteger(event?.growCalls)?event.growCalls:null,
  actualMemoryGrowErrors:Number.isInteger(event?.growErrors)?event.growErrors:null,
  firstMemoryPages:Number.isInteger(event?.firstPages)?event.firstPages:null,
  terminalMemoryPages:Number.isInteger(event?.terminalPages)?event.terminalPages:null,
  failureCategory:category,originalNativeMemoryRedProven:actualNativeRed,
  rawFailurePrivateDataStored:false,actualFirstAttemptFailed:true,
  noRetry:true,noSilentWrongSave:true,releaseAuthorized:false,familyAlphaHold:true
 };
}
export function verifyPositiveOriginalFirstAttempt(evidence,status,engine,attempt){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.match(attempt,/^[wc][0-9]{2}$/);
 assert.equal(status,0,'Genuine first original-JSEP attempt nonzero; RED');
 assert.equal(evidence.failure.count,0,'Original browser failure occurred despite positive status');
 for(const name of ['memory','model','owner']){
  assert.equal(evidence[name].count,1,'Original '+name+' event missing or duplicated');
  assert.equal(evidence[name].validCount,1,'Original '+name+' JSON receipt invalid');
 }
 const memory=evidence.memory.receipt,model=evidence.model.receipt,owner=evidence.owner.receipt;
 assert.equal(memory.outcome,'ready','Actual original SegFormer JSEP model-load failed');
 assert.equal(memory.hookInstalled,true);
 assert.equal(memory.growErrors,0);
 assert.ok(Number.isInteger(memory.growCalls)&&memory.growCalls>0);
 assert.ok(Number.isInteger(memory.validTargets)&&memory.validTargets>0);
 assert.ok(Number.isInteger(memory.firstPages)&&memory.firstPages>0);
 assert.ok(Number.isInteger(memory.terminalPages)&&memory.terminalPages>=memory.firstPages);
 assert.equal(model.engine,engine);
 assert.equal(model.originalModelSessionReady,true);
 assert.equal(model.actualOriginalP94SegFormerModel,true);
 assert.equal(model.originalJsepWasmSha256,ORIGINAL_JSEP_SHA);
 assert.equal(model.originalJsepWasmName,'ort-wasm-simd-threaded.jsep.wasm');
 assert.equal(model.originalPhotoReviewCardCount,2);
 assert.equal(model.realRedToGreenFixProven,false);
 assert.equal(model.familyAlphaHold,true);
 if(engine==='webkit')assert.equal(model.actualOriginalBrowserJsepBodyHash,true);
 assert.equal(owner.engine,engine);
 assert.equal(owner.realWorkerFirst,true);
 assert.equal(owner.ownerAOriginalNotVisibleToB,true);
 assert.equal(owner.ownerAOutfitNotVisibleToB,true);
 assert.equal(owner.ownerBPrivateRows,0);
 assert.equal(owner.explicitOwnerASave,1);
 assert.equal(owner.familyAlpha,'HOLD');
 assert.equal(owner.releaseAllowed,false);
 return {
  schema:'M248_FIRST_ORIGINAL_JSEP_WEBKIT_POSITIVE/v1',engine,attempt,
  sameOriginalJsepBinary:true,originalSourceOwnerPrivate2DV4Passed:true,
  actualOriginalModelSessionPassed:true,genuineUnverifiedProposals:2,
  originalJsepSha256:ORIGINAL_JSEP_SHA,realOriginalWebkitBodyHash:model.actualOriginalBrowserJsepBodyHash,
  actualMemoryGrowCalls:memory.growCalls,actualFirstPages:memory.firstPages,
  actualTerminalPages:memory.terminalPages,originalNativeMemoryRedObserved:false,
  nativeCppAllocatorStateUnknown:true,permanentWebkitFixProven:false,
  noRetry:true,releaseAuthorized:false,familyAlphaHold:true
 };
}
