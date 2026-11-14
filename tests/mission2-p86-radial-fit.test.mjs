import test from 'node:test';import assert from 'node:assert/strict';
import {screenRadialFit86,RADIAL_SCALES86} from '../research/mission2-p86/radial-fit.mjs';
const original=()=>new Float32Array([.2,.1,.1,.3,.1,.1,.2,.2,.1]);
test('uniform radial factors have bounded analytic strain; complete collision evaluation still required',()=>{
 const source=original(),copy=source.slice();let calls=0;
 const r=screenRadialFit86({original:source,spine:[0,0,0],evaluate:()=>{calls++;return {bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:0};}});
 assert.equal(calls,4);assert.deepEqual(source,copy);assert.equal(r.anySampledNumericalClearance,true);
 assert.deepEqual(r.rows.map(x=>x.scale),RADIAL_SCALES86);
 for(const row of r.rows){assert.ok(row.principal.maxPrincipalStretch<1.05);assert.equal(row.principal.trianglesOver5PercentPrincipalStrain,0);assert.equal(row.candidateRendered,false);}
 assert.equal(r.consumer3DAdmitted,false);assert.equal(r.textureProjectionVerified,false);
});
test('crossings, incomplete evidence, malformed counts and mutation cannot produce approval',()=>{
 for(const contact of [{bodyComplete:true,selfComplete:true,bodyStrict:1,selfStrict:0},{bodyComplete:false,selfComplete:true,bodyStrict:0,selfStrict:0}]){
  const r=screenRadialFit86({original:original(),spine:[0,0,0],evaluate:()=>contact});assert.equal(r.anySampledNumericalClearance,false);
 }
 assert.throws(()=>screenRadialFit86({original:original(),spine:[0,0,0],evaluate:()=>({bodyComplete:true,selfComplete:true,bodyStrict:-1,selfStrict:0})}));
 const source=original();assert.throws(()=>screenRadialFit86({original:source,spine:[0,0,0],evaluate:()=>{source[0]=999;return {bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:0};}}),/source changed/);
});
