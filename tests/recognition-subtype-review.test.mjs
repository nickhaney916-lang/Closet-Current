import test from 'node:test';
import assert from 'node:assert/strict';
import {requireSubtypeReview} from '../public/recognition-subtype-review.mjs';
const strong=(category,itemType)=>({strong:true,categoryConfirmed:false,choices:[{category,itemType,score:.96,sleeveLength:'Unknown'}],details:{material:'cotton'}});
for(const [category,type] of [['Tops','Tunic'],['Outerwear','Blazer'],['Shoes','Ankle boots']]){
 test(category+' / '+type+' cannot silently auto-admit a semantically overlapping subtype',()=>{
  const output=requireSubtypeReview(strong(category,type));
  assert.equal(output.strong,false);
  assert.equal(output.categoryConfirmed,true);
  assert.equal(output.categoryOnly,true);
  assert.equal(output.choices[0].category,category);
  assert.equal(output.choices[0].itemType,'Unknown');
  assert.deepEqual(output.details,{});
  assert.equal(output.reason,'subtype_needs_review');
 });
}
for(const [category,type] of [['Tops','Blouse'],['Outerwear','Jacket'],['Shoes','Sneakers'],['Bottoms','Shorts'],['Dresses','Casual dress']]){
 test(category+' / '+type+' retains automatic recognition',()=>{
  const input=strong(category,type);
  assert.strictEqual(requireSubtypeReview(input),input);
 });
}
test('non-strong and negative classifications remain unchanged',()=>{
 for(const input of [{strong:false,choices:[]},{strong:false,choices:[{category:'Tops',itemType:'Tunic'}]},null]){
  assert.strictEqual(requireSubtypeReview(input),input);
 }
});
