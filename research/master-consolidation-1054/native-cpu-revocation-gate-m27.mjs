/** M27: fail-closed real native CPU-WASM mid-inference revocation receipt.
 * Structural fixtures do not prove that actual pretrained inference ran.
 * Only exact-head genuine browser receipts may support research acceptance.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyNativeCPU25} from './native-cpu-review-gate-m25.mjs';
const CASES=Object.freeze(['cancel','owner','lock','source']);
const SHA=/^[a-f0-9]{64}$/;
export function verifyNativeCPURevocation27(r,expected){
 const base=verifyNativeCPU25(r,expected);
 const issues=[...base.issues];
 const check=(value,why)=>{if(!value)issues.push(why);};
 check(base.status==='NATIVE_OWNER_CPU_WASM_OBSERVED_NOT_RELEASE','native real-model baseline incomplete');
 check(expected?.engine==='webkit'&&expected?.target===2,'must be actual WebKit two-photo baseline');
 check(r?.revocationMode==='m27-native-inflight-revocation','missing native mid-inference scenario');
 check(r?.status==='COMPLETE_OBSERVED'&&r?.failures?.length===0,'incomplete revocation sequence');
 check(Array.isArray(r?.revocationCases)&&r.revocationCases.length===4,'missing one or more cancellation attempts');
 check(r?.pageEvents?.workerCreated===6&&r?.pageEvents?.workerTerminated===6,'each baseline and revoked worker must be created and terminated');
 check(r?.persistedPrivateWardrobeWrites===0&&r?.autoAdmissions===0&&r?.familyAlpha==='HOLD','silent save or release');
 for(let i=0;i<4;i++){
  const row=r?.revocationCases?.[i],kind=CASES[i];
  check(row?.kind===kind,'wrong revocation sequence '+kind);
  check(row?.id===['commons-0035','commons-0062'][i%2],'wrong licensed original for '+kind);
  check(SHA.test(expected?.sourceHashes?.[row?.id]||'')&&row?.observedOriginalSHA256===expected.sourceHashes[row.id],
   'original JPEG missing or altered in '+kind);
  check(row?.firstModelProgressObserved===true&&row?.workerCreatedDelta===1,
   'not truly in-flight real model '+kind);
  check(row?.workerTerminatedDelta===1&&row?.observedCancelError==='P82_CANCELLED',
   'worker cancellation not observed '+kind);
  check(row?.lateModelResultApplied===false&&row?.itemSavedType==='Unknown'&&
   row?.draftTypeBefore==='Unknown'&&row?.draftTypeAfter==='Unknown',
   'stale AI suggestion changed saved/draft subtype '+kind);
  check(row?.ownerApprovalChecked===false&&row?.privateWrites===0&&row?.automaticAdmissions===0,
   'owner approval or private write changed '+kind);
  check(row?.comparisonPanelPresent===(kind==='cancel'),
   'revoked panel still shown or manual cancel removed owner editor '+kind);
 }
 return {status:issues.length?'BLOCKED':'NATIVE_OWNER_CPU_INFLIGHT_REVOCATION_DESKTOP_ONLY_NOT_RELEASE',
  completedBaselinePhotos:r?.completedPhotos??0,
  completedRevocations:r?.revocationCases?.length??0,
  observedWorkerCreated:r?.pageEvents?.workerCreated??0,
  observedWorkerTerminated:r?.pageEvents?.workerTerminated??0,
  sampledPSSPeakBytes:base.sampledPSSPeakBytes??null,
  issues:[...new Set(issues)],
  genuineModelVerifiedByFixtureOnly:false,physicalPhoneVerified:false,
  independentHumanAccuracyVerified:false,hostedCloudVerified:false,
  originalPhoto3DVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(path,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
 const result=verifyNativeCPURevocation27(r,{engine:'webkit',target:2,commit,sourceHashes});
 console.log('MAIN1054_NATIVE_CPU_M27_REVOCATION_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
