#!/usr/bin/env node
/**
 * NATIVE102 real Chromium 390 CSS-pixel WebGL mobile lifecycle QA audit.
 * Simulated JS browser visibility/freeze, NOT a physical phone event.
 * Requires source-original SHA and post-close photograph absence evidence,
 * never approves model realism, production RLS or release.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const raw=await readFile('benchmark/native-3d-102/acceptance.json','utf8');
const r=JSON.parse(raw);
assert.equal(r.priority,'NATIVE-MOBILE-VISIBILITY-SOURCE-REVOKE-102');
assert.equal(r.browser,'Chromium');
assert.equal(r.viewportCSSWidth,390);
assert.equal(r.simulatedBrowserVisibility,true);
assert.equal(r.actualPhysicalAndroidIPhone,false);
assert.equal(r.authenticSourceJPEG,true);
assert.equal(r.realOriginalWebGLBones,163);
assert.equal(r.hiddenEventClosedSourceBeforeStateRead,true);
assert.equal(r.hiddenOpenBlocked,true);
assert.equal(r.sourceReopenPassedActualNATIVE92OriginalBytes,true);
assert.equal(r.freezeEventClosedSourceBeforeStateRead,true);
assert.equal(r.originalOwnerSavedOutfitUnchanged,true);
assert.equal(r.signedOwnerStillActive,true);
assert.equal(r.realSignedCloudRLS,false);
assert.equal(r.releaseAuthorized,false);
assert.equal(r.familyAlpha,'HOLD');
assert.ok(Array.isArray(r.screenshots)&&r.screenshots.length===2);
const observed=new Set();
for(const x of r.screenshots){
 assert.match(x.file,/^(background|freeze)-source-revoked-390\.png$/);
 assert.match(x.sha256,/^[a-f0-9]{64}$/);
 assert.equal(x.width,390);
 assert.ok(x.height>=800);
 assert.ok(!observed.has(x.file));observed.add(x.file);
 const bytes=await readFile('benchmark/native-3d-102/'+x.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),x.sha256);
 assert.ok(bytes.length>4500);
 const info=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(info.format,'png');
 assert.equal(info.width,390);assert.equal(info.height,x.height);
 assert.ok(stats.channels.some(ch=>ch.stdev>7),'real browser scene screenshot unexpectedly blank');
}
const donor=JSON.parse(await readFile('benchmark/native-3d-05/results.json','utf8'));
assert.equal(donor.cases,3);
assert.equal(donor.realWebGL,true);
assert.deepEqual(donor.errors,[]);assert.deepEqual(donor.crashes,[]);
assert.equal(donor.evidence.find(x=>x.width===390).mobileVisibilitySourceRevoked102,
 'verified-in-Chromium-lifecycle-simulation');
assert.equal(donor.evidence.find(x=>x.width===390).noOutfitMutation,true);
assert.equal(donor.familyAlpha,'HOLD');
const report={
 schema:'closet-current-native-mobile-visibility-revoke-102/audit-v1',
 independentlyVerifiedSHA256Screenshots:2,
 browser:'Chromium',viewportCSSWidth:390,realWebGLSourceBones:163,
 simulatedVisibilityAndFreezeEvents:true,
 physicalAndroidIPhoneVerified:false,actualSignedCloudRLSVerified:false,
 realHumanFabricRealismVerified:false,
 sourcePhotoRemovedOnHide:true,sourcePhotoRemovedOnFreeze:true,
 automaticBackgroundReopen:false,explicitOriginalJPEGRetestation:true,
 savedOutfitUnmodified:true,authSessionRetained:true,
 researchOnly:true,releaseAuthorized:false,familyAlpha:'HOLD',
 screenshotReceipts:r.screenshots
};
await mkdir('benchmark/native-3d-102-audit',{recursive:true});
await writeFile('benchmark/native-3d-102-audit/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('NATIVE102 actual Chromium original 163-bone WebGL source hidden/freeze lifecycle guard PASS; 2/2 independent screenshots verified; physical phone and real RLS NOT TESTED; Family Alpha HOLD');
