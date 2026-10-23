import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeGarmentPreview} from '../../research/avatar/garment-preview-warp.mjs';
const garment={accountId:'fixture',originalSha256:'a'.repeat(64),width:2,height:1,pixels:new Uint8ClampedArray([250,0,0,255,0,0,250,255])};
const base={accountId:'fixture',garment,mask:new Uint8Array([255,255]),canvasWidth:2,canvasHeight:1,sourceBox:{x:0,y:0,width:2,height:1},targetBox:{x:0,y:0,width:2,height:1}};
test('identity geometry keeps licensed fixture pixels',()=>{
 const r=composeGarmentPreview(base);
 assert.deepEqual([...r.pixels],[...garment.pixels]);
 assert.equal(r.fitSimulation,false);
});
test('masked out region stays transparent',()=>{
 const r=composeGarmentPreview({...base,mask:new Uint8Array([255,0])});
 assert.equal(r.pixels[3],255);assert.equal(r.pixels[7],0);
});
test('scaling retains nonempty alpha and provenance',()=>{
 const r=composeGarmentPreview({...base,canvasWidth:4,targetBox:{x:0,y:0,width:4,height:1}});
 assert.equal(r.width,4);assert.equal(r.originalSha256,garment.originalSha256);
 assert.ok(r.pixels[3]>0);
});
test('rejects invalid geometry, oversize output, and account leakage',()=>{
 assert.throws(()=>composeGarmentPreview({...base,canvasWidth:5000,canvasHeight:5000}));
 assert.throws(()=>composeGarmentPreview({...base,sourceBox:{x:1,y:0,width:2,height:1}}));
 assert.throws(()=>composeGarmentPreview({...base,accountId:'other'}));
});
test('input source and mask remain immutable',()=>{
 const original=[...garment.pixels],mask=[...base.mask];
 composeGarmentPreview(base);
 assert.deepEqual([...garment.pixels],original);assert.deepEqual([...base.mask],mask);
});
