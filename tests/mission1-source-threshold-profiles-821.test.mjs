import test from 'node:test';
import assert from 'node:assert/strict';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {THRESHOLD_PROFILES_821,clothingLabelMapThreshold821} from '../research/mission1-real-source-threshold-profiles-821/profile-map.mjs';

function syntheticLogits(){
 const w=32,h=32,n=w*h,data=new Float32Array(18*n);
 data.fill(-10);for(let i=0;i<n;i++)data[i]=8;
 const rect=(id,l,t,r,b)=>{
  for(let y=t;y<b;y++)for(let x=l;x<r;x++){
   const i=y*w+x;data[i]=-10;data[id*n+i]=12;
  }
 };
 rect(4,2,8,12,16);rect(6,12,18,19,30);
 rect(10,4,27,8,31);rect(9,24,27,28,31);rect(11,13,1,19,7);
 return {data,dims:[1,18,h,w]};
}
test('P821 standard 70%/15% source thresholds reproduce native output exactly on real-shaped logits',()=>{
 const {data,dims}=syntheticLogits();
 const native=clothingLabelMap(data,dims);
 const candidate=clothingLabelMapThreshold821(data,dims,THRESHOLD_PROFILES_821[0]);
 assert.deepEqual(candidate.labels,native.labels);
 assert.deepEqual(candidate.confidence,native.confidence);
 assert.equal(candidate.personDetected,native.personDetected);
 assert.equal(candidate.width,native.width);
 assert.equal(candidate.height,native.height);
 assert.equal(candidate.labels.filter(v=>v===9).length,32,'both original SegFormer shoe classes 9 and 10 retain all 16+16 true model pixels');
 assert.ok(candidate.labels.some(v=>v===4));
 assert.ok(candidate.labels.some(v=>v===6));
});
test('P821 relaxing only original probabilities changes research label pixels but never asserts human truth',()=>{
 const n=32*32,data=new Float32Array(18*n);
 data.fill(-10);for(let i=0;i<n;i++)data[i]=8;
 for(let y=4;y<14;y++)for(let x=4;x<14;x++){
  const i=y*32+x;data[i]=1;data[4*n+i]=1.3;
 }
 const dims=[1,18,32,32],
  native=clothingLabelMapThreshold821(data,dims,THRESHOLD_PROFILES_821[0]),
  relaxed=clothingLabelMapThreshold821(data,dims,THRESHOLD_PROFILES_821[3]);
 assert.equal(native.labels.filter(v=>v===4).length,0);
 assert.equal(relaxed.labels.filter(v=>v===4).length,100);
 assert.equal(native.personDetected,false);
 assert.equal(relaxed.personDetected,false);
 assert.deepEqual([...THRESHOLD_PROFILES_821.map(x=>x.name)],
  ['native-70-15','exploratory-65-12','exploratory-60-10','exploratory-55-08','strict-80-20']);
});
test('P821 reject nonfinite logits or unregistered research thresholds rather than return invented masks',()=>{
 const {data,dims}=syntheticLogits();
 for(const options of [{minProbability:NaN,minMargin:.15},
  {minProbability:.99,minMargin:.15},{minProbability:.7,minMargin:-1},
  {minProbability:.5,minMargin:0},{minProbability:.7,minMargin:undefined}])
  assert.throws(()=>clothingLabelMapThreshold821(data,dims,options),
   /M1_P821_INVALID_RESEARCH_SCORE_THRESHOLD/);
 const corrupted=Float32Array.from(data);corrupted[100]=Infinity;
 assert.throws(()=>clothingLabelMapThreshold821(corrupted,dims,THRESHOLD_PROFILES_821[0]),
  /M1_P821_NONFINITE_SOURCE_LOGITS/);
 assert.throws(()=>clothingLabelMapThreshold821(data,[1,18,31,32],THRESHOLD_PROFILES_821[0]),
  /M1_P821_BAD_FROZEN_ORIGINAL_LOGITS_DIMENSIONS/);
});
