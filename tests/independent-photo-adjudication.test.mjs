import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareIndependentAdjudication,checkThirdIndependentSubmission} from '../benchmark/independent-photo-adjudication.mjs';
const s1='commons-0078',s2='commons-0059',h1='a'.repeat(64),h2='b'.repeat(64);
const originals=[
 {sourceId:s1,image:s1+'.jpg',sourceSha256:h1,license:'CC BY-SA 4.0'},
 {sourceId:s2,image:s2+'.jpg',sourceSha256:h2,license:'CC0'}
];
const packet=role=>({
 schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
 reviewerSlot:role,reviewerAlias:null,reviewedAt:null,
 modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
 originalPhotosCopiedOrReencoded:false,
 photoCount:2,independentlyReviewed:false,allGarmentFormsVerified:false,
 originals:structuredClone(originals)
});
const item=(n,category,form,visibility='visible')=>({
 localItemId:'g'+String(n).padStart(2,'0'),category,form,visibility,
 evidence:'The physical form can be seen in the actual full-source photo'
});
const scene=(id,sha,items)=>({
 sourceId:id,sourceSha256:sha,originalJpegShaVerified:true,fullSourceInspected:true,
 allVisibleItemsRecorded:true,items,uncertaintyNotes:items.length?'':'This is a real negative-control original'
});
const submitted=(role,name,shoes='Sneakers',layers='Dress',visibility='visible')=>({
 schemaVersion:1,reviewType:'independent-blind-source-submission',
 reviewerSlot:role,reviewerAlias:name,reviewedAt:'2026-10-19T10:05:00-07:00',
 originalJpegsVerified:true,modelAnswersNotShown:true,
 sourceInventories:[
  scene(s1,h1,[item(1,'Shoes',shoes,visibility)]),
  scene(s2,h2,[item(1,'Dresses',layers)])
 ]
});
test('disputed high-top footwear and dress+jacket produce private comparison and source-only blind third packet',()=>{
 const a=submitted('first','collector-alpha'),
       b=submitted('second','collector-beta','Ankle boots','Dress');
 b.sourceInventories[1].items.push(item(2,'Outerwear','Jacket'));
 const result=prepareIndependentAdjudication(packet('first'),a,packet('second'),b);
 const privateReport=result.adjudicatorOnly,p=result.thirdBlindPacket;
 assert.equal(privateReport.sourcePhotos,2);
 assert.deepEqual(privateReport.thirdReviewerSourceIds,[s1,s2]);
 assert.deepEqual(privateReport.photos[0].flaggedReasons,['different-category-or-specific-form']);
 assert.deepEqual(privateReport.photos[1].flaggedReasons,['different-visible-physical-item-count','different-category-or-specific-form','different-occlusion-or-visibility'].filter(x=>x!=='different-occlusion-or-visibility'));
 assert.equal(p.reviewerSlot,'third');assert.equal(p.photoCount,2);
 assert.deepEqual(p.originals,originals);
 const encoded=JSON.stringify(p);
 for(const leak of ['Sneakers','Ankle boots','Jacket','collector-alpha','collector-beta','manifestLabel','modelResult','originalSourceUrl'])
  assert.ok(!encoded.includes(leak),'third reviewer cannot see previous answers '+leak);
 assert.equal(privateReport.independentPhysicalGarmentCount,null);
 assert.equal(privateReport.approvedPhysicalGarmentMasks,0);
 assert.equal(privateReport.canRelease,false);
 assert.equal(privateReport.modelPolicyImprovementMeasured,false);
});
test('two matching Unknown form or partially visible garment observations remain unresolved despite label agreement',()=>{
 for(const [form,vis] of [['Unknown','visible'],['Sneakers','partially-visible'],['Sneakers','uncertain']]){
  const a=submitted('first','collector-alpha',form,'Dress',vis);
  const b=submitted('second','collector-beta',form,'Dress',vis);
  const r=prepareIndependentAdjudication(packet('first'),a,packet('second'),b);
  assert.deepEqual(r.adjudicatorOnly.thirdReviewerSourceIds,[s1]);
  assert.deepEqual(r.adjudicatorOnly.photos[0].flaggedReasons,['unknown-or-partially-visible-item']);
  assert.equal(r.thirdBlindPacket.photoCount,1);
  assert.deepEqual(r.thirdBlindPacket.originals,[originals[0]]);
 }
});
test('two complete matching apparent forms create no third request but physical-instance masks remain missing',()=>{
 const r=prepareIndependentAdjudication(packet('first'),submitted('first','A-Independent'),
  packet('second'),submitted('second','B-Independent'));
 assert.equal(r.thirdBlindPacket,null);
 assert.equal(r.adjudicatorOnly.firstTwoReviewerAgreementWithoutInstanceProof,2);
 assert.ok(r.adjudicatorOnly.photos.every(p=>p.imageStillRequiresIndependentVisibleGarmentOutlineReview));
 assert.ok(r.adjudicatorOnly.photos.every(p=>p.physicalGarmentCount===null));
 assert.equal(r.adjudicatorOnly.specificFootwearSubtypeAccuracy,null);
 assert.equal(r.adjudicatorOnly.layeredPhysicalGarmentRecall,null);
 assert.equal(r.adjudicatorOnly.modelPolicyImprovementMeasured,false);
});
test('third reviewer cannot impersonate first/second; correctly submitted blind third does not approve model or masks',()=>{
 const a=submitted('first','person-alpha');
 const b=submitted('second','person-beta','Ankle boots');
 const handoff=prepareIndependentAdjudication(packet('first'),a,packet('second'),b);
 const independentThird={
  ...submitted('third','person-gamma'),
  sourceInventories:[scene(s1,h1,[item(1,'Shoes','Sneakers')])]
 };
 const result=checkThirdIndependentSubmission(handoff,independentThird);
 assert.equal(result.thirdSourceCount,1);
 assert.equal(result.thirdOriginalsShaVerified,true);
 assert.equal(result.approvedPixelMasks,0);
 assert.equal(result.physicalGarmentRecall,null);
 assert.equal(result.productionModelChangeAllowed,false);
 assert.throws(()=>checkThirdIndependentSubmission(handoff,{...independentThird,reviewerAlias:'PERSON-ALPHA'}),/independent/);
 assert.throws(()=>checkThirdIndependentSubmission(handoff,{...independentThird,reviewerAlias:'person-beta'}),/independent/);
 assert.throws(()=>checkThirdIndependentSubmission(handoff,{
  ...independentThird,sourceInventories:[{...independentThird.sourceInventories[0],sourceSha256:'c'.repeat(64)}]
 }),/source JPEG/);
});
test('answer-bearing source URL, wrong sources, repeated reviewer or missing verified full-scene attestations fail closed',()=>{
 const a=submitted('first','person-alpha'),b=submitted('second','person-beta');
 const leaked=packet('first');leaked.originals[0].originalSourceUrl='https://commons.wikimedia.org/wiki/File:high-top-sneakers.jpg';
 assert.throws(()=>prepareIndependentAdjudication(leaked,a,packet('second'),b),/Untrusted/);
 assert.throws(()=>prepareIndependentAdjudication(packet('first'),a,packet('second'),
   {...b,reviewerAlias:'Person-Alpha'}),/different identities/);
 const unverified=structuredClone(a);unverified.sourceInventories[0].allVisibleItemsRecorded=false;
 assert.throws(()=>prepareIndependentAdjudication(packet('first'),unverified,packet('second'),b),/whole scene/);
});
