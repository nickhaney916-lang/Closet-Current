// Creates an explicit, machine-readable release-blocker summary for the six
// locked photos. Missing reference labels and candidate masks are normal
// blocking conditions, never fabricated as accuracy=0 or scored as passes.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {evaluateClippingAcceptance} from '../benchmark/clipping-acceptance.mjs';
const directory=process.argv[2]||'benchmark/segmentation-predictions';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const readOptional=async file=>{
 try{return JSON.parse(await readFile(file,'utf8'));}
 catch(error){if(error?.code==='ENOENT')return null;throw error;}
};
const evidence=new Map();
for(const entry of manifest.cases){
 evidence.set(entry.id,{
  reference:entry.referenceMask&&entry.reviewStatus==='approved'?
   await readOptional(entry.referenceMask):null,
  baseline:await readOptional(join(directory,entry.id+'.prediction.json')),
  candidate:await readOptional(join(directory,entry.id+'.candidate.json'))
 });
}
const report=evaluateClippingAcceptance(manifest,evidence);
await mkdir(directory,{recursive:true});
await writeFile(join(directory,'clipping-acceptance.json'),JSON.stringify(report,null,2));
console.log('CLOTHING_CLIPPING_ACCEPTANCE '+JSON.stringify({
 status:report.status,photos:report.photos,approvedPassing:report.reviewedPassingPhotos,
 pendingOrFailed:report.pendingOrFailedPhotos,productionAuthorized:false
}));
