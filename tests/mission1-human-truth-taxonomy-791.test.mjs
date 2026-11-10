import test from 'node:test';
import assert from 'node:assert/strict';
import {
 supportedHumanGarment791,enforceHumanGarment791,
 verifySingleHumanTruth791,supportedHumanCategories791
} from '../research/mission1-human-truth-taxonomy-integrity-791/canonical-human-truth.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
test('P791 independent ground truth shares exact native closet private-save catalog',()=>{
 const kinds=supportedHumanCategories791();
 assert.ok(Object.isFrozen(kinds));
 for(const c of localCandidates){
  if(c.category==='Uncategorized'||['Unknown','Other'].includes(c.itemType))continue;
  assert.equal(supportedHumanGarment791(c.category,c.itemType),true,c.label);
 }
 for(const types of Object.values(kinds))assert.ok(Object.isFrozen(types));
 assert.equal(kinds.Accessories.includes('Bag'),true);
 assert.equal(kinds.Accessories.includes('Hat'),true);
});
test('P791 Other, Unknown and free-form fabricated subtypes cannot be human acceptance truth',()=>{
 for(const [category,subtype] of [
  ['Dresses','Other'],['Tops','Unknown'],['Tops','Intergalactic blouse'],
  ['Outerwear','Jeans'],['Shoes','Jacket'],['Uncategorized','Unknown'],
  ['Random','Jeans']
 ]){
  assert.equal(supportedHumanGarment791(category,subtype),false);
  assert.throws(()=>enforceHumanGarment791(category,subtype),/specific subtype/);
 }
});
test('P791 one actual same-category valid source instance is structurally valid',()=>{
 const label={category:'Dresses',subtype:'Casual dress',primaryColor:'Black',
  instances:[{instanceId:'source-1',category:'Dresses',rle:[0,1,3]}]};
 assert.equal(verifySingleHumanTruth791(label),true);
});
test('P791 single label never hides two garments or a mismatched mask category',()=>{
 const a={category:'Dresses',subtype:'Casual dress',
  instances:[{instanceId:'a',category:'Dresses'},{instanceId:'b',category:'Dresses'}]};
 assert.throws(()=>verifySingleHumanTruth791(a),/EXACTLY one/);
 assert.throws(()=>verifySingleHumanTruth791({...a,instances:[{instanceId:'a',category:'Tops'}]}),/same-category/);
 assert.throws(()=>verifySingleHumanTruth791({...a,instances:[]}),/EXACTLY one/);
});
