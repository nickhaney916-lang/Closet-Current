/**
 * M293: prove whether a supplied STATIC candidate begins a real original
 * JSEP WASM scalar load/store instruction using source-pinned WABT disassembly.
 * Not a native debugger. This does not prove a WebKit trap PC, C++ cause, fix
 * or family release. Designed to complement independent #1538 operator tools.
 */
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {originalBinary,originalFailure,mapModule}
 from './m280-original-jsep-function-map.mjs';

export const parent='badea9e4e9f59edbbf6c1b0ba18e36cfffe9af5d';
export const branch='refs/heads/research/main1054-m293-original-wasm-exact-opcode-boundary-HOLD';
export const additions=[
 '.github/workflows/main1054-m293-original-opcode-boundaries-no-deploy.yml',
 'research/main1054/m293-original-wasm-instruction-boundary.mjs',
 'tests/main1054-m293-original-wasm-instruction-boundary.test.mjs'
];
const protectedPins={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m291-loaded-wpe-elf-closure.mjs':'1ff7f5553b2cadbc43bea6118df40e1125c021c4',
 'research/main1054/m292-original-native-pc-evidence-handoff.mjs':'f6756739021e8074954c9cdf890b79ab176e7b6b'
};
const need=(x,m)=>{if(!x)throw Error('M293 FAIL-CLOSED: '+m);};
const digest=b=>createHash('sha256').update(b).digest('hex');
export function sourceGate(git,event){
 need(event?.name==='push'&&event.ref===branch&&event.attempt==='1',
  'unexpected workflow/branch/rerun');
 need(/^[0-9a-f]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,
  'exact HEAD missing');
 need(git('merge-base','--is-ancestor',parent,event.sha)==='',
  'frozen M292 parent missing');
 need(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',
  parent,event.sha)===additions.map(p=>'A\u0000'+p+'\u0000').join(''),
  'unexpected or modified original file');
 for(const p of additions)
  need(git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),
   'nonordinary research file');
 for(const [p,sha] of Object.entries(protectedPins))
  need(git('rev-parse',event.sha+':'+p)===sha,
   'protected native/owner source drift '+p);
 return {originalWorkerAndJsepUnmodified:true,historicalM279RedPreserved:true,
  actualOriginalWebkitTrapPC:null,causalRepairProven:false,familyAlpha:'HOLD'};
}
export function verifyOriginalBytes(bytes){
 need(Buffer.isBuffer(bytes)&&bytes.length===originalBinary.bytes&&
  digest(bytes)===originalBinary.sha256,
  'not canonical 21,596,019-byte original JSEP SHA');
 const mapped=mapModule(bytes,originalFailure.indices,{
  sha256:originalBinary.sha256,expectedSize:originalBinary.bytes
 });
 need(mapped.frames.length===4&&mapped.frames.every(f=>f.kind==='defined'),
  'real original native stack not defined in canonical code section');
 return mapped.frames.map(f=>({index:f.index,start:f.bodyFileStart,
  end:f.bodyFileEndExclusive,sha:f.bodySHA256}));
}
const scalarKinds = new Set([
 'i32.load','i64.load','f32.load','f64.load',
 'i32.load8_s','i32.load8_u','i32.load16_s','i32.load16_u',
 'i64.load8_s','i64.load8_u','i64.load16_s','i64.load16_u',
 'i64.load32_s','i64.load32_u','i32.store','i64.store',
 'f32.store','f64.store','i32.store8','i32.store16',
 'i64.store8','i64.store16','i64.store32'
]);
export function createScanner(frames,bytes){
 need(Buffer.isBuffer(bytes)&&bytes.length>10&&
  Array.isArray(frames)&&frames.length===4&&
  frames.every((f,i)=>f.index===originalFailure.indices[i]&&
   Number.isSafeInteger(f.start)&&Number.isSafeInteger(f.end)&&
   f.start>=0&&f.start<f.end&&f.end<=bytes.length),
  'missing original source-aligned function spans');
 const selected=new Map(frames.map(f=>[f.index,{...f,header:false,
  last:-1,instructions:0,scalarCandidates:0,candidates:new Map()}]));
 let active=null,lines=0;
 function accept(line){
  need(typeof line==='string'&&line.length<6000,'unbounded disassembler line');
  lines++;need(lines<originalBinary.bytes*3,'unbounded disassembler');
  const h=/^\s*(?:0x)?([0-9a-f]{1,12})\s+func\[(\d{1,6})\]/i.exec(line);
  if(h){
   const index=Number(h[2]);
   active=selected.has(index)?index:null;
   if(active!==null){
    const f=selected.get(active);
    need(!f.header,'duplicate original function header');f.header=true;
   }
   return;
  }
  if(active===null)return;
  const m=/^\s*(?:0x)?([0-9a-f]{1,12}):\s*((?:[0-9a-f]{2}(?:\s+|$)){1,64})\|\s*([^\s|]{1,90})/i.exec(line);
  if(!m)return;
  const f=selected.get(active),offset=parseInt(m[1],16);
  const bytesAt=Buffer.from(m[2].trim().split(/\s+/).map(x=>parseInt(x,16)));
  const op=m[3].toLowerCase();
  need(Number.isSafeInteger(offset)&&offset>=f.start&&offset<f.end&&
   offset>f.last&&offset+bytesAt.length<=f.end,
   'overlapping/out-of-function instruction from static WABT');
  f.last=offset;f.instructions++;
  // Only unprefixed MVP scalar opcodes 0x28-0x3e have a one-byte opcode.
  // SIMD/atomic/bulk prefixes are NOT supported and are never advertised.
  if(!scalarKinds.has(op))return;
  need(bytesAt.length>=3&&bytesAt[0]>=0x28&&bytesAt[0]<=0x3e&&
   bytes.subarray(offset,offset+bytesAt.length).equals(bytesAt),
   'static scalar instruction mismatch with original WASM bytes');
  f.candidates.set(offset,Object.freeze({index:active,offset,
   scalarOpcode:op,opcodeHex:bytesAt[0].toString(16).padStart(2,'0'),
   instructionByteLength:bytesAt.length}));
  f.scalarCandidates++;
 }
 function finish(version){
  need(typeof version==='string'&&version.length>1&&version.length<150,
   'no WABT tool provenance');
  const rows=[...selected.values()];
  need(rows.every(f=>f.header&&f.instructions>0)&&
   rows[0].scalarCandidates>0,'incomplete exact original static disassembly');
  return {
   schema:'M293_ORIGINAL_WASM_SCALAR_OPCODE_BOUNDARY_V1',
   originalWasmSHA256:originalBinary.sha256,
   originalWasmBytes:originalBinary.bytes,wabtVersion:version,
   historicalGenuineWebkitRed:{runId:originalFailure.runId,jobId:originalFailure.jobId,
    topFunctionIndex:originalFailure.indices[0],actualInstructionOffset:null},
   counts:rows.map(f=>({functionIndex:f.index,
    totalDisassembledInstructions:f.instructions,
    verifiedScalarMemoryOpcodeBoundaries:f.scalarCandidates})),
   // No raw binary, model, native addresses, or full disassembly in output.
   sample:rows[0].candidates.values().next().value,
   actualOriginalWebkitTrapPc:null,
   originalCxxFaultStatement:null,causalRepairProven:false,
   familyAlpha:'HOLD',releaseAuthorized:false
  };
 }
 function lookup(index,offset){
  need(Number.isSafeInteger(index)&&originalFailure.indices.includes(index)&&
   Number.isSafeInteger(offset)&&offset>=0&&offset<bytes.length,
   'invalid original stack function or file offset');
  const f=selected.get(index);
  need(f.header&&f.instructions>0,'original source function not disassembled');
  const located=f.candidates.get(offset);
  return {kind:located?'STATIC_SCALAR_OPCODE_BOUNDARY':
   'NOT_VERIFIED_SCALAR_OPCODE_BOUNDARY',index,offset,
   scalarOpcode:located?.scalarOpcode??null,
   length:located?.instructionByteLength??null,
   // Even a real static disassembled memory op has NOT been observed trapping.
   nativeWebkitFailureInstructionProven:false,
   originalOrtCreateSessionBadAccessProven:false,familyAlpha:'HOLD'};
 }
 return {accept,finish,lookup};
}
export function adjudicate(receipt){
 need(receipt?.schema==='M293_ORIGINAL_WASM_SCALAR_OPCODE_BOUNDARY_V1'&&
  receipt.originalWasmSHA256===originalBinary.sha256&&
  receipt.originalWasmBytes===originalBinary.bytes&&
  receipt.historicalGenuineWebkitRed?.runId===originalFailure.runId&&
  receipt.historicalGenuineWebkitRed?.jobId===originalFailure.jobId&&
  receipt.historicalGenuineWebkitRed?.actualInstructionOffset===null&&
  receipt.actualOriginalWebkitTrapPc===null&&
  receipt.originalCxxFaultStatement===null&&
  receipt.causalRepairProven===false&&receipt.releaseAuthorized===false&&
  receipt.familyAlpha==='HOLD',
  'a static bytecode boundary cannot authenticate or repair native failure');
 return receipt;
}
async function runReal(){
 const r=await fetch(originalBinary.url,{signal:AbortSignal.timeout(150000)});
 need(r.ok,'canonical public JSEP CDN inaccessible');
 const bytes=Buffer.from(await r.arrayBuffer());
 const spans=verifyOriginalBytes(bytes);
 const version=execFileSync('wasm-objdump',['--version'],
  {encoding:'utf8',timeout:5000}).trim();
 mkdirSync('m293-tmp',{recursive:true});
 const temp='m293-tmp/canonical-JSEP-TEMP.wasm';
 writeFileSync(temp,bytes,{flag:'wx'});
 try{
  const scanner=createScanner(spans,bytes);
  const process=spawn('wasm-objdump',['-d',temp],
   {stdio:['ignore','pipe','pipe']});
  let err='',lineError=null;
  const stderr=createInterface({input:process.stderr,crlfDelay:Infinity});
  stderr.on('line',s=>{if(err.length<2000)err+=s.slice(0,150)+'\n';});
  const output=createInterface({input:process.stdout,crlfDelay:Infinity});
  try{for await (const line of output)scanner.accept(line);}
  catch(e){lineError=e;process.kill('SIGTERM');}
  const exit=await new Promise(resolve=>{
   if(process.exitCode!==null||process.signalCode)
    resolve({code:process.exitCode,signal:process.signalCode});
   else process.once('close',(code,signal)=>resolve({code,signal}));
  });
  if(lineError)throw lineError;
  need(exit.code===0&&!exit.signal,'disassembler failed '+err.slice(0,150));
  const result=adjudicate(scanner.finish(version));
  const candidate=result.sample;
  need(scanner.lookup(candidate.index,candidate.offset).kind===
   'STATIC_SCALAR_OPCODE_BOUNDARY','true exact static opcode boundary missing');
  need(scanner.lookup(candidate.index,candidate.offset+1).kind===
   'NOT_VERIFIED_SCALAR_OPCODE_BOUNDARY',
   'middle-of-instruction immediate falsely accepted');
  writeFileSync('m293-tmp/original-wasm-static-boundary-only.json',
   JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log('M293_REAL_ORIGINAL_WASM_OPCODE_BOUNDARY '+JSON.stringify({
   originalJsepSHA256Verified:true,
   exactScalarOpcodeBoundaries:result.counts,
   negativeOperandByteRejected:true,
   originalNativeTrapPC:null,permanentFix:false,familyAlpha:'HOLD'
  }));
 }finally{unlinkSync(temp);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  need(process.argv.length===3&&process.argv[2]==='static-boundary',
   'no native debugger or model execution authorized');
  await runReal();
 }catch(e){console.error('M293_FAIL_CLOSED '+String(e?.message||e).slice(0,220));
  process.exitCode=1;}
}
