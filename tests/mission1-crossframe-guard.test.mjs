import test from 'node:test';
import assert from 'node:assert/strict';
import {corroborateAmbiguousType} from '../public/recognition-confusion-guard.mjs';

const result=(category,itemType)=>({strong:true,
 choices:[{category,itemType,label:itemType,score:.96,sleeveLength:'Long sleeve'}],
 details:{color:'Green',pattern:'Solid',fit:'Regular'},
 diagnostics:{primary:{confidence:.99}}});
const checked=async r=>corroborateAmbiguousType(r);
test('Mission1 four empirically unsafe high-confidence subtype classes ALWAYS require owner review',async()=>{
 for(const [category,type] of [
  ['Tops','Sweatshirt'],['Tops','Tunic'],
  ['Outerwear','Blazer'],['Shoes','Ankle boots']
 ]){
  const r=result(category,type),x=await checked(r);
  assert.equal(x.strong,false,category+'/'+type);
  assert.equal(x.categoryConfirmed,true);
  assert.equal(x.categoryOnly,true);
  assert.equal(x.choices[0].category,category);
  assert.equal(x.choices[0].itemType,'Unknown');
  assert.deepEqual(x.details,{});
  assert.equal(x.reason,'type_uncertain');
  assert.equal(x.diagnostics.mission1SubtypeSafety.ownerSubtypeReviewRequired,true);
  assert.equal(x.diagnostics.mission1SubtypeSafety.independentHumanReviewCompleted,false);
 }
});
test('Mission1 same-weight model view agreement cannot silently override failed real-source A/B result',async()=>{
 let calls=0;
 const r=result('Shoes','Ankle boots');
 const out=await corroborateAmbiguousType(r,{secret:'owner JPEG'},{
  sourceWhole:async()=>{calls++;return [{label:'ankle boots',score:.99}]},
  sourceCenter:async()=>{calls++;return [{label:'ankle boots',score:.99}]}
 });
 assert.equal(calls,0);
 assert.equal(out.strong,false);
 assert.equal(out.choices[0].itemType,'Unknown');
 assert.equal(out.diagnostics.mission1SubtypeSafety.sourceFramesCompared,0);
 assert.ok(!JSON.stringify(out).includes('owner JPEG'));
});
test('Mission1 unrelated valid clothing remains exactly unchanged with no extra model computation',async()=>{
 for(const [category,type] of [
  ['Tops','T-shirt'],['Tops','Blouse'],
  ['Outerwear','Jacket'],['Outerwear','Coat'],
  ['Shoes','Sneakers'],['Shoes','Tall boots'],
  ['Bottoms','Jeans'],['Bottoms','Skirt'],
  ['Dresses','Casual dress'],['Accessories','Scarf']
 ]){
  const r=result(category,type);
  assert.strictEqual(await checked(r),r,category+'/'+type);
 }
});
test('Mission1 cannot fabricate approval for unresolved or category-only existing results',async()=>{
 const r={strong:false,categoryConfirmed:true,choices:[{category:'Tops',itemType:'Unknown'}],details:{}};
 assert.strictEqual(await checked(r),r);
 const other={strong:false,choices:[]};assert.strictEqual(await checked(other),other);
});
test('Mission1 original private photo and saved wardrobe are not touched by subtype policy',async()=>{
 const r=result('Outerwear','Blazer');
 r.image='PRIVATE_IMAGE_DO_NOT_COPY';
 r.owner='PRIVATE_ACCOUNT';
 r.savedCloset={revision:48};
 const before=JSON.stringify(r);
 const x=await checked(r);
 assert.equal(JSON.stringify(r),before);
 assert.ok(!JSON.stringify(x).includes('PRIVATE'));
 assert.equal(x.choices[0].category,'Outerwear');
 assert.equal(x.details.color,undefined);
});
test('Mission1 missing or corrupted result never creates a new automatic identity',async()=>{
 for(const x of [undefined,null,{}, {strong:true,choices:[]}]){
  const result=await checked(x);
  assert.strictEqual(result,x);
 }
});
test('Mission1 source-independent risk rule never reads or invents a probability threshold for owner approval',async()=>{
 const r=result('Tops','Tunic');
 r.choices[0].score=1;
 const x=await checked(r);
 assert.equal(x.strong,false);
 assert.equal(x.diagnostics.mission1SubtypeSafety.automaticallyCertified,false);
 assert.equal(x.diagnostics.mission1SubtypeSafety.categoryPreserved,true);
});
