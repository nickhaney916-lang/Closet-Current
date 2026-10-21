import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeSubtypeReview,policies,comparePolicy} from '../scripts/trial-original-subtype-consensus.mjs';
const row=(category='Shoes',type='Sneakers')=>({id:'commons-0001',
 strong:true,categoryConfirmed:false,prediction:{category,type},
 framingComparison:[288,320,336].map(contentSize=>({
  contentSize,top:[{label:category==='Shoes'?'sneakers':'a T-shirt',score:.9},
   {label:category==='Shoes'?'ankle boots':'a sweatshirt',score:.05}]
 }))});
test('original-photo framing consensus retains a correctly corroborated shoe subtype',()=>{
 const s=proposeSubtypeReview(row());
 assert.equal(s.changed,false);
 assert.equal(s.prediction.strong,true);
 assert.equal(s.matching,3);
});
test('a sneaker photographed ambiguously as ankle boot keeps category for review rather than a wrong autosave',()=>{
 const input=row('Shoes','Ankle boots');
 const result=proposeSubtypeReview(input);
 assert.equal(result.changed,true);
 assert.equal(result.reason,'type_review');
 assert.equal(result.prediction.strong,false);
 assert.equal(result.prediction.categoryConfirmed,true);
 assert.deepEqual(result.prediction.prediction,{category:'Shoes',type:'Unknown'});
 assert.equal(input.strong,true,'source result cannot be mutated');
});
test('conflicting broad garment categories require fresh identity review, not an invented subtype',()=>{
 const input=row();
 input.framingComparison[1].top[0]={label:'a T-shirt',score:.7};
 const result=proposeSubtypeReview(input);
 assert.equal(result.changed,true);
 assert.equal(result.reason,'category_review');
 assert.equal(result.prediction.prediction.category,null);
 assert.equal(result.prediction.categoryConfirmed,false);
});
test('a frame with misleading low margin cannot count as strong independent agreement',()=>{
 const input=row();
 input.framingComparison[1].top[1].score=.85;
 input.framingComparison[2].top[1].score=.85;
 assert.equal(proposeSubtypeReview(input).changed,true);
 assert.equal(proposeSubtypeReview(input,policies.balanced).changed,true);
});
test('incomplete or duplicated original-photo views fail closed without autosave',()=>{
 for(const frames of [null,[],row().framingComparison.slice(0,2),
  [row().framingComparison[0],row().framingComparison[0],row().framingComparison[1]],
  row().framingComparison.map(x=>({...x,contentSize:999}))]){
  const value={...row(),framingComparison:frames};
  const result=proposeSubtypeReview(value);
  assert.equal(result.reason,'incomplete_views');
  assert.equal(result.prediction.strong,false);
  assert.equal(result.prediction.categoryConfirmed,false);
 }
});
test('non-garment and already review-only results cannot be promoted to automatic saves',()=>{
 for(const input of [
  {...row(),strong:false,categoryConfirmed:true,prediction:{category:'Shoes',type:'Unknown'}},
  {...row(),prediction:{category:'Accessories',type:'Bag'}},
  {...row(),prediction:{category:'Uncategorized',type:'Unknown'}}
 ]){
  const result=proposeSubtypeReview(input);
  assert.equal(result.changed,false);
  assert.equal(result.prediction.strong,input.strong);
 }
});
test('all-category consensus can retain a conservative wrong-subtype review result',()=>{
 const original=row('Tops','Sweatshirt');
 const labels=[{label:'a T-shirt',score:.6},{label:'a sweatshirt',score:.3}];
 for(const v of original.framingComparison)v.top=labels;
 const result=proposeSubtypeReview(original);
 assert.equal(result.prediction.categoryConfirmed,true);
 assert.equal(result.prediction.prediction.type,'Unknown');
});
test('candidate-vs-baseline comparison counts prevented wrong auto saves AND lost good autos',()=>{
 const correct=row();
 const wrong={...row('Shoes','Ankle boots'),id:'commons-0002'};
 const manifest=[
  {id:'commons-0001',verified:true,conditions:['visual-review'],expectedCategory:'Shoes',expectedType:'Sneakers'},
  {id:'commons-0002',verified:true,conditions:['visual-review'],expectedCategory:'Shoes',expectedType:'Sneakers'}
 ];
 const result=comparePolicy('two-control-photos',manifest,[correct,wrong],policies.conservative);
 assert.equal(result.originalSafeAuto,1);
 assert.equal(result.originalIncorrectAuto,1);
 assert.equal(result.candidateSafeAuto,1);
 assert.equal(result.candidateIncorrectAuto,0);
 assert.equal(result.incorrectAutosSentToReview,1);
 assert.equal(result.correctAutosSentToReview,0);
 assert.equal(result.launchOrClassifierPromotionAuthorized,false);
});
test('duplicate, missing and unverified original labels cannot produce a passing trial',()=>{
 const r=row();
 const ground=[{id:r.id,verified:true,conditions:['visual-review'],
  expectedCategory:'Shoes',expectedType:'Sneakers'}];
 assert.throws(()=>comparePolicy('x',ground,[]));
 assert.throws(()=>comparePolicy('x',ground,[{...r,id:'commons-1234'}]));
 assert.throws(()=>comparePolicy('x',[{...ground[0],verified:false}],[r]));
 assert.throws(()=>comparePolicy('x',[ground[0],ground[0]],[r,r]));
});
