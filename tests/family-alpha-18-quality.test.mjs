import test from 'node:test';
import assert from 'node:assert/strict';
import {qualityMatrix} from '../research/family-alpha-18/quality-matrix.mjs';
const rows=qualityMatrix();
test('family-alpha-18: 99 garment/background cases preserve every original',()=>{
 assert.equal(rows.length,99);assert.ok(rows.every(x=>x.originalUnchanged));
 assert.ok(rows.every(x=>x.recognitionMeasured===false&&x.humanApproval===false));
});
for(const mode of ['plain','wrinkled'])test('family-alpha-18: all eleven '+mode+' silhouettes prepare separate derivatives',()=>{
 const cases=rows.filter(x=>x.mode===mode);assert.equal(cases.length,11);
 for(const row of cases)assert.equal(row.status,'prepared',JSON.stringify(row));
});
for(const mode of ['busy','clipped','blank','white','dark','shadow'])test('family-alpha-18: '+mode+' scenes require review without fabricated derivative',()=>{
 for(const row of rows.filter(x=>x.mode===mode)){
  assert.equal(row.status,'review',JSON.stringify(row));assert.equal(row.hasDerivative,false);
 }
});
test('family-alpha-18: blur observations are not certified segmentation or recognition',()=>{
 assert.equal(rows.filter(x=>x.mode==='blurry').length,11);
 // Deliberately report admission instead of inventing a perfect blur gate.
 assert.ok(rows.filter(x=>x.mode==='blurry').every(x=>['review','prepared'].includes(x.status)));
});
