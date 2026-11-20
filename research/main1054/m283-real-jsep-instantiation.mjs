/**
 * M283: same disposable original Worker process, test-only WASM instantiation
 * byte attestation. This is a prerequisite for native trap-PC symbolization,
 * NOT itself the original trap PC, matched C++ line or runtime correction.
 *
 * Never logs binary, ONNX model, image pixels, private owner data, memory.
 * Original supplied WebAssembly native operation and return values unchanged.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {instrument as m279Instrument,deriveM279,adjudicateProcess} from './m279-original-model-pointer-bounds.mjs';
import {originalBinary} from './m280-original-jsep-function-map.mjs';

export const parent='fb2ace2f2e096e226918c5640250c957f7ad9492';
export const branch='refs/heads/research/main1054-m283-real-jsep-instance-sha-HOLD';
export const added=[
 '.github/workflows/main1054-m283-real-jsep-instantiation-no-deploy.yml',
 'research/main1054/m283-real-jsep-instantiation.mjs',
 'tests/main1054-m283-real-jsep-instantiation.test.mjs'
];
export const expectedSha=originalBinary.sha256;
export const expectedBytes=originalBinary.bytes;
export const originalWorkerBlob='ab7d3837139c5b7d693383f9d6617e199ec8de4f';
const demand=(v,msg)=>{if(!v)throw Error('M283 BLOCKED: '+msg);};
export function sourceGate(git,event){
 demand(event?.name==='push'&&event.ref===branch&&event.attempt==='1','unauthorized branch/event/retry');
 demand(/^[a-f0-9]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,'not exact checkout');
 demand(git('merge-base','--is-ancestor',parent,event.sha)==='','M281 ancestry missing');
 demand(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha)===
  added.map(p=>'A\0'+p+'\0').join(''),'original source changed or extra file');
 for(const p of added)demand(git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),'unsafe new file');
 const protectedPaths={
  'public/outfit-worker-p94.mjs':originalWorkerBlob,
  'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
  'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
  'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
 };
 for(const [p,sha] of Object.entries(protectedPaths))
  demand(git('rev-parse',event.sha+':'+p)===sha,'original browser/model/worker source drift '+p);
 return {source:'PASS',originalWasmModified:false,shippedWorkerModified:false,familyAlpha:'HOLD'};
}
function replaceOnce(s,needle,value){
 const p=s.indexOf(needle);
 demand(p!==-1&&s.indexOf(needle,p+needle.length)===-1,'ambiguous test-only patch point');
 return s.slice(0,p)+value+s.slice(p+needle.length);
}
// Instantiation-side ONLY: no crypto/model/source bytes are transmitted or saved.
// Byte SHA of a merely downloaded WASM is NEVER treated as instantiated SHA.
export const prelude=`
const __ccM283Wasm=(function(){
 const W=WebAssembly,originalInstantiate=W.instantiate,originalStreaming=W.instantiateStreaming;
 const originalCompile=W.compile;
 const seen={n:0};
 const hex=bytes=>Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
 const emit=record=>{try{console.info('M283_NATIVE_WASM_SHA '+JSON.stringify(record));}catch{}};
 const isBytes=x=>x instanceof ArrayBuffer||ArrayBuffer.isView(x);
 function hashBytes(bytes,operation,result){
  if(!isBytes(bytes))return;
  const length=bytes.byteLength;
  if(!Number.isSafeInteger(length)||length!==21596019)return;
  if(++seen.n>3)return;
  // Do not change the original instantiate Promise or its resolved value.
  const digest=crypto.subtle.digest('SHA-256',bytes).then(hex);
  Promise.allSettled([Promise.resolve(result),digest]).then(a=>{
   if(a[0].status==='fulfilled'&&a[1].status==='fulfilled')
    emit({operation,phase:'instantiated',bytes:length,sha256:a[1].value});
   else emit({operation,phase:'unverified',bytes:length,sha256:null});
  }).catch(()=>{});
 }
 W.instantiate=function(input,...rest){
  const result=Reflect.apply(originalInstantiate,W,[input,...rest]);
  hashBytes(input,'instantiate',result);return result;
 };
 if(typeof originalStreaming==='function'){
  W.instantiateStreaming=function(input,...rest){
   // Clone the exact response passed to the original browser native routine;
   // do not substitute a new WASM, mutate the Response, or change the result.
   const promise=Promise.resolve(input).then(response=>{
    try{
     const copy=response.clone().arrayBuffer();
     const witness=copy.then(bytes=>({bytes,data:bytes}));
     // Capture sha only after the actual native promise resolves (below).
     response.__ccM283Witness=witness;
    }catch{}
    return response;
   });
   const result=Reflect.apply(originalStreaming,W,[promise,...rest]);
   Promise.resolve(promise).then(response=>
    response.__ccM283Witness?.then(w=>hashBytes(w.data,'instantiateStreaming',result))
   ).catch(()=>{});
   return result;
  };
 }
 // Compile-only cannot prove instantiation. Kept unwrapped intentionally.
 void originalCompile;
 return seen;
})();
`;
export function instrument(name,bytes,endpoint){
 const original=m279Instrument(name,bytes,endpoint);
 return name==='ort-wasm-simd-threaded.jsep.mjs'?prelude+'\n'+original:original;
}
export function deriveM283(originalRunner,originalWorker){
 let s=deriveM279(originalRunner,originalWorker);
 const oldUrl=new URL('./m279-original-model-pointer-bounds.mjs',import.meta.url).href;
 s=replaceOnce(s,'import { instrument } from '+JSON.stringify(oldUrl)+';',
  'import { instrument } from '+JSON.stringify(import.meta.url)+';');
 const original="line.startsWith('M279_NATIVE_MODEL_BOUNDS '))&&line.length<1100";
 const successor="line.startsWith('M279_NATIVE_MODEL_BOUNDS ')||line.startsWith('M283_NATIVE_WASM_SHA '))&&line.length<1100";
 s=replaceOnce(s,original,successor);
 return s;
}
/** Pure fail-closed identity validator: a downloaded SHA or unsupported result is NEVER enough. */
export function adjudicateWitnesses(rows){
 demand(Array.isArray(rows)&&rows.length<=3,'oversize or missing native witness array');
 for(const x of rows){
  demand(x&&['instantiate','instantiateStreaming'].includes(x.operation),'not native instance');
  demand(['instantiated','unverified'].includes(x.phase),'native instantiation not resolved');
  demand(Number.isSafeInteger(x.bytes)&&x.bytes>=0&&x.bytes<=100000000,'invalid exact byte size');
  demand(x.sha256===null||typeof x.sha256==='string'&&/^[a-f0-9]{64}$/.test(x.sha256),
   'invalid runtime digest');
 }
 const matching=rows.filter(x=>x.phase==='instantiated'&&x.bytes===expectedBytes&&
  x.sha256===expectedSha);
 demand(!rows.some(x=>x.phase==='instantiated'&&x.bytes===expectedBytes&&
   x.sha256!==expectedSha),'original JSEP runtime byte identity mismatch');
 return {exactInstanceProven:rows.length===1&&matching.length===1,
  acceptedWitnessCount:matching.length,originalModelCausalFixProven:false};
}
export function assessProcess(log,exit,metadata){
 const original=adjudicateProcess(log,exit,metadata);
 demand(typeof log==='string'&&log.length>0&&log.length<3_000_000,'invalid original process log');
 const rows=log.split(/\r?\n/).filter(s=>s.startsWith('M283_NATIVE_WASM_SHA ')).map(s=>{
  const x=JSON.parse(s.slice('M283_NATIVE_WASM_SHA '.length));
  demand(['instantiate','instantiateStreaming'].includes(x.operation),'not instance-side provenance');
  demand(['instantiated','unverified'].includes(x.phase),'invalid attestation phase');
  demand(Number.isSafeInteger(x.bytes)&&x.bytes>=0&&x.bytes<=100000000,'invalid byte count');
  demand(x.sha256===null||/^[0-9a-f]{64}$/.test(x.sha256),'invalid digest');
  return x;
 });
 demand(rows.length<=3,'duplicate or excessive original byte witnesses');
 const {exactInstanceProven}=adjudicateWitnesses(rows);
 const verdict=original.originalJourneyPositive?
  (exactInstanceProven?'ORIGINAL_POSITIVE_WITH_INSTANTIATED_SHA':'PROVENANCE_BLOCKED'):
  (original.originalOrtCreateSessionThrew?
   'GENUINE_NATIVE_RED_PRESERVED':'ORIGINAL_RED_OR_BLOCKED');
 return {
  schema:'M283_ORIGINAL_JSEP_SAME_PROCESS_INSTANTIATION_V1',
  ...metadata,originalExit:exit,originalPositive:original.originalJourneyPositive,
  originalOrtCreateSessionThrew:original.originalOrtCreateSessionThrew,
  originalErrorClass:original.nativeErrorClass,
  sourcePinnedRuntimeSHA256:expectedSha,originalJsepBytes:expectedBytes,
  observedNativeInstantiationCount:rows.length,
  exactSourceBinaryInstantiatedSameWorker:exactInstanceProven,
  attestationUnverified:!exactInstanceProven,
  sameProcessOriginalNativeRed:original.originalOrtCreateSessionThrew&&exit!==0,
  originalRuntimeTrapInstructionOffset:null,
  originalCxxLine:null,nativeCausalFixProven:false,
  verdict,originalJpegUnmodified:true,releaseAllowed:false,familyAlpha:'HOLD'
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...a)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...a],
   {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  if(process.argv[2]==='prepare'){
   writeFileSync('scripts/.cc-m283-original-jsep-sha.mjs',deriveM283(
    readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8'),
    readFileSync('public/outfit-worker-p94.mjs','utf8')),{flag:'wx'});
   console.log('M283_ORIGINAL_RUNTIME_SAME_PROCESS_OBSERVER_READY');
  }else if(process.argv[2]==='receipt'){
   const receipt=assessProcess(readFileSync(process.argv[3],'utf8'),Number(process.argv[4]),{
    engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),ordinal:Number(process.env.M283_ORDINAL)
   });
   console.log('M283_ORIGINAL_RUNTIME_INSTANCIATION_RECEIPT '+JSON.stringify(receipt));
   if(receipt.verdict!=='ORIGINAL_POSITIVE_WITH_INSTANTIATED_SHA')process.exitCode=1;
  }else throw Error('expected prepare or receipt');
 }catch(e){console.error('M283_EVIDENCE_BLOCKED '+String(e.message||e).slice(0,230));process.exitCode=1;}
}
