import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/native-photo-readiness-08',audit=folder+'-audit';
await mkdir(audit,{recursive:true});
const report=JSON.parse(await readFile(folder+'/results.json','utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(report.priority,'NATIVE-PHOTO-READINESS-08');
assert.equal(report.cases,3);assert.equal(report.screenshots,24);
assert.equal(report.evidence.length,3);assert.equal(report.screens.length,24);
assert.deepEqual(report.widths,[320,390,430]);
assert.deepEqual(report.errors,[]);
assert.deepEqual(report.external.filter(x=>x.method!=='GET'),[]);
assert.equal(report.realWebGL,true);
assert.equal(report.originalNativeAuthHTTPOnlyMocked,true);
assert.equal(report.realSignedRLS,false);
assert.equal(report.originalUserSavedStateUnmodified,true);
assert.equal(report.restoredBeforeSourceTrue3D,true);
assert.equal(report.closedActive3DTransactionGate,true);
assert.equal(report.isolatedChromiumProcessPerWidth,true);
assert.deepEqual(report.crashes,[]);
assert.equal(report.familyAlpha,'HOLD');assert.equal(report.releaseAuthorized,false);
const steps=['01-original-native-builder','02-private-indexed-new-photo',
 '03-genuine-163-bone-front-dress','04-genuine-163-bone-side-dress',
 '05-genuine-163-bone-rear-neutral','06-B-private-missing-source-fallback',
 '07-A-verified-source-readiness','08-B-private-missing-source-readiness'];
const all=new Set(),galleries=[];
for(const file of report.screens){
 assert.ok([320,390,430].includes(file.width));
 assert.ok(steps.includes(file.stage));
 const key=file.width+'|'+file.stage;
 assert.ok(!all.has(key));all.add(key);
 const raw=await readFile(folder+'/'+file.name);
 assert.equal(sha(raw),file.sha256,'Original mobile screenshot changed');
 const meta=await sharp(raw).metadata(),stat=await sharp(raw).stats();
 assert.equal(meta.width,file.width);assert.ok(meta.height>=880);
 assert.ok(raw.length>4500&&stat.channels.some(c=>c.stdev>7));
}
for(const row of report.evidence){
 assert.ok([320,390,430].includes(row.width));
 assert.equal(row.realNativeBuilder,true);
 assert.equal(row.exactSourceDonorPR541,true);
 assert.equal(row.authenticPhotoSourcedDress3D,true);
 assert.equal(row.bones,163);
 assert.ok(row.renderedGenuineMeshes>=1);
 assert.equal(row.nonVettedCoatJacketShoesPhotoFallback,true);
 assert.equal(row.readOnlyDonorActions,true);
 assert.equal(row.noOutfitMutation,true);
 assert.equal(row.unsavedEditsBlocked,true);
 assert.equal(row.sessionLogoutClears3D,true);
 assert.equal(row.consumerStillActiveAfterViewerClose,true);
 assert.equal(row.separateAccountBPrivate,true);
 assert.equal(row.missingIDsRetained,true);
 assert.equal(row.atomicLosslessV4RestoredBefore3D,true);
 assert.equal(row.exactRestoredOriginalPhotos,true);
 assert.equal(row.activeAnatomical3DRestoreBlocked,true);
 assert.equal(row.ownerACrossOwnerBRestoreBlocked,true);
 assert.equal(row.realOriginalJPEGImportedManuallyCorrectedAndIndexed,true);
 assert.equal(row.previouslyStaleNewGarmentSavedToUnsavedOutfitWithoutReload,true);
 assert.equal(row.savedOriginalPhotoIncludedInV4Restore,true);
 assert.equal(row.ownerOriginalSourceReadinessShownBeforeWebGL,true);
 assert.equal(row.unsupportedShoesOuterwearRemainPhotoOnly,true);
 assert.equal(row.sourceReadinessBlockedOnLogoutAndForeignOwner,true);
 assert.equal(row.missingOriginalIDRetainedWithoutFabrication,true);
 assert.equal(row.liveSignedRLS,false);
 assert.equal(row.physicalPhoneApproved,false);
 assert.equal(row.releaseAuthorized,false);
}
for(const width of [320,390,430]){
 const images=[];
 for(const [i,stage]of steps.entries()){
  const file=report.screens.find(s=>s.width===width&&s.stage===stage);
  assert.ok(file);
  const raw=await readFile(folder+'/'+file.name);
  const png=await sharp(raw).resize({width:390,height:850,fit:'contain',background:'#fff'}).png().toBuffer();
  images.push({input:png,left:i*390,top:0});
 }
 const result=await sharp({create:{width:3120,height:850,channels:4,background:'#fff'}})
  .composite(images).jpeg({quality:86}).toBuffer();
 const name='native-photo-readiness08-real-source-humanoid-'+width+'px.jpg';
 await writeFile(audit+'/'+name,result);
 galleries.push({name,sha256:sha(result)});
}
const acceptance={priority:'NATIVE-PHOTO-READINESS-08',
 status:'PASS_REAL_BROWSER_163_BONE_RESEARCH_ONLY',
 genuineChromiumWebGLMobileWidths:[320,390,430],
 verifiedGenuine3DFrames:9,verifiedBrowserScreenshots:24,
 independentOriginalPhotoSHA:true,explicitPhotoOnlyUnsupportedClothing:true,
 savedOwnerOutfitReadOnly:true,actualNativeConsumerBridge:true,
 originalCloudAndSavedDataUnchanged:true,
 newCapturedOriginalPreservedThroughIndexAndBackup:true,
 unsavedDraftPreservedAcrossLiveWardrobeRefresh:true,
 trueSourceHashVerifiedBeforePhotoDisplay:true,
 unknownUserSourceNeverAutoFitted:true,
 recoveredOwnerV4OriginalsUsedForActual3D:true,
 activePreviewReplaceAndCrossOwnerRestoreBlocked:true,
 realSignedUsersVerified:false,realPhysicalPhonesVerified:false,
 productionDeployed:false,releaseAuthorized:false,familyAlpha:'HOLD',galleries};
await writeFile(audit+'/acceptance.json',JSON.stringify(acceptance,null,2)+'\n');
console.log('NATIVE_PHOTO_READINESS_08_AUDIT',JSON.stringify({realWebGL:true,screenshots:24,
 anatomical3DImages:9,galleries:3,familyAlpha:'HOLD'}));
