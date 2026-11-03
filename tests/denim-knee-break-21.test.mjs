import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralKneeBreak21} from '../research/denim-fit-06/source-neutral-knee-break-21.mjs';
const taper=[1.12,1.09,1.05,.98,.92],wide=[.94,.96,1.02,1.10,1.18];
test('P21 has one smoothly tapered calf tuck and one knee fold, zero at protected anchors',()=>{
 for(const p of [taper,wide])for(const s of [0,1]){
  assert.equal(sourceNeutralKneeBreak21(0,p,s).radialMeters,0);
  assert.equal(sourceNeutralKneeBreak21(1,p,s).radialMeters,0);
  const tuck=sourceNeutralKneeBreak21(.39,p,s),knee=sourceNeutralKneeBreak21(.72,p,s);
  assert.ok(tuck.radialMeters<-.003&&tuck.radialMeters>=-.00426);
  assert.ok(knee.radialMeters>.0035&&knee.radialMeters<=.0054001);
  assert.equal(tuck.modeledUnphotographedFold,true);
  for(let i=0;i<=100;i++){
   const v=sourceNeutralKneeBreak21(i/100,p,s).radialMeters;
   assert.ok(Number.isFinite(v)&&Math.abs(v)<=.0054001);
  }
 }
 assert.notEqual(sourceNeutralKneeBreak21(.39,taper,0).radialMeters,
  sourceNeutralKneeBreak21(.39,wide,0).radialMeters);
});
test('P21 rejects non-original width and invalid anatomy/side inputs',()=>{
 for(const args of [[-0.1,taper,0],[1.1,taper,0],[NaN,taper,0],
   [.5,taper,2],[.5,[1],0],[.5,[1,1,NaN,1,1],0],[.5,[0,1,1,1,1],0]])
  assert.throws(()=>sourceNeutralKneeBreak21(...args),/P21 requires/);
});
test('P21 default-off and strictly demands original photographed P20 ancestry',()=>{
 const fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 const app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 for(const v of ['sourceKneeBreak21=false','sourceKneeBreak21&&!sourceAnatomicalLine20',
  'sourceNeutralKneeBreak21','sourceKneeBreakMovedVertices21',
  'sourceKneeBreakMaxMeters21','originalJPEGUVRestSkinProtected21:true',
  'rearFoldIsModeledNotPhotographed21:true','sourceUVRestAndSkinByteIdentical:true'])
  assert.ok(fit.includes(v),'missing '+v);
 assert.ok(app.includes("get('denimFold21')==='after'"));
 assert.ok(app.includes('sourceDenimFold21Enabled'));
});
