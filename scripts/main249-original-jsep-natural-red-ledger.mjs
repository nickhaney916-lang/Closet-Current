/**
 * M249 complementary investigation: preserve every independently fresh real
 * original WebKit browser-process outcome and, on a natural model-load RED,
 * only emit the same-process ORIGINAL JSEP asset/error/heap taxonomy.
 *
 * Never reclassify a deterministic injected ONNX abort as a native failure.
 * Never treat unknown JS error class as allocator proof.
 */
import assert from 'node:assert/strict';
export const ORIGINAL_JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const evidenceMarker='M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE ';
const successMarker='M249_GENUINE_SOURCE_OWNER_PASS ';
const modelMarker='M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY ';
const privacyMarker='M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ';
const backupMarker='M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ';
const memoryMarker='M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT ';
function receipts(s,marker){
 assert.ok(typeof s==='string'&&s.length<=12*1024*1024,'Original bounded process output');
 return s.split(/\r?\n/).filter(line=>line.startsWith(marker)).map(line=>{
  try{return JSON.parse(line.slice(marker.length));}
  catch{throw Error('Malformed original JSEP evidence receipt');}
 });
}
const acceptedNames=new Set(['RuntimeError','Error','RangeError','TypeError','NetworkError','AbortError','CompileError','LinkError','other','UNKNOWN']);
const acceptedCategories=new Set(['wasm_memory_access','memory_allocation','wasm_compile','wasm_link','session','network_abort','network','other','UNKNOWN']);
export function classifyOneRealOriginalAttempt({engine,width,attempt,exitCode,timedOut=false,signal=null,stdout=''}) {
 assert.ok(['webkit','chromium'].includes(engine));assert.ok([320,390,430].includes(width));
 assert.ok(Number.isInteger(attempt)&&attempt>=1&&attempt<=32);
 assert.ok(exitCode===null||Number.isInteger(exitCode));assert.equal(typeof timedOut,'boolean');
 const base={schema:'M249_ORIGINAL_JSEP_NATURAL_ATTEMPT/v1',engine,width,attempt,
  freshNativeChildProcess:true,originalWorkerSourceUnchanged:true,
  originalSegformerFp32Unchanged:true,originalJsepUnchanged:true,
  noSilentOwnerAutoSave:true,localSyntheticOwnerOnly:true,
  realNativeAllocatorRootCauseProven:false,permanentFixProven:false,
  releaseAuthorized:false,hold:true};
 const errors=receipts(stdout,evidenceMarker);
 const passed=receipts(stdout,successMarker);
 const model=receipts(stdout,modelMarker);
 const privacy=receipts(stdout,privacyMarker);
 const backup=receipts(stdout,backupMarker);
 const memory=receipts(stdout,memoryMarker);
 for(const group of [errors,passed,model,privacy,backup,memory])assert.ok(group.length<=1,'Duplicate original attempt receipt');
 if(exitCode===0&&!timedOut&&!signal){
  assert.equal(errors.length,0,'A genuine positive also emitted original failure');
  assert.equal(passed.length,1,'No original real model and full owner success');
  assert.equal(model.length,1,'Missing actual original JSEP model receipt');
  assert.equal(privacy.length,1,'Missing original cross-owner privacy proof');
  assert.equal(backup.length,1,'Missing original-photo source-lossless restore proof');
  assert.equal(memory.length,1,'Missing real original JSEP heap receipt');
  const p=passed[0],m=model[0],o=privacy[0],b=backup[0],heap=memory[0];
  assert.equal(p.engine,engine);assert.equal(p.trueNativeJsepWorker,true);
  assert.equal(p.originalModelAndOwner2DV4,true);
  assert.equal(m.engine,engine);assert.equal(m.originalModelSessionReady,true);
  assert.equal(m.originalJsepWasmSha256,ORIGINAL_JSEP_SHA);
  assert.equal(m.originalJsepWasmName,'ort-wasm-simd-threaded.jsep.wasm');
  if(engine==='webkit')assert.equal(m.actualOriginalBrowserJsepBodyHash,true);
  assert.equal(m.realRedToGreenFixProven,false);
  assert.equal(o.engine,engine);assert.equal(o.ownerBPrivateRows,0);
  assert.equal(o.ownerAOriginalNotVisibleToB,true);assert.equal(o.ownerAOutfitNotVisibleToB,true);
  assert.equal(b.engine,engine);assert.equal(b.manualSyntheticOwnerConfirmed,true);
  assert.equal(b.ownerPrivateSaved,1);assert.equal(b.restoredSavedOutfitCount,1);
  assert.equal(b.atomicRestore,true);assert.equal(b.tamperDenied,true);
  assert.equal(heap.outcome,'ready');assert.equal(heap.hookInstalled,true);
  assert.ok(heap.growCalls>0&&heap.firstPages>0&&heap.terminalPages>=heap.firstPages);
  return {...base,outcome:'PASS',
   directOriginalWebkitJsepHash:m.actualOriginalBrowserJsepBodyHash===true,
   originalModelSessionCompleted:true,originalPrivate2DV4Accepted:true,
   reportedWorkerExceptionName:null,reportedWorkerExceptionCategory:null,
   modelGrowCalls:heap.growCalls,firstObservedPages:heap.firstPages,terminalPages:heap.terminalPages};
 }
 if(errors.length===0){
  return {...base,outcome:'UNCLASSIFIED_RED',exitCode,timedOut,signalTerminated:!!signal,
   naturalOriginalModelRedAttested:false,directOriginalWebkitJsepHash:false,
   reportedWorkerExceptionName:'UNKNOWN',reportedWorkerExceptionCategory:'UNKNOWN',
   originalPrivate2DV4Accepted:false};
 }
 assert.equal(passed.length,0,'Failing original model cannot also be counted as accepted');
 assert.equal(model.length,0,'Original session acceptance cannot coexist with failed model-load receipt');
 assert.equal(privacy.length,0,'Failed original model cannot claim private outfit');
 assert.equal(backup.length,0,'Failed original model cannot claim source restore');
 assert.equal(errors.length,1,'Ambiguous original model error');
 const e=errors[0];assert.equal(e.schema,'M249_ORIGINAL_FAILED_JSEP_SAME_ATTEMPT/v1');
 assert.equal(e.engine,engine);assert.equal(e.controlledPublicOnnxAbort,false);
 assert.equal(e.realOriginalP94ModelAttemptFailed,true);
 assert.equal(e.originalTestFailedNonzero,true);
 assert.ok(acceptedNames.has(e.modelExceptionName));
 assert.ok(acceptedCategories.has(e.modelExceptionCategory));
 if(e.directOriginalJsepBrowserBodySHAProven)
  assert.equal(e.actualPublicRuntimeIdentity,'DIRECT_SAME_ATTEMPT_JSEP_SHA');
 else assert.notEqual(e.actualPublicRuntimeIdentity,'DIRECT_SAME_ATTEMPT_JSEP_SHA');
 assert.equal(e.nativeCppAllocatorCauseProven,false);
 assert.equal(e.realRedToGreenFixProven,false);
 const numeric=v=>Number.isInteger(v)&&v>=0?v:null;
 return {...base,outcome:'REAL_MODEL_LOAD_RED',exitCode,
  timedOut,signalTerminated:!!signal,naturalOriginalModelRedAttested:true,
  directOriginalWebkitJsepHash:e.directOriginalJsepBrowserBodySHAProven===true,
  jsepIdentity:e.actualPublicRuntimeIdentity,
  reportedWorkerExceptionName:e.modelExceptionName,
  reportedWorkerExceptionCategory:e.modelExceptionCategory,
  sameAttemptHeapTerminalObserved:e.originalHeapTerminalSeen===true,
  modelGrowCalls:numeric(e.observedGrowCalls),
  firstObservedPages:numeric(e.observedFirstPages),
  terminalPages:numeric(e.observedTerminalPages),
  nativeMemoryAccessCategoryObserved:e.modelExceptionCategory==='wasm_memory_access',
  originalPrivate2DV4Accepted:false};
}
export function aggregateRealOriginalAttempts(trials,{engine,width,batch,expected}) {
 assert.ok(['webkit','chromium'].includes(engine));assert.ok([320,390,430].includes(width));
 assert.ok(typeof batch==='string'&&/^[A-Za-z0-9_-]{1,16}$/.test(batch));
 assert.ok(Number.isInteger(expected)&&expected>=1&&expected<=8);
 assert.ok(Array.isArray(trials)&&trials.length===expected,'Lost genuine browser process');
 const ordinals=new Set();
 for(const t of trials){
  assert.equal(t.engine,engine);assert.equal(t.width,width);
  assert.ok(!ordinals.has(t.attempt),'Replayed original trial');ordinals.add(t.attempt);
 }
 const reds=trials.filter(t=>t.outcome!=='PASS');
 return {schema:'M249_NATURAL_JSEP_SAME_ATTEMPT_COHORT/v1',engine,width,batch,
  genuineProcessCount:trials.length,passed:trials.length-reds.length,
  red:reds.length,originalModelLoadReds:reds.filter(t=>t.outcome==='REAL_MODEL_LOAD_RED').length,
  naturalModelMemoryAccessCategoryObserved:reds.filter(t=>t.nativeMemoryAccessCategoryObserved===true).length,
  originalFailedProcessJsepDirectHashReceipts:reds.filter(t=>t.directOriginalWebkitJsepHash===true).length,
  actualOriginalPositiveOwnerReceipts:trials.filter(t=>t.originalPrivate2DV4Accepted===true).length,
  sourceAndBinaryUnchanged:true,causalPermanentRepairProven:false,
  trials,releaseAuthorized:false,familyAlphaHold:true};
}
