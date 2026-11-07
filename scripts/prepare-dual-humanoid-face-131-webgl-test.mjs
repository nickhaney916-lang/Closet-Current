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
 "if([0,45,90,270].includes(deg))assert.ok(changed>75,'FACE131 not visibly rendered at visible face angle '+deg);");
replaceOnce("const result={schema:'dual-humanoid-photorealism-118-webgl/v1',",
 "const result={schema:'dual-humanoid-face-definition-131-webgl/v1',");
replaceOnce("baselineComparisonPairs:comparison.length,",
 "baselineComparisonPairs:comparison.length,facialDefinitionComparedToP118:true,");
replaceOnce("screenshotsSha256:hash(Buffer.from(JSON.stringify(screens)))}));",
 "screenshotsSha256:hash(Buffer.from(JSON.stringify(screens))),facialDefinitionComparedToP118:true}));");
await writeFile(output,s);
console.log(JSON.stringify({generated:true,from:'pinned P118 actual WebGL tester',
 scope:'detached donor only',figures:2,engineModes:['chromium','webkit'],
 mobileWidths:[320,390,430],sixViews:true,baseline:'P118 natural skin and hair',
 comparison:'P118 with opt-in FACE131 eyes, eyelids and brows',
 humanPhotorealismReview:'PENDING',productionDeployed:false,familyAlpha:'HOLD'}));
