/**
 * Mission Control M258 — fail-closed convergence of M257's full six-cell
 * evidence collector with the independent explicit-RED/owner-B safeguards.
 *
 * Research-only successor to the immutable M257 #1453 adapter; original
 * product P94 Worker, JSEP WASM, photo/board, and P94 browser runner remain
 * byte-identical. No unseen model/JSEP source hashes can be inferred.
 */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {extractM257Attempt,aggregateM257} from './m257-real-runner-evidence.mjs';

const PRIVACY_MARKER='M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY';
const RED_MARKER='M58_REAL_P88_WORKER_FAIL';
const MAX_LOG=8*1024*1024;
const REASON='M258 original owner-B isolation or original browser RED evidence incomplete';
const cells=['chromium','webkit'].flatMap(engine=>
 [320,390,430].map(width=>engine+'/'+width));

function extractPrivacy(raw,engine){
 const messages=raw.split(/\r?\n/).filter(line=>line.startsWith(PRIVACY_MARKER+' '));
 const count=Math.min(messages.length,2);
 if(messages.length!==1)return {count,verified:false};
 const json=messages[0].slice(PRIVACY_MARKER.length+1);
 if(json.length>3500)return {count,verified:false};
 let p;
 try{p=JSON.parse(json);}catch{return {count,verified:false};}
 if(!p||typeof p!=='object'||Array.isArray(p))return {count,verified:false};
 const verified=p.engine===engine&&p.realWorkerFirst===true&&
  p.explicitOwnerASave===1&&p.ownerBPrivateRows===0&&
  p.ownerAOriginalNotVisibleToB===true&&
  p.ownerAOutfitNotVisibleToB===true&&
  p.m59SourceOnlyGalleryUsesExactOriginal===true&&
  p.m59BoardMutationRevoked===true&&
  p.m59LogoutAndBRevoked===true&&
  p.localIndexedDBOnly===true&&p.syntheticAuth===true&&
  p.hostedRLS===false&&p.independentHumanLabelAccuracy===false&&
  p.physicalPhone===false&&p.familyAlpha==='HOLD'&&
  p.releaseAllowed===false;
 return {count,verified};
}

/**
 * Successful original browser exit alone cannot override an explicit native
 * P94 exception record. No raw console data are included in the result.
 */
export function extractM258Attempt(log,identity){
 if(typeof log!=='string'||log.length>MAX_LOG)
  throw new TypeError('M258 unbounded or invalid original CI log');
 const base=extractM257Attempt(log,identity);
 const privacy=extractPrivacy(log,identity.engine);
 const hasNativeRed=log.split(/\r?\n/).some(line=>
  line===RED_MARKER||line.startsWith(RED_MARKER+' '));
 const journeyStatus=hasNativeRed||base.journeyStatus==='FAIL'?'FAIL':
  privacy.verified&&base.journeyStatus==='PASS'?'PASS':'BLOCKED';
 const reasons=base.reasons.filter(reason=>reason!==
  'Original browser process model and JSEP WASM SHA-256 not observed');
 if(hasNativeRed)reasons.push('Original browser reported an explicit native or model failure');
 if(!privacy.verified)reasons.push('Original synthetic owner-B isolation evidence missing or invalid');
 reasons.push('Original browser process model and JSEP WASM SHA-256 not observed');
 return Object.freeze({
  ...base,
  schema:'MAIN1054_M258_CONVERGED_ORIGINAL_BROWSER_RECEIPT_V1',
  journeyStatus,
  sourceEvidenceGate:journeyStatus==='FAIL'?'FAIL':'BLOCKED',
  explicitOriginalNativeRedSeen:hasNativeRed,
  syntheticOwnerBIsolationMarkerCount:privacy.count,
  originalOwnerBLocalIsolationAttested:!!privacy.verified,
  sameBrowserProcessObserved:false,
  actualBrowserProcessId:null,
  modelSHA256:null,jsepSHA256:null,
  reasons,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
}

export function aggregateM258(receipts,{checkout,runId}={}){
 if(!Array.isArray(receipts))throw new TypeError('M258 original native receipts must be an array');
 // Reuse the original six-cell complete-matrix, first-attempt, exact SHA/run
 // and missing model/JSEP attestation rules verbatim; do not re-implement or
 // weaken the existing #1453 collector.
 const base=aggregateM257(receipts.map(r=>r&&{
  ...r,schema:r.schema==='MAIN1054_M258_CONVERGED_ORIGINAL_BROWSER_RECEIPT_V1'
   ?'MAIN1054_M257_REAL_RUNNER_EVIDENCE_V1':r.schema
 }),{checkout,runId});
 const accepted=receipts.filter(row=>row&&
  row.schema==='MAIN1054_M258_CONVERGED_ORIGINAL_BROWSER_RECEIPT_V1'&&
  row.originalOwnerBLocalIsolationAttested===true&&
  row.syntheticOwnerBIsolationMarkerCount===1&&
  row.explicitOriginalNativeRedSeen===false&&
  row.sourceEvidenceGate==='BLOCKED'&&
  row.sameBrowserProcessObserved===false&&
  row.modelSHA256===null&&row.jsepSHA256===null&&
  row.actualBrowserProcessId===null&&row.journeyStatus==='PASS');
 const red=receipts.some(row=>row&&(
  row.explicitOriginalNativeRedSeen===true||row.journeyStatus==='FAIL'||
  row.exitCode!==0&&row.schema==='MAIN1054_M258_CONVERGED_ORIGINAL_BROWSER_RECEIPT_V1'));
 const allSix=receipts.length===6&&accepted.length===6&&
  new Set(accepted.map(row=>row.engine+'/'+row.width)).size===6&&
  cells.every(cell=>accepted.some(row=>row.engine+'/'+row.width===cell));
 const journeyGate=red||base.journeyGate==='FAIL'?'FAIL':
  allSix&&base.journeyGate==='PASS'?'PASS':'BLOCKED';
 return Object.freeze({
  schema:'MAIN1054_M258_CONVERGED_SIX_CELL_GATE_V1',
  checkout,runId:String(runId),
  originalCells:base.seenCells,
  originalJourneysAccepted:accepted.length,
  originalRedDetected:red||base.failedJourneys>0,
  journeyGate,sourceEvidenceGate:journeyGate==='FAIL'?'FAIL':'BLOCKED',
  modelSHA256:null,jsepSHA256:null,actualBrowserProcessId:null,
  originalModelJsepSameProcessAttested:false,
  originalIntermittentWebkitFaultPermanentlyFixed:false,
  hostedFourAccountRlsVerified:false,
  physicalPhonesVerified:false,
  photoFitted3DAuthorized:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  reasons:journeyGate==='PASS'?
   ['Original browser process model and JSEP WASM SHA-256 not observed']:
   ['Original six-cell first-attempt model/owner/private isolation evidence incomplete',
    ...base.reasons.filter(r=>typeof r==='string').slice(0,12)]
 });
}
function pinnedOriginalJpeg(){
 const item=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 const actual=createHash('sha256')
  .update(readFileSync('benchmark/fixtures/commons-0003.jpg')).digest('hex');
 if(!item?.verified||item.sha256!==actual)
  throw new Error('M258 pinned original public JPEG mismatch');
 return actual;
}

function cli(args){
 const [mode,path,out]=args;
 if(mode==='attempt'){
  if(!path||!out||args.length!==3)throw new Error('M258 missing actual run file and output');
  const log=readFileSync(path,'utf8');
  const value=extractM258Attempt(log,{
   checkout:process.env.EXPECTED_HEAD,engine:process.env.M58_ENGINE,
   width:Number(process.env.P94_WIDTH),runId:process.env.GITHUB_RUN_ID,
   job:process.env.GITHUB_JOB,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   exitCode:Number(process.env.MODEL_EXIT),lockedJpegSha:pinnedOriginalJpeg()
  });
  mkdirSync(dirname(out),{recursive:true});
  writeFileSync(out,JSON.stringify(value,null,2)+'\n');
  console.log('M258_ACTUAL_ORIGINAL_BROWSER',value.engine,value.width,
   'JOURNEY',value.journeyStatus,'SOURCE',value.sourceEvidenceGate);
  if(value.journeyStatus!=='PASS')process.exitCode=value.journeyStatus==='FAIL'?1:2;
 }else if(mode==='aggregate'){
  if(!path||args.length!==2)throw new Error('M258 missing six-cell receipt directory');
  const names=readdirSync(path).filter(x=>
   /^receipt-(chromium|webkit)-(320|390|430)\.json$/.test(x));
  const receipts=names.map(name=>JSON.parse(readFileSync(join(path,name),'utf8')));
  const value=aggregateM258(receipts,{
   checkout:process.env.EXPECTED_HEAD,runId:process.env.GITHUB_RUN_ID
  });
  console.log('M258_ACTUAL_SIX_CELL_GUARD',JSON.stringify(value));
  if(value.journeyGate!=='PASS'||value.originalJourneysAccepted!==6||
     value.sourceEvidenceGate!=='BLOCKED'||names.length!==6)
   process.exitCode=value.journeyGate==='FAIL'?1:2;
 }else throw new Error('M258 unknown operation');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{cli(process.argv.slice(2));}
 catch{console.error('M258_BLOCKED: invalid actual original owner or model evidence');
  process.exitCode=2;}
}
