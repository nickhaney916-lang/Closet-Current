import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 DENIM_NEUTRAL_WEAVE25,requireModeledNeutralWeave25,
 applyModeledNeutralWeave25Shader,installModeledNeutralWeave25
} from '../research/denim-fit-06/source-neutral-weave-25.mjs';
import {PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND} from '../research/three-d-30/reviewed-photo-pants.mjs';

const valid={
 id:PANTS_RESEARCH_SOURCE.id,
 sourceAssetsVerified:true,originalVerified:true,cutoutVerified:true,
 frontOrientationReviewed:true,visibleSourceRGBPreserved:true,
 ownerApproved:false,releaseAuthorized:false,neutralColorRGB:[43,67,91],
 sourceSHA256:'a'.repeat(64),cutoutSHA256:'b'.repeat(64)
};
const original='varying vec2 vPantsSourceUV; float sourcePantsOpacity=0.0;\nfloat sourceNeutralUnphotographed23=1.0;\nfloat sourceNeutralFiberGrazing23=1.0;\ndiffuseColor.rgb *= (1.0 + 0.28 * sourceNeutralFiberGrazing23 * sourceNeutralUnphotographed23);';

test('P25 exact source photo and P23 required, otherwise fail closed',()=>{
 assert.equal(requireModeledNeutralWeave25(valid).enabled,false);
 assert.equal(requireModeledNeutralWeave25(valid,{enabled:true}).enabled,true);
 assert.equal(DENIM_NEUTRAL_WEAVE25.version,25);
 assert.equal(DENIM_NEUTRAL_WEAVE25.unseenRearImageGenerated,false);
 assert.equal(DENIM_NEUTRAL_WEAVE25.physicallyMeasuredWeave,false);
 for(const field of ['sourceAssetsVerified','originalVerified','cutoutVerified','frontOrientationReviewed','visibleSourceRGBPreserved'])
  assert.throws(()=>requireModeledNeutralWeave25({...valid,[field]:false},{enabled:true}));
 assert.throws(()=>requireModeledNeutralWeave25({...valid,sourceSHA256:'unverified'},{enabled:true}));
 assert.throws(()=>requireModeledNeutralWeave25({...valid,ownerApproved:true},{enabled:true}));
 assert.throws(()=>requireModeledNeutralWeave25({...valid,id:'unknown-photo-source'},{enabled:true}));
 assert.equal(requireModeledNeutralWeave25({...valid,id:PANTS_RESEARCH_SOURCE_SECOND.id},{enabled:true}).enabled,true);
});

test('P25 original photographed-front/P23 shader unchanged unless explicit opt-in',()=>{
 assert.equal(applyModeledNeutralWeave25Shader(original,valid),original);
 const s=applyModeledNeutralWeave25Shader(original,valid,{enabled:true});
 for(const token of ['sourceNeutralWarpPhase25','sourceNeutralWeftPhase25','sourceNeutralUnphotographed23',
  'sourceNeutralTwill25','fwidth(sourceNeutralWarpPhase25)','fwidth(sourceNeutralWeftPhase25)',
  '0.065 * sourceNeutralTwill25 * sourceNeutralUnphotographed23','1.0 + sourceNeutralFabricRelief25',
  'diffuseColor.rgb *= (1.0 + 0.28 * sourceNeutralFiberGrazing23 * sourceNeutralUnphotographed23)'])
  assert.ok(s.includes(token),token);
 assert.equal((s.match(/sourceNeutralTwill25 = /g)||[]).length,1);
 assert.throws(()=>applyModeledNeutralWeave25Shader(s,valid,{enabled:true}),/P25 refuses/);
 assert.throws(()=>applyModeledNeutralWeave25Shader(original.replace('vPantsSourceUV','badUV'),valid,{enabled:true}),/P25 refuses/);
 assert.throws(()=>applyModeledNeutralWeave25Shader(original.replaceAll('sourceNeutralUnphotographed23','badMask'),valid,{enabled:true}),/P25 refuses/);
 assert.throws(()=>applyModeledNeutralWeave25Shader('void main() {}',valid,{enabled:true}),/P25 refuses/);
 assert.ok(!/pocket|fetch\s*\(|texture2D\s*\(|sampler2D|new Image\(|seamPhoto/.test(s));
});

test('P25 guarded real skinned mesh source and original RGB, no replacement resources',()=>{
 assert.equal(installModeledNeutralWeave25(null,valid),null);
 assert.throws(()=>installModeledNeutralWeave25(null,valid,{enabled:true}),/P25 requires/);
 const pseudo={meshes:[{isSkinnedMesh:true,geometry:{getAttribute:k=>k==='pantsSourceUV'?{}:k==='pantsSourceFront'?{}:null},
  material:{isMeshStandardMaterial:true,onBeforeCompile:()=>{},userData:{},needsUpdate:false}}],stats:{
   sourceNeutralMaterial23:true,photoApplied:true,sourceSHA256:valid.sourceSHA256,cutoutSHA256:valid.cutoutSHA256,
   originalPhotoShaderProtected23:true,unseenRearImageGenerated23:false},dispose(){}};
 const p=installModeledNeutralWeave25(pseudo,valid,{enabled:true});
 assert.equal(p.stats.sourceNeutralModeledTwill25,true);
 assert.equal(p.stats.sourceNeutralTwillNotPhoto25,true);
 assert.equal(p.stats.originalSourceJPEGUVSkinRestUnchanged25,true);
 assert.equal(p.stats.noRearPhotoGenerated25,true);
 assert.equal(p.stats.releaseAuthorized,false);
 assert.ok(p.meshes[0].material.customProgramCacheKey().includes('modeled-neutral-twill25'));
 assert.throws(()=>installModeledNeutralWeave25({...pseudo,stats:{...pseudo.stats,sourceSHA256:'c'.repeat(64)}},valid,{enabled:true}),/P25 requires/);
 const shader={fragmentShader:original};
 p.meshes[0].material.onBeforeCompile(shader);
 assert.equal(p.meshes[0].material.userData.cc25SourceNeutralWeaveCompiled,true);
 assert.ok(shader.fragmentShader.includes('sourceNeutralFabricRelief25'));
});

test('P25 remains no-asset no-production research opt-in, backed by original 3D30',()=>{
 const source=readFileSync('research/denim-fit-06/source-neutral-weave-25.mjs','utf8');
 const guard=readFileSync('research/three-d-30/reviewed-photo-pants.mjs','utf8');
 const runtime=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 const controller=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8');
 const viewer=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8');
 assert.ok(guard.includes("material.customProgramCacheKey=()=> 'cc3d30-reviewed-pants-front-v1'"));
 assert.ok(!guard.includes('sourceNeutralTwill25'));
 assert.ok(source.includes('originalSourceJPEGUVSkinRestUnchanged25:true'));
 assert.ok(source.includes('fwidth(sourceNeutralWarpPhase25)'));
 assert.ok(!/fetch\s*\(|new THREE\.Texture|new THREE\.Mesh|geometry\.setAttribute/.test(source));
 assert.ok(runtime.includes("get('denimWeave25')==='after'"));
 assert.ok(controller.includes('installModeledNeutralWeave25'));
 assert.ok(viewer.includes('cc25SourceNeutralWeaveCompiled'));
 assert.ok(viewer.includes('sourceDenimWeave25Enabled'));
});
