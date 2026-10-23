import test from 'node:test';import assert from 'node:assert/strict';import {buildAlpha2DSelections} from '../public/family-alpha-2d-outfit-bridge.mjs';import {planPhotoLayers} from '../public/family-alpha-2d-layer-plan.mjs';
const g=id=>({itemId:id,sourceIdentity:'synthetic-original-'+id,sourceVersion:'sha256-synthetic'});
test('converts saved outfit references into stable 2D slots',()=>{const s=buildAlpha2DSelections({top:'t',bottom:'b',shoes:'s'},{t:g('t'),b:g('b'),s:g('s')});assert.deepEqual(planPhotoLayers(s).map(x=>x.slot),['shoes','bottom','top']);});
test('fails closed for missing garment and missing original photo identity',()=>{assert.throws(()=>buildAlpha2DSelections({top:'other'},{t:g('t')}));assert.throws(()=>buildAlpha2DSelections({top:'t'},{t:{itemId:'t',sourceVersion:'v1'}}));});
test('dress conflicts still rejected by planner',()=>{const s=buildAlpha2DSelections({dress:'d',top:'t'},{d:g('d'),t:g('t')});assert.throws(()=>planPhotoLayers(s));});
test('does not leak extra image URL properties',()=>{const s=buildAlpha2DSelections({top:'t'},{t:{...g('t'),url:'private-image'}});assert.equal(JSON.stringify(s).includes('private-image'),false);});
