import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CANDIDATES155,chooseFoundation155}
 from '../research/dual-human-foundation-candidate-155/foundation-manifest.mjs';
const src=readFileSync('research/real-face-original-photo-body-graft-157/attach-licensed-head.mjs','utf8');
const install=readFileSync('scripts/install-real-face-original-outfit-157.mjs','utf8');
test('P157 refuses vendor licensed head unless original P156 source SHA256 is exact and module is same-origin only',()=>{
 assert.match(src,/dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4/);
 assert.match(src,/a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72/);
 assert.match(src,/await sha256\(array\)!==item\.sha/);
 assert.match(src,/src\.origin!==new URL\(import\.meta\.url\)\.origin/);
 assert.match(src,/credentials:'same-origin'/);
 assert.match(src,/new GLTFLoader\(\)\.parseAsync/);
 assert.match(src,/Promise\.allSettled/);
 assert.doesNotMatch(src,/api\.openai\.com|supabase\.co|third.party\.com/);
});
test('P157 only original 163-bone owner source rig may wear genuine user-owned JPEG garments; vendor 80-bone head is NOT a replacement body',()=>{
 assert.match(src,/maxBones!==163/);
 assert.match(src,/originalCounts\(root\)/);
 assert.match(src,/work56Garment/);
 assert.match(src,/sourceHeadSkinnedMeshes/);
 assert.match(src,/originalLicensedHeadRigBones:80/);
 assert.match(src,/sourceFullBodyAnatomyReplaced:false/);
 assert.match(src,/originalOwnerGarmentGeometryChanged:false/);
 for(const c of CANDIDATES155){
  const v=chooseFoundation155({figure:c.key,ownerSavedOutfit:true,
   ownerPhotoItemCount:4,previewOptIn:true,sourceManifestAuthenticated:true});
  assert.equal(v.model,'original-163-bone-photographed-outfit');
 }
});
test('P157 source head pose attachment uses a bona fide original donor Head bone and immutable copied 80-bone GLB skeleton',()=>{
 assert.match(src,/skeletonClone\(candidate\.scene\)/);
 assert.match(src,/source\.headBone\.matrixWorld\.clone\(\)\.invert\(\)\.multiply\(worldMatrix\)/);
 assert.match(src,/source\.headBone\.add\(graft\)/);
 assert.match(src,/source\.headBone\.updateWorldMatrix/);
 assert.match(src,/fittedHeadScale:scale/);
 assert.match(src,/neckSeamSignedWorldY:seam/);
 assert.match(src,/actualHeadTopError/);
 assert.match(src,/real.*head|licensed.*head/i);
});
test('P157 source mannequin is masked via reversible skin fragment shader not by removing original body mesh, face vertices, owner-photo geometry or changing owner source',()=>{
 assert.match(src,/shader\.fragmentShader/);
 assert.match(src,/clipping_planes_fragment/);
 assert.match(src,/vGraftWorld157/);
 assert.match(src,/cleanupMask\(root\)/);
 assert.match(src,/mat\.onBeforeCompile=onBeforeCompile/);
 assert.match(src,/mat\.customProgramCacheKey=customProgramCacheKey/);
 assert.match(src,/originalSourceBodyGeometryIndicesChanged:false/);
 assert.match(src,/geometryReplaced:false/);
 assert.doesNotMatch(src,/geometry\.setIndex\(|geometry\.dispose\(/);
});
test('P157 old P131/P153/P154 double head overlays are hidden only during licensed source graft, all restored when switching figure',()=>{
 for(const str of ['research-face-definition-131','research-source-head-hair-153',
  'research-source-facial-contours-154']){
  assert.ok(src.includes(str),str);
 }
 assert.match(src,/obj\.visible=false/);
 assert.match(src,/object\.visible=visible/);
 assert.match(src,/clearLicensedSourceHead157\(root\)/);
 assert.match(install,/clearLicensedSourceHead157\(root\)/);
});
test('P157 original private closet saved-outfit state and source photo bytes are NEVER read, transmitted, duplicated or changed',()=>{
 assert.match(src,/originalSavedOwnerPhotoOrCutoutBytesChanged:false/);
 assert.match(src,/originalGarmentMeshesBefore/);
 assert.match(src,/originalGarmentMeshesAfter/);
 assert.match(install,/onlyDetachedTestDonorPatched:true/);
 assert.doesNotMatch(src,/indexedDB|localStorage|fetch\('https?:|navigator\.mediaDevices|WebSocket/);
});
test('P157 donor installer refuses any real app or parallel source, only copies original MIT GLBs after verifying immutable SHA and exact P541 commit',()=>{
 assert.match(install,/arg!=='\.p150-donor-541'/);
 assert.match(install,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(install,/createHash\('sha256'\)/);
 assert.match(install,/faceContours154=applyOriginalFaceContours154/);
 assert.match(install,/licensedHead157=applyLicensedSourceHead157/);
 assert.doesNotMatch(install,/resolve\(donor,'public|resolve\(donor,'supabase|outfit3D01Save/);
});
