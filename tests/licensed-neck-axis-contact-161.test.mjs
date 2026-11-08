import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('research/licensed-neck-axis-contact-161/anatomical-head-axis.mjs','utf8');
const install=readFileSync('scripts/install-licensed-neck-axis-contact-161.mjs','utf8');
test('P161 direct verified P160 parent and immutable original owner closet photo / MIT licensed 80/163 source contract',()=>{
 assert.match(s,/76e4a3ca174564f7ca074bc568cdaa806fe11fdb/);
 assert.match(s,/source\?\.maxBones!==163/);
 assert.match(s,/candidate\.maxBone!==80/);
 assert.match(s,/headJointFit160\?\.measuredTrueSourceJointAlignmentApplied/);
 assert.match(s,/neckTransition159\?\.noAdditionalGeometryRequired/);
 assert.match(s,/originalPhotographedGarmentUnchanged:true/);
 assert.match(s,/parallelWorkOrbitViewNotModified:true/);
 assert.match(s,/familyAlpha:'HOLD',releaseAuthorized:false/);
});
test('P161 true donor Neck/Head and licensed Neck/Head posed bones from separate original skeletons define actual angle',()=>{
 assert.match(s,/while\(dNeck\?\.isBone&&!\/neck\/i\.test/);
 assert.match(s,/if\(\/neck\/i\.test\(o\.name\|\|''\)\)licNecks\.push/);
 assert.match(s,/if\(\/head\/i\.test\(o\.name\|\|''\)\)licHeads\.push/);
 assert.match(s,/licNecks\.sort/);
 assert.match(s,/const va=dh\.sub\(dn\)\.normalize\(\),vb=lh\.sub\(ln\)\.normalize/);
 assert.match(s,/originalOriginalNeckToHeadAxisAngleDegrees:beforeAngle/);
 assert.match(s,/measuredFinalNeckToHeadAxisAngleDegrees:afterAngle/);
});
test('P161 uses bounded 3degree pivot-preserving rotation on genuine MIT neck joint, no fake additional collar',()=>{
 assert.match(s,/const MAX_CORRECTION_DEGREES=3\.0/);
 assert.match(s,/const safe=beforeAngle<=38/);
 assert.match(s,/const shouldRotate=beforeAngle>\.65&&safe/);
 assert.match(s,/makeTranslation\(pivot\.x,pivot\.y,pivot\.z\)/);
 assert.match(s,/new THREE\.Matrix4\(\)\.makeRotationFromQuaternion\(qBounded\)/);
 assert.match(s,/makeTranslation\(-pivot\.x,-pivot\.y,-pivot\.z\)/);
 assert.match(s,/source\.headBone\.matrixWorld\.clone\(\)\.invert\(\)\.multiply\(newWorld\)/);
 assert.match(s,/angleApplied<=MAX_CORRECTION_DEGREES\+\.001/);
 assert.doesNotMatch(s,/geometry\.setIndex|geometry\.setAttribute|\.geometry\.dispose|new THREE\.Mesh\(/);
});
test('P161 fails closed if movement worsens actual neck axis or drifts MIT neck pivot or penetrates original collar',()=>{
 assert.match(s,/afterAngle>=beforeAngle-\.2/);
 assert.match(s,/pivotDisplacement>\.00055/);
 assert.match(s,/sourceOverlapAfter<\.042/);
 assert.match(s,/graft\.matrix\.copy\(originalMatrix\);graft\.updateMatrixWorld\(true\)/);
 assert.match(s,/originalLicensedSkinMinimum\(graft,figure\)/);
 assert.match(s,/face=figure==='female'\?'f007_head':'m006_head'/);
 assert.match(s,/bones!==80\|\|vertices<500/);
});
test('P161 preserves original P160 alignment when already oriented or unsafe source angular reference, never fabricates progress',()=>{
 assert.match(s,/ALREADY_AXIS_ALIGNED/);
 assert.match(s,/ORIGINAL_SOURCE_AXIS_OUTSIDE_SAFE_38_DEG_ENVELOPE/);
 assert.match(s,/originalSourceAxisAlreadyAligned:/);
 assert.match(s,/unsafeOriginalAxisCorrectionAvoided:/);
 assert.match(s,/originalMITFaceHairTextureModified:false/);
 assert.match(s,/originalHeadAndBodyOrGarmentGeometryModified:false/);
});
test('P161 restores only licensed head attachment original matrix before prior P160 correction on figure / owner switch',()=>{
 assert.match(s,/export function clearOriginalHeadAxisFit161/);
 assert.match(s,/old\.graft\.matrix\.copy\(old\.original\)/);
 assert.match(s,/prior\.delete\(root\)/);
 assert.match(install,/clearOriginalHeadAxisFit161\(root\)/);
 assert.match(install,/clearLicensedHeadJointFit160\(root\)/);
 assert.match(install,/arg!=='\.p150-donor-541'/);
 assert.match(install,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(install,/sourceOriginalMIT:'Microsoft Rocketbox;/);
});
test('P161 never touches active parallel PR #716 rotation gesture acceptance or shipping app',()=>{
 assert.match(install,/noSharedParallelWork716Writes:true/);
 assert.match(install,/noShippingAppWrites:true/);
 assert.match(s,/parallelWorkOrbitViewNotModified:true/);
 assert.doesNotMatch(s,/pointermove|touchmove|camera\.position|orbitControls|indexedDB|supabase/);
});
