/**
 * Closet Current Parallel #67 / Milestone 4
 * REAL SUPERVISED category and subtype prototypes trained from frozen,
 * independently annotated publisher garment photographs. This is NOT a
 * calibrated automatic wardrobe-save classifier.
 *
 * Training set must be completely disjoint by original ID and JPEG SHA
 * from evaluation set. Generic "Dress"/"Boots" is NOT a fine subtype.
 * A missing class or missing within-category contrast means REVIEW, not guess.
 */
import {localCandidates} from '../public/local-catalog.mjs';

export const P67_04_DIMENSION=768;
export const P67_04_MIN_CATEGORY_EXAMPLES=2;
export const P67_04_MIN_SUBTYPE_EXAMPLES=2;
export const P67_04_CATEGORIES=Object.freeze(
 [...new Set(localCandidates.map(c=>c.category))].filter(cat=>cat!=='Uncategorized'));
const allowed=new Set(P67_04_CATEGORIES);
const exactTypes=new Map(P67_04_CATEGORIES.map(cat=>[
 cat,new Set(localCandidates.filter(x=>x.category===cat).map(x=>x.itemType))
]));
const genericTypes=new Set(['Dress','Boots']);

function assertTrainingRow(row,{allowNegative=false}={}){
 const negative=row?.category==='Uncategorized';
 const permitted=negative?
  allowNegative&&row.type==='Unknown':
  allowed.has(row?.category)&&(
   exactTypes.get(row.category).has(row.type)||
   (row.category==='Dresses'&&row.type==='Dress')||
   (row.category==='Shoes'&&row.type==='Boots')
  );
 if(!row||!/^commons-\d{4}$/.test(row.id)||!permitted||
    typeof row.type!=='string'||!row.type||!row.shaVerified||
    !/^[a-f0-9]{64}$/.test(row.originalSha256||'')||
    !(row.embedding instanceof Float32Array)||row.embedding.length!==P67_04_DIMENSION)
  throw Error('P67-04: invalid frozen labeled source row');
}

function vectorNormalized(row){
 let squared=0;
 for(const v of row.embedding){
  if(!Number.isFinite(v))throw Error('P67-04: nonfinite source embedding');
  squared+=v*v;
 }
 if(!Number.isFinite(squared)||squared<1e-12)throw Error('P67-04: invalid zero feature vector');
 const denom=Math.sqrt(squared);
 return Float64Array.from(row.embedding,x=>x/denom);
}

function makeCentroid(rows){
 const sum=new Float64Array(P67_04_DIMENSION);
 for(const row of rows){
  const unit=row.normalized;
  for(let i=0;i<sum.length;i++)sum[i]+=unit[i];
 }
 let norm=0;for(const v of sum)norm+=v*v;
 if(norm<1e-12)throw Error('P67-04: degenerate identical-opposing training data');
 const divisor=Math.sqrt(norm);
 return Float64Array.from(sum,x=>x/divisor);
}
const countBy=rows=>Object.fromEntries([...new Set(rows)].sort().map(k=>[k,rows.filter(x=>x===k).length]));
const dot=(a,b)=>{let sum=0;for(let i=0;i<a.length;i++)sum+=a[i]*b[i];return sum;};
function rank(unit,prototypes){
 return [...prototypes.entries()].map(([label,entry])=>({
  label,score:dot(unit,entry.center),n:entry.n
 })).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}

export function fitHierarchicalFashion67_04(sourceRows){
 if(!Array.isArray(sourceRows)||sourceRows.length<8)throw Error('P67-04: too few genuine source examples');
 const id=new Set(),sha=new Set();
 const train=sourceRows.map(row=>{
  assertTrainingRow(row);
  if(id.has(row.id)||sha.has(row.originalSha256))
   throw Error('P67-04: duplicate source ID or original SHA in training');
  id.add(row.id);sha.add(row.originalSha256);
  // An actual generic dress or boot label is category supervision, not
  // ground truth for Casual dress, Shirt dress, Ankle boots or Tall boots.
  const type=exactTypes.get(row.category).has(row.type)||genericTypes.has(row.type)?row.type:null;
  return {...row,type,normalized:vectorNormalized(row)};
 });
 const grouped=new Map(P67_04_CATEGORIES.map(cat=>[cat,train.filter(row=>row.category===cat)]));
 const categoryHeads=new Map(),subtypeHeads=new Map(),availability={};
 for(const [category,rows] of grouped){
  if(rows.length>=P67_04_MIN_CATEGORY_EXAMPLES)
   categoryHeads.set(category,{center:makeCentroid(rows),n:rows.length});
  const typeCounts=countBy(rows.map(x=>x.type).filter(Boolean));
  const byType=[...new Set(rows.map(x=>x.type).filter(Boolean))].map(type=>[
   type,rows.filter(x=>x.type===type)
  ]).filter(([,examples])=>examples.length>=P67_04_MIN_SUBTYPE_EXAMPLES);
  // A category with a single trained subtype cannot distinguish clothing
  // types. Do not simply return that type as a "successful" classifier.
  if(byType.length>=2){
   subtypeHeads.set(category,new Map(byType.map(([type,examples])=>[
    type,{center:makeCentroid(examples),n:examples.length}
   ])));
  }
  availability[category]={
   categoryExamples:rows.length,
   categoryHeadAvailable:categoryHeads.has(category),
   exactSourceTypeCounts:typeCounts,
   trainedContrastingTypes:byType.length>=2?byType.map(([type])=>type):[],
   subtypeHeadAvailable:subtypeHeads.has(category),
   missingFineTypeExamples:[...exactTypes.get(category)].filter(x=>!typeCounts[x])
  };
 }
 if(categoryHeads.size<3)throw Error('P67-04: too few supported garment categories');
 return Object.freeze({
  schema:'closet-current-parallel67-supervised-hierarchy/v1',
  categoryHeads,subtypeHeads,availability,
  trainIds:Object.freeze([...id].sort()),
  trainHashes:Object.freeze([...sha].sort()),
  sourceCount:train.length,
  autoWardrobeSaveAllowed:false,
  noNegativeTraining:true,
  thresholdsTunedOnEvaluation:false,
  categoryCounts:countBy(train.map(x=>x.category))
 });
}

export function predictHierarchicalFashion67_04(model,embedding){
 if(model?.schema!=='closet-current-parallel67-supervised-hierarchy/v1'||
  !(embedding instanceof Float32Array)||embedding.length!==P67_04_DIMENSION)
  throw Error('P67-04: invalid trained hierarchy or image vector');
 const normalized=vectorNormalized({embedding});
 const categoryRank=rank(normalized,model.categoryHeads);
 const best=categoryRank[0];
 const typeHeads=model.subtypeHeads.get(best.label);
 const typeRank=typeHeads?rank(normalized,typeHeads):[];
 const selected=typeRank[0];
 return {
  category:best.label,categoryScore:best.score,
  categoryMargin:best.score-(categoryRank[1]?.score??best.score),
  typeSuggestion:selected?.label||null,
  typeScore:selected?.score??null,
  typeMargin:selected?selected.score-(typeRank[1]?.score??selected.score):null,
  typeIsGeneric:!!selected&&genericTypes.has(selected.label),
  typeSupportedByContrastingTrainingExamples:!!selected,
  unsupportedSubtypesRequireReview:!selected||genericTypes.has(selected.label),
  categoryRank:categoryRank.map(x=>({category:x.label,score:x.score,n:x.n})),
  subtypeRank:typeRank.map(x=>({type:x.label,score:x.score,n:x.n})),
  automaticWardrobeSaveAllowed:false,
  uncalibratedCosineRanking:true
 };
}

export function scoreHierarchicalFashion67_04(model,evaluationRows){
 if(!Array.isArray(evaluationRows)||evaluationRows.length!==16||
    new Set(evaluationRows.map(x=>x?.id)).size!==16)
  throw Error('P67-04: incomplete original held-out development audit');
 const trainIDs=new Set(model.trainIds),trainSHAs=new Set(model.trainHashes);
 const scored=evaluationRows.map(row=>{
  assertTrainingRow(row,{allowNegative:true});
  if(trainIDs.has(row.id)||trainSHAs.has(row.originalSha256))
   throw Error('P67-04: original source leak across train/evaluation');
  const pred=predictHierarchicalFashion67_04(model,row.embedding);
  const negative=row.category==='Uncategorized';
  const accepted=row.acceptedTypes||[row.type];
  if(!Array.isArray(accepted)||!accepted.length||
     !accepted.every(x=>typeof x==='string')||
     !accepted.includes(row.type)&&!genericTypes.has(row.type))
   throw Error('P67-04: corrupt frozen human subtype labels');
  const categoryCorrect=pred.category===row.category;
  const subtypeCorrect=categoryCorrect&&pred.typeSuggestion!==null&&
    accepted.includes(pred.typeSuggestion);
  const exactLabelSupported=!negative&&exactTypes.get(row.category)?.has(row.type);
  return {
   id:row.id,expectedCategory:row.category,expectedType:row.type,
   expectedTypeExact:!!exactLabelSupported,
   predictedCategory:pred.category,
   predictedType:pred.typeSuggestion,
   categoryTop1Correct:categoryCorrect,
   subtypeTop1Correct:subtypeCorrect,
   exactSubtypeTop1Correct:exactLabelSupported?subtypeCorrect:null,
   subtypeAvailable:pred.typeSupportedByContrastingTrainingExamples,
   needsManualReview:true,
   originalSourceShaVerified:true,
   negative,
   uncalibratedCosineRanking:true,
   categoryMargin:pred.categoryMargin,
   subtypeMargin:pred.typeMargin
  };
 });
 const positives=scored.filter(x=>!x.negative),negatives=scored.filter(x=>x.negative);
 return {
  schema:'closet-current-parallel67-supervised-hierarchy-diagnostic/v1',
  count:scored.length,garments:positives.length,negatives:negatives.length,
  trainCount:model.sourceCount,
  categoryTop1:positives.filter(x=>x.categoryTop1Correct).length,
  subtypeBroadTop1:positives.filter(x=>x.subtypeTop1Correct).length,
  exactSubtypeLabelCount:positives.filter(x=>x.expectedTypeExact).length,
  exactSubtypeTop1:positives.filter(x=>x.exactSubtypeTop1Correct===true).length,
  subtypeReviewNeeded:positives.filter(x=>!x.subtypeAvailable).length,
  negativeTop1:negatives.filter(x=>x.categoryTop1Correct).length,
  automaticWardrobeSaved:0,automaticSaveAllowed:false,
  newBlindIndependentEvidence:false,
  trainingPhotoSHASeparated:true,
  colorNotMeasured:true,instanceSegmentationNotMeasured:true,
  sourceRows:scored
 };
}
