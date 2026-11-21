/**
 * M292: Offline, no-deploy native-trap evidence handoff. This does NOT attach
 * a debugger or run the original ONNX model. It can verify the byte identity
 * and static instruction location of future operator-supplied native traces,
 * but cannot prove that an instruction really trapped without authorized
 * SAME-FAILING-PROCESS native evidence. No ptrace, sandbox or permission edits.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {originalBinary,originalFailure,mapModule}
 from './m280-original-jsep-function-map.mjs';

export const parent='6adeffeb82557a365d42237fca47b042368d6d4e';
export const branch='refs/heads/research/main1054-m292-native-trap-evidence-handoff-HOLD';
export const additions=[
 '.github/workflows/main1054-m292-native-pc-evidence-no-deploy.yml',
 'research/main1054/m292-original-native-pc-evidence-handoff.mjs',
 'tests/main1054-m292-original-native-pc-evidence-handoff.test.mjs'
];
const immutable=Object.freeze({
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m290-live-native-elf-identity.mjs':'5d395b06ad76750d1d0a709daab9cfd49e88cc6e',
 'research/main1054/m291-loaded-wpe-elf-closure.mjs':'1ff7f5553b2cadbc43bea6118df40e1125c021c4'
});
const requireEvidence=(x,message)=>{
 if(!x)throw Error('M292 FAIL-CLOSED: '+message);
};
export function sourceGate(git,event){
 requireEvidence(event?.name==='push'&&event.ref===branch&&event.attempt==='1',
  'unapproved workflow or rerun');
 requireEvidence(/^[a-f0-9]{40}$/.test(event.sha||'')&&
  git('rev-parse','HEAD')===event.sha,'source HEAD mismatch');
 requireEvidence(git('merge-base','--is-ancestor',parent,event.sha)==='',
  'verified M291 ancestry missing');
 requireEvidence(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',
  parent,event.sha)===additions.map(x=>'A\u0000'+x+'\u0000').join(''),
  'modified protected source or unexpected paths');
 for(const p of additions)requireEvidence(
  git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),
  'research file is not an ordinary non-symlink blob');
 for(const [p,sha] of Object.entries(immutable))
  requireEvidence(git('rev-parse',event.sha+':'+p)===sha,
   'protected original file drift '+p);
 return {originalRuntimeUnmodified:true,priorGenuineFailureRetained:true,
  actualNativeTrapPC:null,causalFixProven:false,familyAlpha:'HOLD'};
}
export function legacyNativeRed(){
 return Object.freeze({runId:originalFailure.runId,jobId:originalFailure.jobId,
  firstAttempt:true,engine:'webkit',screenWidth:430,
  functionIndices:originalFailure.indices,
  originalErrorClass:'wasm-bounds',actualOriginalInstructionOffset:null,
  originalModelLength:15199746,originalModelPointer:8933688,
  lastAttestedJsepInOldFailingProcess:false});
}
export function noWitnessReceipt(){
 return Object.freeze({
  schema:'M292_ORIGINAL_WASM_PC_HANDOFF_V1',kind:'NO_NEW_NATIVE_WITNESS',
  originalWasmSHA256:originalBinary.sha256,
  originalWasmSize:originalBinary.bytes,
  historicalRealRed:legacyNativeRed(),
  inspectedOriginalModel:false,actualTrapPC:null,
  staticCandidateOpcode:null,staticCandidateFunctionIndex:null,
  candidateVerifiedAgainstOriginalWasm:false,
  independentSameFailingProcessNativeAttribution:false,
  nativeCxxSourceLocation:null,causalRepairProven:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
}
export function adjudicateReceipt(r){
 requireEvidence(r?.schema==='M292_ORIGINAL_WASM_PC_HANDOFF_V1',
  'invalid diagnostic schema');
 requireEvidence(r.originalWasmSHA256===originalBinary.sha256&&
  r.originalWasmSize===originalBinary.bytes&&
  r.historicalRealRed?.runId===originalFailure.runId&&
  r.historicalRealRed?.jobId===originalFailure.jobId&&
  r.historicalRealRed?.actualOriginalInstructionOffset===null,
  'historical original first-attempt failure changed');
 requireEvidence(r.kind==='NO_NEW_NATIVE_WITNESS'||
  r.kind==='UNTRUSTED_OPERATOR_STATIC_OFFSET_CANDIDATE',
  'unknown evidence classification');
 requireEvidence(r.inspectedOriginalModel===false&&
  r.actualTrapPC===null&&
  r.independentSameFailingProcessNativeAttribution===false&&
  r.nativeCxxSourceLocation===null&&
  r.causalRepairProven===false&&r.familyAlpha==='HOLD'&&
  r.releaseAuthorized===false,
  'operator input cannot become authentic native trap or repair');
 if(r.kind==='NO_NEW_NATIVE_WITNESS')
  requireEvidence(r.staticCandidateOpcode===null&&
   r.staticCandidateFunctionIndex===null&&
   r.candidateVerifiedAgainstOriginalWasm===false,
   'fabricated candidate without instruction');
 else requireEvidence(
  typeof r.staticCandidateOpcode==='string'&&
  originalFailure.indices.includes(r.staticCandidateFunctionIndex)&&
  r.candidateVerifiedAgainstOriginalWasm===true,
  'candidate not pinned to original WASM function');
 return r;
}
/**
 * An operator-supplied offset is NOT proof it trapped. It can only be mapped
 * to the exact canonical WASM file bytes and static function-body span.
 * Genuine attribution requires native engine source/ELF, same process,
 * true original failure, PC, C++ instruction and a real RED/GREEN experiment.
 */
export function classifyUntrustedOperatorOffset(originalBytes,candidate){
 requireEvidence(candidate&&typeof candidate==='object'&&!Array.isArray(candidate),
  'candidate absent');
 const allowed=['moduleFileOffset','wasmFunctionIndex','opcodeByte',
  'provenance'];
 requireEvidence(Object.keys(candidate).every(k=>allowed.includes(k))&&
  Object.keys(candidate).length===allowed.length,
  'unexpected raw debugger data / unbounded fields');
 requireEvidence(candidate.provenance==='UNTRUSTED_OPERATOR_INPUT',
  'cannot mark self-reported trace authenticated');
 requireEvidence(Number.isSafeInteger(candidate.moduleFileOffset)&&
  candidate.moduleFileOffset>=0&&candidate.moduleFileOffset<originalBinary.bytes&&
  originalFailure.indices.includes(candidate.wasmFunctionIndex)&&
  Number.isInteger(candidate.opcodeByte)&&candidate.opcodeByte>=0&&
  candidate.opcodeByte<=255,
  'invalid original function or bytecode coordinate');
 const bytes=Buffer.from(originalBytes);
 requireEvidence(bytes.length===originalBinary.bytes&&
  createHash('sha256').update(bytes).digest('hex')===originalBinary.sha256,
  'input is not the full original JSEP WASM');
 const mapped=mapModule(bytes,[candidate.wasmFunctionIndex],{
  sha256:originalBinary.sha256,expectedSize:originalBinary.bytes
 });
 const fn=mapped.frames[0],offset=candidate.moduleFileOffset;
 requireEvidence(fn.kind==='defined'&&offset>=fn.bodyFileStart&&
  offset<fn.bodyFileEndExclusive,'offset is outside original function body');
 requireEvidence(bytes[offset]===candidate.opcodeByte,
  'opcode byte not found at supplied original file offset');
 // All single-byte MVP i32/i64/f32/f64 load/store instructions; SIMD and
 // atomic prefix require independent full-instruction disassembly and are not
 // claimed. A matching byte may still be an immediate, not an opcode.
 const scalarMemory= candidate.opcodeByte>=0x28&&candidate.opcodeByte<=0x3e;
 requireEvidence(scalarMemory,
  'not a scalar memory instruction candidate (no trusted disassembly)');
 return adjudicateReceipt({
  ...noWitnessReceipt(),
  kind:'UNTRUSTED_OPERATOR_STATIC_OFFSET_CANDIDATE',
  staticCandidateOpcode:'0x'+candidate.opcodeByte.toString(16).padStart(2,'0'),
  staticCandidateFunctionIndex:candidate.wasmFunctionIndex,
  candidateVerifiedAgainstOriginalWasm:true,
  // A byte inside a real function body can still be an immediate: do NOT
  // assert a disassembled instruction boundary or genuine native PC.
  staticCandidateIsValidatedInstructionBoundary:false,
  operatorSuppliedModuleFileOffset:offset
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  requireEvidence(process.argv.length===3&&process.argv[2]==='no-witness',
   'unapproved mode; no external debugger execution in hosted CI');
  const receipt=adjudicateReceipt(noWitnessReceipt());
  mkdirSync('m292-sanitized',{recursive:true});
  writeFileSync('m292-sanitized/native-trap-pc-evidence-readiness.json',
   JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log('M292_ORIGINAL_NATIVE_TRAP_PC_GATE '+JSON.stringify({
   originalJsepIdentityPinned:true,staticMappingAvailable:true,
   operatorDebugCaptureAvailable:false,actualNativeTrapPC:null,
   originalNativeRepairProven:false,familyAlpha:'HOLD'
  }));
 }catch(e){
  console.error('M292_FAIL_CLOSED '+String(e?.message||e).slice(0,240));
  process.exitCode=1;
 }
}
