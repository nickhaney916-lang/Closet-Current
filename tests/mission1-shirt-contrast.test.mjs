import test from 'node:test';
import assert from 'node:assert/strict';
import {localCandidates} from '../public/local-catalog.mjs';
import {contrastCatalog,restoreCanonicalScores} from '../research/mission1-shirt-contrast/candidate.mjs';
test('shirt contrast changes exactly two prompts and preserves taxonomy',()=>{
 const next=contrastCatalog(localCandidates);
 assert.equal(next.length,localCandidates.length);
 assert.deepEqual(next.filter((c,i)=>c.label!==localCandidates[i].label).map(c=>c.itemType),['T-shirt','Sweatshirt']);
 assert.deepEqual(next.map(({label,...c})=>c),localCandidates.map(({label,...c})=>c));
 assert.equal(new Set(next.map(c=>c.label)).size,next.length);
 assert.deepEqual(restoreCanonicalScores(next.map(c=>({label:c.label,score:0.2}))),localCandidates.map(c=>({label:c.label,score:0.2})));
});
