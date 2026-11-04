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

test('aborting a live request terminates its worker and cannot start the crop',async()=>{
 const {recognizeReviewedCrop42}=await import('../research/multi-garment-capture-01/recognition-review-42.mjs');
 const originalWorker=globalThis.Worker;
 const controller=new AbortController();
 const messages=[];
 let worker;
 globalThis.Worker=class {
  constructor(){worker=this;}
  postMessage(message){messages.push(message);}
  terminate(){this.closed=true;}
 };
 try {
  const result=recognizeReviewedCrop42({original:'original',crop:'crop',signal:controller.signal,
   schema,palette:['Black'],categories:['Tops','Shoes']});
  assert.deepEqual(messages.map(message=>message.image),['original']);
  const stale=worker.onmessage;
  controller.abort();
  stale({data:{id:messages[0].id,type:'result',strong:true}});
  await assert.rejects(result,{name:'AbortError'});
  assert.equal(worker.closed,true);
  assert.equal(messages.length,1);
 } finally {
  globalThis.Worker=originalWorker;
 }
});
