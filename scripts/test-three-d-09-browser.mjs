/**
 * Preserve the entire 3D-07 source and WebGL browser gate, and additionally
 * test truly separate skinned garment geometry above real humanoid.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
let src=await readFile('scripts/test-three-d-07-browser.mjs','utf8');
src=src.replaceAll('research/three-d-07/index.html','research/three-d-09/index.html');
src=src.replaceAll("dataset.shirt==='source-reviewed'","dataset.shirt==='separate-rigged-shell'");
src=src.replaceAll("NO cloth fit or human visual approval","not tailored fit, no cloth simulation or human visual approval");
src=src.replaceAll("benchmark/three-d-07/","benchmark/three-d-09/");
src=src.replaceAll("real-shirt-anatomical-HOLD","relaxed-shirt-anatomical-HOLD");
const anchor="  assert.equal(await canvas.getAttribute('data-photo-source'),'commons-0003');";
assert.equal(src.split(anchor).length,2,'Inherited exact source browser gate changed');
const extra=[
 "  const shellCount=Number(await canvas.getAttribute('data-shell-meshes'));",
 "  assert.ok(shellCount>0,'Must render nonzero actual separate skinned clothing geometry');",
 "  assert.equal(await canvas.getAttribute('data-shirt'),'separate-rigged-shell');",
 "  console.log('THREE_D_09_REAL_SKINNED_RELAXED_OUTER_SHELL',JSON.stringify({width,meshCount:shellCount,sourceCutout:true}));"
].join('\n');
src=src.replace(anchor,anchor+'\n'+extra);
src=src.replaceAll("THREE_D_07_REAL_SHIRT_ON_RIG","THREE_D_09_REAL_SHIRT_RELAXED_OUTER_SHELL");

const afterDressing="  const pixelChange=await canvas.evaluate(async c=>{";
assert.equal(src.split(afterDressing).length,2,'Expected inherited original GPU source verification');
const comparison=[
 "  assert.equal(await canvas.getAttribute('data-silhouette'),'relaxed','Default source-verified shirt must use relaxed outer shape');",
 "  assert.equal(await page.locator('#fit').isEnabled(),true);",
 "  await page.getByRole('button',{name:'Side',exact:true}).click();",
 "  await page.waitForTimeout(200);",
 "  await canvas.evaluate(c=>{",
 "   const t=document.createElement('canvas');t.width=c.width;t.height=c.height;",
 "   t.getContext('2d').drawImage(c,0,0);window.__relaxedPixels=t.getContext('2d').getImageData(0,0,t.width,t.height).data;",
 "  });",
 "  await page.screenshot({path:'benchmark/three-d-09/side-'+width+'-relaxed-source-shirt-HOLD.png',fullPage:true});",
 "  await page.locator('#fit').click();",
 "  assert.equal(await canvas.getAttribute('data-silhouette'),'close-fit');",
 "  await page.waitForTimeout(200);",
 "  const delta=await canvas.evaluate(c=>{",
 "   const t=document.createElement('canvas');t.width=c.width;t.height=c.height;",
 "   const ctx=t.getContext('2d');ctx.drawImage(c,0,0);",
 "   const b=ctx.getImageData(0,0,t.width,t.height).data,a=window.__relaxedPixels;",
 "   let changed=0;for(let i=0;i<a.length;i+=4)if(",
 "    Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>12)changed++;",
 "   delete window.__relaxedPixels;return changed;",
 "  });",
 "  assert.ok(delta>70,JSON.stringify({problem:'Relaxed shell has no visible GPU silhouette change',width,delta}));",
 "  await page.screenshot({path:'benchmark/three-d-09/side-'+width+'-close-fit-baseline-HOLD.png',fullPage:true});",
 "  await page.locator('#fit').click();",
 "  assert.equal(await canvas.getAttribute('data-silhouette'),'relaxed');",
 "  await page.getByRole('button',{name:'Front',exact:true}).click();",
 "  console.log('THREE_D_09_REAL_SILHOUETTE_DELTA',JSON.stringify({width,changedPixelCount:delta,originalSourceUnchanged:true,mode:'geometry-only',humanVisualApproval:false}));"
].join('\n');
src=src.replace(afterDressing,comparison+'\n'+afterDressing);

src=src.replaceAll("garmentGeometry:false,release:'HOLD'","garmentGeometry:true,actualTailoredFit:false,release:'HOLD'");
const filename='scripts/.three-d-09-relaxed-shell-browser-generated.mjs';
await writeFile(filename,src);
try{
 const r=spawnSync(process.execPath,[resolve(filename)],{
  encoding:'utf8',timeout:750000,env:{...process.env}
 });
 if(r.stdout)process.stdout.write(r.stdout);
 if(r.stderr)process.stderr.write(r.stderr);
 if(r.error)throw r.error;
 assert.equal(r.status,0,'All inherited source and live WebGL shell checks must pass');
 console.log('THREE_D_09_REAL_GARMENT_SILHOUETTE_BROWSER_PASS');
}finally{await rm(filename,{force:true});}
