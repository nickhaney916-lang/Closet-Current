/**
 * M294: reconcile genuine pinned ORIGINAL JSEP WABT memory-access instruction
 * boundaries across MVP scalar + SIMD + atomic + bulk-memory opcode families.
 * M288 counted memory op candidates; M293 verified only scalar boundaries.
 * ALL counts are STATIC INSTRUCTIONS, never authentic WebKit failing trap PC.
 * No original model run, native debugger, memory/process reads or security edits.
 */
import {writeFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {originalBinary,originalFailure} from './m280-original-jsep-function-map.mjs';
import {verifyOriginalBytes,createScanner as scalarScanner}
 from './m293-original-wasm-instruction-boundary.mjs';

export const parent='2af7ea8dbc7d21b1cacc8aa48dd3347fd8d40e7a';
export const branch='refs/heads/research/main1054-m294-original-prefixed-memory-boundaries-HOLD';
export const additions=[
 '.github/workflows/main1054-m294-original-prefixed-memory-no-deploy.yml',
 'research/main1054/m294-prefixed-original-memory-opcode-boundaries.mjs',
 'tests/main1054-m294-prefixed-original-memory-opcode-boundaries.test.mjs'
];
const frozen={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m292-original-native-pc-evidence-handoff.mjs':'f6756739021e8074954c9cdf890b79ab176e7b6b',
 'research/main1054/m293-original-wasm-instruction-boundary.mjs':'03bc9a5bb01657378a386bcb51125c16bcc8e731'
};
const need=(v,msg)=>{if(!v)throw Error('M294 FAIL-CLOSED: '+msg);};
export const originalVerifiedCounts=Object.freeze([
 {index:4846,disassembled:73974,scalar:5528,simd:130,atomic:75,bulk:36,all:5769},
 {index:1384,disassembled:77373,scalar:5794,simd:146,atomic:50,bulk:56,all:6046},
 {index:11276,disassembled:227,scalar:33,simd:0,atomic:0,bulk:0,all:33},
 {index:7427,disassembled:232,scalar:35,simd:0,atomic:0,bulk:0,all:35}
]);
export function sourceGate(git,event){
 need(event?.name==='push'&&event.ref===branch&&event.attempt==='1',
  'wrong event, branch or retry');
 need(/^[0-9a-f]{40}$/.test(event.sha||'')&&
  git('rev-parse','HEAD')===event.sha,'wrong current HEAD');
 need(git('merge-base','--is-ancestor',parent,event.sha)==='',
  'missing M293 exact parent');
 need(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status',
  '-z',parent,event.sha)===
  additions.map(p=>'A\u0000'+p+'\u0000').join(''),'extra or modified original file');
 for(const p of additions)
  need(git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),
   'nonregular research file');
 for(const [p,sha] of Object.entries(frozen))
  need(git('rev-parse',event.sha+':'+p)===sha,'protected original source drift '+p);
 return {originalRuntimeAndJsepUnmodified:true,originalRealM279RedPreserved:true,
  nativeTrapPc:null,sourceCxxCauseKnown:false,permanentFixProven:false,familyAlpha:'HOLD'};
}
export function familyOfMnemonic(op){
 if(typeof op!=='string'||op.length>90)return null;
 const x=op.toLowerCase();
 if(/^v128\.(?:load|store)(?:[a-z0-9_]*)$/.test(x))return 'simd';
 if(/^(?:i32|i64)\.atomic\.(?:load|store|rmw)[a-z0-9_.]*$/.test(x)||
    /^memory\.atomic\.(?:notify|wait32|wait64)$/.test(x))return 'atomic';
 if(/^memory\.(?:copy|fill|init)$/.test(x))return 'bulk';
 return null;
}
const opcodeByte={simd:0xfd,atomic:0xfe,bulk:0xfc};
export function createPrefixedScanner(spans,original){
 need(Buffer.isBuffer(original)&&original.length>100&&
  Array.isArray(spans)&&spans.length===4&&
  spans.every((f,i)=>f.index===originalFailure.indices[i]&&
   Number.isSafeInteger(f.start)&&Number.isSafeInteger(f.end)&&
   f.start>=0&&f.end>f.start&&f.end<=original.length),
  'invalid original function spans');
 const mvp=scalarScanner(spans,original);
 const state=new Map(spans.map(f=>[f.index,{
  index:f.index,start:f.start,end:f.end,seen:false,last:-1,instructions:0,
  simd:0,atomic:0,bulk:0,samples:{simd:[],atomic:[],bulk:[]},
  mnemonicCounts:{},accepted:new Set()
 }]));
 let active=null,lineCount=0;
 function accept(line){
  need(typeof line==='string'&&line.length<6000,'invalid disassembly input');
  lineCount++;need(lineCount<originalBinary.bytes*3,'unbounded disassembly');
  mvp.accept(line);
  const h=/^\s*(?:0x)?([0-9a-f]{1,12})\s+func\[(\d{1,6})\]/i.exec(line);
  if(h){
   const index=Number(h[2]);
   active=state.has(index)?index:null;
   if(active!==null){
    const row=state.get(active);need(!row.seen,'duplicate function header');
    row.seen=true;
   }
   return;
  }
  if(active===null)return;
  const m=/^\s*(?:0x)?([0-9a-f]{1,12}):\s*((?:[0-9a-f]{2}(?:\s+|$)){1,64})\|\s*([^\s|]{1,90})/i.exec(line);
  if(!m)return;
  const row=state.get(active),position=parseInt(m[1],16);
  const data=Buffer.from(m[2].trim().split(/\s+/).map(x=>parseInt(x,16)));
  need(Number.isSafeInteger(position)&&position>row.last&&
   position>=row.start&&position+data.length<=row.end,
   'out-of-span or overlapping real instruction');
  row.last=position;row.instructions++;
  const mnemonic=m[3].toLowerCase(),family=familyOfMnemonic(mnemonic);
  if(!family)return;
  need(data.length>=2&&data[0]===opcodeByte[family]&&
   original.subarray(position,position+data.length).equals(data),
   'non-scalar prefixed opcode or original binary bytes mismatch');
  need(!row.accepted.has(position),'duplicate original memory opcode');
  row.accepted.add(position);row[family]++;
  row.mnemonicCounts[mnemonic]=(row.mnemonicCounts[mnemonic]||0)+1;
  if(row.samples[family].length<3)
   row.samples[family].push({offset:position,mnemonic,prefix:'0x'+
    data[0].toString(16),byteLength:data.length});
 }
 function lookup(index,offset){
  need(Number.isSafeInteger(index)&&state.has(index)&&
   Number.isSafeInteger(offset)&&offset>=0&&offset<original.length,
   'invalid file offset or original frame index');
  const row=state.get(index);
  need(row.seen&&row.instructions>0,'original static disassembly absent');
  return {kind:row.accepted.has(offset)?'VERIFIED_STATIC_PREFIXED_MEMORY_START':
    'NOT_VERIFIED_PREFIXED_MEMORY_START',
   functionIndex:index,originalFileOffset:offset,
   genuineWebkitFailingTrapPc:null,realCxxBadAccess:null,familyAlpha:'HOLD'};
 }
 function finish(version){
  need(typeof version==='string'&&version.length>1&&version.length<150,
   'WABT version missing');
  const scalar=mvp.finish(version);
  const rows=originalVerifiedCounts.map((expected,i)=>{
   const stateRow=state.get(expected.index),scalarRow=scalar.counts[i];
   need(stateRow.seen&&stateRow.instructions===expected.disassembled&&
    scalarRow.functionIndex===expected.index&&
    scalarRow.totalDisassembledInstructions===expected.disassembled&&
    scalarRow.verifiedScalarMemoryOpcodeBoundaries===expected.scalar,
    'original instruction census does not match M293');
   for(const category of ['simd','atomic','bulk'])
    need(stateRow[category]===expected[category],
     'M288 prefixed memory baseline mismatch '+expected.index+'/'+category);
   const prefixed=stateRow.simd+stateRow.atomic+stateRow.bulk;
   need(expected.scalar+prefixed===expected.all,
    'M288 original candidate count not reconciled');
   return {functionIndex:expected.index,totalDisassembledInstructions:stateRow.instructions,
    scalarOpcodeBoundaries:expected.scalar,
    simdOpcodeBoundaries:stateRow.simd,
    atomicOpcodeBoundaries:stateRow.atomic,
    bulkOpcodeBoundaries:stateRow.bulk,
    allOriginalM288StaticMemoryCandidates:expected.all,
    staticInstructionBoundaryVerified:true,
    prefixes:stateRow.samples,
    mnemonicCounts:stateRow.mnemonicCounts,
    originalWebkitTrapSiteKnown:false};
  });
  return adjudicate({
   schema:'M294_ORIGINAL_PREFIXED_MEMORY_BOUNDARY_RECONCILIATION_V1',
   originalJsepSHA256:originalBinary.sha256,
   originalJsepBytes:originalBinary.bytes,
   wabtVersion:version,
   originalRealRedRun:originalFailure.runId,
   originalRealRedJob:originalFailure.jobId,
   originalRealStack:originalFailure.indices,
   scalarAndPrefixedAgainstM288Reconciled:true,
   realFailingProcessOpcodeOffset:null,originalCxxRootCause:null,
   nativeRuntimeRepairProven:false,releaseAllowed:false,familyAlpha:'HOLD',
   rows
  });
 }
 return {accept,lookup,finish};
}
export function adjudicate(r){
 need(r?.schema==='M294_ORIGINAL_PREFIXED_MEMORY_BOUNDARY_RECONCILIATION_V1'&&
  r.originalJsepSHA256===originalBinary.sha256&&
  r.originalJsepBytes===originalBinary.bytes&&
  r.originalRealRedRun===originalFailure.runId&&
  r.originalRealRedJob===originalFailure.jobId&&
  JSON.stringify(r.originalRealStack)===JSON.stringify(originalFailure.indices)&&
  r.scalarAndPrefixedAgainstM288Reconciled===true&&
  r.rows?.length===4&&r.rows.every((f,i)=>
   f.functionIndex===originalVerifiedCounts[i].index&&
   f.allOriginalM288StaticMemoryCandidates===originalVerifiedCounts[i].all&&
   f.originalWebkitTrapSiteKnown===false)&&
  r.realFailingProcessOpcodeOffset===null&&
  r.originalCxxRootCause===null&&r.nativeRuntimeRepairProven===false&&
  r.releaseAllowed===false&&r.familyAlpha==='HOLD',
  'fabricated original native PC/C++ repair or wrong canonical binary');
 return r;
}
async function runReal(){
 const response=await fetch(originalBinary.url,{signal:AbortSignal.timeout(150000)});
 need(response.ok,'canonical public JSEP binary unavailable');
 const original=Buffer.from(await response.arrayBuffer());
 const spans=verifyOriginalBytes(original);
 const version=execFileSync('wasm-objdump',['--version'],
  {encoding:'utf8',timeout:5000}).trim();
 mkdirSync('m294-tmp',{recursive:true});
 const temp='m294-tmp/canonical-JSEP-TEMP.wasm';
 writeFileSync(temp,original,{flag:'wx'});
 try{
  const scan=createPrefixedScanner(spans,original);
  const child=spawn('wasm-objdump',['-d',temp],{stdio:['ignore','pipe','pipe']});
  let err='',lineError=null;
  const stderr=createInterface({input:child.stderr,crlfDelay:Infinity});
  stderr.on('line',l=>{if(err.length<2000)err+=l.slice(0,140)+'\n';});
  const stdout=createInterface({input:child.stdout,crlfDelay:Infinity});
  try{for await (const l of stdout)scan.accept(l);}
  catch(e){lineError=e;child.kill('SIGTERM');}
  const result=await new Promise(resolve=>{
   if(child.exitCode!==null||child.signalCode)
    resolve({code:child.exitCode,signal:child.signalCode});
   else child.once('close',(code,signal)=>resolve({code,signal}));
  });
  if(lineError)throw lineError;
  need(result.code===0&&!result.signal,'WABT original file disassembly failed '+err.slice(0,140));
  const receipt=scan.finish(version);
  const sample=receipt.rows[0].prefixes.atomic[0]||
   receipt.rows[0].prefixes.simd[0]||receipt.rows[0].prefixes.bulk[0];
  need(sample&&scan.lookup(4846,sample.offset).kind===
   'VERIFIED_STATIC_PREFIXED_MEMORY_START',
   'original prefixed memory opcode boundary not verifiable');
  need(scan.lookup(4846,sample.offset+1).kind===
   'NOT_VERIFIED_PREFIXED_MEMORY_START',
   'prefixed opcode operand byte misidentified as opcode start');
  writeFileSync('m294-tmp/original-prefixed-memory-reconciliation.json',
   JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log('M294_ORIGINAL_PREFIXED_MEMORY_RECONCILIATION '+JSON.stringify({
   verifiedOriginalSHA:true,
   families:receipt.rows.map(({functionIndex,scalarOpcodeBoundaries,simdOpcodeBoundaries,
    atomicOpcodeBoundaries,bulkOpcodeBoundaries,allOriginalM288StaticMemoryCandidates})=>({
     functionIndex,scalarOpcodeBoundaries,simdOpcodeBoundaries,
     atomicOpcodeBoundaries,bulkOpcodeBoundaries,allOriginalM288StaticMemoryCandidates})),
   operandLookalikeNotOpcode:true,realWebkitTrapPC:null,permanentFix:false,
   familyAlpha:'HOLD'
  }));
 }finally{unlinkSync(temp);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  need(process.argv.length===3&&process.argv[2]==='static-reconcile',
   'no live browser/debugger or native original model authorized');
  await runReal();
 }catch(e){
  console.error('M294_FAIL_CLOSED '+String(e?.message||e).slice(0,240));
  process.exitCode=1;
 }
}
