import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DENIM_NEUTRAL_LIGHT23,requireSourceNeutralLight23,applySourceNeutralLight23Shader} from '../research/denim-fit-06/source-neutral-light-23.mjs';
const fixture={sourceAssetsVerified:true,originalVerified:true,cutoutVerified:true,
 frontOrientationReviewed:true,visibleSourceRGBPreserved:true,
 ownerApproved:false,releaseAuthorized:false,
 sourceSHA256:'a'.repeat(64),cutoutSHA256:'b'.repeat(64),
 neutralColorRGB:[43,67,91]};
test('P23 authenticated original front and neutral derived RGB only, otherwise fail closed',()=>{
 const v=requireSourceNeutralLight23(fixture,{enabled:true});
 assert.equal(v.enabled,true);
 assert.equal(v.originalRoughness,.96);
 assert.ok(v.neutralRoughness>=.65&&v.neutralRoughness<=.82);
 assert.equal(v.sourcePhotoPreserved,true);
 assert.equal(v.unseenRearImageGenerated,false);
 assert.equal(requireSourceNeutralLight23(null).enabled,false);
 for(const p of ['sourceAssetsVerified','originalVerified','cutoutVerified',
  'frontOrientationReviewed','visibleSourceRGBPreserved']){
  assert.throws(()=>requireSourceNeutralLight23({...fixture,[p]:false},{enabled:true}),/P23 refuses/);
 }
 assert.throws(()=>requireSourceNeutralLight23({...fixture,sourceSHA256:'oops'},{enabled:true}),/P23 refuses/);
 assert.throws(()=>requireSourceNeutralLight23({...fixture,ownerApproved:true},{enabled:true}),/P23 refuses/);
});
test('P23 restores unchanged baseline except genuinely unphotographed original pixels',()=>{
 const glsl='void main(){\n#include <color_fragment>\nfloat sourcePantsOpacity=1.0;\n#include <roughnessmap_fragment>\n}';
 assert.equal(applySourceNeutralLight23Shader(glsl,fixture),glsl);
 const out=applySourceNeutralLight23Shader(glsl,fixture,{enabled:true});
 assert.ok(out.includes('sourceNeutralUnphotographed23'));
 assert.ok(out.includes('1.0 - smoothstep(0.01,0.10,sourcePantsOpacity)'));
 assert.ok(out.includes('roughnessFactor = mix(roughnessFactor,0.68,sourceNeutralUnphotographed23)'));
 assert.ok(!/noise|sin\(|fract\(|pocket|rearTexture/i.test(out));
 assert.throws(()=>applySourceNeutralLight23Shader(glsl.replace('sourcePantsOpacity','sourceMissing'),fixture,{enabled:true}),/P23 missing/);
 assert.throws(()=>applySourceNeutralLight23Shader(out,fixture,{enabled:true}),/double-installed/);
});
test('P23 explicitly opt-in exact P22 source + never replace original photographed source',()=>{
 const p=readFileSync('research/three-d-30/reviewed-photo-pants.mjs','utf8');
 const app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 const ctl=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8');
 assert.ok(p.includes("material.customProgramCacheKey=()=> 'cc3d30-reviewed-pants-front-v1'"),
  'protected original photograph projection must remain baseline code');
 assert.ok(!p.includes('sourceNeutralMaterial23'),
  'P23 must not edit or opt-in from protected shared 3D30 source projection');
 const neutral=readFileSync('research/denim-fit-06/source-neutral-light-23.mjs','utf8');
 assert.ok(neutral.includes('export function installSourceNeutralLight23'));
 assert.ok(neutral.includes('applySourceNeutralLight23Shader'));
 assert.ok(neutral.includes("unseenRearImageGenerated23:false"));
 assert.ok(neutral.includes('originalPhotoShaderProtected23:true'));
 assert.ok(ctl.includes('sourceDenimMaterial23&&!sourceDenimCuffStack22'));
 assert.ok(app.includes("get('denimMaterial23')==='after'"));
 assert.ok(app.includes('sourceDenimMaterial23Enabled'));
 assert.equal(DENIM_NEUTRAL_LIGHT23.humanVisualApproval,false);
});
