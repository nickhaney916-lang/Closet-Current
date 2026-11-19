/**
 * M248 independently fresh original P94 JSEP WebKit / Chromium source-owner
 * sample classifier. Never aggregate genuine RED into a successful rerun.
 * This is read-only research: no model, source, Worker, allocator or auth edits.
 */
import assert from 'node:assert/strict';
import {ORIGINAL_JSEP_SHA,ORIGINAL_JSEP_NAME} from './main247-original-jsep-phase-evidence.mjs';
export const ORIGINAL_FIXTURE_SHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const MARKER=/^[A-Z][A-Z0-9_]{7,80}$/;
const CLASS=new Set(['Error','TypeError','RangeError','RuntimeError','AbortError','NetworkError','CompileError','LinkError','AggregateError','other']);
const CODE=new Set(['memory_allocation','wasm_memory_access','wasm_compile','wasm_link','ort_session','cache_storage','network_stream','wasm_runtime','model_graph','resource','other']);
const PHASE=new Set(['module_import','processor_load','model_session_load','first_inference','wasm_instantiateStreaming','wasm_instantiate','wasm_compile','wasm_compileStreaming']);
const finite=(n,max)=>Number.isFinite(n)&&n>=0&&n<=max?Math.round(n):null;
export function singleOriginalReceipt(stdout,marker){
 assert.ok(MARKER.test(marker),'Only explicit bounded research receipt markers permitted');
 assert.ok(typeof stdout==='string'&&stdout.length<=32*1024*1024,'Original child log unavailable/oversized');
 const rows=stdout.split(/\r?\n/).filter(x=>x.startsWith(marker+' '));
 assert.ok(rows.length<=1,'Repeated original receipt '+marker+' cannot be evidence');
 if(rows.length===0)return null;
 const raw=rows[0].slice(marker.length+1);
 assert.ok(raw.length<=64000,'Original receipt oversized');
 const parsed=JSON.parse(raw);
 assert.ok(parsed&&typeof parsed==='object'&&!Array.isArray(parsed),'Malformed original receipt');
 return parsed;
}
export function classifyFreshOriginalAttempt({engine,width,shard,attempt,exitCode,signal,timedOut,stdout}){
 assert.ok(['webkit','chromium'].includes(engine),'Unexpected native engine');
 assert.ok([320,390,430].includes(width),'Unexpected mobile width');
 assert.ok(Number.isInteger(shard)&&shard>=0&&shard<10);
 assert.ok(Number.isInteger(attempt)&&attempt>=1&&attempt<=8);
 const trace=singleOriginalReceipt(stdout,'M247_REAL_ORIGINAL_JSEP_PHASE');
 const owner=singleOriginalReceipt(stdout,'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS');
 const privacy=singleOriginalReceipt(stdout,'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY');
 const worker=singleOriginalReceipt(stdout,'M214_REAL_P94_WORKER_OUTCOME');
 const authentic=!!(trace&&worker&&
   trace.engine===engine&&trace.width===width&&trace.originalWorkerSeen===true&&
   trace.originalModelAttempted===true&&worker.engine===engine&&worker.width===width);
 const stages=Array.isArray(trace?.phases)?trace.phases:[];
 const terminal=stages.filter(s=>s?.phase==='model_session_load').at(-1)||null;
 const inference=stages.filter(s=>s?.phase==='first_inference'&&s.outcome==='ok').at(-1)||null;
 const originalRuntime=trace?.originalJsepWasmHttp200===true&&
   trace?.originalJsepBinaryName===ORIGINAL_JSEP_NAME;
 const webkitWasmDirectVerified=trace?.originalJsepWasmResponseBodySHA256Verified===true&&
   trace?.originalJsepDirectBrowserBinarySHA256===ORIGINAL_JSEP_SHA;
 const observedByteIdentity=engine==='webkit'?webkitWasmDirectVerified:originalRuntime;
 const safeOwner=owner?.engine===engine&&owner?.modelExecuted===true&&
   owner?.manualSyntheticOwnerConfirmed===true&&owner?.ownerPrivateSaved===1&&
   owner?.exactOriginalSHA256===ORIGINAL_FIXTURE_SHA&&
   owner?.tamperDenied===true&&owner?.otherOwnerDenied===true&&
   owner?.cancelledRestoreUnchanged===true&&owner?.atomicRestore===true&&
   owner?.actualV4BrowserDownload===true&&owner?.hostedRLS===false&&
   owner?.releaseAuthorized===false;
 const safePrivacy=privacy?.engine===engine&&privacy?.realWorkerFirst===true&&
   privacy?.explicitOwnerASave===1&&privacy?.ownerBPrivateRows===0&&
   privacy?.ownerAOriginalNotVisibleToB===true&&
   privacy?.ownerAOutfitNotVisibleToB===true&&privacy?.localIndexedDBOnly===true&&
   privacy?.hostedRLS===false&&privacy?.releaseAllowed===false;
 const originalModelPositive=authentic&&trace.originalModelCards>0&&trace.originalModelCards<=12&&
   trace.intentionalModelNetworkFailure===false&&
   terminal?.outcome==='ok'&&!!inference&&trace.firstInferenceStarted===true&&
   trace.nativeInstantiationSucceeded===true&&originalRuntime;
 const passed=exitCode===0&&!timedOut&&originalModelPositive&&observedByteIdentity&&safeOwner&&safePrivacy;
 const naturalWasmSessionMemoryFault=exitCode!==0&&authentic&&
   originalRuntime&&trace.genuineOriginalPostWasmSessionMemoryFaultWitness===true&&
   terminal?.outcome==='error'&&terminal?.errorName==='RuntimeError'&&
   terminal?.messageCode==='wasm_memory_access'&&trace.firstInferenceStarted===false;
 const category=passed?'genuine_original_positive':
   naturalWasmSessionMemoryFault?'original_webkit_post_wasm_memory_access':
   timedOut?'no_terminal_timeout':
   !authentic?'missing_source_bound_worker_evidence':
   !originalRuntime?'original_jsep_network_or_binary_missing':
   !originalModelPositive?'original_model_session_or_inference_red':
   !safeOwner||!safePrivacy?'original_owner_privacy_backup_red':
   'original_runtime_identity_or_subprocess_red';
 return {
  schema:'M248_INDEPENDENT_ORIGINAL_JSEP_ATTEMPT/v1',
  engine,width,shard,attempt,
  freshBrowserProcess:true,originalPinnedPhotoModelWorker:true,
  passed,category,childExitedZero:exitCode===0,timedOut:!!timedOut,
  terminatedBySignal:typeof signal==='string'&&signal.length>0,
  actualOriginalJsepHTTP200:!!originalRuntime,
  directOriginalWebkitJsepSha256Verified:engine==='webkit'&&webkitWasmDirectVerified,
  chromiumActualWasmBytesNotClaimed:engine==='chromium',
  originalNativeSessionOutcome:terminal?.outcome||'missing',
  originalNativeSessionErrorName:CLASS.has(terminal?.errorName)?terminal.errorName:null,
  originalNativeSessionErrorCode:CODE.has(terminal?.messageCode)?terminal.messageCode:null,
  originalWebAssemblyInitializationSucceeded:trace?.nativeInstantiationSucceeded===true,
  originalFirstInferenceSucceeded:!!inference,
  originalModelUnverifiedProposals:finite(trace?.originalModelCards,12),
  originalModelSessionElapsedMs:finite(terminal?.elapsedMs,600000),
  firstInferenceElapsedMs:finite(inference?.elapsedMs,600000),
  ownerOriginalSourcePrivate2DV4Verified:!!safeOwner,
  independentSyntheticOwnerIsolationVerified:!!safePrivacy,
  genuineOriginalNativeMemoryFaultWitness:naturalWasmSessionMemoryFault,
  observedJsepCAllocatorInternalState:false,
  originalMemoryRepairProven:false,
  deviceSafariAndroidVerified:false,hostedSignedRlsVerified:false,
  sourcePhoto3DOutfitAccepted:false,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
export function nearestRank(values,fraction){
 assert.ok(fraction>0&&fraction<=1);
 const n=values.filter(x=>Number.isFinite(x)&&x>=0).slice().sort((a,b)=>a-b);
 return n.length?n[Math.max(0,Math.ceil(n.length*fraction)-1)]:null;
}
export function summarizeIndependentShard(results,{engine,width,shard,expected}){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok([320,390,430].includes(width));
 assert.ok(Number.isInteger(expected)&&expected>=1&&expected<=8);
 assert.equal(results.length,expected,'Every independently fresh process must have a terminal receipt');
 assert.ok(results.every((r,i)=>r&&r.schema==='M248_INDEPENDENT_ORIGINAL_JSEP_ATTEMPT/v1'&&
   r.engine===engine&&r.width===width&&r.shard===shard&&r.attempt===i+1),
   'Original sample order, width and provenance must be exact');
 const pass=results.filter(x=>x.passed);
 const fail=results.filter(x=>!x.passed);
 const native=results.filter(x=>x.genuineOriginalNativeMemoryFaultWitness);
 return {
  schema:'M248_FIXED_FRESH_JSEP_SAMPLE_SHARD/v1',engine,width,shard,
  expectedFreshProcesses:expected,actualFreshProcesses:results.length,
  genuinePositiveJourneys:pass.length,genuineFailures:fail.length,
  naturalPostWasmMemoryFaultWitnesses:native.length,
  failureCategories:fail.map(x=>x.category),
  modelSessionMsP50PassingOnly:nearestRank(pass.map(x=>x.originalModelSessionElapsedMs),0.5),
  modelSessionMsP95PassingOnly:nearestRank(pass.map(x=>x.originalModelSessionElapsedMs),0.95),
  firstInferenceMsP50PassingOnly:nearestRank(pass.map(x=>x.firstInferenceElapsedMs),0.5),
  firstInferenceMsP95PassingOnly:nearestRank(pass.map(x=>x.firstInferenceElapsedMs),0.95),
  latencySampleSize:pass.length,latencyPopulation:'passed_original_browser_sessions_only',
  allPass:fail.length===0,
  originalCausalRepairNotProven:true,
  neverRetryOrDropGenuineRed:true,
  originalInstalledWorkerAndOwnerUnmodified:true,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
