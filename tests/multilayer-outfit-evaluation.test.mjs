import test from 'node:test';
import assert from 'node:assert/strict';
import {partitionOutfitClothing,PART_REGISTRY} from '../benchmark/multilayer-outfit-evaluation.mjs';
const build=(labels,width=8)=>({width,height:labels.length/width,
  labels:Uint8Array.from(labels),confidence:Float32Array.from(labels,x=>x?.96:0),
  personDetected:true});
test('full outfit separates upper garment, skirt and shoes without double counting',()=>{
  const m=build([0,0,4,4,0,0,0,0,5,5,5,0,9,9,0,0]);
  const r=partitionOutfitClothing(m,{minimumPixels:2,expected:['Tops','Skirt','Shoes']});
  assert.deepEqual(r.parts.map(x=>x.slot),['upper','skirt','shoes']);
  assert.equal(r.totalClassPixels,7);
  assert.equal(r.semanticClassesDistinct,true);
  assert.equal(r.parts[0].subtypeResolved,false);
  assert.equal(r.automaticCatalogApproved,false);
});
test('shirt and jacket touching cannot be split using semantic class 4',()=>{
  const m=build([4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]);
  const r=partitionOutfitClothing(m,{minimumPixels:1,expected:['Tops','Outerwear']});
  assert.equal(r.parts.length,1);
  assert.ok(r.issues.includes('shirt-and-jacket-share-one-semantic-class'));
  assert.equal(r.individualOutfitLayersVerified,false);
});
test('pants vs shorts remains unresolved, skirt has distinct class',()=>{
  const m=build([6,6,6,6,5,5,0,0]);
  const r=partitionOutfitClothing(m,{minimumPixels:2,expected:['Pants','Shorts','Skirt']});
  assert.deepEqual(r.parts.map(x=>x.slot),['skirt','pants-or-shorts']);
  assert.ok(r.issues.includes('pants-and-shorts-share-one-semantic-class'));
});
test('dress missing from scene gets explicit failure, not guessed garment',()=>{
  const m=build([0,0,0,0,4,4,0,0]);
  const r=partitionOutfitClothing(m,{minimumPixels:1,expected:['Dresses']});
  assert.deepEqual(r.missing,['Dresses']);
  assert.ok(r.issues.includes('expected-garment-not-detected'));
});
test('dress and upper garment coexist as separate classes but no subtype assumption',()=>{
  const m=build([4,4,4,4,7,7,7,7]);
  const r=partitionOutfitClothing(m,{minimumPixels:2,expected:['Dresses','Outerwear']});
  assert.equal(r.parts.length,2);
  assert.equal(r.missing.length,0);
  assert.equal(r.parts[0].subtypeResolved,false);
  assert.equal(r.automaticCatalogApproved,false);
});
test('outfit indexing rejects malformed data, duplicates, and unsupported expected categories',()=>{
  const m=build([4,4,5,5,7,7,0,0]);
  assert.throws(()=>partitionOutfitClothing(m,{expected:['Shoes','Shoes']}),/Duplicate/);
  assert.throws(()=>partitionOutfitClothing(m,{minimumConfidence:2}),/Invalid/);
  const r=partitionOutfitClothing(m,{minimumPixels:1,expected:['Hat']});
  assert.ok(r.issues.includes('unsupported-expected-garment:Hat'));
  assert.equal(PART_REGISTRY.length,5);
});
