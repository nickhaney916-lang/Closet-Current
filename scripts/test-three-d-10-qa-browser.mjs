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
const resilience="    if(width===390&&mode==='shell'){\n     // Original Work56 GUI must fail closed when the valid Work47 PNG URL\n     // returns other bytes. Preserve source review gating and body isolation.\n     const prior=await page.evaluate(()=>work56Diagnostics());\n     assert.equal(prior.garment,null);\n     assert.equal(prior.photoSource,null);\n     const poison='**/benchmark/work47/assets/commons-0003.png';\n     await page.route(poison,route=>route.fulfill({status:200,contentType:'image/png',body:'INVALID-SOURCE-SHA'}));\n     await page.locator('#review').check();\n     await page.locator('#dress').click();\n     await page.waitForFunction(()=>document.querySelector('#photoStatus')?.textContent.includes('blocked'),null,{timeout:25000});\n     assert.equal(await canvas.getAttribute('data-shirt'),'none','Bad photo must never reach a skinned GPU shirt');\n     const denied=await page.evaluate(()=>work56Diagnostics());\n     assert.equal(denied.garment,null);\n     assert.equal(denied.photoSource,null);\n     assert.ok(denied.resources.textures<=2,'Failed source must not retain a photo GPU texture');\n     await page.unroute(poison);\n     // A genuine second click with recovered original bytes can then proceed.\n     assert.equal(await page.locator('#review').isChecked(),true);\n     await page.locator('#dress').click();\n     await page.waitForFunction(()=>document.querySelector('#avatar').dataset.shirt==='source-reviewed',null,{timeout:35000});\n     const healthy=await page.evaluate(()=>work56Diagnostics());\n     assert.ok(healthy.garment?.triangles>1000);\n     assert.ok(healthy.photoSource==='commons-0003');\n     const hash=healthy.garment.sourceSHA256,triangles=healthy.garment.triangles;\n     for(let k=0;k<4;k++){\n      await page.locator('#pose').selectOption('relaxed');\n      await page.locator('#pose').selectOption('source');\n      const x=await page.evaluate(()=>work56Diagnostics());\n      assert.equal(x.garment?.sourceSHA256,hash);\n      assert.equal(x.garment?.triangles,triangles);\n      assert.ok(x.resources.geometries<=healthy.resources.geometries+1,'Pose toggles must not leak garment geometry');\n      assert.ok(x.resources.textures<=healthy.resources.textures,'Pose toggles must not reupload photograph textures');\n     }\n     await page.locator('#clear').click();\n     const final=await page.evaluate(()=>work56Diagnostics());\n     assert.equal(final.garment,null);\n     assert.equal(final.photoSource,null);\n     assert.ok(final.resources.textures<=2,'Clear must free source photo texture');\n     console.log('THREE_D_10_QA_SOURCE_FAIL_CLOSED_RECOVERED',JSON.stringify({width,model,\n      corruptShaRejected:true,sameOriginalSourceRecovered:true,reversiblePoseCycles:4,\n      garmentTriangles:triangles,sourceIdentityUnchanged:true,privatePreviewOnly:true,release:'HOLD'}));\n    }";
original=original.replace(anchor,enhancement+'\n'+anchor+'\n'+resilience);
const path='scripts/.three-d-10-qa-source-recovery-generated.mjs';
await writeFile(path,original);
try{
 const run=spawnSync(process.execPath,[resolve(path)],{encoding:'utf8',timeout:20*60*1000,env:{...process.env}});
 if(run.stdout)process.stdout.write(run.stdout);
 if(run.stderr)process.stderr.write(run.stderr);
 if(run.error)throw run.error;
 assert.equal(run.status,0,'Combined 3D mobile source garment/pose test failed');
 console.log('THREE_D_10_QA_SOURCE_RECOVERY_AND_POSE_STABILITY_PASS');
}finally{await rm(path,{force:true});}