import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneReviewDefaults32,canConfirmScene32,SCENE32_MIN_UNCALIBRATED_MASK_SCORE}
 from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';

const schema={types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}};
const item=(id=7,override={})=>({
 instanceKey:'seg-'+id+'-10-12-80-90-1',personDetected:false,
 image:'data:image/jpeg;base64,/9j/2Q==',
 hint:{categories:[id===7?'Dresses':id===5?'Bottoms':'Tops'],types:[],clipped:false,confidence:.999},
 colorEstimate:{color:'Green'},cropBounds:{x:.15,y:.1,width:.7,height:.8},...override
});
test('true per-pixel score 0.999 cannot pre-fill incorrect dress on a flat-lay with no person',()=>{
 const source=item(7),original=structuredClone(source);
 const result=sceneReviewDefaults32(source);
 assert.deepEqual(result,{category:'Uncategorized',color:'',reason:'no-person-evidence',requiresExplicitClassification:true});
 assert.deepEqual(source,original,'source, model hint and crop must be untouched');
});
test('overlapping shirt mislabeled as skirt stays unclassified even with high score',()=>{
 const raw=item(5,{hint:{categories:['Bottoms'],confidence:1,clipped:false}});
 assert.equal(sceneReviewDefaults32(raw).category,'Uncategorized');
 assert.equal(sceneReviewDefaults32(raw).color,'');
});
test('untrusted/missing person state fails closed and cannot imply clothing identity',()=>{
 for(const personDetected of [undefined,null,false,0,'true']) {
  const raw=item(4,{personDetected});
  assert.equal(sceneReviewDefaults32(raw).category,'Uncategorized');
 }
});
test('LABEL59 worn garment strong person and score=0.999 remain empty owner category/color until explicit selection',()=>{
 const raw=item(4,{personDetected:true}),original=structuredClone(raw);
 const result=sceneReviewDefaults32(raw);
 assert.deepEqual(result,{category:'Uncategorized',color:'',reason:'model-label-unverified',requiresExplicitClassification:true});
 assert.equal(canConfirmScene32({...result,itemType:'T-shirt',cropReviewed:true},schema),false);
 assert.deepEqual(raw,original,'Model data and source crop must not be mutated');
});
test('ambiguous, clipped, invalid-score or weak person masks require manual category selection',()=>{
 const scenarios=[
  {categories:['Tops','Outerwear'],clipped:false,confidence:1},
  {categories:['Tops'],clipped:true,confidence:1},
  {categories:['Tops'],confidence:1},
  {categories:['Tops'],clipped:false,confidence:.94},
  {categories:['Tops'],clipped:false,confidence:'0.999'},
  {categories:['Tops'],clipped:false,confidence:Infinity},
  {categories:['Tops'],clipped:false,confidence:1.1},
  {categories:['Garbage'],clipped:false,confidence:1}
 ];
 for(const hint of scenarios)assert.equal(sceneReviewDefaults32(item(4,{personDetected:true,hint})).category,'Uncategorized',JSON.stringify(hint));
 assert.equal(SCENE32_MIN_UNCALIBRATED_MASK_SCORE,.95);
});
test('a category is never enough: genuine human subtype and color plus crop must pass validation',()=>{
 const piece={category:'Uncategorized',itemType:'Unknown',color:'',cropReviewed:true};
 assert.equal(canConfirmScene32(piece,schema),false);
 piece.category='Dresses';assert.equal(canConfirmScene32(piece,schema),false);
 piece.itemType='Dress';assert.equal(canConfirmScene32(piece,schema),false);
 piece.color='Blue';assert.equal(canConfirmScene32(piece,schema),true);
 piece.itemType='Jeans';assert.equal(canConfirmScene32(piece,schema),false);
 piece.itemType='Dress';piece.manual=true;piece.cropReviewed=false;
 assert.equal(canConfirmScene32(piece,schema),false);
 piece.cropReviewed=true;assert.equal(canConfirmScene32(piece,schema),true);
 piece.color='Unknown';assert.equal(canConfirmScene32(piece,schema),false);
});
test('research review UI invokes the policy at ingestion AND again before saving',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(ui,/sceneReviewDefaults32\(raw\)/);
 assert.match(ui,/canConfirmScene32\(p,schema\)/);
 assert.match(ui,/canConfirmScene32\(x,schema\)/);
 assert.match(ui,/No person was verified/);
 assert.match(ui,/I confirm this visible garment, category and color/);
 assert.match(ui,/atomicSaveGarments24/);
 assert.match(ui,/sameOwner\(\)/);
});
