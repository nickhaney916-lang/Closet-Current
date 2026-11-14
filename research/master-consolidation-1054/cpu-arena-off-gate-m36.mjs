/** M36: fail-closed memory-arena off/pattern off original-owner research study.
 * Pass cannot certify classifier parity, mobile phone or release.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {auditTypedWebkit35} from './webkit-typed-phase-gate-m35.mjs';
export function auditArenaOffWebkit36(report,{commit}={}){
 const issues=[];
 const check=(v,why)=>{if(!v)issues.push(why);};
 check(report?.schema==='main1054-cpu-arena-off-m36-v1'&&
  report?.runtimeCandidate==='m36-cpu-arena-off','unverified arena-off experiment identity');
 const copy=report&&typeof report==='object'?JSON.parse(JSON.stringify(report)):null;
 if(copy){
  delete copy.runtimeCandidate;
  copy.schema='main1054-webkit-typed-phase-m35-v1';
 }
 const inherited=auditTypedWebkit35(copy,{commit});
 check(inherited.status==='THREE_WEBKIT_TYPED_PHASE_OWNER_TRIALS_OBSERVED_NOT_RELEASE',
  'source-bound real model/worker/owner endurance did not pass');
 return {status:issues.length?'BLOCKED':'THREE_ARENA_OFF_CPU_WEBKIT_OWNER_SESSIONS_OBSERVED_NOT_RELEASE',
  issues:[...new Set([...issues,...inherited.issues])],
  originalPhotoOwnerModelTrials:inherited.trials,
  cpuArenaEnabled:false,memPatternEnabled:false,
  realModelScoreParityWithBaselineMeasured:false,
  blindHumanAccuracyMeasured:false,physicalMobileTests:0,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,commit]=process.argv.slice(2);
 const report=JSON.parse(await readFile(path,'utf8'));
 const model=await readFile('research/master-consolidation-1054/cpu-wasm-review-worker-m36.mjs','utf8');
 const host=await readFile('scripts/serve-webkit-arena-m36.mjs','utf8');
 if(!model.includes('enableCpuMemArena:false,enableMemPattern:false')||
    !model.includes("researchRuntime:'m36-cpu-arena-off'")||
    !host.includes("'/m36/cpu-browser-request-m36.mjs'"))
  throw Error('M36 experiment binary/source identity invalid');
 const verdict=auditArenaOffWebkit36(report,{commit});
 console.log('MAIN1054_M36_CPU_ARENA_OFF_GATE',JSON.stringify(verdict));
 if(verdict.status==='BLOCKED')process.exitCode=2;
}
