import assert from 'node:assert/strict';
import test from 'node:test';
import {gateSource,ref,parent,added,pinned,auditWasm,frameIndices,exact} from '../research/main1054/m280-original-wasm-function-symbol-audit.mjs';
const head='1'.repeat(40);
const event={name:'push',ref,sha:head,attempt:'1'};
const exactDiff=added.map(p=>'A\0'+p+'\0').join('');
function git(op,...args){
 if(op==='rev-parse'){
  if(args[0]==='HEAD')return head;
  return pinned[args[0].slice(head.length+1)]??'2'.repeat(40);
 }
 if(op==='merge-base')return '';
 if(op==='diff-tree')return exactDiff;
 if(op==='ls-tree')return '100644 blob '+ '2'.repeat(40);
 throw Error('Unexpected fake Git operation');
}
const modify=(match,patch)=>(...args)=>match(...args)?patch(git(...args)):git(...args);
test('exact source never marks genuine native RED fixed or released',()=>{
 assert.deepEqual(gateSource(git,event),{
  source:'PASS',originalM279NativeRed:'PRESERVED',releaseAllowed:false,familyAlpha:'HOLD'
 });
});
for(const [name,delta,error] of [
 ['reject PR event',{name:'pull_request_target'},/event\/ref/],
 ['reject protected branch',{ref:'refs/heads/main'},/event\/ref/],
 ['reject retry',{attempt:'2'},/rerun/],
 ['reject missing SHA',{sha:''},/SHA/],
 ['reject wrong checkout',{sha:'f'.repeat(40)},/checkout SHA/]
])test(name,()=>assert.throws(()=>gateSource(git,{...event,...delta}),error));
for(const [title,pred,patch,regex] of [
 ['reject changed native browser runner',op=>op==='diff-tree',s=>s+'M\0scripts/test-parallel94-native-p88-browser.mjs\0',/non-additive/],
 ['reject missing native analysis workflow',op=>op==='diff-tree',()=>'',/non-additive/],
 ['reject unrelated research file',op=>op==='diff-tree',s=>s+'A\0public/mock-wasm.mjs\0',/non-additive/],
 ['reject symlink',op=>op==='ls-tree',()=> '120000 blob xxx',/nonregular/],
 ['reject wrong ancestor',op=>op==='merge-base',()=> 'not ancestor',/ancestry/],
 ['reject changed original P94 Worker',(op,arg)=>op==='rev-parse'&&arg===head+':public/outfit-worker-p94.mjs',()=> '0'.repeat(40),/source drift/],
 ['reject altered true native M279 RED diagnostic',(op,arg)=>op==='rev-parse'&&arg===head+':research/main1054/m279-original-model-pointer-bounds.mjs',()=> '0'.repeat(40),/source drift/]
])test(title,()=>assert.throws(()=>gateSource(modify(pred,patch),event),regex));
function leb(x){
 const out=[];
 do{let a=x&127;x=Math.floor(x/128);if(x)a|=128;out.push(a);}while(x);
 return Buffer.from(out);
}
const b=(...parts)=>Buffer.concat(parts.map(p=>Buffer.isBuffer(p)?p:Buffer.from(p)));
const s=(str)=>b(leb(Buffer.byteLength(str)),Buffer.from(str));
const section=(id,body)=>b(Buffer.from([id]),leb(body.length),body);
function fixture(withNames=true,withImport=true){
 const defined=11277-(withImport?1:0);
 const magic=Buffer.from([0,97,115,109,1,0,0,0]);
 const type=section(1,Buffer.from([1,0x60,0,0]));
 const imp=withImport?section(2,b(leb(1),s('m'),s('f'),Buffer.from([0,0]))):Buffer.alloc(0);
 const fun=section(3,b(leb(defined),Buffer.alloc(defined,0)));
 const exp=section(7,b(leb(1),s('frame'),Buffer.from([0]),leb(4846)));
 const bodies=[];
 for(let i=0;i<defined;i++)bodies.push(Buffer.from([2,0,0x0b]));
 const code=section(10,b(leb(defined),...bodies));
 const symbols=frameIndices.map((n,i)=>b(leb(n),s('func'+n)));
 const sub=b(leb(symbols.length),...symbols);
 const names=section(0,b(s('name'),Buffer.from([1]),leb(sub.length),sub));
 return b(magic,type,imp,fun,exp,code,...(withNames?[names]:[]));
}
test('maps original four WASM stack function indices into the correct code-body offsets, not instruction offsets',()=>{
 const x=auditWasm(fixture(),{requireOriginal:false});
 assert.equal(x.bytes>32000,true);
 assert.equal(x.wasmImportedFunctions,1);
 assert.equal(x.wasmDefinedFunctions,11276);
 assert.equal(x.mappedFunctions.length,4);
 assert.deepEqual(x.mappedFunctions.map(x=>x.index),frameIndices);
 assert.equal(x.binaryHasFunctionNameSection,true);
 assert.ok(x.debugCustomSections.some(s=>s.name==='name'));
 for(const entry of x.mappedFunctions){
  assert.equal(entry.functionName,'func'+entry.index);
  assert.ok(entry.wasmBinaryFunctionBodyStart>0);
  assert.equal(entry.wasmFunctionBodyByteSize,2);
  assert.equal(entry.actualFailingInstructionOffset,null);
  assert.equal(entry.originalNativeSourceLine,null);
 }
 assert.equal(x.mappedFunctions[0].originalExportName,'frame');
 assert.equal(x.preciseTrapInstructionIdentified,false);
 assert.equal(x.targetedCausalNativeCorrectionDemonstrated,false);
 assert.equal(x.originalTrueFailureRetained,true);
 assert.equal(x.releaseAllowed,false);
 assert.equal(x.familyAlpha,'HOLD');
});
test('a stripped release module MUST NOT invent source names or wasm instruction offsets',()=>{
 const x=auditWasm(fixture(false),{requireOriginal:false});
 assert.equal(x.binaryHasFunctionNameSection,false);
 assert.equal(x.namedWasmStackFunctionsAvailable,false);
 assert.ok(x.mappedFunctions.every(y=>y.functionName===null&&y.actualFailingInstructionOffset===null&&
  Number.isSafeInteger(y.wasmBinaryFunctionBodyStart)));
});
test('import-free module offset mapping keeps definition index aligned',()=>{
 const x=auditWasm(fixture(true,false),{requireOriginal:false});
 assert.equal(x.wasmImportedFunctions,0);
 assert.equal(x.mappedFunctions[0].functionName,'func4846');
});
test('fail closed on ANY original binary checksum mismatch even if code appears to contain function names',()=>{
 assert.throws(()=>auditWasm(fixture()),/SHA\/byte length mismatch/);
 assert.throws(()=>auditWasm(Buffer.alloc(exact.size,0)),/SHA\/byte length mismatch/);
});
test('reject malformed wasm magic/version and incomplete binary',()=>{
 assert.throws(()=>auditWasm(Buffer.from('NOT_WASM'),{requireOriginal:false}),/WebAssembly module/);
 const buffer=fixture();
 assert.throws(()=>auditWasm(buffer.subarray(0,buffer.length-5),{requireOriginal:false}),/truncated|malformed|unparsed|overrun|subsection/);
});
test('numeric crash indices are frozen to the genuine WebKit 430 original-source trace',()=>{
 assert.deepEqual(frameIndices,[4846,1384,11276,7427]);
 assert.equal(exact.originalRedRun,44640727828);
 assert.equal(exact.originalRedJob,135971719127);
 assert.equal(exact.originalRedSource,parent);
 assert.equal(exact.sha256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
});
