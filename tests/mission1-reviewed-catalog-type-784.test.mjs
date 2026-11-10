import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {localCandidates} from '../public/local-catalog.mjs';

// P784 asserts the immutable native P119 subtype contract. This test is a
// catalog consistency check, NOT a claim of model accuracy or human review.
const taxonomy=readFileSync(new URL('../public/taxonomy.js',import.meta.url),'utf8');
const schema=runInNewContext(taxonomy+'\nclothingSchema;');
for(const [category,types] of Object.entries(schema.types)){
 test('native reviewed '+category+' supported specific subtype choices match the save catalog',()=>{
  const candidates=localCandidates.filter(x=>x.category===category).map(x=>x.itemType);
  const shown=types.filter(type=>type!=='Other');
  assert.deepEqual([...shown].sort(),[...candidates].sort());
  assert.equal(shown.includes('Other'),false);
  assert.equal(shown.includes('Unknown'),false);
  assert.equal(new Set(candidates).size,candidates.length);
 });
}
test('Unknown and Other are never valid native owner-reviewed specific types',()=>{
 assert.ok(!localCandidates.some(x=>x.category==='Dresses'&&['Unknown','Other'].includes(x.itemType)));
 assert.ok(localCandidates.some(x=>x.category==='Dresses'&&x.itemType==='Casual dress'));
});
