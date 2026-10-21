import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {classifyIndependent,validateOriginal,evaluateIndependentModel,MODEL_REVISION} from '../scripts/independent-clip-subtype-trial.mjs';
test('reference model revision is fixed for repeatable research',()=>assert.match(MODEL_REVISION,/^[a-f0-9]{7,40}$/));
test('independent model scores are recognized only through official exact garment labels',()=>{
 const result=classifyIndependent([{label:'sneakers',score:.83},{label:'ankle boots',score:.15}]);
 assert.equal(result.category,'Shoes');assert.equal(result.type,'Sneakers');assert.ok(result.margin>.6);
 assert.throws(()=>classifyIndependent([{label:'imaginary dress',score:.83},{label:'sneakers',score:.1}]));
 assert.throws(()=>classifyIndependent([{label:'sneakers',score:NaN},{label:'ankle boots',score:.3}]));
});
test('photo-source validation fails on transformed, changed or unverified RGB photo bytes',()=>{
 const bytes=Buffer.from('original rgb source'),hash=createHash('sha256').update(bytes).digest('hex');
 const record={id:'commons-0001',image:'commons-0001.jpg',verified:true,conditions:['visual-review']};
 const source={id:record.id,image:record.image,verified:true,sha256:hash};
 assert.equal(validateOriginal(record,source,bytes),true);
 assert.throws(()=>validateOriginal(record,source,Buffer.from('preview crop')));
 assert.throws(()=>validateOriginal({...record,verified:false},source,bytes));
 assert.throws(()=>validateOriginal(record,{...source,image:'other.jpg'},bytes));
});
const rows=[
 {id:'commons-0001',expectedCategory:'Shoes',expectedType:'Sneakers'},
 {id:'commons-0002',expectedCategory:'Shoes',expectedType:'Sneakers'},
 {id:'commons-0003',expectedCategory:'Dresses',expectedType:'Dress',acceptedTypes:['Casual dress']},
 {id:'commons-0004',expectedCategory:'Shoes',expectedType:'Sneakers'}
];
const original=[
 {id:'commons-0001',prediction:{category:'Shoes',type:'Sneakers'},strong:true},
 {id:'commons-0002',prediction:{category:'Shoes',type:'Ankle boots'},strong:true},
 {id:'commons-0003',prediction:{category:'Dresses',type:'Unknown'},strong:false},
 {id:'commons-0004',prediction:{category:'Shoes',type:'Sneakers'},strong:true}
];
const alternative=[
 {id:'commons-0001',prediction:{category:'Shoes',type:'Sneakers'},score:.9,margin:.8},
 {id:'commons-0002',prediction:{category:'Shoes',type:'Sneakers'},score:.85,margin:.7},
 {id:'commons-0003',prediction:{category:'Dresses',type:'Casual dress'},score:.7,margin:.2},
 {id:'commons-0004',prediction:{category:'Shoes',type:'Loafers'},score:.7,margin:.3}
];
test('real independent-model comparison discloses both prevented bad autosaves and good reviews lost',()=>{
 const manifests={'reviewed-32':rows,'holdout-16':rows,'fresh-11':rows};
 const old=Object.fromEntries(Object.keys(manifests).map(k=>[k,original]));
 const next=Object.fromEntries(Object.keys(manifests).map(k=>[k,alternative]));
 const report=evaluateIndependentModel(manifests,old,next);
 assert.equal(report.productionReleaseApproved,false);
 assert.equal(report.noAutomaticReplacementMade,true);
 for(const set of report.sets){
  assert.equal(set.originalCorrectAutos,2);
  assert.equal(set.originalWrongAutos,1);
  assert.equal(set.proposedAgreementFilterPreventedWrongAutos,1);
  assert.equal(set.proposedAgreementFilterRejectedCorrectAutos,1);
  assert.equal(set.wrongAutosStillAcceptedByAgreement,0);
  assert.equal(set.independentCorrectWhenBaselineWrong,1);
 }
});
test('missing, duplicate or failed independent results fail without claiming better recognition',()=>{
 const wrap=(results)=>evaluateIndependentModel(
  {'reviewed-32':rows,'holdout-16':rows,'fresh-11':rows},
  {'reviewed-32':original,'holdout-16':original,'fresh-11':original},
  {'reviewed-32':results,'holdout-16':alternative,'fresh-11':alternative});
 assert.throws(()=>wrap(alternative.slice(1)));
 assert.throws(()=>wrap([...alternative.slice(0,3),alternative[0]]));
 assert.throws(()=>wrap([{...alternative[0],error:'network'},...alternative.slice(1)]));
});
