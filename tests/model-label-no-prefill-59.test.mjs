import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneReviewDefaults32,canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
const categories=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const schema={types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Casual dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}};
test('LABEL59 5 real clothing category families and every person flag cannot preselect even with score 1',()=>{
 for(const category of categories)for(const personDetected of [true,false,'true',undefined]){
  const raw={personDetected,hint:{categories:[category],confidence:1,clipped:false},
   colorEstimate:{color:'Blue'}};
  const old=structuredClone(raw);
  const v=sceneReviewDefaults32(raw);
  assert.equal(v.category,'Uncategorized',category);
  assert.equal(v.color,'',category);
  assert.equal(v.requiresExplicitClassification,true,category);
  assert.deepEqual(raw,old,'Original untrusted model evidence stays untouched');
  assert.equal(canConfirmScene32({...v,itemType:schema.types[category][0],cropReviewed:true},schema),false);
 }
});
test('LABEL59 a validated human crop is insufficient until human specifies matching category, specific type, and color',()=>{
 const raw={personDetected:true,hint:{categories:['Tops'],confidence:1,clipped:false},colorEstimate:{color:'Blue'}};
 const v=sceneReviewDefaults32(raw);
 const piece={...v,manual:false,cropReviewed:false,itemType:'T-shirt'};
 assert.equal(canConfirmScene32(piece,schema),false);
 piece.cropReviewed=true;assert.equal(canConfirmScene32(piece,schema),false);
 piece.category='Tops';assert.equal(canConfirmScene32(piece,schema),false);
 piece.color='Blue';assert.equal(canConfirmScene32(piece,schema),true);
 piece.category='Shoes';assert.equal(canConfirmScene32(piece,schema),false);
});
test('LABEL59 even uncertain/relabelled pixel palette and ambiguous or malformed high-score hints cannot overwrite review fields',()=>{
 for(const hint of [
  {categories:['Dresses','Tops'],confidence:1,clipped:false},
  {categories:['Shoes'],confidence:999,clipped:false},
  {categories:['Outerwear'],confidence:0.999999,clipped:false},
  {categories:['Tops'],confidence:'1',clipped:false},
  {categories:['Unknown'],confidence:1,clipped:false},
  null
 ]){
  for(const color of ['White','Black','Blue','Multicolor','Unknown','CUSTOM']){
   const result=sceneReviewDefaults32({personDetected:true,hint,colorEstimate:{color}});
   assert.equal(result.category,'Uncategorized');
   assert.equal(result.color,'');
   assert.equal(result.requiresExplicitClassification,true);
  }
 }
});
test('LABEL59 the native screen keeps model label as display-only unverified text before crop editing',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(ui,/dataset\.modelHint59='unverified'/);
 assert.match(ui,/Unverified detector hint:/);
 assert.match(ui,/Select the correct category, type and color yourself/);
 assert.match(ui,/modelColorHint59:typeof raw\.colorEstimate\?\.color/);
 assert.match(ui,/piece\.modelColorHint59=''/);
 assert.match(ui,/piece\.modelHintStale59=true/);
 assert.match(ui,/!p\.modelHintStale59/);
 assert.match(ui,/category,itemType:'Unknown',color:defaults\.color,confirmed:false/);
 assert.match(ui,/cropReviewed:false/);
 assert.match(ui,/canConfirmScene32\(p,schema\)/);
 assert.match(ui,/canConfirmScene32\(x,schema\)/);
});
test('LABEL59 real mobile-browser acceptance assertions reject old auto-category and auto-color expectations',()=>{
 const browser=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 assert.match(browser,/inputValue\(\),'Uncategorized'/);
 assert.match(browser,/inputValue\(\),''/);
 assert.match(browser,/\[data-model-hint59="unverified"\]/);
 assert.match(browser,/Volatile detector color hint must not enter permanent owner-private wardrobe/);
});
