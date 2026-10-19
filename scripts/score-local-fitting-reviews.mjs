// Bind documentary visual review to exact source/pipeline/candidate/composite bytes.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {digest,evaluateFidelity} from '../benchmark/local-fitting-fidelity.mjs';
export async function scorePacket(reportPath,reviewsPath,outputPath){
 const report=JSON.parse(await readFile(reportPath)),reviews=JSON.parse(await readFile(reviewsPath));
 const manifest=JSON.parse(await readFile('benchmark/local-fitting-real-photo-manifest.json'));
 if(!Array.isArray(reviews)||report.cases?.length!==manifest.cases.length||
  new Set(report.cases.map(x=>x.id)).size!==manifest.cases.length)throw Error('Invalid or incomplete packet');
 for(const [path,hash] of Object.entries(report.pipelineFiles||{})){
  if(!resolve(path).startsWith(resolve('.')+'/')||digest(await readFile(path))!==hash)
   throw Error('Pipeline changed; regenerate packet before reviewing');
 }
 // Same canonical encoding used by the Python producer (keys sorted).
 const files=Object.fromEntries(Object.entries(report.pipelineFiles).sort(([a],[b])=>a.localeCompare(b)));
 if(digest(Buffer.from(JSON.stringify(files)))!==report.pipelineSha256)throw Error('Pipeline digest mismatch');
 const keys=new Set(),indexed=new Map();
 for(const review of reviews){
  const key=review.id+':'+review.figure;
  if(keys.has(key)||!manifest.cases.some(x=>x.id===review.id)||!['female','male'].includes(review.figure))
   throw Error('Duplicate or unknown review target');
  keys.add(key);indexed.set(key,review);
 }
 const results=[];
 for(const entry of manifest.cases){
  const row=report.cases.find(x=>x.id===entry.id);
  if(!row||row.sourceSha256!==entry.sourceSha256||digest(await readFile('benchmark/fixtures/'+entry.image))!==entry.sourceSha256)
   throw Error('Source changed or missing');
  if(digest(await readFile(resolve(dirname(reportPath),entry.id,'warp-diagnostic.png')))!==row.candidateFileSha256)
   throw Error('Candidate changed');
  for(const figure of ['female','male']){
   if(digest(await readFile(resolve(dirname(reportPath),entry.id,figure+'-diagnostic.png')))!==row.compositeFileSha256[figure])
    throw Error('Composite changed');
   const expected={sourceSha256:row.sourceSha256,candidateSha256:row.candidateFileSha256,
    pipelineSha256:report.pipelineSha256,compositeSha256:row.compositeFileSha256[figure],
    visibleFeatures:[...entry.visibleFeatures,'layering']};
   const assessed=evaluateFidelity(indexed.get(entry.id+':'+figure),expected);
   results.push({id:entry.id,figure,featureReview:assessed,
    compositingDecision:'hold',independentMaskPresent:false,
    reason:row.eligible?'independently-approved-mask-and-integrated-layering-evidence-required':row.reason});
  }
 }
 const result={results,summary:{targets:results.length,documentedFeaturePasses:results.filter(x=>x.featureReview.decision==='reviewed-pass').length,
  approvedComposites:0,fidelityPercent:null,productionAuthorized:false,realPhoneTested:false}};
 const target=resolve(outputPath);
 if(!target.startsWith(resolve('artifacts')+'/'))throw Error('Review output must be under artifacts/');
 await writeFile(target,JSON.stringify(result,null,2)+'\n');
 return result.summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [report,reviews,output]=process.argv.slice(2);
 if(!report||!reviews||!output)throw Error('Usage: node scripts/score-local-fitting-reviews.mjs REPORT REVIEWS OUTPUT');
 console.log(JSON.stringify(await scorePacket(report,reviews,output)));
}
