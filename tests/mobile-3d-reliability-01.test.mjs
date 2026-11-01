/** Static isolation and deterministic privacy/identity contracts; browser suite tests real WebGL. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const doc=readFileSync('research/mobile-3d-reliability-01/index.html','utf8');
const demo=readFileSync('research/mobile-3d-reliability-01/mobile-demo.mjs','utf8');
const copy=readFileSync('research/mobile-3d-reliability-01/mobile-showroom.mjs','utf8');
const runner=readFileSync('scripts/test-mobile-3d-reliability-01-browser.mjs','utf8');
const workflow=readFileSync('.github/workflows/mobile-3d-reliability-01-no-deploy.yml','utf8');
const denim1='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const denim2='aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a';
const shirt='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
test('original shirt and two pinned licensed denim SHA-256 identities match original 3D69',()=>{
 const original=readFileSync('research/three-d-69/index-to-real-garment-viewer.mjs','utf8');
 const sources=readFileSync('research/three-d-30/reviewed-photo-pants.mjs','utf8');
 assert.ok(original.includes(shirt));
 assert.ok(sources.includes(denim1)&&sources.includes(denim2));
 for(const x of [denim1,denim2,shirt])assert.ok(demo.includes(x)&&runner.includes(x));
});
test('no private photography, API credentials, remote URLs, auth or deploy in isolated app',()=>{
 for(const s of [doc,demo,copy]){
  assert.doesNotMatch(s,/supabase\.co|cloudflare|fetch\(\s*['"]https?:|api\.openai|import\.meta\.env|localStorage|sessionStorage/);
 }
 assert.match(demo,/localhost/);
 assert.match(workflow,/contents: read/);
 assert.doesNotMatch(workflow,/\bwrangler\b|\bnpm run deploy\b|^\s*push:\s*$/mi);
});
test('user-visible states, retry, 2D source fallback, WebGL context and cleanup are wired',()=>{
 for(const id of ['retry','wear','swap','clear','front','side','back','turn','zin','zout','model','review','angle'])
  assert.ok(doc.includes('id="'+id+'"'));
 assert.match(doc,/benchmark\/three-d-31\/original-jeans.jpg/);
 assert.match(doc,/benchmark\/work47\/assets\/commons-0003.jpg/);
 for(const token of ["phaseSet('loading'","phaseSet('ready'","phaseSet('error'","webglcontextlost","app.stop()","bundles=null","canv","SHA-256"])
  assert.ok(demo.includes(token),token);
 assert.match(copy,/cancelAnimationFrame/);
 assert.match(copy,/removeEventListener\('visibilitychange'/);
 assert.match(copy,/removeEventListener\('webglcontextlost'/);
});
test('real Chromium 72-frame acceptance and resilience suite exist without mocks',()=>{
 for(const x of ['[320,390,430]','[0,90,180]','[\'female\',\'male\']',
  "'before','after'","'public','second'","images.length,72","for(let i=0;i<10;i++)",
  "for(let i=0;i<5;i++)","WEBGL_lose_context","missing-model","missing-original-denim"])
  assert.ok(runner.includes(x),x);
 assert.match(runner,/const gl=c\.getContext\('webgl2'\)/);
 assert.match(runner,/Math\.max\(\.\.\.swapGeo\)/);
});
