/**
 * P0 M269: actual runtime intervention trial, not just network diagnosis.
 *
 * Control: original P94 installed worker byte-identical.
 * Candidate: ONE runtime session-creation change on disposable worker:
 *   session_options:{graphOptimizationLevel:'disabled'}
 * Original model, revision, WASM execution provider, logits and positive
 * owner-review/private original photo→2D→v4 assertions are unchanged.
 *
 * This can eliminate ONNX graph-optimizer activity, but is an EXPERIMENT.
 * It is not a verified fix for native memory access / ONNX session hangs.
 * ALL genuine original-model REDs remain RED, including timeouts.
 */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM267} from './m267-original-network-redirect-chain.mjs';
import {classifyM268} from './m268-redirect-linked-original-fresh-cohort.mjs';
const expectedWorkerGitBlob='ab7d3837139c5b7d693383f9d6617e199ec8de4f';
const expectedNativeRunnerSHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const outputScript='scripts/.m269-original-graph-optimization-ab.mjs';
const workerPath='public/outfit-worker-p94.mjs';
const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const pinned={
 modelId:'Xenova/segformer_b0_clothes',
 modelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
 transformers:'3.8.1',
 executionProvider:'wasm',
 dtype:'fp32'
};
const arn=/^(baseline|graph_opt_disabled)$/;
const sha40=/^[a-f0-9]{40}$/;
const trial=/^[0-9]{3,30}$/;
function hashGitBlob(content){
 const bytes=Buffer.from(content,'utf8');
 return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
}
function requireUnique(text,needle){
 if(text.indexOf(needle)<0||text.indexOf(needle)!==text.lastIndexOf(needle))
  throw Error('Pinned original source anchor absent or ambiguous');
}
export function deriveM269(originalBrowser,originalWorker,arm){
 if(!arn.test(arm||''))throw Error('Unrecognized original runtime A/B arm');
 if(createHash('sha256').update(originalBrowser).digest('hex')!==expectedNativeRunnerSHA)
  throw Error('Original P94 browser source SHA drift');
 if(hashGitBlob(originalWorker)!==expectedWorkerGitBlob)
  throw Error('Original P94 Worker Git blob drift');
 const modelAnchor="const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:";
 const setup="env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;";
 for(const needle of [modelAnchor,setup,"const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';"])
  requireUnique(originalWorker,needle);
 let derived=deriveM267(originalBrowser);
 const marker={
  schema:'MAIN1054_M269_ORIGINAL_P94_GRAPH_OPTIMIZATION_AB_V1',
  arm,originalWorkerGitBlob:expectedWorkerGitBlob,
  modifiedOriginalWorkerOnlyInDisposableBrowser:arm==='graph_opt_disabled',
  option:arm==='graph_opt_disabled'?'graphOptimizationLevel:disabled':'original-no-session-options',
  model:pinned.modelId,revision:pinned.modelRevision,
  inferenceProvider:'wasm-fp32',originalModelPreserved:true,
  originalPositiveAssertionUnchanged:true,
  sourceEvidenceGate:'BLOCKED',permanentWebKitFixProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 derived="console.log('M269_RUNTIME_SOURCE_ARM',"+JSON.stringify(JSON.stringify(marker))+");\n"+derived;
 if(arm==='graph_opt_disabled'){
  // Only the actual ORT session argument changes, never model logits, JSON,
  // garment masks, photo identity, model revision, owner consent or backup.
  const changedWorker=originalWorker.replace(modelAnchor,
   "const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',session_options:{graphOptimizationLevel:'disabled'},progress_callback:");
  const originalRead="  const body=await readFile(absolute);";
  requireUnique(derived,originalRead);
  derived=derived.replace(originalRead,
   "  const body=path==='/public/outfit-worker-p94.mjs'?Buffer.from("+JSON.stringify(changedWorker)+",'utf8'):await readFile(absolute);");
  // Native P94 source receipt must NEVER falsely claim the candidate Worker
  // is still byte-for-byte the shipped binary.
  const oldLabel="actualWorkerSourceBlob:'"+expectedWorkerGitBlob+"'";
  requireUnique(derived,oldLabel);
  derived=derived.replace(oldLabel,
   "actualWorkerSourceBlob:'m269-disposable-graph-optimization-disabled-not-shipped'");
 }
 requireUnique(derived,'Genuine P88 browser worker did not produce a bounded actual model proposal');
 return derived;
}
function identity(exitCode){
 const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const photoSHA=createHash('sha256').update(bytes).digest('hex');
 const lock=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(lock?.verified!==true||lock.sha256!==photoSHA)
  throw Error('Original public JPEG source pin changed');
 return {
  checkout:process.env.EXPECTED_HEAD,engine:process.env.M58_ENGINE,
  width:Number(process.env.P94_WIDTH),runId:process.env.GITHUB_RUN_ID,
  job:process.env.GITHUB_JOB,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
  exitCode,lockedJpegSha:photoSHA
 };
}
export function classifyM269(log,id,ordinal,arm){
 if(!arn.test(arm||''))throw Error('Unapproved original optimization arm');
 if(!sha40.test(id?.checkout||'')||!trial.test(String(id?.runId||'')))
  throw Error('Untrusted exact original source provenance');
 const markers=log.split(/\r?\n/).filter(x=>x.startsWith('M269_RUNTIME_SOURCE_ARM '));
 if(markers.length!==1)throw Error('Missing/duplicate frozen A/B arm marker');
 let marker;
 try{marker=JSON.parse(markers[0].slice('M269_RUNTIME_SOURCE_ARM '.length));}
 catch{throw Error('Invalid frozen runtime A/B marker');}
 if(marker?.schema!=='MAIN1054_M269_ORIGINAL_P94_GRAPH_OPTIMIZATION_AB_V1'||
  marker.arm!==arm||marker.originalWorkerGitBlob!==expectedWorkerGitBlob||
  marker.model!==pinned.modelId||marker.revision!==pinned.modelRevision||
  marker.originalModelPreserved!==true||
  marker.originalPositiveAssertionUnchanged!==true||
  marker.modifiedOriginalWorkerOnlyInDisposableBrowser!==(arm==='graph_opt_disabled')||
  marker.option!==(arm==='graph_opt_disabled'?'graphOptimizationLevel:disabled':'original-no-session-options')||
  marker.permanentWebKitFixProven!==false||
  marker.releaseAuthorized!==false||marker.familyAlpha!=='HOLD')
  throw Error('Untrusted first-attempt original runtime intervention');
 const outcome=classifyM268(log,id,ordinal);
 return {
  ...outcome,
  schema:'MAIN1054_M269_WEBKIT_NATIVE_GRAPH_AB_PROCESS_V1',arm,
  originalRuntimeUnmodified:arm==='baseline',
  graphOptimizationDisabledInDisposableWorker:arm==='graph_opt_disabled',
  modelOriginal:true,optimizerNativeEffectConfirmed:false,
  graphOptimizationCausalRepairProven:false,
  permanentWebKitFixProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function summarizeM269(rows,{checkout,runId,engine,width,count,arm}){
 if(!arn.test(arm||'')||!sha40.test(checkout||'')||
  !trial.test(String(runId||''))||
  !['webkit','chromium'].includes(engine)||![320,390,430].includes(width)||
  !Number.isInteger(count)||count<1||count>64||!Array.isArray(rows))
  throw Error('Invalid paired original model A/B cohort');
 const seen=new Set();let pass=0,fail=0,blocked=0,workerRed=0,linked=0;
 for(const r of rows){
  if(r?.schema!=='MAIN1054_M269_WEBKIT_NATIVE_GRAPH_AB_PROCESS_V1'||
   r.checkout!==checkout||r.runId!==String(runId)||r.engine!==engine||
   r.width!==width||r.runAttempt!==1||r.arm!==arm||
   !Number.isInteger(r.ordinal)||r.ordinal<1||r.ordinal>count||seen.has(r.ordinal)||
   r.originalRuntimeUnmodified!==(arm==='baseline')||
   r.graphOptimizationDisabledInDisposableWorker!==(arm==='graph_opt_disabled')||
   r.permanentWebKitFixProven!==false||
   r.optimizerNativeEffectConfirmed!==false||r.graphOptimizationCausalRepairProven!==false||
   r.nativeCompiledJsepSHA256!==null||r.nativeLoadedOnnxSHA256!==null||
   r.releaseAuthorized!==false||r.familyAlpha!=='HOLD'||
   !['PASS','FAIL','BLOCKED'].includes(r.originalResult)||
   (r.originalResult==='PASS'&&(r.originalChildExitCode!==0||
    r.originalOwnerJourneyGate!=='PASS'||r.sourceEvidenceGate!=='BLOCKED'||
    r.originalNetworkChainGate!=='LINKED'||r.originalModelHttpErrors!==0||
    r.originalJsepHttpErrors!==0||r.originalWorkerTerminalRedCount!==0||
    (engine==='webkit'&&!r.sameBrowserContextCanonicalRedirectChainsVerified)))||
   (r.originalResult==='FAIL'&&r.sourceEvidenceGate!=='FAIL'))
   throw Error('Stale/missing/forged original runtime first-attempt receipt');
  seen.add(r.ordinal);
  if(r.originalResult==='PASS')pass++;
  if(r.originalResult==='FAIL')fail++;
  if(r.originalResult==='BLOCKED')blocked++;
  if(r.naturalOriginalWorkerRedCandidate)workerRed++;
  if(r.sameBrowserContextCanonicalRedirectChainsVerified)linked++;
 }
 if(seen.size!==count)throw Error('Lost first-attempt original runtime cell');
 return {
  schema:'MAIN1054_M269_ORIGINAL_RUNTIME_AB_COHORT_V1',
  checkout,runId:String(runId),engine,width,arm,
  expectedFreshProcesses:count,observedFreshProcesses:seen.size,
  trueOriginalModelAndOwnerPositiveJourneys:pass,
  genuineOriginalFailedJourneys:fail,
  unverifiedOrBlockedJourneys:blocked,naturalWorkerReds:workerRed,
  originalWebKitLinkedONNXJSEPResponsePairs:linked,
  outcome:fail?'FAIL':blocked?'BLOCKED':'PASS',
  optimizerNativeEffectConfirmed:false,
  permanentWebKitFixProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
function main(){
 const [cmd,input,output,exitCode]=process.argv.slice(2);
 const arm=process.env.M269_ARM;
 if(cmd==='prepare'){
  const script=deriveM269(readFileSync(originalPath,'utf8'),
   readFileSync(workerPath,'utf8'),arm);
  writeFileSync(outputScript,script);
  console.log('M269_DISPOSABLE_RUNTIME_SOURCE_READY',JSON.stringify({
   arm,originalWorkerSHA:expectedWorkerGitBlob,originalSourceSHA:expectedNativeRunnerSHA,
   originalModel:pinned,changedProductionFiles:false,
   causalFixProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
  }));
 }else if(cmd==='verify'){
  const result=classifyM269(readFileSync(input,'utf8'),
   identity(Number(exitCode)),Number(process.env.M269_ORDINAL),arm);
  writeFileSync(output,JSON.stringify(result,null,2));
  console.log('M269_ORIGINAL_RUNTIME_FIRST_ATTEMPT',JSON.stringify(result));
  // Intentionally continue finite precommitted cohort after every native RED;
  // the final verdict is failed, never retry or erase that original attempt.
 }else if(cmd==='aggregate'){
  const files=readdirSync(input).filter(x=>/^receipt-[0-9]+[.]json$/.test(x));
  const rows=files.map(x=>JSON.parse(readFileSync(join(input,x),'utf8')));
  const result=summarizeM269(rows,{
   checkout:process.env.EXPECTED_HEAD,runId:process.env.GITHUB_RUN_ID,
   engine:process.env.M58_ENGINE,width:Number(process.env.P94_WIDTH),
   count:Number(process.env.M269_COUNT),arm
  });
  writeFileSync(output,JSON.stringify(result,null,2));
  console.log('M269_ORIGINAL_RUNTIME_AB_COHORT_SUMMARY',JSON.stringify(result));
  if(result.outcome!=='PASS')process.exitCode=1;
 }else throw Error('Expected prepare, verify or aggregate');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main()}catch(e){console.error('M269 BROWSER RUNTIME TRIAL BLOCKED: '+String(e.message).slice(0,145));process.exitCode=2;}
}
