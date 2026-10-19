import test from 'node:test';
import assert from 'node:assert/strict';
import {assessIndividualInstanceReview} from '../benchmark/instance-review-coverage.mjs';

const sha='a'.repeat(64);
function fixture(){
 const index={status:'awaiting-independent-human-outlines',
  predictionMasksAreGroundTruth:false,automaticCustomerMaskPromotion:false,
  pendingIndividualPredictions:2,cases:[{
    id:'commons-0035',image:'commons-0035.jpg',sourceSha256:sha,
    candidateSeeds:[
     {id:'commons-0035-candidate-01',
      prediction:'independent-outline-review/model-seeds/commons-0035-candidate-01.prediction.json',
      label:'skirt',referenceStatus:'pending-human-annotation',approvedReference:null},
     {id:'commons-0035-candidate-02',
      prediction:'independent-outline-review/model-seeds/commons-0035-candidate-02.prediction.json',
      label:'shorts',referenceStatus:'pending-human-annotation',approvedReference:null}
    ],allMasksUnapproved:true,userPhotoModified:false,exactOriginalIncludedForReview:true}]};
 const seeds=new Map();
 for(let i=1;i<=2;i++){
  const id='commons-0035-candidate-0'+i;
  seeds.set(id,{schemaVersion:1,modelProposalId:id,candidateOrdinal:i,
   image:'commons-0035.jpg',sourceSha256:sha,modelGarmentLabel:i===1?'skirt':'shorts',
   reviewStatus:'prediction-unreviewed',independentReference:false,
   canSaveToCustomerCloset:false,approvedBy:null,
   width:4,height:4,runs:[5,2,2,2,5]});
 }
 return {index,seeds};
}
test('two unapproved model proposals from one shorts photo have zero verified accuracy',()=>{
 const {index,seeds}=fixture();
 const r=assessIndividualInstanceReview(index,seeds);
 assert.equal(r.modelProposals,2);
 assert.equal(r.awaitingReview,2);
 assert.equal(r.independentlyReviewedProposals,0);
 assert.equal(r.priorityOriginalPhotosProvided,1);
 assert.equal(r.aggregatePixelIoU,null);
 assert.equal(r.missingPhysicalGarmentRecall,null);
 assert.equal(r.canPromoteModel,false);
 assert.equal(r.autoSavedCustomerItems,0);
 assert.equal(r.proposals[0].instanceIoU,null);
});
test('one independently reviewed candidate never proves whole-photo instance recall',()=>{
 const {index,seeds}=fixture();
 const reference={...seeds.get('commons-0035-candidate-01'),
   reviewer:'Reviewer A',approvedBy:'Reviewer B',reviewStatus:'approved',
   humanTargetLabel:'orange shorts',targetIndependentlyIdentifiedBy:'Reviewer A',
   seedModel:'pinned-model',modelGarmentLabel:'skirt'};
 const approved=new Map([[reference.modelProposalId,reference]]);
 const r=assessIndividualInstanceReview(index,seeds,approved);
 assert.equal(r.independentlyReviewedProposals,1);
 assert.equal(r.awaitingReview,1);
 assert.equal(r.proposals[0].instanceIoU,1);
 assert.equal(r.proposals[0].referenceSeedWasAI,true);
 assert.equal(r.aggregatePixelIoU,null);
 assert.equal(r.missingPhysicalGarmentRecall,null);
 assert.equal(r.canPromoteModel,false);
 assert.equal(r.proposals[0].garmentCategoryAccuracy,null);
});
test('even all two proposals reviewed is not independently verified physical garment inventory',()=>{
 const {index,seeds}=fixture(),refs=new Map();
 for(const [id,seed] of seeds)
 refs.set(id,{...seed,reviewStatus:'approved',reviewer:'First',
  approvedBy:'Second',humanTargetLabel:'orange shorts',
  targetIndependentlyIdentifiedBy:'First',seedModel:'AI'});
 const r=assessIndividualInstanceReview(index,seeds,refs);
 assert.equal(r.awaitingReview,0);
 assert.equal(r.independentlyReviewedProposals,2);
 assert.equal(r.duplicateHumanTargetWarnings.length,1);
 assert.equal(r.aggregateGarmentInstanceAccuracy,null);
 assert.equal(r.missingPhysicalGarmentRecall,null);
 assert.equal(r.canPromoteModel,false);
});
test('untrusted approval, swapped identity, foreign photo or missing prediction aborts batch',()=>{
 const {index,seeds}=fixture();
 assert.throws(()=>assessIndividualInstanceReview(index,
  new Map([['commons-0035-candidate-01',seeds.get('commons-0035-candidate-01')]])),/Altered|Missing or extra/);
 assert.throws(()=>assessIndividualInstanceReview(index,new Map([...seeds].map(([k,v])=>
  [k,{...v,sourceSha256:'b'.repeat(64)}]))),/Altered/);
 const approval={...seeds.get('commons-0035-candidate-01'),
  reviewStatus:'approved',reviewer:'First',approvedBy:'Second',
  humanTargetLabel:'orange shorts',targetIndependentlyIdentifiedBy:'First'};
 assert.throws(()=>assessIndividualInstanceReview(index,seeds,
  new Map([['commons-0035-candidate-02',approval]])),/identity|provenance/);
 assert.throws(()=>assessIndividualInstanceReview(index,seeds,
  new Map([['foreign-candidate-01',approval]])),/Missing or extra/);
});
