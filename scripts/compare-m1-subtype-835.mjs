/**
 * Mission 1 P835 — exact immutable 16-photo source comparison of unchanged
 * P834 FashionCLIP and experimental same-model original-framing guard.
 *
 * SAFETY DIAGNOSTIC ONLY. Both datasets are development-exposed; do not
 * choose thresholds by optimizing against these sources or claim a blind win.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const fail=x=>{throw Error('M1_P835_BASELINE_COMPARISON_FAIL: '+x);};

export function compareSubtypeSafety835(baseline,guarded){
 if(baseline?.format!=='closet-current-m1-real16-unchanged-model-diagnostic/v1'||
    guarded?.format!==baseline.format||
    baseline.sourceCount!==16||guarded.sourceCount!==16||
    JSON.stringify(baseline.sourceIds)!==JSON.stringify(guarded.sourceIds)||
    baseline.noHumanBlindAccuracyClaim!==true||guarded.noHumanBlindAccuracyClaim!==true)
  fail('Not two identical complete historical 16-original cohorts');
 const result={format:'closet-current-m1-subtype-cross-view-exposed-diagnostic/v1',
  sourceCount:16,notBlind:true,notProductionModelChange:true,
  browser:{},decision:'NO AUTOMATIC PROMOTION; require new independently labeled human original phone photos'};
 for(const engine of ['chromium','webkit']){
  const b=baseline.browsers?.[engine]?.rows,g=guarded.browsers?.[engine]?.rows;
  if(!Array.isArray(b)||b.length!==16||!Array.isArray(g)||g.length!==16)
   fail('Missing browser source originals '+engine);
  const changes=[];
  for(let i=0;i<b.length;i++){
   const before=b[i],after=g[i];
   if(!before||!after||before.id!==after.id||before.expectedCategory!==after.expectedCategory||
     before.expectedType!==after.expectedType||before.negativeRejected!==null&&before.expectedCategory!=='Uncategorized')
    fail('Source order or frozen human labels differ '+engine+' '+i);
   // An extra challenge must only demote a formerly confident guess. It
   // cannot manufacture a new class, change category or subtype, or silently
   // accept a previously abstained original.
   if(after.strong&&(!before.strong||
       before.predictedCategory!==after.predictedCategory||
       before.predictedType!==after.predictedType))
    fail('Experimental guard fabricated a successful category or subtype '+before.id);
   if(before.error!==after.error&&after.strong)
    fail('A runtime error became accepted '+before.id);
   changes.push({id:before.id,category:before.expectedCategory,
    subtype:before.expectedType,baselineStrong:before.strong,guardStrong:after.strong,
    baselineCategoryCorrect:before.categoryMatch,guardCategoryCorrect:after.categoryMatch,
    baselineSubtypeCorrect:before.acceptedTypeMatch,
    guardSubtypeCorrect:after.acceptedTypeMatch,
    baselineType:before.predictedType,guardType:after.predictedType,
    wrongAutomaticPrevented:before.strong&&before.acceptedTypeMatch===false&&!after.strong,
    correctAutomaticLost:before.strong&&before.acceptedTypeMatch===true&&!after.strong,
    broadCategoryMatchLost:before.categoryMatch&&!after.categoryMatch&&before.expectedCategory!=='Uncategorized',
    unchanged:before.strong===after.strong&&before.categoryMatch===after.categoryMatch});
  }
  const sum=key=>changes.filter(x=>x[key]).length;
  const expectedWrong=baseline.browsers[engine].automaticWrongSubtype;
  const observedWrong=guarded.browsers[engine].automaticWrongSubtype;
  if(sum('wrongAutomaticPrevented')!==expectedWrong-observedWrong)
   fail('Miscounted original automatic wrong subtype prevented '+engine);
  result.browser[engine]={
   sourceCount:16,garments:baseline.browsers[engine].garments,
   originalAutomaticWrongSubtype:expectedWrong,
   experimentalAutomaticWrongSubtype:observedWrong,
   wrongAutomaticSubtypePrevented:sum('wrongAutomaticPrevented'),
   correctAutomaticSubtypeLost:sum('correctAutomaticLost'),
   broadCategoryMatchesBefore:baseline.browsers[engine].categoryMatches,
   broadCategoryMatchesAfter:guarded.browsers[engine].categoryMatches,
   broadCategoryMatchLost:sum('broadCategoryMatchLost'),
   negativeRejectedBefore:baseline.browsers[engine].negativeRejected,
   negativeRejectedAfter:guarded.browsers[engine].negativeRejected,
   rowChanges:changes
  };
  if(result.browser[engine].negativeRejectedBefore!==3||result.browser[engine].negativeRejectedAfter!==3)
   fail('Historical negative sources must remain rejected');
 }
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const baseline=JSON.parse(await readFile(process.argv[2],'utf8'));
 const guarded=JSON.parse(await readFile(process.argv[3],'utf8'));
 const comparison=compareSubtypeSafety835(baseline,guarded);
 await writeFile(process.argv[4],JSON.stringify(comparison,null,2)+'\n');
 console.log('M1_P835_IMMUTABLE_HISTORIC_BASELINE_VS_EXPERIMENT',JSON.stringify({
  chromium:Object.fromEntries(Object.entries(comparison.browser.chromium).filter(([k])=>k!=='rowChanges')),
  webkit:Object.fromEntries(Object.entries(comparison.browser.webkit).filter(([k])=>k!=='rowChanges')),
  decision:comparison.decision}));
}
