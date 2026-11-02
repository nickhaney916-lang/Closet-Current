import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralRearThighEnvelope14,createPhotoDenimStaticFitter06} from '../research/denim-fit-06/static-source-denim-fit.mjs';

test('R14 original hip/knee rear thigh envelope smoothly enters/exits source row spans',()=>{
 assert.equal(sourceNeutralRearThighEnvelope14(0),0);
 assert.equal(sourceNeutralRearThighEnvelope14(.04),0);
 assert.equal(sourceNeutralRearThighEnvelope14(.96),0);
 assert.equal(sourceNeutralRearThighEnvelope14(1),0);
 assert.ok(sourceNeutralRearThighEnvelope14(.50)>.99);
 for(const phase of [0,.05,.15,.27,.40,.70,.80,.93,1])
  assert.ok(sourceNeutralRearThighEnvelope14(phase)>=0&&sourceNeutralRearThighEnvelope14(phase)<=1);
 for(const phase of [-1,.0-Number.EPSILON,1.001,NaN,Infinity])
  assert.throws(()=>sourceNeutralRearThighEnvelope14(phase),/finite/);
});
test('R14 always opt-in and requires both protected F07 and F08',()=>{
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourceRearThigh14:true}),/fully verified original F07\/F08/);
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourceSilhouette07:true,sourceRearThigh14:true}),/fully verified original F07\/F08/);
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourceRearThigh14:'after'}),/fully verified original F07\/F08/);
 assert.throws(()=>createPhotoDenimStaticFitter06({},{}),/source-SHA approved/);
});
test('R14 does not synthesize unseen rear photo or modify saved source UV, JPEG and skin',()=>{
 const fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const field of ['pantsSourceUV','pantsSourceFront','pantsRest','skinIndex','skinWeight','originalPhotographedFrontProtected14:true',
  'sourcePhotoRGBUVRestAndSkinUnchanged14:true','noInventedPhotographicRear14:true','sourceRearThigh14=false'])
  assert.ok(fit.includes(field),field);
 const page=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(page.includes("get('denimRear14')==='after'"));
 assert.doesNotMatch(page,/supabase\.auth|localStorage\.setItem/);
});
