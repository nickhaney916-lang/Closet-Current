/** P881 public DEVELOPMENT-only genuine SigLIP mirror-vs-original audit.
 * Human labels are NOT independently blind, so no accuracy/release claims.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyPublicPhotoCustody878} from './p878-public-photo-custody.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {MODELS81} from '../public/model-arbitration-81.mjs';
const validSha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const check=(v,why)=>{if(!v)throw Error('P881_'+why)};
const catalog=new Map(localCandidates.map(x=>[x.label,x]));
function fullRank881(rows){
 check(Array.isArray(rows)&&rows.length===localCandidates.length,'INCOMPLETE_RANK');
 const seen=new Set();
 for(let i=0;i<rows.length;i++){
  const x=rows[i],ref=catalog.get(x?.label);
  check(ref&&!seen.has(x.label)&&x.category===ref.category&&
    x.itemType===ref.itemType&&Number.isFinite(x.score),'VOCABULARY_OR_SCORE');
  check(!i||rows[i-1].score>=x.score,'RANK_SORT');
  seen.add(x.label);
 }
 return rows[0];
}
export function auditMirror881(data,receipts,manifest,{expectedRows=48,hardId='commons-0078'}={}){
 const proof=verifyPublicPhotoCustody878(data,receipts,manifest,{expectedRows});
 check(proof.summary.status==='VERIFIED_PUBLIC_DEVELOPMENT_ONLY'&&
   proof.summary.recomputedDualModelDecisions===expectedRows,'PUBLIC_PHOTO_PROOF');
 const rows=data.rows.map(r=>{
  const output=r.output,exp=output.experiment881;
  const sig=output.observations.find(x=>x.modelKey==='fashionSiglip');
  check(sig?.model?.revision===MODELS81.fashionSiglip.revision,'PINNED_MODEL');
  check(exp?.schema==='p881-optional-horizontal-mirror-v1'&&
   exp.mode==='same-original-rgb-horizontal-mirror'&&
   exp.modelKey==='fashionSiglip'&&exp.sameModelNotIndependent===true&&
   exp.weightsChanged===false,'EXPERIMENT_ORIGIN');
  check(validSha(exp.sourceCodeSha256)&&exp.sourceCodeSha256===output.sourceCodeSha256&&
   validSha(exp.vectorSha256)&&exp.vectorSha256===sig.vectorSha256&&
   exp.inputSha256===sig.binding.inputSha256&&
   Number.isFinite(exp.mirrorMs)&&exp.mirrorMs>=0,'MIRROR_SOURCE');
  const original=fullRank881(sig.ranking),mirrored=fullRank881(exp.mirroredRanking),
   paired=fullRank881(exp.meanRanking),history=r.historicalExpectation;
  check(history&&typeof history.category==='string'&&typeof history.itemType==='string','HISTORY_MISSING');
  return {id:r.id,sourceSha256:r.sourceSha256,historicalType:history.itemType,
   historicalCategory:history.category,originalType:original.itemType,
   mirroredType:mirrored.itemType,pairedType:paired.itemType,
   originalCategory:original.category,mirroredCategory:mirrored.category,
   pairedCategory:paired.category,originalStringMatch:original.itemType===history.itemType,
   mirroredStringMatch:mirrored.itemType===history.itemType,
   pairedStringMatch:paired.itemType===history.itemType,
   originalVsMirroredTopChanged:original.label!==mirrored.label,
   originalVsMeanTopChanged:original.label!==paired.label,mirrorMs:exp.mirrorMs};
 });
 const n=f=>rows.filter(f).length;
 const gains=rows.filter(x=>!x.originalStringMatch&&x.pairedStringMatch).map(x=>x.id);
 const losses=rows.filter(x=>x.originalStringMatch&&!x.pairedStringMatch).map(x=>x.id);
 const hard=rows.find(x=>x.id===hardId);
 check(!hardId||!!hard,'KNOWN_HARD_PHOTO');
 const summary={schema:'mission1-siglip-horizontal-mirror-881-v1',
  cohort:'public-SHA-locked-previously-development-exposed-NOT-independent-blind',
  photos:rows.length,verifiedOriginalPhotoReceipts:proof.summary.photos,
  model:'Marqo/marqo-fashionSigLIP',revision:MODELS81.fashionSiglip.revision,
  originalHistoricalSubtypeStringMatches:n(x=>x.originalStringMatch),
  mirrorHistoricalSubtypeStringMatches:n(x=>x.mirroredStringMatch),
  pairedHistoricalSubtypeStringMatches:n(x=>x.pairedStringMatch),
  originalVsMirrorTopChanges:n(x=>x.originalVsMirroredTopChanged),
  originalVsPairedTopChanges:n(x=>x.originalVsMeanTopChanged),
  pairedHistoricalStringGains:gains.length,pairedHistoricalStringLosses:losses.length,
  gains,losses,knownSneakerCase:hard?{id:hard.id,
   historicalType:hard.historicalType,originalType:hard.originalType,
   mirrorType:hard.mirroredType,pairedType:hard.pairedType}:null,
  extraModelViewTotalMs:Math.round(rows.reduce((s,x)=>s+x.mirrorMs,0)),
  sameModelNotIndependent:true,ownerFacingChanged:false,modelPromoted:false,
  independentHumanBlindSources:0,physicalDevicePlatforms:0,blindAccuracy:null,
  automaticAdmissions:0,releaseReady:false,shouldLiftFamilyAlphaHold:false};
 check(summary.originalHistoricalSubtypeStringMatches+gains.length-losses.length===
   summary.pairedHistoricalSubtypeStringMatches,'HISTORICAL_COMPARISON');
 check(data.summary.rawTop1?.fashionSiglip?.exactSubtypeMatches===
   summary.originalHistoricalSubtypeStringMatches,'ORIGINAL_RANK_BENCHMARK');
 return {summary,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=process.argv[2]||'benchmark/p881-real-chromium/results.json',
  out=process.argv[3]||'benchmark/p881-real-chromium/mirror-audit.json';
 const [data,receipts,reviewed,held]=await Promise.all(
  [input,'benchmark/locked-photo-sources.json','benchmark/manifest-reviewed-32.json',
   'benchmark/manifest-holdout-16.json'].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 const audit=auditMirror881(data,receipts,[...reviewed,...held]);
 await mkdir(dirname(out),{recursive:true});
 await writeFile(out,JSON.stringify(audit,null,2)+'\n');
 console.log('P881_PUBLIC_MIRROR_EXPERIMENT',JSON.stringify({...audit.summary,gains:undefined,losses:undefined}));
}
