import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RELAXED_SHIRT,shellClearanceAt,CLOTH_VERTEX,CLOTH_VERTEX_DECLARATIONS}
 from '../research/three-d-09/cloth-silhouette.mjs';
test('Silhouette clearance is a bounded, opt-in research shape, not garment physics',()=>{
 assert.equal(RELAXED_SHIRT.physicallySimulated,false);
 assert.equal(RELAXED_SHIRT.tailoredFit,false);
 assert.equal(RELAXED_SHIRT.releaseAuthorized,false);
 for(const y of [1.06,1.12,1.25,1.4,1.6]){
  for(const x of [-.69,-.34,0,.34,.69]){
   const d=shellClearanceAt({x,y,z:.18});
   assert.ok(d>=0&&d<=RELAXED_SHIRT.maxDisplacement,{x,y,d});
   assert.equal(shellClearanceAt({x,y,z:.18,relaxed:false}),0);
  }
 }
 const hem=shellClearanceAt({x:.3,y:1.09,z:.15});
 const chest=shellClearanceAt({x:.3,y:1.5,z:.15});
 assert.ok(hem>chest+.025,{hem,chest});
 assert.ok(shellClearanceAt({x:.62,y:1.3,z:.03})>chest,'Sleeves require nonzero extra separation');
});
test('No extreme displacement, injection, nonexistent real-world coordinates or fake body measurements',()=>{
 for(const bad of [{x:NaN,y:1,z:0},{x:0,y:Infinity,z:0},{x:9,y:1,z:0},
 {x:0,y:-7,z:0},{x:0,y:1,z:10},{x:0,y:1,z:0,relaxed:2}])
  assert.throws(()=>shellClearanceAt(bad));
 assert.match(CLOTH_VERTEX,/gl_Position=projectionMatrix\*viewMatrix\*vec4\(vSilhouetteShiftedWorld,1\.0\)/);
 assert.match(CLOTH_VERTEX,/ccWorldPoint=\(modelMatrix\*vec4\(transformed,1\.0\)\)\.xyz/);
 assert.match(CLOTH_VERTEX,/ccRadial\*ccOffset/);
 assert.match(CLOTH_VERTEX_DECLARATIONS,/uniform float uRelaxedFit/);
 assert.doesNotMatch(CLOTH_VERTEX,/texture2D|uImage|sourcePixel/);
});
test('Actual 3D-08 source shell and original rig persist, with independently toggled geometry only',async()=>{
 const [shell,viewer,demo,html]=await Promise.all([
  readFile('research/three-d-08/rigged-shirt-shell.mjs','utf8'),
  readFile('research/three-d-06/anatomical-showroom.mjs','utf8'),
  readFile('research/three-d-09/demo.mjs','utf8'),
  readFile('research/three-d-09/index.html','utf8')
 ]);
 assert.match(shell,/src\.geometry\.clone\(\)/);
 assert.match(shell,/new THREE\.SkinnedMesh\(geometry,material\)/);
 assert.match(shell,/outer\.bind\(src\.skeleton,src\.bindMatrix\.clone\(\)\)/);
 assert.match(shell,/amount=\.007/);
 assert.match(shell,/CLOTH_VERTEX_DECLARATIONS/);
 assert.match(shell,/shader\.uniforms\.uRelaxedFit/);
 assert.match(shell,/const \{material,tex,fitUniform\}=shellMaterial\(source\)/);
 assert.match(shell,/setRelaxed\(value\)/);
 assert.match(shell,/if\(present<\.5\)discard/);
 assert.match(shell,/texture2D\(uImage,uv\)/);
 assert.match(shell,/photographedRear:false/);
 assert.match(shell,/releaseAuthorized:false/);
 assert.match(viewer,/setShirtSilhouette=relaxed/);
 assert.match(viewer,/sourceStillVerified:!!clothSource/);
 assert.match(viewer,/clearShirt\(\);\s*selected=obj/);
 assert.match(demo,/app\.applyShirtShell\(source,\{acknowledged:true\}\)/);
 assert.match(demo,/event\?\.isTrusted/);
 assert.match(demo,/loadLicensedCutout\(LICENSED_SHIRT/);
 assert.match(demo,/app\.setShirtSilhouette\(relaxed\)/);
 assert.match(html,/id="fit" type="button" disabled/);
 assert.match(html,/3D-09/);
});
test('Only local research sources, no additional personal data, paid AI or internet runtime',async()=>{
 const files=['research/three-d-09/cloth-silhouette.mjs','research/three-d-09/demo.mjs',
  'research/three-d-09/index.html','research/three-d-08/rigged-shirt-shell.mjs',
  'research/three-d-06/anatomical-showroom.mjs'];
 for(const p of files){
  const s=await readFile(p,'utf8');
  for(const re of [/supabase\.co/,/localStorage/,/indexedDB/,/sendBeacon/,
   /getUserMedia/,/openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/])
   assert.doesNotMatch(s,re);
 }
});
