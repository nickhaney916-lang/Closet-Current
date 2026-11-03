import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralCuffStack22} from '../research/denim-fit-06/source-neutral-cuff-stack-22.mjs';
test('P22 single diagonal cuff stack uses actual leg orientation and true original hem widths',()=>{
 for(const side of [0,1])for(const ratio of [.86,1.28]){
  assert.equal(sourceNeutralCuffStack22(0,1,0,ratio,side).outwardMeters,0);
  assert.equal(sourceNeutralCuffStack22(1,1,0,ratio,side).outwardMeters,0);
  for(let i=0;i<=100;i++){
   const v=sourceNeutralCuffStack22(i/100,0,-1,ratio,side);
   assert.ok(v.outwardMeters>=0&&v.outwardMeters<=.009157);
   assert.equal(v.modeledUnphotographedFold,true);
  }
 }
 const taper=sourceNeutralCuffStack22(.32,0,-1,.86,0).outwardMeters;
 const wide=sourceNeutralCuffStack22(.32,0,-1,1.28,0).outwardMeters;
 assert.ok(taper>wide&&wide>.004);
 const outer=sourceNeutralCuffStack22(.32,.8,-.6,.86,0).outwardMeters;
 const inner=sourceNeutralCuffStack22(.32,-.8,-.6,.86,0).outwardMeters;
 assert.notEqual(outer,inner,'circumferential true-bone diagonal orientation matters');
});
test('P22 invalid phase, original photo width or non-unit anatomical direction fails closed',()=>{
 for(const args of [[NaN,0,-1,1,0],[-.01,0,-1,1,0],[1.01,0,-1,1,0],
  [.3,0,0,1,0],[.3,NaN,-1,1,0],[.3,0,-1,NaN,0],
  [.3,0,-1,.2,0],[.3,0,-1,3,0],[.3,0,-1,1,2]])
  assert.throws(()=>sourceNeutralCuffStack22(...args),/P22 requires/);
});
test('P22 default OFF and exact P21 original-source ancestry protects front/skin',()=>{
 const fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 const app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 for(const tag of ['sourceCuffStack22=false','sourceCuffStack22&&!sourceKneeBreak21',
  'sourceNeutralCuffStack22','sourceCuffStackMovedVertices22',
  'sourceCuffStackMaxMeters22','originalJPEGUVRestSkinProtected22:true',
  'modeledCuffStackNotPhotographed22:true','sourceUVRestAndSkinByteIdentical:true'])
  assert.ok(fit.includes(tag),'missing '+tag);
 assert.ok(app.includes("get('denimStack22')==='after'"));
 assert.ok(app.includes('sourceDenimCuffStack22Enabled'));
});
