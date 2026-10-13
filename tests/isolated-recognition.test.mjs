import test from 'node:test';import assert from 'node:assert/strict';
import {classifyIsolatedGarment} from '../public/recognition-engine.mjs';
const image={width:50,height:50};
const uncertain=async()=>[{label:'a blouse',score:.3},{label:'a casual dress',score:.3},{label:'a blurry image with no identifiable garment',score:.4}];
const hint={categories:['Bottoms'],types:[],confidence:.96,clipped:false};
test('a complete high-confidence mask retains only its broad category when details are uncertain',async()=>{
 const r=await classifyIsolatedGarment(uncertain,image,{hint});assert.equal(r.strong,true);assert.equal(r.categoryOnly,true);assert.equal(r.choices[0].category,'Bottoms');assert.equal(r.choices[0].itemType,'Unknown');assert.deepEqual(r.details,{});
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
