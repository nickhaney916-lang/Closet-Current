import test from 'node:test';
import assert from 'node:assert/strict';
import {assessNativeFaultReceipt as check,pins}
  from '../research/main1054/m1538-authorized-native-trap-receipt-gate.mjs';
const sha='a'.repeat(40),wid='b'.repeat(64);
const job={
 runId:44999999999,jobId:138888888888,runAttempt:1,firstAttempt:true,
 headSha:sha,engine:'webkit',browserVersion:'26.0',playwrightVersion:'1.56.1',
 workerIdDigest:wid,rendererPid:3901,rendererStartTicks:7733001,
 browserPid:3900,browserStartTicks:7732000,workerCreatedMs:100
};
const worker={
 runId:job.runId,jobId:job.jobId,headSha:sha,workerIdDigest:wid,
 rendererPid:job.rendererPid,rendererStartTicks:job.rendererStartTicks,
 browserPid:job.browserPid,browserStartTicks:job.browserStartTicks,
 sourceGitBlob:pins.workerGitBlob,originalP94:true,
 inspectorFrontendCount:1,workerCreatedMs:100
};
const native={
 runId:job.runId,jobId:job.jobId,headSha:sha,workerIdDigest:wid,
 rendererPid:job.rendererPid,rendererStartTicks:job.rendererStartTicks,
 browserPid:job.browserPid,browserStartTicks:job.browserStartTicks,
 operatorAuthorized:true,captureMethod:'operator-authorized-engine-native-fault',
 origin:'original-ort-create-session',nativeExceptionClass:'wasm-bounds',
 syntheticOnly:false,originalModel:true,actualOrtCreateSessionThrown:true,
 functionIndex:pins.originalFunction,
 jsepWasmSha256:pins.wasmSha256,jsepWasmBytes:pins.wasmBytes,
 generatedGlueSha256:pins.glueSha256,
 modelOnnxSha256:pins.modelSha256,modelByteLength:pins.modelBytes,
 modelPointer:8933688,entryMemoryBytes:24182784,
 faultMonotonicMs:240,workerErrorObservedMs:250,
 trapKind:'wasm-bytecode-offset',wasmFileOffset:7022509,
 nativePc:null,sourceCxxStatement:null,causalFixProven:false,releaseAllowed:false
};
const original=()=>({job:{...job},worker:{...worker},native:{...native}});
const staticProof={verified:true,
 source:'exact-original-wabt-static-disassembly',
 originalWasmSha256:pins.wasmSha256,functionIndex:4846,
 wasmFileOffset:7022509,opcode:'i32.load',kind:'linear-memory-access'
};
const verdict=(x,proof=staticProof)=>check(x,{staticProof:proof});
const assertBlocked=(x,reason)=>{
 const r=verdict(x);assert.equal(r.status,'BLOCKED');
 assert.equal(r.candidate,false);assert.ok(r.blockers.includes(reason));
 assert.equal(r.actualNativeTrapIndependentlyVerified,false);
 assert.equal(r.causalFixProven,false);assert.equal(r.releaseAllowed,false);
 assert.equal(r.originalCxxStatement,null);assert.equal(r.familyAlpha,'HOLD');
};
test('canonical binary/source/runtime identity preserved as immutable pins',()=>{
 assert.equal(pins.wasmBytes,21596019);
 assert.equal(pins.modelBytes,15199746);
 assert.equal(pins.originalRedRun,44640727828);
 assert.equal(pins.staticFunctionStart,7022489);
 assert.equal(pins.staticFunctionEndExclusive,7165245);
});
test('no operator receipt cannot claim original RED or repair',()=>{
 assertBlocked(null,'RECEIPT_ABSENT');
});
test('syntactically perfect proposed WASM offset remains independently unverified',()=>{
 const r=verdict(original());
 assert.equal(r.status,'CANDIDATE_REQUIRES_INDEPENDENT_NATIVE_VERIFICATION');
 assert.equal(r.locationKind,'wasm-bytecode-offset');
 assert.equal(r.wasmFileOffsetCandidate,7022509);
 assert.equal(r.staticOriginalWasmOpcodeCandidate,'i32.load');
 assert.equal(r.originalWasmMemoryOpcodeStaticallyVerified,true);
 assert.equal(r.nativeElfFileOffsetCandidate,null);
 assert.ok(r.blockers.includes('INDEPENDENT_RUN_LOG_PROCESS_BINARY_AND_OPERATOR_ATTESTATION_REQUIRED'));
 assert.equal(r.actualNativeTrapIndependentlyVerified,false);
 assert.equal(r.originalCxxStatement,null);
 assert.equal(r.causalFixProven,false);
});
test('HISTORICAL M279 genuine RED cannot magically gain a new native PC',()=>{
 for(const change of [{runId:pins.originalRedRun},{jobId:pins.originalRedJob}]){
  const x=original();Object.assign(x.job,change);Object.assign(x.worker,change);Object.assign(x.native,change);
  assertBlocked(x,'HISTORIC_RED_CANNOT_GAIN_RETROACTIVE_NATIVE_PC');
 }
});
test('matching Worker ID hash alone cannot join DIFFERENT jobs, runs or SHAs',()=>{
 for(const change of [{jobId:7},{runId:7},{headSha:'c'.repeat(40)}]){
  const x=original();Object.assign(x.native,change);
  assertBlocked(x,'FAULT_AND_RUN_PROCESS_IDENTITY_DIFFER');
 }
});
test('PID recycle and browser renderer ancestry mismatch are blocked',()=>{
 for(const change of [{rendererStartTicks:1},{rendererPid:7},{browserStartTicks:9}]){
  const x=original();Object.assign(x.native,change);
  assertBlocked(x,'FAULT_AND_RUN_PROCESS_IDENTITY_DIFFER');
 }
});
test('same run worker source and Inspector frontend must be exact',()=>{
 for(const change of [{sourceGitBlob:'c'.repeat(40)},{inspectorFrontendCount:2},
   {originalP94:false},{workerCreatedMs:120}]){
  const x=original();Object.assign(x.worker,change);
  assertBlocked(x,'ORIGINAL_WORKER_SOURCE_OR_LIFECYCLE_UNPROVEN');
 }
});
test('wrong JSEP, ONNX or generated-glue digests reject native candidate',()=>{
 for(const change of [{jsepWasmSha256:'c'.repeat(64)},
  {modelOnnxSha256:'d'.repeat(64)},{generatedGlueSha256:'e'.repeat(64)},
  {jsepWasmBytes:48},{modelByteLength:48}]){
  const x=original();Object.assign(x.native,change);
  assertBlocked(x,'ORIGINAL_MODEL_AND_RUNTIME_BYTES_UNATTESTED');
 }
});
test('synthetic trap, absent authorization, wrong native site or class rejects',()=>{
 for(const change of [{syntheticOnly:true},{operatorAuthorized:false},
  {captureMethod:'inspector-js-stack'},{origin:'synthetic-probe'},
  {nativeExceptionClass:'type-error'},{actualOrtCreateSessionThrown:false},
  {functionIndex:0}]){
  const x=original();Object.assign(x.native,change);
  assertBlocked(x,'ORIGINAL_NATIVE_WASM_BOUNDS_FAULT_NOT_PROVEN');
 }
});
test('WASM bytecode candidate must lie WITHIN actual f4846 static function',()=>{
 for(const offset of [0,44,pins.staticFunctionStart-1,pins.staticFunctionEndExclusive,
   pins.wasmBytes+1]){
  const x=original();x.native.wasmFileOffset=offset;
  assertBlocked(x,'ORIGINAL_F4846_OFFSET_NOT_AUTHENTICATED');
 }
});
test('JS Inspector line/column and ELF machine PC must not masquerade as WASM offset',()=>{
 const x=original();x.native.nativePc=12345;
 assertBlocked(x,'ORIGINAL_F4846_OFFSET_NOT_AUTHENTICATED');
 const y=original();y.native.jsInspectorLinePromotedToNativePc=true;
 assertBlocked(y,'UNVERIFIED_SOURCE_OR_REPAIR_PROMOTED');
});
test('actual input pointer range must be within live native entry memory',()=>{
 const x=original();x.native.modelPointer=24000000;
 assertBlocked(x,'ORIGINAL_MODEL_ENTRY_POINTER_OUTSIDE_LIVE_MEMORY');
});
test('wrong event order rejects stale/misordered worker fault',()=>{
 for(const change of [{faultMonotonicMs:99},{workerErrorObservedMs:130}]){
  const x=original();Object.assign(x.native,change);
  assertBlocked(x,'FAULT_WORKER_EVENT_ORDER_UNPROVEN');
 }
});
test('native machine PC translated only within exact ELF mapping / load bias',()=>{
 const x=original();
 x.native.trapKind='native-elf-pc';x.native.nativePc=12345;
 x.native.wasmFileOffset=null;
 x.native.elfMapping={sha256:'c'.repeat(64),buildId:'abcdef0123456789',
  start:12000,endExclusive:13000,fileOffset:3000,fileBytes:80000};
 const r=verdict(x);
 assert.equal(r.status,'CANDIDATE_REQUIRES_INDEPENDENT_NATIVE_VERIFICATION');
 assert.equal(r.nativeElfFileOffsetCandidate,3345);
 assert.equal(r.wasmFileOffsetCandidate,null);
 assert.equal(r.locationKind,'native-elf-pc');
 assert.equal(r.originalCxxStatement,null);
});
test('native ELF mapping refuses bogus build, PC outside range or byte overflow',()=>{
 for(const change of [
  {nativePc:13000},{nativePc:11000},
  {elfMapping:{sha256:'c'.repeat(64),buildId:'not-valid!',start:12000,endExclusive:13000,
   fileOffset:3000,fileBytes:80000}},
  {elfMapping:{sha256:'c'.repeat(64),buildId:'abcdef0123456789',start:12000,
   endExclusive:13000,fileOffset:79999,fileBytes:80000}}
 ]){
  const x=original();x.native.trapKind='native-elf-pc';
  x.native.nativePc=12345;x.native.wasmFileOffset=null;
  x.native.elfMapping={sha256:'c'.repeat(64),buildId:'abcdef0123456789',
   start:12000,endExclusive:13000,fileOffset:3000,fileBytes:80000};
  Object.assign(x.native,change);
  assertBlocked(x,'VERIFIED_ELF_MAPPING_LOAD_BIAS_ABSENT_OR_INVALID');
 }
});
test('fabricated source, claims of repair, sensitive raw data are fail closed',()=>{
 for(const change of [{sourceCxxStatement:'foo.cc:1'},{causalFixProven:true},
   {releaseAllowed:true},{modelWeights:'base64'},{token:'secret'}]){
  const x=original();Object.assign(x.native,change);
  const r=verdict(x);
  assert.equal(r.status,'BLOCKED');assert.equal(r.releaseAllowed,false);
 }
});

test('static function span alone CANNOT admit an arbitrary file byte offset',()=>{
  const x=original();
  assertBlocked(x,'ORIGINAL_F4846_MEMORY_OPCODE_NOT_INDEPENDENTLY_ATTESTED');
  const r=verdict(x,null);
  assert.equal(r.candidate,false);
  assert.ok(r.blockers.includes('ORIGINAL_F4846_MEMORY_OPCODE_NOT_INDEPENDENTLY_ATTESTED'));
});
test('incorrect or manufactured opcode proof is fail closed',()=>{
  const variants=[
    {...staticProof,wasmFileOffset:7022516},
    {...staticProof,originalWasmSha256:'a'.repeat(64)},
    {...staticProof,opcode:'i32.const',kind:'memory-management-nontrapping'},
    {...staticProof,source:'user-self-report'},
    {...staticProof,verified:false},
    {...staticProof,functionIndex:1384},
  ];
  for(const proof of variants){
    const r=verdict(original(),proof);
    assert.equal(r.candidate,false);
    assert.ok(r.blockers.includes('ORIGINAL_F4846_MEMORY_OPCODE_NOT_INDEPENDENTLY_ATTESTED'));
    assert.equal(r.actualNativeTrapIndependentlyVerified,false);
    assert.equal(r.causalFixProven,false);
  }
});
