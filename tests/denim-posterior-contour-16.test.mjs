import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralPosteriorContour16,createPhotoDenimStaticFitter06} from '../research/denim-fit-06/static-source-denim-fit.mjs';

test('P16 authentic anatomical contour has smooth knee/seat zero boundaries, no synthetic repeated wrinkles',()=>{
 assert.equal(sourceNeutralPosteriorContour16(0),0);
 assert.equal(sourceNeutralPosteriorContour16(.08),0);
 assert.equal(sourceNeutralPosteriorContour16(.93),0);
 assert.equal(sourceNeutralPosteriorContour16(1),0);
 assert.ok(sourceNeutralPosteriorContour16(.50)>.99);
 for(const phase of [0,.08,.12,.27,.42,.60,.70,.85,.93,1])
  assert.ok(sourceNeutralPosteriorContour16(phase)>=0&&sourceNeutralPosteriorContour16(phase)<=1);
 for(const phase of [-1,1.000001,NaN,Infinity])
  assert.throws(()=>sourceNeutralPosteriorContour16(phase),/finite/);
});
test('P16 opt-in OFF by default and fails closed without original S15 verified ancestry',()=>{
 for(const option of [{sourcePosteriorContour16:true},
  {sourceRearThigh14:true,sourcePosteriorContour16:true},
  {sourceSideThigh15:false,sourcePosteriorContour16:true},
  {sourcePosteriorContour16:'after'}])
  assert.throws(()=>createPhotoDenimStaticFitter06({}, {},option),/Posterior contour P16 requires/);
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{
  sourceSilhouette07:true,sourceFairing08:true,sourceRearThigh14:true,
  sourceSideThigh15:true,sourcePosteriorContour16:true
 }),/source-SHA approved/);
});
test('P16 no fabricated rear photo, original front JPEG, UV rest, skin unchanged',()=>{
 const fitter=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const key of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  'sourcePosteriorContour16=false','sourceMeasuredPosteriorContour16',
  'original163BoneHipKneeAnchor16','frontPhotographUVRestSkinProtected16:true',
  'rearIsModeledNotPhotographed16:true','posteriorMaximumWorldMoveMeters16',
  'posteriorPerLeg16','realBVHVerifiedByCaller:false'])assert.ok(fitter.includes(key),key);
 const demo=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(demo.includes("get('denimPosterior16')==='after'"));
 assert.ok(demo.includes('proof.posteriorMaximumWorldMoveMeters16>.0115001'));
 assert.doesNotMatch(demo,/supabase\.auth|localStorage\.setItem/);
});
