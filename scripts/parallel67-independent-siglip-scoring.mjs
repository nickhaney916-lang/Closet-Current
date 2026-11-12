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
export const P67_FASHION_MODEL='Marqo/marqo-fashionSigLIP';
// ONNX was introduced Sep 2024, and the Sep 17 pinned commit contains that model.
export const P67_FASHION_REVISION='782eaf7a0b95411ac96893d2300d1a61a2bcb757';
export const P67_ALLOWED_MODELS=Object.freeze({[P67_MODEL]:P67_REVISION,[P67_FASHION_MODEL]:P67_FASHION_REVISION});
export const P67_LABELS=Object.freeze(localCandidates.map(x=>x.label));
const candidates=new Map(localCandidates.map(x=>[x.label,x]));
const categories=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);

export function rankIndependentSiglip67(raw,{scoreMeaning='uncalibrated-sigmoid-ranking-only'}={}){
 if(!['uncalibrated-sigmoid-ranking-only','uncalibrated-cosine-ranking-only'].includes(scoreMeaning))
  throw Error('P67: unapproved independent embedding score interpretation');
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
  scoreMeaning};
}

export function evaluateIndependentSiglip67(frozen,rows,{model=P67_MODEL,revision=P67_REVISION}={}){
 if(!Object.hasOwn(P67_ALLOWED_MODELS,model)||P67_ALLOWED_MODELS[model]!==revision)throw Error('P67: unsupported unpinned independent model');
 if(!Array.isArray(frozen)||frozen.length!==16||!Array.isArray(rows)||rows.length!==16||
   new Set(frozen.map(x=>x.id)).size!==16||new Set(rows.map(x=>x.id)).size!==16)
  throw Error('P67: incomplete historical source set');
 const typed=rows.map((x,i)=>{
  const original=frozen[i];
  if(x.id!==original.id||x.expectedCategory!==original.expectedCategory||
     x.expectedType!==original.expectedType||
     !categories.has(x.expectedCategory)||x.admissionAllowed!==false||
     !x.sourceShaVerified||!Array.isArray(x.categoryRank)||
     x.scoreMeaning!==(model===P67_FASHION_MODEL?'uncalibrated-cosine-ranking-only':'uncalibrated-sigmoid-ranking-only'))
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
  model,revision,
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


/** Source-independent cosine similarities between actual q8 ONNX text/vision
 * SigLIP pooler embeddings. Text model loaded once, original source decoded
 * locally. Class ranking only; no calibrated class probability or auto-save.
 */
export function rankSplitFashionEmbeddings67(imageEmbedding,textEmbeddings,dim=768){
 if(!Number.isInteger(dim)||dim<64||dim>1024||
    !(imageEmbedding instanceof Float32Array)||
    !(textEmbeddings instanceof Float32Array)||
    imageEmbedding.length!==dim||textEmbeddings.length!==P67_LABELS.length*dim)
  throw Error('P67: invalid independent split ONNX embedding dimensions');
 const norm=v=>{
  let n=0;for(const x of v){if(!Number.isFinite(x))throw Error('P67: nonfinite ONNX embedding');n+=x*x;}
  if(n<1e-16)throw Error('P67: zero ONNX embedding');
  return Math.sqrt(n);
 };
 const imageNorm=norm(imageEmbedding);
 const scores=[];
 for(let k=0;k<P67_LABELS.length;k++){
  const offset=k*dim,vector=textEmbeddings.subarray(offset,offset+dim);
  const textNorm=norm(vector);
  let dot=0;
  for(let n=0;n<dim;n++)dot+=imageEmbedding[n]*vector[n];
  const cos=Math.max(-1,Math.min(1,dot/(imageNorm*textNorm)));
  scores.push({label:P67_LABELS[k],score:(cos+1)/2});
 }
 return rankIndependentSiglip67(scores,{scoreMeaning:'uncalibrated-cosine-ranking-only'});
}
