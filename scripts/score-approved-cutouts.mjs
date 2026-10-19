// Usage: node scripts/score-approved-cutouts.mjs [output-directory]
// Reads comparison artifacts produced in this same CI run. Never edits a model,
// approval, reference, wardrobe image, branch or production configuration.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {assessApprovedCutoutComparison} from '../benchmark/compare-approved-cutouts.mjs';
const directory=process.argv[2]||'benchmark/cutout-quality-gate';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const base=new Map(),candidate=new Map(),approved=new Map();
for(const entry of manifest.cases){
 const id=entry.id;
 base.set(id,JSON.parse(await readFile(join('benchmark/modnet-predictions',id+'.modnet-prediction.json'),'utf8')));
 candidate.set(id,JSON.parse(await readFile(join('benchmark/object-cutout-comparison',id+'.candidate.json'),'utf8')));
 if(entry.reviewStatus==='approved'&&entry.referenceMask){
  if(entry.referenceMask!==join('benchmark/approved-reference-masks',id+'.mask.approved.json'))
   throw Error('Unrecognized approved reference path: '+id);
  approved.set(id,JSON.parse(await readFile(entry.referenceMask,'utf8')));
 }
}
const assessment=assessApprovedCutoutComparison(manifest,base,candidate,approved);
await mkdir(directory,{recursive:true});
await writeFile(join(directory,'summary.json'),JSON.stringify(assessment,null,2)+'\n');
console.log('INDEPENDENT_CUTOUT_COMPARISON '+JSON.stringify({
 status:assessment.status,candidateQualityGatePassed:assessment.candidateQualityGatePassed,
 approvedCases:assessment.approvedCases,pendingCases:assessment.pendingCases,
 meanIoU:assessment.meanIoU,productionAuthorized:false
}));
if(assessment.accuracyMeasured&&!assessment.candidateQualityGatePassed)
 console.log('Candidate rejected. The baseline remains unchanged.');
