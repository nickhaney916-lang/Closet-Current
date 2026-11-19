/**
 * M249 one-time source-derived M247 original P94 JSEP failure witness.
 * This copies, does not edit, the exact verified M247 research runner.
 * Original production Worker, ONNX graph, public JPEG, owner/2D/v4 unchanged.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const original=await readFile('scripts/test-main247-real-p94-jsep-model-heap-browser.mjs');
assert.equal(blob(original),'92670c115a42f6408577de4d08d8dea24c263cd2',
 'Exact verified M247 original JSEP/heap model runner changed');
assert.equal(blob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Original P94 Worker changed');
assert.equal(blob(await readFile('scripts/test-parallel94-native-p88-browser.mjs')),
 '4f75a40cf153fa4b4d139d782b202dbe7bc55e41','Original owner/backup browser changed');
let source=original.toString('utf8');
function replaceOne(a,b){
 assert.equal(source.split(a).length,2,'M249 exact research donor anchor missing/ambiguous: '+a.slice(0,75));
 source=source.replace(a,b);
}
const imports="import assert from 'node:assert/strict';\nimport {readFile,writeFile,rm}";
replaceOne(imports,"import assert from 'node:assert/strict';\nimport {addM249OriginalErrorWitness,summarizeM249Failure} from './main249-original-failed-jsep-source-witness.mjs';\nimport {readFile,writeFile,rm}");
const worker="const observedWorker=deriveOriginalP94JsepObserver(originalWorker.toString('utf8'));";
replaceOne(worker,"const observedWorker=addM249OriginalErrorWitness(deriveOriginalP94JsepObserver(originalWorker.toString('utf8')));");
const oldListener=" \"     if(d?.type!=='diagnostic'||d?.phase!=='m247_jsep_memory')return;\",";
assert.equal(source.split(oldListener).length,2,'Original test Worker observer hook changed');
const newListener=[
 ' \"     if(d?.type===\'diagnostic\'&&d?.phase===\'m249_model_failure\'){\",',
 ' \"      const names=[\'RuntimeError\',\'Error\',\'RangeError\',\'TypeError\',\'NetworkError\',\'AbortError\',\'CompileError\',\'LinkError\'];\",',
 ' \"      const kinds=[\'wasm_memory_access\',\'memory_allocation\',\'wasm_compile\',\'wasm_link\',\'session\',\'network_abort\',\'network\',\'other\'];\",',
 ' \"      const safe={phase:\'m249_model_failure\',outcome:d.outcome===\'error\'?\'error\':\'other\',\",',
 ' \"       errorName:names.includes(d.errorName)?d.errorName:\'other\',category:kinds.includes(d.category)?d.category:\'other\'};\",',
 ' \"      console.log(\'M249_ORIGINAL_MODEL_FAILURE \'+JSON.stringify(safe));return;\",',
 ' \"     }\",',
 oldListener
].join('\n');
source=source.replace(oldListener,newListener);
const injectAt='assert.ok(source.includes("M58_REAL_P88_WORKER_FAIL"));';
const build=String.raw`
 // M249 local-only: exactly one original-browser failed attempt, same-run
 // public JSEP SHA and model-load category. No raw errors/pixels/auth logged.
 const stateAnchor="let browser,stage='startup';";
 assert.equal(source.split(stateAnchor).length,2);
 source=source.replace(stateAnchor,"const m249Errors=[],m249Heap=[];\n"+stateAnchor);
 const pageAnchor=" const page=await context.newPage();";
 assert.equal(source.split(pageAnchor).length,2);
 source=source.replace(pageAnchor,pageAnchor+"\n"+[
  " page.on('console',msg=>{",
  "  const value=msg.text();",
  "  if(value.startsWith('M249_ORIGINAL_MODEL_FAILURE ')){",
  "   try{const data=JSON.parse(value.slice('M249_ORIGINAL_MODEL_FAILURE '.length));",
  "    if(data?.phase==='m249_model_failure'&&m249Errors.length<8)m249Errors.push(data);}catch{}",
  "  }",
  "  if(value.startsWith('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT ')){",
  "   try{const data=JSON.parse(value.slice('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '.length));",
  "    const safe=sanitizeRealWorkerJsepMessage({type:'diagnostic',...data});",
  "    if(safe&&m249Heap.length<8)m249Heap.push(safe);}catch{}",
  "  }",
  " });"
 ].join('\n'));
 const routeGuard="  if(req.method()==='GET'&&(lib||hub||weights)){";
 assert.equal(source.split(routeGuard).length,2);
 source=source.replace(routeGuard,routeGuard+"\n"+
  "   if(process.env.M249_CONTROL==='model_abort'&&hub&&url.pathname.endsWith('.onnx'))"+
  "{return route.abort();}");
 const catchAnchor="}catch(e){\n console.error('M58_REAL_P88_WORKER_FAIL'";
 assert.equal(source.split(catchAnchor).length,2);
 source=source.replace(catchAnchor,"}catch(e){\n"+[
  " await Promise.race([Promise.allSettled(m247PublicPending),new Promise(ok=>setTimeout(ok,2500))]);",
  " const evidence249=summarizeM249Failure({engine,control:process.env.M249_CONTROL||'none',",
  "  assets:m247PublicAssets,errors:m249Errors,heap:m249Heap});",
  " console.log('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE',JSON.stringify(evidence249));",
  " console.error('M58_REAL_P88_WORKER_FAIL'"
 ].join('\n'));
`;
if(!source.includes(injectAt))throw Error("M247 source assertion location moved");
source=source.replace(injectAt,build+'\n'+injectAt);
assert.ok(source.includes("assert.ok(state.cards>0&&state.cards<=12"));
assert.ok(source.includes("M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS"));
assert.ok(source.includes("M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY"));
const engine=process.env.M249_ENGINE||'webkit';
const width=String(process.env.M249_WIDTH||390);
const control=process.env.M249_CONTROL||'none';
assert.ok(['webkit','chromium'].includes(engine),'Real native engine only');
assert.ok(['320','390','430'].includes(width),'Only pinned original mobile viewports');
assert.ok(['none','model_abort'].includes(control),'Only one controlled public model negative');
const temp=resolve('scripts/.m249-disposable-original-jsep-red-browser.mjs');
try{
 await writeFile(temp,source,{flag:'wx'});
 const lint=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(lint.error)throw lint.error;
 assert.equal(lint.status,0,'M249 derived original test JS syntax: '+String(lint.stderr).slice(0,700));
 if(process.env.M249_SOURCE_ONLY==='1'){
  console.log('M249_ORIGINAL_SOURCE_LOCKED',JSON.stringify({engine,width,control,
   originalWorkerUntouched:true,originalPhotoAndModelUntouched:true,
   originalOwnerPrivacyAssertionsPreserved:true,realBrowserNotRun:true,hold:true}));
 }else{
  const run=spawnSync(process.execPath,[temp],{
   env:{...process.env,M247_ENGINE:engine,M58_ENGINE:engine,P94_WIDTH:width,M249_CONTROL:control},
   encoding:'utf8',timeout:24*60*1000,maxBuffer:12*1024*1024
  });
  if(run.error)throw run.error;
  const lines=(run.stdout||'').split(/\r?\n/);
  const prefixes=['M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE ',
   'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY ','M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT ',
   'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ',
   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS '];
  for(const line of lines)if(prefixes.some(p=>line.startsWith(p)))console.log(line.slice(0,1800));
  const failure=lines.filter(x=>x.startsWith(prefixes[0]));
  if(run.status!==0&&failure.length===0){
   const diagnostic=['SyntaxError','ReferenceError','TypeError','ERR_ASSERTION',
    'source derivation','Cannot access','not defined','No real original browser failure']
     .filter(token=>String(run.stderr||'').includes(token));
   console.log('M249_MISSING_FAILURE_RECEIPT_RETAIN_RED',JSON.stringify({
    engine,width,control,originalChildStatus:run.status,
    sanitizedErrorKinds:diagnostic,originalFailureReceiptAbsent:true,
    repairProven:false,releaseAuthorized:false,hold:true}));
  }
  if(control==='model_abort'){
   assert.notEqual(run.status,0,'Injected original public ONNX abort cannot count as genuine model success');
   assert.equal(failure.length,1,'No real original browser failure boundary receipt');
   const record=JSON.parse(failure[0].slice(prefixes[0].length));
   assert.equal(record.controlledPublicOnnxAbort,true);
   assert.equal(record.realRedToGreenFixProven,false);
   assert.equal(record.nativeMemoryAccessRootCauseProven,false);
   assert.ok(!lines.some(x=>x.startsWith('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY ')),
     'Negative model abort falsely claimed original positive acceptance');
   console.log('M249_CONTROLLED_ORIGINAL_ONNX_ABORT_REDACTION_PASS',JSON.stringify({
    engine,width,originalModelNetworkAborted:true,originalBrowserExitedNonzero:true,
    sameAttemptReceipt:true,noNativeRootCauseOrReleaseClaim:true}));
  }else{
   assert.equal(run.status,0,'Genuine original model/owner/privacy browser RED; preserve failure, no retry');
   assert.equal(failure.length,0,'Original success also emitted a failed-run receipt');
   for(const p of prefixes.slice(1))
    assert.ok(lines.some(x=>x.startsWith(p)),'Original real positive/owner receipt missing: '+p);
   console.log('M249_GENUINE_SOURCE_OWNER_PASS',JSON.stringify({
    engine,width,trueNativeJsepWorker:true,originalModelAndOwner2DV4:true,
    noNaturalFailureObservedInThisProcess:true,noPermanentRepair:true,hold:true}));
  }
 }
}finally{await rm(temp,{force:true});}
