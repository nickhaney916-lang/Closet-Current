import test from 'node:test';import assert from 'node:assert/strict';import {planPhotoLayers} from '../public/family-alpha-2d-layer-plan.mjs';
const garment=(slot,id)=>({slot,itemId:id,sourceIdentity:'synthetic-original',sourceVersion:'sha256-test'});
test('orders multiple garment layers deterministically',()=>{const p=planPhotoLayers([garment('layer','j'),garment('top','t'),garment('bottom','b'),garment('shoes','s')]);assert.deepEqual(p.map(x=>x.slot),['shoes','bottom','top','layer']);});
test('rejects dress conflicts',()=>assert.throws(()=>planPhotoLayers([garment('dress','d'),garment('bottom','b')])));
test('rejects duplicates and missing source provenance',()=>{assert.throws(()=>planPhotoLayers([garment('top','a'),garment('layer','a')]));assert.throws(()=>planPhotoLayers([{slot:'top',itemId:'x'}]));});
test('does not embed any photo URL or data',()=>{const p=planPhotoLayers([{...garment('top','t'),url:'private-photo-url'}]);assert.equal(JSON.stringify(p).includes('private-photo-url'),false);});
