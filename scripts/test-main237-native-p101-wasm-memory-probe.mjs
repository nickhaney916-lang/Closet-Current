/**
 * M237 - Passive JS-visible WebAssembly.Memory.grow probe on the real,
 * source-locked P101/P94 SegFormer model initialization path.
 *
 * This is not a WASM-internal memory.grow tracer. The WASM instruction can
 * grow linear memory without invoking the JavaScript Memory.prototype.grow
 * method; zero observed JS calls is NOT proof of no native memory growth.
 * Never collect photos, weights, tensors, URLs, exception strings or users.
 * A genuine model-load failure is still RED, never retry-to-green.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const basePath='scripts/test-parallel101-real-p94-model-init-stage-browser.mjs';
const bytes=await readFile(basePath);
const blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(blob(bytes),'ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab',
 'P101 pinned diagnostic parent changed; re-audit original');
const original=bytes.toString('utf8');
const unique=(text,anchor,label)=>assert.equal(text.split(anchor).length,2,label+' source moved');
const collectorAnchor=' "       stageOnly:true,",';
unique(original,collectorAnchor,'P101 sanitized diagnostic collector');
const fields=[
 ' "       growCalls:Number.isInteger(safe.growCalls)&&safe.growCalls>=0&&safe.growCalls<=100000?safe.growCalls:null,",',
 ' "       growFailures:Number.isInteger(safe.growFailures)&&safe.growFailures>=0&&safe.growFailures<=100000?safe.growFailures:null,",',
 ' "       maxBeforePages:Number.isInteger(safe.maxBeforePages)&&safe.maxBeforePages>=0&&safe.maxBeforePages<=65536?safe.maxBeforePages:null,",',
 ' "       maxAfterPages:Number.isInteger(safe.maxAfterPages)&&safe.maxAfterPages>=0&&safe.maxAfterPages<=65536?safe.maxAfterPages:null,",',
 ' "       memoryHookInstalled:safe.memoryHookInstalled===true,",',
 ' "       memoryErrorClass:[\'none\',\'Error\',\'TypeError\',\'RangeError\',\'RuntimeError\',\'other\'].includes(safe.memoryErrorClass)?safe.memoryErrorClass:\'other\',",'
].join('\n');
let derived=original.replace(collectorAnchor,fields+'\n'+collectorAnchor);
const origHook="diagWorker=diagWorker.replace(p101ModelAnchor, '  p101WasmProbe(requestId);\\n'+p101ModelAnchor);";
unique(derived,origHook,'P101 native WebAssembly probe installation');

const workerProbe="\nconst p237MemoryStats={memoryHookInstalled:false,growCalls:0,growFailures:0,maxBeforePages:0,maxAfterPages:0,memoryErrorClass:'none'};\nconst p237Pages=memory=>{\n try{\n  const bytes=memory.buffer.byteLength;\n  return Number.isSafeInteger(bytes)?Math.min(65536,Math.max(0,Math.floor(bytes/65536))):0;\n }catch{return 0;}\n};\nfunction p237Install(id){\n const prototype=WebAssembly.Memory?.prototype;\n const nativeGrow=prototype?.grow;\n if(typeof nativeGrow!=='function'){\n  self.postMessage({type:'diagnostic',id,phase:'p237_memory_hook_install',outcome:'error'});\n  return;\n }\n try{\n  prototype.grow=function(...args){\n   const before=p237Pages(this);\n   p237MemoryStats.growCalls=Math.min(100000,p237MemoryStats.growCalls+1);\n   p237MemoryStats.maxBeforePages=Math.max(before,p237MemoryStats.maxBeforePages);\n   try{\n    const value=Reflect.apply(nativeGrow,this,args);\n    p237MemoryStats.maxAfterPages=Math.max(p237MemoryStats.maxAfterPages,p237Pages(this));\n    return value;\n   }catch(error){\n    p237MemoryStats.growFailures=Math.min(100000,p237MemoryStats.growFailures+1);\n    const name=typeof error?.name==='string'?error.name:'other';\n    p237MemoryStats.memoryErrorClass=['Error','TypeError','RangeError','RuntimeError'].includes(name)?name:'other';\n    throw error;\n   }\n  };\n  p237MemoryStats.memoryHookInstalled=true;\n }catch{}\n self.postMessage({type:'diagnostic',id,phase:'p237_memory_hook_install',\n   outcome:p237MemoryStats.memoryHookInstalled?'ok':'error',\n   memoryHookInstalled:p237MemoryStats.memoryHookInstalled});\n}\nfunction p237Emit(id){\n self.postMessage({type:'diagnostic',id,phase:'p237_growth_summary',outcome:'ok',\n  memoryHookInstalled:p237MemoryStats.memoryHookInstalled,\n  growCalls:p237MemoryStats.growCalls,growFailures:p237MemoryStats.growFailures,\n  maxBeforePages:p237MemoryStats.maxBeforePages,maxAfterPages:p237MemoryStats.maxAfterPages,\n  memoryErrorClass:p237MemoryStats.memoryErrorClass});\n}\n";

const patch=[
 origHook,
 "diagWorker=diagWorker.replace('  p101WasmProbe(requestId);\\n',"+
 " '  p101WasmProbe(requestId);\\n  p237Install(requestId);\\n');",
 "diagWorker="+JSON.stringify(workerProbe)+"+'\\n'+diagWorker;",
 "const p237Success=\"self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'ok'\";",
 "const p237Failure=\"self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'error'\";",
 "assert.equal(diagWorker.split(p237Success).length,2,'P101 model-load success receipt changed');",
 "assert.equal(diagWorker.split(p237Failure).length,2,'P101 model-load failure receipt changed');",
 "diagWorker=diagWorker.replace(p237Success,'p237Emit(requestId);'+p237Success);",
 "diagWorker=diagWorker.replace(p237Failure,'p237Emit(requestId);'+p237Failure);"
].join('\n');
derived=derived.replace(origHook,patch);

const terminal="\"  assert.ok(evidence.workerEvents.some(e=>e.type==='diagnostic'),'P101 missing genuine Worker model-init stage messages; no genuine model evidence');\",";
unique(derived,terminal,'P101 unchanged genuine Worker model-terminal gate');
const extra="\"  assert.ok(evidence.workerEvents.some(e=>e.type==='diagnostic'&&e.phase==='p237_growth_summary'&&e.memoryHookInstalled===true),'M237 missing actual Worker memory-growth summary');\",";
derived=derived.replace(terminal,terminal+'\n'+extra);
assert.ok(derived.includes('state.cards>0&&state.cards<=12'),'original strict positive card assertion missing');
assert.ok(derived.includes('P101 true P94 model/owner failure; preserve RED'));
assert.ok(!workerProbe.includes('sourceSHA256')&&!workerProbe.includes('originalPhoto')&&!workerProbe.includes('modelWeights'),'M237 telemetry may not include private data');
const temp=resolve('scripts/.main237-p101-memory-probe-derived.mjs');
try{
 await writeFile(temp,derived,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'M237 generated P101 diagnostic JS syntax RED: '+String(check.stderr||'').slice(0,300));
 if(process.env.M237_SOURCE_ONLY==='1'){
  console.log('M237_PINNED_REAL_MODEL_MEMORY_PROBE_SOURCE_PASS',JSON.stringify({
   originalP101Pinned:true,originalP94WorkerUnchanged:true,
   actualModelSessionStartAndTerminalRequired:true,
   jsVisibleMemoryGrowObservedOnly:true,wasmInternalGrowthNotObservable:true,
   strictPositiveAndOwnerJourneyUnchanged:true,
   noPII:true,releaseAuthorized:false,hold:true}));
 }else{
  const run=spawnSync(process.execPath,[temp],{env:process.env,stdio:'inherit',timeout:19*60*1000});
  if(run.error)throw run.error;
  assert.equal(run.status,0,'M237 genuine pinned P94 native source/owner model test RED; do not rerun-to-green');
 }
}finally{await rm(temp,{force:true});}
