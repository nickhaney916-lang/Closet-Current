import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyIsolatedGarment} from '../public/recognition-engine.mjs';
const image={width:4032,height:3024};
const hinted={categories:['Shoes'],types:[],confidence:.99,clipped:false};
const shoe=async(_image,labels=[])=>labels.includes('shoes, boots, or sandals')?[{label:'shoes, boots, or sandals',score:.94},{label:'a blank wall',score:.06}]:[{label:'sneakers',score:.94},{label:'a blank wall',score:.06}];
const wall=async()=>[{label:'a blank wall',score:.7},{label:'a dog or cat',score:.27},{label:'sneakers',score:.03}];
for(const [name,first,second]of [['both views',wall,wall],['primary only',wall,shoe],['confirmation only',shoe,wall]]){
 test(`mask hint cannot override strong nonclothing evidence in ${name}`,async()=>{
  const identified=[];const result=await classifyIsolatedGarment(first,image,{hint:hinted,confirmationModel:second,onIdentified:x=>identified.push(x)});
  assert.equal(result.strong,false);assert.deepEqual(result.choices,[]);assert.deepEqual(result.details,{});assert.deepEqual(identified,[]);
  assert.equal(result.reason,'mask_nonclothing_disagrees');
 });
}
test('no clothing scores is not evidence for a hinted dress or shorts category',async()=>{
 for(const category of ['Dresses','Bottoms']){
  const result=await classifyIsolatedGarment(async()=>[],image,{hint:{...hinted,categories:[category]}});
  assert.equal(result.strong,false);assert.deepEqual(result.choices,[]);
 }
});
test('valid shoe agreement still identifies exact type without mutating full-resolution source',async()=>{
 const before=structuredClone(image);
 const result=await classifyIsolatedGarment(shoe,image,{hint:hinted});
 assert.equal(result.strong,true);assert.equal(result.choices[0].itemType,'Sneakers');assert.deepEqual(image,before);
});
test('uncertain clothing votes cannot be overridden by a confident unrelated mask category',async()=>{
 const ambiguous=async()=>[{label:'a blouse',score:.3},{label:'a casual dress',score:.3},{label:'a blurry image with no identifiable garment',score:.4}];
 const result=await classifyIsolatedGarment(ambiguous,image,{hint:hinted});
 assert.equal(result.strong,false);assert.deepEqual(result.choices,[]);
});
test('both views can retain a genuinely supported broad shoe category without inventing subtype',async()=>{
 const broad=async(_image,labels=[])=>labels.includes('shoes, boots, or sandals')?[{label:'shoes, boots, or sandals',score:.9},{label:'a blank wall',score:.1}]:[{label:'sneakers',score:.4},{label:'ankle boots',score:.3},{label:'flat shoes',score:.1},{label:'a blank wall',score:.2}];
 const result=await classifyIsolatedGarment(broad,image,{hint:hinted});
 assert.equal(result.strong,true);assert.equal(result.categoryOnly,true);assert.equal(result.choices[0].category,'Shoes');assert.equal(result.choices[0].itemType,'Unknown');
});
test('mask cannot bypass uncertain broad category even when two full-catalog votes favor shoes',async()=>{
 const classifier=async(_image,labels)=>labels.includes('shoes, boots, or sandals')?
  [{label:'shoes, boots, or sandals',score:.4},{label:'a shirt, blouse, sweater, or other top',score:.35},{label:'a blank wall',score:.25}]:
  [{label:'sneakers',score:.94},{label:'a blank wall',score:.06}];
 let identified=0;const result=await classifyIsolatedGarment(classifier,image,{hint:hinted,onIdentified:()=>identified++});
 assert.equal(result.strong,false);assert.deepEqual(result.choices,[]);assert.equal(identified,0);
});
