import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASS_SELECTION,selectedCategoryMask,nativeCategoryAlpha,assessGarmentOnlyComparison}
  from '../benchmark/clothing-only-comparison.mjs';
const map=(labels,width=4,height=3)=>({width,height,labels:Uint8Array.from(labels),confidence:Float32Array.from(labels.map(x=>x?.9:0))});
test('dress masks exclude face, hair, limbs, background and other garments',()=>{
  const m=map([0,2,7,7,11,12,7,7,14,6,4,7]);
  const result=selectedCategoryMask(m,'Dresses',{minimumPixels:2});
  assert.deepEqual([...result.alpha],[0,0,255,255,0,0,255,255,0,0,0,255]);
  assert.equal(result.foregroundPixels,5);
  assert.equal(result.garmentOnlyVerified,false);
  assert.deepEqual([...result.selectedClasses],[7]);
});
test('pants and shoes cannot be silently swapped with dress or skin',()=>{
  assert.deepEqual(CLASS_SELECTION.Bottoms,[5,6]);
  const m=map([0,9,9,11,6,6,6,12,7,4,9,10]);
  const shoes=selectedCategoryMask(m,'Shoes',{minimumPixels:2});
  const bottoms=selectedCategoryMask(m,'Bottoms',{minimumPixels:2});
  assert.equal(shoes.foregroundPixels,3);
  assert.equal(bottoms.foregroundPixels,3);
  assert.equal(shoes.alpha[3],0);
  assert.equal(bottoms.alpha[8],0);
});
test('native-size conversion is nearest-neighbor and no expansion beyond source',()=>{
 const s=selectedCategoryMask(map([7,0,0,7],2,2),'Dresses',{minimumPixels:2});
 assert.deepEqual([...nativeCategoryAlpha(s,4,4)],[
  255,255,0,0,255,255,0,0,
  0,0,255,255,0,0,255,255
 ]);
 assert.throws(()=>nativeCategoryAlpha(s,5000,5000));
});
test('rejects unknown, missing and malformed segmentation instead of fabricating cutout',()=>{
  assert.throws(()=>selectedCategoryMask(map([7,0,0,7],2,2),'Unknown'));
  assert.throws(()=>selectedCategoryMask({width:2,height:2,labels:[7],confidence:[.9]},'Dresses'));
  assert.throws(()=>selectedCategoryMask({width:1,height:1,labels:[7],confidence:[NaN]},'Dresses'));
  const noDress=selectedCategoryMask(map([11,12,7,0],2,2),'Shoes',{minimumPixels:1});
  assert.equal(noDress.detected,false);
  assert.equal(noDress.foregroundPixels,0);
});
test('successful category mask generation cannot become ungrounded launch approval',()=>{
 const r=assessGarmentOnlyComparison([{id:'dress/B0',maskDetected:true},{id:'dress/B2',maskDetected:false}]);
 assert.equal(r.clothingOnlyVerified,false);
 assert.equal(r.independentPixelReferences,false);
 assert.equal(r.mobileRuntimeVerified,false);
 assert.equal(r.productionAuthorized,false);
 assert.equal(r.accuracyPercentage,null);
 assert.deepEqual(r.missingCategoryMasks,['dress/B2']);
});
