// Synthetic structural tests. Never called human, model or hardware evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFourPhotoMemoryTrend} from '../research/master-consolidation-1054/four-photo-memory-trend.mjs';

const commit='a'.repeat(40),code='c'.repeat(64);
const ids=['commons-0035','commons-0062','commons-0078','commons-0059'];
const hashes=Object.fromEntries(ids.map((id,i)=>[id,String(i+1).repeat(64)]));
const mib=1048576;
function fixture(){
  const expected={engine:'webkit',target:4,commit,sourceHashes:hashes};
  const r={codeCommit:commit,engine:'webkit',photoAttemptsTarget:4,completedPhotos:4,
    status:'COMPLETE_OBSERVED',failures:[],
    session:'one-continuous-browser-one-page-sequential-disposable-workers',
    sourceHashesVerified:true,originalPhotoModified:false,
    autoAdmissions:0,persistedPrivateWardrobeWrites:0,
    ownerSessionIdentityChanged:false,authorizedHostedCloud:false,ownerAccount:'synthetic-only',
    blindAccuracy:null,independentHumanPhotoLabels:0,physicalMobileDevices:0,
    officialSafariOnIPhone:false,acceptanceForRelease:false,familyAlpha:'HOLD',
    networkBlocked:0,pageErrors:[],
    pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:4},
    workerSourceCodeSha256:code,uniquePublicPhotoSources:4,
    gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:n<=4,met:n<=4}])),
    resourceMeasurements:{
      browserProcessRSSBytes:80*mib,peakBrowserProcessRSSBytes:90*mib,
      browserTreeSummedRSSBytes:5100*mib,maxSampledBrowserTreeRSSBytes:5500*mib,
      browserTreePSSBytes:4800*mib,maxSampledBrowserTreePSSBytes:5100*mib,
      processCount:4,maxObservedBrowserProcessCount:4,sampleCount:180,sampleIntervalMs:2000,
      measuredMemory:true,rssComplete:true,pssComplete:true,
      source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
      caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'},
    rows:ids.map((id,i)=>({
      iteration:i+1,id,sourceSHA256:hashes[id],observedOriginalSHA256:hashes[id],
      workerSourceCodeSha256:code,sourceValid:true,
      realModelFamilies:['fashionclip','fashionSiglip'],verifiedAssets:12,elapsedInferenceMs:75000,
      privateWrites:0,automaticAdmissions:0,
      processRSSBytes:70*mib,browserTreeSummedRSSBytes:(3200+i*550)*mib,
      browserTreePSSBytes:(2800+i*550)*mib
    }))
  };
  return {r,expected};
}
test('complete four-photo variation is measured but never a release or leak proof',()=>{
  const {r,expected}=fixture(),v=verifyFourPhotoMemoryTrend(r,expected);
  assert.equal(v.status,'FOUR_PHOTO_TREND_MEASURED_NOT_RELEASE');
  assert.deepEqual(v.successivePSSDeltaBytes,[550*mib,550*mib,550*mib]);
  assert.equal(v.firstToFourthPSSDeltaBytes,1650*mib);
  assert.equal(v.observedTrend,'FIRST_TO_FOURTH_INCREASE');
  assert.equal(v.releaseAuthorized,false);assert.equal(v.memoryLeakProven,false);
});
test('decreasing memory is valid, never advertised as leak',()=>{
  const {r,expected}=fixture();for(let i=0;i<4;i++)
    r.rows[i].browserTreePSSBytes=(4000-i*100)*mib;
  const v=verifyFourPhotoMemoryTrend(r,expected);
  assert.equal(v.status,'FOUR_PHOTO_TREND_MEASURED_NOT_RELEASE');
  assert.equal(v.observedTrend,'FIRST_TO_FOURTH_DECREASE');
  assert.equal(v.memoryLeakProven,false);
});
test('identical PSS is valid, not a guarantee of stable long-run performance',()=>{
  const {r,expected}=fixture();
  r.rows.forEach(row=>row.browserTreePSSBytes=3000*mib);
  const v=verifyFourPhotoMemoryTrend(r,expected);
  assert.equal(v.observedTrend,'FIRST_TO_FOURTH_EQUAL');
  assert.equal(v.memoryLeakProven,false);
});
const bad={
  'missing row':r=>r.rows.pop(),
  'altered original bytes':r=>r.rows[2].observedOriginalSHA256='0'.repeat(64),
  'wrong commit':r=>r.codeCommit='f'.repeat(40),
  'browser error':r=>r.pageErrors.push('could not allocate'),
  'automatic save':r=>r.persistedPrivateWardrobeWrites=1,
  'auto-admitted suggestion':r=>r.rows[2].automaticAdmissions=1,
  'model missing':r=>r.rows[1].realModelFamilies=['fashionclip'],
  'same source repeated':r=>{r.rows[3].id=r.rows[0].id;r.rows[3].sourceSHA256=r.rows[0].sourceSHA256;r.rows[3].observedOriginalSHA256=r.rows[0].sourceSHA256},
  'missing PSS row':r=>r.rows[3].browserTreePSSBytes=null,
  'fake PSS':r=>r.rows[2].browserTreePSSBytes=-1,
  'PSS exceeds RSS':r=>r.rows[1].browserTreePSSBytes=7000*mib,
  'row exceeds observed maximum':r=>r.rows[2].browserTreePSSBytes=5200*mib,
  'not enough samples':r=>r.resourceMeasurements.sampleCount=1,
  'unavailable proportional memory':r=>{r.resourceMeasurements.pssComplete=false;r.resourceMeasurements.browserTreePSSBytes=null},
  'false release claim':r=>r.familyAlpha='RELEASED',
  'unobserved browser crash':r=>r.pageEvents.pageCrash=1,
  'incomplete sequence':r=>r.completedPhotos=2
};
for(const [name,mutation] of Object.entries(bad))test('blocks '+name,()=>{
  const {r,expected}=fixture();mutation(r);
  assert.equal(verifyFourPhotoMemoryTrend(r,expected).status,'BLOCKED');
});
