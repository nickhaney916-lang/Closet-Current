/**
 * M214: P94 430px real WebKit intermittent zero review / model-error provenance; immutable original Git sources, diagnostic copies
 * served by a temporary local HTTP browser test server only.
 * Fail when any real WebKit SegFormer/garment-proposal assertion fails.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const pins={
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/multi-garment-capture-01/review-ui.mjs':'d478fcf6e4e8889a23b1620b444667ac949da7a9',
 'public/outfit-segmentation.mjs':'d357955dd8fdab7c0cb727ea597c270edd9309ac',
 'scripts/test-main58-actual-p88-wasm-browser.mjs':'96ba2f5ee2420de52f45911881fdcc139455c353'
};
for(const [path,sha] of Object.entries(pins))assert.equal(
 execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim(),
 sha,'M178 immutable donor changed '+path);
function replaceOnly(source,old,replacement,name){
 assert.equal(source.split(old).length,2,'M178 source changed: '+name);
 return source.replace(old,replacement);
}
let worker=readFileSync('public/outfit-worker-p94.mjs','utf8');
let ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
let native=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
worker=replaceOnly(worker,
 'chain=chain.then(async()=>{\n try{',
 "chain=chain.then(async()=>{\n let m178Stage='verify-input';\n try{",
 'error-stage');
worker=replaceOnly(worker,
 'const {model,processor,RawImage}=await load(request.id);self.postMessage',
 "const {model,processor,RawImage}=await load(request.id);m178Stage='decode';self.postMessage",
 'load');
worker=replaceOnly(worker,
 'const image=await RawImage.read(request.image);if(',
 "const image=await RawImage.read(request.image);m178Stage='inference';if(",
 'decode');
worker=replaceOnly(worker,
 'const output=await model(await processor(image)),{',
 "const output=await model(await processor(image));m178Stage='mask';const {",
 'actual inference');
worker=replaceOnly(worker,
 "self.postMessage({type:'done',id:request.id,count});",
 "self.postMessage({type:'done',id:request.id,count,m178Diagnostic:{stage:m178Stage,personDetected:map.personDetected,regionCount:groups.length,nonzeroMaskPixels:map.labels.reduce((n,v)=>n+(v!==0),0)}});",
 'nonzero real mask');
const oldError="}catch{self.postMessage({type:'error',id:request.id,text:'This outfit could not be separated on this device. Your existing photos are kept. Try another clear photo of one person, head to toe.'});}";
const newError=[
 '}catch(error){',
 " const raw=String(error?.message||'').toLowerCase();",
 " const category=raw.includes('memory')?'memory':raw.includes('wasm')?'wasm':raw.includes('tensor')?'tensor':raw.includes('shape')?'shape':raw.includes('fetch')||raw.includes('network')?'network':raw.includes('abort')?'abort':'other';",
 " self.postMessage({type:'error',id:request.id,text:'Automatic extraction unavailable. Your original photo is retained.',",
 "  m178Diagnostic:{stage:m178Stage,exceptionType:String(error?.name||'Error').slice(0,48),category}});",
 '}'
].join('\n');
worker=replaceOnly(worker,oldError,newError,'hidden worker exception');
ui=replaceOnly(ui,
 "if(data.type==='done'||data.type==='error'){\n      next.terminal=true;",
 "if(data.type==='done'||data.type==='error'){\n      status.dataset.m178Diagnostic=JSON.stringify(data.m178Diagnostic||{stage:'no-detail'});\n      next.terminal=true;",
 'owner-interface evidence slot');
const base='scripts/.m214-'+process.pid;
const workerFile=base+'-worker.mjs',uiFile=base+'-ui.mjs',testFile=base+'-p94.mjs';
try{
 writeFileSync(workerFile,worker,{flag:'wx'});
 writeFileSync(uiFile,ui,{flag:'wx'});
 const serverReplacement="  const body=await readFile(absolute.endsWith('/public/outfit-worker-p94.mjs')?"+JSON.stringify(workerFile)+":absolute.endsWith('/research/multi-garment-capture-01/review-ui.mjs')?"+JSON.stringify(uiFile)+":absolute);";
 native=replaceOnly(native,'  const body=await readFile(absolute);',serverReplacement,'disposable local HTTP worker');
 const receipt=[
 "  const m178Diagnostic=await page.evaluate(()=>document.getElementById('multi24Status')?.dataset?.m178Diagnostic||'none');",
 "  console.log('M214_REAL_WEBKIT_430_DIAGNOSTIC',JSON.stringify({engine,width,",
 "   modelActuallyRun:true,licensedOriginal:true,proposals:state.cards,",
 "   status:state.status.slice(0,150),outcome:m178Diagnostic,",
 "   responseCodes:modelResponses.map(x=>x.status),unexpectedOutbound:rejected.length}));",
 " assert.ok(external.some(x=>x.type==='pinned-browser-library'),"
 ].join('\n');
 native=replaceOnly(native,
 " assert.ok(external.some(x=>x.type==='pinned-browser-library'),",
 receipt,'observed WebKit diagnostic before ORIGINAL assert');
 writeFileSync(testFile,native,{flag:'wx'});
 for(const path of [workerFile,uiFile,testFile]){
  const check=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  assert.equal(check.status,0,path+': '+String(check.stderr));
 }
 if(process.env.M178_SELF_CHECK==='true'){
  console.log('M214_DIAGNOSTIC_SOURCE_CHECK_PASS',JSON.stringify({
   exactPins:Object.keys(pins).length,workerMocked:false,
   originalNativeAssertionsUnchanged:true,sourcePhotoLogged:false,
   ownerAccountLogged:false,productionSourceModified:false}));
 }else{
  // Run an ORIGINAL unmodified P94 source/model/owner journey before the
  // instrumented probes to reveal sequence-dependent WebKit model failures.
  // Keep failures red, but run diagnostic probes afterward to classify them.
  let originalPrelude=null;
  if(process.env.M178_ORIGINAL_P94_PRELUDE==='true'){
   const p=spawnSync(process.execPath,['scripts/test-parallel94-native-p88-browser.mjs'],{
    env:{...process.env,M58_ENGINE:'webkit',P94_WIDTH:'430'},
    stdio:'inherit',timeout:12*60*1000});
   originalPrelude={exitCode:p.status,error:p.error?.code||null,originalUnmodified:true};
   console.log('M214_ORIGINAL_P94_430_WEBKIT_PRELUDE',JSON.stringify(originalPrelude));
  }
  const widths=[430,430,430,430];
  const count=Number(process.env.M178_PROBE_COUNT||2);
  assert.ok(Number.isInteger(count)&&count>=1&&count<=4);
  const results=[];
  for(let i=0;i<count;i++){
   console.log('M214_GENUINE_WEBKIT_430_PROBE_BEGIN',JSON.stringify({attempt:i+1,width:widths[i]}));
   const p=spawnSync(process.execPath,[testFile],{
    env:{...process.env,M58_ENGINE:'webkit',P94_WIDTH:String(widths[i])},
    stdio:'inherit',timeout:12*60*1000});
   results.push({attempt:i+1,width:widths[i],code:p.status,error:p.error?.code||null});
  }
  console.log('M214_EXACT_MODEL_430_PROBE_RESULTS',JSON.stringify({
   originalPrelude,attempts:results,inferenceMocked:false,diagnosticCopiesOnly:true,
   hostedSecurityTested:false,physicalPhone:false,familyAlpha:'HOLD'}));
  if((originalPrelude&&(originalPrelude.exitCode!==0||originalPrelude.error))||
     results.some(x=>x.code!==0||x.error))process.exitCode=1;
 }
}finally{
 for(const file of [testFile,uiFile,workerFile])rmSync(file,{force:true});
}
