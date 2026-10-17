import test from 'node:test';import assert from 'node:assert/strict';import {footwearShadowCandidates,footwearLowerSilhouetteProfile} from '../benchmark/footwear-shadow-candidates.mjs';
test('flags sparse lower foreground rows but does not remove pixels',()=>{const p={width:10,height:4,runs:[10,10,10,1,9]};const before=JSON.stringify(p),r=footwearShadowCandidates(p,{bottomFraction:1});assert.equal(r.candidatePixels,1);assert.equal(r.reviewOnly,true);assert.equal(JSON.stringify(p),before);});
test('rejects invalid fraction',()=>assert.throws(()=>footwearShadowCandidates({width:1,height:1,runs:[1]},{bottomFraction:0}),/Invalid/));

function encode(bits){const runs=[];let previous=0,count=0;for(const bit of bits){if(bit!==previous){runs.push(count);count=0;previous=bit}count++}runs.push(count);return runs;}
test('flags abrupt lower silhouette changes in image-relative units without altering the prediction',()=>{
 const width=20,height=4,bits=new Uint8Array(width*height);
 for(let x=0;x<20;x++)bits[width*2+x]=1;
 for(let x=0;x<2;x++)bits[width*3+x]=1;
 const prediction={width,height,runs:encode(bits)},before=JSON.stringify(prediction);
 const result=footwearLowerSilhouetteProfile(prediction,{bottomFraction:.5});
 assert.equal(result.shifts.length,1);
 assert.equal(result.shifts[0].spanChange,-18);
 assert.equal(result.shifts[0].spanChangeFraction,-.9);
 assert.equal(result.abruptRows.length,1);
 assert.equal(result.abruptRows[0].y,3);
 assert.equal(result.reviewOnly,true);
 assert.equal(result.removedPixels,0);
 assert.equal(JSON.stringify(prediction),before);
});
test('never compares separated rows as continuous silhouette motion',()=>{
 const width=10,height=5,bits=new Uint8Array(width*height);
 bits[0]=1;bits[width*4+9]=1;
 const result=footwearLowerSilhouetteProfile({width,height,runs:encode(bits)},{bottomFraction:1});
 assert.equal(result.rows.length,2);
 assert.equal(result.shifts.length,0);
 assert.equal(result.abruptRows.length,0);
});
test('a steady solid lower silhouette produces no abrupt-row flags',()=>{
 const width=20,height=4,bits=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=3;x<14;x++)bits[y*width+x]=1;
 const result=footwearLowerSilhouetteProfile({width,height,runs:encode(bits)});
 assert.equal(result.abruptRows.length,0);
 assert.equal(result.removedPixels,0);
});
