import test from 'node:test';
import assert from 'node:assert/strict';
import {photographedLowerGarmentPixelWitness10} from '../research/denim-fit-06/garment-pixel-witness-10.mjs';
const frame=()=>({info:{width:120,height:240,channels:3},data:new Uint8Array(120*240*3)});
test('F10 original denims cannot pass visual realism from a screenshot top-border pixel row',()=>{
 const a=frame(),b=frame();
 for(let x=0;x<120;x++)b.data[x*3]=255; // fake entire bright top strip
 assert.equal(photographedLowerGarmentPixelWitness10(a,b).changedGarmentPixels,0);
 for(let y=140;y<150;y++)for(let x=40;x<44;x++)b.data[(y*120+x)*3]=255;
 const proof=photographedLowerGarmentPixelWitness10(a,b);
 assert.equal(proof.changedGarmentPixels,40);
 assert.equal(proof.topRowExcluded,true);
 assert.equal(proof.rowStart,120);
 assert.equal(proof.rowEnd,228);
 assert.equal(proof.releaseAuthorized,false);
 assert.throws(()=>photographedLowerGarmentPixelWitness10(a,{}),/Exact paired browser RGB/);
});
