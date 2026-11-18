/**
 * M238 — source-pinned M237/P101 research-only original model owner-journey
 * wrapper, observing passive imported/exported WebAssembly.Memory byteLength.
 * Native WASM internal memory.grow may change captured memory size even when
 * JavaScript Memory.prototype.grow never executes.
 * Never call memory.grow ourselves, read any memory contents, log owner,
 * source, raw errors, network URLs, images or model weights.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {M238_WORKER_PROBE} from './main238-wasm-memory-observer-fixture.mjs';

const sourcePath='scripts/test-main237-native-p101-wasm-memory-probe.mjs';
const sourceBytes=await readFile(sourcePath);
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(blob(sourceBytes),'e281589a2f482791875ba2b9b51d0f215bc1af77',
 'M237 native memory instrumentation moved; re-audit needed');
const source=sourceBytes.toString('utf8');
const unique=(hay,needle,name)=>assert.equal(hay.split(needle).length,2,name+' changed');
const oldLine=source.split('\n').find(s=>s.startsWith('const workerProbe='));
assert.ok(oldLine?.endsWith(';'),'source Worker diagnostic declaration missing');
unique(source,oldLine,'M237 JS-memory Worker probe');
const originalWorkerProbe=JSON.parse(oldLine.slice('const workerProbe='.length,-1));
assert.ok(originalWorkerProbe.includes('function p237Install(id)'));
assert.ok(originalWorkerProbe.includes('function p237Emit(id)'));
assert.ok(M238_WORKER_PROBE.includes("p238ScanInstance")&&M238_WORKER_PROBE.includes('p238ScanImports'));
const extended=originalWorkerProbe+'\n'+M238_WORKER_PROBE+
 '\nconst p238OriginalInstall=p237Install;\n'+
 'p237Install=function(id){p238OriginalInstall(id);p238Install(id);};\n'+
 'const p238OriginalEmit=p237Emit;\n'+
 'p237Emit=function(id){p238OriginalEmit(id);p238Emit(id);};\n';
let adapted=source.replace(oldLine,'const workerProbe='+JSON.stringify(extended)+';');

// The P101 browser message listener accepts diagnostics but only allowlisted
// scalar keys. No memory contents; measured pages are capped at 4 GiB.
const fieldAnchor='const fields=[';
unique(adapted,fieldAnchor,'M237 diagnostic fields');
const fields=[
 ' "       memorySnapshotHooks:Number.isInteger(safe.memorySnapshotHooks)&&safe.memorySnapshotHooks>=0&&safe.memorySnapshotHooks<=2?safe.memorySnapshotHooks:null,",',
 ' "       memoryRefs:Number.isInteger(safe.memoryRefs)&&safe.memoryRefs>=0&&safe.memoryRefs<=16?safe.memoryRefs:null,",',
 ' "       importedMemoryRefs:Number.isInteger(safe.importedMemoryRefs)&&safe.importedMemoryRefs>=0&&safe.importedMemoryRefs<=16?safe.importedMemoryRefs:null,",',
 ' "       exportedMemoryRefs:Number.isInteger(safe.exportedMemoryRefs)&&safe.exportedMemoryRefs>=0&&safe.exportedMemoryRefs<=16?safe.exportedMemoryRefs:null,",',
 ' "       usableMemoryRefs:Number.isInteger(safe.usableMemoryRefs)&&safe.usableMemoryRefs>=0&&safe.usableMemoryRefs<=16?safe.usableMemoryRefs:null,",',
 ' "       maxStartPages:Number.isInteger(safe.maxStartPages)&&safe.maxStartPages>=0&&safe.maxStartPages<=65536?safe.maxStartPages:null,",',
 ' "       maxEndPages:Number.isInteger(safe.maxEndPages)&&safe.maxEndPages>=0&&safe.maxEndPages<=65536?safe.maxEndPages:null,",',
 ' "       maxIncreasePages:Number.isInteger(safe.maxIncreasePages)&&safe.maxIncreasePages>=0&&safe.maxIncreasePages<=65536?safe.maxIncreasePages:null,",'
].join('\n');
adapted=adapted.replace(fieldAnchor,fieldAnchor+'\n'+fields);
const gate="derived=derived.replace(terminal,terminal+'\\n'+extra);";
unique(adapted,gate,'M237 genuine Worker terminal gate');
const newGate='const m238Required='+
 JSON.stringify('"  assert.ok(evidence.workerEvents.some(e=>e.type===\'diagnostic\'&&e.phase===\'p238_memory_snapshot\'&&e.memorySnapshotHooks===2),\'M238 missing original Worker WASM import/export memory snapshot\');",')+
 ';\n'+
 "derived=derived.replace(terminal,terminal+'\\n'+extra+'\\n'+m238Required);";
adapted=adapted.replace(gate,newGate);
assert.ok(adapted.includes('state.cards>0&&state.cards<=12'));
assert.ok(adapted.includes('P101 true P94 model/owner failure; preserve RED'));
assert.ok(!extended.includes('originalPhoto')&&!extended.includes('sourceSHA256')&&!extended.includes('modelWeights'));
const temp=resolve('scripts/.main238-original-p94-memory-reference-research.mjs');
try{
 await writeFile(temp,adapted,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'M238 composed P101/M237 source syntax invalid: '+String(syntax.stderr||'').slice(0,350));
 const sourceOnly=process.env.M238_SOURCE_ONLY==='1';
 const execution=spawnSync(process.execPath,[temp],{
  env:{...process.env,M237_SOURCE_ONLY:sourceOnly?'1':'0'},
  stdio:'inherit',timeout:20*60*1000
 });
 if(execution.error)throw execution.error;
 assert.equal(execution.status,0,
  'M238 original true P94 model/owner red, preserve all failures and no retries');
 if(sourceOnly)console.log('M238_PINNED_NATIVE_WASM_MEMORY_SNAPSHOT_SOURCE_PASS',JSON.stringify({
  pinnedOriginalP101:true,pinnedOriginalM237:true,
  strictModelAndOwnerJourneyUnchanged:true,
  importedAndExportedMemorySnapshotsOnly:true,
  noMemoryContents:true,failedModelRemainsRed:true,hold:true,releaseAuthorized:false
 }));
}finally{await rm(temp,{force:true});}
