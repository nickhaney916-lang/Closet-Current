import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isolateLicensedGarment,transferPreviewFrame} from '../../research/avatar/licensed-garment-transfer.mjs';
const sha='f'.repeat(64);
const original=new Uint8ClampedArray([200,25,50,255,20,150,240,255]);
const garment={accountId:'test-account',originalSha256:sha,width:2,height:1,pixels:original};
test('reviewed mask preserves RGB fabric pixels and original source bytes',()=>{
 const mask=new Uint8Array([255,0]);
 const out=isolateLicensedGarment({accountId:'test-account',garment,mask});
 assert.deepEqual([...out.pixels],[200,25,50,255,20,150,240,0]);
 assert.deepEqual([...original],[200,25,50,255,20,150,240,255]);
});
test('partial alpha mask is deterministic',()=>{
 const out=isolateLicensedGarment({accountId:'test-account',garment,mask:new Uint8Array([128,255])});
 assert.equal(out.pixels[3],128);assert.equal(out.pixels[7],255);
});
test('account isolation is enforced',()=>{
 assert.throws(()=>isolateLicensedGarment({accountId:'another',garment,mask:new Uint8Array([255,255])}));
});
test('missing or malformed source is rejected',()=>{
 assert.throws(()=>isolateLicensedGarment({accountId:'test-account',garment:{...garment,originalSha256:'bad'},mask:new Uint8Array([255,255])}));
});
test('wrong-resolution mask and empty mask are rejected',()=>{
 assert.throws(()=>isolateLicensedGarment({accountId:'test-account',garment,mask:new Uint8Array([255])}));
 assert.throws(()=>isolateLicensedGarment({accountId:'test-account',garment,mask:new Uint8Array([0,0])}));
});
test('preview is explicitly not a fit simulation',()=>{
 const out=transferPreviewFrame({accountId:'test-account',garment,mask:new Uint8Array([255,255])});
 assert.equal(out.fitSimulation,false);assert.equal(out.placement,'preview-only');
});
