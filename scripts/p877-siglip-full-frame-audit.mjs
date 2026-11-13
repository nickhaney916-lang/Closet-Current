/**
 * P877 preregistered alternative FashionSigLIP whole-garment framing audit.
 * Historical developer-exposed strings are NOT independently human-blind truth.
 * Run after real pinned model inference, NEVER from an owner-facing application.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
import {localCandidates} from '../public/local-catalog.mjs';
import {MODELS81} from '../public/model-arbitration-81.mjs';

const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const catalog=new Map(localCandidates.map(c=>[c.label,c]));
function check(condition,reason){if(!condition)throw Error('P877_'+reason);}
function fullRank(r){
 check(Array.isArray(r)&&r.length===localCandidates.length,'INCOMPLETE_RANK');
 const seen=new Set();
 for(let i=0;i<r.length;i++){
  const x=r[i],ref=catalog.get(x?.label);
  check(ref&&!seen.has(x.label)&&x.category===ref.category&&x.itemType===ref.itemType&&Number.isFinite(x.score),'SCORES_OR_TAXONOMY');
  check(i===0||r[i-1].score>=x.score,'UNSORTED_RANK');
  seen.add(x.label);
 }
 return r[0];
}
export function analyzeFrame877(data,{expectedRows=48,hardPhotoId='commons-0078'}={}){
 check(data?.summary?.status==='PUBLIC_DEVELOPMENT_ONLY'&&data.summary?.blindAccuracy===null&&data.summary?.physicalDevices===0,'DATASET_EVIDENCE');
 check(Array.isArray(data.rows)&&data.rows.length===expectedRows&&data.summary.photos===expectedRows,'COHORT_COUNT');
 const all=new Set();
 const rows=data.rows.map(r=>{
  check(typeof r.id==='string'&&!all.has(r.id)&&hex64(r.sourceSha256),'PHOTO_ID_OR_SHA');all.add(r.id);
  check(r.output?.automaticAdmissions===0&&hex64(r.output.sourceCodeSha256),'NO_ADMISSION_OR_WORKER');
  check(Array.isArray(r.output.observations)&&r.output.observations.length===2,'FAMILY_COUNT');
  const clip=r.output.observations.find(x=>x.modelKey==='fashionclip');
  const siglip=r.output.observations.find(x=>x.modelKey==='fashionSiglip');
  check(!!clip&&!!siglip&&clip.model?.revision===MODELS81.fashionclip.revision&&siglip.model?.revision===MODELS81.fashionSiglip.revision,'PINNED_MODELS');
  check(clip.workerSourceSha256===r.output.sourceCodeSha256&&siglip.workerSourceSha256===r.output.sourceCodeSha256,'ORIGINAL_WORKER_PROVENANCE');
  const alt=r.output.experiment877;
  check(alt?.schema==='p877-optional-full-frame-v1'&&alt.modelKey==='fashionSiglip'&&alt.mode==='fitWholePhoto224-white'&&alt.sameModelNotIndependent===true,'EXPERIMENT_ORIGIN');
  check(alt.sourceCodeSha256===r.output.sourceCodeSha256&&alt.vectorSha256===siglip.vectorSha256&&hex64(alt.inputSha256)&&alt.inputSha256===siglip.binding?.inputSha256,'ALTERNATE_SOURCE_PROVENANCE');
  check(Number.isFinite(alt.extraMs)&&alt.extraMs>=0,'ALTERNATE_TIME');
  fullRank(clip.ranking);
  const before=fullRank(siglip.ranking),after=fullRank(alt.ranking);
  check(r.historicalExpectation&&typeof r.historicalExpectation.category==='string'&&typeof r.historicalExpectation.itemType==='string','HISTORICAL_TEXT');
  const truth=r.historicalExpectation;
  return {id:r.id,sourceSha256:r.sourceSha256,historicalCategory:truth.category,
   historicalType:truth.itemType,baselineCategory:before.category,alternateCategory:after.category,
   baselineSubtype:before.itemType,alternateSubtype:after.itemType,
   categoryChanged:before.category!==after.category,subtypeChanged:before.itemType!==after.itemType,
   baselineCategoryStringMatch:before.category===truth.category,
   alternativeCategoryStringMatch:after.category===truth.category,
   baselineExactHistoricalString:before.itemType===truth.itemType,
   alternateExactHistoricalString:after.itemType===truth.itemType,
   samePinnedSiglipWeights:true,extraMs:alt.extraMs};
 });
 check(!hardPhotoId||all.has(hardPhotoId),'HARD_SOURCE_MISSING');
 const sum=(f)=>rows.filter(f).length;
 const originalExact=sum(r=>r.baselineExactHistoricalString);
 const alternateExact=sum(r=>r.alternateExactHistoricalString);
 const gains=rows.filter(r=>!r.baselineExactHistoricalString&&r.alternateExactHistoricalString).map(r=>r.id);
 const losses=rows.filter(r=>r.baselineExactHistoricalString&&!r.alternateExactHistoricalString).map(r=>r.id);
 const categories=[...new Set(rows.map(x=>x.historicalCategory))].sort();
 const byCategory=Object.fromEntries(categories.map(c=>{
  const group=rows.filter(x=>x.historicalCategory===c);
  return [c,{n:group.length,baselineHistoricalCategoryMatches:group.filter(r=>r.baselineCategoryStringMatch).length,
   alternateHistoricalCategoryMatches:group.filter(r=>r.alternativeCategoryStringMatch).length,
   baselineExactHistoricalStrings:group.filter(r=>r.baselineExactHistoricalString).length,
   alternateExactHistoricalStrings:group.filter(r=>r.alternateExactHistoricalString).length}];
 }));
 const garmentRows=rows.filter(x=>x.historicalCategory!=='Uncategorized');
 const negativeRows=rows.filter(x=>x.historicalCategory==='Uncategorized');
 const garmentStringMatches=(group,property)=>group.filter(x=>x[property]&&x[(property==='baselineExactHistoricalString'?'baselineCategory':'alternateCategory')]===x.historicalCategory).length;
 const garmentBaseline=garmentStringMatches(garmentRows,'baselineExactHistoricalString');
 const garmentAlt=garmentStringMatches(garmentRows,'alternateExactHistoricalString');
 const negativeBaseline=negativeRows.filter(x=>x.baselineCategory==='Uncategorized').length;
 const negativeAlt=negativeRows.filter(x=>x.alternateCategory==='Uncategorized').length;
 const hard=rows.find(x=>x.id===hardPhotoId)||null;
 const summary={schema:'mission1-siglip-full-frame-experiment-877-v1',cohort:'source-hash-locked-public-development-exposed-not-blind',
  photos:rows.length,model:'Marqo/marqo-fashionSigLIP',revision:MODELS81.fashionSiglip.revision,
  comparedViews:['original-processor-defined','fitWholePhoto224-white'],
  baselineHistoricalCategoryStrings:sum(x=>x.baselineCategoryStringMatch),
  alternateHistoricalCategoryStrings:sum(x=>x.alternativeCategoryStringMatch),
  baselineExactHistoricalStrings:originalExact,alternateExactHistoricalStrings:alternateExact,
  historicalGarmentRows:garmentRows.length,historicalNegativeRows:negativeRows.length,
  garmentSubtypeHistoricalMatchesBaseline:garmentBaseline,garmentSubtypeHistoricalMatchesAlternate:garmentAlt,
  negativeClassHistoricalMatchesBaseline:negativeBaseline,negativeClassHistoricalMatchesAlternate:negativeAlt,
  changedCategoryFirstRanks:sum(x=>x.categoryChanged),changedSubtypeFirstRanks:sum(x=>x.subtypeChanged),
  historicalExactStringGains:gains.length,historicalExactStringLosses:losses.length,
  gains,losses,hardCase:hard?{id:hard.id,historicalType:hard.historicalType,baselineType:hard.baselineSubtype,alternateType:hard.alternateSubtype}:null,
  extraInferenceTotalMs:Math.round(rows.reduce((s,x)=>s+x.extraMs,0)),
  byHistoricalCategory:byCategory,
  independentHumanBlindSources:0,physicalDevices:0,blindAccuracy:null,
  automaticallyCertified:false,researchOnly:true,modelPromoted:false,releaseReady:false};
 check(garmentRows.length+negativeRows.length===rows.length,'HISTORICAL_COHORT');
 check(garmentBaseline+negativeRows.filter(x=>x.baselineExactHistoricalString).length===originalExact,'BASELINE_HISTORICAL_PARTITION');
 check(garmentAlt+negativeRows.filter(x=>x.alternateExactHistoricalString).length===alternateExact,'ALTERNATE_HISTORICAL_PARTITION');
 check(summary.baselineExactHistoricalStrings+gains.length-losses.length===alternateExact,'ARITHMETIC');
 if(data.summary.rawTop1?.fashionSiglip?.exactSubtypeMatches!==undefined)
  check(data.summary.rawTop1.fashionSiglip.exactSubtypeMatches===originalExact,'ORIGINAL_RANK_MISMATCH');
 return {summary,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=process.argv[2]||'benchmark/p877-real-chromium/results.json',out=process.argv[3]||'benchmark/p877-real-chromium/whole-frame-audit.json';
 const data=JSON.parse(await readFile(input,'utf8')),report=analyzeFrame877(data);
 await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');
 console.log('P877_REAL_SIGLIP_FULL_FRAME_AUDIT',JSON.stringify({...report.summary,byHistoricalCategory:undefined}));
 for(const r of report.rows)console.log('P877_REAL_SIGLIP_FRAME_ROW',r.id,'baseline',r.baselineSubtype,'fullFrame',r.alternateSubtype,'SHA',r.sourceSha256.slice(0,12));
}
