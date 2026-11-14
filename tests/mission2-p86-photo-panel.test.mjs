import test from 'node:test';import assert from 'node:assert/strict';
import {buildObservedPhotoPanel86 as build} from '../research/mission2-p86/photo-panel.mjs';
const args={width:3,height:3,alpha:new Uint8Array([0,255,0,255,255,255,255,0,255]),sourceSHA256:'a'.repeat(64),maskSHA256:'b'.repeat(64)};
test('observed mask topology preserves sleeves and separate legs without invented back',()=>{
 const p=build(args);assert.equal(p.receipt.foregroundPixels,6);assert.equal(p.receipt.triangles,12);
 assert.equal(p.receipt.fittedGarment,false);assert.equal(p.receipt.hiddenSurface,'UNOBSERVED');
 let area=0;for(let i=0;i<p.indices.length;i+=3){const [a,b,c]=p.indices.slice(i,i+3);
 const x=p.positions;const z=(x[b*3]-x[a*3])*(x[c*3+1]-x[a*3+1])-(x[b*3+1]-x[a*3+1])*(x[c*3]-x[a*3]);
 assert.ok(z>0);area+=z/2;}
 assert.ok(Math.abs(area-6/9)<1e-6);
});
test('reject empty, full-frame and unbounded or unbound masks',()=>{
 for(const alpha of [new Uint8Array(9),new Uint8Array(9).fill(255)])assert.throws(()=>build({...args,alpha}));
 assert.throws(()=>build({...args,sourceSHA256:'bad'}));assert.throws(()=>build({...args,width:300}));
});
