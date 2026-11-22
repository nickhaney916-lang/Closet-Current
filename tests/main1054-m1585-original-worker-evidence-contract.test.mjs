import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {assessOriginalWorkerBridge as check,validWorkerEventSequence,expectedWorkerEvents,originalPins, classifyOriginalWorkerProfile, classifyPinnedWorkerExceptionPause, classifyPinnedJscFastMemoryDump, classifyPinnedWorkerScriptUrl}
  from '../research/main1054/m1585-original-worker-evidence-contract.mjs';

const sha='a'.repeat(40),digest='b'.repeat(64);
const job={runId:123456,jobId:987654,headSha:sha,workerIdDigest:digest,firstAttempt:true,engine:'webkit'};
const trial={
 schema:'M287_ORIGINAL_NATIVE_SAME_PROCESS_RED_WITNESS_V1',
 engine:'webkit',width:430,firstAttempt:true,
 verdict:'GENUINE_ORIGINAL_NATIVE_WASM_BOUNDS_RED',
 genuineOriginalOrtCreateSessionBoundsRed:true,
 sameFailingProcessOriginalJsepSHA256Attested:true,sameProcessJsepShaVerified:true,
 validNativeModelPointerReceipt:true,originalModelByteLength:15199746,
 exactOriginalWasmInstructionOffset:null,sourceLevelCxxStatement:null,
 actualCausalFixDemonstrated:false,originalRuntimeOrModelChanged:false,
 releaseAllowed:false,familyAlpha:'HOLD'
};
const events=expectedWorkerEvents.map((type,i)=>({type,seq:i+1,monotonicMs:i*10,workerIdDigest:digest}));
const inspector={
 syntheticOnly:false,originalModelExecuted:true,workerSourceIsOriginalP94:true,
 engine:'webkit',browserVersion:'26.0',playwrightVersion:'1.56.1',
 inspectorFrontendCount:1,originalJsepSha256:originalPins.jsepSha256,
 originalModelByteLength:originalPins.modelByteLength,originalModelSha256:originalPins.modelOnnxSha256,
 originalOrtCreateSessionError:'wasm-bounds',workerPauseReason:'exception',
 workerResumeAcknowledged:true,workerRuntimeErrorCaught:true,
 nativeTrapPc:null,wasmFileOffset:null,sourceCxxStatement:null,
 workerIdDigest:digest,events
};
const candidate=()=>check({trial,inspector,trialJob:job,inspectorJob:job});
test('canonical original pins and historic RED remain immutable informational inputs',()=>{
 assert.equal(originalPins.jsepSha256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
 assert.equal(originalPins.modelByteLength,15199746);
 assert.equal(originalPins.modelOnnxSha256,'02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3');
 assert.equal(originalPins.historicalRedRun,44640727828);
});
test('empty evidence stays BLOCKED, never repaired or original RED',()=>{
 const r=check();assert.equal(r.status,'BLOCKED');
 assert.equal(r.originalModelRedObserved,false);assert.equal(r.causalFixProven,false);
 assert.equal(r.releaseAllowed,false);assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.originalModelNativeTrapPc,null);
});
test('contract-shaped fixture is only a verification candidate, NOT evidence',()=>{
 const r=candidate();assert.equal(r.status,'CANDIDATE_REQUIRES_INDEPENDENT_CI_VERIFICATION');
 assert.equal(r.correlatedCandidate,true);assert.equal(r.originalModelRedObserved,false);
 assert.equal(r.originalModelEvidenceIndependentlyVerified,false);
 assert.equal(r.originalModelExecutedByThisTool,false);
 assert.equal(r.originalModelWasmFileOffset,null);
 assert.deepEqual(r.blockers,['INDEPENDENT_SOURCE_AND_JOB_LOG_VERIFICATION_REQUIRED']);
});
test('existing synthetic WebKit Inspector success NEVER establishes original-model RED',()=>{
 const r=check({trial,inspector:{...inspector,syntheticOnly:true,originalModelExecuted:false,workerSourceIsOriginalP94:false},trialJob:job,inspectorJob:job});
 assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('INSPECTOR_NOT_ORIGINAL_P94_MODEL'));
 assert.equal(r.originalModelRedObserved,false);
});
test('healthy original M287 cohorts cannot become fault receipts',()=>{
 const r=check({trial:{...trial,verdict:'ORIGINAL_MODEL_POSITIVE',genuineOriginalOrtCreateSessionBoundsRed:false},inspector,trialJob:job,inspectorJob:job});
 assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('ORIGINAL_NATIVE_RED_NOT_OBSERVED'));
});
test('different workflow run, job, commit, or Worker ID cannot be correlated',()=>{
 for (const changed of [{runId:321},{jobId:876},{headSha:'d'.repeat(40)},{workerIdDigest:'e'.repeat(64)}]) {
  const r=check({trial,inspector,trialJob:job,inspectorJob:{...job,...changed}});
  assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('EXACT_SAME_JOB_WORKER_AND_SOURCE_NOT_PROVEN'));
 }
});
test('Worker events must be actual nested Inspector lifecycle in strict order',()=>{
 assert.equal(validWorkerEventSequence(events,digest),true);
 for(const altered of [
  events.slice(1),
  events.map((e,i)=>i===4?{...e,type:'Target.targetCreated'}:e),
  events.map((e,i)=>i===7?{...e,seq:3}:e),
  events.map((e,i)=>i===7?{...e,workerIdDigest:'f'.repeat(64)}:e),
  events.map((e,i)=>i===7?{...e,monotonicMs:1}:e)
 ])assert.equal(validWorkerEventSequence(altered,digest),false);
});
test('JS Inspector source locations cannot be promoted into native PC, WASM offset, or C++ source',()=>{
 for(const change of [{nativeTrapPc:44},{wasmFileOffset:7022489},{sourceCxxStatement:'unsafe.cc:12'}]){
  const r=check({trial,inspector:{...inspector,...change},trialJob:job,inspectorJob:job});
  assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('UNVERIFIED_NATIVE_LOCATION_PROMOTED'));
 }
});
test('wrong JSEP hash, wrong original model bytes, second frontend, unknown Worker do not pass',()=>{
 for(const change of [{originalJsepSha256:'0'.repeat(64)},{originalModelSha256:'c'.repeat(64)},{originalModelByteLength:48},{inspectorFrontendCount:2},{workerIdDigest:'z'.repeat(64)}]){
  const r=check({trial,inspector:{...inspector,...change},trialJob:job,inspectorJob:job});
  assert.equal(r.status,'BLOCKED');
 }
});
test('bad original trial source or claimed repair rejects without unsafe inference',()=>{
 const r=check({trial:{...trial,actualCausalFixDemonstrated:true},inspector,trialJob:job,inspectorJob:job});
 assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('M287_TRIAL_INVALID'));
 assert.equal(r.releaseAllowed,false);
});


const originalControl={
 engine:'webkit',originalFirstAttempt:true,workerSourceIsOriginalP94:true,
 inspectorFrontendCount:1,originalWorkerCreated:true,workerInitialized:true,
 publicJpegSubmitted:true,workerTerminal:'done',
 nativeTrapPc:null,wasmFileOffset:null,originalModelRedObserved:false,
 causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD',
 workerProfile:'no-js-proxy',instrumentedWorkerForAttribution:false,
 workerAttestationProbeArmed:false,originalModelWeightsShaVerified:false,
 sameProcessOriginalJsepShaVerified:false,originalModelExecutedAndVerified:false
};
test('real no-JS-proxy original Worker control cannot claim independent in-process model SHA',()=>{
 const result=classifyOriginalWorkerProfile(originalControl);
 assert.equal(result.status,'HEALTHY_NO_JS_PROXY_UNATTESTED');
 assert.equal(result.originalNativeRedAttributed,false);
 assert.equal(result.nativeTrapPc,null);
 assert.equal(result.causalFixProven,false);
 assert.equal(result.releaseAllowed,false);
});
test('no-JS-proxy controls reject invented instrumentation or original model proof',()=>{
 for (const fake of [
  {workerAttestationProbeArmed:true},
  {instrumentedWorkerForAttribution:true},
  {originalModelWeightsShaVerified:true},
  {sameProcessOriginalJsepShaVerified:true},
  {originalModelExecutedAndVerified:true}
 ]) {
  const result=classifyOriginalWorkerProfile({...originalControl,...fake});
  assert.equal(result.status,'BLOCKED');
  assert.equal(result.reason,'NO_PROXY_FALSE_MODEL_ATTESTATION');
 }
});
test('instrumented original model requires both pinned same-Worker SHA digests',()=>{
 const inst={...originalControl,workerProfile:'instrumented',
  instrumentedWorkerForAttribution:true,workerAttestationProbeArmed:true,
  originalModelWeightsShaVerified:true,sameProcessOriginalJsepShaVerified:true,
  originalModelExecutedAndVerified:true,
  sameWorkerJsepInstantiatedSha256:originalPins.jsepSha256,
  sameWorkerModelCopySha256:originalPins.modelOnnxSha256};
 const ok=classifyOriginalWorkerProfile(inst);
 assert.equal(ok.status,'HEALTHY_INSTRUMENTED_PROVENANCE_ATTESTED');
 assert.equal(ok.originalNativeRedAttributed,false);
 for(const drift of [
  {sameWorkerJsepInstantiatedSha256:'0'.repeat(64)},
  {sameWorkerModelCopySha256:'0'.repeat(64)},
  {originalModelWeightsShaVerified:false},
  {workerAttestationProbeArmed:false}
 ])assert.equal(classifyOriginalWorkerProfile({...inst,...drift}).status,'BLOCKED');
});
test('generic original Worker error does not become original OrtCreateSession bounds RED',()=>{
 for(const workerProfile of ['no-js-proxy','instrumented']){
  const r=classifyOriginalWorkerProfile({...originalControl,workerProfile,workerTerminal:'error'});
  assert.equal(r.status,'ERROR_UNATTRIBUTED');
  assert.equal(r.originalNativeRedAttributed,false);
  assert.equal(r.causalFixProven,false);
 }
});
test('reject unpinned source, second Inspector, fabricated trap PC and release',()=>{
 for(const drift of [
  {workerSourceIsOriginalP94:false},
  {originalFirstAttempt:false},
  {inspectorFrontendCount:2},
  {nativeTrapPc:44},
  {wasmFileOffset:7022489},
  {originalModelRedObserved:true},
  {releaseAllowed:true}
 ])assert.equal(classifyOriginalWorkerProfile({...originalControl,...drift}).status,'BLOCKED');
});
test('CI runs four fresh first-attempt controls per profile without native changes',()=>{
 const workflow=readFileSync('.github/workflows/main1054-m1585-authentic-original-p94-webkit-HOLD.yml','utf8');
 const script=readFileSync('research/main1054/m1585-original-p94-standalone-webkit.mjs','utf8');
 assert.match(workflow,/profile: \[instrumented, no-js-proxy\]/);
 assert.match(workflow,/ordinal: \[1, 2, 3, 4\]/);
 assert.match(workflow,/M1585_WORKER_PROFILE: \$\{\{ matrix.profile \}\}/);
 assert.match(script,/if\(workerProfile==='instrumented'\)\{\s*const installed=/);
 assert.match(script,/if\(workerProfile==='instrumented'\)\{\s*for\(let i=0;i<36/);
 assert.match(script,/ORIGINAL_WORKER_DONE_NO_JS_PROXY_UNATTESTED/);
 assert.match(script,/if\(receipt.workerTerminal==='error'\)/);
});


test('pinned WebKit RemoteObject identifies wasm-bounds text but never native trap PC',()=>{
 const event={method:'Debugger.paused',params:{reason:'exception',data:{
  type:'object',subtype:'error',className:'RuntimeError',
  description:'RuntimeError: memory access out of bounds'}}};
 const r=classifyPinnedWorkerExceptionPause(event);
 assert.equal(r.state,'WASM_BOUNDS_MESSAGE_UNATTRIBUTED');
 assert.equal(r.observedWebAssemblyRuntimeError,true);
 assert.equal(r.wasmBoundsMessageObserved,true);
 assert.equal(r.originalOrtCreateSessionAttribution,false);
 assert.equal(r.originalNativeRedObserved,false);
 assert.equal(r.nativeTrapPc,null);
 assert.equal(r.wasmFileOffset,null);
 assert.equal(r.causalFixProven,false);
 assert.equal(r.releaseAllowed,false);
 assert.equal('description' in r,false);
 assert.equal('objectId' in r,false);
});
test('inspector exception reason without actual remote-object subtype cannot assert wasm-bounds',()=>{
 for(const input of [
  null,
  {},
  {method:'Debugger.paused',params:{reason:'other'}},
  {method:'Debugger.paused',params:{reason:'exception'}},
  {method:'Debugger.paused',params:{reason:'exception',data:{type:'string',value:'RuntimeError: memory access out of bounds'}}},
  {method:'Debugger.paused',params:{reason:'exception',data:{type:'object',subtype:'array',className:'RuntimeError',description:'memory access out of bounds'}}}
 ]) {
  const r=classifyPinnedWorkerExceptionPause(input);
  assert.equal(r.wasmBoundsMessageObserved,false);
  assert.equal(r.originalNativeRedObserved,false);
 }
});

test('genuine Worker pause envelope stages are distinguishable without leaking thrown data',()=>{
 const secret='do-not-publish-owner-exception';
 for(const [data,state] of [
  [undefined,'THROWN_PAUSE_DATA_ABSENT'],
  [null,'THROWN_PAUSE_DATA_ABSENT'],
  [secret,'THROWN_PAUSE_DATA_MALFORMED'],
  [[secret],'THROWN_PAUSE_DATA_MALFORMED'],
  [{type:'string',value:secret},'THROWN_REMOTE_VALUE_NONOBJECT'],
  [{type:'object',className:secret,description:secret},'THROWN_REMOTE_ERROR_SUBTYPE_ABSENT'],
  [{type:'object',subtype:'array',description:secret},'THROWN_REMOTE_NONERROR_SUBTYPE']
 ]) {
  const r=classifyPinnedWorkerExceptionPause({method:'Debugger.paused',params:{
   reason:'exception',data}});
  assert.equal(r.state,state);
  assert.equal(r.originalNativeRedObserved,false);
  assert.equal(r.nativeTrapPc,null);
  assert.equal(r.wasmFileOffset,null);
  assert.equal(r.causalFixProven,false);
  assert.equal(r.familyAlpha,'HOLD');
  assert.ok(!JSON.stringify(r).includes(secret));
 }
});
test('original Worker only counts fixed exception categories without logging original throws',()=>{
 const script=readFileSync('research/main1054/m1585-original-p94-standalone-webkit.mjs','utf8');
 assert.match(script,/workerThrownObjectCategoryCounts:\{\}/);
 assert.match(script,/receipt\.workerThrownObjectCategoryCounts\[classified\.state\]/);
 assert.match(script,/receipt\.workerThrownObjectCategories\.length<5/);
 assert.match(script,/if\(receipt\.workerTerminal==='error'\)/);
});
test('runtime error class alone or non-native errors cannot be relabeled original OrtCreateSession bounds',()=>{
 for(const event of [
  {className:'RuntimeError',description:'RuntimeError: unreachable'},
  {className:'TypeError',description:'memory access out of bounds'},
  {className:'Error',description:'RuntimeError: memory access out of bounds'}
 ]) {
  const r=classifyPinnedWorkerExceptionPause({method:'Debugger.paused',params:{
   reason:'exception',data:{type:'object',subtype:'error',...event}}});
  assert.equal(r.wasmBoundsMessageObserved,false);
  assert.equal(r.originalOrtCreateSessionAttribution,false);
 }
});
test('inspector pause description never leaves source-attested bounded classification',()=>{
 const leak='secret-token-should-not-be-in-output';
 const r=classifyPinnedWorkerExceptionPause({method:'Debugger.paused',params:{
  reason:'exception',data:{type:'object',subtype:'error',className:'RuntimeError',
   objectId:'secret-object-id',description:'RuntimeError: memory access out of bounds '+leak,
   preview:{properties:[{value:'private-source-jpeg'}]}}}});
 assert.equal(r.wasmBoundsMessageObserved,true);
 assert.ok(!JSON.stringify(r).includes(leak));
 assert.ok(!JSON.stringify(r).includes('secret-object-id'));
 assert.ok(!JSON.stringify(r).includes('private-source-jpeg'));
 assert.equal(r.familyAlpha,'HOLD');
});
test('oversized or absent thrown object descriptions fail closed',()=>{
 for(const d of [null,undefined,'x'.repeat(4097)]){
  const r=classifyPinnedWorkerExceptionPause({method:'Debugger.paused',params:{
   reason:'exception',data:{type:'object',subtype:'error',className:'RuntimeError',description:d}}});
  assert.equal(r.state,'ERROR_CLASS_OR_DESCRIPTION_UNAVAILABLE');
  assert.equal(r.wasmBoundsMessageObserved,false);
 }
});
test('genuine Worker diagnostics expose only sanitized classifications, never promote source offsets',()=>{
 const src=readFileSync('research/main1054/m1585-original-p94-standalone-webkit.mjs','utf8');
 assert.match(src,/classifyPinnedWorkerExceptionPause\(w\)/);
 assert.match(src,/workerNativeBoundsTextPauseCount/);
 assert.match(src,/workerThrownValueIsNativePc:false/);
 assert.match(src,/receipt.workerPauseEventWorkerDigest!==receipt.workerIdDigest/);
});



test('pinned WebKit scriptParsed exact-source URL classification fails closed on spoofed origins',()=>{
 const classify=classifyPinnedWorkerScriptUrl;
 assert.equal(classify('http://127.0.0.1:41234/public/outfit-worker-p94.mjs'),
  'ORIGINAL_P94_WORKER_SCRIPT');
 assert.equal(classify('http://127.0.0.1:41234/public/outfit-segmentation.mjs'),
  'LOCAL_P94_SUPPORT_SCRIPT');
 assert.equal(classify('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js'),
  'PINNED_TRANSFORMERS_3_8_1_SCRIPT');
 const token='private-token-must-not-escape';
 for(const url of [
  undefined, null, token, 'http://example.com/public/outfit-worker-p94.mjs',
  'http://127.0.0.1:41234/public/outfit-worker-p94.mjs?secret='+token,
  'http://127.0.0.1:41234/public/outfit-worker-p94.mjs#token',
  'http://127.0.0.1.evil.com:41234/public/outfit-worker-p94.mjs',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.2/dist/transformers.min.js',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js?token='+token,
  'x'.repeat(2049)
 ]) {
  const result=classify(url);
  assert.ok(['SCRIPT_URL_UNVERIFIED','OTHER_OR_UNKNOWN_SCRIPT'].includes(result));
  assert.ok(!result.includes(token));
 }
});
test('genuine original Worker maps only script IDs held transiently and does not emit URLs',()=>{
 const source=readFileSync('research/main1054/m1585-original-p94-standalone-webkit.mjs','utf8');
 assert.match(source,/w\.method==='Debugger\.scriptParsed'/);
 assert.match(source,/workerScriptOrigins\.set\(id,classifyPinnedWorkerScriptUrl\(w\.params\?\.url\)\)/);
 assert.match(source,/workerPauseTopFrameOriginCounts:\{\}/);
 assert.match(source,/origin\]\=\s*\(receipt\.workerPauseTopFrameOriginCounts\[origin\]\|\|0\)\+1/);
 assert.match(source,/nativePc:false,wasmFileOffset:null/);
 assert.match(source,/if\(receipt\.workerTerminal==='error'\)/);
});
test('pinned JSC dump exposes source-supported fast-memory config, not true allocation/tier',()=>{
 for(const [str,expected] of [
  ['All JSC options:\n   dumpOptions=2\n   useWasmFastMemory=true\n   useBBQJIT=true\n', 'true'],
  ['All JSC options:\n   useWasmFastMemory=false (default: true)\n', 'false']
 ]) {
  const r=classifyPinnedJscFastMemoryDump(str);
  assert.equal(r.observed,true);
  assert.equal(r.option,expected);
  assert.equal(r.allocationModeProven,false);
  assert.equal(r.nativeTrapPc,null);
  assert.equal(r.releaseAllowed,false);
  assert.equal(JSON.stringify(r).includes('useBBQJIT'),false);
 }
});
test('JSC logs missing, mixed or spoofed are NOT credited as mode observations',()=>{
 for(const str of [
  '',
  'useWasmFastMemory=false',
  'Modified JSC options:\n useWasmFastMemory=false',
  'All JSC options:\n useWasmFastMemory=true\n useWasmFastMemory=false\n',
  'All JSC options:\n useWasmFastMemory=surprise\n',
  'All JSC options:\n useWasmFastMemory=false\n'+'X'.repeat(512001)
 ]) {
  const r=classifyPinnedJscFastMemoryDump(str);
  assert.equal(r.option,null);
  assert.equal(r.allocationModeProven,false);
 }
});
test('JSC original Worker A/B is only a pinned browser subprocess option, not a sandbox/permission edit',()=>{
 const script=readFileSync('research/main1054/m1585-original-p94-standalone-webkit.mjs','utf8');
 const workflow=readFileSync('.github/workflows/main1054-m1585-authentic-original-p94-webkit-HOLD.yml','utf8');
 assert.match(script,/JSC_useWasmFastMemory='false'/);
 assert.match(script,/JSC_dumpOptions='2'/);
 assert.match(script,/classifyPinnedJscFastMemoryDump\(jscOptionDump\)/);
 assert.match(script,/jscNativeAllocationModeProven:false/);
 assert.match(script,/jscWasmJitCodeOriginProven:false/);
 assert.match(script,/receipt.jscFastMemoryOption!==/);
 assert.match(workflow,/jsc_mode: \[default, explicit-bounds\]/);
 assert.match(workflow,/profile: \[instrumented, no-js-proxy\]/);
 assert.match(workflow,/ordinal: \[1, 2, 3, 4\]/);
 assert.match(workflow,/M1585_JSC_MEMORY_MODE: \$\{\{ matrix.jsc_mode \}\}/);
 assert.doesNotMatch(workflow,/privileged:|SYS_PTRACE|seccomp=unconfined|--cap-add|--security-opt/);
});
test('JSC bounds-check strategy never promotes a healthy model run to original repaired RED',()=>{
 for(const option of ['true','false']){
  const r=classifyPinnedJscFastMemoryDump('All JSC options:\n  useWasmFastMemory='+option+'\n');
  assert.equal(r.nativeTrapPc,null);
  assert.equal(r.releaseAllowed,false);
 }
});
