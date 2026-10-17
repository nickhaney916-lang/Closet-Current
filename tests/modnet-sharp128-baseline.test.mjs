import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const decision=JSON.parse(await readFile('benchmark/modnet-sharp128-baseline-decision.json','utf8'));
test('visual benchmark baseline is sharp MODNet at threshold 128',()=>{
 assert.equal(decision.selectedBaseline.model,'Xenova/modnet');
 assert.equal(decision.selectedBaseline.foregroundThreshold,128);
 assert.equal(decision.selectedBaseline.alpha,'hard');
 assert.equal(decision.productionChanged,false);
});
test('unverified shadow cleanup cannot become the default',()=>{
 assert.ok(decision.unresolved.includes('cast shadow attached to garments'));
 assert.ok(decision.rules.some(x=>x.includes('Do not remove candidate pixels')));
 assert.ok(decision.rules.some(x=>x.includes('Do not deploy')));
});
