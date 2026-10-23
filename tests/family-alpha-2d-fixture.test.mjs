import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {planPhotoLayers} from '../public/family-alpha-2d-layer-plan.mjs';
const fixture=readFileSync(new URL('../public/family-alpha-2d-fixture.mjs',import.meta.url),'utf8');
test('fixture covers five different synthetic garment silhouettes',()=>{for(const name of ['shirt','pants','shoes','dress','jacket'])assert.match(fixture,new RegExp(name+':'));});
test('fixture includes an outer layer in the everyday outfit',()=>assert.match(fixture,/garment\('layer','jacket'\)/));
test('planner orders outer layer above base top',()=>{const item=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic',sourceVersion:'v1'});assert.deepEqual(planPhotoLayers([item('layer','jacket'),item('top','shirt')]).map(x=>x.slot),['top','layer']);});
