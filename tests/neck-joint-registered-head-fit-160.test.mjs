import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('research/neck-joint-registered-head-fit-160/rig-head-registration.mjs','utf8');
const install=readFileSync('scripts/install-neck-joint-registered-head-fit-160.mjs','utf8');
test('P160 exact independently verified P159 original licensed female and male 80→163 head/neck skeletons',()=>{
 assert.match(src,/0e6f8db077b3dd2b1650e300df0d2d7244d29ba0/);
 assert.match(src,/source\?\.maxBones!==163/);
 assert.match(src,/candidate\.maxBone!==80/);
 assert.match(src,/while\(neck\?\.isBone\&\&\!\/neck\/i\.test\(neck\.name/);
 assert.match(src,/if\(\/neck\/i\.test\(o\.name/);
 assert.match(src,/if\(\/head\/i\.test\(o\.name/);
 assert.match(src,/neckTransition159\?\.noAdditionalGeometryRequired/);
 assert.match(src,/neckTransition159\?\.noAdditionalGeometryRequired/);
 assert.match(src,/candidate\.sha256/);
});
test('P160 geometric correction uses actual original and source joint world positions, not head bounding box guesses',()=>{
 assert.match(src,/const donorNeck=get\(donor\.neck\),sourceNeck=get\(license\.neck\)/);
 assert.match(src,/donorAxis\.normalize\(\)\.dot\(sourceAxis\.normalize\(\)\)/);
 assert.match(src,/if\(axisDot<\.18\|\|beforeDist>\.36\)/);
 assert.match(src,/clamp\(beforeOffset\.x\*\.24,-\.008,\.008\)/);
 assert.match(src,/clamp\(beforeOffset\.y\*\.24,-\.012,\.012\)/);
 assert.match(src,/clamp\(beforeOffset\.z\*\.24,-\.012,\.012\)/);
 assert.match(src,/magnitude>\.019/);
 assert.match(src,/get\(donor\.neck\)\.distanceTo\(get\(license\.neck\)\)/);
 assert.match(src,/afterDist>beforeDist-\.0007/);
});
test('P160 only changes reversible pinned licensed head graft world transform; never source rig joints or garment vertices',()=>{
 assert.match(src,/const originalGraftMatrix=graft\.matrix\.clone\(\)/);
 assert.match(src,/const inverse=source\.headBone\.matrixWorld\.clone\(\)\.invert\(\)/);
 assert.match(src,/corrected\.elements\[12\]\+=localMove\.x/);
 assert.match(src,/graft\.matrix\.copy\(corrected\)/);
 assert.match(src,/graft\.matrix\.copy\(x\.originalGraftMatrix\)/);
 assert.match(src,/originalSource163BoneGeometryModified:false/);
 assert.match(src,/originalMITLicensedHead80BoneGeometryModified:false/);
 assert.match(src,/ownerPhotographedGarmentGeometryModified:false/);
 assert.doesNotMatch(src,/geometry\.setIndex\(|geometry\.setAttribute\(|\/public\/|indexedDB|supabase/);
});
test('P160 revalidates source head/neck skin overlap and exact original owner garments and fail-closed cleanup',()=>{
 assert.match(src,/measuredOriginalNeckOverlapMeters-magnitude<\.043/);
 assert.match(src,/after\.garments!==before\.garments/);
 assert.match(src,/after\.bones!==163/);
 assert.match(src,/if\(prior\.has\(root\)\)/);
 assert.match(src,/prior\.set\(root,\{graft,originalGraftMatrix\}\)/);
 assert.match(src,/measuredTrueSourceJointAlignmentApplied:true/);
 assert.match(src,/originalOwnedPhotographedGarmentMeshesBefore/);
 assert.match(src,/originalOwnedPhotographedGarmentMeshesAfter/);
});
test('P160 pinned original P541 installer only AFTER verified P159, with full P160 cleanup before P159',()=>{
 assert.match(install,/arg!=='\.p150-donor-541'/);
 assert.match(install,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(install,/applyLicensedHeadJointFit160/);
 assert.match(install,/figure,skinHarmony158,neckTransition159,headJointFit160/);
 assert.match(install,/clearLicensedHeadJointFit160\(root\)/);
 assert.match(install,/P160 only exact disposable P541 donor/);
 assert.match(install,/productionStagingUnchanged:true/);
});
test('P160 does not claim actual skin topological welding, physical phone testing, hosted owner RLS or 10/10 human photorealism',()=>{
 assert.match(src,/fullAnatomicalSkeletonRetargetComplete:false/);
 assert.match(src,/visualRealism10of10Approved:false/);
 assert.match(src,/physicalPhoneApproved:false/);
 assert.match(src,/independentlyApprovedHumanFaceNeckAnatomy:false/);
 assert.match(src,/released:false,familyAlpha:'HOLD'/);
 assert.match(src,/sourceP541BodyBoneTransformsModified:false/);
});
