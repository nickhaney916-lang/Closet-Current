import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceGate,branch,parent,additions,legacyNativeRed,noWitnessReceipt,
 adjudicateReceipt,classifyUntrustedOperatorOffset}
 from '../research/main1054/m292-original-native-pc-evidence-handoff.mjs';
import {originalBinary,mapModule,originalFailure} from '../research/main1054/m280-original-jsep-function-map.mjs';

const fakeSHA='a'.repeat(40);
const event={name:'push',ref:branch,sha:fakeSHA,attempt:'1'};
const frozen=Object.freeze({
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m290-live-native-elf-identity.mjs':'5d395b06ad76750d1d0a709daab9cfd49e88cc6e',
 'research/main1054/m291-loaded-wpe-elf-closure.mjs':'1ff7f5553b2cadbc43bea6118df40e1125c021c4'
});
const git=(cmd,...args)=>{
 if(cmd==='rev-parse')return args[0]==='HEAD'?fakeSHA:
  frozen[args[0].slice(fakeSHA.length+1)]||'NOT-PINNED';
 if(cmd==='merge-base')return '';
 if(cmd==='diff-tree')return additions.map(p=>'A\u0000'+p+'\u0000').join('');
 if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unrecognized CI stub command');
};
test('genuine original M279 failure is immutable and still not natively attributed',()=>{
 assert.equal(parent,'6adeffeb82557a365d42237fca47b042368d6d4e');
 assert.deepEqual(legacyNativeRed().functionIndices,[4846,1384,11276,7427]);
 assert.equal(legacyNativeRed().originalModelLength,15199746);
 assert.equal(legacyNativeRed().actualOriginalInstructionOffset,null);
 assert.equal(legacyNativeRed().lastAttestedJsepInOldFailingProcess,false);
 assert.equal(originalBinary.sha256,
  'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
 assert.equal(originalBinary.bytes,21596019);
});
test('M292 only adds three diagnostic files on exact M291 original source',()=>{
 assert.deepEqual(sourceGate(git,event),{
  originalRuntimeUnmodified:true,priorGenuineFailureRetained:true,
  actualNativeTrapPC:null,causalFixProven:false,familyAlpha:'HOLD'
 });
 assert.equal(additions.length,3);
});
test('wrong CI event, rerun, modified worker, path injection and symlink fail closed',()=>{
 for(const delta of [{attempt:'2'},{name:'pull_request_target'},
  {ref:'refs/heads/main'},{sha:'f'.repeat(40)},{sha:''}])
  assert.throws(()=>sourceGate(git,{...event,...delta}),/M292 FAIL-CLOSED/);
 const substitute=(cmd,result)=>(...args)=>args[0]===cmd?result:git(...args);
 assert.throws(()=>sourceGate(substitute('merge-base','bad'),event),/ancestry/);
 assert.throws(()=>sourceGate(substitute('diff-tree',
  'M\u0000public/outfit-worker-p94.mjs\u0000'),event),/modified protected/);
 assert.throws(()=>sourceGate(substitute('ls-tree','120000 blob symlink'),event),/non-symlink/);
 assert.throws(()=>sourceGate((...args)=>args[0]==='rev-parse'&&
  args[1]===fakeSHA+':public/outfit-worker-p94.mjs'?'f'.repeat(40):
  git(...args),event),/protected original/);
});
test('not having a new debugger witness gives a truthful blocked receipt',()=>{
 const r=adjudicateReceipt(noWitnessReceipt());
 assert.equal(r.kind,'NO_NEW_NATIVE_WITNESS');
 assert.equal(r.actualTrapPC,null);
 assert.equal(r.causalRepairProven,false);
 assert.equal(r.candidateVerifiedAgainstOriginalWasm,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('old historical RED metadata cannot be overwritten or relabeled as current native PC',()=>{
 const base=noWitnessReceipt();
 for(const delta of [
  {actualTrapPC:7022509},{nativeCxxSourceLocation:'native source'},
  {inspectedOriginalModel:true},{causalRepairProven:true},
  {independentSameFailingProcessNativeAttribution:true},
  {familyAlpha:'RELEASED'},{releaseAuthorized:true},
  {originalWasmSHA256:'0'.repeat(64)},
  {historicalRealRed:{...base.historicalRealRed,actualOriginalInstructionOffset:44}},
  {historicalRealRed:{...base.historicalRealRed,runId:1}},
  {kind:'ORIGINAL_REPAIR_COMPLETE'},{staticCandidateOpcode:'0x28'}
 ]) assert.throws(()=>adjudicateReceipt({...base,...delta}),/M292 FAIL-CLOSED/);
});
test('operator input never becomes a native trap, even with plausible scalar opcode',()=>{
 const candidate={provenance:'UNTRUSTED_OPERATOR_INPUT',
  wasmFunctionIndex:4846,moduleFileOffset:7022509,opcodeByte:0x28};
 const invalids=[
  {provenance:'NATIVE_TRAP_PC_PROVEN'},
  {wasmFunctionIndex:4847},{moduleFileOffset:-1},
  {moduleFileOffset:originalBinary.bytes},{opcodeByte:300},
  {unexpectedPrivateAddress:'0x12345678'}
 ];
 for(const patch of invalids)assert.throws(()=>
  classifyUntrustedOperatorOffset(new Uint8Array(8),{...candidate,...patch}),
  /M292 FAIL-CLOSED/);
 assert.throws(()=>classifyUntrustedOperatorOffset(new Uint8Array(8),candidate),
  /M292 FAIL-CLOSED: input is not the full original/);
});
test('candidate receipt cannot be upgraded without the source binding',()=>{
 const base=noWitnessReceipt();
 const fake={...base,kind:'UNTRUSTED_OPERATOR_STATIC_OFFSET_CANDIDATE',
  staticCandidateOpcode:'0x28',staticCandidateFunctionIndex:4846,
  candidateVerifiedAgainstOriginalWasm:true};
 assert.equal(adjudicateReceipt(fake).actualTrapPC,null);
 for(const delta of [{candidateVerifiedAgainstOriginalWasm:false},
  {staticCandidateFunctionIndex:9999},{actualTrapPC:7022509},
  {nativeCxxSourceLocation:'OrtCreateSession.cpp'}])
  assert.throws(()=>adjudicateReceipt({...fake,...delta}),/M292 FAIL-CLOSED/);
});
test('no raw debugger address, personal model or original photo is consumed by no-witness gate',()=>{
 const r=noWitnessReceipt();
 const serialized=JSON.stringify(r);
 assert.ok(!serialized.includes('/proc/'));
 assert.ok(!serialized.includes('password'));
 assert.ok(!serialized.includes('modelBuffer'));
 assert.equal(r.releaseAuthorized,false);
});

if(process.env.M292_ORIGINAL_WASM_PATH){
 test('positive operator-supplied candidate mapped to REAL original bytes remains UNTRUSTED',()=>{
  const bytes=readFileSync(process.env.M292_ORIGINAL_WASM_PATH);
  const mapped=mapModule(bytes,originalFailure.indices,{
   sha256:originalBinary.sha256,expectedSize:originalBinary.bytes
  });
  const top=mapped.frames[0];
  // Find one in-body scalar memory byte, but without decoded instruction
  // boundaries or genuine native debugger evidence it remains a CANDIDATE.
  let offset=-1;
  for(let i=top.bodyFileStart;i<top.bodyFileEndExclusive;i++){
   if(bytes[i]===0x28){offset=i;break;}
  }
  assert.ok(offset>=top.bodyFileStart);
  const r=classifyUntrustedOperatorOffset(bytes,{
   provenance:'UNTRUSTED_OPERATOR_INPUT',wasmFunctionIndex:4846,
   moduleFileOffset:offset,opcodeByte:0x28
  });
  assert.equal(r.kind,'UNTRUSTED_OPERATOR_STATIC_OFFSET_CANDIDATE');
  assert.equal(r.staticCandidateOpcode,'0x28');
  assert.equal(r.candidateVerifiedAgainstOriginalWasm,true);
  assert.equal(r.staticCandidateIsValidatedInstructionBoundary,false);
  assert.equal(r.actualTrapPC,null);
  assert.equal(r.independentSameFailingProcessNativeAttribution,false);
  assert.equal(r.causalRepairProven,false);
  assert.equal(r.familyAlpha,'HOLD');
 });
}
