import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRecognitionRegressions as check} from '../scripts/check-recognition-regressions.mjs';

const manifest=[
 {id:'shoe',mode:'single',expectedCategory:'Shoes',expectedType:'Ankle boots',acceptedTypes:['Ankle boots','Tall boots']},
 {id:'dress',mode:'single',expectedCategory:'Dresses',expectedType:'Casual dress'},
 {id:'negative',mode:'single',expectedCategory:'Uncategorized'},
 {id:'known',mode:'single',expectedCategory:'Outerwear',expectedType:'Jacket'}
];
const rows=[
 {id:'shoe',strong:true,categoryConfirmed:false,prediction:{category:'Shoes',type:'Tall boots'}},
 {id:'dress',strong:false,categoryConfirmed:true,prediction:{category:'Dresses',type:'Unknown'}},
 {id:'negative',strong:false,categoryConfirmed:false,prediction:{category:null,type:null}},
 {id:'known',strong:true,categoryConfirmed:false,prediction:{category:'Outerwear',type:'Blazer'}}
];
const run=mutate=>{const results=structuredClone(rows);mutate?.(results);return check(manifest,results,{results:rows});};
test('unchanged measured results pass and known subtype mismatches stay visible',()=>{
 const report=run();assert.equal(report.passed,true);assert.equal(report.photoCount,4);
 assert.deepEqual(report.knownTypeMismatches,[{id:'known',type:'Blazer'}]);
});
test('shoe coverage and automatic indexing cannot regress behind category-only review',()=>{
 assert.ok(run(r=>{r[0].prediction.category=null;}).failures.some(x=>x.reason==='category_regression'));
 assert.ok(run(r=>{r[0].strong=false;}).failures.some(x=>x.reason==='automatic_indexing_regression'));
 assert.ok(run(r=>{r[0].prediction.type='Sneakers';}).failures.some(x=>x.reason==='new_incorrect_automatic_type'));
 assert.equal(run(r=>{r[0].prediction.type='Ankle boots';}).passed,true);
});
test('dress review must retain its category without guessing an automatic subtype',()=>{
 assert.ok(run(r=>{r[1].prediction.category=null;}).failures.some(x=>x.reason==='category_regression'));
 assert.ok(run(r=>{r[1].strong=true;}).failures.some(x=>x.reason==='new_incorrect_automatic_type'));
 assert.ok(run(r=>{r[1].prediction.type='Formal dress';}).failures.some(x=>x.reason==='review_guesses_type'));
 assert.equal(run(r=>{r[1].strong=true;r[1].prediction.type='Casual dress';}).passed,true);
});
test('nonclothing predictions and runtime failures fail even with acceptance flags off',()=>{
 assert.ok(run(r=>{r[2].prediction.category='Tops';}).failures.some(x=>x.reason==='negative_false_positive'));
 assert.ok(run(r=>{r[2].error='model failed';}).failures.some(x=>x.reason==='runtime_error'));
 assert.ok(run(r=>{r[0].error='model failed';}).failures.some(x=>x.reason==='runtime_error'));
});
test('a known wrong subtype cannot excuse a different wrong type or category',()=>{
 assert.ok(run(r=>{r[3].prediction.type='Coat';}).failures.some(x=>x.reason==='new_incorrect_automatic_type'));
 assert.ok(run(r=>{r[3].prediction.category='Tops';}).failures.some(x=>x.reason==='incorrect_category'));
 assert.equal(run(r=>{r[3].prediction.type='Jacket';}).passed,true);
});
test('missing, duplicate, unexpected and malformed results cannot look like a passing benchmark',()=>{
 assert.ok(run(r=>{r.pop();}).failures.some(x=>x.reason==='missing_result'));
 assert.throws(()=>run(r=>{r.push(r[0]);}),/duplicate/);
 assert.ok(run(r=>{r.push({...r[0],id:'extra'});}).failures.some(x=>x.reason==='unexpected_result'));
 assert.ok(run(r=>{delete r[0].strong;}).failures.some(x=>x.reason==='invalid_result'));
 assert.throws(()=>check(manifest.slice(1),rows,{results:rows}),/absent from manifest/);
 assert.throws(()=>check(manifest,rows,{results:rows.slice(1)}),/absent from baseline/);
});
