import test from 'node:test';
import assert from 'node:assert/strict';
import {VISIBLE_SKIN_152,repairPinnedP118Shader152,assertP152ShaderScope}
 from '../research/dual-humanoid-visible-skin-152/pinned-p118-shader-repair.mjs';
const originalRough=String.raw`    roughnessFactor=mix(roughnessFactor,.70+skinCloud118*.035,uNaturalSkin118*(1.0-baseCoverage));
    ${rough}`;
const fixture=()=>`// pin
const rough='#include <roughnessmap_fragment>';
if(!shader.fragmentShader.includes(rough))throw Error('REAL118 expected standard PBR roughness stage');
const marker='diffuseColor.rgb=mix(diffuseColor.rgb,neutralCloth,baseCoverage);';
shader.fragmentShader=shader.fragmentShader.replace(rough,\`
${originalRough}\`);
`+'x'.repeat(1100);
test('P152 original P118 fragment references roughnessFactor before original Three.js declaration',()=>{
 const before=fixture();
 const s=before.slice(before.indexOf('shader.fragmentShader=shader.fragmentShader.replace(rough,'));
 assert.ok(s.indexOf('roughnessFactor=mix(')<s.indexOf('${rough}'));
 assert.equal(VISIBLE_SKIN_152.familyAlpha,'HOLD');
 assert.equal(VISIBLE_SKIN_152.garmentGeometryChanged,false);
});
test('P152 precise, reversible single shader-scope order repair preserves entire remaining module',()=>{
 const input=fixture(),result=repairPinnedP118Shader152(input);
 assert.equal(result.changedOnlyRoughnessOrder,true);
 assert.equal(result.preserveSourceGeometry,true);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.content.length,input.length);
 assert.notEqual(result.content,input);
 const fragment=result.content.slice(result.content.indexOf('shader.fragmentShader=shader.fragmentShader.replace(rough,'));
 assert.equal(assertP152ShaderScope(fragment.replace('${rough}','<escape />')),true);
 // The fixed source must keep the Three.js roughnessmap include BEFORE
 // the custom skin roughness factor. No model, material or JPEG code changes.
 const left=fragment.indexOf('${rough}');
 const right=fragment.indexOf('roughnessFactor=mix(');
 assert.ok(left<right&&left>=0);
 assert.equal(input.includes('skinTone118'),false);
});
test('P152 fail closed on a duplicate anchor, already patched source and modified/unpinned fragment',()=>{
 const input=fixture(),safe=repairPinnedP118Shader152(input).content;
 assert.throws(()=>repairPinnedP118Shader152(safe),/P152 refused/);
 assert.throws(()=>repairPinnedP118Shader152(input+originalRough),/P152 refused/);
 assert.throws(()=>repairPinnedP118Shader152('too small'),/P152 refused/);
 assert.throws(()=>repairPinnedP118Shader152(input.replace('baseCoverage','missingCoverage')),
  /P152 refused/);
});
test('P152 rejects any regression where roughnessFactor assignment moves before standard roughness fragment',()=>{
 assert.equal(assertP152ShaderScope('#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.7,1.0);'),true);
 assert.throws(()=>assertP152ShaderScope('roughnessFactor=mix(roughnessFactor,.7,1.0);\n#include <roughnessmap_fragment>'),/before its declaration/);
 assert.throws(()=>assertP152ShaderScope('roughnessFactor=mix(roughnessFactor,.7,1.0);'),/required/);
});
