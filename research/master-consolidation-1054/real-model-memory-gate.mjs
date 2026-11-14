// Genuine-model MEMORY evidence validator. Structural receipt validity alone
// does not prove true inference/hardware custody. Requires original-source gate.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyRealModelSequence} from './real-model-sequence-gate.mjs';

const positive=x=>Number.isSafeInteger(x)&&x>0&&x<1e15;
const nonnegative=x=>Number.isSafeInteger(x)&&x>=0&&x<1e15;
export function verifyRealModelMemory(r,expected={}){
  const original=verifyRealModelSequence(r,expected),issues=[...original.issues],m=r?.resourceMeasurements;
  const check=(ok,why)=>{if(!ok)issues.push(why);};
  check(original.status==='COMPLETE_OBSERVED_NOT_RELEASE','not original source-bound real-model acceptance');
  check(m?.measuredMemory===true&&Number.isSafeInteger(m?.sampleCount)&&m.sampleCount>=2,'missing repeated observed process sampling');
  check(m?.sampleIntervalMs===2000,'process memory cadence changed');
  check(m?.rssComplete===true,'incomplete sampled process tree RSS');
  check(positive(m?.browserProcessRSSBytes)&&positive(m?.peakBrowserProcessRSSBytes)&&m.peakBrowserProcessRSSBytes>=m.browserProcessRSSBytes,'missing rooted browser RSS samples');
  check(positive(m?.browserTreeSummedRSSBytes)&&positive(m?.maxSampledBrowserTreeRSSBytes)&&m.maxSampledBrowserTreeRSSBytes>=m.browserTreeSummedRSSBytes&&m.browserTreeSummedRSSBytes>=m.browserProcessRSSBytes,'invalid browser descendant RSS');
  check(Number.isSafeInteger(m?.processCount)&&m.processCount>=1&&Number.isSafeInteger(m?.maxObservedBrowserProcessCount)&&m.maxObservedBrowserProcessCount>=m.processCount,'unobserved browser process tree');
  check(m?.source==='Linux /proc status and smaps_rollup, original browser PID descendants only','unsupported measurement source');
  check(typeof m?.caveat==='string'&&m.caveat.includes('not continuous peaks'),'missing sampled-maximum caveat');
  const pssPresent=m?.pssComplete===true;
  if(pssPresent){
    check(positive(m?.browserTreePSSBytes)&&positive(m?.maxSampledBrowserTreePSSBytes)&&m.maxSampledBrowserTreePSSBytes>=m.browserTreePSSBytes,'invalid proportional PSS');
  }else{
    check(m?.browserTreePSSBytes===null,'incomplete PSS misrepresented as complete');
    // Prior samples may contain valid PSS even if the latest sample cannot.
    check(m?.maxSampledBrowserTreePSSBytes===null||positive(m?.maxSampledBrowserTreePSSBytes),'invalid prior PSS maximum');
  }
  for(const row of Array.isArray(r?.rows)?r.rows:[]){
    check(positive(row.processRSSBytes)&&positive(row.browserTreeSummedRSSBytes)&&row.browserTreeSummedRSSBytes>=row.processRSSBytes,'missing real-model row RSS');
    check(row.browserTreePSSBytes===null||positive(row.browserTreePSSBytes),'invalid real-model row PSS');
  }
  check(r?.acceptanceForRelease===false&&r?.familyAlpha==='HOLD','release hold changed');
  return {status:issues.length?'BLOCKED':'MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE',
    engine:expected.engine??null,target:expected.target??null,completed:r?.completedPhotos??0,
    sampleCount:m?.sampleCount??0,pssComplete:pssPresent,
    latestBrowserTreeRSSBytes:m?.browserTreeSummedRSSBytes??null,
    maxSampledBrowserTreeRSSBytes:m?.maxSampledBrowserTreeRSSBytes??null,
    maxSampledBrowserTreePSSBytes:m?.maxSampledBrowserTreePSSBytes??null,
    issues:[...new Set(issues)],physicalPhone:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [path,engine,target,commit]=process.argv.slice(2);
  const r=JSON.parse(await readFile(path,'utf8'));
  const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
  const sourceHashes=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
  const result=verifyRealModelMemory(r,{engine,target:Number(target),commit,sourceHashes});
  console.log('MASTER_REAL_MODEL_MEMORY_GATE',JSON.stringify(result));
  if(result.status==='BLOCKED')process.exitCode=2;
}
