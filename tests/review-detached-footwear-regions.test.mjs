import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewDetachedFootwearRegions} from '../benchmark/review-detached-footwear-regions.mjs';
function encode(bits){const runs=[];let prev=0,count=0;for(const bit of bits){if(bit!==prev){runs.push(count);count=0;prev=bit;}count++;}runs.push(count);return runs;}
test('flags a detached lower background candidate without changing the image mask',()=>{
 const mask=new Uint8Array(100);
 for(let y=1;y<=4;y++)for(let x=2;x<=6;x++)mask[y*10+x]=1;
 mask[98]=1;
 const input={width:10,height:10,runs:encode(mask)},before=JSON.stringify(input);
 const result=reviewDetachedFootwearRegions(input,{maxFraction:.02});
 assert.equal(result.candidates.length,1);
 assert.deepEqual(result.candidates[0].bounds,{minX:8,minY:9,maxX:8,maxY:9});
 assert.equal(result.candidatePixels,1);
 assert.equal(result.removedPixels,0);
 assert.equal(result.reviewOnly,true);
 assert.equal(JSON.stringify(input),before);
});
test('does not flag an upper small object or a substantial lower garment piece',()=>{
 const mask=new Uint8Array(100);mask[0]=1;
 for(let y=7;y<=9;y++)for(let x=3;x<=7;x++)mask[y*10+x]=1;
 const result=reviewDetachedFootwearRegions({width:10,height:10,runs:encode(mask)},{maxFraction:.03});
 assert.equal(result.candidates.length,0);
});
test('fails closed for invalid geometry and options',()=>{
 const mask={width:2,height:2,runs:[0,4]};
 assert.throws(()=>reviewDetachedFootwearRegions(mask,{bottomFraction:0}),/Invalid/);
 assert.throws(()=>reviewDetachedFootwearRegions(mask,{maxFraction:NaN}),/Invalid/);
});
