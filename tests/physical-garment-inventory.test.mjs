import test from 'node:test';import assert from 'node:assert/strict';
import {evaluateCompletePhysicalInventory} from '../benchmark/physical-garment-inventory.mjs';
const sha='a'.repeat(64),scene={id:'validation-0031',image:'validation-0031.jpg',sourceSha256:sha};
function mask(rect,w=12,h=12){
 const bits=new Uint8Array(w*h);
 if(rect)for(let y=rect[1];y<rect[3];y++)for(let x=rect[0];x<rect[2];x++)bits[y*w+x]=1;
 let current=0,run=0;const runs=[];
 for(const bit of bits){if(bit!==current){runs.push(run);run=0;current=bit;}run++;}runs.push(run);
 return {width:w,height:h,runs};
}
function example(){
 const inventory={schemaVersion:1,status:'human-inventory-complete',
  image:scene.image,sourceSha256:sha,originalPhotoVerified:true,
  allVisibleGarmentsAccountedFor:true,reviewedBy:'Reviewer A',approvedBy:'Reviewer B',
  reviewedAt:'2026-10-18T20:00:00Z',
  targets:[{id:scene.id+'-item-01',category:'Outerwear',label:'grey blazer'},
   {id:scene.id+'-item-02',category:'Bottoms',label:'black skirt'},
   {id:scene.id+'-item-03',category:'Shoes',label:'heels'}]};
 const annotations=new Map(inventory.targets.map((t,i)=>[t.id,{
  schemaVersion:1,image:scene.image,sourceSha256:sha,reviewStatus:'approved',
  reviewer:'Reviewer A',approvedBy:'Reviewer B',physicalTargetId:t.id,
  humanCategory:t.category,humanTargetLabel:t.label,
  targetIndependentlyIdentifiedBy:'Reviewer A',seedModel:null,
  ...mask([[1,1,5,5],[6,1,10,5],[4,8,8,11]][i])
 }]));
 const seeds=new Map([
  [scene.id+'-candidate-01',{schemaVersion:1,image:scene.image,sourceSha256:sha,
   modelProposalId:scene.id+'-candidate-01',modelGarmentLabel:'long_sleeve_top',
   reviewStatus:'prediction-unreviewed',independentReference:false,canSaveToCustomerCloset:false,
   ...mask([1,1,5,5])}],
  [scene.id+'-candidate-02',{schemaVersion:1,image:scene.image,sourceSha256:sha,
   modelProposalId:scene.id+'-candidate-02',modelGarmentLabel:'long_sleeve_top',
   reviewStatus:'prediction-unreviewed',independentReference:false,canSaveToCustomerCloset:false,
   ...mask([1,1,4,5])}]
 ]);
 return {inventory,annotations,seeds};
}
test('real model seeds without reviewed human inventory never report recall',()=>{
 const {seeds}=example();const result=evaluateCompletePhysicalInventory(scene,null,new Map(),seeds);
 assert.equal(result.status,'awaiting-complete-independent-inventory');
 assert.equal(result.detectionRecall,null);assert.equal(result.missingGarments,null);
 assert.equal(result.canPromoteModel,false);
});
test('complete independently drawn inventory counts missing skirt and unsupported shoes',()=>{
 const {inventory,annotations,seeds}=example();
 const result=evaluateCompletePhysicalInventory(scene,inventory,annotations,seeds);
 assert.equal(result.modelProposals,2);
 assert.equal(result.approvedPhysicalGarments,3);
 assert.equal(result.matchedGarments,1);
 assert.equal(result.missedPhysicalGarments,2);
 assert.equal(result.unmatchedModelProposals,1);
 assert.equal(result.detectionRecall,1/3);
 assert.equal(result.supportedCategoryDetectionRecall,.5);
 assert.equal(result.proposalPrecision,.5);
 assert.equal(result.correctCategoryRecall,0); // blazer called top
 assert.equal(result.meanMatchedIoU,1);
 assert.equal(result.missingGarments.find(x=>x.category==='Bottoms').label,'black skirt');
 assert.equal(result.missingGarments.find(x=>x.category==='Shoes').unsupportedByThisModel,true);
 assert.equal(result.extraOrDuplicateProposals[0].knownBackgroundFalsePositive,false);
 assert.equal(result.canPromoteModel,false);
});
test('empty proposal set makes all independently seen garments missed without division by zero',()=>{
 const {inventory,annotations}=example();
 const result=evaluateCompletePhysicalInventory(scene,inventory,annotations,new Map());
 assert.equal(result.detectionRecall,0);assert.equal(result.proposalPrecision,null);
 assert.equal(result.missedPhysicalGarments,3);
});
test('wrong source, fake approvals, model-seeded truth and duplicate inventory are rejected',()=>{
 const {inventory,annotations,seeds}=example();
 const original=annotations.get(scene.id+'-item-01');
 const variants=[
  [ {...inventory,sourceSha256:'b'.repeat(64)},annotations ],
  [ {...inventory,approvedBy:'Reviewer A'},annotations ],
  [ {...inventory,allVisibleGarmentsAccountedFor:false},annotations ],
  [ {...inventory,targets:[inventory.targets[0],inventory.targets[0]]},annotations ],
  [ inventory,new Map([[scene.id+'-item-01',{...original,reviewStatus:'draft'}],
   ...[...annotations].filter(([id])=>id!==scene.id+'-item-01')]) ],
  [ inventory,new Map([[scene.id+'-item-01',{...original,seedModel:'deepfashion2'}],
   ...[...annotations].filter(([id])=>id!==scene.id+'-item-01')]) ],
  [ inventory,new Map([[scene.id+'-item-01',{...original,sourceSha256:'bad'}],
   ...[...annotations].filter(([id])=>id!==scene.id+'-item-01')]) ]
 ];
 for(const [inv,ann] of variants)
  assert.throws(()=>evaluateCompletePhysicalInventory(scene,inv,ann,seeds));
 assert.throws(()=>evaluateCompletePhysicalInventory(scene,inventory,annotations,
  new Map([[...seeds][0].slice(0,1)[0],{...seeds.values().next().value,reviewStatus:'approved'}]])));
});
test('physical target ID cannot be reused for a different photo or proposed mask',()=>{
 const {inventory,annotations,seeds}=example();
 const copy=new Map(annotations);const id=scene.id+'-item-01';
 copy.set(id,{...copy.get(id),physicalTargetId:scene.id+'-item-09'});
 assert.throws(()=>evaluateCompletePhysicalInventory(scene,inventory,copy,seeds));
});
test('independent reviewed same-category pieces use one-to-one IoU matching',()=>{
 const {inventory,annotations,seeds}=example();
 inventory.targets=inventory.targets.slice(0,2);
 annotations.delete(scene.id+'-item-03');
 inventory.targets[1]={...inventory.targets[1],category:'Outerwear'};
 annotations.set(scene.id+'-item-02',{...annotations.get(scene.id+'-item-02'),humanCategory:'Outerwear'});
 const result=evaluateCompletePhysicalInventory(scene,inventory,annotations,seeds);
 assert.equal(result.matchedGarments,1,'two duplicate blazer predictions are not two items');
 assert.equal(result.missingGarments.length,1);
});
