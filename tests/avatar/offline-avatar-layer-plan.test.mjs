import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planAvatarLayers} from '../../research/avatar/offline-avatar-layer-plan.mjs';
const hash='a'.repeat(64);
const item=(slot, accountId='pilot')=>({accountId,sourceId:slot,sourceSha256:hash,isOriginal:true,hasUsablePhoto:true});
test('separates preserve deterministic overlay order',()=>{
 const p=planAvatarLayers({accountId:'pilot',garments:{jacket:item('jacket'),top:item('top'),shoes:item('shoes')}});
 assert.deepEqual(p.layers.map(x=>x.slot),['shoes','top','jacket']);
});
test('dress rejects incompatible layers',()=>{
 assert.throws(()=>planAvatarLayers({accountId:'pilot',garments:{dress:item('dress'),bottom:item('bottom')}}));
});
test('dress and shoes render together',()=>{
 assert.deepEqual(planAvatarLayers({accountId:'pilot',garments:{dress:item('dress'),shoes:item('shoes')}}).layers.map(x=>x.slot),['shoes','dress']);
});
test('cross-account source fails closed',()=>{
 assert.throws(()=>planAvatarLayers({accountId:'pilot',garments:{top:item('top','other')}}));
});
test('cropped preview is not a valid original',()=>{
 assert.throws(()=>planAvatarLayers({accountId:'pilot',garments:{top:{...item('top'),isOriginal:false}}}));
});
test('blank photo and invalid hash fail closed',()=>{
 assert.throws(()=>planAvatarLayers({accountId:'pilot',garments:{top:{...item('top'),hasUsablePhoto:false}}}));
 assert.throws(()=>planAvatarLayers({accountId:'pilot',garments:{top:{...item('top'),sourceSha256:'bad'}}}));
});
test('unrecognized slot fails closed',()=>{
 assert.throws(()=>planAvatarLayers({accountId:'pilot',garments:{accessory:item('accessory')}}));
});
