/**
 * Compare exactly the SAME 16 publisher originals from green fashion-trained
 * zero-shot PR #896 against the new actually-trained hierarchical prototypes.
 * Forced top1 vs forced top1 only, never calibrated confidence or auto save.
 * These images were already used in development and are NOT blind test data.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {P67_FASHION_MODEL,P67_FASHION_REVISION} from './parallel67-independent-siglip-scoring.mjs';

export function compareSupervisedHierarchy67_04(original,supervised){
 const fail=reason=>{throw Error('P67-04: unequal source comparison '+reason);};
 if(!original||!supervised||
    original.schema!=='closet-current-parallel67-foreign-siglip-developer-exposed-v1'||
    supervised.schema!=='closet-current-parallel67-supervised-hierarchy-diagnostic/v1'||
    original.model!==P67_FASHION_MODEL||supervised.model!==P67_FASHION_MODEL||
    original.revision!==P67_FASHION_REVISION||supervised.revision!==P67_FASHION_REVISION||
    original.originalCount!==16||supervised.count!==16||
    original.garments!==13||supervised.garments!==13||
    original.negatives!==3||supervised.negatives!==3||
    original.sourceIndexSha256!==supervised.sourceIndexSha256||
    original.truthFileSha256!==supervised.evaluationManifestSha256||
    original.developerExposedNotBlind!==true||
    supervised.newBlindIndependentEvidence!==false||
    supervised.trainCount!==32||
    supervised.trainingAndTestOriginalIDsDisjoint!==true||
    supervised.trainingAndTestOriginalSHAsDisjoint!==true||
    supervised.automaticWardrobeSaved!==0||
    supervised.automaticSaveAllowed!==false||
    !Array.isArray(original.rows)||original.rows.length!==16||
    !Array.isArray(supervised.sourceRows)||supervised.sourceRows.length!==16)
  fail('model/source/actual supervised training metadata');
 const list=[];
 for(let i=0;i<16;i++){
  const a=original.rows[i],b=supervised.sourceRows[i];
  if(!a||!b||a.id!==b.id||a.truthCategory!==b.expectedCategory||
    a.truthSubtype!==b.expectedType||
    a.categoryOnly!==b.negative||
    a.error!==null||
    b.needsManualReview!==true||
    b.originalSourceShaVerified!==true||
    b.uncalibratedCosineRanking!==true||
    b.categoryTop1Correct!==(b.predictedCategory===b.expectedCategory)||
    (b.subtypeTop1Correct===true&&!b.categoryTop1Correct))
   fail('source, human label or correctness accounting '+(a?.id||i));
  list.push({
   id:a.id,expectedCategory:a.truthCategory,expectedType:a.truthSubtype,
   baselineCategory:a.predictedCategory,trainedCategory:b.predictedCategory,
   baselineSubtype:a.predictedSubtype,trainedSubtype:b.predictedType,
   baselineCategoryCorrect:a.categoryTop1Correct,trainedCategoryCorrect:b.categoryTop1Correct,
   baselineSubtypeCorrect:a.subtypeTop1Correct,trainedSubtypeCorrect:b.subtypeTop1Correct,
   trainedSubtypeSupported:b.subtypeAvailable,negative:a.categoryOnly
  });
 }
 const garments=list.filter(x=>!x.negative),negatives=list.filter(x=>x.negative);
 const sum=(items,key)=>items.filter(x=>x[key]).length;
 if(sum(garments,'baselineCategoryCorrect')!==original.categoryTop1||
    sum(garments,'trainedCategoryCorrect')!==supervised.categoryTop1||
    sum(garments,'baselineSubtypeCorrect')!==original.broadSubtypeTop1||
    sum(garments,'trainedSubtypeCorrect')!==supervised.subtypeBroadTop1||
    sum(negatives,'baselineCategoryCorrect')!==original.negativeTop1||
    sum(negatives,'trainedCategoryCorrect')!==supervised.negativeTop1)
  fail('inflated or mismatched numerator/denominator');
 return {
  schema:'closet-current-parallel67-hierarchical-supervised-compare/v1',
  dataset:'existing development-exposed 32 train / 16 evaluation original photos',
  notBlind:true,notReleased:true,noAutomaticClosetSave:true,
  originalSources:16,garments:13,negatives:3,trainingPhotos:32,
  original:{categoryCorrect:original.categoryTop1,subtypeCorrect:original.broadSubtypeTop1,
    negativeCorrect:original.negativeTop1},
  trained:{categoryCorrect:supervised.categoryTop1,subtypeCorrect:supervised.subtypeBroadTop1,
    negativeCorrect:supervised.negativeTop1,
    subtypeNeedsReview:supervised.subtypeReviewNeeded},
  differenceCategory:supervised.categoryTop1-original.categoryTop1,
  differenceSubtype:supervised.subtypeBroadTop1-original.broadSubtypeTop1,
  newlyCorrectCategory:garments.filter(x=>!x.baselineCategoryCorrect&&x.trainedCategoryCorrect).map(x=>x.id),
  previouslyCorrectCategoryLost:garments.filter(x=>x.baselineCategoryCorrect&&!x.trainedCategoryCorrect).map(x=>x.id),
  newlyCorrectSubtype:garments.filter(x=>!x.baselineSubtypeCorrect&&x.trainedSubtypeCorrect).map(x=>x.id),
  previouslyCorrectSubtypeLost:garments.filter(x=>x.baselineSubtypeCorrect&&!x.trainedSubtypeCorrect).map(x=>x.id),
  untrainedSubtypeSourceIDs:garments.filter(x=>!x.trainedSubtypeSupported).map(x=>x.id),
  sourceRows:list,
  gate:'NO PROMOTION until new human-labeled blind source test, independent negatives and physical device performance'
 };
}
if(process.argv[1]?.endsWith('parallel67-compare-hierarchy-04.mjs')){
 const original=JSON.parse(await readFile(process.argv[2],'utf8'));
 const supervised=JSON.parse(await readFile(process.argv[3],'utf8'));
 const comparison=compareSupervisedHierarchy67_04(original,supervised);
 await writeFile(process.argv[4],JSON.stringify(comparison,null,2)+'\n');
 console.log('P67_04_REAL_HIERARCHY_VS_ZERO_SHOT',JSON.stringify({
  original:comparison.original,trained:comparison.trained,
  categoryDelta:comparison.differenceCategory,subtypeDelta:comparison.differenceSubtype,
  newlyCorrectSubtype:comparison.newlyCorrectSubtype,
  previouslyCorrectSubtypeLost:comparison.previouslyCorrectSubtypeLost,
  untrainedSubtypeSourceIDs:comparison.untrainedSubtypeSourceIDs,
  noAutomaticClosetSave:true,notBlind:true
 }));
}
