/** M26: strictly source-bound continuous 16-photo actual native owner CPU-WASM.
 * Research-only evidence: never imply phone, human ground truth or release.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyRealModelSequence} from './real-model-sequence-gate.mjs';
import {verifyRealModelMemory} from './real-model-memory-gate.mjs';
import {CPU25_RUNTIME} from './native-cpu-review-gate-m25.mjs';
const good=x=>Number.isSafeInteger(x)&&x>0;
export function verifyNativeCPUEndurance26(r,expected){
 const orig=verifyRealModelSequence(r,expected),mem=verifyRealModelMemory(r,expected);
 const issues=[...orig.issues,...mem.issues];
 const check=(ok,e)=>{if(!ok)issues.push(e);};
 check(expected?.engine==='webkit'&&expected?.target===16,'expected WebKit 16');
 check(orig.status==='COMPLETE_OBSERVED_NOT_RELEASE'&&mem.status==='MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE','base source+memory receipt incomplete');
 check(r?.schema==='main1054-m25-native-owner-review-cpu-only-wasm-v1','not actual native M25 source');
 check(r?.photoAttemptsTarget===16&&r?.completedPhotos===16&&r?.rows?.length===16,'missing one or more original photo requests');
 check(r?.uniquePublicPhotoSources===4,'required four distinct licensed development originals');
 check(r?.pageEvents?.workerCreated===16&&r?.pageEvents?.workerTerminated===16,'workers were reused or not terminated');
 check(r?.familyAlpha==='HOLD'&&r?.autoAdmissions===0&&r?.persistedPrivateWardrobeWrites===0,'owner save safety');
 for(let i=0;i<16;i++){
  const row=r?.rows?.[i];
  check(row?.iteration===i+1&&row?.id===['commons-0035','commons-0062','commons-0078','commons-0059'][i%4],'unexpected original photo order');
  check(row?.researchRuntime==='m25-cpu-only-wasm'&&row?.runtimeJS_SHA256===CPU25_RUNTIME.jsSha256&&row?.runtimeWASM_SHA256===CPU25_RUNTIME.wasmSha256,'alternate model runtime not exact');
  check(row?.sourceValid===true&&row?.privateWrites===0&&row?.automaticAdmissions===0,'source or owner scope changed');
  check(['cross_family_hypothesis','abstain'].includes(row?.decisionStatus),'unsupported auto-classification');
  check(Number.isInteger(row?.candidateCount)&&row.candidateCount>=0,'invalid owner choice count');
  check(good(row?.browserTreePSSBytes)&&good(row?.browserTreeSummedRSSBytes),'missing per-photo real desktop memory');
 }
 const pss=Array.isArray(r?.rows)?r.rows.map(v=>v.browserTreePSSBytes):[];
 return {status:issues.length?'BLOCKED':'NATIVE_CPU_16_PHOTO_ENDURANCE_DESKTOP_ONLY_NOT_RELEASE',
  completed:r?.completedPhotos??0,expected:16,
  minPerPhotoPSSBytes:issues.length?null:Math.min(...pss),
  maxPerPhotoPSSBytes:issues.length?null:Math.max(...pss),
  maxSampledBrowserTreePSSBytes:mem.maxSampledBrowserTreePSSBytes??null,
  sampleCount:mem.sampleCount??0,
  errors:[...new Set(issues)],
  originalSourceGate:orig.status,memoryGate:mem.status,
  physicalMobileVerified:false,humanBlindAccuracyVerified:false,hostedCloudVerified:false,
  photographed3DVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(path,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
 const result=verifyNativeCPUEndurance26(r,{engine:'webkit',target:16,commit,sourceHashes});
 console.log('MAIN1054_NATIVE_CPU16_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
