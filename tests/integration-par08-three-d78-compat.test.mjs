import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const folder='research/integration-par08-three-d-78/';
const viewer=readFileSync(folder+'mobile-showroom.mjs','utf8');
const demo=readFileSync(folder+'mobile-demo.mjs','utf8');
const page=readFileSync(folder+'index.html','utf8');
const browser=readFileSync('scripts/test-integration-par08-3d78-browser.mjs','utf8');
const workflow=readFileSync('.github/workflows/integration-par08-three-d78-no-deploy.yml','utf8');
test('isolated original PAR08 reliability viewer connects ONLY to verified original 3D78 controller',()=>{
 assert.match(viewer,/photoDenimKneePose78=false/);
 assert.match(viewer,/photoDenimContactAudit77=false/);
 assert.match(viewer,/photoDenimContinuity76=false/);
 assert.match(viewer,/photoDenimKneePose78\}\);outfit\.setPose/);
 assert.match(viewer,/outfit\.auditKneePose78\(next\)/);
 assert.match(viewer,/reapDetachedGarmentGeometries/);
 assert.match(demo,/photoDenimContactAudit77:true/);
 assert.match(demo,/photoDenimKneePose78:true/);
 assert.match(demo,/window\.ccMobile78KneePose/);
 assert.match(demo,/sourceSHA:lastResult\.originalPhotoSHA256s\.bottom/);
 assert.match(demo,/phase!=='ready'/);
 assert.match(demo,/actual3DGarment:lastResult/);
});
test('original source photos and local privacy/recovery unaffected',()=>{
 for(const file of [viewer,demo,page]){
  assert.doesNotMatch(file,/supabase\.co|api\.openai|localStorage|sessionStorage|fetch\(\s*['"]https?:/);
 }
 for(const sha of ['b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'])
  assert.ok(demo.includes(sha)&&browser.includes(sha));
 assert.match(demo,/localhost/);
 assert.match(demo,/webglcontextlost/);
 assert.match(demo,/phaseSet\('error'/);
 assert.match(page,/Original photograph and safe 2D fallback/);
});
test('genuine browser evidence plus actual bent 163-bone triangles and mobile failure guards',()=>{
 for(const q of ["[320,390,430]","[0,90,180]",
 "['female','male']","'before','after'","'public','second'",
 "images.length,72","kneeEvidence.length,8","window.ccMobile78KneePose",
 "'left-12'","'right-12'","'both-16'","WEBGL_lose_context",
 "missing-model","missing-original-denim","Math.max(...swapGeo)"])
  assert.ok(browser.includes(q),'Missing true browser gate: '+q);
 assert.match(browser,/actualTriangleCrossings:p\.contact/);
 assert.match(browser,/page\.locator\('#avatar'\)\.screenshot\(\)/);
 assert.match(browser,/sourceSHA:p\.sourceSHA/);
 assert.match(workflow,/git merge-base --is-ancestor 8c586c94acc10fd1fc80c532bd5040eb6b2f8a1e HEAD/);
 assert.match(workflow,/permissions:\s*\n\s*contents: read/);
 assert.doesNotMatch(workflow,/\bnpm run deploy\b|^\s*push:\s*$/mi);
});
