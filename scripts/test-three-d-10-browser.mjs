/** Preserve full Work56 real licensed photo/GLB journey and add Work57 pose checks. */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
let original=await readFile('scripts/test-three-d-08-browser.mjs','utf8');
const anchor="    await page.locator('#clear').click();assert.equal(await canvas.getAttribute('data-shirt'),'none');";
assert.equal(original.split(anchor).length,2,'Work56 source browser test changed');
const enhancement=[
 "    if(mode==='shell'){",
 "     await page.locator('#front').click();",
 "     const sourceFrame=await canvas.evaluate(c=>c.toDataURL());",
 "     const first=await page.evaluate(()=>work56Diagnostics());",
 "     assert.equal(first.pose,'source','Original Work56 shirt fits only in original A-pose');",
 "     assert.ok(first.garment?.triangles>1000);",
 "     await page.locator('#pose').selectOption('relaxed');",
 "     assert.equal(await canvas.getAttribute('data-pose'),'relaxed');",
 "     const relaxed=await canvas.evaluate(c=>c.toDataURL());",
 "     assert.notEqual(relaxed,sourceFrame,'Actual arm motion must change skinned shirt pixels');",
 "     const after=await page.evaluate(()=>work56Diagnostics());",
 "     assert.equal(after.pose,'relaxed');",
 "     assert.equal(after.garment.sourceSHA256,first.garment.sourceSHA256);",
 "     assert.equal(after.garment.triangles,first.garment.triangles);",
 "     assert.equal(await canvas.getAttribute('data-source-bound-shirt'),'true');",
 "     await mkdir('benchmark/three-d-10',{recursive:true});",
 "     await canvas.screenshot({path:'benchmark/three-d-10/'+model+'-'+width+'-RELAXED-real-shirt-HOLD.png'});",
 "     await page.locator('#pose').selectOption('source');",
 "     assert.equal(await canvas.getAttribute('data-pose'),'source');",
 "     assert.equal(await canvas.getAttribute('data-shirt'),'source-reviewed');",
 "     await canvas.screenshot({path:'benchmark/three-d-10/'+model+'-'+width+'-SOURCE-fit-shirt-HOLD.png'});",
 "     await page.locator('#pose').selectOption('relaxed');",
 "     await page.locator('#clear').click();",
 "     assert.equal(await canvas.getAttribute('data-shirt'),'none');",
 "     await page.locator('#review').check();",
 "     await page.locator('#dress').click();",
 "     await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.shirt==='source-reviewed',null,{timeout:30000});",
 "     assert.equal(await canvas.getAttribute('data-pose'),'relaxed');",
 "     const rebuilt=await page.evaluate(()=>work56Diagnostics());",
 "     assert.equal(rebuilt.garment?.sourceSHA256,first.garment.sourceSHA256);",
 "     assert.equal(rebuilt.garment?.skinBones,163);",
 "     await page.locator('#pose').selectOption('source');",
 "     console.log('THREE_D_10_COMBINED_ANATOMICAL_SHIRT',JSON.stringify({",
 "      width,model,garmentTriangles:rebuilt.garment.triangles,pose:'source-to-relaxed-and-back',",
 "      originalPhotoIdentityPreserved:true,rebuildFittedAtRest:true,release:'HOLD'",
 "     }));",
 "    }",
].join('\n');
original=original.replace(anchor,enhancement+'\n'+anchor);
const path='scripts/.three-d-10-combined-browser-generated.mjs';
await writeFile(path,original);
try{
 const run=spawnSync(process.execPath,[resolve(path)],{encoding:'utf8',timeout:20*60*1000,env:{...process.env}});
 if(run.stdout)process.stdout.write(run.stdout);
 if(run.stderr)process.stderr.write(run.stderr);
 if(run.error)throw run.error;
 assert.equal(run.status,0,'Combined 3D mobile source garment/pose test failed');
 console.log('THREE_D_10_WORK56_WORK57_REAL_WEBGL_INTEGRATION_PASS');
}finally{await rm(path,{force:true});}