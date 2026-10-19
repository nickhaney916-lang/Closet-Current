import test from 'node:test';import assert from 'node:assert/strict';import {maskComponents} from '../benchmark/mask-components.mjs';
test('fragment analysis reports islands but never removes any predicted garment pixel',()=>{
 const p={width:5,height:3,runs:[0,2,4,2,2,1,4]};
 // Decoded foreground islands: first two at row 0, next two at row 1, last at row 2.
 const before=JSON.stringify(p),result=maskComponents(p);
 assert.ok(result.count>=1);assert.equal(JSON.stringify(p),before);
 const total=result.components.reduce((s,c)=>s+c.pixels,0);
 assert.equal(total,5);
});
test('fully empty model mask has no fragments',()=>{
 assert.deepEqual(maskComponents({width:2,height:2,runs:[4]}),{count:0,components:[],smallComponents:0,detachedPixels:0});
});
