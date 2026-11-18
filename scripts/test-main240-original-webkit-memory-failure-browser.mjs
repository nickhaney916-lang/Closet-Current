/**
 * M240 original-model, original-owner research-only WebKit memory witness.
 * Compose EXACT immutable P101/P237/P238/P239 sources in a disposable script.
 * No shipped Worker/model, source photo, privacy code or release gate modified.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {M238_WORKER_PROBE} from './main238-wasm-memory-observer-fixture.mjs';
import {M239_WORKER_PROBE} from './main239-grow-target-memory-fixture.mjs';
import {M240_WORKER_PROBE} from './main240-webkit-memory-checkpoint-fixture.mjs';

const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const p101Bytes=await readFile('scripts/test-parallel101-real-p94-model-init-stage-browser.mjs');
const p237Bytes=await readFile('scripts/test-main237-native-p101-wasm-memory-probe.mjs');
assert.equal(blob(p101Bytes),'ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab');
assert.equal(blob(p237Bytes),'e281589a2f482791875ba2b9b51d0f215bc1af77');
assert.equal(blob(await readFile('public/outfit-worker-p94.mjs')),'d66651b616de54c51eb7ef986324b30f1580888f');
assert.equal(blob(await readFile('scripts/main239-grow-target-memory-fixture.mjs')),'3afb59500cdf7e51b2baf828abe6c5590bccd899');
assert.equal(blob(await readFile('scripts/main238-wasm-memory-observer-fixture.mjs')),'2d3a927a760af39918b0204880a715523426e713');
const p237Line=p237Bytes.toString('utf8').split('\n').find(x=>x.startsWith('const workerProbe='));
assert.ok(p237Line?.endsWith(';'),'M237 memory probe declaration changed');
const originalProbe=JSON.parse(p237Line.slice('const workerProbe='.length,-1));
const combined=originalProbe+'\n'+M238_WORKER_PROBE+'\n'+M239_WORKER_PROBE+'\n'+M240_WORKER_PROBE;
for(const name of ['p237Install','p238Install','p239Attach','p240Start','p237Emit','p238Emit','p239Emit','p240Finish']){
 assert.ok(combined.includes('function '+name+'('),'Missing '+name+' pass-through observer');
}
let p101=p101Bytes.toString('utf8');
const unique=(s,k,label)=>assert.equal(s.split(k).length,2,label+' source moved');
const lineWith=(needle,label)=>{
 const lines=p101.split('\n').filter(x=>x.includes(needle));
 assert.equal(lines.length,1,label+' source line moved');
 return lines[0];
};

// Allowlist bounded numeric memory fields in the existing real Worker listener.
// These are page counts, never buffers or WASM/owner/model bytes.
const fieldAnchor=lineWith('stageOnly:true','P101 listener');
const fields=[
 'targetHookInstalled:safe.targetHookInstalled===true,',
 'growTargetRefs:Number.isInteger(safe.growTargetRefs)&&safe.growTargetRefs>=0&&safe.growTargetRefs<=16?safe.growTargetRefs:null,',
 'targetJsCalls:Number.isInteger(safe.targetJsCalls)&&safe.targetJsCalls>=0&&safe.targetJsCalls<=100000?safe.targetJsCalls:null,',
 'targetFirstPages:Number.isInteger(safe.targetFirstPages)&&safe.targetFirstPages>=0&&safe.targetFirstPages<=65536?safe.targetFirstPages:null,',
 'targetAfterJsPages:Number.isInteger(safe.targetAfterJsPages)&&safe.targetAfterJsPages>=0&&safe.targetAfterJsPages<=65536?safe.targetAfterJsPages:null,',
 'targetTerminalPages:Number.isInteger(safe.targetTerminalPages)&&safe.targetTerminalPages>=0&&safe.targetTerminalPages<=65536?safe.targetTerminalPages:null,',
 'watchCount:Number.isInteger(safe.watchCount)&&safe.watchCount>=0&&safe.watchCount<=32?safe.watchCount:null,',
 'watchTargetRefs:Number.isInteger(safe.watchTargetRefs)&&safe.watchTargetRefs>=0&&safe.watchTargetRefs<=16?safe.watchTargetRefs:null,',
 'watchPages:Number.isInteger(safe.watchPages)&&safe.watchPages>=0&&safe.watchPages<=65536?safe.watchPages:null,',
 'watchAfterJsPages:Number.isInteger(safe.watchAfterJsPages)&&safe.watchAfterJsPages>=0&&safe.watchAfterJsPages<=65536?safe.watchAfterJsPages:null,',
 'watchJsCalls:Number.isInteger(safe.watchJsCalls)&&safe.watchJsCalls>=0&&safe.watchJsCalls<=100000?safe.watchJsCalls:null,',
 'watchElapsedMs:Number.isInteger(safe.watchElapsedMs)&&safe.watchElapsedMs>=0&&safe.watchElapsedMs<=600000?safe.watchElapsedMs:null,',
 'watchTerminal:safe.watchTerminal===true,'
].map(x=>' "       '+x+'",').join('\n');
p101=p101.replace(fieldAnchor,fields+'\n'+fieldAnchor);

// Attach M237 and M238, then M239 (the actual retained Memory object) and
// M240 checkpoints at P101's one real SegFormer ONNX model-session start.
// All four observers are pass-through. No catch or model return is overridden.
const hookAnchor=lineWith('diagWorker=diagWorker.replace(p101ModelAnchor','P101 WebAssembly start');
const modelOK="self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'ok'";
const modelError="self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'error'";
const addon=[
 'const m240Observer='+JSON.stringify(combined)+';',
 "diagWorker=m240Observer+'\\n'+diagWorker;",
 'const m240Start='+JSON.stringify('  p101WasmProbe(requestId);\n')+';',
 "assert.equal(diagWorker.split(m240Start).length,2,'M240 model start moved');",
 "diagWorker=diagWorker.replace(m240Start,'  p101WasmProbe(requestId);\\n  p237Install(requestId);\\n  p238Install(requestId);\\n  p239Attach(requestId);\\n  p240Start(requestId);\\n');",
 'const m240Success='+JSON.stringify(modelOK)+';',
 'const m240Failure='+JSON.stringify(modelError)+';',
 "assert.equal(diagWorker.split(m240Success).length,2,'M240 original model success moved');",
 "assert.equal(diagWorker.split(m240Failure).length,2,'M240 original model failure moved');",
 "diagWorker=diagWorker.replace(m240Success,'p237Emit(requestId);p238Emit(requestId);p239Emit(requestId);p240Finish(requestId);'+m240Success);",
 "diagWorker=diagWorker.replace(m240Failure,'p237Emit(requestId);p238Emit(requestId);p239Emit(requestId);p240Finish(requestId);'+m240Failure);"
].join('\n');
p101=p101.replace(hookAnchor,hookAnchor+'\n'+addon);

// In the ORIGINAL browser's timeout catch the normal M214 terminal evidence
// can be skipped. Preserve its nonzero exit; snapshot only previously
// sanitized diagnostic Worker events through the disposable test page.
const buildAnchor=lineWith('const originalWithNegative=zeroAwareOriginal.replace','P101 browser original');
const catchAnchor="}catch(e){\n console.error('M58_REAL_P88_WORKER_FAIL'";
const pageAnchor=' const page=await context.newPage();';
const safeCatch=[
 'try{',
 ' const events=await globalThis.__m240SnapshotPage?.evaluate(()=>(window.__m214WorkerMessages||[])',
 "  .filter(x=>x?.type==='diagnostic'&&['p240_memory_checkpoint','p239_target_memory_terminal','model_session_load'].includes(x.phase))",
 '  .slice(-32).map(x=>({phase:x.phase,outcome:x.outcome,watchCount:x.watchCount,',
 '   watchPages:x.watchPages,watchAfterJsPages:x.watchAfterJsPages,',
 '   watchJsCalls:x.watchJsCalls,watchElapsedMs:x.watchElapsedMs,',
 '   watchTerminal:x.watchTerminal,watchTargetRefs:x.watchTargetRefs,',
 '   growTargetRefs:x.growTargetRefs,targetTerminalPages:x.targetTerminalPages,',
 '   errorCategory:x.errorCategory,errorName:x.errorName,messageCode:x.messageCode})));',
 " console.log('M240_FAILURE_BOUNDARY_MEMORY',JSON.stringify({",
 '  available:Array.isArray(events),events:Array.isArray(events)?events:[]',
 ' }));',
 '}catch{',
 " console.log('M240_FAILURE_BOUNDARY_MEMORY',JSON.stringify({available:false,events:[]}));",
 '}'
].join('\n');
const prep=[
 'const m240CatchAnchor='+JSON.stringify(catchAnchor)+';',
 'const m240PageAnchor='+JSON.stringify(pageAnchor)+';',
 "assert.equal(zeroAwareOriginal.split(m240CatchAnchor).length,2,'P94 original catch moved');",
 "assert.equal(zeroAwareOriginal.split(m240PageAnchor).length,2,'P94 original page moved');",
 "const m240Original=zeroAwareOriginal.replace(m240PageAnchor,m240PageAnchor+'\\n globalThis.__m240SnapshotPage=page;')",
 " .replace(m240CatchAnchor,'}catch(e){\\n'+("+JSON.stringify(safeCatch)+")+'\\n console.error(\\'M58_REAL_P88_WORKER_FAIL\\'');",
 'const originalWithNegative=m240Original.replace(originalNetworkCounters,negativeNetworkCounters)'
].join('\n');
p101=p101.replace(buildAnchor,prep);

// Require genuine ORT memory target on positive browser paths only, preserving
// P101's existing controlled network-abort negative and original >0 cards.
const acceptance=lineWith('P101 missing genuine Worker model-init stage messages','P101 evidence');
const newGate="  if(process.env.P101_TEST_FAULT!=='model_weights_abort')assert.ok(evidence.workerEvents.some(e=>e.phase==='p240_memory_checkpoint'&&e.watchTerminal===true&&e.watchTargetRefs>0&&e.watchPages>0),'M240 real model target checkpoint missing');";
p101=p101.replace(acceptance,acceptance+'\n'+JSON.stringify(newGate)+',');
assert.ok(p101.includes('state.cards>0&&state.cards<=12'));
assert.ok(p101.includes('P101 true P94 model/owner failure; preserve RED'));
assert.ok(p101.includes('M240_FAILURE_BOUNDARY_MEMORY'));
for(const disallowed of ['Uint8Array','DataView','originalPhoto','sourceSHA256','modelWeights']){
 assert.ok(!M240_WORKER_PROBE.includes(disallowed),'Forbidden Worker probe content: '+disallowed);
}
const temp=resolve('scripts/.main240-p101-model-memory-browser.mjs');
try{
 await writeFile(temp,p101,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'M240 generated native P101 script syntax RED: '+String(syntax.stderr||'').slice(0,450));
 if(process.env.M240_SOURCE_ONLY==='1'){
  console.log('M240_PINNED_ORIGINAL_SOURCE_FAILURE_GATE_PASS',JSON.stringify({
   pinnedP101:true,unmodifiedP94Worker:true,originalNativeMemoryTarget:true,
   tenSecondCheckpoints:true,timeoutFailureReceipt:true,
   strictOwnerSourceReviewAndV4:true,redRemainsRed:true,noPII:true,
   familyAlphaHold:true,releaseAuthorized:false}));
 }else{
  const run=spawnSync(process.execPath,[temp],{env:process.env,stdio:'inherit',timeout:21*60*1000});
  if(run.error)throw run.error;
  assert.equal(run.status,0,'M240 genuine original model/owner browser RED (never retry or fake success)');
 }
}finally{await rm(temp,{force:true});}
