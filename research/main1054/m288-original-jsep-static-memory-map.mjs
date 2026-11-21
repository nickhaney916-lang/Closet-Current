/**
 * M288 exact original JSEP native WASM static instruction map.
 * This enumerates memory-access *candidates* in the four REAL original M279
 * native failure stack functions, NOT the actual trapping instruction.
 * No original WASM/ONNX/JSEP mutation, WebKit-debugger attachment or release.
 */
import {createHash} from 'node:crypto';
import {createWriteStream,mkdirSync,writeFileSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {originalBinary,originalFailure,mapModule} from './m280-original-jsep-function-map.mjs';

export const parent='a4891fe3cabc270a3706346b74cb778c6466a8fb';
export const branch='refs/heads/research/main1054-m288-original-jsep-static-memory-instruction-map-HOLD';
export const additions=[
 '.github/workflows/main1054-m288-original-jsep-static-memory-map-no-deploy.yml',
 'research/main1054/m288-original-jsep-static-memory-map.mjs',
 'tests/main1054-m288-original-jsep-static-memory-map.test.mjs'
];
export const pinned=Object.freeze({
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m286-pinned-webkit-source-binary-provenance.mjs':'13874630185f165d9725e2ea4b7579ab4050fa53',
 'research/main1054/m284-wpe-native-process-discovery.mjs':'bbdab84c7aa890ecdd7f641342736fe1376a8127',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'research/main1054/m281-webkit-trap-pc-capability.mjs':'52412852f1c4f42a57826b1dcb18f1e793d92f19'
});
const insist=(x,why)=>{if(!x)throw Error('M288 FAIL-CLOSED: '+why);};
export function sourceGate(git,e){
 insist(e?.name==='push'&&e.ref===branch&&e.attempt==='1','unapproved source event or rerun');
 insist(/^[a-f0-9]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'source HEAD wrong');
 insist(git('merge-base','--is-ancestor',parent,e.sha)==='','verified parent missing');
 insist(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  additions.map(path=>'A\0'+path+'\0').join(''),'extra or modified original source');
 for(const path of additions)insist(git('ls-tree',e.sha,'--',path).startsWith('100644 blob '),'nonregular research file');
 for(const [path,sha] of Object.entries(pinned))
  insist(git('rev-parse',e.sha+':'+path)===sha,'original protected file changed '+path);
 return {onlyAddedDiagnosticFiles:true,genuineM279FailurePreserved:true,
  originalTrapPc:null,sourceLevelDefectKnown:false,causalRepairProven:false,familyAlpha:'HOLD'};
}
export function memoryAccessKind(opcode){
 if(typeof opcode!=='string'||opcode.length>100)return null;
 const op=opcode.toLowerCase();
 if(/^(?:i32|i64|f32|f64|v128)\.(?:load|store)(?:\d|[a-z_.])*$/.test(op)||
    /^(?:i32|i64)\.atomic\.(?:load|store|rmw)(?:[a-z0-9_.]*)$/.test(op))
  return 'linear-memory-access';
 if(/^(?:memory|table)\.(?:copy|fill|init)$/.test(op))
  return op.startsWith('memory.')?'linear-memory-bulk-access':null;
 if(/^(?:memory|table)\.(?:grow|size)$/.test(op))
  return op.startsWith('memory.')?'memory-management-nontrapping':null;
 if(/^(?:memory|i32|i64)\.atomic\.(?:notify|wait|wait32|wait64)$/.test(op))
  return 'linear-memory-atomic-access';
 return null;
}
export function createCollector(frames){
 insist(Array.isArray(frames)&&frames.length===4&&
  frames.every(x=>Number.isInteger(x.index)&&x.bodyFileStart>=0&&
   x.bodyFileEndExclusive>x.bodyFileStart),'invalid exact original frame map');
 const expected=originalFailure.indices;
 insist(frames.every((x,i)=>x.index===expected[i]),'original native stack reordered');
 const byIndex=new Map(frames.map(x=>[x.index,x]));
 const state=new Map(frames.map(f=>[f.index,{
  index:f.index,codeBodyStart:f.bodyFileStart,
  codeBodyEndExclusive:f.bodyFileEndExclusive,originalBodySHA256:f.bodySHA256,
  headerSeen:false,totalDisassembledInstructions:0,
  memoryPotentiallyTrappingCount:0,memoryManagementCount:0,
  opcodeCounts:{},earliestAccessFileByte:null,latestAccessFileByte:null,
  firstCandidateFileOffsets:[],lastCandidateFileOffsets:[],
  allCandidateOffsetSequenceSHA256:null,_hash:createHash('sha256'),
  _offsets:new Set(),_lastOffset:-1
 }]));
 let active=null,lineCount=0;
 function acceptLine(line){
  insist(typeof line==='string'&&line.length<6000,'oversize disassembly line');
  lineCount++;insist(lineCount<originalBinary.bytes*3,'unbounded external disassembly lines');
  const head=/^\s*(?:0x)?([0-9a-f]{1,12})\s+func\[(\d{1,6})\]/i.exec(line);
  if(head){
   const index=Number(head[2]);
   active=byIndex.has(index)?index:null;
   if(active!==null){
    const row=state.get(active);
    insist(!row.headerSeen,'duplicate function disassembly header');
    row.headerSeen=true;
   }
   return;
  }
  if(active===null)return;
  const m=/^\s*(?:0x)?([0-9a-f]{1,12}):\s*((?:[0-9a-f]{2}(?:\s+|$)){1,64})\|\s*([^\s|]{1,90})/i.exec(line);
  if(!m)return;
  const offset=Number.parseInt(m[1],16),opcode=m[3].toLowerCase(),
   row=state.get(active);
  insist(Number.isSafeInteger(offset)&&offset>=row.codeBodyStart&&
   offset<row.codeBodyEndExclusive,'instruction offset outside pinned original function body');
  insist(offset>row._lastOffset,'out of order or overlapping WASM instructions');
  row._lastOffset=offset;
  row.totalDisassembledInstructions++;
  const kind=memoryAccessKind(opcode);
  if(!kind)return;
  if(kind==='memory-management-nontrapping'){
   row.memoryManagementCount++;return;
  }
  insist(!row._offsets.has(offset),'duplicated memory-access candidate');
  row._offsets.add(offset);
  row.memoryPotentiallyTrappingCount++;
  row.opcodeCounts[opcode]=(row.opcodeCounts[opcode]??0)+1;
  row.earliestAccessFileByte??=offset;
  row.latestAccessFileByte=offset;
  if(row.firstCandidateFileOffsets.length<8)row.firstCandidateFileOffsets.push(offset);
  row.lastCandidateFileOffsets.push(offset);
  if(row.lastCandidateFileOffsets.length>8)row.lastCandidateFileOffsets.shift();
  row._hash.update(String(offset)+'/'+opcode+'\n','utf8');
 }
 function finish(verifiedToolVersion){
  insist(typeof verifiedToolVersion==='string'&&verifiedToolVersion.length>1&&
    verifiedToolVersion.length<140,'WABT version absent');
  const rows=[...state.values()].map(r=>{
   insist(r.headerSeen,'original function disassembly missing '+r.index);
   insist(r.totalDisassembledInstructions>0,'no disassembled instructions '+r.index);
   if(r.index===originalFailure.indices[0])
    insist(r.memoryPotentiallyTrappingCount>0,'top authentic WASM trap function has no candidates');
   const {headerSeen,totalDisassembledInstructions,memoryPotentiallyTrappingCount,
    memoryManagementCount,opcodeCounts,earliestAccessFileByte,
    latestAccessFileByte,firstCandidateFileOffsets,lastCandidateFileOffsets,
    codeBodyStart,codeBodyEndExclusive,originalBodySHA256,index}=r;
   return {index,codeBodyStart,codeBodyEndExclusive,originalBodySHA256,
    headerSeen,totalDisassembledInstructions,memoryPotentiallyTrappingCount,
    memoryManagementCount,opcodeCounts,earliestAccessFileByte,latestAccessFileByte,
    firstCandidateFileOffsets,lastCandidateFileOffsets,
    allCandidateOffsetSequenceSHA256:r._hash.digest('hex'),
    trapInstructionFileOffset:null,
    invalidMemoryAccessCauseLocated:false};
  });
  return {
   schema:'M288_EXACT_ORIGINAL_WASM_STATIC_MEMORY_INSTRUCTION_CANDIDATES_V1',
   pinnedOriginalWasmSHA256:originalBinary.sha256,pinnedOriginalWasmBytes:originalBinary.bytes,
   wabtVersion:verifiedToolVersion,
   authenticOriginalRedRun:originalFailure.runId,authenticOriginalRedJob:originalFailure.jobId,
   originalStackIndices:originalFailure.indices,
   importedFunctionIndexMappingVerified:true,
   originalWasmModuleUnmodified:true,
   allOffsetsAreStaticModuleFilePositions:true,
   originalFailingProcessJsepShaWitnessed:false,
   genuineWebkitTrapSitePcKnown:false,actualOriginalMemoryAccessLocated:false,
   originalCxxSourceLineKnown:false,causalRuntimeCorrectionTested:false,
   consumerReleaseAuthorized:false,familyAlpha:'HOLD',rows
  };
 }
 return {acceptLine,finish};
}
export function adjudicate(report){
 insist(report?.schema==='M288_EXACT_ORIGINAL_WASM_STATIC_MEMORY_INSTRUCTION_CANDIDATES_V1',
  'invalid output');
 insist(report.pinnedOriginalWasmSHA256===originalBinary.sha256&&
  report.pinnedOriginalWasmBytes===originalBinary.bytes,'wrong original WASM');
 insist(report.rows?.length===4&&
  report.rows.every((row,i)=>row.index===originalFailure.indices[i]&&
   row.trapInstructionFileOffset===null&&
   row.invalidMemoryAccessCauseLocated===false&&row.headerSeen===true&&
   Number.isInteger(row.memoryPotentiallyTrappingCount)&&
   row.memoryPotentiallyTrappingCount>=(i===0?1:0)),'false original PC or incomplete static map');
 insist(report.originalFailingProcessJsepShaWitnessed===false&&
  report.genuineWebkitTrapSitePcKnown===false&&
  report.actualOriginalMemoryAccessLocated===false&&
  report.originalCxxSourceLineKnown===false&&
  report.causalRuntimeCorrectionTested===false&&
  report.consumerReleaseAuthorized===false&&report.familyAlpha==='HOLD',
  'pretended original native repair');
 return report;
}
async function downloadPinnedWasm(){
 const response=await fetch(originalBinary.url,{signal:AbortSignal.timeout(150000)});
 insist(response.ok,'canonical WASM CDN not available');
 const bytes=Buffer.from(await response.arrayBuffer());
 insist(bytes.length===originalBinary.bytes&&
  createHash('sha256').update(bytes).digest('hex')===originalBinary.sha256,
  'downloaded WASM bytes changed');
 return bytes;
}
async function disassemble(bytes,frames){
 const wabt=execFileSync('wasm-objdump',['--version'],
  {encoding:'utf8',timeout:5000}).trim();
 const collect=createCollector(frames);
 mkdirSync('m288-sanitized',{recursive:true});
 const tmpPath='m288-sanitized/original-canonical-JSEP-TEMP.wasm';
 // Only transient public JSEP source, deleted before archival; no model weights/photos.
 const {writeFileSync,unlinkSync}=await import('node:fs');
 writeFileSync(tmpPath,bytes);
 try{
  const proc=spawn('wasm-objdump',['-d',tmpPath],{stdio:['ignore','pipe','pipe']});
  let err='',lineError=null;
  const stderr=createInterface({input:proc.stderr,crlfDelay:Infinity});
  stderr.on('line',s=>{if(err.length<4000)err+=s.slice(0,150)+'\n';});
  const out=createInterface({input:proc.stdout,crlfDelay:Infinity});
  try{
   for await (const line of out)collect.acceptLine(line);
  }catch(e){lineError=e;proc.kill('SIGTERM');}
  const finished=await new Promise(resolve=>{
   if(proc.exitCode!==null||proc.signalCode)resolve({status:proc.exitCode,signal:proc.signalCode});
   else proc.once('close',(status,signal)=>resolve({status,signal}));
  });
  if(lineError)throw lineError;
  insist(finished.status===0&&!finished.signal,
   'WABT disassembler failed without usable exact map');
  return adjudicate(collect.finish(wabt));
 }finally{
  unlinkSync(tmpPath);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  insist(process.argv[2]==='static-map','unapproved operation');
  const wasm=await downloadPinnedWasm();
  const original=mapModule(wasm,originalFailure.indices,
   {sha256:originalBinary.sha256,expectedSize:originalBinary.bytes});
  const report=await disassemble(wasm,original.frames);
  writeFileSync('m288-sanitized/original-JSEP-static-memory-map.json',
   JSON.stringify(report,null,2)+'\n');
  console.log('M288_ORIGINAL_JSEP_STATIC_MEMORY_MAP '+JSON.stringify({
   exactOriginalSHA:true,
   importedIndexMapVerified:true,
   functions:report.rows.map(x=>({index:x.index,staticCandidateCount:x.memoryPotentiallyTrappingCount,
    totalInstructions:x.totalDisassembledInstructions})),
   actualTrapInstruction:null,originalCxxRootCause:null,
   permanentRepair:false,familyAlpha:'HOLD'
  }));
 }catch(e){
  console.error('M288_STATIC_MAP_BLOCKED '+String(e?.message||e).slice(0,220));
  process.exitCode=1;
 }
}
