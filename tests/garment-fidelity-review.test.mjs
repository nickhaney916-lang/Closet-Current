import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {ASPECTS,evaluate}=require('../public/garment-fidelity-review.js');

const approved=()=>({
 mode:'owner-compared-original',comparedOriginal:true,sourceConditionedGeneration:true,
 checks:Object.fromEntries(ASPECTS.map(x=>[x,'same'])),
 inventedDetails:false,unseenBrandingIntroduced:false
});
test('all seven actual visual aspects plus invention checks required for eligible preview',()=>{
 assert.equal(ASPECTS.length,7);
 const result=evaluate(approved());
 assert.equal(result.approved,true);
 assert.equal(result.automaticApprovalAllowed,false);
 assert.equal(result.sourcePhotoImmutable,true);
});
test('button, zipper and seam invention detected by human review vetoes display',()=>{
 const record=approved();
 record.checks.visibleConstruction='different';
 assert.equal(evaluate(record).decision,'reject');
});
test('wash/color change vetoes even attractive normalized jeans',()=>{
 const record=approved();record.checks.dominantColor='different';
 assert.equal(evaluate(record).approved,false);
});
test('garment type, pattern and count must each preserve identity',()=>{
 for(const part of ['garmentCategory','patternGraphics','itemCount']){
  const record=approved();record.checks[part]='different';
  assert.equal(evaluate(record).decision,'reject');
 }
});
test('unknown actual visible fabric details cannot be auto-assumed correct',()=>{
 const record=approved();record.checks.fabricAppearance='unknown';
 const result=evaluate(record);
 assert.equal(result.decision,'needs-review');
 assert.deepEqual(result.unknown,['fabricAppearance']);
});
test('model cannot give itself independent owner approval',()=>{
 for(const k of ['mode','comparedOriginal','sourceConditionedGeneration']){
  const record=approved();record[k]=null;
  assert.equal(evaluate(record).approved,false);
 }
 assert.equal(evaluate(null).approved,false);
});
test('invented text, labels and unseen brand details explicitly block promotion',()=>{
 const record=approved();record.unseenBrandingIntroduced=true;
 assert.equal(evaluate(record).decision,'reject');
 record.unseenBrandingIntroduced=false;record.inventedDetails=true;
 assert.equal(evaluate(record).decision,'reject');
});
test('missing invention review remains pending not quietly eligible',()=>{
 const record=approved();delete record.inventedDetails;
 assert.equal(evaluate(record).decision,'needs-review');
});
