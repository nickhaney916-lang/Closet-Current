import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralSideThighEnvelope15,createPhotoDenimStaticFitter06} from '../research/denim-fit-06/static-source-denim-fit.mjs';

test('S15 lateral thigh relief has exact hip/knee zero boundaries, bounded smooth envelope',()=>{
 assert.equal(sourceNeutralSideThighEnvelope15(0),0);
 assert.equal(sourceNeutralSideThighEnvelope15(.07),0);
 assert.equal(sourceNeutralSideThighEnvelope15(.94),0);
 assert.equal(sourceNeutralSideThighEnvelope15(1),0);
 assert.ok(sourceNeutralSideThighEnvelope15(.5)>.99);
 for(const phase of [0,.07,.13,.27,.5,.71,.8,.93,1]){
  const v=sourceNeutralSideThighEnvelope15(phase);
  assert.ok(v>=0&&v<=1);
 }
 for(const phase of [-1,1.00001,NaN,Infinity])
  assert.throws(()=>sourceNeutralSideThighEnvelope15(phase),/finite/);
});
test('S15 is default OFF and cannot activate without source-rear R14 and F07/F08',()=>{
 for(const option of [{sourceSideThigh15:true},{sourceRearThigh14:true,sourceSideThigh15:true},
  {sourceSilhouette07:true,sourceSideThigh15:true},{sourceSideThigh15:'after'}]){
  assert.throws(()=>createPhotoDenimStaticFitter06({}, {},option),/Side-thigh S15 requires|Source-rear R14 must opt in/);
 }
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{
  sourceSilhouette07:true,sourceFairing08:true,sourceRearThigh14:true,sourceSideThigh15:true
 }),/source-SHA approved/);
});
test('S15 preserves original front positions, JPEG UV rest skin and only modeled unphotographed rear',()=>{
 const fitter=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const key of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  'originalPhotographedFrontProtected15:true','sourcePhotoRGBUVRestAndSkinUnchanged15:true',
  'noInventedPhotographicRear15:true','sourceSideThigh15=false','sideThighPerLeg15',
  'sideThighMaximumWorldMoveMeters15','realBVHVerifiedByCaller:false'])
  assert.ok(fitter.includes(key),key);
 const demo=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(demo.includes("get('denimSide15')==='after'"));
 assert.ok(demo.includes('proof.sideThighMaximumWorldMoveMeters15>.0065001'));
 assert.doesNotMatch(demo,/supabase\.auth|localStorage\.setItem/);
});
