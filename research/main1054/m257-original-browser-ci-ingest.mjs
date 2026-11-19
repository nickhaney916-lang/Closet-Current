/**
 * M257 — Original P94 WebKit/Chromium first-attempt CI outcome ingestion.
 *
 * Reads actual stdout/stderr from the UNMODIFIED P94 original-model browser
 * script, not manufactured "PASS" JSON. The trusted workflow supplies the
 * exact git checkout, runner exit status, engine and viewport. Results only
 * summarize public-source and synthetic-owner evidence. A genuine positive
 * journey is NOT original model/JSEP same-process hash attestation.
 *
 * No product Worker, browser route, auth, photos or cloud access here.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const COMMIT=/^[0-9a-f]{40}$/;
const P94_SOURCE='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const MARKERS=Object.freeze({
 model:'M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',
 owner:'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',
 isolation:'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',
 lifecycle:'P91_FULL_JOURNEY_PASS'
});
const RED='M58_REAL_P88_WORKER_FAIL';
const fail=message=>{throw new TypeError('M257 '+message);};
const exact=x=>typeof x==='string'&&COMMIT.test(x);
function collect(text,marker){
 const lines=text.split(/\r?\n/).filter(line=>line.startsWith(marker+' '));
 if(lines.length!==1)return {ok:false,value:null,count:Math.min(lines.length,2)};
 const encoded=lines[0].slice(marker.length+1);
 if(encoded.length>3500)return {ok:false,value:null,count:1};
 try{
  const value=JSON.parse(encoded);
  if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,value:null,count:1};
  return {ok:true,value,count:1};
 }catch{return {ok:false,value:null,count:1};}
}

/**
 * `runnerExit` is supplied by shell's immediate `$?` from one genuine run.
 * A failed run is FAIL even if it printed positive markers earlier.
 * Empty, partial, duplicate or mismatched logs can NEVER become PASS.
 */
export function evaluateM257OriginalRun({
 stdout,runnerExit,checkout,expectedHead,engine,width
}={}){
 if(typeof stdout!=='string'||stdout.length>8*1024*1024||
    !exact(checkout)||!exact(expectedHead)||
    !['chromium','webkit'].includes(engine)||
    ![320,390,430].includes(width)||
    !Number.isSafeInteger(runnerExit)||runnerExit<0||runnerExit>255)
  fail('invalid bounded original-run metadata');

 const logs=Object.fromEntries(Object.entries(MARKERS).map(([key,marker])=>
  [key,collect(stdout,marker)]));
 const terminalRed=stdout.split(/\r?\n/).some(line=>line.startsWith(RED+' '));
 const statusFailed=runnerExit!==0||terminalRed;
 const {model,owner,isolation,lifecycle}=Object.fromEntries(
  Object.entries(logs).map(([key,data])=>[key,data.value]));

 const sourceIdentity=logs.model.ok&&logs.owner.ok&&
  model.engine===engine&&owner.engine===engine&&
  model.sourceSHA256===P94_SOURCE&&owner.exactOriginalSHA256===P94_SOURCE;
 const realModel=logs.model.ok&&model.realWorker===true&&
  model.saved===0&&Number.isSafeInteger(model.modelRequests)&&
  model.modelRequests>0&&model.groups===2&&model.hold===true;
 const privateOwner=logs.owner.ok&&owner.modelExecuted===true&&
  owner.manualSyntheticOwnerConfirmed===true&&owner.ownerPrivateSaved===1&&
  owner.realNativeOutfit===true&&owner.savedOutfitOwnerAction===true&&
  owner.actualV4BrowserDownload===true&&owner.atomicRestore===true&&
  owner.otherOwnerDenied===true&&owner.tamperDenied===true&&
  owner.threeDAuthorized===false&&owner.hostedRLS===false&&
  owner.physicalPhone===false&&owner.familyAlpha==='HOLD'&&
  owner.releaseAuthorized===false;
 const privateIsolation=logs.isolation.ok&&isolation.engine===engine&&
  isolation.realWorkerFirst===true&&isolation.ownerBPrivateRows===0&&
  isolation.ownerAOriginalNotVisibleToB===true&&
  isolation.ownerAOutfitNotVisibleToB===true&&
  isolation.localIndexedDBOnly===true&&isolation.syntheticAuth===true&&
  isolation.hostedRLS===false&&isolation.releaseAllowed===false;
 const lifecycleProof=logs.lifecycle.ok&&lifecycle.engine===engine&&
  lifecycle.uninterruptedSourceExportRestore===true&&
  lifecycle.writeRetries===0&&lifecycle.extraTamperReloads===0&&
  lifecycle.ownerRecovery===true&&
  lifecycle.originalPhotoByteTamperRefused===true&&
  lifecycle.familyAlpha==='HOLD'&&lifecycle.releaseAuthorized===false;
 const sameHead=checkout===expectedHead;
 const markerCoverage=Object.values(logs).every(x=>x.ok);
 const valid=sourceIdentity&&realModel&&privateOwner&&privateIsolation&&
  lifecycleProof&&sameHead&&markerCoverage;

 // These fields are NOT in the unchanged P94 positive runner: missing is not
 // "verified" even if native model loaded successfully.
 const originalModelBytesHashObservedInBrowser=false;
 const originalJsepBytesHashObservedInBrowser=false;
 const sameBrowserProcessTripleSourceAttested=false;
 const originalJourney=statusFailed?'FAIL':valid?'PASS':'BLOCKED';
 return Object.freeze({
  schema:'M257_ACTUAL_ORIGINAL_BROWSER_OUTCOME_INGEST/v1',
  checkout,engine,configuredViewportWidth:width,
  exactCheckoutMatch:sameHead,
  originalJourney,
  failureSeen:statusFailed,
  originalRunExitCode:runnerExit,
  modelMarkerCount:logs.model.count,
  ownerMarkerCount:logs.owner.count,
  isolationMarkerCount:logs.isolation.count,
  lifecycleMarkerCount:logs.lifecycle.count,
  pinnedOriginalJpegSHA256Verified:!!sourceIdentity,
  originalWorkerInBrowserReported:!!realModel,
  syntheticOwnerPrivateV4Reported:!!privateOwner,
  ownerBLocalIsolationReported:!!privateIsolation,
  originalSourceRecoveryReported:!!lifecycleProof,
  originalModelBytesHashObservedInBrowser,
  originalJsepBytesHashObservedInBrowser,
  sameBrowserProcessTripleSourceAttested,
  browserReceiptPromotionGate:statusFailed?'FAIL':'BLOCKED',
  browserReceiptBlocker:statusFailed?'original-browser-run-failed':
   'same-process-original-model-and-jsep-byte-hashes-unobserved',
  originalOnnxWebkitPermanentRepairEstablished:false,
  independentBlindHumanAccuracyVerified:false,
  hostedRLSVerified:false,
  physicalPhoneVerified:false,
  photoFitted3DAuthorized:false,
  familyAlpha:'HOLD',
  releaseAuthorized:false
 });
}

function runCLI(argv){
 const options={};
 for(let i=0;i<argv.length;i+=2){
  if(!argv[i]?.startsWith('--')||i+1>=argv.length)
   fail('invalid named CLI arguments');
  const key=argv[i].slice(2);
  if(!['log','engine','width','exit','head','output'].includes(key)||
     Object.hasOwn(options,key))fail('unknown or duplicate CLI argument');
  options[key]=argv[i+1];
 }
 if(Object.keys(options).length!==6)fail('missing required metadata');
 // The actual workflow checkout must have the SHA the job claims.
 const checkout=execFileSync('git',['rev-parse','HEAD'],{
  encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:5000
 }).trim();
 const raw=readFileSync(options.log,'utf8');
 const evaluated=evaluateM257OriginalRun({
  stdout:raw,runnerExit:Number(options.exit),checkout,
  expectedHead:options.head,engine:options.engine,width:Number(options.width)
 });
 mkdirSync(dirname(options.output),{recursive:true});
 writeFileSync(options.output,JSON.stringify(evaluated,null,2)+'\n');
 // Output only sanitized bounded evidence, never the original private log.
 console.log('M257_ACTUAL_ORIGINAL_BROWSER_RECEIPT',JSON.stringify(evaluated));
 if(evaluated.originalJourney!=='PASS')process.exitCode=
  evaluated.originalJourney==='FAIL'?1:2;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{runCLI(process.argv.slice(2));}
 catch{
  console.error('M257_BLOCKED invalid or unavailable actual CI original-run evidence');
  process.exitCode=2;
 }
}
