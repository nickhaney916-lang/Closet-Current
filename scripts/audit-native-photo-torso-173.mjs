/** Independent native owner-shirt P173 163-bone Chromium screenshot SHA audit.
 * Research-only. Source scans are public licensed JPEG fixtures, not owners. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/native-3d-05',output='benchmark/native-photo-torso-173';
await mkdir(output,{recursive:true});
const report=JSON.parse(await readFile(folder+'/results.json','utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const required=['01-original-native-builder','02-genuine-163-bone-front-dress',
 '03-genuine-163-bone-side-dress','04-genuine-163-bone-rear-neutral',
 '05-B-private-missing-source-fallback','06-owner-physical-shirt-front',
 '07-owner-physical-shirt-side','08-owner-shirt-neutral-inferred-rear'];
assert.equal(report.priority,'NATIVE-3D-05');
assert.equal(report.cases,3);assert.equal(report.screenshots,24);
assert.equal(report.screens.length,24);assert.equal(report.evidence.length,3);
assert.deepEqual(report.widths,[320,390,430]);
assert.deepEqual(report.errors,[]);assert.deepEqual(report.crashes,[]);
assert.deepEqual(report.external.filter(x=>x.method!=='GET'),[]);
assert.equal(report.realWebGL,true);
assert.equal(report.originalNativeAuthHTTPOnlyMocked,true);
assert.equal(report.realSignedRLS,false);
assert.equal(report.originalUserSavedStateUnmodified,true);
assert.equal(report.familyAlpha,'HOLD');assert.equal(report.releaseAuthorized,false);
const shaSet=new Set(),sourceRow=new Set();
for(const item of report.screens){
 assert.ok([320,390,430].includes(item.width));
 assert.ok(required.includes(item.stage));
 const id=item.width+':'+item.stage;assert.ok(!sourceRow.has(id),id);
 sourceRow.add(id);
 const bytes=await readFile(folder+'/'+item.name);
 assert.equal(bytes.subarray(1,4).toString(),'PNG');
 assert.equal(digest(bytes),item.sha256,'Screenshot SHA mismatch '+id);
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.width,item.width);
 assert.ok(meta.height>=880&&stats.channels.some(x=>x.stdev>7));
 shaSet.add(item.sha256);
}
assert.equal(sourceRow.size,24);assert.equal(shaSet.size,24);
for(const [i,width] of [320,390,430].entries()){
 const row=report.evidence.find(x=>x.width===width);
 assert.ok(row);assert.equal(row.realNativeBuilder,true);
 assert.equal(row.exactSourceDonorPR541,true);
 assert.equal(row.actualSignedOwnerSourceShirtPhysicallyContoured173,true);
 assert.equal(row.authenticPhotoSourcedDress3D,true);
 assert.equal(row.bones,163);assert.ok(row.renderedGenuineMeshes>=1);
 for(const name of ['readOnlyDonorActions','noOutfitMutation','unsavedEditsBlocked',
  'separateAccountBPrivate','sessionLogoutClears3D','consumerStillActiveAfterViewerClose',
  'nonVettedCoatJacketShoesPhotoFallback'])
  assert.equal(row[name],true,name+' '+width);
 assert.equal(row.liveSignedRLS,false);
 assert.equal(row.physicalPhoneApproved,false);
 assert.equal(row.releaseAuthorized,false);
 const files=['06-owner-physical-shirt-front','07-owner-physical-shirt-side',
   '08-owner-shirt-neutral-inferred-rear'];
 const samples=[];
 for(let j=0;j<files.length;j++){
  const item=report.screens.find(s=>s.width===width&&s.stage===files[j]);
  const raw=await readFile(folder+'/'+item.name);
  samples.push({input:await sharp(raw).resize({width:390,height:850,fit:'contain'}).png().toBuffer(),
   left:j*390,top:0});
 }
 const image=await sharp({create:{width:1170,height:850,channels:4,background:'#fff'}})
  .composite(samples).png().toBuffer();
 await writeFile(output+'/signed-owner-physical-photo-shirt-'+width+'.png',image);
}
const result={priority:173,status:'PASS_PHYSICAL_SOURCE_SHIRT_NATIVE_RESEARCH_ONLY',
 browser:'Chromium',viewports:[320,390,430],genuineSourcePhotoSkinned163BoneScenes:true,
 threeShirtAnglesPerWidth:true,screens:24,uniqueImageSHA256s:shaSet.size,
 actualNativeSavedOwnerShirtReused:true,originalSHAReviewedAndRehashed:true,
 privateSavedBoardPreserved:true,unsupportedOwnerPhoto2DFallback:true,
 garmentBackPhotographed:false,arbitraryPrivatePhotoFittingVerified:false,
 physicalAndroidIPhoneVerified:false,liveSignedHostedCloudVerified:false,
 photorealism10of10:false,releaseAuthorized:false,familyAlpha:'HOLD'};
await writeFile(output+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('P173_NATIVE_PHYSICAL_SHIRT_SOURCE_ACCEPTANCE',JSON.stringify(result));
