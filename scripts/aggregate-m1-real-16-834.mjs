/**
 * Mission 1 P834 — conservative, deterministic aggregation of immutable
 * four-browser-half original model receipts. Never infer missing photos as
 * correct, or manufacture subtype evidence for generic Dress / Boots labels.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {photoTypes} from '../public/phone-photo-benchmark.mjs';

const fail=reason=>{throw Error('M1_P834_AUDIT_FAIL_CLOSED: '+reason);};
const fields=['garments','negatives','categoryMatches','automaticCorrectCategory',
 'automaticWrongCategory','automaticWrongSubtype','knownTypeCount',
 'exactTypeMatches','broadTypeCount','acceptedTypeMatches',
 'negativeRejected','errors'];
const n=(x,name)=>{if(!Number.isInteger(x)||x<0)fail('Invalid nonnegative '+name);return x;};
const categorySet=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);
const model='UNCHANGED-existing-closet-current-FashionCLIP-worker';
const cohort='existing-publisher-labeled-development-exposed-holdout16';
export function aggregateReal16Audit834(manifest,parts){
 if(!Array.isArray(manifest)||manifest.length!==16||new Set(manifest.map(x=>x.id)).size!==16)fail('Changed 16-photo manifest');
 const ids=manifest.map(x=>x.id),originals=new Map(manifest.map(x=>[x.id,x]));
 const output={format:'closet-current-m1-real16-unchanged-model-diagnostic/v1',
  cohort,sourceCount:16,sourceIds:ids,browsers:{},crossBrowser:{},noHumanBlindAccuracyClaim:true};
 for(const browser of ['chromium','webkit']){
  const a=parts[browser+'-a'],b=parts[browser+'-b'];
  if(!a||!b)fail('Missing original half for '+browser);
  const rows=[];
  for(const [half,p]of [['a',a],['b',b]]){
   if(p?.summary?.browser!==browser||p?.summary?.partition!==half||
      p?.summary?.sourceCohort!==cohort||p?.summary?.model!==model||
      p?.summary?.count!==8||p.summary.noPhotoNetworkUploads!==true||
      p.summary.noPageExceptions!==true||
      p.summary.unverifiedColors!==8||!Array.isArray(p.rows)||p.rows.length!==8)
    fail('Invalid real source model/browser receipt for '+browser+half);
   const expectedIds=manifest.filter((_,i)=>i%2===(half==='a'?0:1)).map(x=>x.id);
   if(p.rows.some((x,i)=>x.id!==expectedIds[i]))fail('Missing, reordered or duplicated original ID for '+browser+half);
   for(const x of p.rows){
    const truth=originals.get(x.id);
    if(!truth||x.expectedCategory!==truth.expectedCategory||x.expectedType!==truth.expectedType||
       !categorySet.has(x.expectedCategory)||!['boolean'].includes(typeof x.strong)||
       typeof x.categoryMatch!=='boolean'||typeof x.categoryConfirmed!=='boolean'||
       !Array.isArray(x.acceptedTypes)||!x.acceptedTypes.length||
       x.acceptedTypes.some(a=>typeof a!=='string')||
       JSON.stringify(x.acceptedTypes)!==JSON.stringify(truth.acceptedTypes||[truth.expectedType])||
       x.error!==null&&typeof x.error!=='string')
      fail('Invalid original annotated photo source truth '+x.id);
    const negative=x.expectedCategory==='Uncategorized';
    const exactLabelSupported=!negative&&photoTypes(x.expectedCategory).includes(x.expectedType);
    if(x.expectedTypeLabelSupported!==exactLabelSupported)fail('Non-clothing or generic type counted as exact subtype '+x.id);
    if(negative&&(x.negativeRejected!==x.categoryMatch||x.acceptedTypeMatch!==null||x.exactTypeMatch!==null))
     fail('Negative excluded from subtype denominators '+x.id);
    if(!negative&&x.negativeRejected!==null)fail('Garment counted as negative');
    if(x.strong&&(!x.predictedCategory||x.predictedCategory==='Uncategorized'))fail('Fabricated strong category');
    if(x.error&&(x.strong||x.categoryConfirmed||x.categoryMatch))fail('Runtime error promoted to successful classification');
    if(!negative&&x.categoryMatch!==(
      x.predictedCategory===x.expectedCategory&&(x.strong||x.categoryConfirmed)))
     fail('Category-match status not supported by actual acceptance '+x.id);
    if(negative&&x.categoryMatch!==(!x.error&&!x.predictedCategory&&!x.strong&&!x.categoryConfirmed))
     fail('Non-clothing rejection not supported by raw abstention '+x.id);
    const exactMatch=exactLabelSupported?
      x.categoryMatch&&x.predictedType===x.expectedType:null;
    if(x.exactTypeMatch!==exactMatch)fail('Exact subtype match not supported by original label '+x.id);
    const typeCovered=!negative&&(exactLabelSupported||!!truth.acceptedTypes);
    const acceptedMatch=typeCovered?
      x.categoryMatch&&x.acceptedTypes.includes(x.predictedType):null;
    if(x.acceptedTypeMatch!==acceptedMatch)fail('Accepted subtype evidence not supported '+x.id);
    rows.push(x);
   }
   const derive={
    garments:p.rows.filter(x=>x.expectedCategory!=='Uncategorized').length,
    negatives:p.rows.filter(x=>x.expectedCategory==='Uncategorized').length,
    categoryMatches:p.rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.categoryMatch).length,
    automaticCorrectCategory:p.rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.strong&&x.categoryMatch).length,
    automaticWrongCategory:p.rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.strong&&!x.categoryMatch).length,
    automaticWrongSubtype:p.rows.filter(x=>x.strong&&x.acceptedTypeMatch===false).length,
    knownTypeCount:p.rows.filter(x=>x.expectedCategory!=='Uncategorized'&&x.expectedTypeLabelSupported).length,
    exactTypeMatches:p.rows.filter(x=>x.exactTypeMatch===true).length,
    broadTypeCount:p.rows.filter(x=>x.acceptedTypeMatch!==null).length,
    acceptedTypeMatches:p.rows.filter(x=>x.acceptedTypeMatch===true).length,
    negativeRejected:p.rows.filter(x=>x.negativeRejected===true).length,
    errors:p.rows.filter(x=>x.error).length,
   };
   for(const k of fields)if(n(p.summary[k],k)!==derive[k])fail('Inconsistent '+k+' count in '+browser+half);
  }
  // The fixed halves are even/odd source IDs, not first-eight / last-eight.
  // Restore the original frozen manifest order before all cross-browser joins.
  rows.sort((x,y)=>ids.indexOf(x.id)-ids.indexOf(y.id));
  if(rows.length!==16||new Set(rows.map(x=>x.id)).size!==16||rows.some((x,i)=>x.id!==ids[i]))
   fail('Incomplete 16 originals in '+browser);
  const types={};
  const totals=Object.fromEntries(fields.map(key=>[key,(a.summary[key]||0)+(b.summary[key]||0)]));
  for(const category of [...categorySet].filter(x=>x!=='Uncategorized')){
   const subset=rows.filter(x=>x.expectedCategory===category);
   types[category]={tested:subset.length,categoryMatches:subset.filter(x=>x.categoryMatch).length,
    automaticCorrect:subset.filter(x=>x.strong&&x.categoryMatch).length,
    automaticWrong:subset.filter(x=>x.strong&&!x.categoryMatch).length,
    review:subset.filter(x=>x.categoryConfirmed&&!x.strong).length,
    unresolved:subset.filter(x=>!x.strong&&!x.categoryConfirmed).length,
    genuineSubtypeSupported:subset.filter(x=>x.expectedTypeLabelSupported).length,
    exactSubtypeMatches:subset.filter(x=>x.exactTypeMatch===true).length};
  }
  output.browsers[browser]={...totals,byCategory:types,rows:rows.map(x=>({
   id:x.id,expectedCategory:x.expectedCategory,expectedType:x.expectedType,
   categoryMatch:x.categoryMatch,acceptedTypeMatch:x.acceptedTypeMatch,
   exactTypeMatch:x.exactTypeMatch,strong:x.strong,categoryConfirmed:x.categoryConfirmed,
   predictedCategory:x.predictedCategory,predictedType:x.predictedType,
   negativeRejected:x.negativeRejected,error:x.error,
  }))};
 }
 const chrome=output.browsers.chromium.rows,webkit=output.browsers.webkit.rows;
 output.crossBrowser={
  samePredictionCategoryIncludingAbstentions:chrome.filter((x,i)=>x.predictedCategory===webkit[i].predictedCategory).length,
  bothBrowsersAbstainedCategory:chrome.filter((x,i)=>!x.predictedCategory&&!webkit[i].predictedCategory).length,
  samePredictionSubtypeIncludingAbstentions:chrome.filter((x,i)=>x.predictedType===webkit[i].predictedType).length,
  bothBrowsersCategoryMatched:chrome.filter((x,i)=>x.categoryMatch&&webkit[i].categoryMatch&&x.expectedCategory!=='Uncategorized').map(x=>x.id),
  wrongAutomaticEitherBrowser:chrome.filter((x,i)=>
   x.expectedCategory!=='Uncategorized'&&
   (x.strong&&!x.categoryMatch||webkit[i].strong&&!webkit[i].categoryMatch)).map(x=>x.id),
  failedRuntimeEither:chrome.filter((x,i)=>x.error||webkit[i].error).map(x=>x.id),
 };
 return output;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=resolve(process.argv[2]||'benchmark/m1-real16-834');
 const manifest=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
 const parts={};
 for(const engine of ['chromium','webkit'])for(const half of ['a','b'])
  parts[engine+'-'+half]=JSON.parse(await readFile(join(input,'m1-p834-'+engine+'-'+half,'audit.json'),'utf8'));
 const report=aggregateReal16Audit834(manifest,parts);
 await mkdir(input,{recursive:true});
 await writeFile(join(input,'aggregate.json'),JSON.stringify(report,null,2)+'\n');
 console.log('M1_P834_FROZEN_16_ORIGINALS_ALL_BROWSERS',JSON.stringify({
  chromium:report.browsers.chromium&&Object.fromEntries(fields.map(x=>[x,report.browsers.chromium[x]])),
  webkit:report.browsers.webkit&&Object.fromEntries(fields.map(x=>[x,report.browsers.webkit[x]])),
  crossBrowser:report.crossBrowser,
  noHumanBlindAccuracyClaim:report.noHumanBlindAccuracyClaim}));
}
