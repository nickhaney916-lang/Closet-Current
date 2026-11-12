/**
 * Parallel #67 — genuinely independent SigLIP zero-shot ranking, research only.
 *
 * Distinct weights/training objective from existing ff13 FashionCLIP.
 * SigLIP sigmoid scores are not class probabilities or validated confidence.
 * A top-1 ranking is NEVER an automatic saved-closet admission.
 */
import {localCandidates} from '../public/local-catalog.mjs';

export const P67_MODEL='Xenova/siglip-base-patch16-224';
export const P67_REVISION='4649052661e53c7000355844105f8a1792088239';
export const P67_LABELS=Object.freeze(localCandidates.map(x=>x.label));
const candidates=new Map(localCandidates.map(x=>[x.label,x]));
const categories=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);

export function rankIndependentSiglip67(raw){
 if(!Array.isArray(raw)||raw.length!==P67_LABELS.length||new Set(raw.map(x=>x?.label)).size!==P67_LABELS.length)
  throw Error('P67: incomplete or duplicate alternative model labels');
 const choices=raw.map(x=>{
  if(!x||typeof x.label!=='string'||!candidates.has(x.label)||
     !Number.isFinite(x.score)||x.score<0||x.score>1)throw Error('P67: invalid alternative model output');
  const source=candidates.get(x.label);
  return {category:source.category,type:source.itemType,label:source.label,score:x.score};
 }).sort((a,b)=>b.score-a.score);
 const top=choices[0],second=choices[1];
 // Differences between independent sigmoid scores are NOT calibrated odds.
 return {top:{category:top.category,type:top.type,score:top.score},
  runnerUp:{category:second.category,type:second.type,score:second.score},
  scoreGap:top.score-second.score,
  categoryRank:[...new Set(choices.map(x=>x.category))],
  topThree:choices.slice(0,3).map(x=>({category:x.category,type:x.type,score:x.score})),
  admissionAllowed:false,
  scoreMeaning:'uncalibrated-sigmoid-ranking-only'};
}

export function evaluateIndependentSiglip67(frozen,rows){
 if(!Array.isArray(frozen)||frozen.length!==16||!Array.isArray(rows)||rows.length!==16||
   new Set(frozen.map(x=>x.id)).size!==16||new Set(rows.map(x=>x.id)).size!==16)
  throw Error('P67: incomplete historical source set');
 const typed=rows.map((x,i)=>{
  const original=frozen[i];
  if(x.id!==original.id||x.expectedCategory!==original.expectedCategory||
     x.expectedType!==original.expectedType||
     !categories.has(x.expectedCategory)||x.admissionAllowed!==false||
     !x.sourceShaVerified||!Array.isArray(x.categoryRank)||
     x.scoreMeaning!=='uncalibrated-sigmoid-ranking-only')
   throw Error('P67: source or primary-label integrity failure');
  if(x.top?.category&&(!categories.has(x.top.category)||typeof x.top.type!=='string'))
   throw Error('P67: unsupported model prediction');
  if(x.error&&!['model','download','decode','runtime'].includes(x.error))
   throw Error('P67: invalid source error code');
  if(x.error&&x.top!==null)throw Error('P67: error cannot become a prediction');
  const negative=original.expectedCategory==='Uncategorized';
  const acceptedTypes=original.acceptedTypes||[original.expectedType];
  return {
   id:x.id,truthCategory:original.expectedCategory,truthSubtype:original.expectedType,
   predictedCategory:x.top?.category||null,predictedSubtype:x.top?.type||null,
   predictedScore:x.top?.score??null,scoreGap:x.scoreGap??null,
   categoryTop1Correct:!x.error&&x.top?.category===original.expectedCategory,
   subtypeTop1Correct:!x.error&&!negative&&x.top?.category===original.expectedCategory&&acceptedTypes.includes(x.top?.type),
   categoryOnly:negative,
   error:x.error||null
  };
 });
 const garment=typed.filter(x=>!x.categoryOnly),negatives=typed.filter(x=>x.categoryOnly);
 return {
  schema:'closet-current-parallel67-foreign-siglip-developer-exposed-v1',
  model:P67_MODEL,revision:P67_REVISION,
  independentModelFromFashionCLIP:true,
  developerExposedNotBlind:true,
  candidateScoresNotCalibrated:true,
  automaticSaveAdmissionAllowed:false,
  originalCount:typed.length,garments:garment.length,negatives:negatives.length,
  categoryTop1:garment.filter(x=>x.categoryTop1Correct).length,
  broadSubtypeTop1:garment.filter(x=>x.subtypeTop1Correct).length,
  negativeTop1:negatives.filter(x=>x.categoryTop1Correct).length,
  runtimeErrors:typed.filter(x=>x.error).length,
  byCategory:Object.fromEntries([...new Set(garment.map(x=>x.truthCategory))].map(cat=>{
   const sub=garment.filter(x=>x.truthCategory===cat);
   return [cat,{n:sub.length,categoryTop1:sub.filter(x=>x.categoryTop1Correct).length,
    subtypeTop1:sub.filter(x=>x.subtypeTop1Correct).length}];
  })),
  rows:typed
 };
}
