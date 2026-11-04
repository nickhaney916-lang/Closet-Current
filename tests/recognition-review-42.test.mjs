import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeSuggestion42} from '../research/multi-garment-capture-01/recognition-review-42.mjs';
const schema={types:{Tops:['T-shirt'],Shoes:['Sneakers','Ankle boots'],Accessories:['Bag']}};
const normalize=result=>normalizeSuggestion42(result,schema,['Black','Blue'],['Tops','Shoes']);
test('genuine worker fields map to native schema without promoting conflicting or uncertain labels',()=>{
 assert.deepEqual(normalize({strong:true,choices:[{category:'Shoes',itemType:'Sneakers'}],details:{color:'Blue'}}),
  {category:'Shoes',itemType:'Sneakers',color:'Blue'});
 assert.deepEqual(normalize({strong:true,choices:[{category:'Shoes',itemType:'T-shirt'}],details:{color:'Ultramarine'}}),
  {category:'Shoes',itemType:null,color:null});
 assert.deepEqual(normalize({categoryConfirmed:true,choices:[{category:'Tops',itemType:'T-shirt'}]}),
  {category:'Tops',itemType:null,color:null});
 assert.deepEqual(normalize({strong:true,choices:[{category:'Accessories',itemType:'Bag'}]}),
  {category:null,itemType:null,color:null});
 assert.deepEqual(normalize({choices:[{category:'Shoes',itemType:'Sneakers'}]}),
  {category:null,itemType:null,color:null});
});
