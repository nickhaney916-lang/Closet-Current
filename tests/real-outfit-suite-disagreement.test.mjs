import test from 'node:test';
import assert from 'node:assert/strict';
import {compareObservedOutfitSuite} from '../benchmark/real-outfit-suite-disagreement.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const types=(...names)=>names.map(itemType=>({itemType,confidence:.6}));
const components=(present)=>[4,5,6,7,9].map(classId=>({classId,regions:present.includes(classId)?1:0}));
const deep=()=>({status:'complete',modelHashVerified:true,sourceHashesVerified:true,
 independentReferencesAvailable:false,automaticItemsCreated:0,
 cases:[
  {id:'commons-0059',sourceSha256:A,proposals:types('long_sleeve_dress','long_sleeve_top')},
  {id:'validation-0031',sourceSha256:B,proposals:types('long_sleeve_top','skirt')},
  {id:'commons-0049',sourceSha256:A,proposals:types('long_sleeve_dress')}
 ]});
const semantic=()=>({status:'complete',originalSourcePreserved:true,
 independentInstanceMasksAvailable:false,manualReferenceMasksAvailable:false,
 physicalInstancesMeasured:false,productionAuthorized:false,
 cases:[
  {id:'commons-0059',sourceSha256:A,personDetected:false,
   semanticComponents:components([7]),dressCompetition:{mixedClassReviewCandidate:false},
   originalPreserved:true,autoCreatedItems:0},
  {id:'validation-0031',sourceSha256:B,personDetected:true,
   semanticComponents:components([4,7,9]),dressCompetition:{mixedClassReviewCandidate:true},
   originalPreserved:true,autoCreatedItems:0}
 ]});
test('actual-model-derived flat-lay source exposes strict person gating despite semantic dress evidence',()=>{
 const result=compareObservedOutfitSuite(deep(),semantic());
 assert.equal(result.sharedSources,2);
 const flat=result.sourceRows.find(x=>x.id==='commons-0059');
 assert.equal(flat.semanticPersonGatePassed,false);
 assert.equal(flat.flatLayOrNonPersonRoutingRisk,true);
 assert.ok(flat.modelDisagreementTypes.includes('long_sleeve_top'));
 assert.equal(flat.customerClothingItemsCreated,0);
 assert.equal(result.physicalGarmentRecall,null);
 assert.equal(result.canPromoteModel,false);
});
test('worn blazer/skirt source exposes missing semantic skirt without proving distinct item',()=>{
 const result=compareObservedOutfitSuite(deep(),semantic());
 const worn=result.sourceRows.find(x=>x.id==='validation-0031');
 assert.ok(worn.modelDisagreementTypes.includes('skirt'));
 assert.equal(worn.semanticDressVsLayersAmbiguity,true);
 assert.equal(worn.flatLayOrNonPersonRoutingRisk,false);
 assert.equal(worn.physicalGarmentCount,null);
 assert.equal(worn.matchedInstanceIoU,null);
});
test('source hashes, provenance, classes and output counts are validated before comparison',()=>{
 const a=deep(),b=semantic();
 assert.throws(()=>compareObservedOutfitSuite({...a,modelHashVerified:false},b),/Untrusted/);
 assert.throws(()=>compareObservedOutfitSuite(a,{...b,originalSourcePreserved:false}),/Untrusted/);
 assert.throws(()=>compareObservedOutfitSuite(a,{...b,cases:[{...b.cases[0],sourceSha256:B},b.cases[1]]}),/Sources differ/);
 assert.throws(()=>compareObservedOutfitSuite({...a,cases:[a.cases[0],a.cases[0]]},b),/Invalid DeepFashion/);
 assert.throws(()=>compareObservedOutfitSuite(a,{...b,cases:[
  {...b.cases[0],semanticComponents:components([7]).concat({classId:7,regions:3})},b.cases[1]
 ]}),/Malformed semantic/);
 assert.throws(()=>compareObservedOutfitSuite({...a,cases:[{
  ...a.cases[0],proposals:[{itemType:'shoes',confidence:.9}]
 }]},b),/Invalid DeepFashion/);
});
