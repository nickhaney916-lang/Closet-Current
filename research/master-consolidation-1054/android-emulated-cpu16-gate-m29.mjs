/** M29: genuine desktop Chromium Android-device-emulated native owner review.
 * Does not imply physical Android Chrome or hardware memory results.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyRealModelSequence} from './real-model-sequence-gate.mjs';
import {verifyRealModelMemory} from './real-model-memory-gate.mjs';
import {CPU25_RUNTIME} from './native-cpu-review-gate-m25.mjs';
const positive=x=>Number.isSafeInteger(x)&&x>0;
export function verifyAndroidEmulated29(r,expected={}){
 const source=verifyRealModelSequence(r,expected),mem=verifyRealModelMemory(r,expected);
 const issues=[...source.issues,...mem.issues];
 const check=(p,reason)=>{if(!p)issues.push(reason);};
 check(expected.engine==='chromium'&&expected.target===16,'expected real desktop Chromium sixteen-photo case');
 check(source.status==='COMPLETE_OBSERVED_NOT_RELEASE'&&mem.status==='MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE',
  'source-bound model or process memory evidence missing');
 check(r?.schema==='main1054-m29-android-emulated-cpu-owner-review-v1','wrong research schema');
 check(r?.engine==='chromium'&&r?.photoAttemptsTarget===16&&r?.completedPhotos===16&&r?.rows?.length===16,'missing genuine Chromium model review');
 check(r?.uniquePublicPhotoSources===4,'required 4 original photos');
 const emu=r?.mobileEmulationEvidence;
 check(emu?.androidUserAgent===true&&positive(emu?.touchPoints)&&
  emu?.coarsePointer===true&&Number.isFinite(emu?.devicePixelRatio)&&emu.devicePixelRatio>1&&
  Number.isInteger(emu?.innerWidth)&&emu.innerWidth>300&&emu.innerWidth<600,
  'Android-like touch device emulation not witnessed');
 check(r?.physicalDeviceEvidence===false&&r?.physicalMobileDevices===0&&r?.officialSafariOnIPhone===false,
  'desktop emulator cannot claim actual phone');
 check(r?.pageEvents?.workerCreated===16&&r?.pageEvents?.workerTerminated===16,'workers not reliably terminated');
 check(r?.pageEvents?.pageCrash===0&&r?.pageEvents?.browserDisconnected===0&&r?.pageErrors?.length===0,'browser failure');
 check(r?.persistedPrivateWardrobeWrites===0&&r?.autoAdmissions===0&&r?.ownerSessionIdentityChanged===false&&
  r?.familyAlpha==='HOLD'&&r?.acceptanceForRelease===false&&r?.authorizedHostedCloud===false,
  'owner/production safety changed');
 const ids=['commons-0035','commons-0062','commons-0078','commons-0059'];
 for(let i=0;i<16;i++){
  const row=r?.rows?.[i];
  check(row?.iteration===i+1&&row?.id===ids[i%4],'unverified photo iteration');
  check(row?.researchRuntime==='m25-cpu-only-wasm'&&
   row?.runtimeJS_SHA256===CPU25_RUNTIME.jsSha256&&
   row?.runtimeWASM_SHA256===CPU25_RUNTIME.wasmSha256,'wrong CPU worker or source');
  check(row?.sourceValid===true&&row?.privateWrites===0&&row?.automaticAdmissions===0,'source/owner write');
  check(['cross_family_hypothesis','abstain'].includes(row?.decisionStatus)&&
   Number.isInteger(row?.candidateCount)&&row.candidateCount>=0,'unknown/automatic model decision');
  check(positive(row?.browserTreePSSBytes),'per-photo memory measurement unavailable');
 }
 return {status:issues.length?'BLOCKED':'ANDROID_EMULATED_CHROMIUM_NATIVE_CPU16_OBSERVED_NOT_RELEASE',
  errors:[...new Set(issues)],completed:r?.completedPhotos??0,
  emulatedViewportWidth:emu?.innerWidth??null,
  touchEmulationWitnessed:emu?.coarsePointer===true&&positive(emu?.touchPoints),
  maxSampledBrowserTreePSSBytes:mem.maxSampledBrowserTreePSSBytes??null,
  processSamples:mem.sampleCount??0,
  sourceGate:source.status,memoryGate:mem.status,
  actualPhysicalAndroidDevice:false,actualPhysicalIPhone:false,
  realDevicePerformanceMeasured:false,independentBlindAccuracy:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [receiptPath,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(receiptPath,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(s=>s.verified).map(s=>[s.id,s.sha256]));
 const result=verifyAndroidEmulated29(r,{engine:'chromium',target:16,commit,sourceHashes});
 console.log('MAIN1054_M29_ANDROID_EMULATED_CPU16_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
