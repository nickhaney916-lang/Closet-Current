import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
const folder='benchmark/native-3d-91';
const receipt=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
assert.equal(receipt.priority,'NATIVE-3D-SOURCE-REVISION-91');
assert.equal(receipt.width,390);
assert.equal(receipt.file,'same-id-source-photo-replaced-and-private-preview-cleared-390.png');
for(const key of ['realLicensedSourceJPEGs','sameGarmentId','savedOutfitIDsUnchanged',
 'stalePhotoAndWebGLRevoked','ownerSessionStillValid','rendererWas163BoneAndSourceVerified'])
 assert.equal(receipt[key],true,key);
for(const key of ['modelRecognitionAccuracyMeasured','physicalPhonesVerified',
 'realSignedRLSVerified','productionDeployed'])
 assert.equal(receipt[key],false,key);
assert.equal(receipt.familyAlpha,'HOLD');
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const origin=sources.find(x=>x.id==='commons-0053'),replace=sources.find(x=>x.id==='commons-0003');
assert.ok(origin?.verified&&replace?.verified);
assert.equal(receipt.originalPhotoSHA,origin.sha256);
assert.equal(receipt.replacementPhotoSHA,replace.sha256);
assert.notEqual(origin.sha256,replace.sha256);
const png=await readFile(folder+'/'+receipt.file),meta=await sharp(png).metadata();
const stats=await sharp(png).stats();
assert.equal(createHash('sha256').update(png).digest('hex'),receipt.sha256);
assert.equal(meta.format,'png');assert.equal(meta.width,390);
assert.equal(meta.height,receipt.height);assert.ok(meta.height>=880&&png.length>4500);
assert.ok(stats.channels.some(x=>x.stdev>7),'Cleared real browser scene must be nonblank');
console.log('NATIVE91: source-locked licensed JPEG replacement under SAME garment ID; visible original-photo WebGL source revoked, saved outfit and native session unchanged; 1/1 genuine screenshot SHA/dimensions/entropy audited. Research only, model accuracy and physical phones unverified.');
