import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

/**
 * FACE131 derives its genuine two-figure / 6 views / 3 mobile-width WebGL
 * evidence harness from the exact pinned P118 test in a detached donor.
 * No screenshots are synthesized or copied from a previous run.
 */
const target=resolve(process.argv[2]||'.face131-donor-541');
const original=resolve(target,'scripts/test-dual-humanoid-realism-118.mjs');
const output=resolve(target,'scripts/test-dual-humanoid-face-131.mjs');
let s=await readFile(original,'utf8');
function replaceOnce(from,to){
 assert.equal(s.split(from).length,2,'FACE131 pinned P118 harness anchor mismatch: '+from.slice(0,100));
 s=s.replace(from,to);
}
replaceOnce("const root=resolve('.'),out='benchmark/three-d-118';",
 "const root=resolve('.'),out='benchmark/three-d-131';");
replaceOnce("&realism118='+mode;","&realism118=after&face131='+mode;");
replaceOnce("const overlay=await page.locator('#avatar').getAttribute('data-realism118');",
 "const overlay=await page.locator('#avatar').getAttribute('data-face131');");
replaceOnce("assert.ok(overlay,'P118 opt-in diagnostics missing');",
 "assert.ok(overlay,'FACE131 head/eye diagnostics missing');");
replaceOnce("assert.ok(p.bodyMaterials>=1&&p.hairMeshes>=8);assert.ok(p.headRegion.vertices>80);",
 "assert.ok(p.faceMeshes>=14&&p.originalHeadVertices>80);assert.equal(p.eyeCount,2);assert.equal(p.sourceGeometryChanged,false);assert.equal(p.photorealismProven,false);assert.equal(p.familyAlpha,'HOLD');");
replaceOnce("'P118 changed source-backed garment identity or selection'",
 "'FACE131 changed source-backed garment identity or selection'");
replaceOnce("assert.ok(changed>500,'P118 did not create a measurable frame change');",
 "console.log('FACE131_PIXEL_DELTA '+JSON.stringify({figure,viewDegrees:deg,changedChannelSamples:changed}));if([0,45].includes(deg))assert.ok(changed>75,'FACE131 must visibly affect front and three-quarter facial view '+deg);");
replaceOnce("const result={schema:'dual-humanoid-photorealism-118-webgl/v1',",
 "const result={schema:'dual-humanoid-face-definition-131-webgl/v1',");
replaceOnce("sourcePhotoHashes:source,rigBones:163,baselineComparisonPairs:comparison.length,",
 "sourcePhotoHashes:source,rigBones:163,baselineComparisonPairs:comparison.length,facialDefinitionComparedToP118:true,");

replaceOnce("for(const figure of figures)for(const mode of ['before','after']){",
 "for(const figure of figures)for(const mode of (name==='webkit'?['after']:['before','after'])){");
replaceOnce("const sourceRig=JSON.stringify((await page.evaluate(()=>window.cc69Diagnostics())).actual3DGarment);\n    for(const deg of views){",
 "const sourceRig=JSON.stringify((await page.evaluate(()=>window.cc69Diagnostics())).actual3DGarment);\n    for(const deg of (name==='webkit'?[0,90,180,270]:views)){");
replaceOnce("screenshotsSha256:hash(Buffer.from(JSON.stringify(screens)))}));",
 "screenshotsSha256:hash(Buffer.from(JSON.stringify(screens))),facialDefinitionComparedToP118:true}));");
// The pinned P118 harness starts a local HTTP server but never closes it.
// In CI, Chromium finishes all 72 WebGL frames, prints its receipt and then
// keeps Node alive until the 180-minute job is cancelled. Close the server
// in a finally block without weakening any screenshot/source assertions.
const lifecycleAnchor='const errors=[],external=[],crashes=[],screens=[],browserResults=[],comparison=[];';
assert.equal(s.split(lifecycleAnchor).length,2,'FACE131 expected single server lifetime anchor');
s=s.replace(lifecycleAnchor,lifecycleAnchor+String.fromCharCode(10)+'try {');
s += String.fromCharCode(10)+[
  '} finally {',
  '  server.closeAllConnections();',
  '  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));',
  '}',
  ''
].join(String.fromCharCode(10));

await writeFile(output,s);
console.log(JSON.stringify({generated:true,from:'pinned P118 actual WebGL tester',
 scope:'detached donor only',figures:2,engineModes:['chromium','webkit'],
 mobileWidths:[320,390,430],sixViews:true,baseline:'P118 natural skin and hair',
 comparison:'P118 with opt-in FACE131 eyes, eyelids and brows',
 humanPhotorealismReview:'PENDING',productionDeployed:false,familyAlpha:'HOLD'}));
