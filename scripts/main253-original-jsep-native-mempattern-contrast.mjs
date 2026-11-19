/**
 * M253 test-only derivation of verified M251 original P94 native JSEP witness.
 * Contrasts the original default/off (both native false) with explicit TRUE.
 * This module NEVER edits public/, WASM, model, original photo, or owner data.
 */
import assert from 'node:assert/strict';

export const M253_PARENT='2ee136d3ee78f5a57554a022efb8ce943b8edf5c';
export const M253_BROWSER_BLOB='887e1e8fa6cc24919450f53612dc6b35b3a1aefe';
export const M253_PROBE_BLOB='c1061567b01ec9f6ceb60c7336d38294d6c3f8a4';
export const M253_CONSUMER_BLOB='d66651b616de54c51eb7ef986324b30f1580888f';
export const M253_JS_GLUE_SHA='08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9';
export const M253_WASM_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const M253_ARMS=Object.freeze(['baseline','pattern_off','pattern_on']);

function replaceExactlyOnce(source,needle,replacement,what){
 assert.equal(typeof source,'string');
 assert.equal(source.split(needle).length,2,'M253 pinned M251 source anchor drift: '+what);
 return source.replace(needle,replacement);
}

export function deriveM253Probe(source){
 let result=replaceExactlyOnce(source,
  "assert.ok(['baseline','pattern_off'].includes(arm));",
  "assert.ok(['baseline','pattern_off','pattern_on'].includes(arm));",
  'native option verifier arm');
 result=replaceExactlyOnce(result,
  'assert.equal(record.memPattern,false,',
  "assert.equal(record.memPattern,arm==='pattern_on'?true:false,",
  'same-process actual native bit assertion');
 assert.ok(result.includes("const result=(e._OrtCreateSessionOptions=K.Ha)(a,b,c,d,f,g,h,l,m,p);"),
  'Original pinned compiled JSEP WASM export forwarding must stay unchanged');
 assert.ok(result.includes('assert.equal(record.handleReturned,true);'));
 assert.ok(result.includes('PINNED_JS='));
 assert.ok(result.includes('PINNED_WASM='));
 return result;
}

export function deriveM253Browser(source){
 let result=replaceExactlyOnce(source,
  "assert.ok(['baseline','pattern_off'].includes(m251Arm),'M251 only default native option or one memory-pattern request');",
  "assert.ok(['baseline','pattern_off','pattern_on'].includes(m251Arm),'M253 real source-only default/off/on comparison');",
  'original P94 option arms');
 const off=String.raw`if(m251Arm==='pattern_off')observedWorker=observedWorker.replace(m251ModelAnchor,
 "from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',session_options:{enableMemPattern:false},progress_callback:");`;
 const on=String.raw`if(m251Arm==='pattern_on')observedWorker=observedWorker.replace(m251ModelAnchor,
 "from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',session_options:{enableMemPattern:true},progress_callback:");`;
 result=replaceExactlyOnce(result,off,off+'\n'+on,'actual original from_pretrained source');
 result=replaceExactlyOnce(result,
  " from './main251-original-jsep-abi-probe.mjs';",
  " from './.m253-native-abi-probe.disposable.mjs';",
  'research-only source ABI verifier dependency');
 const eventLine=String.raw`"   if(parsed?.phase==='m251_native_option'&&m251NativeEvents.length<5)m251NativeEvents.push(parsed);",`;
 const withEvent=String.raw`"   if(parsed?.phase==='m251_native_option'&&m251NativeEvents.length<5){m251NativeEvents.push(parsed);console.log('M253_SAME_ATTEMPT_NATIVE_EVENT '+JSON.stringify(parsed));}",`;
 result=replaceExactlyOnce(result,eventLine,withEvent,
  'capture native flag even if original model later crashes');
 assert.ok(result.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
 assert.ok(result.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'));
 assert.ok(result.includes('assert.equal(gitBlob(originalWorker),ORIGINAL_WORKER_BLOB'));
 assert.equal(result.split('session_options:{enableMemPattern:true}').length,2);
 assert.ok(!result.includes("from './main251-original-jsep-abi-probe.mjs';"));
 return result;
}

function readOne(stdout,marker,max=4096){
 assert.equal(typeof stdout,'string');
 assert.ok(stdout.length<=16*1024*1024,'Unbounded test process output rejected');
 const hits=stdout.split(/\r?\n/).filter(x=>x.startsWith(marker+' '));
 assert.ok(hits.length<=1,'Duplicate or replayed native event: '+marker);
 if(!hits.length)return null;
 const raw=hits[0].slice(marker.length+1);
 assert.ok(raw.length<=max,'Oversized native evidence rejected');
 const parsed=JSON.parse(raw);
 assert.ok(parsed&&typeof parsed==='object'&&!Array.isArray(parsed),'Bad native event');
 return parsed;
}

export function classifyM253SameAttempt({engine,arm,status,signal=null,stdout}){
 assert.ok(['webkit','chromium'].includes(engine),'Only actual browser engines');
 assert.ok(M253_ARMS.includes(arm),'Only precommitted native option arms');
 assert.ok(status===null||Number.isInteger(status),'Only actual process status');
 const expected=arm==='pattern_on'?true:false;
 const event=readOne(stdout,'M253_SAME_ATTEMPT_NATIVE_EVENT');
 const proof=readOne(stdout,'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI');
 const nativeEventValid=event?.phase==='m251_native_option'&&
  event.actualExportCalled===true&&event.argCount===10&&
  event.handleReturned===true&&event.cpuArena===false&&
  typeof event.memPattern==='boolean';
 const nativeBit=nativeEventValid?event.memPattern:null;
 const proofValid=proof?.schema==='M251_ORIGINAL_JSEP_NATIVE_OPTIONS_ABI/v1'&&
  proof.engine===engine&&proof.arm===arm&&proof.realWasmExportInvoked===true&&
  proof.nativeMemPatternFlag===expected&&proof.genuineReturnedOptionsHandle===true&&
  proof.researchOnlyLoaderInstrumentation===true&&
  proof.pinnedOriginalBinaryUnchanged===true&&
  proof.actualNativeCppMemoryPolicyObserved===false&&
  proof.permanentRepairProven===false&&proof.familyAlphaHold===true&&
  proof.releaseAuthorized===false;
 const modelReceipt=stdout.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY ');
 const privacy=stdout.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ');
 const owner=stdout.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ');
 const modelAndOwnerPass=status===0&&!signal&&nativeEventValid&&
  nativeBit===expected&&proofValid&&modelReceipt&&privacy&&owner;
 return {
  schema:'M253_ORIGINAL_JSEP_NATIVE_MEMPATTERN_CONTRAST/v1',
  engine,arm,expectedRequestedNativeBit:expected?1:0,
  actualCompiledWasmExportEventObserved:!!nativeEventValid,
  sameBrowserNativeMemPatternBit:nativeBit===null?null:nativeBit?1:0,
  sameBrowserObservedNativeBitMatchesRequest:nativeEventValid&&nativeBit===expected,
  originalModelBoundaryReceiptObserved:modelReceipt,
  sourceOwnerPrivateTwoDV4ReceiptObserved:owner&&privacy,
  originalFullModelOwnerAndNativePass:!!modelAndOwnerPass,
  originalChildExit:status===0?0:status===null?null:1,
  originalChildSignalPresent:!!signal,
  category:modelAndOwnerPass?'original_native_jsep_and_owner_pass':
    status===null||signal?'original_browser_timeout_or_termination':
    nativeEventValid?'native_export_observed_but_original_model_or_owner_red':
    'native_export_absent_or_ambiguous_original_red',
  originalPinnedJsepWasmSha256:M253_WASM_SHA,
  actualNativeCppAllocatorStateRead:false,
  naturalIntermittentWebkitRepairProven:false,
  causalRepeatedRedBeforeGreenAfterProven:false,
  originalWorkerAndProductUnchanged:true,
  researchOnlyLoaderInstrumentation:true,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
