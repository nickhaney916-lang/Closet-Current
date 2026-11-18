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

const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const original=await readFile(originalPath,'utf8');
const expectedSource='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
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
 "      if(window.__m214WorkerMessages.length>=40)return;",
 "      const safe=data&&typeof data==='object'?data:{};",
 "      window.__m214WorkerMessages.push({",
 "       type,phase:typeof safe.phase==='string'?safe.phase.slice(0,32):null,",
 "       reason:typeof safe.reason==='string'?safe.reason.slice(0,40):null,",
 "       count:Number.isInteger(safe.count)?safe.count:null,",
 "       groups:Number.isInteger(safe.segmentationGroups)?safe.segmentationGroups:null,",
 "       personDetected:typeof safe.personDetected==='boolean'?safe.personDetected:null",
 "      });",
 "     };",
 "     this.addEventListener('message',event=>{",
 "      const d=event.data||{};",
 "      if(['progress','piece','done','error'].includes(d.type))record(d.type,d);",
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
const adapted=original.replace(stageInstall,init+stageInstall).replace(probeBefore,output+probeBefore);
assert.ok(adapted.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
assert.equal(adapted.split('M214_REAL_P94_WORKER_OUTCOME').length,2);
const temp=resolve('scripts/.main214-real-p94-source-probe.mjs');
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
  'M214 original P94 native acceptance failed: retain the actual failed outcome, do not retry to green');
} finally {await rm(temp,{force:true});}
