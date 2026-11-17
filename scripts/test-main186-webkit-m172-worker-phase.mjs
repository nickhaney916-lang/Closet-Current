/**
 * M186: current held-source M172 native WebKit 24MP real-model error classification.
 * Only temporary local HTTP response copies of the real P88 worker and UI are
 * annotated. Original M172/P96 strict source/owner/private-state assertions
 * remain unmodified and the actual SegFormer/WASM model still runs.
 * NO private pixels/tokens/identifiers, raw exceptions or model weights logged.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';

const pins={
 'scripts/test-main172-24mp-private-state-invariance.mjs':'ad4cb6bfee719b6083b9abc6d11ade2551e77c58',
 'scripts/test-parallel96-native-highres-browser.mjs':'58194c1bbcfca7b46f1c71b1ee0cc00c3dbc88c7',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/multi-garment-capture-01/review-ui.mjs':'d478fcf6e4e8889a23b1620b444667ac949da7a9',
 'research/parallel96-highres/source-derivative-intake96.mjs':'1840c4496aefc28941f4c3de24a29bac1cb5e792',
 'public/outfit-capture.js':'8d55715ef09e34086d3c401ec38340bfc25f5fe8',
 'public/app.js':'835b4ad1f4a4a7f520aad5afd225134e5ea56e2d'
};
for(const [path,sha] of Object.entries(pins))assert.equal(
 execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim(),sha,
 'M186 exact original held source changed: '+path);
assert.equal(process.env.M58_ENGINE||'webkit','webkit','M186 is native WebKit-only');
function replaceOnce(source,old,next,reason){
 assert.equal(source.split(old).length,2,'M186 source anchor changed: '+reason);
 return source.replace(old,next);
}
const base='scripts/.m186-'+process.pid;
const workerPath=base+'-worker.mjs',uiPath=base+'-ui.mjs',driverPath=base+'-m172.mjs';
let worker=readFileSync('public/outfit-worker-p94.mjs','utf8');
let ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
let driver=readFileSync('scripts/test-main172-24mp-private-state-invariance.mjs','utf8');
worker=replaceOnce(worker,
 'chain=chain.then(async()=>{\n try{',
 "chain=chain.then(async()=>{\n let m186Stage='verify-source';\n try{",
 'worker phase entry');
worker=replaceOnce(worker,
 'const {model,processor,RawImage}=await load(request.id);self.postMessage',
 "m186Stage='load-model';const {model,processor,RawImage}=await load(request.id);m186Stage='decode';self.postMessage",
 'model load');
worker=replaceOnce(worker,
 'const image=await RawImage.read(request.image);if(',
 "const image=await RawImage.read(request.image);m186Stage='inference';if(",
 'decode');
worker=replaceOnce(worker,
 'const output=await model(await processor(image)),{',
 "const output=await model(await processor(image));m186Stage='segment-mask';const {",
 'real inference');
worker=replaceOnce(worker,
 '  const sourceSha256=request.instanceReview70===true?',
 "  m186Stage='make-proposals';\n  const sourceSha256=request.instanceReview70===true?",
 'mask to proposals');
worker=replaceOnce(worker,
 "self.postMessage({type:'done',id:request.id,count});",
 "self.postMessage({type:'done',id:request.id,count,m186Diagnostic:{stage:'complete',personDetected:map.personDetected===true,regionCount:groups.length,nonzeroMaskPixels:map.labels.reduce((n,v)=>n+(v!==0),0)}});",
 'genuine mask evidence');
worker=replaceOnce(worker,
 "}catch{self.postMessage({type:'error',id:request.id,text:'This outfit could not be separated on this device. Your existing photos are kept. Try another clear photo of one person, head to toe.'});}",
 [
 "}catch(error){",
 " const raw=String(error?.message||'').toLowerCase();",
 " const category=raw.includes('memory')?'memory':raw.includes('wasm')?'wasm':raw.includes('tensor')?'tensor':raw.includes('shape')?'shape':raw.includes('fetch')||raw.includes('network')?'network':raw.includes('abort')?'abort':raw.includes('out of bounds')?'bounds':'other';",
 " self.postMessage({type:'error',id:request.id,text:'This outfit could not be separated on this device. Your existing photos are kept. Try another clear photo of one person, head to toe.',",
 "  m186Diagnostic:{stage:m186Stage,category,exceptionType:String(error?.name||'Error').slice(0,48)}});",
 "}"
 ].join('\n'),'hidden worker error');
ui=replaceOnce(ui,
 "     if(data.type==='done'||data.type==='error'){\n      next.terminal=true;",
 [
 "     if(data.type==='done'||data.type==='error'){",
 "      const d186=data.m186Diagnostic||{};",
 "      console.log('M186_NATIVE_WEBKIT_WORKER_TERMINAL',JSON.stringify({",
 "       kind:data.type==='error'?'error':'done',",
 "       stage:String(d186.stage||'not-provided').slice(0,32),",
 "       category:String(d186.category||'none').slice(0,24),",
 "       exceptionType:String(d186.exceptionType||'none').slice(0,48),",
 "       personDetected:d186.personDetected===true,",
 "       regions:Number.isInteger(d186.regionCount)?d186.regionCount:null,",
 "       nonzeroMaskPixels:Number.isInteger(d186.nonzeroMaskPixels)?d186.nonzeroMaskPixels:null",
 "      }));",
 "      next.terminal=true;"
 ].join('\n'),'UI terminal phase classification');

const serverReplacement=
 "  const body=await readFile(absolute.endsWith('/public/outfit-worker-p94.mjs')?"+
 JSON.stringify(workerPath)+":absolute.endsWith('/research/multi-garment-capture-01/review-ui.mjs')?"+
 JSON.stringify(uiPath)+":absolute);";
const browserReplacement=[
 " const page=await context.newPage();",
 " page.on('console',message=>{",
 "  const safe=message.text();",
 "  if(safe.startsWith('M186_NATIVE_WEBKIT_WORKER_TERMINAL '))console.log(safe);",
 " });"
].join('\n');
const direct="const modified=original.replace(anchor,extension+'\\n'+anchor);";
const driverInsertion=[
 "let modified=original.replace(anchor,extension+'\\n'+anchor);",
 "function m186Only(s,old,next,label){",
 " if(s.split(old).length!==2)throw Error('M186 injected native source anchor moved: '+label);",
 " return s.replace(old,next);",
 "}",
 "modified=m186Only(modified,"+
  JSON.stringify('  const body=await readFile(absolute);')+","+
  JSON.stringify(serverReplacement)+",'read-only diagnostic HTTP worker copies');",
 "modified=m186Only(modified,"+
  JSON.stringify(' const page=await context.newPage();')+","+
  JSON.stringify(browserReplacement)+",'safe browser console listener');"
].join('\n');
driver=replaceOnce(driver,direct,driverInsertion,'M172 exact source derivation');
const created=[workerPath,uiPath,driverPath];
try{
 writeFileSync(workerPath,worker,{flag:'wx',mode:0o600});
 writeFileSync(uiPath,ui,{flag:'wx',mode:0o600});
 writeFileSync(driverPath,driver,{flag:'wx',mode:0o600});
 for(const file of created){
  const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:60000});
  if(checked.error)throw checked.error;
  assert.equal(checked.status,0,'M186 scratch syntax '+file+': '+String(checked.stderr).slice(0,350));
 }
 console.log('M186_SOURCE_PINNED_DIAGNOSTIC_CHECK',JSON.stringify({
  originalSourcePins:Object.keys(pins).length,
  originalAssertionsChanged:false,
  applicationFilesChanged:false,
  modelMocked:false,
  classificationOnly:true,
  familyAlpha:'HOLD'
 }));
 if(process.env.M186_SELF_CHECK!=='true'){
  const child=spawnSync(process.execPath,[driverPath],{
   env:{...process.env,M58_ENGINE:'webkit',P94_WIDTH:'390',P96_NATIVE_4K:'true'},
   stdio:'inherit',timeout:18*60*1000
  });
  if(child.error)throw child.error;
  if(child.signal)throw Error('M186 real native WebKit child ended by signal '+child.signal);
  assert.equal(child.status,0,'M186 ORIGINAL M172 strict private-source acceptance FAILED');
  console.log('M186_GENUINE_NATIVE_M172_SOURCE_SAFETY_PASS',JSON.stringify({
   nativeWebKit:true,realInstalledWasmSegFormer:true,
   originalM172Assertions:true,
   originalSourcePrivateState:true,
   productionModified:false,
   familyAlpha:'HOLD'
  }));
 }
}finally{
 for(const file of created)rmSync(file,{force:true});
}
