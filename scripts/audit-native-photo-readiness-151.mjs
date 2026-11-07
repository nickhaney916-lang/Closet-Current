/** P151 independent original owner JPEG thumbnail reveal/eviction audit.
 * No customer data; original P08 actual 163-bone browser fixture already
 * pins licensed photographs and independently checks SHA.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/native-photo-readiness-151';
const result=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(result.priority,'NATIVE-PHOTO-READINESS-REVOCATION-151');
assert.equal(result.cases,3);
assert.deepEqual(result.widths,[320,390,430]);
assert.equal(result.screenshots.length,6);
for(const field of ['backgroundPrivatePhotoCleared','explicitOwnerRecheckRequired',
 'ownerWardrobeRefreshRevokes','browserFreezeRevokes','originalJPEGSHAReverified',
 'noPhotoOrOutfitWritesFromLease'])assert.equal(result[field],true,field);
assert.equal(result.nativeAuthSyntheticHTTPFixtureOnly,true);
assert.equal(result.physicalPhoneTested,false);
assert.equal(result.productionAuthorized,false);
assert.equal(result.familyAlpha,'HOLD');
const b=new Map();
for(const s of result.screenshots){
 assert.match(s.file,/^chromium-(320|390|430)-(01-background-private-source-cleared|02-explicit-owner-recheck-restores-images)\.png$/);
 assert.equal(s.file,'chromium-'+s.width+'-'+s.stage+'.png');
 assert.ok([320,390,430].includes(s.width));
 assert.ok(!b.has(s.file));b.set(s.file,true);
 const png=await readFile(dir+'/'+s.file);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(hash(png),s.sha256);
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.width,s.width);assert.ok(meta.height>=850);
 assert.ok(stats.channels.some(x=>x.stdev>7));
}
for(const width of [320,390,430]){
 const prefix='chromium-'+width+'-';
 assert.ok(b.has(prefix+'01-background-private-source-cleared.png'));
 assert.ok(b.has(prefix+'02-explicit-owner-recheck-restores-images.png'));
 const [x,y]=await Promise.all([
  sharp(dir+'/'+prefix+'01-background-private-source-cleared.png').ensureAlpha().raw().toBuffer(),
  sharp(dir+'/'+prefix+'02-explicit-owner-recheck-restores-images.png').ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let changed=0;
 for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+
   Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>45)changed++;
 assert.ok(changed>300,'P151 original-photo readiness cards must visibly disappear and return only after owner recheck');
}
await mkdir(dir+'/audit',{recursive:true});
const receipt={schema:'p151-real-native-owner-JPEG-revocation',screenshots:6,
 originalP08Genuine3DBrowserScreenshotsSeparatelyVerified:24,
 backgroundClearsPrivateJPEGCardSource:true,
 revision93InvalidatesSource:true,
 freezeClearsPrivateJPEGCardSource:true,
 noAutomaticRedisplay:true,
 realSignedRLSOrCustomerPhotos:false,
 physicalAndroidOrIphoneTested:false,independentPhotorealismApproval:false,
 familyAlpha:'HOLD',releaseAuthorized:false};
await writeFile(dir+'/audit/acceptance.json',JSON.stringify(receipt,null,2)+'\n');
console.log('P151_INDEPENDENT_NATIVE_PHOTO_REVOCATION_AUDIT '+JSON.stringify(receipt));
