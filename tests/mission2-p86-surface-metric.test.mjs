import test from 'node:test';import assert from 'node:assert/strict';
import {measurePrincipalStretch86 as measure} from '../research/mission2-p86/surface-metric.mjs';
const original=new Float32Array([0,0,0,1,0,0,0,1,0]),uv=new Float32Array([0,0,1,0,0,1]);
const go=candidate=>measure({original,candidate,indices:new Uint16Array([0,1,2]),originalUV:uv,candidateUV:uv.slice()});
test('rigid rotation leaves source texel metric unchanged',()=>{
 const r=go(new Float32Array([3,2,1,3,3,1,2,2,1]));
 assert.equal(r.provisionalTextureMetricPassed,true);assert.equal(r.maxPrincipalStretch,1);
});
test('shear with unchanged UV reveals principal stretch and anisotropy',()=>{
 const r=go(new Float32Array([0,0,0,1,0,0,.2,1,0]));
 assert.ok(r.maxPrincipalStretch>1.10);assert.ok(r.minPrincipalStretch<.91);
 assert.equal(r.sourceUVBytesPreserved,true);assert.equal(r.provisionalTextureMetricPassed,false);
});
test('uniform scale reports analytic principal factors',()=>{
 const r=go(original.map(x=>x*1.2));assert.ok(Math.abs(r.maxPrincipalStretch-1.2)<1e-6);
 assert.ok(Math.abs(r.minPrincipalStretch-1.2)<1e-6);assert.equal(r.trianglesOver5PercentPrincipalStrain,1);
});
test('collapsed triangle and UV alteration fail closed',()=>{
 assert.equal(go(new Float32Array(9)).provisionalTextureMetricPassed,false);
 const changed=uv.slice();changed[1]=.1;
 const r=measure({original,candidate:original,indices:new Uint16Array([0,1,2]),originalUV:uv,candidateUV:changed});
 assert.equal(r.sourceUVBytesPreserved,false);assert.equal(r.provisionalTextureMetricPassed,false);
});
test('invalid indices and nonfinite UV rejected',()=>{
 assert.throws(()=>measure({original,candidate:original,indices:new Uint16Array([0,1,3]),originalUV:uv,candidateUV:uv}));
 const bad=uv.slice();bad[0]=NaN;
 assert.throws(()=>measure({original,candidate:original,indices:new Uint16Array([0,1,2]),originalUV:bad,candidateUV:uv}));
});
test('source projection without UV still reports geometry, never texture acceptance',()=>{
 const r=measure({original,candidate:original,indices:new Uint16Array([0,1,2])});
 assert.equal(r.maxPrincipalStretch,1);assert.equal(r.sourceUVBytesPreserved,null);
 assert.equal(r.provisionalTextureMetricPassed,false);assert.equal(r.photoProjectionMeasured,false);
});
