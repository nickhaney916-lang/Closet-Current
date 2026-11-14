/** M25: bound experimental CPU-WASM research results to genuine source/JPEG,
 * original M4 no-auto-save owner review, and exact runtime byte identities.
 * Structural verification never independently proves actual model custody.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyRealModelSequence} from './real-model-sequence-gate.mjs';
import {verifyRealModelMemory} from './real-model-memory-gate.mjs';
export const CPU25_RUNTIME=Object.freeze({
 version:'1.22.0-dev.20250409-89f8206ba4',
 jsSha256:'0cb5ac5be2c414d5b9e361f857108630c6d6e24a5ab9be3cf5f761de55289e94',
 wasmSha256:'f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b'
});
export function verifyNativeCPU25(r,expected){
 const a=verifyRealModelSequence(r,expected),m=verifyRealModelMemory(r,expected);
 const issues=[...a.issues,...m.issues];
 const check=(v,e)=>{if(!v)issues.push(e);};
 check(a.status==='COMPLETE_OBSERVED_NOT_RELEASE','native original source acceptance incomplete');
 check(m.status==='MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE','process memory not measured');
 check(r?.schema==='main1054-m25-native-owner-review-cpu-only-wasm-v1','not M25 native owner-review runner');
 check(expected?.engine==='webkit'&&expected?.target===2,'wrong research target');
 check(r?.engine==='webkit'&&r?.completedPhotos===2,'not real WebKit 2-photo workflow');
 check(r?.pageEvents?.workerCreated>=2&&r?.pageEvents?.workerTerminated>=2,'worker lifetime not observed');
 check(r?.familyAlpha==='HOLD'&&r?.persistedPrivateWardrobeWrites===0&&r?.autoAdmissions===0,'owner safety scope changed');
 for(const row of r?.rows||[]){
  check(row.researchRuntime==='m25-cpu-only-wasm','not actual experimental worker response');
  check(row.runtimeJS_SHA256===CPU25_RUNTIME.jsSha256,'runtime JS source not pinned');
  check(row.runtimeWASM_SHA256===CPU25_RUNTIME.wasmSha256,'runtime WASM source not pinned');
  check(row.sourceValid===true&&row.privateWrites===0&&row.automaticAdmissions===0,'original or owner changed');
  check(Number.isInteger(row.candidateCount)&&row.candidateCount>=0,'invalid owner suggestions');
  check(['cross_family_hypothesis','abstain'].includes(row.decisionStatus),'invalid owner decision');
 }
 return {status:issues.length?'BLOCKED':'NATIVE_OWNER_CPU_WASM_OBSERVED_NOT_RELEASE',
  target:expected?.target??null,completed:r?.completedPhotos??0,
  sampledPSSPeakBytes:m.maxSampledBrowserTreePSSBytes??null,
  issues:[...new Set(issues)],originalSourceGate:a.status,
  memoryGate:m.status,noAutoSave:true,ownerReviewRequired:true,
  realPhysicalPhone:false,blindAccuracyVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(path,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
 const result=verifyNativeCPU25(r,{engine:'webkit',target:2,commit,sourceHashes});
 console.log('MAIN1054_NATIVE_CPU25_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
