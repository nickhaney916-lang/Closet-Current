// Adversarial synthetic receipts ONLY. Real pretrained results require GitHub CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyNativeRuntimeParity30} from '../research/master-consolidation-1054/native-runtime-parity-gate-m30.mjs';
import {CPU25_RUNTIME} from '../research/master-consolidation-1054/native-cpu-review-gate-m25.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),code='c'.repeat(64),mib=1048576;
const ids=['commons-0035','commons-0062'];
function fixture(){
 const mk=(runtimeVariant)=>({
  schema:'main1054-m30-native-owner-jsep-cpu-source-matched-v1',runtimeVariant,
  engine:'webkit',codeCommit:commit,photoAttemptsTarget:2,completedPhotos:2,
  status:'COMPLETE_OBSERVED',failures:[],
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  ownerAccount:'synthetic-only',authorizedHostedCloud:false,ownerSessionIdentityChanged:false,
  persistedPrivateWardrobeWrites:0,autoAdmissions:0,
  sourceHashesVerified:true,originalPhotoModified:false,blindAccuracy:null,
  independentHumanPhotoLabels:0,physicalMobileDevices:0,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',networkBlocked:0,pageErrors:[],
  uniquePublicPhotoSources:2,workerSourceCodeSha256:code,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:n<=2,met:n<=2}])),
  pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:2,workerTerminated:2},
  resourceMeasurements:{
   browserProcessRSSBytes:90*mib,peakBrowserProcessRSSBytes:100*mib,
   browserTreeSummedRSSBytes:1300*mib,maxSampledBrowserTreeRSSBytes:1450*mib,
   browserTreePSSBytes:1200*mib,maxSampledBrowserTreePSSBytes:1350*mib,
   processCount:5,maxObservedBrowserProcessCount:5,sampleCount:13,sampleIntervalMs:2000,
   measuredMemory:true,rssComplete:true,pssComplete:true,
   source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
   caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'},
  rows:ids.map((id,i)=>({
   id,iteration:i+1,sourceSHA256:hash,observedOriginalSHA256:hash,
   sourceValid:true,workerSourceCodeSha256:code,
   realModelFamilies:['fashionclip','fashionSiglip'],verifiedAssets:9,
   elapsedInferenceMs:10000,privateWrites:0,automaticAdmissions:0,
   researchRuntime:runtimeVariant==='cpu'?'m25-cpu-only-wasm':null,
   ...(runtimeVariant==='cpu'?{
     runtimeJS_SHA256:CPU25_RUNTIME.jsSha256,
     runtimeWASM_SHA256:CPU25_RUNTIME.wasmSha256
   }:{}),
   candidateCount:0,ownerChoices:[],decisionStatus:'abstain',
   decisionReasons:['subtype_disagreement'],
   fullModelRanks:['fashionclip','fashionSiglip'].map(modelKey=>({
    modelKey,
    rankings:localCandidates.map((q,j)=>({
     label:q.label,category:q.category,itemType:q.itemType,
     score:1-j/localCandidates.length
    }))
   })),
   processRSSBytes:90*mib,browserTreeSummedRSSBytes:1300*mib,browserTreePSSBytes:1200*mib
  }))
 });
 return {jsep:mk('jsep'),cpu:mk('cpu'),
  expected:{commit,sourceHashes:Object.fromEntries(ids.map(id=>[id,hash]))}};
}
test('complete native two-model source-matched rank parity is research only',()=>{
 const {jsep,cpu,expected}=fixture();
 const r=verifyNativeRuntimeParity30(jsep,cpu,expected);
 assert.equal(r.status,'NATIVE_OWNER_JSEP_CPU_RANK_PARITY_DESKTOP_ONLY_NOT_RELEASE');
 assert.equal(r.releaseAuthorized,false);assert.equal(r.pairs.length,2);
 assert.ok(r.pairs.every(p=>p.models.length===2&&p.models.every(m=>m.rankOrderIdentical)));
});
const bad={
 'missing original runtime':({jsep})=>jsep.runtimeVariant='cpu',
 'incorrect CPU source':({cpu})=>cpu.rows[0].runtimeJS_SHA256='d'.repeat(64),
 'changed source owner':({cpu})=>cpu.ownerSessionIdentityChanged=true,
 'wrong original JPEG':({cpu})=>cpu.rows[1].observedOriginalSHA256='e'.repeat(64),
 'changed code commit':({cpu})=>cpu.codeCommit='e'.repeat(40),
 'unsaved owner mutated':({jsep})=>jsep.rows[0].privateWrites=1,
 'silent subtype save':({cpu})=>cpu.autoAdmissions=1,
 'missing second original':({cpu})=>cpu.rows.pop(),
 'missing genuine inference':({cpu})=>cpu.rows[0].realModelFamilies=['fashionclip'],
 'different owner decision':({cpu})=>cpu.rows[0].decisionStatus='cross_family_hypothesis',
 'different owner abstention explanation':({cpu})=>cpu.rows[0].decisionReasons=['category_disagreement'],
 'extra AI shortcut':({cpu})=>cpu.rows[1].ownerChoices.push({label:'a blouse',category:'Tops',itemType:'Blouse'}),
 'rank order changed':({cpu})=>cpu.rows[0].fullModelRanks[0].rankings.reverse(),
 'score drift':({cpu})=>cpu.rows[0].fullModelRanks[1].rankings[0].score-=.06,
 'ranking only top ten':({cpu})=>cpu.rows[1].fullModelRanks[1].rankings.splice(10),
 'duplicate ranked garment':({cpu})=>cpu.rows[0].fullModelRanks[0].rankings[2].label='a T-shirt',
 'nonfinite scores':({cpu})=>cpu.rows[0].fullModelRanks[1].rankings[0].score=NaN,
 'worker lifecycle incomplete':({jsep})=>jsep.pageEvents.workerTerminated=1,
 'browser crashed':({jsep})=>jsep.pageEvents.pageCrash=1,
 'missing process PSS':({cpu})=>cpu.resourceMeasurements.pssComplete=false,
 'falsified human accuracy':({jsep})=>jsep.independentHumanPhotoLabels=10,
 'falsified physical Android':({cpu})=>cpu.physicalMobileDevices=1,
 'release flag removed':({cpu})=>cpu.familyAlpha='READY'
};
for(const [name,mutate] of Object.entries(bad))
 test('fail closed: '+name,()=>{
  const f=fixture();mutate(f);
  assert.equal(verifyNativeRuntimeParity30(f.jsep,f.cpu,f.expected).status,'BLOCKED');
 });
