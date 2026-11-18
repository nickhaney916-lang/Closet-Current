/**
 * M214: run the ORIGINAL P94 genuine browser acceptance with read-only
 * worker-message metadata probes. Do not replace Worker, WASM, model, image,
 * inference, normal UI or the original assertion that cards must be > 0.
 * This script reads the immutable source, instruments only scalar observations,
 * and still exits nonzero when actual recognition fails.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

/** M226 instrumented real model: never synthetic positive or retry. */
const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const original=await readFile(originalPath,'utf8');
const expectedSource='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
// M216: original test script's static M58 receipt names the OLD P94 worker.
// Assert exact real source Git blobs and correct only that diagnostic receipt in
// a disposable copy. All original substantive assertions remain unchanged.
const gitBlobSHA=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const originalBytes=Buffer.from(original,'utf8');
const workerBytes=await readFile('public/outfit-worker-p94.mjs');
assert.equal(gitBlobSHA(originalBytes),expectedSource,'original P94 browser test changed');
const testedWorkerSHA='d66651b616de54c51eb7ef986324b30f1580888f';
assert.equal(gitBlobSHA(workerBytes),testedWorkerSHA,'M216 tested P94 worker source changed');
const oldWorkerLabel="actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f'";
const currentWorkerLabel="actualWorkerSourceBlob:'"+testedWorkerSHA+"'";
assert.equal(original.split(oldWorkerLabel).length,2,'original source receipt changed');
const stageInstall=" await context.route('**/*',route=>{";
const probeBefore=" assert.ok(state.cards>0&&state.cards<=12,\n";
assert.equal(original.split(stageInstall).length,2,'original browser route prelude changed');
assert.equal(original.split(probeBefore).length,2,'original fail-closed P94 assertion changed');

const init=[
 "  // M214: attach a passive metadata-only listener to the REAL P94 Worker.",
 "  await context.addInitScript(() => {",
 "   window.__m214WorkerMessages=[];",
 "   const NativeWorker=window.Worker;",
 "   window.Worker=class extends NativeWorker {",
 "    constructor(url,opts) {",
 "     super(url,opts);",
 "     let path='';",
 "     try {path=new URL(String(url),location.href).pathname;} catch {}",
 "     if(path!=='/public/outfit-worker-p94.mjs')return;",
 "     const record=(type,data)=>{",
 "      const safe=data&&typeof data==='object'?data:{};",
 "      const events=window.__m214WorkerMessages;",
 "      if(type==='progress'&&events.at(-1)?.type==='progress'&&events.at(-1)?.phase===safe.phase)return;",
 "      if(events.length>=40)events.shift();",
 "      events.push({",
 "       type,phase:typeof safe.phase==='string'?safe.phase.slice(0,32):null,",
 "       reason:typeof safe.reason==='string'?safe.reason.slice(0,40):null,",
 "       count:Number.isInteger(safe.count)?safe.count:null,",
 "       groups:Number.isInteger(safe.segmentationGroups)?safe.segmentationGroups:null,",
 "       personDetected:typeof safe.personDetected==='boolean'?safe.personDetected:null",
 "       candidateCount:Number.isInteger(safe.candidateCount)?safe.candidateCount:null,",
 "       rawClassCounts:Array.isArray(safe.rawClassCounts)?safe.rawClassCounts.slice(0,18):null,",
 "       confidentGarmentPixels:Number.isInteger(safe.confidentGarmentPixels)?safe.confidentGarmentPixels:null,",
 "       outputArea:Number.isInteger(safe.outputArea)?safe.outputArea:null,",
 "      });",
 "     };",
 "     this.addEventListener('message',event=>{",
 "      const d=event.data||{};",
 "      if(['progress','piece','done','error','diagnostic'].includes(d.type))record(d.type,d);",
 "     });",
 "     this.addEventListener('error',()=>record('worker-error',null));",
 "     this.addEventListener('messageerror',()=>record('message-error',null));",
 "    }",
 "   };",
 "  });",
].join('\n')+'\n';
const output=[
 "  // M214: this is native original model evidence, not a success override.",
 "  // Never persist Worker piece buffers, photos, mask pixels, owner tokens or URLs.",
 "  const m214=await page.evaluate(()=>({",
 "   messages:window.__m214WorkerMessages||[],",
 "   status:document.getElementById('multi24Status')?.textContent||'',",
 "   cards:document.querySelectorAll('#multi24Grid .multi24-card').length,",
 "   active:window.multi24Research?.active===true,",
 "   working:!!window.multi24Research?.debug()?.working",
 "  }));",
 "  const evidence={",
 "   schema:'M214_P94_REAL_WEBKIT_REASON/v1',engine,width,attempt:process.env.M214_ATTEMPT||'one',",
 "   originalScriptBlob:process.env.M214_ORIGINAL_SCRIPT_BLOB||'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',",
 "   realWorkerSource:'/public/outfit-worker-p94.mjs',",
 "   realModelAttempted:external.some(x=>x.type==='pinned-model-hub'),",
 "   networkStatusCounts:Object.fromEntries([...new Set(modelResponses.map(x=>x.status))]",
 "    .map(code=>[code,modelResponses.filter(x=>x.status===code).length])),",
 "   rejectedRequestCount:rejected.length,pageErrorCount:issues.length,",
 "   status:m214.status,cards:m214.cards,workerEvents:m214.messages,",
 "   actualWorkerSeen:actualWorkerPaths94.includes('/public/outfit-worker-p94.mjs'),",
 "   success:m214.cards>0&&m214.cards<=12,",
 "   releaseAuthorized:false,physicalPhone:false,hostedRLS:false",
 "  };",
 "  await writeFile(join(out,'M214-P94-BOUNDED-WORKER-OUTCOME-'+(process.env.M214_ATTEMPT||'one')+'.json'),",
 "   JSON.stringify(evidence,null,2)+'\\n');",
 "  console.log('M214_REAL_P94_WORKER_OUTCOME',JSON.stringify(evidence));",
].join('\n')+'\n';
// M226 disposable worker: original pinned model/processor/weight source still
// used, and all original positive assertions remain mandatory. This probe adds
// scalar-only diagnostics, never owner/private photo, JPEG or full mask data.
const originalRead="  const body=await readFile(absolute);";
assert.equal(original.split(originalRead).length,2);
const workerSource=workerBytes.toString('utf8');
const groupsMarker="  const groups=!map.personDetected?[]:request.instanceReview840===true?";
assert.equal(workerSource.split(groupsMarker).length,2);
const scalarProbe=[
 "  // Research-only M226: counts only. Never emit mask, photo, owner or tokens.",
 "  const m226Area=output.logits.dims[2]*output.logits.dims[3],m226Counts=new Uint32Array(18);",
 "  for(let i=0;i<m226Area;i++){let best=-Infinity,chosen=0;",
 "    for(let c=0;c<18;c++){const value=output.logits.data[c*m226Area+i];",
 "      if(value>best){best=value;chosen=c;}}m226Counts[chosen]++;}",
 "  const m226Candidates=clothingMaskGroups(map);",
 "  self.postMessage({type:'diagnostic',id:request.id,personDetected:map.personDetected,",
 "   candidateCount:m226Candidates.length,rawClassCounts:Array.from(m226Counts),",
 "   confidentGarmentPixels:map.labels.reduce((n,v)=>n+(v!==0),0),outputArea:m226Area});"
].join('\n')+'\n';
const diagWorker=workerSource.replace(groupsMarker,scalarProbe+groupsMarker);
const overrideRead="  const body=path==='/public/outfit-worker-p94.mjs'?Buffer.from("+JSON.stringify(diagWorker)+",'utf8'):await readFile(absolute);";
const adapted=original.replace(originalRead,overrideRead)
 .replace(stageInstall,init+stageInstall).replace(probeBefore,output+probeBefore)
 .replace(oldWorkerLabel,currentWorkerLabel);
assert.ok(adapted.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
assert.equal(adapted.split('M214_REAL_P94_WORKER_OUTCOME').length,2);
assert.ok(adapted.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
assert.equal(adapted.split('M214_REAL_P94_WORKER_OUTCOME').length,2);
const temp=resolve('scripts/.main226-scalar-webkit-cause-probe.mjs');
const engine=process.env.M58_ENGINE||'webkit';
const width=process.env.P94_WIDTH||'430';
assert.ok(['chromium','webkit'].includes(engine));
assert.ok(['320','390','430'].includes(width));
try {
 await writeFile(temp,adapted,{flag:'wx'});
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width,M214_ORIGINAL_SCRIPT_BLOB:expectedSource},
  stdio:'inherit',timeout:18*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,
  'M226 real P94 failed; retain real negative evidence, no retry or weaker positive');
} finally {await rm(temp,{force:true});}
