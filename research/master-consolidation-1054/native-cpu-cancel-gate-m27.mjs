// M27: independent observed worker cancellation and owner-session lock gates.
// These two flows MUST NOT be counted as successful pretrained inference.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function verifyNativeCancelLock27(r,{commit,sourceHashes}={}){
 const issues=[],check=(yes,why)=>{if(!yes)issues.push(why);};
 check(!!commit&&/^[a-f0-9]{40}$/.test(commit)&&r?.codeCommit===commit,'exact branch commit mismatch');
 check(r?.schema==='main1054-m27-owner-cancel-session-lock-no-inference-v1','unexpected workflow schema');
 check(r?.status==='CANCEL_AND_LOCK_OBSERVED_NOT_RELEASE'&&r?.completedPhotos===2&&r?.photoAttemptsTarget===2&&r?.rows?.length===2,'incomplete cancel/lock evidence');
 check(r?.engine==='webkit'&&r?.session==='one-continuous-browser-one-page-sequential-disposable-workers','not one WebKit owner review browser');
 check(r?.pageEvents?.workerCreated===2&&r?.pageEvents?.workerTerminated===2&&
  r?.pageEvents?.pageCrash===0&&r?.pageEvents?.browserDisconnected===0,'worker leak or page crash');
 check(r?.failures?.length===0&&r?.pageErrors?.length===0&&r?.networkBlocked===0,'unexpected error or network');
 check(r?.sourceHashesVerified===true&&r?.originalPhotoModified===false,'original photo flag');
 check(r?.autoAdmissions===0&&r?.persistedPrivateWardrobeWrites===0&&r?.ownerSessionIdentityChanged===false,'owner write/scope');
 check(r?.ownerAccount==='synthetic-only'&&r?.authorizedHostedCloud===false&&r?.physicalMobileDevices===0&&
  r?.officialSafariOnIPhone===false&&r?.acceptanceForRelease===false&&r?.familyAlpha==='HOLD','release and privacy claims');
 check(Array.isArray(r?.modelFamilies)&&r.modelFamilies.length===0,'cancelled worker cannot claim successful inference');
 const modes=['explicit-owner-cancel','owner-session-locked'],ids=['commons-0035','commons-0062'];
 for(let i=0;i<2;i++){
  const row=r?.rows?.[i];
  check(row?.iteration===i+1&&row?.id===ids[i],'unexpected cancellation source order');
  check(sha(sourceHashes?.[ids[i]])&&row?.sourceSHA256===sourceHashes[ids[i]]&&
    row?.observedOriginalSHA256===sourceHashes[ids[i]]&&row?.sourceValid===true,'original JPEG failed SHA after cancellation');
  check(row?.cancelMode===modes[i]&&row?.workerClosed===true,'cancel/lock was not witnessed');
  check(row?.noModelResult===true&&row?.modelInferenceCompleted===false,
    'late completed-model response may not publish');
  check(row?.privateWrites===0&&row?.automaticAdmissions===0&&row?.ownerApproval===false,'owner approval bypassed');
  check(row?.itemUnchanged===true&&row?.draftUnchanged===true&&row?.suggestions===0,'late subtype update survived cancellation');
  check(row?.panelCount===(i===0?1:0),'cancel must retain manual panel; lock must revoke it');
 }
 return {status:issues.length?'BLOCKED':'NATIVE_CPU_CANCEL_LOCK_OBSERVED_NOT_RELEASE',
  completed:r?.completedPhotos??0,workerCreated:r?.pageEvents?.workerCreated??null,
  workerTerminated:r?.pageEvents?.workerTerminated??null,
  issues:[...new Set(issues)],genuineInferenceCompleted:false,
  originalBytesPreserved:issues.length===0,ownerExplicitApprovalRequired:true,
  physicalMobileVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(path,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(m=>m.verified).map(m=>[m.id,m.sha256]));
 const v=verifyNativeCancelLock27(r,{commit,sourceHashes});
 console.log('MAIN1054_M27_NATIVE_CANCEL_LOCK_GATE',JSON.stringify(v));
 if(v.status==='BLOCKED')process.exitCode=2;
}
