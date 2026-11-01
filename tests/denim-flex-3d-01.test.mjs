import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralKneeFoldField79,bendSourceTrueDenim79} from '../research/denim-flex-3d-01/pose-responsive-source-denim.mjs';

test('source-true knee compression is bounded and absent at 0° or source-front photos',()=>{
 const q={heightOffset:.04,sideOffset:.035,frontWeight:0,backDepth:.10};
 assert.deepEqual(sourceNeutralKneeFoldField79({...q,angle:0}),{dy:0,dz:0});
 assert.deepEqual(sourceNeutralKneeFoldField79({...q,angle:16,frontWeight:1}),{dy:0,dz:0});
 assert.deepEqual(sourceNeutralKneeFoldField79({...q,angle:16,backDepth:-.01}),{dy:0,dz:0});
 const m=sourceNeutralKneeFoldField79({...q,angle:16});
 const half=sourceNeutralKneeFoldField79({...q,angle:8});
 assert.ok(m.dz<-.003&&m.dz>-.022);
 assert.ok(Math.abs(m.dy)<.004);
 assert.ok(Math.abs(half.dz/m.dz-.5)<.000001);
 assert.ok(Math.abs(half.dy/m.dy-.5)<.000001);
});
test('nonverified, unsupported or fake 3D mannequin/garment fails closed',()=>{
 for(const pose of ['source','left-12','right-12','both-16','unsupported']){
  assert.throws(()=>bendSourceTrueDenim79({stats:{}},null,{pose}),/true reviewed source/);
 }
 assert.throws(()=>sourceNeutralKneeFoldField79({heightOffset:0,sideOffset:0,frontWeight:0,backDepth:1,angle:45}),
  /original lower-leg pose/);
});
test('standalone research only: exact source contract, true intersections, geometry restoring, all poses',()=>{
 const source=readFileSync('research/denim-flex-3d-01/pose-responsive-source-denim.mjs','utf8');
 const controller=readFileSync('research/denim-flex-3d-01/flex-outfit-controller.mjs','utf8');
 const showroom=readFileSync('research/denim-flex-3d-01/flex-showroom.mjs','utf8');
 const demo=readFileSync('research/denim-flex-3d-01/flex-demo.mjs','utf8');
 for(const marker of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  'actualSkinnedDenimBodyCrossingSegments77','denimFlexNoNewTriangleCrossings79:true',
  'denimFlexFrontSourceVerticesByteIdentical79:true',
  'originalPhotoSourcePreserved79:true','restoreGeometry79','mesh.geometry=g',
  'pose===','unphotographedReverseRemainsNeutral79:true'])
  assert.ok(source.includes(marker),marker);
 assert.match(controller,/photoDenimFlex79=false/);
 assert.match(controller,/restoreGeometry79/);
 assert.match(controller,/bendSourceTrueDenim79/);
 assert.match(showroom,/photoDenimFlex79=false/);
 assert.match(demo,/get\('flex79'\)==='after'/);
 assert.match(demo,/cc79KneePose/);
 assert.doesNotMatch(source+demo,/supabase\.co|api\.openai|localStorage|sessionStorage/);
});
