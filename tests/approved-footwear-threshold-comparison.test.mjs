import test from 'node:test';import assert from 'node:assert/strict';
import {compareApprovedSneakerThresholds,SNEAKER_HOLDOUT_IDS} from '../benchmark/approved-footwear-threshold-comparison.mjs';
import {alphaPrediction} from '../benchmark/object-cutout-mask.mjs';
const sha='a'.repeat(64),rows=SNEAKER_HOLDOUT_IDS.map(id=>({id,image:id+'.jpg',sha256:sha,expectedCategory:'Shoes',verified:true}));
function inputs(){const normal=new Map(),strict=new Map();
 for(const x of rows){const props={width:5,height:5,image:x.image,sourceSha256:sha};
 const pixels=Uint8Array.from([0,0,0,0,0,0,255,255,255,0,0,255,255,255,0,0,128,255,128,0,0,0,0,0,0]);
 normal.set(x.id,alphaPrediction(pixels,props,128));strict.set(x.id,alphaPrediction(pixels,props,224));}
 return [normal,strict];}
function approved(row){return {schemaVersion:1,image:row.image,sourceSha256:sha,width:5,height:5,
 runs:[6,3,2,3,2,3,6],reviewStatus:'approved',reviewer:'First',approvedBy:'Second',seedModel:'experimental'};}
test('unapproved original photographs report disagreement only, never mask accuracy',()=>{
 const [a,b]=inputs(),r=compareApprovedSneakerThresholds(rows,a,b);
 assert.equal(r.approvedOutlines,0);assert.equal(r.pendingOutlines,3);assert.equal(r.aggregateAccuracy,null);
 assert.equal(r.perPhoto[0].standardAccuracy,null);assert.equal(r.thresholdAutomaticallyChosen,false);
 assert.equal(r.specificToeSoleAccuracyMeasured,false);assert.equal(r.productionAuthorized,false);
});
test('partial approval does not create a three-photo mean',()=>{
 const [a,b]=inputs(),r=compareApprovedSneakerThresholds(rows,a,b,new Map([[rows[0].id,approved(rows[0])]]));
 assert.equal(r.approvedOutlines,1);assert.equal(r.aggregateAccuracy,null);assert.equal(r.perPhoto[0].accuracyMeasured,true);
});
test('all true human-reviewed outlines reveal lower-edge loss without promoting mask',()=>{
 const [a,b]=inputs(),refs=new Map(rows.map(row=>[row.id,approved(row)]));
 const r=compareApprovedSneakerThresholds(rows,a,b,refs);
 assert.equal(r.approvedOutlines,3);assert.equal(r.allOutlinesApproved,true);
 assert.ok(r.aggregateAccuracy!==null);
 assert.equal(r.perPhoto[0].changeStrictMinusStandard.missingFabric,2);
 assert.ok(r.perPhoto[0].changeStrictMinusStandard.recall<0);
 assert.equal(r.perPhoto[0].edgeAccuracy.lowerBandIsNotSoleOrToeGroundTruth,true);
 assert.equal(r.thresholdAutomaticallyChosen,false);
});
test('self approval, missing provenance, foreign proposal and duplicate case fail closed',()=>{
 const [a,b]=inputs();
 assert.throws(()=>compareApprovedSneakerThresholds(rows,a,b,new Map([[rows[0].id,{...approved(rows[0]),approvedBy:'First'}]])),/second reviewer/);
 assert.throws(()=>compareApprovedSneakerThresholds(rows,a,b,new Map([[rows[0].id,{...approved(rows[0]),sourceSha256:'b'.repeat(64)}]])),/source mismatch/);
 assert.throws(()=>compareApprovedSneakerThresholds(rows,a,new Map([...b].map(([id,s])=>[id,{...s,foregroundThreshold:128}]))),/unpinned/);
 assert.throws(()=>compareApprovedSneakerThresholds(rows.map(x=>({...x,id:rows[0].id})),a,b),/repeated/);
 assert.throws(()=>compareApprovedSneakerThresholds(rows,a,b,new Map([['validation-0000',approved(rows[0])]])),/Unexpected/);
});
