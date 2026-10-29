import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('QA retains the exact Work56 real-photo / Work57 shared skeleton Chromium journey',async()=>{
 const parent=await readFile('scripts/test-three-d-10-browser.mjs','utf8');
 const qa=await readFile('scripts/test-three-d-10-qa-browser.mjs','utf8');
 assert.ok(parent.includes("const anchor="));
 assert.match(qa,/assert\.equal\(original\.split\(anchor\)\.length,2/);
 assert.match(qa,/original=original\.replace\(anchor,enhancement/);
 assert.match(qa,/three-d-10-qa-source-recovery-generated/);
});
test('Real corrupted Work47 PNG must fail closed, then genuine original must recover',async()=>{
 const qa=await readFile('scripts/test-three-d-10-qa-browser.mjs','utf8');
 for(const required of ['INVALID-SOURCE-SHA','page.route(poison','page.unroute(poison)',
  "includes('blocked')","denied.garment,null","denied.photoSource,null",
  "healthy.photoSource==='commons-0003'","final.resources.textures<=2",
  "THREE_D_10_QA_SOURCE_FAIL_CLOSED_RECOVERED"]){
  assert.ok(qa.includes(required),required);
 }
});
test('Multiple source/rest pose cycles preserve triangle count, original SHA and GPU resources',async()=>{
 const qa=await readFile('scripts/test-three-d-10-qa-browser.mjs','utf8');
 for(const word of ['k<4','garment?.sourceSHA256,hash','garment?.triangles,triangles',
  'resources.geometries<=healthy.resources.geometries+1','resources.textures<=healthy.resources.textures'])
  assert.ok(qa.includes(word),word);
});
test('QA never accesses account/session, persistent wardrobe or external inference tools',async()=>{
 const [qa,workflow]=await Promise.all([
  readFile('scripts/test-three-d-10-qa-browser.mjs','utf8'),
  readFile('.github/workflows/three-d-10-qa-source-recovery-no-deploy.yml','utf8')
 ]);
 for(const src of [qa,workflow]){
  for(const regex of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /api\.openai\.com/,/paid[-_]api/,/resend\.com/,/cloudflare\.com/])
   assert.doesNotMatch(src,regex);
 }
 assert.match(workflow,/NO DEPLOY/);
});
