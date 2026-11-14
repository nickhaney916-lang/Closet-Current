/**
 * M35: source-exact typed first-model worker diagnostic receipt.
 * Compose unchanged M34 3×16 source/memory/owner gate, never relabel blocked
 * runs as passed, and reject arbitrary exception text/device identity fields.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {auditRepeatedWebkitHTTPS34} from './webkit-https-repeat-gate-m34.mjs';
import {failurePhases35,failureClasses35} from './webkit-phase-classifier-m35.mjs';
const enums=new Set(failurePhases35.flatMap(p=>failureClasses35.map(c=>'M35_FAILURE_'+p+'_'+c)));
const checkpoints=new Set([
 'BEFORE_BROWSER_START','BROWSER_SERVER_LAUNCHED','PAGE_CREATED',
 'BEFORE_REAL_16_PHOTOS','AFTER_REAL_16_PHOTOS',
 'BEFORE_OWNER_CANCEL','BEFORE_SESSION_LOCK','AFTER_SESSION_LOCK',
 'AFTER_RECEIPT_EXPORTED','AFTER_SOURCE_OWNER_GATE',
 'AFTER_PAGE_ERRORS_GATE','AFTER_WORKER_LIFECYCLE_GATE'
]);
const validCount=x=>Number.isSafeInteger(x)&&x>=0&&x<=6;
export function auditTypedWebkit35(report,{commit}={}){
 const errors=[];
 const check=(good,why)=>{if(!good)errors.push(why);};
 check(report?.schema==='main1054-webkit-typed-phase-m35-v1',
  'missing typed diagnostic schema');
 const clean=report&&typeof report==='object'?JSON.parse(JSON.stringify(report)):null;
 if(clean){
  clean.schema='main1054-webkit-https-repeat-m34-v1';
  for(const row of clean.diagnostics||[]){
   delete row.lastTypedFailureMark;
   delete row.typedFailureEvents;
   delete row.checkpoint;
  }
 }
 const base=auditRepeatedWebkitHTTPS34(clean,{commit});
 const attempts=[];
 for(const [i,row]of (report?.diagnostics||[]).entries()){
  const original=Object.keys(row),simple=clean?.diagnostics?.[i];
  check(original.length===Object.keys(simple||{}).length+3,
   'unexpected private field in typed failure evidence');
  check(checkpoints.has(row.checkpoint),'unknown processing/owner acceptance checkpoint');
  check(validCount(row.typedFailureEvents),'unbounded typed failure events');
  check(row.lastTypedFailureMark==='NONE'||enums.has(row.lastTypedFailureMark),
   'arbitrary raw error/data leaked as phase marker');
  if(row.result==='SUCCESS'){
   check(row.typedFailureEvents===0&&row.lastTypedFailureMark==='NONE',
    'falsely accepted successful run despite typed failure');
   check(row.checkpoint==='AFTER_WORKER_LIFECYCLE_GATE',
    'unverified owner/worker completion');
  }
  if(row.typedFailureEvents>0)
   check(enums.has(row.lastTypedFailureMark),'typed failure needs recognized phase/class');
  attempts.push({repeat:i+1,completedPhotos:row.completedPhotos??null,
   result:row.result??'UNKNOWN',lastTypedFailureMark:row.lastTypedFailureMark??'NONE',
   checkpoint:row.checkpoint??'UNKNOWN'});
 }
 const failures=attempts.filter(a=>a.result!=='SUCCESS').length;
 return {status:errors.length||base.status==='BLOCKED'||failures?
  'BLOCKED':'THREE_WEBKIT_TYPED_PHASE_OWNER_TRIALS_OBSERVED_NOT_RELEASE',
  issues:[...new Set([...errors,...base.errors])],
  trials:attempts,modelStageMeasured:true,
  independentlyVerifiedIPhoneSafari:false,independentlyVerifiedAndroidChrome:false,
  genuineBlindGarmentAccuracy:false,ownerReleaseAuthorized:false,
  physicalDeviceMemory:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const verdict=auditTypedWebkit35(JSON.parse(await readFile(path,'utf8')),{commit});
 console.log('MAIN1054_M35_TYPED_PHASE_GATE',JSON.stringify(verdict));
 if(verdict.status==='BLOCKED')process.exitCode=2;
}
