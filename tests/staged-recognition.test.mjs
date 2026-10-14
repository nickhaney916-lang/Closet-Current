import test from 'node:test';import assert from 'node:assert/strict';
import {recognizeGarment,categoryCandidates} from '../public/recognition-engine.mjs';import {localCandidates} from '../public/local-catalog.mjs';
const cat=(name,score=.9)=>({label:categoryCandidates.find(x=>x.category===name).label,score}),type=(name,score=.9)=>({label:localCandidates.find(x=>x.itemType===name).label,score});
function setup(responses){if(responses.length===3)responses.push(responses[2]);const calls=[],identified=[];return {calls,identified,async scan(){return recognizeGarment(async(image,labels)=>{calls.push(labels);assert.ok(responses.length);return responses.shift();},{width:112,height:200},{onIdentified:x=>identified.push(x)});}};}
test('category, type and full comparison must agree before identifying a garment',async()=>{
 const h=setup([[cat('Tops'),cat('Shoes',.05)],[type('T-shirt'),type('Blouse',.05)],[type('T-shirt'),type('Blouse',.05)]]),result=await h.scan();assert.equal(result.strong,true);assert.equal(result.choices[0].itemType,'T-shirt');assert.equal(h.calls.length,4);assert.equal(h.identified.length,1);assert.ok(h.calls[1].includes(localCandidates.find(x=>x.category==='Uncategorized').label));assert.ok(!h.calls[1].includes(type('Jeans').label));
});
test('no garment or uncertain main category stops before type recognition',async()=>{
 for(const results of [[cat('Uncategorized'),cat('Tops',.05)],[cat('Tops',.5),cat('Dresses',.4)]]){const h=setup([results]),r=await h.scan();assert.equal(r.strong,false);assert.equal(h.calls.length,1);assert.equal(h.identified.length,0);assert.deepEqual(r.choices,[]);}
});
test('branch ambiguity is not resolved by forcing the most likely type',async()=>{
 const h=setup([[cat('Tops'),cat('Shoes',.05)],[type('T-shirt',.5),type('Blouse',.4)]]),r=await h.scan();assert.equal(r.strong,false);assert.equal(h.calls.length,2);assert.equal(h.identified.length,0);
});
test('cross-category disagreement withholds a tunic/dress or hat/sweater guess',async()=>{
 for(const [category,item,other]of [['Tops','Tunic','Casual dress'],['Accessories','Hat','Sweater']]){const h=setup([[cat(category),cat('Shoes',.05)],[type(item),type(other,.05)],[type(other),type(item,.05)]]),r=await h.scan();assert.equal(r.strong,false);assert.deepEqual(r.details,{});assert.equal(h.identified.length,0);}
});
test('different garment types in the same category also require adjustment',async()=>{
 const h=setup([[cat('Bottoms'),cat('Tops',.05)],[type('Jeans'),type('Leggings',.05)],[type('Leggings'),type('Jeans',.05)]]);assert.equal((await h.scan()).strong,false);assert.equal(h.identified.length,0);
});
test('full comparison must exceed both score and separation gates',async()=>{
 for(const overall of [[type('T-shirt',.59),type('Blouse',.1)],[type('T-shirt',.7),type('Blouse',.51)]]){const h=setup([[cat('Tops'),cat('Shoes',.05)],[type('T-shirt'),type('Blouse',.05)],overall]);assert.equal((await h.scan()).strong,false);assert.equal(h.identified.length,0);}
});

test('a conflicting closer view prevents identification and autosave',async()=>{
 let identified=0;const responses=[[cat('Tops'),cat('Shoes',.05)],[type('Blouse'),type('T-shirt',.05)],[type('Blouse'),type('Casual dress',.05)]];
 const result=await recognizeGarment(async()=>responses.shift(),{width:400,height:533},{confirmationModel:async()=>[type('Casual dress'),type('Blouse',.05)],onIdentified:()=>identified++});assert.equal(result.strong,false);assert.equal(result.reason,'views_disagree');assert.equal(identified,0);assert.deepEqual(result.details,{});
});

test('strong dress category consensus stays in review when subtype votes split',async()=>{
 const primary=[[cat('Dresses',.95),cat('Tops',.05)],[type('Casual dress',.5),type('Sweater dress',.4),type('Unknown',.1)],[type('Casual dress',.48),type('Sweater dress',.45),type('Tunic',.07)]];
 const close=[[cat('Dresses',.94),cat('Tops',.06)],[type('Casual dress',.45),type('Sweater dress',.48),type('Tunic',.07)]];let identified=0;
 const r=await recognizeGarment(async()=>primary.shift(),{width:112,height:200},{confirmationModel:async()=>close.shift(),onIdentified:()=>identified++});
 assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,true);assert.equal(r.reason,'dress_type_review');assert.equal(r.choices[0].category,'Dresses');assert.equal(r.choices[0].itemType,'Unknown');assert.deepEqual(r.details,{});assert.equal(identified,0);
});
test('category review rejects vocabulary contradictions, negatives and uncertain confirmation',async()=>{
 const whole=[type('Casual dress',.48),type('Sweater dress',.45),type('Tunic',.07)];
 for(const [vocabulary,confirm] of [
  [[type('Tunic',.6),type('Casual dress',.4)],null],
  [[type('Casual dress',.44),type('Sweater dress',.44),type('Unknown',.12)],null],
  [whole,[[cat('Dresses',.84),cat('Tops',.16)]]],
  [whole,[[cat('Dresses',.95),cat('Tops',.05)],[type('Casual dress',.48),type('Sweater dress',.3),type('Tunic',.22)]]]
 ]){
  const primary=[[cat('Dresses',.95),cat('Tops',.05)],[type('Casual dress',.5),type('Sweater dress',.4)],vocabulary];
  const r=await recognizeGarment(async()=>primary.shift(),{width:112,height:200},{confirmationModel:async()=>{assert.ok(confirm?.length);return confirm.shift();}});
  assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,undefined);assert.deepEqual(r.choices,[]);
 }
});
