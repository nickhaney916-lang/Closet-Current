/** Parallel #67: reject invalid comparisons, preserve exact 16 original source IDs
 * and human labels; compare only similarly scored forced top1, not accepted
 * FashionCLIP classification rates or model self-reported sigmoid confidence.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {P67_MODEL,P67_FASHION_MODEL,P67_REVISION,P67_FASHION_REVISION} from './parallel67-independent-siglip-scoring.mjs';

export function compareIndependentFashion67(before,after){
 if(before?.schema!=='closet-current-parallel67-foreign-siglip-developer-exposed-v1'||
    after?.schema!==before.schema||before.model!==P67_MODEL||before.revision!==P67_REVISION||
    after.model!==P67_FASHION_MODEL||after.revision!==P67_FASHION_REVISION||
    before.originalCount!==16||after.originalCount!==16||
    before.garments!==13||after.garments!==13||before.negatives!==3||after.negatives!==3||
    before.automaticSaveAdmissionAllowed!==false||after.automaticSaveAdmissionAllowed!==false||
    !before.developerExposedNotBlind||!after.developerExposedNotBlind||
    before.truthFileSha256!==after.truthFileSha256||
    before.sourceIndexSha256!==after.sourceIndexSha256||
    !Array.isArray(before.rows)||before.rows.length!==16||
    !Array.isArray(after.rows)||after.rows.length!==16)
  throw Error('P67: incomparable or incomplete independent real-source model report');
 const changes=[];
 for(let i=0;i<16;i++){
  const b=before.rows[i],a=after.rows[i];
  if(!b||!a||b.id!==a.id||b.truthCategory!==a.truthCategory||
     b.truthSubtype!==a.truthSubtype||b.categoryOnly!==a.categoryOnly||
     !/^commons-\d{4}$/.test(a.id)||
     b.error!==null||a.error!==null)
   throw Error('P67: original source, human label or inference failure changed');
  changes.push({
   id:b.id,category:b.truthCategory,subtype:b.truthSubtype,
   genericTop:b.predictedSubtype,genericCategory:b.predictedCategory,
   fashionTop:a.predictedSubtype,fashionCategory:a.predictedCategory,
   genericCategoryCorrect:b.categoryTop1Correct,fashionCategoryCorrect:a.categoryTop1Correct,
   genericSubtypeCorrect:b.subtypeTop1Correct,fashionSubtypeCorrect:a.subtypeTop1Correct,
   negative:b.categoryOnly
  });
 }
 const garment=changes.filter(x=>!x.negative),negatives=changes.filter(x=>x.negative);
 const sum=(xs,key)=>xs.filter(x=>x[key]===true).length;
 for(const [rows,report]of [[before.rows,before],[after.rows,after]]){
  const scores=rows.filter(x=>!x.categoryOnly),negative=rows.filter(x=>x.categoryOnly);
  if(report.categoryTop1!==sum(scores,'categoryTop1Correct')||
     report.broadSubtypeTop1!==sum(scores,'subtypeTop1Correct')||
     report.negativeTop1!==sum(negative,'categoryTop1Correct'))
   throw Error('P67: numeric report denominator mismatch');
 }
 return {
  schema:'closet-current-parallel67-two-independent-siglip-top1-compare/v1',
  historicalDeveloperExposedNotBlind:true,notAutomaticSaveAccuracy:true,
  originals:16,garments:13,negatives:3,
  generic:{model:before.model,revision:before.revision,
   categoryTop1:before.categoryTop1,subtypeTop1:before.broadSubtypeTop1,
   negativeTop1:before.negativeTop1,modelLoadMs:before.modelLoadMs},
  fashion:{model:after.model,revision:after.revision,
   categoryTop1:after.categoryTop1,subtypeTop1:after.broadSubtypeTop1,
   negativeTop1:after.negativeTop1,modelLoadMs:after.modelLoadMs},
  categoryTop1Change:after.categoryTop1-before.categoryTop1,
  subtypeTop1Change:after.broadSubtypeTop1-before.broadSubtypeTop1,
  negativeTop1Change:after.negativeTop1-before.negativeTop1,
  previousSubtypeFailureCorrected:garment.filter(x=>!x.genericSubtypeCorrect&&x.fashionSubtypeCorrect).map(x=>x.id),
  previousCorrectSubtypeLost:garment.filter(x=>x.genericSubtypeCorrect&&!x.fashionSubtypeCorrect).map(x=>x.id),
  rows:changes
 };
}
if(process.argv[1]?.endsWith('parallel67-compare-fashion-real16.mjs')){
 const before=JSON.parse(await readFile(process.argv[2],'utf8'));
 const after=JSON.parse(await readFile(process.argv[3],'utf8'));
 const comparison=compareIndependentFashion67(before,after);
 await writeFile(process.argv[4],JSON.stringify(comparison,null,2)+'\n');
 console.log('P67_FASHION_VS_GENERIC_SAME_16_SHA_ORIGINALS',JSON.stringify({
  generic:comparison.generic,fashion:comparison.fashion,
  categoryTop1Change:comparison.categoryTop1Change,
  subtypeTop1Change:comparison.subtypeTop1Change,
  negativeTop1Change:comparison.negativeTop1Change,
  previouslyWrongSubtypesNowCorrect:comparison.previousSubtypeFailureCorrected,
  previouslyCorrectSubtypesNowWrong:comparison.previousCorrectSubtypeLost,
  notBlind:true,notAutomaticSaveAccuracy:true
 }));
}
