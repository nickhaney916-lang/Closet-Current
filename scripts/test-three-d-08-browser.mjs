/**
 * Preserve the entire 3D-07 source and WebGL browser gate, and additionally
 * test truly separate skinned garment geometry above real humanoid.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
let src=await readFile('scripts/test-three-d-07-browser.mjs','utf8');
src=src.replaceAll('research/three-d-07/index.html','research/three-d-08/index.html');
src=src.replaceAll("dataset.shirt==='source-reviewed'","dataset.shirt==='separate-rigged-shell'");
src=src.replaceAll("NO cloth fit or human visual approval","not tailored fit, no cloth simulation or human visual approval");
src=src.replaceAll("benchmark/three-d-07/","benchmark/three-d-08/");
src=src.replaceAll("real-shirt-anatomical-HOLD","source-shirt-separate-shell-HOLD");
const anchor="  assert.equal(await canvas.getAttribute('data-photo-source'),'commons-0003');";
assert.equal(src.split(anchor).length,2,'Inherited exact source browser gate changed');
const extra=[
 "  const shellCount=Number(await canvas.getAttribute('data-shell-meshes'));",
 "  assert.ok(shellCount>0,'Must render nonzero actual separate skinned clothing geometry');",
 "  assert.equal(await canvas.getAttribute('data-shirt'),'separate-rigged-shell');",
 "  console.log('THREE_D_08_REAL_SKINNED_OUTER_SHELL',JSON.stringify({width,meshCount:shellCount,sourceCutout:true}));"
].join('\n');
src=src.replace(anchor,anchor+'\n'+extra);
src=src.replaceAll("THREE_D_07_REAL_SHIRT_ON_RIG","THREE_D_08_REAL_SHIRT_ON_OUTER_SHELL");
src=src.replaceAll("garmentGeometry:false,release:'HOLD'","garmentGeometry:true,actualTailoredFit:false,release:'HOLD'");
const filename='scripts/.three-d-08-shell-browser-generated.mjs';
await writeFile(filename,src);
try{
 const r=spawnSync(process.execPath,[resolve(filename)],{
  encoding:'utf8',timeout:750000,env:{...process.env}
 });
 if(r.stdout)process.stdout.write(r.stdout);
 if(r.stderr)process.stderr.write(r.stderr);
 if(r.error)throw r.error;
 assert.equal(r.status,0,'All inherited source and live WebGL shell checks must pass');
 console.log('THREE_D_08_SEPARATE_RIGGED_GARMENT_BROWSER_PASS');
}finally{await rm(filename,{force:true});}
