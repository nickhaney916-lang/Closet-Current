import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBlindOriginalSubmission,reconcileBlindOriginalSubmissions} from '../benchmark/blind-original-review-submissions.mjs';
const sha='a'.repeat(64),s='commons-0078',packet=slot=>({
 schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
 reviewerSlot:slot,modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
 originalPhotosCopiedOrReencoded:false,independentlyReviewed:false,allGarmentFormsVerified:false,
 photoCount:2,originals:[
  {sourceId:s,image:s+'.jpg',sourceSha256:sha,originalSourceUrl:'https://commons.wikimedia.org/wiki/File:'+s,license:'CC0'},
  {sourceId:'commons-0059',image:'commons-0059.jpg',sourceSha256:'b'.repeat(64),
   originalSourceUrl:'https://commons.wikimedia.org/wiki/File:commons-0059',license:'CC0'}
 ]});
const invent=(id,sourceSha256,forms=[],notes='')=>({
 sourceId:id,sourceSha256,originalJpegShaVerified:true,
 fullSourceInspected:true,allVisibleItemsRecorded:true,
 items:forms.map(([category,form,visibility='visible',evidence='Original visible shape and sole'],i)=>({
  localItemId:'g'+String(i+1).padStart(2,'0'),category,form,visibility,evidence})),
 uncertaintyNotes:notes
});
const submitted=(slot,alias,first=[['Shoes','Sneakers']],second=[['Dresses','Dress']])=>({
 schemaVersion:1,reviewType:'independent-blind-source-submission',
 reviewerSlot:slot,reviewerAlias:alias,reviewedAt:'2026-10-19T10:10:00-07:00',
 originalJpegsVerified:true,modelAnswersNotShown:true,
 sourceInventories:[invent(s,sha,first),invent('commons-0059','b'.repeat(64),second)]
});
test('two genuinely distinct blind reviewer submissions identify count and specific form disputes without claiming model accuracy',()=>{
 const a=submitted('first','independent-alpha');
 const b=submitted('second','independent-beta',
  [['Shoes','Ankle boots']],[['Dresses','Dress'],['Outerwear','Jacket']]);
 const q=reconcileBlindOriginalSubmissions(packet('first'),a,packet('second'),b);
 assert.equal(q.sourcePhotos,2);assert.equal(q.blindReviewers,2);
 assert.deepEqual(q.countsDisagree,['commons-0059']);
 assert.deepEqual(q.categoryOrSpecificFormDisagree,['commons-0078','commons-0059']);
 assert.deepEqual(q.photosNeedingThirdReviewer,['commons-0078','commons-0059']);
 assert.equal(q.physicalGarmentRecall,null);
 assert.equal(q.independentMaskIoU,null);
 assert.equal(q.independentlyApprovedPhysicalInventories,0);
 assert.equal(q.approvedModelAccuracy,null);
 assert.equal(q.mayTrainOrAdjustModel,false);
 assert.equal(q.autoSavedGarments,0);
});
test('identical names/counts/form do not certify garment instance identity or approved masks',()=>{
 const a=submitted('first','person-red');
 const b=submitted('second','person-blue');
 const result=reconcileBlindOriginalSubmissions(packet('first'),a,packet('second'),b);
 assert.deepEqual(result.photosNeedingThirdReviewer,[]);
 assert.deepEqual(result.photosWithSameLabelsNotInstanceVerified,[s,'commons-0059']);
 assert.ok(result.photos.every(x=>!x.instanceCorrespondenceVerified&&!x.sourcePixelOutlinesApproved));
 assert.equal(result.physicalGarmentRecall,null);assert.equal(result.canRelease,false);
});
test('no human garment in a source needs explicit full-scene negative-control explanation',()=>{
 const p=packet('first'),a=submitted('first','observer-01',[]);
 assert.throws(()=>validateBlindOriginalSubmission(p,a),/negative-control/);
 a.sourceInventories[0].uncertaintyNotes='Verified empty room; no visible apparel.';
 const v=validateBlindOriginalSubmission(p,a);
 assert.equal(v.visibleItemObservations,1);
 assert.equal(v.independentGarmentGroundTruth,false);
});
test('missing source, wrong original photo, fake completion, leaked extra model fields and uncertain form without evidence fail closed',()=>{
 const p=packet('first'),a=submitted('first','person-01');
 for(const mutation of [
  x=>{x.sourceInventories.pop();},
  x=>{x.sourceInventories[0].sourceSha256='f'.repeat(64);},
  x=>{x.sourceInventories[0].originalJpegShaVerified=false;},
  x=>{x.sourceInventories[0].fullSourceInspected=false;},
  x=>{x.sourceInventories[0].items[0].evidence='';},
  x=>{x.sourceInventories[0].items[0].category='Sneaker';},
  x=>{x.sourceInventories[0].items[0].modelPrediction='Ankle boots';},
  x=>{x.modelPrediction={category:'Shoes'};},
  x=>{x.modelAnswersNotShown=false;},
  x=>{x.sourceInventories.push({...x.sourceInventories[0]});}
 ]){const altered=structuredClone(a);mutation(altered);assert.throws(()=>validateBlindOriginalSubmission(p,altered));}
});
test('self-approval, wrong reviewer slot or missing true original image approval are rejected',()=>{
 const a=submitted('first','same-person'),b=submitted('second','SAME-PERSON');
 assert.throws(()=>reconcileBlindOriginalSubmissions(packet('first'),a,packet('second'),b),/different identities/);
 assert.throws(()=>validateBlindOriginalSubmission(packet('first'),{...a,reviewerSlot:'second'}),/Invalid/);
 assert.throws(()=>validateBlindOriginalSubmission({...packet('first'),modelPredictionsIncluded:true},a),/Untrusted/);
 assert.throws(()=>validateBlindOriginalSubmission(packet('first'),{...a,originalJpegsVerified:false}),/Invalid/);
});
