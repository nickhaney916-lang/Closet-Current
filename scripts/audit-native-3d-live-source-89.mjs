import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/native-3d-89';
const a=JSON.parse(await readFile(folder+'/acceptance.json','utf8'));
assert.equal(a.priority,'NATIVE-3D-LIVE-SOURCE-89');
assert.equal(a.width,390);
assert.equal(a.file,'stale-photo-preview-cleared-390.png');
for(const property of ['originalOutfitPrivate','oldSource3DRemoved',
 'originalBoardUnmodified','nativeSessionActive','actualModelAlreadyRendered'])
 assert.equal(a[property],true,property);
for(const property of ['physicalPhoneVerified','realSignedCloudVerified','productionDeployed'])
 assert.equal(a[property],false,property);
assert.equal(a.familyAlpha,'HOLD');
const b=await readFile(folder+'/'+a.file),meta=await sharp(b).metadata(),stats=await sharp(b).stats();
const hash=createHash('sha256').update(b).digest('hex');
assert.equal(hash,a.sha256,'Screenshot bytes do not match real WebGL source-revocation receipt');
assert.equal(meta.format,'png');assert.equal(meta.width,390);
assert.equal(meta.height,a.height);assert.ok(meta.height>=880&&b.length>4500);
assert.ok(stats.channels.some(c=>c.stdev>7),'Actual cleared-source UI screenshot cannot be blank');
console.log('NATIVE89 1/1 independent revoked 3D source UI screenshot SHA/dimension/nonblank audit PASS; 15 native donor WebGL screenshots independently audited separately. Physical phones/real signed cloud NOT VERIFIED.');
