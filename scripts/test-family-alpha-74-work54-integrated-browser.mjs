/**
 * Reuse exact Work54 protected app journey against #74 combined candidate.
 * Stabilize the trusted tool transition after selecting restore, while keeping
 * the stringent original-pixel equality assertion. Never log garment data URLs.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const source=await readFile('scripts/test-work54-integration-browser.mjs','utf8');
const needle="resolve('dist-work54-natural-fit-HOLD')";
const replacement="resolve('dist-family-alpha-74-work54-phone-HOLD')";
assert.equal(source.split(needle).length,2,'Verified Work54 compiled target changed');
const oldBrush="await editor.getByLabel('Cutout refinement tool').selectOption('restore');await tap();assert.equal(await cv.evaluate(c=>c.toDataURL()),initial);";
const stableBrush="await editor.getByLabel('Cutout refinement tool').selectOption('restore');await page.waitForFunction(()=>document.querySelector('.family-alpha-mask-editor select[aria-label=\"Cutout refinement tool\"]')?.value==='restore');await cv.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await cv.scrollIntoViewIfNeeded();box=await cv.boundingBox();await tap();assert.ok((await cv.evaluate(c=>c.toDataURL()))===initial,'Remove then restore must return exact original source pixels');";
assert.equal(source.split(oldBrush).length,2,'Work54 strict pixel-restoration contract changed');
const filename='scripts/.family-alpha-74-work54-integrated-generated.mjs';
await writeFile(filename,source.replace(needle,replacement).replace(oldBrush,stableBrush));
try{
 const result=spawnSync(process.execPath,[resolve(filename)],{
  encoding:'utf8',timeout:700000,
  env:{...process.env,W48_CHROMIUM_ONLY:'1'}
 });
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 assert.equal(result.status,0,'#74 protected app must pass pixel-accurate Work54 fit/privacy/browser workflow');
 console.log('FAMILY_ALPHA_74_WORK54_PROTECTED_INTEGRATION_PASS');
}finally{await rm(filename,{force:true});}
