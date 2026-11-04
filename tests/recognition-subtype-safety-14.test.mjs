import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyAutomaticSubtype14 as verify} from '../public/recognition-engine.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
const image={width:700,height:1100,original:true};
const member=(c,t)=>localCandidates.find(x=>x.category===c&&x.itemType===t);
const claim=(c,t)=>({strong:true,choices:[member(c,t)],details:{color:'Blue'}});
const model=(cat,type,score=.96,alternate=null,second=.02)=>{
 const pick=member(cat,alternate||type),other=localCandidates.find(x=>x.category===cat&&x.itemType!==pick.itemType);
 return async(src,labels)=>{assert.equal(src,image);assert.ok(labels.includes(pick.label));return [{label:pick.label,score},{label:other.label,score:second}];};
};
const run=(r,models)=>verify(models[0],image,r,{confirmationModel:models[1],independentModel:models[2],sourceModel:models[3]});
test('clear shirt and sneaker subtypes remain automatically indexable',async()=>{
 for(const [cat,type] of [['Tops','T-shirt'],['Shoes','Sneakers'],['Bottoms','Jeans'],['Outerwear','Jacket']]){
  const m=model(cat,type),r=await run(claim(cat,type),[m,m,m,m]);
  assert.equal(r.strong,true,cat);assert.equal(r.subtypeVerified14,true);assert.equal(r.details.color,'Blue');
 }
});
test('top variants T-shirt sweatshirt blouse tunic sweater are reversible review choices',async()=>{
 for(const [type,other] of [['T-shirt','Sweatshirt'],['Blouse','Tunic'],['Sweater','Sweatshirt']]){
  const good=model('Tops',type),conflict=model('Tops',type,.9,other);
  const r=await run(claim('Tops',type),[good,good,conflict,good]);
  assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,true);
  assert.equal(r.choices[0].itemType,'Unknown');assert.deepEqual(r.details,{});
  assert.ok(r.subtypeChoicesForReview.includes(other));
  assert.equal(r.suggestedTypeForReview,type);
 }
});
test('high-top sneakers cannot be quietly filed as ankle boots on disputed views',async()=>{
 const boots=model('Shoes','Ankle boots'),sneakers=model('Shoes','Sneakers');
 const r=await run(claim('Shoes','Ankle boots'),[boots,boots,sneakers,sneakers]);
 assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,true);
 assert.ok(r.subtypeChoicesForReview.includes('Sneakers'));
});
test('shorts/skirt, coat/cardigan, dresses, tall boots are also challenged',async()=>{
 for(const [cat,type,other] of [['Bottoms','Shorts','Skirt'],['Outerwear','Coat','Cardigan'],['Dresses','Casual dress','Shirt dress'],['Shoes','Tall boots','Ankle boots']]){
  const a=model(cat,type),b=model(cat,other),r=await run(claim(cat,type),[a,a,b,a]);
  assert.equal(r.strong,false,cat);assert.equal(r.choices[0].itemType,'Unknown');
 }
});
test('category conflicts abstain instead of assigning a misleading category',async()=>{
 const top=model('Tops','Blouse'),other=model('Outerwear','Jacket');
 const r=await run(claim('Tops','Blouse'),[top,other,top,top]);
 assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,false);assert.deepEqual(r.choices,[]);
});
test('weak margin can never be mistaken for independent subtype agreement',async()=>{
 const strong=model('Tops','Sweatshirt'),weak=model('Tops','Sweatshirt',.65,null,.34);
 const r=await run(claim('Tops','Sweatshirt'),[strong,strong,weak,strong]);
 assert.equal(r.strong,false);assert.equal(r.reason,'subtype_review_required');
 assert.equal(r.diagnostics.subtypeVerification14.correlatedModelViews,true);
});
test('missing/failed safety model is not a free pass; no error details leaked',async()=>{
 const good=model('Tops','T-shirt'),bad=async()=>{throw Error('PRIVATE path or model');};
 for(const third of [undefined,bad]){
  const r=await run(claim('Tops','T-shirt'),[good,good,third,good]);
  assert.equal(r.strong,false);assert.equal(r.reason,'subtype_verification_unavailable');
  assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
 }
});
test('prior category review or abstention cannot be upgraded by subtype checker',async()=>{
 const good=model('Shoes','Sneakers');
 for(const r of [{strong:false,choices:[]},{strong:true,categoryOnly:true,choices:[{category:'Shoes',itemType:'Unknown'}]}])
  assert.equal(await run(r,[good,good,good,good]),r);
});
test('unknown catalog type fails closed without photo based exceptions',async()=>{
 const good=model('Shoes','Sneakers');
 const r=await run({strong:true,choices:[{category:'Shoes',itemType:'Imaginary boot'}]},[good,good,good,good]);
 assert.equal(r.strong,false);assert.equal(r.reason,'subtype_unverified');
});
