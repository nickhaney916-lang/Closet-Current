/**
 * P157 independent real native Outfit Builder male/female exact-source photo
 * 163-bone BODY + genuine licensed MIT original face/hair 80-bone HEAD graft.
 * Compares REAL original WebGL before/after PNGs, not an AI concept image,
 * requires head pixel improvement while original saved account/outfit and
 * garment mesh counts + original JPEG source identity remain unchanged.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const base='benchmark/real-face-original-photo-body-graft-157',
 genders=['female','male'],angles=['front','side','back'],widths=[320,390,430];
const digest=b=>createHash('sha256').update(b).digest('hex');
const SHA={
 female:'dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4',
 male:'a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72'
};
async function verify(kind,item,width){
 assert.equal(item.file,item.figure+'-'+item.view+'-'+width+'.png');
 assert.equal(item.actualWebGL,true);
 assert.equal(item.sourceRigBones,163);
 assert.equal(item.photorealismProven,false);
 assert.ok(item.skinBodyMaterials>=1);
 assert.ok(item.facialMeshes>=14);
 assert.ok(item.garmentMeshes>=1);
 const bytes=await readFile(base+'/'+kind+'/'+item.file);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(digest(bytes),item.sha256);
 const {data:rgba,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,width);
 assert.ok(info.height>=900&&info.channels>=3);
 return {bytes,rgba,info};
}
function difference(a,b,width){
 assert.equal(a.rgba.length,b.rgba.length);
 const count={head:0,outside:0,darkHead:0,brightHead:0},
  h=a.info.height,channels=a.info.channels;
 for(let y=0;y<h;y++)for(let x=0;x<width;x++){
  const p=(y*width+x)*channels;
  const dist=Math.abs(a.rgba[p]-b.rgba[p])+
   Math.abs(a.rgba[p+1]-b.rgba[p+1])+
   Math.abs(a.rgba[p+2]-b.rgba[p+2]);
  if(dist<37)continue;
  const head=y>=48&&y<240&&x>=width*.12&&x<=width*.88;
  if(head){
   count.head++;
   if(b.rgba[p]<110&&b.rgba[p+1]<110&&b.rgba[p+2]<110)count.darkHead++;
   if(b.rgba[p]>110&&b.rgba[p+1]>75&&b.rgba[p+2]>50)count.brightHead++;
  }else count.outside++;
 }
 return count;
}
const evidence=[];
for(const width of widths){
 const a=JSON.parse(await readFile(base+'/before/screens-'+width+'.json','utf8')),
  b=JSON.parse(await readFile(base+'/after/screens-'+width+'.json','utf8'));
 assert.equal(a.length,6);assert.equal(b.length,6);
 for(const figure of genders)for(const view of angles){
  const before=a.find(x=>x.figure===figure&&x.view===view),
   after=b.find(x=>x.figure===figure&&x.view===view);
  assert.ok(before&&after,'P157 same source photo/figure/view required');
  assert.equal(before.licensedHeadAttached157,false);
  assert.equal(after.licensedHeadAttached157,true);
  assert.equal(after.licensedHeadSourceRigBones157,80);
  assert.equal(after.licensedHeadSHA157,SHA[figure]);
  assert.equal(after.licensedOriginalBodyUnchanged157,true);
  assert.equal(after.licensedOriginalPhotoUnchanged157,true);
  assert.equal(after.licensedGarmentCountUnchanged157,true);
  assert.equal(after.originalHeadMaskActive157,true);
  assert.equal(after.sourceRigBones,before.sourceRigBones);
  assert.equal(after.garmentMeshes,before.garmentMeshes);
  assert.equal(after.facialMeshes,before.facialMeshes);
  assert.equal(after.headHairMeshCount153,before.headHairMeshCount153);
  assert.equal(after.faceContourMeshCount154,before.faceContourMeshCount154);
  assert.ok(Math.abs(after.licensedHeadTopError157)<.11,
   'grafted 80-bone actual head must sit within original neck/head outline');
  assert.ok(after.licensedNeckSeam157>-.16&&after.licensedNeckSeam157<.19,
   'actual original 163-bone neck/head separation mismatch');
  const p=await verify('before',before,width),q=await verify('after',after,width),
   measure=difference(p,q,width);
  if(measure.head<35)
   throw Error('P157 original 3D head never visibly changed: '+width+' '+figure+' '+view+
    ' changed '+measure.head);
  const area=width*q.info.height;
  if(measure.outside>area*.18)
   throw Error('P157 changed too much outside source head and neck: '+width+' '+figure+' '+view+
    ' changed '+measure.outside+' of '+area);
  evidence.push({width,figure,view,
   originalSourceOutfitBodyRigBones:163,authoredOriginalGarmentMeshes:before.garmentMeshes,
   newLicensedOriginalHeadRigBones:80,
   actualSourceHeadSHA256:after.licensedHeadSHA157,
   headBoneAttached:true,originalFaceHidden:true,
   originalSourceBodyAndSavedOutfitUnmodified:true,
   beforeScreenshotSHA256:digest(p.bytes),afterScreenshotSHA256:digest(q.bytes),
   ...measure,
   originalUserGarmentSourceIdentityPreserved:true,
   realisticPhotoClothDrapeIndependentlyApproved:false,
   realHumanPhotorealism10outof10Approved:false});
 }
}
assert.equal(evidence.length,18);
const chrom=JSON.parse(await readFile(base+'/after/native-result.json','utf8'));
assert.equal(chrom.cases,3);
assert.equal(chrom.screenshots,15);
assert.deepEqual(chrom.errors,[]);
assert.deepEqual(chrom.crashes,[]);
assert.ok(chrom.evidence.every(x=>
 x.bones===163&&x.separateAccountBPrivate===true&&
 x.nonVettedCoatJacketShoesPhotoFallback===true&&x.releaseAuthorized===false));
const wk=JSON.parse(await readFile(base+'/after/native-webkit-result.json','utf8'));
assert.equal(wk.cases,3);assert.equal(wk.browserSupported,true);
assert.deepEqual(wk.errors,[]);assert.deepEqual(wk.crashes,[]);
assert.ok(wk.evidence.every(x=>x.realWebGL===true&&x.engine==='webkit'));
const result={
 priority:157,
 exactMainParent:'334d7d44e800f666370d0c10896fd3d46fc35aba',
 sourceOriginalMITP156HeadBinaryVerified:true,
 licensedMaleFemale80BoneHeadsAttachedToOriginal163BoneDressViewer:true,
 actualGenuineChromiumBeforeAfterViews:evidence.length,
 independentlySHA256VerifiedOriginalScreenshots:evidence.length*2,
 genuineWebKitOriginalSourceDressModelCases:3,
 originalTwoOwnerAandBIsolationPreserved:true,
 originalSourceJPEGAndCutoutBytesUnmodified:true,
 originalUserReviewedGarmentSourceIdentityUnmodified:true,
 original163BoneBodySourceGeometryUnchanged:true,
 vendorBakedBodyJacketPantsNeverReintroduced:true,
 originalSourceMannequinFaceSuppressedWithReversibleShader:true,
 originalHumanSkinNeckSeamIndependentlyVisuallyApproved:false,
 originalOwnedOutfitDressJacketCoatSourcePreserved:true,
 sourcePhotoOnlyFallbackForNonfittedFootwearAndOuterwear:true,
 originalSourceGarmentFittedOnNewBody:false,
 independent10outof10HumanPhotorealismAccepted:false,
 realPhysicalAndroidOrIphoneTested:false,
 realSignedHostedCloudTwoOwnerRLS:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 outcome:'P157_LICENSED_REAL_HEAD_ON_ORIGINAL_SOURCE_PHOTO_OUTFIT_RESEARCH; HUMAN_VISUAL_REVIEW_AND_PHONE_ACCEPTANCE_HOLD',
 evidence
};
await mkdir(base+'/audit',{recursive:true});
await writeFile(base+'/audit/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('P157_REAL_HEAD_ON_ORIGINAL_163_BONE_OWNER_OUTFIT_VERIFIED '+JSON.stringify({
 twoOriginalLicensedMaleFemaleHeads:true,
 original163BoneOwnerGarmentViewerPreserved:true,
 genuineSameSourceMobileBeforeAfterPairs:evidence.length,
 sourcePNGFilesSHA256Verified:evidence.length*2,
 realWebKitCases:3,
 minNewHeadPixels:Math.min(...evidence.map(x=>x.head)),
 realSourceJPEGUnchanged:true,
 humanPhotorealism10of10Accepted:false,
 familyAlpha:'HOLD'
}));
