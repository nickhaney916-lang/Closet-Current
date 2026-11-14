/** M32 read-only local-browser handoff receipt: protect device provenance.
 * Never convert mobile user-agent, touch emulation or self-attestation into
 * an independently witnessed iPhone/Android run or release approval.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const sha=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const code=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const natural=x=>Number.isSafeInteger(x)&&x>=0&&x<1e11;
const enumPlatform=new Set([
 'IPHONE_SAFARI_RESEARCH_UNVERIFIED',
 'ANDROID_CHROME_RESEARCH_UNVERIFIED','DESKTOP_OR_OTHER_UNVERIFIED'
]);
const rowComplete=new Set([
 'caseId','sourceId','sourceSHA256','observedSourceSHA256',
 'result','bothModelsCompleted','ownerConsent','manualOwnerApprovalRequired',
 'automaticAdmissions','privateWrites','unchangedSource','workerTerminatedIndependentlyVerified',
 'modelMs','elapsedMs','ownerDecision','ownerSuggestionCount','memoryRSSVerified'
]);
const rowAbort=new Set([
 'caseId','sourceId','sourceSHA256','observedSourceSHA256','result',
 'onnxRunInvocationObserved','workerTerminatedIndependentlyVerified',
 'completedInferenceCredited','kernelExecutionAtCancelProven',
 'manualOwnerApprovalRequired','automaticAdmissions','privateWrites',
 'unchangedSource','elapsedMs','memoryRSSVerified'
]);
const rowBlocked=new Set([
 'caseId','sourceId','sourceSHA256','result','errorCode',
 'completedInferenceCredited','hardwareVerified','releaseAuthorized'
]);
const receiptKeys=new Set([
 'schema','sourceCommit','manifestSchema','observedPlatform',
 'viewportWidth','pixelRatio','touchPoints','observedBrowserErrors',
 'observedUnhandledRejections','selectedPhotoSources','rows',
 'hardwareVerified','operatorAttestationNotIndependentProof',
 'phoneProcessMemoryVerified','cloudOrPrivateWardrobeTested',
 'independentHumanLabelsVerified','blindAccuracy','releaseAuthorized',
 'familyAlpha','caution'
]);
const exactKeys=(obj,allowed)=>!!obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).every(key=>allowed.has(key))&&
 Object.keys(obj).length===allowed.size;
const sourceIDs=['commons-0035','commons-0062','commons-0078','commons-0059'];
const rowsExpected=Object.freeze({
  'onnx-invoked-cancel':'commons-0035',
  'onnx-invoked-session-lock':'commons-0062'
});
export function auditLocalDeviceHandoff32(receipt,{commit,sourceHashes}={}){
 const errors=[],check=(ok,reason)=>{if(!ok)errors.push(reason);};
 check(code(commit)&&receipt?.sourceCommit===commit,'source commit unverified');
 check(receipt?.schema==='main1054-physical-device-handoff-m32-receipt-v1'&&
  receipt?.manifestSchema==='main1054-physical-device-handoff-m32-v1',
  'wrong locally generated handoff');
 check(exactKeys(receipt,receiptKeys),'receipt contains missing or unexpected private fields');
 check(enumPlatform.has(receipt?.observedPlatform),'browser descriptor unsupported');
 check(natural(receipt?.viewportWidth)&&receipt.viewportWidth>=200&&receipt.viewportWidth<=1600&&
  Number.isFinite(receipt?.pixelRatio)&&receipt.pixelRatio>=0.5&&receipt.pixelRatio<=8&&
  natural(receipt?.touchPoints)&&receipt.touchPoints<=50,'browser observation missing');
 check(natural(receipt?.observedBrowserErrors)&&receipt.observedBrowserErrors===0&&
  natural(receipt?.observedUnhandledRejections)&&receipt.observedUnhandledRejections===0,
  'browser JS/rejection errors were observed');
 check(receipt?.hardwareVerified===false&&receipt?.operatorAttestationNotIndependentProof===true&&
  receipt?.phoneProcessMemoryVerified===false&&receipt?.cloudOrPrivateWardrobeTested===false&&
  receipt?.independentHumanLabelsVerified===false&&receipt?.blindAccuracy===null&&
  receipt?.releaseAuthorized===false&&receipt?.familyAlpha==='HOLD',
  'unsupported human/phone/release claims');
 check(typeof receipt?.caution==='string'&&
  receipt.caution.includes('not device acceptance'),'false hardware attestation');
 const sources=receipt?.selectedPhotoSources;
 check(Array.isArray(sources)&&sources.length===4,'incomplete frozen public photos');
 for(let i=0;i<4;i++){
  const row=sources?.[i],id=sourceIDs[i];
  check(row?.id===id&&sha(sourceHashes?.[id])&&row?.sha256===sourceHashes[id]&&
   Object.keys(row||{}).sort().join(',')==='id,sha256','different original manifest');
 }
 const rows=receipt?.rows;
 check(Array.isArray(rows)&&rows.length>=1&&rows.length<=24,'invalid test run count');
 let complete=0,canceled=0,locked=0,blocked=0;
 const photoIds=new Set();
 for(const row of Array.isArray(rows)?rows:[]){
  const result=row?.result;
  const allowed=result==='COMPLETE_UNSAVED'?rowComplete:
   result==='ONNX_INVOKED_ABORT_NO_RESULT'?rowAbort:
   result==='BLOCKED'?rowBlocked:null;
  check(allowed&&exactKeys(row,allowed),'row includes arbitrary or missing data');
  check(sourceIDs.includes(row?.sourceId)&&
   row?.sourceSHA256===sourceHashes?.[row.sourceId],'unbound source image');
  if(result==='COMPLETE_UNSAVED'){
   complete++;
   check(/^photo-\d{2}$/.test(row?.caseId||'')&&!photoIds.has(row.caseId),
    'duplicate or unnumbered photo result');
   photoIds.add(row?.caseId);
   check(row?.observedSourceSHA256===sourceHashes[row.sourceId]&&
    row?.bothModelsCompleted===true&&row?.ownerConsent===true&&
    row?.manualOwnerApprovalRequired===true&&row?.automaticAdmissions===0&&
    row?.privateWrites===0&&row?.unchangedSource===true,
    'original source or manual approval changed');
   check(row?.workerTerminatedIndependentlyVerified===false&&
    row?.memoryRSSVerified===false,'false worker or phone memory claim');
   check(natural(row?.modelMs)&&row.modelMs>0&&row.modelMs<=300000&&
    natural(row?.elapsedMs)&&row.elapsedMs>=row.modelMs&&row.elapsedMs<=300000&&
    natural(row?.ownerSuggestionCount)&&row.ownerSuggestionCount<=8&&
    ['abstain','cross_family_hypothesis'].includes(row?.ownerDecision),
    'model duration or owner decision not evidence');
  }else if(result==='ONNX_INVOKED_ABORT_NO_RESULT'){
   if(row.caseId==='onnx-invoked-cancel')canceled++;
   if(row.caseId==='onnx-invoked-session-lock')locked++;
   check(rowsExpected[row.caseId]===row.sourceId&&
    row?.observedSourceSHA256===sourceHashes?.[row.sourceId]&&
    row?.onnxRunInvocationObserved===true&&
    row?.workerTerminatedIndependentlyVerified===false&&
    row?.completedInferenceCredited===false&&
    row?.kernelExecutionAtCancelProven===false&&
    row?.manualOwnerApprovalRequired===true&&
    row?.automaticAdmissions===0&&row?.privateWrites===0&&
    row?.unchangedSource===true&&row?.memoryRSSVerified===false&&
    natural(row?.elapsedMs)&&row.elapsedMs>0,'cancellation/owner lock evidence invalid');
  }else if(result==='BLOCKED'){
   blocked++;
   check(/^[A-Z_]{4,45}$/.test(row?.errorCode||'')&&
    row?.completedInferenceCredited===false&&row?.hardwareVerified===false&&
    row?.releaseAuthorized===false,'blocked result cannot imply acceptance');
  }
 }
 check(!photoIds.size||Array.from(photoIds).every((id,i)=>id==='photo-'+String(i+1).padStart(2,'0')),
  'out-of-order photo sequence');
 check(canceled<=1&&locked<=1,'duplicate cancellation or lock');
 const status=errors.length||blocked?'BLOCKED':
  complete>=16&&canceled===1&&locked===1?
   'LOCAL_16_PLUS_CANCEL_LOCK_RECEIPT_REQUIRES_EXTERNAL_HARDWARE_REVIEW':
   'INCOMPLETE_PHYSICAL_DEVICE_ACCEPTANCE';
 return {status,errors:[...new Set(errors)],completedPhotos:complete,
  cancellationCases:canceled,sessionLockCases:locked,blockedCases:blocked,
  sourceHashMatched:errors.length===0,phoneRSSBytes:null,
  independentlyVerifiedPhysicalRuns:0,
  hardwareVerified:false,humansVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  note:'Local browser evidence requires independent device identity, media and operator process validation; no self-attested UA is hardware proof'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const file=process.argv[2],commit=process.argv[3];
 if(!file||!code(commit))throw Error('M32 receipt path and exact commit required');
 const [receipt,source]=await Promise.all([
  readFile(file,'utf8').then(JSON.parse),
  readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse)
 ]);
 const sourceHashes=Object.fromEntries(source.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
 const result=auditLocalDeviceHandoff32(receipt,{commit,sourceHashes});
 console.log('MAIN1054_M32_LOCAL_DEVICE_HANDOFF_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
