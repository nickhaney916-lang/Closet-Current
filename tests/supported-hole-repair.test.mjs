import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeSupportedHoleRepair} from '../benchmark/propose-supported-hole-repair.mjs';
import {decodeReferenceMask} from '../benchmark/garment-mask-metrics.mjs';
function prediction(rows){const mask=rows.join('').split('').map(Number),runs=[];let prev=0,count=0;for(const v of mask){if(v!==prev){runs.push(count);prev=v;count=0;}count++;}runs.push(count);return {width:rows[0].length,height:rows.length,image:'test.jpg',sourceSha256:'verified-source',runs};}
const base=()=>prediction(['0000000','0111110','0111110','0110110','0111110','0111110','0000000']);
const solid=()=>prediction(['0000000','0111110','0111110','0111110','0111110','0111110','0000000']);
test('restores a supported enclosed gap without removing existing foreground or mutating inputs',()=>{
 const b=base(),s=solid(),before=JSON.stringify([b,s]);const r=proposeSupportedHoleRepair(b,s,{maximumHoleFraction:.1});
 assert.equal(r.addedPixels,1);assert.equal(r.removedPixels,0);assert.equal(JSON.stringify([b,s]),before);
 assert.deepEqual(decodeReferenceMask(r.prediction),decodeReferenceMask(s));
 assert.equal(r.productionAuthorized,false);assert.equal(r.verifiedGarmentRecovery,false);assert.equal(r.verifiedShadowRemoval,false);
});
test('preserves unsupported real openings and rejects large proposed repairs',()=>{
 assert.equal(proposeSupportedHoleRepair(base(),base(),{maximumHoleFraction:.1}).addedPixels,0);
 assert.equal(proposeSupportedHoleRepair(base(),solid()).addedPixels,0);
});
test('never fills exterior gaps, including a diagonal passage',()=>{
 const b=prediction(['0000000','0011110','0101110','0110110','0111110','0111110','0000000']);
 assert.equal(proposeSupportedHoleRepair(b,solid(),{maximumHoleFraction:1}).addedPixels,0);
});
test('rejects mismatched sources, dimensions, malformed masks and invalid thresholds',()=>{
 assert.throws(()=>proposeSupportedHoleRepair(base(),{...solid(),sourceSha256:'other'}));
 assert.throws(()=>proposeSupportedHoleRepair(base(),{...solid(),width:6}));
 assert.throws(()=>proposeSupportedHoleRepair({...base(),runs:[1]},solid()));
 assert.throws(()=>proposeSupportedHoleRepair(base(),solid(),{minimumSupport:NaN}));
});
