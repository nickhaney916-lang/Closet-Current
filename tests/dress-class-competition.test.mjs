import test from 'node:test';
import assert from 'node:assert/strict';
import {dressClassCompetition} from '../benchmark/dress-class-competition.mjs';
function setup(w=12,h=10){
 const n=w*h,data=new Float32Array(n*18).fill(-12),labels=new Uint8Array(n);
 for(let i=0;i<n;i++)data[i]=10;
 const paint=(x,y,wid,hei,top,runner,runnerScore)=>{
  for(let yy=y;yy<y+hei;yy++)for(let xx=x;xx<x+wid;xx++){
   const i=yy*w+xx;labels[i]=7;data[i]=0;data[7*n+i]=top;
   data[runner*n+i]=runnerScore;
  }
 };
 return {data,dims:[1,18,h,w],map:{width:w,height:h,labels},paint};
}
test('high-confidence dress has no invented sleeve/skirt items',()=>{
 const s=setup();s.paint(3,2,6,6,8,4,0);
 const original=Array.from(s.data),result=dressClassCompetition(s.data,s.dims,s.map);
 assert.equal(result.selectedDressPixels,36);
 assert.equal(result.lowMarginPixels,0);
 assert.deepEqual(result.upperSkirtBottomsRunnerUp,{upper:0,skirt:0,bottoms:0});
 assert.equal(result.automaticItemSplittingAuthorized,false);
 assert.deepEqual(Array.from(s.data),original);
});
test('spatial competing shirt and skirt logits are reported, not promoted',()=>{
 const s=setup();s.paint(3,2,6,3,4,4,2.6);s.paint(3,5,6,3,4,5,2.5);
 const r=dressClassCompetition(s.data,s.dims,s.map,{maxLogitMargin:2});
 assert.equal(r.selectedDressPixels,36);
 assert.equal(r.lowMarginPixels,36);
 assert.equal(r.upperSkirtBottomsRunnerUp.upper,18);
 assert.equal(r.upperSkirtBottomsRunnerUp.skirt,18);
 assert.ok(r.ambiguousRegionBands.upper.upper>0);
 assert.ok(r.ambiguousRegionBands.lower.skirt>0);
 assert.equal(r.diagnosticLabels[2*12+3],4);
 assert.equal(r.diagnosticLabels[7*12+3],5);
 assert.equal(r.physicalGarmentCountVerified,0);
 assert.equal(r.mixedClassReviewCandidate,false,
  'small synthetic regions are not sufficient to flag mixed garments');
});
test('no dress labels never produces a false split from background evidence',()=>{
 const s=setup();const r=dressClassCompetition(s.data,s.dims,s.map);
 assert.equal(r.selectedDressPixels,0);
 assert.equal(r.lowMarginPixels,0);
 assert.equal(r.automaticItemSplittingAuthorized,false);
});
test('invalid shapes, inconsistent labels, NaN, and unsafe thresholds fail closed',()=>{
 const s=setup();s.paint(2,2,4,3,4,4,2.5);
 assert.throws(()=>dressClassCompetition(s.data,[1,17,10,12],s.map),/Invalid/);
 assert.throws(()=>dressClassCompetition(s.data,s.dims,{width:12,height:10,labels:new Uint8Array(3)}),/Invalid/);
 assert.throws(()=>dressClassCompetition(s.data,s.dims,s.map,{maxLogitMargin:10}),/Invalid/);
 s.data[7*120+2*12+2]=NaN;
 assert.throws(()=>dressClassCompetition(s.data,s.dims,s.map),/Invalid/);
});

test('strong distinct upper and skirt alternatives flag model-only mixed-outfit review',()=>{
 const s=setup(24,20);
 s.paint(5,2,12,7,5,4,3.5);
 s.paint(5,10,12,7,5,5,3.4);
 const r=dressClassCompetition(s.data,s.dims,s.map);
 assert.equal(r.mixedClassReviewCandidate,true);
 assert.equal(r.mixedClassReviewOnly,true);
 assert.ok(r.upperBandUpperPixels>=16);
 assert.ok(r.lowerBandSkirtPixels>=16);
 assert.equal(r.physicalGarmentCountVerified,0);
 assert.equal(r.automaticItemSplittingAuthorized,false);
});
test('scattered runner-up pixels in only one band cannot invent jacket/skirt pair',()=>{
 const s=setup(24,20);
 s.paint(5,2,12,7,5,4,3.5);
 s.paint(5,10,12,7,5,4,3.5);
 const r=dressClassCompetition(s.data,s.dims,s.map);
 assert.equal(r.mixedClassReviewCandidate,false);
 assert.equal(r.lowerBandSkirtPixels,0);
});
test('invalid band threshold cannot turn weak evidence into automatic garment splits',()=>{
 const s=setup();
 assert.throws(()=>dressClassCompetition(s.data,s.dims,s.map,{minBandEvidencePixels:0}));
 assert.throws(()=>dressClassCompetition(s.data,s.dims,s.map,{minBandEvidencePixels:200}));
});
