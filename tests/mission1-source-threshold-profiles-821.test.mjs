import test from 'node:test';
import assert from 'node:assert/strict';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {THRESHOLD_PROFILES_821,clothingLabelMapThreshold821,clothingLabelMapsFused827} from '../research/mission1-real-source-threshold-profiles-821/profile-map.mjs';

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


test('P827 fused five-source threshold maps are byte-identical to five independent original-logit maps',()=>{
 // Deterministic seeded original-shaped logits; this is a computation
 // identity test, not a real-photograph or held-out accuracy benchmark.
 let seed=0x87f1e321;const next=()=>{
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  return (seed>>>0)/4294967296;
 };
 for(const [height,width] of [[1,1],[32,32],[64,48],[128,96]]){
  const area=height*width,data=new Float32Array(18*area);
  for(let i=0;i<area;i++){
   const hot=(i%31),soft=(i%19);
   for(let c=0;c<18;c++){
    // Includes close tie margins and all original classes (including shoe 10).
    data[c*area+i]=Math.fround(-3+next()*4+
     (c===hot%18?2.5:0)+(c===soft%18?.6:0));
   }
  }
  const dims=[1,18,height,width],fused=clothingLabelMapsFused827(data,dims);
  assert.deepEqual(fused.map(x=>x.name),THRESHOLD_PROFILES_821.map(x=>x.name));
  for(const [i,p] of THRESHOLD_PROFILES_821.entries()){
   const reference=clothingLabelMapThreshold821(data,dims,p);
   const result=fused[i].map;
   assert.deepEqual(result.labels,reference.labels,p.name+' labels');
   assert.deepEqual(result.confidence,reference.confidence,p.name+' confidences');
   assert.equal(result.personDetected,reference.personDetected,p.name+' person');
   assert.equal(result.width,reference.width);
   assert.equal(result.height,reference.height);
  }
  assert.deepEqual(fused[0].map.labels,clothingLabelMap(data,dims).labels,
   'native 70/15 remains identical');
  assert.deepEqual(fused[0].map.confidence,clothingLabelMap(data,dims).confidence);
 }
});
test('P827 nonfinite and altered profiles fail closed instead of fabricating evidence',()=>{
 const {data,dims}=syntheticLogits();
 assert.throws(()=>clothingLabelMapsFused827(data,[1,18,32,31]),
  /M1_P827_BAD_ORIGINAL_LOGIT_DIMENSIONS/);
 const corrupt=Float32Array.from(data);corrupt[12]=NaN;
 assert.throws(()=>clothingLabelMapsFused827(corrupt,dims),
  /M1_P827_NONFINITE_ORIGINAL_LOGITS/);
 const fake=[...THRESHOLD_PROFILES_821.map(x=>({...x}))];
 fake[1].minMargin=.11;
 assert.throws(()=>clothingLabelMapsFused827(data,dims,fake),
  /M1_P827_UNREGISTERED_THRESHOLD_PROFILE/);
 assert.throws(()=>clothingLabelMapsFused827(data,dims,THRESHOLD_PROFILES_821.slice(1)),
  /M1_P827_UNREGISTERED_THRESHOLD_PROFILE/);
});
