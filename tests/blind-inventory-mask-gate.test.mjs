import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBlindLinkedPhysicalInventory as score} from '../benchmark/blind-inventory-mask-gate.mjs';
const id='validation-0031',image=id+'.jpg',sha='e'.repeat(64),
 scene={id,image,sourceSha256:sha},
 lockedSource={id,image,sha256:sha,verified:true,attribution:{license:'CC0'}};
const original=(slot)=>({
 schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
 reviewerSlot:slot,modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
 originalPhotosCopiedOrReencoded:false,independentlyReviewed:false,
 allGarmentFormsVerified:false,photoCount:1,
 originals:[{sourceId:id,image,sourceSha256:sha,license:'CC0'}]
});
const humanItem=(n,category,form,visibility='visible')=>({
 localItemId:'g0'+n,category,form,visibility,
 evidence:'Observed visible physical outline in full original photo'
});
const review=(slot,alias,items)=>({
 schemaVersion:1,reviewType:'independent-blind-source-submission',
 reviewerSlot:slot,reviewerAlias:alias,reviewedAt:'2026-10-19T08:15:00-07:00',
 originalJpegsVerified:true,modelAnswersNotShown:true,
 sourceInventories:[{sourceId:id,sourceSha256:sha,originalJpegShaVerified:true,
  fullSourceInspected:true,allVisibleItemsRecorded:true,items,
  uncertaintyNotes:items.length?'':'No visible clothing'}]
});
const mask=(box)=>{
 const bits=Array(12*12).fill(0),[left,top,right,bottom]=box;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)bits[y*12+x]=1;
 let last=0,count=0;const runs=[];
 for(const bit of bits){if(bit!==last){runs.push(count);count=0;last=bit;}count++;}
 runs.push(count);return {width:12,height:12,runs};
};
function data(){
 const firstPacket=original('first'),secondPacket=original('second');
 const forms=[humanItem(1,'Outerwear','Jacket'),humanItem(2,'Shoes','Sneakers')];
 const firstSubmission=review('first','Independent Alpha',forms);
 const secondSubmission=review('second','Independent Beta',structuredClone(forms));
 const physicalInventory={
  schemaVersion:1,status:'human-inventory-complete',image,sourceSha256:sha,
  originalPhotoVerified:true,allVisibleGarmentsAccountedFor:true,
  reviewedBy:'Mask artist',approvedBy:'Mask approver',reviewedAt:'2026-10-19T12:00:00Z',
  targets:[
   {id:id+'-item-01',category:'Outerwear',form:'outerwear',label:'jacket'},
   {id:id+'-item-02',category:'Shoes',form:'shoes',label:'sneakers'}
  ]
 };
 const approvedMasks=new Map(physicalInventory.targets.map((x,i)=>[x.id,{
  schemaVersion:1,image,sourceSha256:sha,reviewStatus:'approved',
  reviewer:'Mask artist',approvedBy:'Mask approver',
  physicalTargetId:x.id,humanCategory:x.category,humanForm:x.form,
  humanTargetLabel:x.label,targetIndependentlyIdentifiedBy:'Mask artist',
  seedModel:null,...mask(i===0?[1,1,5,5]:[6,6,10,10])
 }]));
 const modelProposals=new Map([[id+'-candidate-01',{
  schemaVersion:1,image,sourceSha256:sha,modelProposalId:id+'-candidate-01',
  modelGarmentLabel:'long_sleeve_outwear',
  reviewStatus:'prediction-unreviewed',independentReference:false,
  canSaveToCustomerCloset:false,...mask([1,1,5,5])
 }]]);
 return {scene,lockedSource,firstPacket,firstSubmission,secondPacket,
  secondSubmission,physicalInventory,approvedMasks,modelProposals};
}
test('no human mask source means no garment recall or automatic release',()=>{
 const args=data();args.physicalInventory=null;
 const result=score(args);
 assert.equal(result.status,'awaiting-independent-per-item-masks');
 assert.equal(result.detectionRecall,null);
 assert.equal(result.formConstrainedRecall,null);
 assert.equal(result.canPromoteModel,false);
 assert.equal(result.canRelease,false);
});
test('fully SHA-bound independent original inventories and two approved physical masks score localization, not sneaker subtype truth',()=>{
 const r=score(data());
 assert.equal(r.status,'conditionally-scored-sha-locked-blind-linked-physical-inventory');
 assert.deepEqual(r.reviewedCategoryCounts,{Outerwear:1,Shoes:1});
 assert.equal(r.approvedPhysicalGarments,2);
 assert.equal(r.modelProposals,1);
 assert.equal(r.detectionRecall,.5);
 assert.equal(r.categoryConstrainedRecall,.5);
 assert.equal(r.formConstrainedRecall,.5);
 assert.equal(r.unresolvedShoeSpecificFormEvidence,true);
 assert.equal(r.specificFootwearSubtypeAccuracy,null);
 assert.equal(r.footwearCategorySupportedByModel,false);
 assert.equal(r.canPromoteModel,false);
 assert.equal(r.trueIndependentInstanceIdentityVerified,false);
 assert.equal(r.noAutomaticClosetSaving,true);
});
test('same photo but sneaker versus boot human form disagreement prevents masks from being treated as verified',()=>{
 const args=data();
 args.secondSubmission.sourceInventories[0].items[1].form='Ankle boots';
 const r=score(args);
 assert.equal(r.status,'blocked-blind-original-disagreement');
 assert.deepEqual(r.reasons,['form-disagreement']);
 assert.equal(r.detectionRecall,null);
 assert.equal(r.approvedPhysicalGarments,0);
});
test('two people agreeing on Unknown or a partially visible layer is still unsafe for benchmark claims',()=>{
 for(const change of [
  item=>{item.form='Unknown';},
  item=>{item.visibility='partially-visible';},
  item=>{item.category='Uncertain';}
 ]){
  const args=data();for(const x of [args.firstSubmission,args.secondSubmission])
   change(x.sourceInventories[0].items[0]);
  const r=score(args);
  assert.equal(r.status,'blocked-blind-original-disagreement');
  assert.ok(r.reasons.includes('unknown-or-partially-visible'));
  assert.equal(r.meanMatchedIoU,null);
 }
});
test('physical approved masks missing a human-observed shoe are blocked instead of silently inflating recall',()=>{
 const args=data();
 args.physicalInventory.targets=args.physicalInventory.targets.slice(0,1);
 args.approvedMasks.delete(id+'-item-02');
 const r=score(args);
 assert.equal(r.status,'blocked-physical-item-category-count-mismatch');
 assert.equal(r.detectionRecall,null);
});
test('same physical category count but wrong mask original SHA, wrong class, or unapproved model seed fails closed',()=>{
 for(const mutation of [
  a=>a.approvedMasks.get(id+'-item-01').sourceSha256='f'.repeat(64),
  a=>a.approvedMasks.get(id+'-item-01').seedModel='fashion-model',
  a=>a.approvedMasks.get(id+'-item-01').reviewer='Mask approver',
  a=>a.modelProposals.get(id+'-candidate-01').reviewStatus='approved',
  a=>a.physicalInventory.approvedBy='Mask artist'
 ]){const a=data();mutation(a);assert.throws(()=>score(a));}
});
test('wrong locked source SHA, mismatched blind packet or missing blind review cannot be bypassed',()=>{
 for(const mutation of [
  a=>{a.lockedSource.sha256='f'.repeat(64);},
  a=>{a.firstPacket.originals[0].sourceSha256='f'.repeat(64);},
  a=>{a.secondSubmission.sourceInventories[0].sourceSha256='f'.repeat(64);},
  a=>{a.firstSubmission.sourceInventories.length=0;},
  a=>{a.lockedSource.verified=false;}
 ]){const a=data();mutation(a);assert.throws(()=>score(a));}
});

test('blind-reviewed negative scene has no garment recall denominator or invented background false-positive claim',()=>{
 const a=data();
 for(const submission of [a.firstSubmission,a.secondSubmission]){
  submission.sourceInventories[0].items=[];
  submission.sourceInventories[0].uncertaintyNotes='Full original inspected; no visible wardrobe items.';
 }
 a.physicalInventory=null;a.approvedMasks=new Map();
 const r=score(a);
 assert.equal(r.status,'blind-observed-no-visible-garments');
 assert.equal(r.observedPhysicalGarments,0);
 assert.equal(r.unverifiedModelProposals,1);
 assert.equal(r.classificationSpecificity,null);
 assert.equal(r.predictedBackgroundFalsePositiveCount,null);
 assert.equal(r.detectionRecall,null);
 assert.equal(r.canRelease,false);
});
test('negative scene cannot accept a fabricated mask or unsafe AI proposal as reference',()=>{
 const a=data();
 for(const submission of [a.firstSubmission,a.secondSubmission]){
  submission.sourceInventories[0].items=[];
  submission.sourceInventories[0].uncertaintyNotes='No clothing in the verified original scene.';
 }
 a.physicalInventory=null;
 assert.throws(()=>score(a),/Negative-control/);
 a.approvedMasks=new Map();
 a.modelProposals.get(id+'-candidate-01').reviewStatus='approved';
 assert.throws(()=>score(a),/Unsafe prediction/);
});
