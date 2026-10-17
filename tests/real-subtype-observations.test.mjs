import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileGarmentSubtype} from '../benchmark/garment-subtype-consensus.mjs';
const data=JSON.parse(readFileSync('benchmark/real-subtype-observations-20261017.json','utf8'));
const byId=new Map(data.cases.map(c=>[c.id,c]));
test('eight source-matched real inference cases are saved as observations, not accuracy',()=>{
 assert.equal(data.cases.length,8);
 assert.equal(byId.size,8);
 assert.equal(data.actualModelResults,true);
 assert.equal(data.pixelAccuracyMeasured,false);
 assert.equal(data.automaticallySavedItems,0);
 for(const c of data.cases){
  assert.match(c.sourceSha256,/^[a-f0-9]{64}$/);
  assert.equal(c.autoCreatedItems,0);
  assert.equal(c.duplicateItemsCreated,0);
 }
});
test('real jacket cases disagree between image framings',()=>{
 for(const id of ['commons-0060','commons-0062']){
  const c=byId.get(id);
  assert.equal(c.reviewReason,'two-framings-disagree');
  assert.equal(c.subtypeCandidate,null);
  assert.equal(c.proposedSemanticClass,4);
 }
});
test('dress and jacket scene cannot be confidently indexed as two garments',()=>{
 const c=byId.get('commons-0059');
 assert.deepEqual(c.semanticClassesFromPriorRun,[7]);
 assert.equal(c.subtypeCandidate,null);
 assert.equal(c.reviewReason,'semantic-class-disagrees-with-candidate');
});
test('headwear dominated wearer photo, so blouse was not justified',()=>{
 const c=byId.get('validation-0008');
 assert.equal(c.wholeTop3[0].itemType,'Scarf');
 assert.equal(c.proposedSemanticClass,null);
 assert.equal(c.reviewReason,'no-compatible-semantic-region');
});
test('confident wrong-looking garment subtype still cannot auto-create a record',()=>{
 const c=byId.get('commons-0003');
 assert.equal(c.subtypeCandidate,'Sweatshirt');
 assert.equal(c.reviewReason,'cross-view-subtype-consistent');
 const whole=c.wholeTop3,confirmation=c.confirmationTop3;
 const pick=(ranking,frame)=>({
  category:ranking[0].category,itemType:ranking[0].itemType,
  score:ranking[0].score,secondScore:ranking[1].score,frame,sourceSha256:c.sourceSha256
 });
 const result=reconcileGarmentSubtype({sourceSha256:c.sourceSha256,semanticClass:4,
  regionId:c.id+':4',whole:pick(whole,'whole-336'),
  confirmation:pick(confirmation,'center-320')});
 assert.equal(result.catalogType,'Sweatshirt');
 assert.equal(result.canAutoCreateItems,false);
 assert.equal(result.independentlyConfirmedType,false);
});
test('two skirt photographs have tentative subtype consistency but no measured pixel accuracy',()=>{
 for(const id of ['commons-0041','commons-0043']){
  const c=byId.get(id);
  assert.equal(c.subtypeCandidate,'Skirt');
  assert.equal(c.proposedSemanticClass,5);
  assert.equal(c.autoCreatedItems,0);
 }
});
test('overview correctly reflects three consistent types, but not confirmed garments',()=>{
 assert.equal(data.cases.filter(c=>c.subtypeCandidate).length,3);
 assert.equal(data.cases.filter(c=>!c.subtypeCandidate).length,5);
 assert.equal(data.cases.filter(c=>c.reviewReason==='two-framings-disagree').length,2);
});
