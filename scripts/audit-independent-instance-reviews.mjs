// Audit the actual generated model seeds, never the human-approved references.
// A later independent review can use assessIndividualInstanceReview with
// TWO-reviewer approved references provided explicitly.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {assessIndividualInstanceReview} from '../benchmark/instance-review-coverage.mjs';
import {auditModelProposalSpatialRelations} from '../benchmark/instance-spatial-review.mjs';

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
// Pairwise distances are between UNAPPROVED AI predictions only. They merely
// identify cases reviewers should inspect; never infer physical item counts.
const spatial=index.cases.map(scene=>auditModelProposalSpatialRelations({
 id:scene.id,image:scene.image,sourceSha256:scene.sourceSha256
},new Map(scene.candidateSeeds.map(item=>[item.id,seeds.get(item.id)]))));
const spatialReport={
 status:'awaiting-independent-human-outlines',
 sourcePhotos:index.cases.length,modelProposals:spatial.reduce((a,x)=>a+x.proposalCount,0),
 spatialRelationships:spatial,
 reviewPriorityPairs:spatial.reduce((a,x)=>a+x.possiblyRelatedSameCategoryPairs+x.overlappingDifferentCategoryPairs,0),
 independentlyApprovedReferences:0,physicalGarmentAccuracy:null,
 garmentPixelIoU:null,missingInstanceRecall:null,
 sourceRgbModified:false,canPromoteModel:false,autoSavedCustomerItems:0
};
if(spatialReport.modelProposals!==index.pendingIndividualPredictions||
   spatialReport.physicalGarmentAccuracy!==null||spatialReport.canPromoteModel)
 throw Error('Spatial review cannot invent an approved garment inventory');
await writeFile(join(root,'individual-instance-spatial-review.json'),JSON.stringify(spatialReport,null,2)+'\n');
if(result.independentlyReviewedProposals!==0||result.canPromoteModel||
   result.aggregatePixelIoU!==null||result.missingPhysicalGarmentRecall!==null)
 throw Error('Unexpected independent reference approval or fabricated accuracy');
await writeFile(join(root,'individual-instance-coverage-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log('MODEL_SPATIAL_REVIEW '+JSON.stringify({
 photos:spatialReport.sourcePhotos,proposals:spatialReport.modelProposals,
 pairs:spatial.reduce((a,x)=>a+x.candidatePairs.length,0),
 closeOrOverlappingReviewPairs:spatialReport.reviewPriorityPairs,
 measuredRealPhotoAccuracy:false,automaticItemsCreated:0
}));
console.log('INDEPENDENT_INSTANCE_REVIEW_AUDIT '+JSON.stringify({
 status:result.status,sources:result.sourcePhotos,modelProposals:result.modelProposals,
 independentlyApproved:result.independentlyReviewedProposals,
 awaitingReview:result.awaitingReview,
 aggregateAccuracyReported:result.aggregatePixelIoU!==null,
 canPromoteModel:result.canPromoteModel}));
