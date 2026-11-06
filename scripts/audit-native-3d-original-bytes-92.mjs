import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/native-3d-92';
const r=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(r.priority,'NATIVE-3D-ORIGINAL-JPEG-BYTES-92');
assert.equal(r.file,'forged-unchanged-SHA-blocked-before-WebGL-390.png');
assert.equal(r.width,390);
for(const p of ['licensedOriginalJPEGs','shaMetadataIntentionallyUnchanged',
 'genuineBrowserWebCryptoRejectsBytes','donorNotOpenedForMismatchedBytes',
 'savedBoardUnchanged','ownerSessionPreserved'])
 assert.equal(r[p],true,'Missing actual original-photo byte integrity proof: '+p);
for(const p of ['physicalPhoneVerified','realSignedCloudVerified',
 'modelAccuracyMeasured','productionDeployed'])assert.equal(r[p],false,p);
assert.equal(r.familyAlpha,'HOLD');
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const origin=manifest.find(x=>x.id==='commons-0053'),
 alternative=manifest.find(x=>x.id==='commons-0003');
assert.ok(origin?.verified&&alternative?.verified);
assert.equal(r.originalSHA,origin.sha256);assert.equal(r.replacementBytesSHA,alternative.sha256);
assert.notEqual(r.originalSHA,r.replacementBytesSHA);
const png=await readFile(dir+'/'+r.file);
const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
assert.equal(createHash('sha256').update(png).digest('hex'),r.sha256);
assert.equal(meta.format,'png');assert.equal(meta.width,390);
assert.equal(meta.height,r.height);assert.ok(meta.height>=880&&png.length>4500);
assert.ok(stats.channels.some(x=>x.stdev>7),'Blocked browser viewer image blank');
console.log('NATIVE92 1/1 genuine browser SHA-bound PNG, real licensed different JPEG under unchanged SHA correctly blocked before 3D donor. Family Alpha HOLD; no physical phone/AI accuracy/RLS acceptance.');
