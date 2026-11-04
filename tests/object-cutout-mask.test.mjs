import test from 'node:test';
import assert from 'node:assert/strict';
import {alphaPrediction,compareCutoutMasks,sharpSourceCutout} from '../benchmark/object-cutout-mask.mjs';
import {decodeReferenceMask} from '../benchmark/garment-mask-metrics.mjs';
const meta={width:3,height:2,image:'fixture.jpg',sourceSha256:'verified-source'};
test('threshold 128 preserves sharp alpha and round-trips foreground-first masks',()=>{
 const p=alphaPrediction([255,127,128,0,129,64],meta);
 assert.deepEqual([...decodeReferenceMask(p)],[1,0,1,0,1,0]);assert.equal(p.foregroundPixels,3);
 const rgb=Uint8Array.from({length:18},(_,i)=>i*7),before=rgb.slice(),rgba=sharpSourceCutout(rgb,p);
 for(let i=0;i<6;i++){assert.deepEqual([...rgba.slice(4*i,4*i+3)],[...rgb.slice(3*i,3*i+3)]);assert.ok([0,255].includes(rgba[4*i+3]));}
 assert.deepEqual(rgb,before);
});
test('reports additions and removals separately without claiming shadow accuracy',()=>{
 const a=alphaPrediction([255,255,0,0,255,0],meta),b=alphaPrediction([255,0,255,0,255,0],meta);
 const r=compareCutoutMasks(a,b);assert.equal(r.addedPixels,1);assert.equal(r.removedPixels,1);assert.equal(r.sharedPixels,2);assert.equal(r.notAccuracy,true);assert.equal(r.verifiedShadowRemoval,false);
 assert.throws(()=>compareCutoutMasks(a,{...b,sourceSha256:'other'}));
});
test('rejects truncated, non-byte alpha and invalid RGB data',()=>{
 assert.throws(()=>alphaPrediction([128],meta));assert.throws(()=>alphaPrediction([0,0,0,0,0,NaN],meta));assert.throws(()=>alphaPrediction([0,0,0,0,0,256],meta));
 assert.throws(()=>alphaPrediction([0,0,0,0,0,0],meta,0));assert.throws(()=>sharpSourceCutout(new Uint8Array(5),alphaPrediction([0,0,0,0,0,0],meta)));
});

test('224 alpha mask is a true subset of 128 generated from native 8-bit data',()=>{
 const original=[0,127,128,191,192,223,224,255];
 const m={width:4,height:2,image:'source.jpg',sourceSha256:'a'.repeat(64)};
 const standard=alphaPrediction(original,m,128),strict=alphaPrediction(original,m,224);
 assert.equal(standard.foregroundThreshold,128);
 assert.equal(strict.foregroundThreshold,224);
 assert.deepEqual([...decodeReferenceMask(standard)],[0,0,1,1,1,1,1,1]);
 assert.deepEqual([...decodeReferenceMask(strict)],[0,0,0,0,0,0,1,1]);
 const diff=compareCutoutMasks(standard,strict);
 assert.equal(diff.addedPixels,0);
 assert.equal(diff.removedPixels,4);
 assert.equal(diff.sharedPixels,2);
 assert.equal(diff.notAccuracy,true);
});
