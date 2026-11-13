import test from 'node:test';import assert from 'node:assert/strict';
import {classifyIsolatedGarment} from '../public/recognition-engine.mjs';
const image={width:50,height:50};
const uncertain=async()=>[
 {label:'a pair of shorts',score:.21},{label:'a skirt',score:.20},
 {label:'a blouse',score:.30},{label:'a T-shirt',score:.10},
 {label:'a blurry image with no identifiable garment',score:.19}
];
const hint={categories:['Bottoms'],types:[],confidence:.96,clipped:false};
test('a complete high-confidence mask retains only its broad category when details are uncertain',async()=>{
 const identified=[];const r=await classifyIsolatedGarment(uncertain,image,{hint,onIdentified:choice=>identified.push(choice)});assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,true);assert.equal(r.categoryOnly,true);assert.equal(r.reason,'mask_category_type_review');assert.equal(r.choices[0].category,'Bottoms');assert.equal(r.choices[0].itemType,'Unknown');assert.deepEqual(r.details,{});assert.deepEqual(identified,[]);
});
test('a confident classifier contradiction requires review',async()=>{
 const r=await classifyIsolatedGarment(async()=>[{label:'a T-shirt',score:.9},{label:'a blurry image with no identifiable garment',score:.1}],image,{hint});assert.equal(r.strong,false);
});
test('clipped or weaker masks do not supply a category on their own',async()=>{
 for(const change of [{clipped:true},{confidence:.85},{confidence:undefined}])assert.equal((await classifyIsolatedGarment(uncertain,image,{hint:{...hint,...change}})).strong,false);
});
test('an upper-clothes mask cannot choose between a top and outerwear without evidence',async()=>{
 assert.equal((await classifyIsolatedGarment(uncertain,image,{hint:{...hint,categories:['Tops','Outerwear']}})).strong,false);
});

test('negative-only scores do not create a clothing category even from a high-confidence mask',async()=>{
 const negatives=async()=>[{label:'a blank wall',score:.9},{label:'a dog or cat',score:.1}];
 const result=await classifyIsolatedGarment(negatives,image,{hint});
 assert.equal(result.strong,false);
 assert.equal(result.categoryConfirmed===true,false);
 assert.equal(result.choices.length,0);
 assert.equal(result.reason,'mask_category_disagrees');
});
