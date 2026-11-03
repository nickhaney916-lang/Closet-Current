import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DENIM_ANATOMICAL_HANG26,sourceNeutralHipKneeHang26}
 from '../research/denim-fit-06/source-neutral-hip-knee-hang-26.mjs';

test('P26 hip/knee model is finite and source-limited, zero at protected anchors',()=>{
 for(const side of [0,1]){
  for(const phase of [0,.01,.12,.89,.99,1]){
   const v=sourceNeutralHipKneeHang26(phase,side);
   assert.deepEqual({rear:v.rearMeters,side:v.sideMeters,drop:v.dropMeters},
    {rear:0,side:0,drop:0});
  }
  const middle=sourceNeutralHipKneeHang26(.47,side);
  assert.ok(middle.rearMeters>=.003);
  assert.ok(middle.rearMeters<=DENIM_ANATOMICAL_HANG26.maxRearMeters);
  assert.ok(middle.sideMeters<=DENIM_ANATOMICAL_HANG26.maxSideMeters);
  assert.ok(middle.dropMeters<=DENIM_ANATOMICAL_HANG26.maxVerticalMeters);
 }
 for(let t=0;t<=1000;t++){
  const phase=t/1000;
  for(const side of [0,1]){
   const x=sourceNeutralHipKneeHang26(phase,side);
   assert.ok(x.rearMeters>=0&&x.sideMeters>=0&&x.dropMeters>=0);
   assert.ok(x.rearMeters<=.0042+1e-9&&x.sideMeters<=.0012+1e-9&&x.dropMeters<=.0022+1e-9);
   assert.equal(x.modeledUnphotographed,true);
  }
 }
 assert.equal(DENIM_ANATOMICAL_HANG26.frontPhotographUnmodified,true);
 assert.equal(DENIM_ANATOMICAL_HANG26.modelledRearNotPhotographed,true);
 assert.equal(DENIM_ANATOMICAL_HANG26.releaseAuthorized,false);
});
test('P26 rejects invented bone phase or unsupported leg, never creates photographic facts',()=>{
 for(const phase of [NaN,Infinity,-Infinity,-.01,1.01,'0.5',null])
  assert.throws(()=>sourceNeutralHipKneeHang26(phase,0),/P26 requires/);
 for(const side of [-1,2,.5,null,'0',NaN])
  assert.throws(()=>sourceNeutralHipKneeHang26(.5,side),/P26 requires/);
 const source=readFileSync('research/denim-fit-06/source-neutral-hip-knee-hang-26.mjs','utf8');
 assert.ok(!/texture2D|sampler2D|new Image|fetch\s*\(|Math\.random|crypto|new THREE\.Mesh/.test(source));
 assert.ok(source.includes('source-neutral'));
});
test('P26 only calls the guarded existing photographed-immutable 163 bone P22 fitter',()=>{
 const fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 const controller=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8');
 const showroom=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8');
 const demo=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 const photo=readFileSync('research/three-d-30/reviewed-photo-pants.mjs','utf8');
 assert.ok(fit.includes("import {sourceNeutralHipKneeHang26"));
 assert.ok(fit.includes('sourceHipKneeHang26&&(!sourceCuffStack22||!sourceAnatomicalLine20||!sourcePosteriorContour16)'));
 assert.ok(fit.includes('if(row.front>=.12||row.q.z>-.025)continue;'));
 assert.ok(fit.includes("throw Error('Photographed front denim vertex changed')"));
 assert.ok(fit.includes('maximumTotalLocalShiftMeters'));
 assert.ok(fit.includes('sideRearDrapeModeledNotPhotographed26:true'));
 assert.ok(fit.includes('originalSourceFrontJPEGUVRestSkinUnchanged26:true'));
 assert.ok(controller.includes('sourceHipKneeHang26:sourceDenimHang26'));
 assert.ok(controller.includes('sourceDenimHang26&&(!sourceDenimWeave25||!sourceDenimCuffStack22||!staticDenimFit06)'),'Full P26 P25/P22/real frozen fit prerequisite must remain enforced');
 assert.ok(showroom.includes('sourceDenimHang26Enabled:sourceDenimHang26'));
 assert.ok(demo.includes("get('denimHang26')==='after'"));
 assert.ok(demo.includes('proof.sourceHipKneeHangMovedVertices26<30'));
 assert.ok(photo.includes("material.customProgramCacheKey=()=> 'cc3d30-reviewed-pants-front-v1'"));
 assert.ok(!photo.includes('sourceNeutralHipKneeHang26'));
});
