/**
 * Run every inherited 3D-04 320/390/430 WebGL2 source/hash/UV/lettering/
 * rotation/privacy test. Add actual browser-instantiated swept-arm and hand
 * attachment assertions without changing upstream source tests.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
let code=await readFile('scripts/test-three-d-04-browser.mjs','utf8');
const anchor=' "  const observed=await viewer.evaluate(c=>{",';
assert.equal(code.split(anchor).length,2,'Inherited WebGL screenshot/color test changed unexpectedly');
const additional=[
 "  assert.equal(await viewer.getAttribute('data-swept-sleeves'),'2','Real source shirt must have two tilted arm-following 3D sleeves');",
 "  assert.equal(await viewer.getAttribute('data-mannequin-hands'),'2','Source-free wrists must be connected to the sleeve openings');",
 "  console.log('THREE_D_05_ACTUAL_SWEPT_SHOULDERS',JSON.stringify({width,sweptSleeves:2,sourceFreeHands:2,sourceImageStillOnTorso:true,release:'HOLD'}));"
].map(x=>' "'+x.replace(/"/g,'\\"')+'",').join('\n');
code=code.replace(anchor,additional+'\n'+anchor);
code=code.replaceAll('.three-d-04-sleeve-panels-browser-generated.mjs',
 '.three-d-05-swept-shoulders-browser-generated.mjs');
code=code.replaceAll('THREE_D_04_SOURCE_PRINT_SLEEVES_BROWSER_PASS','THREE_D_05_SWEPT_SHOULDERS_BROWSER_PASS');
const file='scripts/.three-d-05-browser-wrapper-generated.mjs';
await writeFile(file,code);
try{
 const proc=spawnSync(process.execPath,[resolve(file)],{
  encoding:'utf8',timeout:750000,env:{...process.env}
 });
 if(proc.stdout)process.stdout.write(proc.stdout);
 if(proc.stderr)process.stderr.write(proc.stderr);
 if(proc.error)throw proc.error;
 assert.equal(proc.status,0,'Must pass 3D-04 inherited genuine browser and 3D-05 arm/shoulder checks');
 console.log('THREE_D_05_GENUINE_WEBGL_ACCEPTANCE_HOLD_PASS');
}finally{await rm(file,{force:true});}
