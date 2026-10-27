import test from 'node:test';
import assert from 'node:assert/strict';
import {
 BENCHMARK_PIN,loadPinnedArchive,scoreReviewBurden
} from '../scripts/audit-family-alpha-review-burden.mjs';
const label=(id,expectedCategory,expectedType)=>({
 id,mode:'single',verified:true,expectedCategory,expectedType
});
const guess=(id,category,type,strong=true,categoryConfirmed=false)=>({
 id,prediction:category?{category,type}:{category:null,type:null},
 strong,categoryConfirmed
});

test('archived independently verified #226 model decisions and frozen manifests prove review burden, not current accuracy',()=>{
 const {labels,predictions,provenance}=loadPinnedArchive();
 assert.equal(provenance.benchmarkCommit,BENCHMARK_PIN);
 assert.equal(provenance.inferenceExecutedNow,false);
 assert.equal(provenance.realPhotosAccessedNow,false);
 const r=scoreReviewBurden(labels,predictions);
 assert.equal(r.positives,56);
 assert.equal(r.negatives,3);
 assert.equal(r.correctCategory,47);
 assert.equal(r.inferredStrongBefore,35);
 assert.equal(r.inferredStrongAfter,32);
 assert.equal(r.strongSubtypeWrongBefore,0);
 assert.equal(r.strongSubtypeWrongAfter,0);
 assert.equal(r.hypotheticalAdditionalManualReviews,3);
 assert.equal(r.reviewedOrUnresolvedBefore,21);
 assert.equal(r.reviewedOrUnresolvedAfter,24);
 assert.equal(r.categoryOnly,12);
 assert.equal(r.unclassified,9);
 assert.deepEqual(r.heldByRule.outerwear_original_review.ids,
  ['commons-0067','commons-0068','commons-0069']);
 assert.equal(r.heldByRule.outerwear_original_review.correctSubtype,3);
 assert.equal(r.heldByRule.tunic_dress_original_review,undefined);
 assert.equal(r.realPhotoColorAccuracy,null);
 assert.equal(r.actualSavedWardrobeItems,null);
});
test('one truly wrong Outerwear guess is held, and one unrelated wrong top subtype stays visible',()=>{
 const labels=[
  label('j','Outerwear','Jacket'),
  label('s','Tops','T-shirt'),
  label('t','Dresses','Casual dress'),
  label('n','Uncategorized','Unknown')
 ];
 const results=[
  guess('j','Outerwear','Blazer'),
  guess('s','Tops','Sweatshirt'),
  guess('t','Tops','Tunic'),
  guess('n',null,null,false,false)
 ];
 const r=scoreReviewBurden(labels,results);
 assert.equal(r.inferredStrongBefore,3);
 assert.equal(r.inferredStrongAfter,1);
 assert.equal(r.strongSubtypeWrongBefore,3);
 assert.equal(r.strongSubtypeWrongAfter,1);
 assert.equal(r.heldByRule.outerwear_original_review.wrongSubtype,1);
 assert.equal(r.heldByRule.tunic_dress_original_review.wrongSubtype,1);
 assert.equal(r.heldByRule.tunic_dress_original_review.correctSubtype,0);
 assert.equal(r.negativeRejected,undefined); // outside this review-cost scope
});
test('ordinary strong Tops and safe category-only review are not accidentally withheld',()=>{
 const labels=[label('a','Tops','T-shirt'),label('b','Dresses','Casual dress')];
 const results=[guess('a','Tops','T-shirt'),guess('b','Dresses','Unknown',false,true)];
 const r=scoreReviewBurden(labels,results);
 assert.equal(r.inferredStrongBefore,1);
 assert.equal(r.inferredStrongAfter,1);
 assert.equal(r.hypotheticalAdditionalManualReviews,0);
 assert.equal(r.categoryOnly,1);
});
test('missing, forged or duplicated frozen identities and nonboolean strong markers fail closed',()=>{
 const a=label('a','Tops','T-shirt'),b=label('b','Shoes','Sneakers');
 const ok=guess('a','Tops','T-shirt');
 const other=guess('b','Shoes','Sneakers');
 for(const [labels,results] of [
  [[a,b],[ok]],
  [[a,b],[ok,ok]],
  [[a,b],[ok,guess('foreign','Tops','T-shirt')]],
  [[a,a],[ok,other]],
  [[a,b],[{...ok,strong:'true'},other]],
  [[a,b],[{...ok,categoryConfirmed:true},other]],
  [[{...a,verified:false},b],[ok,other]],
  [[a,b],[{...ok,error:'timeout'},other]]
 ])assert.throws(()=>scoreReviewBurden(labels,results));
});
