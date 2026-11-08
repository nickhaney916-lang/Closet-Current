import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('research/anatomical-neck-seam-159/source-neck-surface.mjs','utf8');
const install=readFileSync('scripts/install-anatomical-neck-seam-159.mjs','utf8');
test('P159 pins exact verified P158 and original MIT female and male head/bone source, rejects release',()=>{
 assert.match(source,/4b7815760104ca4201b59210466cf43d2fd9f8be/);
 assert.match(source,/originalSourceBodyRigBones:163/);
 assert.match(source,/originalMITHeadRigBones:80/);
 assert.match(source,/candidate\.maxBone!==80/);
 assert.match(source,/source\.maxBones!==163/);
 assert.match(source,/familyAlpha:'HOLD',releaseAuthorized:false/);
});
test('P159 actual source skinned vertices are measured independently above and below unchanged P157 mask cutoff',()=>{
 assert.match(source,/o\.applyBoneTransform\(i,tmp\.fromBufferAttribute\(attr,i\)\)/);
 assert.match(source,/o\.skeleton\.update\(\)/);
 assert.match(source,/upper=poseRing\(graft,source,topY,figure,true\)/);
 assert.match(source,/lower=poseRing\(root,source,bottomY,figure,false\)/);
 assert.match(source,/licensed\?80:163/);
 assert.match(source,/sampledOriginalSkinnedVertices:points\.length/);
 assert.match(source,/originalHeadMaskWorldY:cutoff/);
 assert.match(source,/if\(points\.length<6\)fail/);
});
test('P159 creates a true THREE BufferGeometry with computed face normals and no source body or clothing vertex changes',()=>{
 assert.match(source,/new THREE\.BufferGeometry\(\)/);
 assert.match(source,/geometry\.setAttribute\('position',new THREE\.Float32BufferAttribute/);
 assert.match(source,/geometry\.setAttribute\('color',new THREE\.Float32BufferAttribute/);
 assert.match(source,/geometry\.computeVertexNormals\(\)/);
 assert.match(source,/source\.headBone\.attach\(mesh\)/);
 assert.match(source,/sourceMannequinMeshIndicesReplaced:false/);
 assert.match(source,/originalGarmentOrSourceJPEGPixelsModified:false/);
 assert.doesNotMatch(source,/geometry\.setFromPoints|geometry\.deleteAttribute|root\.geometry\s*=|\.setIndex\([^i]|readFile|fetch\(/);
});
test('P159 protects stored user garments and original head texture, cannot accumulate meshes, and fully disposes owned bridge on cleanup',()=>{
 assert.match(source,/o\.userData\?\.work56Garment/);
 assert.match(source,/if\(body<1\|\|bones!==163\|\|garments<1\)/);
 assert.match(source,/duplicate neck transition must not accumulate/);
 assert.match(source,/clearSourceMeasuredNeck159/);
 assert.match(source,/mesh\.geometry\?\.dispose\(\)/);
 assert.match(source,/mesh\.material\?\.dispose\(\)/);
 assert.match(source,/originalLicensedHeadMeshModified:false/);
 assert.match(source,/originalGarmentOrSourceJPEGPixelsModified:false/);
});
test('P159 installer can only compose AFTER verified P157 and P158 inside exact disposable donor, cleanup first',()=>{
 assert.match(install,/arg!=='\.p150-donor-541'/);
 assert.match(install,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(install,/applyLicensedFaceSkinNeck158/);
 assert.match(install,/applySourceMeasuredNeck159\(root,figure,\{source,mask,afterBox,candidate,skinHarmony158,graft\}\)/);
 assert.match(install,/clearSourceMeasuredNeck159\(root\)/);
 assert.match(install,/skinHarmony158,neckTransition159/);
 assert.match(install,/noStagingOrProductionChanges:true/);
});
test('P159 explicitly does not claim topology welding, full pose retarget, photo cloth fitting or real devices',()=>{
 assert.match(source,/physicalNeckSkeletonWeldCompleted:false/);
 assert.match(source,/unverifiedPoseRetargetAccepted:false/);
 assert.match(source,/photorealism10of10Accepted:false/);
 assert.match(source,/physicalPhoneApproval:false/);
 assert.match(source,/physicalNeckTopologyWelded:false/);
 assert.match(source,/originalSourceBodyGeometryAltered:false/);
 assert.match(source,/originalHeadTextureAltered:false/);
});

test('P159 compares real posed MIT upper-neck and original 163-bone torso ring centers rather than unrelated nose/scalp bbox center',()=>{
 assert.match(source,/ringCenterDistance=Math.hypot\(upper.x-lower.x,upper.z-lower.z\)/);
 assert.match(source,/ringCenterDistance>\.125/);
 assert.match(source,/Math.abs\(upper.x-lower.x\)>\.095/);
 assert.match(source,/independently measured MIT neck and original torso rings do not meet/);
 assert.match(source,/donorHeadZ/);
 assert.match(source,/centerLimitZ/);
});

test('P159 original source neck ring excludes shoulder and back vertices by actual 163-bone neck/head skin weights and 10-90% contour midpoint',()=>{
 assert.match(source,/o\.geometry\.attributes\.skinIndex/);
 assert.match(source,/o\.geometry\.attributes\.skinWeight/);
 assert.match(source,/if\(\/neck\|head\/i\.test\(b\.name\|\|''\)\)/);
 assert.match(source,/if\(jointWeight<\.12\)continue/);
 assert.match(source,/midZ=\(lowZ\+highZ\)\*\.5/);
 assert.match(source,/midX=\(lowX\+highX\)\*\.5/);
 assert.match(source,/P159_ORIGINAL_NECK_JOINT_WEIGHTED_RING_MEASURED/);
 assert.match(source,/ringCenterDistance>\.125/);
});
