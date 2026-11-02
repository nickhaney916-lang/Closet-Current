import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceDenimCuffRelease08,sourceDenimTaperWeights07,
 createPhotoDenimStaticFitter06,settleDenimRest06} from '../research/denim-fit-06/static-source-denim-fit.mjs';
test('F08 measured original calf geometry has smooth cuff entry and exit, not new folds',()=>{
 const values=[0,.1,.24,.28,.32,.38,.45,.48,.60,.72,.9,1]
  .map(sourceDenimCuffRelease08);
 assert.equal(values[0],0);assert.equal(values.at(-1),0);
 assert.deepEqual(values.slice(0,4),[0,0,0,0]);
 assert.ok(values[4]>0&&values[4]<1);
 assert.equal(values[5],1);assert.equal(values[6],1);assert.equal(values[7],1);
 assert.ok(values[8]>0&&values[8]<1);
 assert.equal(values[9],0);assert.equal(values[10],0);
 assert.ok(values.every(x=>x>=0&&x<=1));
 for(const x of [-.01,1.01,NaN,Infinity])
  assert.throws(()=>sourceDenimCuffRelease08(x),/finite within observed geometry/);
 assert.ok(sourceDenimCuffRelease08(.281)<.001,'Cuff must not pinch where source side/rear mesh starts');
 assert.ok(sourceDenimCuffRelease08(.7199)<.001,'Cuff must not form a ledge at upper source rows');
});
test('F08 defaults off and cannot run without approved photographed F07 denim silhouette',()=>{
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourceFairing08:true}),
  /requires explicit approved silhouette/);
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourceSilhouette07:true,sourceFairing08:'yes'}),
  /requires explicit approved silhouette/);
 assert.throws(()=>createPhotoDenimStaticFitter06({},{}),/source-SHA approved/);
 assert.equal(sourceDenimTaperWeights07(0).hemEase,0);
 assert.ok(settleDenimRest06().meters>.0057);
});
test('F08 source photo SHA, UV/rest/skin and physical body BVH are still mandatory',()=>{
 const fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8'),
  controller=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8'),
  room=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8'),
  wardrobe=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8'),
  qa=readFileSync('scripts/test-fabric-sweep-04-browser.mjs','utf8');
 for(const s of ['sourceFairing08=false','sourceDenimCuffRelease08(row.sourceCalfPhase)',
  'originalSourceNeutralCuffFairing08:sourceFairing08','pantsSourceFront',
  'pantsSourceUV','pantsRest','skinIndex','skinWeight','originalPhotoTextureRGBAndUVUnmodified08:true'])
  assert.ok(fit.includes(s),s);
 assert.ok(controller.includes('sourceFairing08:sourceDenimCuffFairing08'));
 assert.ok(room.includes('sourceDenimCuffFairing08Enabled:sourceDenimCuffFairing08'));
 for(const s of ["get('denimFairing')==='after'",'proof.maxCuffReleaseMeters08<.008',
  'last3D?.originalPhotoSHA256s?.bottom','bound?.ownerId!==owner.ownerId'])
  assert.ok(wardrobe.includes(s),s);
 for(const s of ['baseline-f07','cuff-f08','changedPixelsAgainstExactOriginalF07',
  'noNewSkinnedTriangleContacts','sourceDenimCuffFairing08Enabled,false'])
  assert.ok(qa.includes(s),s);
 assert.doesNotMatch(wardrobe,/supabase\.auth|localStorage\.setItem\(/);
});