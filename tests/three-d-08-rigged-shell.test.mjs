import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SHELL_LIMITS,buildAnatomicalGarmentShell} from '../research/three-d-08/rigged-shirt-shell.mjs';
test('Actual anatomical garment is separate skinned shell geometry, never source body material',async()=>{
 const source=await readFile('research/three-d-08/rigged-shirt-shell.mjs','utf8');
 assert.match(source,/new THREE\.SkinnedMesh\(geometry,material\)/);
 assert.match(source,/outer\.bind\(src\.skeleton,src\.bindMatrix\.clone\(\)\)/);
 assert.match(source,/src\.parent\.add\(outer\)/);
 assert.match(source,/src\.geometry\.clone\(\)/);
 assert.match(source,/outer\.userData\.garmentShell=true/);
 assert.match(source,/amount=\.007/);
 assert.match(source,/uImage/);
 assert.match(source,/texture2D\(uImage,uv\)/);
 assert.match(source,/if\(present<\.5\)discard/);
 assert.equal(SHELL_LIMITS.shirtTop>1.6,true);
 assert.equal(SHELL_LIMITS.originalBackPhotograph,undefined);
});
test('Anatomical shell fails closed on unreviewed or non-source images',()=>{
 assert.throws(()=>buildAnatomicalGarmentShell(null,null));
 assert.throws(()=>buildAnatomicalGarmentShell({traverse(){}},{verified:false}));
 assert.throws(()=>buildAnatomicalGarmentShell({traverse(){}},{
  verified:true,ownerApproved:true,releaseAuthorized:false,textureImage:{}
 }));
 assert.throws(()=>buildAnatomicalGarmentShell({traverse(){}},{
  verified:true,ownerApproved:false,releaseAuthorized:false,textureImage:{}
 }),/No real skinned/);
});
test('Maintains source-only Work47 review and genuine original rig switching',async()=>{
 const [viewer,demo]=await Promise.all([
  readFile('research/three-d-06/anatomical-showroom.mjs','utf8'),
  readFile('research/three-d-08/demo.mjs','utf8')
 ]);
 assert.match(viewer,/applyShirtShell=/);
 assert.match(viewer,/buildAnatomicalGarmentShell\(selected,source\)/);
 assert.match(viewer,/if\(actualShirtShell\)\{actualShirtShell\.dispose\(\)/);
 assert.match(viewer,/if\(obj\.userData\.garmentShell\)return/);
 assert.match(viewer,/clearShirt\(\);\s*selected=obj/);
 assert.match(viewer,/realGarmentGeometry:true/);
 assert.match(viewer,/actualTailoredFit:false/);
 assert.match(demo,/event\?\.isTrusted/);
 assert.match(demo,/app\.applyShirtShell\(source,\{acknowledged:true\}\)/);
 assert.match(demo,/loadLicensedCutout\(LICENSED_SHIRT/);
 assert.match(demo,/\.\.\/three-d-07\/rig-shirt-transfer\.mjs/);
 assert.match(demo,/readVerifiedAsset/);
 assert.match(demo,/app\.clearShirt\(\)/);
});
test('Separate mesh cannot quietly represent reconstructed rear or tailored fit',async()=>{
 const [source,viewer]=await Promise.all([
  readFile('research/three-d-08/rigged-shirt-shell.mjs','utf8'),
  readFile('research/three-d-06/anatomical-showroom.mjs','utf8')
 ]);
 assert.match(source,/photographedRear:false/);
 assert.match(source,/releaseAuthorized:false/);
 assert.match(source,/visualApproval:false/);
 assert.match(viewer,/inferredRear:true/);
 assert.match(viewer,/actualTailoredFit:false/);
});
test('Only standalone research changes; zero customer cloud, paid model or remote browser dependencies',async()=>{
 for(const path of ['research/three-d-08/rigged-shirt-shell.mjs','research/three-d-08/demo.mjs',
 'research/three-d-08/index.html','research/three-d-06/anatomical-showroom.mjs']){
  const s=await readFile(path,'utf8');
  for(const bad of [/supabase\.co/,/indexedDB/,/getUserMedia/,/openai\.com/,
    /localStorage/,/sendBeacon/,/cdn\.jsdelivr/,/unpkg\.com/])
   assert.doesNotMatch(s,bad);
 }
 const html=await readFile('research/three-d-08/index.html','utf8');
 assert.match(html,/separate skinned outer garment mesh/);
 assert.match(html,/id="dress" type="button" disabled/);
});
