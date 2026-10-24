import {test} from 'node:test';
import assert from 'node:assert/strict';
import {score} from '../scripts/report-assignment20-recognition.mjs';
const labels=[{id:'a',expectedCategory:'Bottoms',expectedType:'Shorts'},{id:'b',expectedCategory:'Bottoms',expectedType:'Skirt'}];
test('abstention stays in denominator and strong shorts/skirt error is visible',()=>{
 const r=score(labels,[{id:'a',prediction:{category:'Bottoms',type:'Skirt'},strong:true},{id:'b',prediction:{}}]);
 assert.equal(r.total.categoryAccuracyPercent,50);assert.equal(r.total.wrongStrongType,1);assert.equal(r.total.acceptedTypeCorrect,0);assert.equal(r.total.abstained,1);assert.equal(r.colorAccuracy,null);
});
test('duplicate, missing and foreign IDs cannot inflate score',()=>{
 for(const rows of [[{id:'a'}],[{id:'a'},{id:'a'}],[{id:'a'},{id:'foreign'}]])assert.throws(()=>score(labels,rows));
});
test('runtime errors are never counted as correct and semantic alternatives stay separate',()=>{
 const r=score([{...labels[0],acceptedTypes:['Culottes']}],[{id:'a',prediction:{category:'Bottoms',type:'Culottes'},strong:true}]);
 assert.equal(r.total.exactTypeCorrect,0);assert.equal(r.total.acceptedTypeCorrect,1);
 const e=score([labels[0]],[{id:'a',prediction:{category:'Bottoms',type:'Shorts'},strong:true,error:'timeout'}]);
 assert.equal(e.total.categoryCorrect,0);assert.equal(e.total.wrongStrongType,1);
});
