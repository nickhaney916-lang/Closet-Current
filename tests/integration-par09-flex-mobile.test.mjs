import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='research/integration-par09-flex-mobile/';
const demo=readFileSync(base+'mobile-demo.mjs','utf8');
const viewer=readFileSync(base+'mobile-showroom.mjs','utf8');
const ctrl=readFileSync(base+'flex-outfit-controller.mjs','utf8');
const fabric=readFileSync(base+'pose-responsive-source-denim.mjs','utf8');
const webgl=readFileSync('scripts/test-integration-par09-flex-mobile-browser.mjs','utf8');
const workflow=readFileSync('.github/workflows/integration-par09-flex-mobile-no-deploy.yml','utf8');

test('True PAR09 original skinned source-neutral denim fold is opt-in research integration only',()=>{
 assert.match(demo,/get\('flex79'\)==='after'/);
 assert.match(demo,/photoDenimFlex79:/);
 assert.match(demo,/photoDenimKneePose78:true/);
 assert.match(demo,/window\.ccMobile78KneePose/);
 assert.match(demo,/flexNoNewCrossings:stats\.denimFlexNoNewTriangleCrossings79===true/);
 assert.match(viewer,/photoDenimFlex79=false/);
 assert.match(viewer,/photoDenimContactAudit77=false/);
 assert.match(viewer,/photoDenimKneePose78=false/);
 assert.match(viewer,/photoDenimFlex79\}\);outfit\.setPose/);
 assert.match(viewer,/reapDetachedGarmentGeometries/);
 assert.match(ctrl,/photoDenimFlex79=false/);
 assert.match(ctrl,/restoreGeometry79\?\.\(\)/);
 assert.match(ctrl,/bendSourceTrueDenim79\(parts\.pants,root/);
 assert.match(fabric,/denimFlexFrontSourceVerticesByteIdentical79:true/);
 assert.match(fabric,/denimFlexNoNewTriangleCrossings79:true/);
});
test('Fail-closed source-photo integrity and no account-side effects',()=>{
 for(const s of [viewer,demo,ctrl,fabric])
  assert.doesNotMatch(s,/supabase\.co|api\.openai|localStorage|sessionStorage|fetch\(\s*['"]https?:/);
 assert.match(demo,/localhost/);
 assert.match(demo,/originalShirtSHA256/);
 assert.match(demo,/originalDenimSHA256/);
 for(const x of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(fabric.includes(x),x);
 assert.match(fabric,/originalPhotoSourcePreserved79:true/);
 assert.match(fabric,/unphotographedReverseRemainsNeutral79:true/);
 assert.match(fabric,/if\(!frontIdentical/);
 assert.match(fabric,/geometry\.dispose\(\)/);
});
test('Real WebGL side-by-side same bone pose evidence; mobile recovery and memory regression',()=>{
 for(const x of ['[320,390,430]','[0,90,180]',"['female','male']",
  "'before','after'","'public','second'",'images.length,72','kneeEvidence.length,8',
  'flexComparisons.length,8','sameGenuine163BonePose:true',
  'realSamePoseFabricChangedPixels:fabricChanged','WEBGL_lose_context',
  'missing-model','missing-original-denim','Math.max(...swapGeo)'])
  assert.ok(webgl.includes(x),'Missing evidence: '+x);
 assert.match(webgl,/page\.locator\('#avatar'\)\.screenshot\(\)/);
 assert.match(webgl,/baselinePage\.locator\('#avatar'\)\.screenshot\(\)/);
 assert.match(workflow,/git merge-base --is-ancestor 1f8b0b93a4cda2932dfe2c1db1fb213608603586 HEAD/);
 assert.match(workflow,/contents: read/);
 assert.doesNotMatch(workflow,/\bnpm run deploy\b|^\s*push:\s*$/mi);
});
