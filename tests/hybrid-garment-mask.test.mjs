import test from 'node:test';
import assert from 'node:assert/strict';
import {hybridGarmentAlpha,protectedBodyFromLogits} from '../benchmark/hybrid-garment-mask.mjs';
const labels=Uint8Array.from([
  0,0,0,0,0,0,0,
  0,0,0,7,0,0,0,
  0,0,7,7,7,0,0,
  0,0,7,7,7,0,0,
  0,0,0,7,0,0,0
]);
const map={width:7,height:5,labels,confidence:Float32Array.from(labels,x=>x===7?.95:0),personDetected:true};
const opaque=new Uint8Array(35).fill(255);
test('hybrid keeps garment and close object edges but excludes explicit face/arm/leg areas',()=>{
 const protectedBody=new Uint8Array(35);
 for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,19,20])protectedBody[i]=1;
 const a=hybridGarmentAlpha(opaque,7,5,map,'Dresses',{protectedBody,haloCells:1,minSemanticPixels:2});
 assert.equal(a.alpha[3],0); // head
 assert.equal(a.alpha[11],0); // arm
 assert.equal(a.alpha[24],255); // center dress
 assert.equal(a.alpha[25],255); // nearby object detail
 assert.ok(a.removedPixels>0);
 assert.ok(a.bodyVetoedPixels>0);
 assert.equal(a.garmentOnlyVerified,false);
});
test('isolated object foreground does not survive away from target garment',()=>{
 const a=hybridGarmentAlpha(opaque,7,5,{...map,personDetected:false},'Dresses',{haloCells:0,minSemanticPixels:2});
 assert.equal(a.alpha[0],0);
 assert.equal(a.alpha[34],0);
 assert.equal(a.alpha[24],255);
 assert.equal(a.keptPixels,8);
});
test('body detected without a protection map fails rather than admitting person',()=>{
 assert.throws(()=>hybridGarmentAlpha(opaque,7,5,map,'Dresses',{minSemanticPixels:2}),/body exclusion/);
 assert.throws(()=>hybridGarmentAlpha(opaque,7,5,map,'Dresses',{protectedBody:new Uint8Array(2),minSemanticPixels:2}),/body exclusion/);
});
test('semantic and object masks alone do not prove cutout accuracy',()=>{
 const empty={width:2,height:2,labels:Uint8Array.from([0,0,0,0]),confidence:Float32Array.from([0,0,0,0]),personDetected:false};
 const result=hybridGarmentAlpha(Uint8Array.from([255,255,255,255]),2,2,empty,'Dresses',{haloCells:2,minSemanticPixels:1});
 assert.equal(result.keptPixels,0);
 assert.equal(result.seedDetected,false);
 assert.equal(result.accuracyMeasured,false);
 assert.equal(result.releaseApproved,false);
});
test('semantic protection follows class logits and blocks face, skin and limbs',()=>{
 const logits=new Float32Array(18*4).fill(-5);
 for(const [i,label] of [11,7,14,9].entries())logits[label*4+i]=5;
 const p=protectedBodyFromLogits(logits,[1,18,2,2]);
 assert.deepEqual([...p],[1,0,1,0]);
 assert.throws(()=>protectedBodyFromLogits([1],[1,18,2,2]));
});
test('rejects invalid object-alpha and excessive halo expansion',()=>{
 assert.throws(()=>hybridGarmentAlpha(new Uint8Array(1),7,5,map,'Dresses'));
 assert.throws(()=>hybridGarmentAlpha(opaque,7,5,map,'Dresses',{haloCells:100}));
});

test('confidence-gated body veto exposes ambiguous regions for review without changing strict baseline',()=>{
 const area=4,logits=new Float32Array(18*area).fill(-10);
 // First image pixel: weak skin vs dress, second: confidently skin.
 logits[11*area+0]=4.1;logits[7*area+0]=4.0;
 logits[11*area+1]=12;logits[7*area+1]=0;
 logits[7*area+2]=12;logits[11*area+2]=0;
 logits[14*area+3]=5;logits[4*area+3]=4.98;
 const dims=[1,18,2,2],original=new Float32Array(logits);
 const strict=protectedBodyFromLogits(logits,dims);
 const conservative=protectedBodyFromLogits(logits,dims,{minProbability:.8,minMargin:.25});
 assert.deepEqual([...strict],[1,1,0,1]);
 assert.deepEqual([...conservative],[0,1,0,0]);
 assert.deepEqual(logits,original,'original semantic logits are read only');
 assert.throws(()=>protectedBodyFromLogits(logits,dims,{minProbability:1.01}),/Invalid/);
 assert.throws(()=>protectedBodyFromLogits(logits,dims,{minMargin:NaN}),/Invalid/);
 assert.throws(()=>protectedBodyFromLogits(logits,dims,{minMargin:-.1}),/Invalid/);
});
test('review-only relaxed body veto cannot reduce any retained silhouette pixel',()=>{
 const map={width:7,height:5,labels,confidence:Float32Array.from(labels,x=>x===7?.95:0),personDetected:true};
 const strictBody=new Uint8Array(35),confidentBody=new Uint8Array(35);
 for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,19,20])strictBody[i]=1;
 confidentBody.set(strictBody);confidentBody[15]=0;confidentBody[16]=0;
 const strict=hybridGarmentAlpha(opaque,7,5,map,'Dresses',{protectedBody:strictBody,haloCells:1,minSemanticPixels:2});
 const experimental=hybridGarmentAlpha(opaque,7,5,map,'Dresses',{protectedBody:confidentBody,haloCells:1,minSemanticPixels:2});
 for(let i=0;i<strict.alpha.length;i++)
  assert.ok(experimental.alpha[i]>=strict.alpha[i],'no existing clothing pixel is removed');
 assert.equal(strict.releaseApproved,false);
 assert.equal(experimental.releaseApproved,false);
});
