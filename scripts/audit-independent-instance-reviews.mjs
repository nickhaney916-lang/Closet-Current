// Audit the actual generated model seeds, never the human-approved references.
// A later independent review can use assessIndividualInstanceReview with
// TWO-reviewer approved references provided explicitly.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {assessIndividualInstanceReview} from '../benchmark/instance-review-coverage.mjs';

const root=resolve(process.argv[2]||'benchmark/deepfashion-instance-review');
const index=JSON.parse(await readFile(join(root,'independent-outline-review/reference-review-index.json'),'utf8'));
const seeds=new Map();
for(const scene of index.cases){
 for(const item of scene.candidateSeeds){
  const file=resolve(root,item.prediction);
  if(relative(root,file).startsWith('..')||!file.startsWith(root+'/'))
   throw Error('Untrusted model seed path');
  seeds.set(item.id,JSON.parse(await readFile(file,'utf8')));
 }
 if(scene.exactOriginalIncludedForReview){
  const file=resolve(root,'independent-outline-review/original-photos',scene.image);
  if(relative(root,file).startsWith('..'))throw Error('Unsafe reference source path');
  const digest=createHash('sha256').update(await readFile(file)).digest('hex');
  if(digest!==scene.sourceSha256)throw Error('Priority reference original source changed: '+scene.id);
 }
}
const result=assessIndividualInstanceReview(index,seeds);
if(result.independentlyReviewedProposals!==0||result.canPromoteModel||
   result.aggregatePixelIoU!==null||result.missingPhysicalGarmentRecall!==null)
 throw Error('Unexpected independent reference approval or fabricated accuracy');
await writeFile(join(root,'individual-instance-coverage-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log('INDEPENDENT_INSTANCE_REVIEW_AUDIT '+JSON.stringify({
 status:result.status,sources:result.sourcePhotos,modelProposals:result.modelProposals,
 independentlyApproved:result.independentlyReviewedProposals,
 awaitingReview:result.awaitingReview,
 aggregateAccuracyReported:result.aggregatePixelIoU!==null,
 canPromoteModel:result.canPromoteModel}));
