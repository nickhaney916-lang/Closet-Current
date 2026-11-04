import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreAutoMultiEvidence15 as score,boxOverlap15,validRegionBox15} from '../scripts/score-auto-multi-15.mjs';
const source=JSON.parse(readFileSync('research/auto-multi-model-evidence-15/locked-worn-original.json','utf8'));
const proposals=(row)=>row.regions.map(e=>({
 regionId:e.family==='upper'?4:e.family==='bottom'?6:9,
 label:e.family==='upper'?'Upper garment':e.family==='bottom'?'Bottoms':'Shoes',
 confidence:.96,box:{...e.box},needsReview:true,clipped:false
}));
const cases=()=>source.map(row=>({id:row.id,sourceSha256:row.sourceSha256,browser:row.browser,
 modelExecuted:true,error:null,sourcePixelsVerified:true,proposals:proposals(row)}));
test('two independent browser runs of one original: 3 coarse human-reviewed regions each, never mask IoU',()=>{
 const result=score(source,cases(),{verifiedLiveInference:true});
 assert.equal(result.cases.length,2);assert.equal(result.realMultiPhotoPopulation,1,'same original shown in two browsers is one photo, not two photos');
 assert.equal(result.singlePhotoSmokeGatePassed,true);
 assert.equal(result.modelQualityAccepted,false,'one photo never certifies real-world model quality');
 assert.equal(result.expectedCoarseRegions,6);
 assert.equal(result.matchedCoarseRegions,6);assert.equal(result.coarseBoxRecallProxyPercent,100);
 assert.equal(result.modelProposals,6);assert.equal(result.unmatchedCoarseRegions,0);
 assert.equal(result.allSourcesVerified,true);assert.equal(result.modelErrors,0);
 assert.equal(result.automaticMaskIoU,null);assert.equal(result.fullyAutomaticMultiGarmentRecallPercent,null);
 assert.equal(result.automaticGarmentTypeAccuracyPercent,null);
 assert.equal(result.familyAlpha,'HOLD');assert.equal(result.productionDeployed,false);
 assert.ok(result.cases.every(x=>x.qualityReviewRequired&&x.noAutomaticClosetSave));
});
test('a missing shoe is not concealed by perfect shirt and bottoms',()=>{
 const x=cases();for(const row of x)row.proposals=row.proposals.filter(p=>p.regionId!==9);
 const r=score(source,x,{verifiedLiveInference:true});
 assert.equal(r.matchedCoarseRegions,4);
 assert.equal(r.unmatchedCoarseRegions,2);
 assert.equal(r.scenesWithThreeProposedClasses,0);
 assert.equal(r.modelQualityAccepted,false);
 assert.ok(r.cases.every(x=>x.unmatchedTruth.includes('shoes')));
});
test('one large class-wrong bounding box cannot substitute for three clothing pieces',()=>{
 const x=cases();for(const row of x)row.proposals=[{...row.proposals[0],box:{x:.30,y:.03,width:.6,height:.94}}];
 const r=score(source,x,{verifiedLiveInference:true});
 assert.equal(r.matchedCoarseRegions<=2,true);
 assert.equal(r.scenesWithThreeProposedClasses,0);
 assert.equal(r.modelQualityAccepted,false);
});
test('coarse box overlap is class-agnostic geometry but matching is class-constrained',()=>{
 const a={x:.1,y:.1,width:.3,height:.3},b={x:.1,y:.1,width:.3,height:.3};
 assert.equal(boxOverlap15(a,b),1);
 assert.equal(boxOverlap15(a,{x:.6,y:.6,width:.2,height:.2}),0);
 assert.equal(validRegionBox15({...a,x:-.1}),false);
 assert.throws(()=>boxOverlap15(a,{x:0,y:0,width:0,height:1}),/invalid geometry/);
 const x=cases();for(const row of x)row.proposals=row.proposals.map(p=>({...p,regionId:9,label:'Shoes'}));
 const r=score(source,x,{verifiedLiveInference:true});
 assert.equal(r.scenesWithThreeProposedClasses,0);
 assert.equal(r.modelQualityAccepted,false);
});
test('all segments must be explicitly review-only; reject fake auto acceptance and malformed geometry',()=>{
 const x=cases();x[0].proposals[0].needsReview=false;
 assert.throws(()=>score(source,x),/invalid model proposal/);
 const y=cases();y[0].proposals[0].box.width=4;
 assert.throws(()=>score(source,y),/invalid model proposal/);
 const z=cases();z[0].proposals[0].confidence=1.5;
 assert.throws(()=>score(source,z),/invalid model proposal/);
});
test('original JPEG identity and required two real browser cases cannot be substituted',()=>{
 const x=cases();x[0].sourceSha256='a'.repeat(64);
 assert.throws(()=>score(source,x),/source image hash changed/);
 const y=cases();y[0].browser='invented-native-phone';
 assert.throws(()=>score(source,y),/not genuine supported browser/);
 assert.throws(()=>score(source,cases().slice(1)),/missing or extra/);
});
test('model failure is a recorded scientific failure, not zero-error/no-proposals success',()=>{
 const x=cases();
 x[0]={...x[0],modelExecuted:false,error:'worker_reported_failure',proposals:[]};
 const result=score(source,x,{verifiedLiveInference:true});
 assert.equal(result.modelErrors,1);
 assert.equal(result.modelQualityAccepted,false);
 assert.equal(result.expectedCoarseRegions,6);
 assert.equal(result.matchedCoarseRegions,3);
 assert.equal(result.cases[0].modelError,true);
 const bad=cases();bad[0].error='worker_reported_failure';
 assert.throws(()=>score(source,bad),/model failure falsely reported/);
});
test('research runner never treats unit label maps as real neural inference',()=>{
 const r=score(source,cases());
 assert.equal(r.inferenceMode,'synthetic-label-map-unit-test-not-real-accuracy');
 assert.equal(r.modelQualityAccepted,false);
});