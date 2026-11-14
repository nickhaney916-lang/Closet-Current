// M34: read-only numeric audit of actual repeated desktop WebKit HTTPS experiments.
// NOT physical iPhone memory, mobile Safari, real owner account or release proof.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const SHA=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const valid=x=>Number.isSafeInteger(x)&&x>=0;
const exact=(o,allowed)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).every(x=>allowed.has(x))&&Object.keys(o).length===allowed.size;
const topKeys=new Set(['schema','sourceCommit','repeatsTarget','diagnostics','verifiedPhysicalDevices',
 'actualIPhoneSafari','actualAndroidChrome','familyAlpha','releaseAuthorized']);
const keys=new Set(['repeat','result','completedPhotos','ownerCancelLockCases',
 'workerErrorCode','workerCreated','workerClosed','pageCrashes','modelStageCounts',
 'lastModelStage','maxSampledProcessTreePSSBytes','sampleCount','requestFailures',
 'consoleErrors','device']);
const blocked=new Set(['repeat','result','failureClass','completedPhotos','lastPhotoId',
 'browserBlocked','workerErrorCode','workerCreated','workerClosed','pageCrashes',
 'modelStageCounts','lastModelStage','maxSampledProcessTreePSSBytes','sampleCount',
 'requestFailures','consoleErrors','device']);
const stageKeys=new Set(['verifying','first','second','onnxInvoked']);
const stageSet=new Set(['NONE',...stageKeys]);
const failSet=new Set(['MODEL_WORKER_REPORTED_FAILURE','BROWSER_TIMEOUT','SOURCE_OR_OWNER_ACCEPTANCE_FAILURE']);
const ids=new Set(['NONE','UNKNOWN','commons-0035','commons-0062','commons-0078','commons-0059']);
export function auditRepeatedWebkitHTTPS34(report,{commit}={}){
 const issues=[],check=(flag,label)=>{if(!flag)issues.push(label);};
 check(SHA(commit)&&report?.sourceCommit===commit,'wrong source commit');
 check(report?.schema==='main1054-webkit-https-repeat-m34-v1'&&exact(report,topKeys),
  'bad research-only report schema/private field');
 check(report?.repeatsTarget===3&&Array.isArray(report?.diagnostics)&&
  report?.diagnostics.length===3,'not three independent full WebKit browser sessions');
 check(report?.verifiedPhysicalDevices===0&&report?.actualIPhoneSafari===false&&
  report?.actualAndroidChrome===false&&report?.familyAlpha==='HOLD'&&
  report?.releaseAuthorized===false,'false mobile release claim');
 const rows=Array.isArray(report?.diagnostics)?report.diagnostics:[];
 const stats=[];
 for(let i=0;i<3;i++){
  const r=rows[i]||{};
  const ok=r.result==='SUCCESS';
  check(exact(r,ok?keys:blocked),'unsafe or missing browser diagnostic fields');
  check(r.repeat===i+1&&r.device==='DESKTOP_WEBKIT_ONLY','wrong repeat/device identity');
  check(valid(r.workerCreated)&&r.workerCreated<=18&&valid(r.workerClosed)&&
   r.workerClosed<=r.workerCreated,'unbounded worker counts');
  check(valid(r.pageCrashes)&&r.pageCrashes<=5&&valid(r.consoleErrors)&&
   r.consoleErrors<=200&&valid(r.requestFailures)&&r.requestFailures<=30,'unbounded failures');
  check(valid(r.sampleCount)&&r.sampleCount>0&&
   valid(r.maxSampledProcessTreePSSBytes)&&r.maxSampledProcessTreePSSBytes>0,
   'no authentic Linux desktop memory sampling');
  check(exact(r.modelStageCounts,stageKeys)&&
   [...stageKeys].every(k=>valid(r.modelStageCounts[k])&&r.modelStageCounts[k]<=100),
   'unknown or unbounded worker-stage counts');
  check(stageSet.has(r.lastModelStage),'unrecognized last model stage');
  if(ok){
   check(r.completedPhotos===16&&r.ownerCancelLockCases===2&&r.workerErrorCode==='NONE',
    'genuine WebKit sixteen plus two owner aborts incomplete');
   check(r.workerCreated===18&&r.workerClosed===18&&r.pageCrashes===0&&
    r.requestFailures===0,'worker leak, page crash or external request failure');
   check(r.modelStageCounts.first>=16&&r.modelStageCounts.second>=16&&
    r.modelStageCounts.onnxInvoked>=2,'missing real pretrained processing or ONNX cancel stages');
  }else{
   check(r.result==='BLOCKED'&&failSet.has(r.failureClass)&&
    (r.completedPhotos===null||valid(r.completedPhotos)&&r.completedPhotos<=16)&&
    ids.has(r.lastPhotoId)&&typeof r.browserBlocked==='boolean'&&
    (r.workerErrorCode==='NO_SAFE_P82_ERROR'||r.workerErrorCode==='UNKNOWN'||
     /^P82_[A-Z_]+$/.test(r.workerErrorCode)),'unclassified WebKit worker failure');
  }
  stats.push({repeat:i+1,status:ok?'OBSERVED_COMPLETE':'OBSERVED_BLOCKED',
   completed:r.completedPhotos??null,errorCode:ok?null:r.workerErrorCode??null,
   lastStage:r.lastModelStage??null,
   browserPSSBytes:r.maxSampledProcessTreePSSBytes??null});
 }
 const failures=rows.filter(r=>r.result!=='SUCCESS').length;
 return {status:issues.length||failures?'BLOCKED':'THREE_DESKTOP_WEBKIT_HTTPS_REPEATS_OBSERVED_NOT_RELEASE',
  errors:[...new Set(issues)],repetitions:stats,
  completedTrials:3-failures,failedTrials:failures,
  independentPhysicalDevices:0,phoneMemoryMeasured:false,blindAccuracyMeasured:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(path,'utf8'));
 const verdict=auditRepeatedWebkitHTTPS34(r,{commit});
 console.log('MAIN1054_M34_REPEAT_WEBKIT_GATE',JSON.stringify(verdict));
 if(verdict.status==='BLOCKED')process.exitCode=2;
}
