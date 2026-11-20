/**
 * M280: read-only SYMBOL/OFFSET boundary audit of the EXACT original ONNX
 * Runtime Web JSEP WASM that genuinely threw in M279. Never modify its binary.
 * Code body *file offsets* are NOT native failing instruction offsets.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const parent='4e2bd9f4a3585eed387042afd1ef8ed7e310cfa8';
export const ref='refs/heads/research/main1054-m280-original-wasm-function-symbols-HOLD';
export const added=[
 '.github/workflows/main1054-m280-original-wasm-symbol-audit-no-deploy.yml',
 'research/main1054/m280-original-wasm-function-symbol-audit.mjs',
 'tests/main1054-m280-original-wasm-function-symbol-audit.test.mjs'
];
export const pinned={
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'tests/main1054-m279-original-model-pointer-bounds.test.mjs':'29d9816102ecf72a48838a519698c5158c7829d9',
 '.github/workflows/main1054-m279-original-pointer-bounds-no-deploy.yml':'d27cf17be0ff4620d85f9cf4ac0eb30bb90ab981',
 'research/main1054/m278-native-session-memory-class.mjs':'8c8ac5a2eae233778a805063eba57dce22e1c386',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
};
export const exact={
 version:'1.22.0-dev.20250409-89f8206ba4',
 size:21596019,
 sha256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
 originalRedRun:44640727828,
 originalRedJob:135971719127,
 originalRedSource:parent,
 originalRedArm:'webkit-430-shard2-ordinal3'
};
export const frameIndices=[4846,1384,11276,7427];
const must=(x,reason)=>{if(!x)throw Error('M280 BLOCKED: '+reason);};
export function gateSource(git,e){
 must(e?.name==='push'&&e.ref===ref,'untrusted event/ref');
 must(e.attempt==='1','rerun not permitted for first-attempt source');
 must(/^[0-9a-f]{40}$/.test(e.sha||''),'invalid checkout SHA');
 const head=git('rev-parse','HEAD');
 must(head===e.sha,'wrong checkout SHA');
 must(git('merge-base','--is-ancestor',parent,head)==='','parent ancestry lost');
 must(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,head)===
   added.map(s=>'A\0'+s+'\0').join(''),'non-additive changed original source');
 for(const p of added)must(git('ls-tree',head,'--',p).startsWith('100644 blob '),'nonregular new source');
 for(const [p,sha] of Object.entries(pinned))
  must(git('rev-parse',head+':'+p)===sha,'original M279 model/diagnostic source drift: '+p);
 return {source:'PASS',originalM279NativeRed:'PRESERVED',releaseAllowed:false,familyAlpha:'HOLD'};
}
function leb(bytes,start,max=5){
 let result=0,scale=1,pos=start;
 for(let k=0;k<max;k++){
  must(pos<bytes.length,'truncated unsigned LEB128');
  const b=bytes[pos++];
  result+=(b&0x7f)*scale;
  must(Number.isSafeInteger(result),'unsigned LEB128 overflow');
  if(!(b&128))return {value:result,pos};
  scale*=128;
 }
 throw Error('M280 BLOCKED: malformed unsigned LEB128');
}
function takeU32(bytes,state){
 const {value,pos}=leb(bytes,state.pos);
 state.pos=pos;return value;
}
function takeName(bytes,state,max=10000){
 const n=takeU32(bytes,state);must(n<=max&&state.pos+n<=bytes.length,'malformed string');
 const content=bytes.subarray(state.pos,state.pos+n);
 state.pos+=n;return content.toString('utf8');
}
const takeLimits=(bytes,state)=>{
 const flags=takeU32(bytes,state);
 must(flags<=7,'unexpected WASM import limits flags');
 takeU32(bytes,state);
 if(flags&1)takeU32(bytes,state);
};
function importFunctionCount(data,start,end){
 const state={pos:start};
 const count=takeU32(data,state);
 must(count<100000,'unbounded imports');
 let functions=0;
 for(let i=0;i<count;i++){
  takeName(data,state);takeName(data,state);
  must(state.pos<end,'truncated import kind');
  const type=data[state.pos++];
  if(type===0){takeU32(data,state);functions++;}
  else if(type===1){must(state.pos<end,'missing table ref type');state.pos++;takeLimits(data,state);}
  else if(type===2){takeLimits(data,state);}
  else if(type===3){must(state.pos+2<=end,'missing global type');state.pos+=2;}
  else if(type===4){takeU32(data,state);takeU32(data,state);}
  else throw Error('M280 BLOCKED: unrecognized WASM import kind '+type);
 }
 must(state.pos===end,'unparsed import section');
 return functions;
}
function exportedFunctionNames(data,start,end){
 const state={pos:start};const n=takeU32(data,state);
 must(n<100000,'unbounded exports');
 const map=new Map();
 for(let i=0;i<n;i++){
  const name=takeName(data,state);
  must(state.pos<end,'missing export type');
  const kind=data[state.pos++],index=takeU32(data,state);
  if(kind===0)map.set(index,name);
 }
 must(state.pos===end,'unparsed export section');
 return map;
}
function wasmFunctionNames(bytes,start,end){
 const state={pos:start};const map=new Map();
 while(state.pos<end){
  const type=bytes[state.pos++];
  const subsectionSize=takeU32(bytes,state),stop=state.pos+subsectionSize;
  must(stop<=end,'overrun name subsection');
  if(type===1){
   const count=takeU32(bytes,state);
   must(count<100000,'unbounded function names');
   for(let i=0;i<count;i++)map.set(takeU32(bytes,state),takeName(bytes,state));
  }
  state.pos=stop;
 }
 return map;
}
function scanWasm(buffer){
 const bytes=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer);
 must(bytes.length>=8&&bytes.readUInt32LE(0)===0x6d736100&&bytes.readUInt32LE(4)===1,
  'not original WebAssembly module');
 const sections=[],names=new Map(),exports=new Map();
 let importFuncs=0,definitionCount=null,bodyPositions=null;
 let pos=8;
 while(pos<bytes.length){
  const id=bytes[pos++],len=leb(bytes,pos);pos=len.pos;
  const start=pos,end=start+len.value;
  must(end<=bytes.length,'truncated WASM section');
  if(id===0){
   const t={pos:start},label=takeName(bytes,t,200);
   sections.push({id,label,byteStart:start,byteLength:len.value});
   if(label==='name'){
    for(const [i,n] of wasmFunctionNames(bytes,t.pos,end))names.set(i,n);
   }
  }else{
   sections.push({id,byteStart:start,byteLength:len.value});
   if(id===2)importFuncs=importFunctionCount(bytes,start,end);
   if(id===3){
    const st={pos:start};definitionCount=takeU32(bytes,st);
    must(definitionCount<100000,'unbounded native function definitions');
    for(let i=0;i<definitionCount;i++)takeU32(bytes,st);
    must(st.pos===end,'unparsed native function section');
   }
   if(id===7){
    for(const [i,n] of exportedFunctionNames(bytes,start,end))exports.set(i,n);
   }
   if(id===10){
    const st={pos:start},n=takeU32(bytes,st);
    must(n<100000,'unbounded WASM code count');
    bodyPositions=new Array(n);
    for(let i=0;i<n;i++){
     const size=takeU32(bytes,st),bodyStart=st.pos,bodyEnd=bodyStart+size;
     must(bodyEnd<=end,'truncated native function body');
     bodyPositions[i]={bodyStart,bodyEnd,bodySize:size};
     st.pos=bodyEnd;
    }
    must(st.pos===end,'unparsed WASM code');
   }
  }
  pos=end;
 }
 must(pos===bytes.length&&definitionCount!==null&&bodyPositions!==null&&
  definitionCount===bodyPositions.length,'missing or conflicting native function code');
 return {importFuncs,definitions:definitionCount,codeBodies:bodyPositions,sections,names,exports};
}
export function auditWasm(bytes,options={requireOriginal:true}){
 const buffer=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
 const hash=createHash('sha256').update(buffer).digest('hex');
 if(options.requireOriginal!==false){
  must(hash===exact.sha256&&buffer.length===exact.size,
   'original WebKit JSEP WASM binary SHA/byte length mismatch');
 }
 const result=scanWasm(buffer);
 const functions=frameIndices.map(index=>{
  const defined=index-result.importFuncs,body=defined>=0?result.codeBodies[defined]:null;
  must(index<result.importFuncs+result.definitions,'frame index beyond pinned WASM native function count');
  return {
   index,
   importOrDefined:defined<0?'import':'defined',
   functionName:result.names.get(index)??null,
   originalExportName:result.exports.get(index)??null,
   wasmBinaryFunctionBodyStart:body?.bodyStart??null,
   wasmBinaryFunctionBodyEnd:body?.bodyEnd??null,
   wasmFunctionBodyByteSize:body?.bodySize??null,
   actualFailingInstructionOffset:null,
   originalNativeSourceLine:null,
   confidentlyResolvedNativeSymbol:
    typeof result.names.get(index)==='string'&&result.names.get(index).length>0
  };
 });
 return {
  schema:'MAIN1054_M280_EXACT_JSEP_WASM_FUNCTION_MAP_V1',
  exactPinnedWasmSHA256:hash,
  bytes:buffer.length,
  packageVersion:options.requireOriginal===false?'TEST_FIXTURE':exact.version,
  originalFailureRun:exact.originalRedRun,
  originalFailureJob:exact.originalRedJob,
  genuineOriginalFailureSource:exact.originalRedSource,
  originalTrueFailureRetained:true,
  wasmImportedFunctions:result.importFuncs,
  wasmDefinedFunctions:result.definitions,
  binaryHasFunctionNameSection:result.sections.some(s=>s.label==='name'),
  debugCustomSections:result.sections.filter(s=>s.label&&/^(?:\.debug_|sourceMappingURL|name)/.test(s.label))
   .map(s=>({name:s.label,bytes:s.byteLength})),
  mappedFunctions:functions,
  originalModelInputRangeWasInBounds:true,
  namedWasmStackFunctionsAvailable:
    functions.some(f=>f.confidentlyResolvedNativeSymbol),
  preciseTrapInstructionIdentified:false,
  targetedCausalNativeCorrectionDemonstrated:false,
  releaseAllowed:false,familyAlpha:'HOLD'
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],{encoding:'utf8'}).replace(/\n$/,'');
 try{
  gateSource(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]!=='audit')throw Error('expected audit');
  const report=auditWasm(readFileSync(process.argv[3]));
  writeFileSync(process.argv[4],JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log('M280_EXACT_ORIGINAL_NATIVE_FUNCTION_MAP',JSON.stringify(report));
 }catch(e){console.error('M280_FAIL_CLOSED',String(e.message||e).slice(0,190));process.exitCode=1;}
}
