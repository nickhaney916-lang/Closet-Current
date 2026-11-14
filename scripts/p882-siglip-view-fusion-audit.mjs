/**
 * Closet Current Mission 1 P882 — predeclared 50/50 SAME-MODEL SigLIP score fusion.
 * This is a public DEVELOPMENT-only retrospective audit of genuine pinned q8
 * original and whole-frame model outputs. No training, no owner UI, no save.
 * Two views of ONE encoder NEVER count as independent votes.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyPublicPhotoCustody878} from './p878-public-photo-custody.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {MODELS81} from '../public/model-arbitration-81.mjs';

const known=new Map(localCandidates.map(c=>[c.label,c]));
const require882=(condition,reason)=>{if(!condition)throw Error('P882_'+reason);};
const labelTop=rank=>rank[0];
function ensureScores(rank){
 require882(Array.isArray(rank)&&rank.length===known.size,'FULL_VOCABULARY');
 const seen=new Set();
 for(let i=0;i<rank.length;i++){
  const entry=rank[i],c=known.get(entry?.label);
  require882(!!c&&!seen.has(entry.label)&&entry.category===c.category&&
   entry.itemType===c.itemType&&entry.sleeveLength===c.sleeveLength,'RANK_TAXONOMY');
  // Both original and whole-frame are cosine similarities between normalized
  // SAME model image and text embeddings; their scalar scores are comparable.
  require882(Number.isFinite(entry.score)&&entry.score>=-1.001&&entry.score<=1.001,'COSINE_RANGE');
  require882(!i||rank[i-1].score>=entry.score,'RANK_ORDER');
  seen.add(entry.label);
 }
}
export function fuseSiglipViews882(original,whole){
 ensureScores(original);ensureScores(whole);
 const originalMap=new Map(original.map(x=>[x.label,x.score]));
 const wholeMap=new Map(whole.map(x=>[x.label,x.score]));
 require882(originalMap.size===known.size&&wholeMap.size===known.size,'SHARED_LABELS');
 // Predeclared one-time 50/50 score mean: no learned weights, label-specific
 // weighting, threshold optimisation or source-ID-dependent exceptions.
 return localCandidates.map(c=>({...c,score:(originalMap.get(c.label)+wholeMap.get(c.label))/2}))
  .sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}
export function auditSiglipViewFusion882(data,receipts,manifest,{expectedRows=48,hardId='commons-0078'}={}){
 const proof=verifyPublicPhotoCustody878(data,receipts,manifest,{expectedRows});
 require882(proof.summary.photos===expectedRows&&proof.summary.recomputedDualModelDecisions===expectedRows,'SOURCE_AND_MODEL_CUSTODY');
 const rows=data.rows.map(row=>{
  const output=row.output,obs=output.observations,original=obs.find(x=>x.modelKey==='fashionSiglip'),
   alt=output.experiment877;
  require882(original?.model?.revision===MODELS81.fashionSiglip.revision,'PINNED_SIGLIP');
  require882(alt?.schema==='p877-optional-full-frame-v1'&&alt.mode==='fitWholePhoto224-white'&&
   alt.modelKey==='fashionSiglip'&&alt.sameModelNotIndependent===true,'SAME_MODEL_VIEW');
  require882(alt.sourceCodeSha256===output.sourceCodeSha256&&
   alt.vectorSha256===original.vectorSha256&&alt.inputSha256===original.binding.inputSha256,'BOUND_WHOLE_FRAME');
  require882(Number.isFinite(alt.extraMs)&&alt.extraMs>=0,'FRAME_TIME');
  const joined=fuseSiglipViews882(original.ranking,alt.ranking);
  const first=labelTop(original.ranking),full=labelTop(alt.ranking),mean=labelTop(joined);
  const historical=row.historicalExpectation;
  require882(!!historical&&typeof historical.category==='string'&&
   typeof historical.itemType==='string','HISTORICAL_TEXT');
  return {id:row.id,sourceSha256:row.sourceSha256,historicalCategory:historical.category,
   historicalSubtype:historical.itemType,originalSubtype:first.itemType,
   wholeFrameSubtype:full.itemType,meanSubtype:mean.itemType,
   originalCategory:first.category,wholeFrameCategory:full.category,meanCategory:mean.category,
   originalHistoricalMatch:first.itemType===historical.itemType,
   wholeFrameHistoricalMatch:full.itemType===historical.itemType,
   meanHistoricalMatch:mean.itemType===historical.itemType,
   originalVsWholeRankChanged:first.label!==full.label,
   originalVsMeanRankChanged:first.label!==mean.label,
   wholeVsMeanRankChanged:full.label!==mean.label,
   additionalWholeFrameMs:alt.extraMs};
 });
 const count=fn=>rows.filter(fn).length;
 const originals=rows.filter(x=>x.historicalCategory!=='Uncategorized');
 const negatives=rows.filter(x=>x.historicalCategory==='Uncategorized');
 const gains=rows.filter(x=>!x.originalHistoricalMatch&&x.meanHistoricalMatch).map(x=>x.id);
 const losses=rows.filter(x=>x.originalHistoricalMatch&&!x.meanHistoricalMatch).map(x=>x.id);
 const altGains=rows.filter(x=>!x.wholeFrameHistoricalMatch&&x.meanHistoricalMatch).map(x=>x.id);
 const altLosses=rows.filter(x=>x.wholeFrameHistoricalMatch&&!x.meanHistoricalMatch).map(x=>x.id);
 const knownCase=rows.find(x=>x.id===hardId);
 require882(!hardId||!!knownCase,'KNOWN_SNEAKER_MISSING');
 const summary={schema:'mission1-siglip-original-whole-mean-882-v1',
  cohort:'48-source-SHA-locked-DEVELOPMENT_EXPOSED_NOT_HUMAN_BLIND',
  photos:rows.length,sourceOriginalsVerified:proof.summary.photos,model:MODELS81.fashionSiglip.id,
  pinnedRevision:MODELS81.fashionSiglip.revision,
  predeclaredFusion:'one-half-original-plus-one-half-whole-score',
  sameModelNotIndependent:true,noNewModelInferenceBeyondP877:true,
  originalHistoricalSubtypeStrings:count(x=>x.originalHistoricalMatch),
  wholeFrameHistoricalSubtypeStrings:count(x=>x.wholeFrameHistoricalMatch),
  equalMeanHistoricalSubtypeStrings:count(x=>x.meanHistoricalMatch),
  garmentRows:originals.length,negativeRows:negatives.length,
  originalGarmentHistoricalStrings:originals.filter(x=>x.originalHistoricalMatch).length,
  wholeGarmentHistoricalStrings:originals.filter(x=>x.wholeFrameHistoricalMatch).length,
  meanGarmentHistoricalStrings:originals.filter(x=>x.meanHistoricalMatch).length,
  originalNegativeHistoricalStrings:negatives.filter(x=>x.originalHistoricalMatch).length,
  wholeNegativeHistoricalStrings:negatives.filter(x=>x.wholeFrameHistoricalMatch).length,
  meanNegativeHistoricalStrings:negatives.filter(x=>x.meanHistoricalMatch).length,
  originalVsWholeRankChanges:count(x=>x.originalVsWholeRankChanged),
  originalVsMeanRankChanges:count(x=>x.originalVsMeanRankChanged),
  wholeVsMeanRankChanges:count(x=>x.wholeVsMeanRankChanged),
  meanGainsVsOriginal:gains.length,meanLossesVsOriginal:losses.length,
  meanGainsVsFullFrame:altGains.length,meanLossesVsFullFrame:altLosses.length,
  gainsVsOriginal:gains,lossesVsOriginal:losses,
  gainsVsFullFrame:altGains,lossesVsFullFrame:altLosses,
  knownSneaker:knownCase?{id:knownCase.id,historicalType:knownCase.historicalSubtype,
   originalType:knownCase.originalSubtype,wholeType:knownCase.wholeFrameSubtype,
   equalMeanType:knownCase.meanSubtype}:null,
  wholeFrameInferenceTotalMs:Math.round(rows.reduce((sum,x)=>sum+x.additionalWholeFrameMs,0)),
  ownerPathModified:false,automaticallySavedGarments:0,modelPromoted:false,
  independentHumanBlindSources:0,physicalDevicePlatforms:0,blindAccuracy:null,
  releaseReady:false,shouldLiftFamilyAlphaHold:false};
 require882(summary.originalHistoricalSubtypeStrings+gains.length-losses.length===
   summary.equalMeanHistoricalSubtypeStrings,'ORIGINAL_GAIN_LOSS_ARITHMETIC');
 require882(summary.wholeFrameHistoricalSubtypeStrings+altGains.length-altLosses.length===
   summary.equalMeanHistoricalSubtypeStrings,'WHOLE_GAIN_LOSS_ARITHMETIC');
 require882(originals.length+negatives.length===rows.length,'HISTORICAL_PARTITION');
 require882(data.summary.rawTop1?.fashionSiglip?.exactSubtypeMatches===
   summary.originalHistoricalSubtypeStrings,'SOURCE_BASELINE');
 return {summary,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=process.argv[2]||'benchmark/p882-real-chromium/results.json',
  output=process.argv[3]||'benchmark/p882-real-chromium/equal-view-audit.json';
 const [data,receipts,reviewed,holdout]=await Promise.all(
  [input,'benchmark/locked-photo-sources.json','benchmark/manifest-reviewed-32.json',
   'benchmark/manifest-holdout-16.json'].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 const report=auditSiglipViewFusion882(data,receipts,[...reviewed,...holdout]);
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 const {gainsVsOriginal,lossesVsOriginal,gainsVsFullFrame,lossesVsFullFrame,...summary}=report.summary;
 console.log('P882_PUBLIC_SIGLIP_EQUAL_VIEW',JSON.stringify(summary));
}
