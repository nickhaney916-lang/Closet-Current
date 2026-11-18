/**
 * M226: genuine installed P94 SegFormer Worker 430px outcome diagnosis.
 * No model, JPEG, application, threshold, owner data or test assertion edits.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const pins={
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'public/outfit-worker-p94.mjs':'d66651b616de54c51eb7ef986324b30f1580888f',
 'research/multi-garment-capture-01/review-ui.mjs':'1bd97b80b51fab1cb269ae565acb73a274b6e6d0',
 'public/outfit-segmentation.mjs':'d357955dd8fdab7c0cb727ea597c270edd9309ac'
};
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
for(const [file,sha] of Object.entries(pins))
 assert.equal(gitBlob(await readFile(file)),sha,'M226 protected source changed: '+file);
let adapted=await readFile(originalPath,'utf8');
function replaceOnly(from,to,label){
 assert.equal(adapted.split(from).length,2,'M226 anchor moved: '+label);
 adapted=adapted.replace(from,to);
}
replaceOnly("let browser,stage='startup';",
 "let browser,stage='startup',m226ProbePage=null;",'page outside try');
replaceOnly("const page=await context.newPage();",
 "const page=m226ProbePage=await context.newPage();",'native page');
const listener=[
 " // Read-only metadata; no pixels, masks, owner tokens or URLs.",
 " await context.addInitScript(()=>{",
 "  window.__m226Terminal=[];",
 "  const NativeWorker=window.Worker;",
 "  window.Worker=class extends NativeWorker {",
 "   constructor(url,options){",
 "    super(url,options);",
 "    let path='';try{path=new URL(String(url),location.href).pathname;}catch{}",
 "    if(path!=='/public/outfit-worker-p94.mjs')return;",
 "    const record=(kind,data)=>{",
 "     const events=window.__m226Terminal;",
 "     if(!Array.isArray(events)||events.length>=48)return;",
 "     const d=data&&typeof data==='object'?data:{};",
 "     const phase=['loading','separating'].includes(d.phase)?d.phase:null;",
 "     const reason=typeof d.reason==='string'&&/^P94_[a-z_]+$/.test(d.reason)?d.reason.slice(0,48):null;",
 "     if(kind==='progress'&&events.at(-1)?.kind==='progress'&&events.at(-1)?.phase===phase)return;",
 "     events.push({kind,phase,reason,count:Number.isInteger(d.count)?d.count:null,",
 "      groups:Number.isInteger(d.segmentationGroups)?d.segmentationGroups:null,",
 "      personDetected:typeof d.personDetected==='boolean'?d.personDetected:null});",
 "    };",
 "    this.addEventListener('message',event=>{",
 "     const data=event.data||{};",
 "     if(['progress','piece','done','error'].includes(data.type))record(data.type,data);",
 "    });",
 "    this.addEventListener('error',()=>record('worker-error',null));",
 "    this.addEventListener('messageerror',()=>record('message-error',null));",
 "   }",
 "  };",
 " });"
].join('\n')+'\n';
replaceOnly(" await context.route('**/*',route=>{",
 listener+" await context.route('**/*',route=>{",'read-only real native Worker');
const category=[
 "function m226Category226(status){",
 " if(/no unverified garment regions/i.test(status))return 'zero-regions';",
 " if(/unverified region/i.test(status))return 'reviewable';",
 " if(/automatic extraction unavailable|could not start/i.test(status))return 'worker-unavailable';",
 " if(/timed out/i.test(status))return 'timeout';",
 " return status?'other-status':'no-status';",
 "}"
].join('\n')+'\n';
replaceOnly("let browser,stage='startup',m226ProbePage=null;",
 category+"let browser,stage='startup',m226ProbePage=null;",'safe state category');
const before=[
 " const m226Success=await page.evaluate(()=>({",
 "  terminal:window.__m226Terminal||[],",
 "  status:document.getElementById('multi24Status')?.textContent||'',",
 "  cards:document.querySelectorAll('#multi24Grid .multi24-card').length",
 " }));",
 " console.log('M226_REAL_TERMINAL_BEFORE_ASSERT',JSON.stringify({",
 "  engine,width,attempt:process.env.M226_ATTEMPT||'single',workerEvents:m226Success.terminal,",
 "  statusCategory:m226Category226(m226Success.status),cards:m226Success.cards,",
 "  modelHttpCodes:modelResponses.map(x=>x.status),unexpectedOutbound:rejected.length,",
 "  modelMocked:false,privateDataLogged:false,familyAlpha:'HOLD'",
 " }));"
].join('\n')+'\n';
replaceOnly(" assert.ok(state.cards>0&&state.cards<=12,",
 before+" assert.ok(state.cards>0&&state.cards<=12,",'original zero proposal assertion');
const failure=[
 "}catch(e){",
 " const m226Failure=await m226ProbePage?.evaluate(()=>({",
 "  terminal:window.__m226Terminal||[],",
 "  status:document.getElementById('multi24Status')?.textContent||'',",
 "  cards:document.querySelectorAll('#multi24Grid .multi24-card').length,",
 "  busy:window.multi24Research?.debug()?.working??null",
 " })).catch(()=>null);",
 " const events=m226Failure?.terminal||[];",
 " const terminal=events.findLast(x=>x.kind==='done'||x.kind==='error');",
 " const cause=terminal?.kind==='error'?'caught-worker-error':",
 "  terminal?.kind==='done'&&terminal.count===0?'genuine-worker-zero-count':",
 "  terminal?.kind==='done'?'done-but-review-zero':",
 "  events.some(x=>x.kind==='worker-error')?'uncaught-worker-error':",
 "  events.some(x=>x.kind==='message-error')?'unreadable-message':",
 "  'no-worker-terminal-observed';",
 " console.error('M226_WEBKIT_FAILURE_CAUSAL_DIAGNOSTIC',JSON.stringify({",
 "  engine,width,attempt:process.env.M226_ATTEMPT||'single',stage,category:cause,",
 "  workerEvents:events,statusCategory:m226Category226(m226Failure?.status||''),",
 "  cards:m226Failure?.cards??null,busy:m226Failure?.busy??null,",
 "  modelHttpCodes:modelResponses.map(x=>x.status),unexpectedOutbound:rejected.length,",
 "  modelMocked:false,ownerDataLogged:false,releaseAuthorized:false",
 " }));"
].join('\n')+'\n';
replaceOnly("}catch(e){",failure,'capture failure BEFORE original catch');
replaceOnly("actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f'",
 "actualWorkerSourceBlob:'d66651b616de54c51eb7ef986324b30f1580888f'",
 'source receipt only (model untouched)');
assert.ok(adapted.includes("assert.ok(state.cards>0&&state.cards<=12"));
assert.ok(adapted.includes("Genuine P88 browser worker did not produce a bounded actual model proposal"));
assert.ok(adapted.includes("M226_WEBKIT_FAILURE_CAUSAL_DIAGNOSTIC"));
assert.ok(adapted.includes("M226_REAL_TERMINAL_BEFORE_ASSERT"));
const temp=resolve('scripts/.m226-native-p94-terminal-'+process.pid+'.mjs');
const engine=process.env.M58_ENGINE||'webkit';
const width=process.env.P94_WIDTH||'430';
assert.ok(['webkit','chromium'].includes(engine));
assert.ok(['320','390','430'].includes(width));
if(process.env.M226_SELF_CHECK==='1'){
 console.log('M226_STATIC_SOURCE_DIAGNOSTIC_PASS',JSON.stringify({
  pinnedSources:Object.keys(pins).length,originalNativeAssertionsRetained:true,
  actualModelUnmodified:true,workerEventsPassive:true,
  nativeFailureCaptured:true,modelMocked:false,releaseAuthorized:false
 }));
}else{
 try{
  await writeFile(temp,adapted,{flag:'wx'});
  const run=spawnSync(process.execPath,[temp],{
   env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width},
   stdio:'inherit',timeout:16*60*1000
  });
  if(run.error)throw run.error;
  assert.equal(run.status,0,'M226 genuine original P94 model test RED; preserve actual failing evidence');
 }finally{await rm(temp,{force:true});}
}
