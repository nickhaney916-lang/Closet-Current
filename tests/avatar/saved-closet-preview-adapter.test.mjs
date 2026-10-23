import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSavedOutfitItem,renderSavedOutfitPreview} from '../../research/avatar/saved-closet-preview-adapter.mjs';
const hash='f'.repeat(64),accountId='a';
const record={id:'item-1',accountId,originalSha256:hash,slot:'top'};
const original={itemId:'item-1',accountId,originalSha256:hash,width:1,height:1,pixels:new Uint8ClampedArray([14,120,240,255])};
const reviewedMask={itemId:'item-1',accountId,originalSha256:hash,reviewed:true,pixels:new Uint8Array([255])};
const item={record,original,reviewedMask};
const pose={leftShoulder:{x:10,y:5},rightShoulder:{x:30,y:5},leftHip:{x:13,y:25},rightHip:{x:27,y:25},leftAnkle:{x:14,y:55},rightAnkle:{x:26,y:55}};
test('saved item maps to original source pixels without mutation',()=>{
 const mapped=prepareSavedOutfitItem({accountId,...item});
 assert.equal(mapped.garment.pixels,original.pixels);
 assert.equal(mapped.mask,reviewedMask.pixels);
 assert.equal(mapped.slot,'top');
});
test('source changes invalidate cached garment previews',()=>{
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,original:{...original,originalSha256:'a'.repeat(64)}}));
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,reviewedMask:{...reviewedMask,originalSha256:'a'.repeat(64)}}));
});
test('reject cross-account and wrong-item photos',()=>{
 assert.throws(()=>prepareSavedOutfitItem({accountId:'b',...item}));
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,original:{...original,itemId:'item-2'}}));
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,reviewedMask:{...reviewedMask,accountId:'b'}}));
});
test('do not silently generate preview from unreviewed or missing masks',()=>{
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,reviewedMask:{...reviewedMask,reviewed:false}}));
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,reviewedMask:null}));
});
test('authorized original photo produces a transparent-background 2D preview',()=>{
 const out=renderSavedOutfitPreview({accountId,pose,canvasWidth:40,canvasHeight:60,savedItems:[item]});
 assert.deepEqual(out.sources,[{slot:'top',originalSha256:hash}]);
 assert.equal(out.fitSimulation,false);
 assert.ok(out.pixels.some(v=>v>0));
});

test('invisible original photos are blocked even when mask is present',()=>{
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,original:{...original,pixels:new Uint8ClampedArray([0,0,0,0])}}));
});
test('black clothing is a valid visible original and must not be rejected',()=>{
 const out=prepareSavedOutfitItem({accountId,...item,original:{...original,pixels:new Uint8ClampedArray([0,0,0,255])}});
 assert.equal(out.garment.pixels[3],255);
});
test('malformed original pixel length is rejected',()=>{
 assert.throws(()=>prepareSavedOutfitItem({accountId,...item,original:{...original,pixels:new Uint8ClampedArray([1,2,3])}}));
});

test('reject zero, fractional, and oversized original dimensions before processing',()=>{
 for(const [width,height] of [[0,1],[1.5,1],[10000,10000]]){
  assert.throws(()=>prepareSavedOutfitItem({accountId,...item,original:{...original,width,height}}),/Invalid original photo dimensions/);
 }
});

test('missing and malformed matching hashes cannot bypass original photo identity validation',()=>{
 for(const bad of [undefined,'', 'not-a-sha256']){
  assert.throws(()=>prepareSavedOutfitItem({accountId,...item,record:{...record,originalSha256:bad},original:{...original,originalSha256:bad},reviewedMask:{...reviewedMask,originalSha256:bad}}),/Missing valid original integrity hash/);
 }
});
