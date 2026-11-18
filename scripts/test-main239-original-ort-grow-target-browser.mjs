/**
 * M239: layer ONTO immutable, already-verified M238 original P94 model and
 * source-owner journey. No product Worker or original model/assets changed.
 * M238's import/export path could not see an ORT linear-memory reference.
 * M237 proved native JS Memory.prototype.grow received a real Memory object.
 * Retain THAT observed target and compare pages at original model terminal.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const srcPath='scripts/test-main238-original-wasm-memory-snapshot-browser.mjs';
const originalBytes=await readFile(srcPath);
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(gitBlob(originalBytes),'69f6817634ecc89ea4b1c6b1ebe5a4cff1a3c20b',
 'Immutable M238 browser donor changed; audit required');
let derived=originalBytes.toString('utf8');
const one=(anchor,name)=>assert.equal(derived.split(anchor).length,2,name+' anchor changed');
const m238Import="import {M238_WORKER_PROBE} from './main238-wasm-memory-observer-fixture.mjs';";
one(m238Import,'M238 pass-through fixture');
derived=derived.replace(m238Import,m238Import+
 "\nimport {M239_WORKER_PROBE} from './main239-grow-target-memory-fixture.mjs';");
const prefix="const extended=originalWorkerProbe+'\\n'+M238_WORKER_PROBE+";
one(prefix,'original P94 diagnostic Worker assembly');
derived=derived.replace(prefix,"const extended=originalWorkerProbe+'\\n'+M238_WORKER_PROBE+'\\n'+M239_WORKER_PROBE+");
const emission=" 'p237Emit=function(id){p238OriginalEmit(id);p238Emit(id);};\\n';";
one(emission,'M238 model-terminal observer');
derived=derived.replace(emission,
 " 'p237Emit=function(id){p238OriginalEmit(id);p238Emit(id);};\\n'+\n"+
 " 'const p239OriginalInstall=p237Install;\\n'+\n"+
 " 'p237Install=function(id){p239OriginalInstall(id);p239Attach(id);};\\n'+\n"+
 " 'const p239OriginalEmit=p237Emit;\\n'+\n"+
 " 'p237Emit=function(id){p239OriginalEmit(id);p239Emit(id);};\\n';");
const fieldStart='const fields=[';
one(fieldStart,'M238 bounded diagnostic schema');
const fields=[
 " ' \"       targetHookInstalled:safe.targetHookInstalled===true,\",',",
 " ' \"       growTargetRefs:Number.isInteger(safe.growTargetRefs)&&safe.growTargetRefs>=0&&safe.growTargetRefs<=16?safe.growTargetRefs:null,\",',",
 " ' \"       validTargetRefs:Number.isInteger(safe.validTargetRefs)&&safe.validTargetRefs>=0&&safe.validTargetRefs<=16?safe.validTargetRefs:null,\",',",
 " ' \"       targetJsCalls:Number.isInteger(safe.targetJsCalls)&&safe.targetJsCalls>=0&&safe.targetJsCalls<=100000?safe.targetJsCalls:null,\",',",
 " ' \"       targetJsErrors:Number.isInteger(safe.targetJsErrors)&&safe.targetJsErrors>=0&&safe.targetJsErrors<=100000?safe.targetJsErrors:null,\",',",
 " ' \"       targetFirstPages:Number.isInteger(safe.targetFirstPages)&&safe.targetFirstPages>=0&&safe.targetFirstPages<=65536?safe.targetFirstPages:null,\",',",
 " ' \"       targetAfterJsPages:Number.isInteger(safe.targetAfterJsPages)&&safe.targetAfterJsPages>=0&&safe.targetAfterJsPages<=65536?safe.targetAfterJsPages:null,\",',",
 " ' \"       targetTerminalPages:Number.isInteger(safe.targetTerminalPages)&&safe.targetTerminalPages>=0&&safe.targetTerminalPages<=65536?safe.targetTerminalPages:null,\",',",
 " ' \"       targetPostJsIncreasePages:Number.isInteger(safe.targetPostJsIncreasePages)&&safe.targetPostJsIncreasePages>=0&&safe.targetPostJsIncreasePages<=65536?safe.targetPostJsIncreasePages:null,\",',"
].join('\n');
derived=derived.replace(fieldStart,fieldStart+'\n'+fields);
// Maintain original final model/owner success-or-RED gates and M238 receipt.
// No overrides of original positive-card condition; no retry logic.
assert.ok(derived.includes('state.cards>0&&state.cards<=12'));
assert.ok(derived.includes('P101 true P94 model/owner failure; preserve RED'));
assert.ok(derived.includes('M238 missing original Worker WASM import/export memory snapshot'));
assert.ok(derived.includes('p239OriginalEmit=p237Emit'));
const temp=resolve('scripts/.main239-original-grow-target-research.mjs');
try{
 await writeFile(temp,derived,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'M239 generated M238 source syntax invalid: '+String(syntax.stderr||'').slice(0,350));
 const sourceOnly=process.env.M239_SOURCE_ONLY==='1';
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,M238_SOURCE_ONLY:sourceOnly?'1':'0'},
  stdio:'inherit',timeout:21*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,
  'M239 unchanged genuine P94 original-positive owner photo/2D/v4 RED (no retries)');
 if(sourceOnly)console.log('M239_SOURCE_LOCKED_GROW_TARGET_TELEMETRY_PROBE_PASS',JSON.stringify({
  originalP101:true,parentM237M238Immutable:true,
  actualMemoryGrowTargetRetained:true,
  sessionTerminalSnapshot:true,
  privateDataExcluded:true,strictOriginalCardAndOwnerAcceptance:true,
  releaseAuthorized:false,hold:true}));
}finally{await rm(temp,{force:true});}
