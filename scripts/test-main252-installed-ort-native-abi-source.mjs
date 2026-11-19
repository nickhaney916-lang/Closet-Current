/**
 * M252 installed-source WebAssembly ABI mapping, no product modification.
 * Distinguishes installed ONNX JS -> wasm._OrtCreateSessionOptions argument
 * from an observed native C++ allocator option state. No silent success.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const ORT='1.22.0-dev.20250409-89f8206ba4';
const WORKER='d66651b616de54c51eb7ef986324b30f1580888f';
const M250='55325ef58db3e6f5df55499948e708e2e40766f9';
const SHA256='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const read=path=>readFile(path,'utf8');
function one(v,fragment,label){
 assert.equal(v.split(fragment).length,2,'Missing or ambiguous installed ORT ABI path: '+label);
}
async function sourceLibrary(){
 const packageRoot='node_modules/onnxruntime-web';
 const p=JSON.parse(await read(join(packageRoot,'package.json')));
 assert.equal(p.version,ORT,'ORT pinned version drift');
 let sources=[];
 const found=[];
 const dist=join(packageRoot,'dist');
 for(const entry of await readdir(dist,{withFileTypes:true})){
  if(!entry.isFile()||!entry.name.endsWith('.map'))continue;
  const raw=await read(join(dist,entry.name));
  assert.ok(raw.length<=60*1024*1024,'Unbounded ORT sourcemap');
  const map=JSON.parse(raw);
  assert.ok(Array.isArray(map.sources)&&Array.isArray(map.sourcesContent),'Invalid ORT source map');
  for(let i=0;i<map.sources.length;i++){
   if(!/\/(?:wasm\/)?(?:session-options|wasm-core-impl)\.ts$/.test(map.sources[i]))continue;
   if(typeof map.sourcesContent[i]!=='string')continue;
   sources.push({path:map.sources[i],content:map.sourcesContent[i],map:entry.name});
   found.push(map.sources[i]);
  }
 }
 const selected=sources.find(x=>/\/session-options\.ts$/.test(x.path)&&
  x.content.includes('_OrtCreateSessionOptions('));
 const core=sources.find(x=>/\/wasm-core-impl\.ts$/.test(x.path)&&x.content.includes('_OrtCreateSession'));
 assert.ok(selected,'No exact installed ORT session-options.ts map. Cannot certify native ABI path.');
 assert.ok(core,'No installed ONNX WASM core map. Cannot certify use of session options.');
 return {session:selected,core,foundMaps:new Set(sources.map(x=>x.map)).size};
}
function attest({session,core}, worker,m250){
 assert.equal(gitBlob(Buffer.from(worker)),WORKER,'Original consumer Worker drift');
 assert.equal(gitBlob(Buffer.from(m250)),M250,'M250 A/B no-deploy option-source drift');
 assert.ok(worker.includes("device:'wasm',dtype:'fp32'"));
 assert.ok(worker.includes("Xenova/segformer_b0_clothes"));
 assert.ok(m250.includes("session_options:{enableMemPattern:false}"));
 assert.ok(m250.includes('ORIGINAL_JSEP_SHA250'));
 assert.ok(m250.includes(SHA256));
 const code=session.content;
 assert.ok(code.includes('export const setSessionOptions'),'Actual installed ORT setSessionOptions missing');
 one(code,'_OrtCreateSessionOptions(','actual WASM ABI call');
 assert.match(code,/(?:wasm|getInstance\(\))\._OrtCreateSessionOptions\s*\(/,'Actual native WASM module handle not called');
 // Native C ABI's 3rd argument is a direct boolean; no derived
 // native allocator state is read by this static source-only receipt.
 const location=code.indexOf('_OrtCreateSessionOptions(');
 const window=code.slice(location,location+650);
 assert.match(window,/!!sessionOptions\.enableMemPattern\s*,/,'Pinned memory option must be passed as boolean argument');
 assert.match(window,/!!sessionOptions\.enableCpuMemArena\s*,\s*!!sessionOptions\.enableMemPattern\s*,/,'Memory option ABI argument order changed');
 // Pin the original WASM *default* before accepting M250 as a real A/B.
 // An option omitted in original Worker and an explicit false may both map
 // to the SAME native boolean. A green 14/14 comparison is then not
 // evidence of a changed allocator policy, even when a real model ran.
 const appendStart=code.indexOf('const appendDefaultOptions');
 const appendEnd=code.indexOf('const setExecutionProviders',appendStart);
 assert.ok(appendStart>=0&&appendEnd>appendStart,'Unknown installed ORT default-option normalization');
 const appendDefault=code.slice(appendStart,appendEnd);
 assert.ok(!/enableMemPattern\s*(?:=|\?\?=)\s*true/.test(appendDefault),
  'Default session options force memory patterns on; M250 baseline/false may differ');
 const nativeCallPatterns=[...code.matchAll(/enableMemPattern/g)].length;
 assert.ok(nativeCallPatterns>=1&&nativeCallPatterns<=2,
  'Unexpected additional session memory-pattern rewrites; original baseline value UNKNOWN');
 if(appendDefault.includes('enableMemPattern')){
  assert.ok(appendDefault.includes('webgpu')&&appendDefault.includes('= false'),
   'Unproven default memory-pattern mutation outside WebGPU explicit disable');
 }
 assert.ok(code.includes('appendDefaultOptions(sessionOptions)'),
  'No proof native session options are normalized at expected call');
 assert.equal(Boolean(undefined),Boolean(false),'Omitted option unexpectedly differs from explicit false');
 assert.ok(core.content.includes('setSessionOptions('),'Actual native core does not construct ONNX WASM session options');
 assert.ok(core.content.includes('_OrtCreateSession'),'Actual native core does not create WASM model session');
 return Object.freeze({
  schema:'M252_INSTALLED_ORT_122DEV_SOURCE_NATIVE_ABI/v1',
  ortVersion:ORT,
  installedDistSourcemapSessionOptions:true,
  installedNativeSessionOptionsCallStaticVerified:true,
  installedOriginalJsepWorkerUnmodified:true,
  researchPatternOffToWasmAbiBooleanSourceProven:true,
  trueJavascriptOptionProducesBooleanFalse:true,
  defaultJavascriptUndefinedProducesBooleanFalse:true,
  omittedBaselineAndExplicitFalseSameWasmNativeBoolean:true,
  oldM250BaselineVsPatternOffWasNotAnAllocatorA_B:true,
  // WARNING: an undefined default is NOT necessarily the desired ORT default.
  // This test never asserts it means C++ memory-pattern policy is off.
  actualWasmExportCallObserved:false,
  actualNativeAllocatorOptionStateRead:false,
  actualNaturalWebkitRedToGreenProven:false,
  previousRealM250BrowserJourneysNotRerunHere:true,
  familyAlphaHold:true,
  releaseAuthorized:false
 });
}

test('M252 exact installed pinned ORT source map routes option boolean into native WASM create options ABI',async()=>{
 const source=await sourceLibrary();
 const [worker,m250]=await Promise.all([
  read('public/outfit-worker-p94.mjs'),
  read('scripts/main250-original-jsep-mempattern-study.mjs')
 ]);
 const receipt=attest(source,worker,m250);
 assert.equal(receipt.installedNativeSessionOptionsCallStaticVerified,true);
 assert.equal(receipt.actualWasmExportCallObserved,false);
 assert.equal(receipt.omittedBaselineAndExplicitFalseSameWasmNativeBoolean,true);
 assert.equal(receipt.actualNativeAllocatorOptionStateRead,false);
 console.log('M252_INSTALLED_ORT_NATIVE_ABI_SOURCE',JSON.stringify({...receipt,sourceMapCount:source.foundMaps}));
});
test('M252 rejects tampered native mem option, swapped allocator ABI and fake native observations',async()=>{
 const source=await sourceLibrary();
 const [worker,m250]=await Promise.all([
  read('public/outfit-worker-p94.mjs'),
  read('scripts/main250-original-jsep-mempattern-study.mjs')
 ]);
 const base=attest(source,worker,m250);
 const fail=[
  {...source,session:{...source.session,content:source.session.content.replace('!!sessionOptions.enableMemPattern','false')}},
  {...source,session:{...source.session,content:source.session.content.replace('!!sessionOptions.enableCpuMemArena','false')}},
  {...source,session:{...source.session,content:source.session.content.replace('_OrtCreateSessionOptions(','_OrtOtherSessionOptions(')}}
 ];
 for(let i=0;i<fail.length;i++){
  assert.throws(()=>attest(fail[i],worker,m250),'Unproven native ABI path erroneously accepted '+i);
 }
 assert.throws(()=>attest(source,worker.replace("dtype:'fp32'","dtype:'q8'"),m250));
 assert.throws(()=>attest(source,worker,m250.replace('session_options:{enableMemPattern:false}','session_options:{}')));
 const fakeNativeDefault={...source,session:{...source.session,
  content:source.session.content.replace(
   'appendDefaultOptions(sessionOptions)',
   'appendDefaultOptions(sessionOptions);sessionOptions.enableMemPattern = true'
  )}};
 // Synthetic default injection cannot be allowed to count as equivalent.
 assert.throws(()=>attest(fakeNativeDefault,worker,m250));
 assert.equal(base.oldM250BaselineVsPatternOffWasNotAnAllocatorA_B,true);
 assert.equal(base.actualWasmExportCallObserved,false);
 assert.equal(base.actualNaturalWebkitRedToGreenProven,false);
});
