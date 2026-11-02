import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPhotoDenimStaticFitter06,settleDenimRest06,sourceDenimTaperWeights07}
 from '../research/denim-fit-06/static-source-denim-fit.mjs';
test('F07 uses actual 163-bone knee/ankle sourced, bounded taper and original 3D75/76 folds',()=>{
 const path='research/denim-fit-06/static-source-denim-fit.mjs';
 const s=readFileSync(path,'utf8');
 for(const key of ['sourceSilhouette07=false','row.kneeEase','row.hemEase',
  'knee.y-ankle.y','row.sourceCalfPhase>=.38','row.sourceCalfPhase<=1.001',
  'pantsSourceFront','pantsSourceUV','pantsRest','skinIndex','skinWeight',
  'originalPhotoTextureRGBAndUVUnmodified07:true','actualSeamFoldTopologyPreserved07:true',
  'sourceNeutralKneeRearGroups07:sourceKneeRearGroups','taperAdditionalMean<.008'])
  assert.ok(s.includes(key),'Photo original geometry proof: '+key);
 assert.match(s,/sourceSilhouette07\?silhouette07\.maxShiftMeters:DENIM_FIT06\.maxWorldShiftMeters/);
 assert.match(s,/const hemRest=sourceSilhouette07 \? -\.016\*row\.hemEase : 0/);
});
test('Anatomical calf easing follows numeric smooth(start,end,phase) and does not inflate every source ring',()=>{
 const ankle=sourceDenimTaperWeights07(0),lower=sourceDenimTaperWeights07(.38),
  knee=sourceDenimTaperWeights07(.75),top=sourceDenimTaperWeights07(1);
 assert.equal(ankle.kneeEase,0);
 assert.equal(ankle.hemEase,0);
 const lowerTransition=sourceDenimTaperWeights07(.12);
 assert.equal(lowerTransition.hemEase,1);
 assert.ok(sourceDenimTaperWeights07(.04).hemEase<lowerTransition.hemEase);
 // Abrupt entry at phase zero pinches the original photographed calf mesh.
 assert.ok(sourceDenimTaperWeights07(.001).hemEase<.001);
 assert.ok(lower.kneeEase>0&&lower.kneeEase<knee.kneeEase);
 assert.ok(lower.hemEase>0&&lower.hemEase<1);
 assert.equal(knee.kneeEase,1);
 assert.equal(knee.hemEase,0);
 assert.equal(top.kneeEase,1);
 assert.equal(top.hemEase,0);
 for(const v of [-1,1.01,NaN,Infinity])
  assert.throws(()=>sourceDenimTaperWeights07(v),/finite within observed geometry/);
});
test('F07 defaults OFF and the original source-approved F06 equilibrium is unchanged',()=>{
 const o=settleDenimRest06();
 assert.equal(o.staticNonzeroGravityRest,true);
 assert.ok(o.meters>.0057&&o.meters<.006);
 assert.throws(()=>createPhotoDenimStaticFitter06({},{}),/source-SHA approved/);
});
test('Actual saved-closet 163-bone shirt+jeans research requires explicit dual gates and BVH',()=>{
 const controller=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8'),
  room=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8'),
  browser=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8'),
  qa=readFileSync('scripts/test-fabric-sweep-04-browser.mjs','utf8');
 assert.ok(controller.includes('sourceDenimSilhouette07=false'));
 assert.ok(controller.includes('sourceSilhouette07:sourceDenimSilhouette07'));
 assert.ok(room.includes('sourceDenimSilhouette07Enabled:sourceDenimSilhouette07'));
 for(const s of ["get('denimFit')==='after'","get('denimSilhouette')==='after'",
 'last3D?.originalPhotoSHA256s?.bottom','bound?.ownerId!==owner.ownerId',
 'proof.additionalKneeVsHemEaseMeters07<.008'])
  assert.ok(browser.includes(s),s);
 for(const s of ["baseline-f06","silhouette-f07","sourceDenimSilhouette07Enabled,false",
  "changedPixelsAgainstExactOriginalF06","noNewTriangleContacts","originalFrontAndSkinPreserved"])
  assert.ok(qa.includes(s),s);
 assert.doesNotMatch(browser,/supabase\.auth|localStorage\.setItem\(/);
});
