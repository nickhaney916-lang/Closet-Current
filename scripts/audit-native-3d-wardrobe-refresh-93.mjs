import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/native-3d-93';
const receipt=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
assert.equal(receipt.priority,'NATIVE-3D-WARDROBE-REFRESH-93');
assert.equal(receipt.file,'post-open-unchanged-SHA-photo-bytes-revoked-390.png');
assert.equal(receipt.width,390);
for(const property of ['sourcePhotoPreviouslyRendered','savedGarmentIdUnchanged',
 'shaMetadataIntentionallyUnchanged','ownerWardrobeRevisionIncremented',
 'automaticVisible3DRevocation','privatePhotoRemovedBeforeStateRead',
 'reOpenCorruptSourceBlockedByWebCrypto','privateSavedBoardUnchanged',
 'validNativeOwnerSessionPreserved'])
 assert.equal(receipt[property],true,'Missing owner-safe post-open byte-revision evidence: '+property);
for(const property of ['physicalPhoneVerified','realSignedCloudVerified',
 'modelAccuracyMeasured','productionDeployed'])
 assert.equal(receipt[property],false,property);
assert.equal(receipt.realOriginalWebGLBones,163);
assert.equal(receipt.familyAlpha,'HOLD');
const lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const original=lock.find(x=>x.id==='commons-0053');
const replacement=lock.find(x=>x.id==='commons-0003');
assert.equal(original?.verified,true);
assert.equal(replacement?.verified,true);
assert.equal(receipt.originalSHA,original.sha256);
assert.equal(receipt.unapprovedBytesSHA,replacement.sha256);
assert.notEqual(receipt.originalSHA,receipt.unapprovedBytesSHA);
const buf=await readFile(folder+'/'+receipt.file);
const meta=await sharp(buf).metadata(),stats=await sharp(buf).stats();
assert.equal(createHash('sha256').update(buf).digest('hex'),receipt.sha256);
assert.equal(meta.format,'png');
assert.equal(meta.width,390);
assert.equal(meta.height,receipt.height);
assert.ok(meta.height>=880&&buf.length>4500);
assert.ok(stats.channels.some(x=>x.stdev>7),'Revoked genuine native browser view is blank');
console.log('NATIVE93 PASS 1/1 independent original mobile browser screenshot SHA/dimensions/nonblank audit. Real 163-bone source-photo rendered BEFORE unchanged-SHA byte tamper; native wardrobe refresh revoked old visible photo without changing saved board. Physical phone, signed cloud and model accuracy NOT VERIFIED.');
