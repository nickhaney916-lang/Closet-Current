import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const mod=readFileSync('research/licensed-face-skin-neck-harmony-158/skin-neck-harmony.mjs','utf8');
const installer=readFileSync('scripts/install-licensed-face-skin-neck-158.mjs','utf8');
test('P158 pins only real public-licensed female and male P156 facial albedo; never reads owner photos',()=>{
 assert.match(mod,/dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4/);
 assert.match(mod,/a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72/);
 assert.match(mod,/candidate\.sha256!==expected/);
 assert.match(mod,/material\?\.map\?\.image/);
 assert.match(mod,/ctx\.getImageData/);
 assert.match(mod,/sourceFaceAlbedoSamplePixels/);
 assert.doesNotMatch(mod,/indexedDB|localStorage|WebSocket|navigator\.mediaDevices|api\.openai\.com|supabase\.co/);
});
test('P158 updates only existing P118 source skin-only shader and never licensed face or photo garment textures',()=>{
 assert.match(mod,/vec3 skinTone118=vec3\(\.66,\.445,\.36\)/);
 assert.match(mod,/fragmentShader\.split\(original\)/);
 assert.match(mod,/shader\.fragmentShader=shader\.fragmentShader\.replace\(original,replacement\)/);
 assert.match(mod,/o\.userData\?\.work56Garment/);
 assert.match(mod,/if\(owned\.has\(m\)\)/);
 assert.match(mod,/originalOwnedGarmentMaterialModified:false/);
 assert.match(mod,/licensedOriginalFaceTextureOrAlbedoModified:false/);
 assert.match(mod,/sourceJPEGOrCutoutModified:false/);
 assert.doesNotMatch(mod,/\.setIndex\(|\.setAttribute\(|geometry\.dispose\(|\.image\.data\.set\(/);
});
test('P158 enforces full source rig, original source plus actual P157 attached head, and immune to dual application',()=>{
 assert.match(mod,/source\.maxBones!==163/);
 assert.match(mod,/donorBones!==163/);
 assert.match(mod,/research-licensed-source-head-graft-157/);
 assert.match(mod,/changed\.has\(root\)/);
 assert.match(mod,/no synthetic complexion/);
 assert.match(mod,/sourceFaceAlbedoSRGB/);
 assert.match(mod,/originalOwnerGarmentMeshesBefore/);
 assert.match(mod,/originalOwnerGarmentMeshesAfter/);
});
test('P158 preserves original P157 neck mask and exact material compile hooks on cleanup',()=>{
 assert.match(mod,/const cutoff=source\.top-source\.h\*\.84/);
 assert.match(mod,/mat\.onBeforeCompile=x\.oldCompile/);
 assert.match(mod,/mat\.customProgramCacheKey=x\.oldKey/);
 assert.match(mod,/mat\.needsUpdate=true/);
 assert.match(mod,/anatomicalNeckWeldIndependentlyApproved:false/);
});
test('P158 installer composes after P157 SHA source graft and clears first before old P157 material callback restore',()=>{
 assert.match(installer,/arg!=='\.p150-donor-541'/);
 assert.match(installer,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(installer,/clearLicensedFaceSkinNeck158\(root\)/);
 assert.match(installer,/applyLicensedFaceSkinNeck158\(root,figure,source,candidate\)/);
 assert.match(installer,/skinHarmony158/);
 assert.match(installer,/only exact disposable donor/);
 assert.doesNotMatch(installer,/resolve\(donor,'public|resolve\(donor,'supabase|production-deploy/);
});
test('P158 never claims release or new anatomical garment fitting and stays Family Alpha HOLD',()=>{
 assert.match(mod,/skinColorHumanVisuallyApproved:false/);
 assert.match(mod,/physicalPhoneApproved:false/);
 assert.match(mod,/familyAlpha:'HOLD',releaseAuthorized:false/);
 assert.match(mod,/sourceLicensedHeadRigBones:80/);
 assert.match(mod,/originalBodyGeometryModified:false/);
});

test('P158 independent visual protection samples actual dark original garment and licensed source face pixels, not a rectangular exposed-skin mix',()=>{
 const audit=readFileSync('scripts/audit-licensed-face-skin-neck-harmony-158.mjs','utf8');
 assert.match(audit,/function protectedSurface\(/);
 assert.match(audit,/result\.photographedDarkDress=protectedSurface/);
 assert.match(audit,/result\.originalLicensedDarkHead=protectedSurface/);
 assert.match(audit,/result\.photographedDarkDress\.changedFraction>\.025/);
 assert.match(audit,/result\.originalLicensedDarkHead\.changedFraction>\.08/);
 assert.match(audit,/skinAfter<100/);
 assert.match(mod,/const palettes=new Map\(\)/);
 assert.match(mod,/if\(palettes\.has\(paletteKey\)\)return palettes\.get\(paletteKey\)/);
 assert.match(mod,/candidate\.sha256!==expected/);
});
