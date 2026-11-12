/**
 * P838: compare exact 16 publisher SHA-locked originals between the verified
 * P834 unchanged-model baseline and the current P838 guarded worker.
 * This exposed diagnostic set is NOT prospective human-blind evidence.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {corroborateAmbiguousType} from '../public/recognition-confusion-guard.mjs';

export async function compareEmpirical838(baseline,candidate){
 const fail=x=>{throw Error('M1_P838_SOURCE_MATCH_FAIL_CLOSED: '+x);};
 if(baseline?.format!=='closet-current-m1-real16-unchanged-model-diagnostic/v1'||
    candidate?.format!==baseline.format||baseline.sourceCount!==16||candidate.sourceCount!==16||
    baseline.cohort!=='existing-publisher-labeled-development-exposed-holdout16'||
    candidate.cohort!==baseline.cohort||baseline.noHumanBlindAccuracyClaim!==true||
    candidate.noHumanBlindAccuracyClaim!==true||
    JSON.stringify(candidate.sourceIds)!==JSON.stringify(baseline.sourceIds))
  fail('source cohort, format or honest status mismatch');
 const verdict={format:'closet-current-m1-p838-guarded-vs-p834-sourcewise/v1',
  photoSourceCount:16,developmentExposedNotBlind:true,browsers:{},
  licenseAndLabelsUnchanged:true,newModelAccuracyClaim:false};
 for(const browser of ['chromium','webkit']){
  const a=baseline.browsers?.[browser]?.rows,b=candidate.browsers?.[browser]?.rows;
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==16||b.length!==16)fail('missing complete '+browser);
  let wrongBlocked=0,correctMovedToReview=0,riskCount=0,preserved=0;
  for(let i=0;i<16;i++){
   const old=a[i],fresh=b[i];
   if(old?.id!==baseline.sourceIds[i]||fresh?.id!==old.id||
     old.expectedCategory!==fresh.expectedCategory||old.expectedType!==fresh.expectedType)
    fail('source or annotation missing '+browser+' '+i);
   if(old.error||fresh.error)fail('model runtime error '+old.id);
   const safety=await corroborateAmbiguousType({
    strong:old.strong,choices:old.predictedCategory&&old.predictedType?
     [{category:old.predictedCategory,itemType:old.predictedType,score:.9}]:[],
    details:{}
   });
   const risky=old.strong===true&&safety.strong===false&&safety.categoryOnly===true;
   if(risky){
    riskCount++;
    if(fresh.strong||fresh.categoryConfirmed!==true||
      fresh.predictedCategory!==old.predictedCategory||fresh.predictedType!=='Unknown')
     fail('unsafe class not held for review '+browser+' '+old.id);
    if(old.acceptedTypeMatch===false)wrongBlocked++;
    else if(old.acceptedTypeMatch===true)correctMovedToReview++;
   }else{
    const fields=['strong','categoryConfirmed','predictedCategory','predictedType','categoryMatch','acceptedTypeMatch','negativeRejected'];
    for(const key of fields)if(old[key]!==fresh[key])fail('nonrisk recognition changed '+browser+' '+old.id+' '+key);
    preserved++;
   }
  }
  const prior=baseline.browsers[ browser ],newer=candidate.browsers[browser];
  if(prior.automaticWrongSubtype!==newer.automaticWrongSubtype+wrongBlocked)
   fail('wrong auto subtype conservation '+browser);
  if(prior.negativeRejected!==newer.negativeRejected||
     prior.negatives!==3||newer.negatives!==3||newer.errors!==0)
   fail('negative/photo count changed '+browser);
  verdict.browsers[browser]={
   recognizedOriginals:16,riskClassAutosMovedToReview:riskCount,
   previouslyWrongAutosBlocked:wrongBlocked,previouslyCorrectAutosMovedToReview:correctMovedToReview,
   unchangedSourceResults:preserved,
   automaticWrongSubtypeBefore:prior.automaticWrongSubtype,
   automaticWrongSubtypeAfter:newer.automaticWrongSubtype,
   broadCategoryMatchesBefore:prior.categoryMatches,
   broadCategoryMatchesAfter:newer.categoryMatches,
   nonclothingRejected:newer.negativeRejected
  };
 }
 return verdict;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(process.argv.length!==5)throw Error('usage: node compare-m1-empirical-838.mjs baseline.json candidate.json result.json');
 const a=JSON.parse(await readFile(process.argv[2],'utf8')),b=JSON.parse(await readFile(process.argv[3],'utf8'));
 const result=await compareEmpirical838(a,b);
 await writeFile(process.argv[4],JSON.stringify(result,null,2)+'\n');
 console.log('M1_P838_GENUINE_SOURCEWISE_HISTORY_ONLY',JSON.stringify(result));
}
