/** M30: same-source native owner JSEP vs independent CPU-WASM, fail-closed.
 * Compares full model rank/order/score and the REAL unsaved owner decisions.
 * Public legal photo fixtures only, no human blind labels or mobile device.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyRealModelMemory} from './real-model-memory-gate.mjs';
import {CPU25_RUNTIME} from './native-cpu-review-gate-m25.mjs';
import {localCandidates} from '../../public/local-catalog.mjs';
const SHA=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const keys=['fashionclip','fashionSiglip'];
const compareItems=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function verifyNativeRuntimeParity30(jsep,cpu,expected={}){
 const issues=[],check=(ok,reason)=>{if(!ok)issues.push(reason);};
 const scoped={engine:'webkit',target:4,...expected};
 check(scoped.target===4,'M31 comparison must include four distinct originals');
 const a=verifyRealModelMemory(jsep,scoped),b=verifyRealModelMemory(cpu,scoped);
 check(a.status==='MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE','original JSEP native source/memory incomplete');
 check(b.status==='MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE','CPU research native source/memory incomplete');
 check(jsep?.schema==='main1054-m31-native-owner-jsep-cpu-four-photo-v1'&&
  cpu?.schema==='main1054-m31-native-owner-jsep-cpu-four-photo-v1','unexpected diagnostic schema');
 check(jsep?.runtimeVariant==='jsep'&&cpu?.runtimeVariant==='cpu','runtime variant mislabeled');
 check(jsep?.pageEvents?.workerCreated===4&&jsep?.pageEvents?.workerTerminated===4&&
  cpu?.pageEvents?.workerCreated===4&&cpu?.pageEvents?.workerTerminated===4,
  'missing worker termination');
 check(jsep?.rows?.length===4&&cpu?.rows?.length===4,'missing photos');
 check(jsep?.workerSourceCodeSha256===cpu?.workerSourceCodeSha256&&SHA(jsep?.workerSourceCodeSha256),
  'different source checksum or unverified worker');
 check(jsep?.familyAlpha==='HOLD'&&cpu?.familyAlpha==='HOLD'&&
  jsep?.autoAdmissions===0&&cpu?.autoAdmissions===0&&
  jsep?.persistedPrivateWardrobeWrites===0&&cpu?.persistedPrivateWardrobeWrites===0,
  'owner privacy and HOLD compromised');
 const pairs=[];
 for(let i=0;i<4;i++){
  const original=jsep?.rows?.[i],candidate=cpu?.rows?.[i],id=['commons-0035','commons-0062','commons-0078','commons-0059'][i];
  check(original?.id===id&&candidate?.id===id&&original?.iteration===i+1&&
   candidate?.iteration===i+1,'mismatched source order');
  check(SHA(scoped.sourceHashes?.[id])&&original?.sourceSHA256===scoped.sourceHashes[id]&&
   candidate?.sourceSHA256===scoped.sourceHashes[id]&&original?.observedOriginalSHA256===scoped.sourceHashes[id]&&
   candidate?.observedOriginalSHA256===scoped.sourceHashes[id],
   'source JPEG changed between runtimes');
  check(candidate?.researchRuntime==='m25-cpu-only-wasm'&&
   candidate?.runtimeJS_SHA256===CPU25_RUNTIME.jsSha256&&
   candidate?.runtimeWASM_SHA256===CPU25_RUNTIME.wasmSha256,
   'non-JSEP WASM runtime not verified');
  check(original?.researchRuntime===null&&original?.runtimeJS_SHA256===undefined&&
   original?.runtimeWASM_SHA256===undefined,'JSEP baseline incorrectly marked as experimental');
  check(original?.sourceValid===true&&candidate?.sourceValid===true&&
   original?.privateWrites===0&&candidate?.privateWrites===0&&
   original?.automaticAdmissions===0&&candidate?.automaticAdmissions===0,
   'owner source or original save changed');
  check(original?.decisionStatus===candidate?.decisionStatus&&
   ['cross_family_hypothesis','abstain'].includes(original?.decisionStatus),
   'runtime changed owner abstention');
  check(compareItems(original?.decisionReasons,candidate?.decisionReasons)&&
   compareItems(original?.ownerChoices,candidate?.ownerChoices)&&
   original?.candidateCount===candidate?.candidateCount,
   'runtime changed visible review recommendations');
  const ranksJ=original?.fullModelRanks,ranksC=candidate?.fullModelRanks;
  check(Array.isArray(ranksJ)&&Array.isArray(ranksC)&&ranksJ.length===2&&ranksC.length===2,
   'missing two genuine model ranking lists');
  const perModel=[];
  for(const model of keys){
   const aj=ranksJ?.find(x=>x.modelKey===model);
   const cj=ranksC?.find(x=>x.modelKey===model);
   check(aj&&cj&&aj.rankings?.length===localCandidates.length&&cj.rankings?.length===localCandidates.length,
    'incomplete frozen 47-label model ranks: '+model);
   if(!aj?.rankings||!cj?.rankings)continue;
   const rankingValid=rs=>rs.length===localCandidates.length&&
    new Set(rs.map(x=>x.label)).size===localCandidates.length&&
    rs.every(x=>localCandidates.some(v=>v.label===x.label&&v.category===x.category&&v.itemType===x.itemType)&&
     Number.isFinite(x.score)&&x.score>=-2&&x.score<=2);
   check(rankingValid(aj.rankings)&&rankingValid(cj.rankings),'invalid source-bound rank rows: '+model);
   let maxAbs=0,scoreMismatches=0,orderMismatches=0;
   const byLabel=new Map(cj.rankings.map(x=>[x.label,x]));
   for(let n=0;n<aj.rankings.length;n++){
    const ra=aj.rankings[n],rb=byLabel.get(ra.label);
    if(!rb){scoreMismatches++;continue;}
    const d=Math.abs(ra.score-rb.score);maxAbs=Math.max(maxAbs,d);
    if(d>0.005)scoreMismatches++;
    if(ra.label!==cj.rankings[n]?.label)orderMismatches++;
   }
   check(scoreMismatches===0&&orderMismatches===0,
    'runtime changed source-matched rank or score tolerance: '+model+'/'+id);
   perModel.push({model,maxScoreDelta:maxAbs,rankOrderIdentical:orderMismatches===0,
    scoresWithinTolerance:scoreMismatches===0,fullVocabularyRows:aj.rankings.length});
  }
  pairs.push({sourceId:id,models:perModel,
   abstentionUnchanged:original?.decisionStatus===candidate?.decisionStatus,
   ownerSuggestionsUnchanged:compareItems(original?.ownerChoices,candidate?.ownerChoices),
   jsepModelMs:original?.elapsedInferenceMs??null,
   cpuModelMs:candidate?.elapsedInferenceMs??null});
 }
 return {status:issues.length?'BLOCKED':'NATIVE_OWNER_JSEP_CPU_FOUR_PHOTO_PARITY_DESKTOP_ONLY_NOT_RELEASE',
  errors:[...new Set(issues)],pairs,
  jsepMaxSampledTreePSSBytes:a.maxSampledBrowserTreePSSBytes??null,
  cpuMaxSampledTreePSSBytes:b.maxSampledBrowserTreePSSBytes??null,
  jsepSampleCount:a.sampleCount??0,cpuSampleCount:b.sampleCount??0,
  sourceMatched:true,realDesktopWebKitOnly:true,independentBlindLabels:0,
  humanClassificationAccuracyMeasured:false,
  physicalIPhone:false,physicalAndroid:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [jsepPath,cpuPath,commit]=process.argv.slice(2);
 const [jsep,cpu,photos]=await Promise.all([
  readFile(jsepPath,'utf8').then(JSON.parse),
  readFile(cpuPath,'utf8').then(JSON.parse),
  readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse)
 ]);
 const result=verifyNativeRuntimeParity30(jsep,cpu,{
  commit,sourceHashes:Object.fromEntries(photos.filter(x=>x.verified).map(x=>[x.id,x.sha256]))
 });
 console.log('MAIN1054_M31_NATIVE_RUNTIME_PARITY_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
