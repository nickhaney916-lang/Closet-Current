/**
 * Reuse 3D-02 full licensed WebGL browser test, adding real garment-color
 * pixel assertion: black source shirt must no longer render burgundy.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const original=await readFile('scripts/test-three-d-02-browser.mjs','utf8');
const anchor="  const shirt=await viewer.evaluate(c=>c.toDataURL());";
assert.equal(original.split(anchor).length,2,'Inherited full WebGL source changed');
const addition=[
 "  const observed=await viewer.evaluate(c=>{",
 "   const t=document.createElement('canvas');t.width=c.width;t.height=c.height;",
 "   const ctx=t.getContext('2d',{willReadFrequently:true});ctx.drawImage(c,0,0);",
 "   const at=y=>Array.from(ctx.getImageData(Math.floor(c.width*.5),Math.floor(c.height*y),1,1).data).slice(0,3);",
 "   return {at39:at(.39),at43:at(.43),src:c.dataset.fabricRgb||''};",
 "  });",
 "  const median=observed.src.split(',').map(Number);",
 "  assert.equal(median.length,3,'Missing original source fabric median');",
 "  assert.ok(median.every(v=>v<100),JSON.stringify({problem:'not a black original shirt',observed}));",
 "  assert.ok([observed.at39,observed.at43].some(px=>px.every(v=>v<100)),JSON.stringify({problem:'actual black shirt not shown on 3D torso',observed}));",
 "  console.log('THREE_D_03_SOURCE_FABRIC_COLOR',JSON.stringify({width,sourceMedianRGB:median,actualTorsoRGB:observed.at43,rear:'inferred'}));"
].join('\n');
const filename='scripts/.three-d-03-real-uv-browser-generated.mjs';
await writeFile(filename,original.replace(anchor,anchor+'\n'+addition));
try{
 const p=spawnSync(process.execPath,[resolve(filename)],{
  encoding:'utf8',timeout:750000,env:{...process.env}
 });
 if(p.stdout)process.stdout.write(p.stdout);
 if(p.stderr)process.stderr.write(p.stderr);
 if(p.error)throw p.error;
 assert.equal(p.status,0,'3D03 must pass inherited real 3D licensed photo journey and pixel correctness');
 console.log('THREE_D_03_TRUE_FABRIC_UV_BROWSER_PASS');
}finally{await rm(filename,{force:true});}
