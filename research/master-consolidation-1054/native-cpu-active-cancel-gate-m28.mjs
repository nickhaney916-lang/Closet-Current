/**
 * M28: reject any attempt to label a worker-start cancellation as
 * invocation-stage cancellation. "RUN_INVOKED" proves an actual call to
 * InferenceSession.run after source/model/preprocessing checks, not that the
 * CPU kernel was running at the precise cancellation instant.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const validSHA=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function verifyActiveONNXCancel28(r,{commit,sourceHashes}={}){
 const issues=[],check=(p,message)=>{if(!p)issues.push(message);};
 check(/^[a-f0-9]{40}$/.test(commit||'')&&r?.codeCommit===commit,'different source commit');
 check(r?.schema==='main1054-m28-onnx-run-invoked-owner-cancel-lock-no-completed-inference-v1','schema changed');
 check(r?.status==='ONNX_RUN_INVOKED_CANCEL_LOCK_NOT_RELEASE'&&
  r?.photoAttemptsTarget===2&&r?.completedPhotos===2&&r?.rows?.length===2,'canceled owner observations incomplete');
 check(r?.engine==='webkit'&&r?.session==='one-continuous-browser-one-page-sequential-disposable-workers','not real continuous WebKit desktop');
 check(r?.pageEvents?.workerCreated===2&&r?.pageEvents?.workerTerminated===2&&
  r?.pageEvents?.pageCrash===0&&r?.pageEvents?.browserDisconnected===0,'worker leak/browser failure');
 check(r?.failures?.length===0&&r?.pageErrors?.length===0&&r?.networkBlocked===0,'unexpected page/network error');
 check(r?.sourceHashesVerified===true&&r?.originalPhotoModified===false,'original source policy changed');
 check(r?.ownerAccount==='synthetic-only'&&r?.authorizedHostedCloud===false&&r?.ownerSessionIdentityChanged===false&&
  r?.persistedPrivateWardrobeWrites===0&&r?.autoAdmissions===0,'owner/cloud write or identity changed');
 check(r?.independentHumanPhotoLabels===0&&r?.physicalMobileDevices===0&&
  r?.officialSafariOnIPhone===false&&r?.acceptanceForRelease===false&&r?.familyAlpha==='HOLD','false phone/release evidence');
 check(Array.isArray(r?.modelFamilies)&&r.modelFamilies.length===0,'canceled model cannot count toward successful inference');
 const id=['commons-0035','commons-0062'],modes=['explicit-owner-cancel','owner-session-locked'];
 const mark='M28_CPU_ONNX_RUN_INVOKED_fashionclip',stages=Array.isArray(r?.modelStages)?r.modelStages:[];
 for(let i=0;i<2;i++){
  const row=r?.rows?.[i],photo=id[i];
  check(row?.iteration===i+1&&row?.id===photo,'wrong original order');
  check(validSHA(sourceHashes?.[photo])&&row?.sourceSHA256===sourceHashes[photo]&&
    row?.observedOriginalSHA256===sourceHashes[photo]&&row?.sourceValid===true,'source JPEG SHA mismatch');
  check(row?.cancelMode===modes[i]&&row?.workerClosed===true,'cancel reason or worker closure not witnessed');
  check(row?.runInvocationObserved===true&&row?.runStage===mark,
    'worker not observed invoking ONNX session.run');
  check(stages.some(stage=>stage?.attempt===i+1&&stage?.stage===mark&&
   Number.isFinite(stage?.elapsedMs)&&stage.elapsedMs>0),
   'missing live page-console ONNX invocation marker');
  check(row?.noModelResult===true&&row?.modelInferenceCompleted===false,
   'canceled run returned completed two-model inference');
  check(row?.privateWrites===0&&row?.automaticAdmissions===0&&row?.ownerApproval===false,
   'owner approval or private save bypass');
  check(row?.itemUnchanged===true&&row?.draftUnchanged===true&&row?.suggestions===0,
   'cancel or lock produced a classification or AI shortcut');
  check(row?.panelCount===(i===0?1:0),
   'cancel must preserve manual Adjust; lock must revoke panel');
 }
 return {status:issues.length?'BLOCKED':'ONNX_INVOKED_OWNER_CANCEL_LOCK_DESKTOP_ONLY_NOT_RELEASE',
  observedSourceCommit:commit??null,completed:r?.completedPhotos??0,
  witnessedONNXInvocationStages:issues.length?null:2,
  witnessedWorkerCreates:r?.pageEvents?.workerCreated??null,
  witnessedWorkerTerminations:r?.pageEvents?.workerTerminated??null,
  issues:[...new Set(issues)],
  completedModelInferenceCredited:false,
  kernelExecutionAtCancellationProven:false,
  realPhysicalPhone:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [receiptPath,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(receiptPath,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(e=>e.verified).map(e=>[e.id,e.sha256]));
 const verdict=verifyActiveONNXCancel28(r,{commit,sourceHashes});
 console.log('MAIN1054_M28_ACTIVE_ONNX_CANCEL_GATE',JSON.stringify(verdict));
 if(verdict.status==='BLOCKED')process.exitCode=2;
}
