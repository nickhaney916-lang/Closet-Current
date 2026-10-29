import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LIMITS,isShirtArea,selectedShirtIndices,
 buildSkinnedShirtShell,createSourceShirtMaterial} from '../research/three-d-08/skinned-shirt.mjs';
test('Source-only anatomical shirt area excludes head, legs, eyes and hands',()=>{
 for(const [x,y] of [[0,1.28],[.20,1.59],[.59,1.3],[-.61,1.34]])assert.equal(isShirtArea(x,y),true);
 for(const [x,y] of [[0,1.85],[.25,.4],[.91,1.2],[0,NaN],[NaN,1.4],[.34,2.0]])
  assert.equal(isShirtArea(x,y),false);
 assert.ok(LIMITS.offset>.005&&LIMITS.offset<.03);
});
test('Cannot produce shirt without skeleton, reviewed source or valid material',()=>{
 assert.throws(()=>selectedShirtIndices({}));
 assert.throws(()=>buildSkinnedShirtShell(null,{},()=>{}));
 assert.throws(()=>buildSkinnedShirtShell({},{
  verified:true,releaseAuthorized:false},null));
 assert.throws(()=>createSourceShirtMaterial(null,[0,0,1,1],[.2,.2,.2]));
 assert.throws(()=>createSourceShirtMaterial({},[0,0,1,1],[255,0,0]));
});
test('Real garment has separate skinned mesh sharing original GLB skeleton and cannot rewrite source body',async()=>{
 const shader=await readFile('research/three-d-08/skinned-shirt.mjs','utf8');
 const rig=await readFile('research/three-d-06/anatomical-showroom.mjs','utf8');
 const ui=await readFile('research/three-d-08/demo.mjs','utf8');
 assert.match(shader,/new THREE\.SkinnedMesh\(geometry,material\)/);
 assert.match(shader,/shell\.bind\(mesh\.skeleton,mesh\.bindMatrix\.clone\(\)\)/);
 assert.match(shader,/geometry\.setIndex\(indices\)/);
 assert.match(shader,/mesh\.getVertexPosition/);
 assert.match(shader,/transformed \+= normalize\(objectNormal\)\*0\.013/);
 assert.match(shader,/sourceTexture/);
 assert.match(shader,/original\.a\*front\*chest|px\.a\*front\*chest/);
 assert.match(rig,/applySkinnedShirt=/);
 assert.match(rig,/removeRiggedShirt/);
 assert.match(rig,/clearShirt\(\)/);
 assert.match(ui,/app\.applySkinnedShirt\(source,\{acknowledged:true\}\)/);
 assert.match(ui,/loadLicensedCutout\(LICENSED_SHIRT/);
 assert.match(ui,/event\?\.isTrusted/);
 assert.match(ui,/app\.clearShirt\(\)/);
});
test('Original photograph and provisional mask remain source-hash verified and unapproved',async()=>{
 const [original,screen]=await Promise.all([
  readFile('research/three-d-02/reviewed-texture.mjs','utf8'),
  readFile('research/three-d-08/index.html','utf8')
 ]);
 assert.match(original,/readVerifiedAsset/);
 assert.match(original,/cutoutSHA256/);
 assert.match(screen,/review/);
 assert.match(screen,/separate 3D skinned garment shell/);
 assert.match(screen,/not tailored cloth/);
});
test('No cloud, family photos, customer accounts or external runtime service introduced',async()=>{
 for(const p of ['research/three-d-08/skinned-shirt.mjs',
  'research/three-d-08/demo.mjs','research/three-d-08/index.html']){
  const text=await readFile(p,'utf8');
  for(const x of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /sendBeacon/,/openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/])
   assert.doesNotMatch(text,x);
 }
});
