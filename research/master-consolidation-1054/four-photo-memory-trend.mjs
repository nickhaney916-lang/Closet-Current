// Source-locked four-photo development inference memory trend: diagnostic ONLY.
// No evidence of a memory leak, accurate classification, mobile hardware or release.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyRealModelMemory} from './real-model-memory-gate.mjs';

const good=x=>Number.isSafeInteger(x)&&x>0&&x<1e15;
export function verifyFourPhotoMemoryTrend(receipt,expected){
  const base=verifyRealModelMemory(receipt,expected);
  const issues=[...base.issues];
  const check=(yes,label)=>{if(!yes)issues.push(label);};
  check(expected?.target===4&&expected?.engine==='webkit','not pinned four-photo WebKit');
  check(base.status==='MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE','no genuine source-bound memory evidence');
  const rows=Array.isArray(receipt?.rows)?receipt.rows:[];
  check(rows.length===4,'four genuine photo rows required');
  const unique=new Set(rows.map(r=>r.id));
  check(unique.size===4,'source distinctness not established');
  const m=receipt?.resourceMeasurements;
  check(m?.pssComplete===true&&good(m?.maxSampledBrowserTreePSSBytes),'proportional browser memory incomplete');
  const samples=[];
  for(let i=0;i<4;i++){
    const r=rows[i];
    if(!r||r.iteration!==i+1||!good(r.browserTreePSSBytes)||
       !good(r.browserTreeSummedRSSBytes)||!good(r.elapsedInferenceMs)){
      issues.push('missing sampled four-photo inference row');
      continue;
    }
    check(r.browserTreePSSBytes<=r.browserTreeSummedRSSBytes,
      'PSS cannot exceed summed RSS for same sample');
    check(good(m?.maxSampledBrowserTreePSSBytes)&&
      r.browserTreePSSBytes<=m.maxSampledBrowserTreePSSBytes,'per-photo PSS exceeds observed maximum');
    samples.push({attempt:i+1,elapsedInferenceMs:Math.round(r.elapsedInferenceMs),
      browserTreePSSBytes:r.browserTreePSSBytes,
      browserTreeSummedRSSBytes:r.browserTreeSummedRSSBytes});
  }
  const valid=issues.length===0&&samples.length===4;
  const deltas=valid?samples.slice(1).map((s,i)=>s.browserTreePSSBytes-samples[i].browserTreePSSBytes):[];
  const firstToFourthPSSDeltaBytes=valid?samples[3].browserTreePSSBytes-samples[0].browserTreePSSBytes:null;
  return {
    status:valid?'FOUR_PHOTO_TREND_MEASURED_NOT_RELEASE':'BLOCKED',
    codeCommit:expected?.commit??null,
    browser:'desktop Linux WebKit',sampleCount:m?.sampleCount??0,
    completedPhotos:receipt?.completedPhotos??0,
    samples:valid?samples:[],successivePSSDeltaBytes:deltas,
    firstToFourthPSSDeltaBytes,
    observedTrend:valid?(firstToFourthPSSDeltaBytes>0?'FIRST_TO_FOURTH_INCREASE':
      firstToFourthPSSDeltaBytes<0?'FIRST_TO_FOURTH_DECREASE':'FIRST_TO_FOURTH_EQUAL'):'UNMEASURED',
    maxSampledBrowserTreePSSBytes:valid?m.maxSampledBrowserTreePSSBytes:null,
    memoryLeakProven:false,oomProven:false,
    mobilePerformanceVerified:false,recognitionAccuracyVerified:false,
    releaseAuthorized:false,familyAlpha:'HOLD',
    caveat:'Only four sequential development-source desktop measurements. Observed variation does not prove a memory leak, a steady state, an OOM mechanism, or phone memory behavior.',
    issues:[...new Set(issues)]
  };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [path,commit]=process.argv.slice(2);
  const r=JSON.parse(await readFile(path,'utf8'));
  const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
  const sourceHashes=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
  const result=verifyFourPhotoMemoryTrend(r,{engine:'webkit',target:4,commit,sourceHashes});
  console.log('MAIN1054_WEBKIT_FOUR_MEMORY_TREND',JSON.stringify(result));
  if(result.status==='BLOCKED')process.exitCode=2;
}
