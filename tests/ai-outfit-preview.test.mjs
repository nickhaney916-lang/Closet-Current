import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {prepare}=require('../public/ai-outfit-preview.js');
const img='data:image/png;base64,aGVsbG8=';
test('AI preview uses exact selected clothing references in wearing order',()=>{
 const result=prepare({slots:{top:'a',bottom:'b',layer:'c',shoes:'d'}},[
  {id:'a',name:'Shirt',category:'Tops',image:img},{id:'b',name:'Jeans',category:'Bottoms',image:img},
  {id:'c',name:'Jacket',category:'Layers',image:img},{id:'d',name:'Shoes',category:'Shoes',image:img},
  {id:'unused',image:img}]);
 assert.deepEqual(result.garments.map(g=>g.itemId),['a','b','c','d']);
 assert.equal(result.garments[0].image,img);
 assert.equal(result.requirements.preserveGarmentAppearance,true);
});
test('AI preview excludes bottoms hidden by a dress',()=>{
 const result=prepare({slots:{top:'dress',bottom:'pants'}},[
  {id:'dress',category:'Dresses',itemType:'Dress',image:img},{id:'pants',image:img}]);
 assert.deepEqual(result.garments.map(g=>g.itemId),['dress']);
});
test('AI preview excludes unsafe and remote image references',()=>{
 assert.throws(()=>prepare({slots:{top:'a'}},[{id:'a',image:'https://example.com/private.jpg'}]),/at least one/);
});
