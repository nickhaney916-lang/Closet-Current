import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DENIM_SEAM_FLOW28,sourceNeutralSideSeamFlow28 as flow}
 from '../research/denim-fit-06/source-neutral-side-seam-flow-28.mjs';
test('P28 verified 163-bone side-seam return is smooth, bounded and zero at hip/knee',()=>{
 for(const side of [0,1])for(const lat of [0,.018,.07,.115,.29]){
  for(let i=0;i<=1000;i++){
   const x=i/1000,v=flow(x,side,lat);
   assert.ok(Number.isFinite(v.lateralMeters)&&Number.isFinite(v.rearReleaseMeters));
   assert.ok(v.lateralMeters>=0&&v.lateralMeters<=.0085001);
   assert.ok(v.rearReleaseMeters>=0&&v.rearReleaseMeters<=.0044001);
   assert.equal(v.modelledNotPhotographed,true);
   if(x<=.12||x>=.90)assert.equal(v.lateralMeters,0);
  }
 }
 assert.ok(flow(.51,0,.12).lateralMeters>.007);
 assert.ok(flow(.51,0,.12).rearReleaseMeters>.003);
 assert.equal(DENIM_SEAM_FLOW28.originalJPEGCutoutSHAUnmodified,true);
 assert.equal(DENIM_SEAM_FLOW28.releaseAuthorized,false);
});
test('P28 rejects unsupported body landmarks and invented lateral length',()=>{
 for(const v of [NaN,Infinity,-.01,1.01,'0.5',null])
  assert.throws(()=>flow(v,0,.05),/P28 requires/);
 for(const v of [-1,2,.7,NaN,null,'1'])
  assert.throws(()=>flow(.5,v,.05),/P28 requires/);
 for(const v of [-1,.31,Infinity,NaN,'0.05',null])
  assert.throws(()=>flow(.5,0,v),/P28 requires/);
});
test('P28 guarded real source-neutral 163-bone fitter and default-off flag',()=>{
 const source=readFileSync('research/denim-fit-06/source-neutral-side-seam-flow-28.mjs','utf8');
 const fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 const ctrl=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8');
 const demo=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 const showroom=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8');
 assert.ok(fit.includes('sourceNeutralSideSeamFlow28'));
 assert.ok(fit.includes('sourceSideSeamFlow28&&(!sourceHipKneeHang26||!sourceCuffStack22)'));
 assert.ok(fit.includes('photographed front denim vertex changed'));
 assert.ok(fit.includes('DENIM_SEAM_FLOW28.maxTotalLocalShiftMeters'));
 assert.ok(ctrl.includes('sourceSideSeamFlow28:sourceDenimFlow28'));
 assert.ok(showroom.includes('sourceDenimFlow28'));
 assert.ok(demo.includes("get('denimFlow28')==='after'"));
 for(const bad of ['new Image','texture2D','fetch(','Math.random','new THREE.Mesh'])
  assert.ok(!source.includes(bad),'P28 cannot fabricate source photograph or mesh');
});
