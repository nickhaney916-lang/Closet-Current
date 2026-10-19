import test from 'node:test';
import assert from 'node:assert/strict';
import {localCandidates} from '../public/local-catalog.mjs';
import {auditSubtypeFraming} from '../scripts/audit-subtype-third-framing.mjs';
const candidate=(category,type)=>localCandidates.find(x=>x.category===category&&x.itemType===type);
const photo=(id,category,type,frames,strong=true)=>({
 id,prediction:{category,type},strong,
 framingComparison:[288,320,336].map((size,i)=>({
  contentSize:size,top:[
   {label:candidate(frames[i][0],frames[i][1]).label,score:.92},
   {label:candidate('Shoes','Sandals').label,score:.04}
  ]
 }))
});
const shirt=photo('shirt','Tops','Sweatshirt',[
 ['Tops','Sweatshirt'],['Tops','T-shirt'],['Tops','T-shirt']]);
const sneaker=photo('sneaker','Shoes','Ankle boots',[
 ['Shoes','Ankle boots'],['Shoes','Ankle boots'],['Shoes','Ankle boots']]);
const blank=photo('negative',null,null,[
 ['Shoes','Sneakers'],['Shoes','Sandals'],['Tops','T-shirt']],false);
const truth=[{id:'shirt',mode:'single',expectedCategory:'Tops',expectedType:'T-shirt'},
 {id:'sneaker',mode:'single',expectedCategory:'Shoes',expectedType:'Sneakers'},
 {id:'negative',mode:'single',expectedCategory:'Uncategorized',expectedType:'Unknown'}];
test('different third frame surfaces garment form risk but does not silently approve new subtype',()=>{
 const r=auditSubtypeFraming(truth,[shirt,sneaker,blank]);
 assert.equal(r.sourcePhotos,3);assert.equal(r.clothingPhotos,2);assert.equal(r.negativeControls,1);
 assert.deepEqual(r.baselineWrongAutomaticTypeIds,['shirt','sneaker']);
 assert.deepEqual(r.baselineWrongTypeWithFramingDisagreementIds,['shirt']);
 assert.deepEqual(r.baselineWrongTypeWithFullFrameAgreementIds,['sneaker']);
 assert.equal(r.cases[0].baselineAndThreeFramesAgree,false);
 assert.equal(r.cases[1].baselineAndThreeFramesAgree,true);
 assert.equal(r.cases[2].autoSaveAuthorized,false);
 assert.equal(r.physicalGarmentRecall,null);
 assert.equal(r.canPromoteThresholds,false);
 assert.equal(r.autoSavedGarments,0);
 assert.equal(r.frameSubtypeAgreementPercent,50);
 assert.equal(r.simulatedUnanimityGate.onlyCounterfactual,true);
 assert.equal(r.simulatedUnanimityGate.productionPolicyChanged,false);
 assert.deepEqual(r.simulatedUnanimityGate.retainedWrongTypeIds,['sneaker'],
  'agreement across three framings can still preserve a confidently wrong subtype');
 assert.deepEqual(r.simulatedUnanimityGate.deferredWrongTypeIds,['shirt']);
});
test('malformed or missing third-framing model evidence cannot be counted as proof',()=>{
 assert.throws(()=>auditSubtypeFraming(truth,[shirt,sneaker]),/Missing source result/);
 assert.throws(()=>auditSubtypeFraming(truth,[shirt,{...sneaker,framingComparison:[]},blank]),/Missing subtype frame/);
 assert.throws(()=>auditSubtypeFraming(truth,[shirt,sneaker,sneaker]),/duplicate result/);
});
