import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const src='benchmark/photo-fit-3d-02';
const data=JSON.parse(await readFile(src+'/results.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(data.priority,'PHOTO-FIT-3D-02');
assert.equal(data.source,'commons-0002');
assert.equal(data.sourceSHA256,'fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667');
assert.equal(data.donor,'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
assert.equal(data.sourceUnmodified,true);
assert.equal(data.humanVisualApproval,false);
assert.equal(data.realPhysicalPhonesVerified,false);
assert.equal(data.realSignedAccountsVerified,false);
assert.equal(data.realArbitraryUserPhotoSupport,false);
assert.equal(data.familyAlpha,'HOLD');
assert.equal(data.releaseAuthorized,false);
for(const x of ['pageErrors','consoleErrors','externalNetwork','crashes'])
 assert.deepEqual(data[x],[],x+' cannot be waived for acceptance');
assert.equal(data.screenshots.length,24);
const combos=new Set(),accepted=[];
for(const row of data.screenshots){
 assert.ok([320,390,430].includes(row.width)&&
 ['female','male'].includes(row.model)&&[0,90,180,270].includes(row.view));
 const key=[row.width,row.model,row.view].join('-');
 assert.ok(!combos.has(key),'Duplicate or missing genuine 3D perspective');
 combos.add(key);
 const bytes=await readFile(src+'/'+row.name);
 assert.equal(hash(bytes),row.sha256);
 assert.equal(bytes.length,row.bytes);
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.width,row.width);assert.equal(meta.height,900);
 assert.equal(meta.format,'png');
 assert.ok(stats.channels.some(x=>x.stdev>10),'Blank source 3D screenshot');
 accepted.push({...row,shaVerified:true});
}
assert.equal(combos.size,24);
assert.equal(data.cases.length,3);
for(const c of data.cases){
 assert.equal(c.screenshotViews,8);
 assert.equal(c.realMaleFemaleWebGL,true);
 assert.equal(c.originalSourceSHA256,data.sourceSHA256);
 assert.equal(c.sourceOriginalBytesNotModified,true);
 assert.equal(c.unverifiedRearNeutral,true);
 assert.equal(c.screenshotReview,'pending-independent-human-visual-acceptance');
 const storage=c.privateStorage;
 assert.equal(storage.sourceHashExact,true);
 assert.equal(storage.privateOwnerIsolationSynthetic,true);
 assert.equal(storage.originalPhotoBytesUnchanged,true);
 assert.equal(storage.outfit3dIdUnchanged,true);
 assert.equal(storage.missingCoatIDUnchanged,true);
 assert.equal(storage.unknownMetadataUnchanged,true);
 assert.equal(storage.signedRLS,false);
 const gallery=await readFile(src+'/'+c.sourceAndRenderGallery);
 assert.equal(hash(gallery),c.contactSHA256);
 const img=await sharp(gallery).metadata();assert.equal(img.width,1120);
 assert.equal(img.height,890);assert.equal(img.format,'png');
}
await mkdir('benchmark/photo-fit-3d-02-audit',{recursive:true});
await writeFile('benchmark/photo-fit-3d-02-audit/acceptance.json',
 JSON.stringify({priority:data.priority,exactSourceSHA256:data.sourceSHA256,
  verifiedRealWebGLScreenshots:24,verifiedTwoRigFourAngleCases:3,
  sourceVersusRenderGalleries:3,originalJPEGShaVerified:true,
  privateOwnerIsolationSynthetic:true,liveServerRLSVerified:false,
  physicalPhoneVerified:false,sourceTrueRear:false,
  newSource3DGeometryProvisional:true,humanFitAccepted:false,
  universalPhotoFitClaim:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2));
console.log('PHOTO22_AUDIT '+JSON.stringify({realScreenshots:accepted.length,
 sourceGalleries:3,newSourceSHA256:data.sourceSHA256,humanFitAccepted:false,
 familyAlpha:'HOLD',productionDeployed:false}));
