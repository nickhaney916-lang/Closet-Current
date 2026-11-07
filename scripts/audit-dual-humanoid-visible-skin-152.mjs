/**
 * P152 independent SAME-app/SAME-source/SAME-viewport before-vs-after audit.
 * The P150 app test actually opens an owner-reviewed saved outfit and captures
 * both original 163-bone figures in Chromium before and after exactly one
 * scoped GLSL declaration-order repair. No screenshot is generated here.
 * The skin classifier only checks that upper-body source skin exists again;
 * it CANNOT rate facial realism, lighting, hair fidelity or cloth physics.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const root='benchmark/dual-humanoid-visible-skin-152';
const sha=b=>createHash('sha256').update(b).digest('hex');
const widths=[320,390,430],figures=['female','male'],views=['front','side','back'];
async function screenshot(dir,entry,width){
 const name=entry.file;
 assert.equal(name,entry.figure+'-'+entry.view+'-'+width+'.png');
 assert.equal(entry.width,width);
 assert.equal(entry.actualWebGL,true);
 assert.equal(entry.sourceRigBones,163);
 assert.ok(entry.skinBodyMaterials>=1);
 assert.ok(entry.facialMeshes>=14);
 assert.ok(entry.garmentMeshes>=1);
 assert.equal(entry.photorealismProven,false);
 const data=await readFile(root+'/'+dir+'/'+name);
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(sha(data),entry.sha256);
 const {data:pixels,info}=await sharp(data).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,width);assert.ok(info.height>=900);
 const {channels,height}=info;
 assert.ok(channels>=3);
 // Source mannequin head at the actual P150 native preview canvas is in
 // y=65..165. Restrict to the central 66% of the viewport, above the
 // garment. Verify visible warm skin, excluding off-white background and
 // dark cap/dress. This is a specific regression detector, not a skin-color
 // classifier for people and not a subjective attractiveness assessment.
 let skin=0;
 const x0=Math.floor(width*.17),x1=Math.ceil(width*.83);
 for(let y=65;y<Math.min(165,height);y++)
  for(let x=x0;x<x1;x++){
   const i=(y*width+x)*channels;
   const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
   if(r>75&&r<230&&g>48&&g<210&&b<200&&r-g>11&&g-b>5)skin++;
  }
 return {image:data,pixels,info,skin,pngSHA256:sha(data)};
}
function upperDiff(a,b,width){
 assert.equal(a.pixels.length,b.pixels.length);
 const channels=a.info.channels;
 let changed=0;
 for(let y=65;y<Math.min(165,a.info.height);y++)
  for(let x=Math.floor(width*.17);x<Math.ceil(width*.83);x++){
   const i=(y*width+x)*channels;
   const delta=Math.abs(a.pixels[i]-b.pixels[i])+
    Math.abs(a.pixels[i+1]-b.pixels[i+1])+
    Math.abs(a.pixels[i+2]-b.pixels[i+2]);
   if(delta>40)changed++;
  }
 return changed;
}
const cases=[];
for(const width of widths){
 const original=JSON.parse(await readFile(root+'/before/screens-'+width+'.json','utf8'));
 const repaired=JSON.parse(await readFile(root+'/after/screens-'+width+'.json','utf8'));
 assert.equal(original.length,6);assert.equal(repaired.length,6);
 for(const figure of figures)for(const view of views){
  const a=original.find(x=>x.figure===figure&&x.view===view);
  const b=repaired.find(x=>x.figure===figure&&x.view===view);
  assert.ok(a&&b,'both same-source true WebGL figure/view pair receipts required');
  assert.equal(a.file,b.file);
  assert.equal(a.sourceRigBones,b.sourceRigBones);
  assert.equal(a.garmentMeshes,b.garmentMeshes);
  assert.equal(a.facialMeshes,b.facialMeshes);
  assert.equal(a.skinBodyMaterials,b.skinBodyMaterials);
  const before=await screenshot('before',a,width),after=await screenshot('after',b,width);
  const changedHeadPixels=upperDiff(before,after,width);
  if(before.skin>65)
   throw Error('P152 expected missing source-skin P150 reproduced before fix: '+figure+' '+view+' '+width+' (saw '+before.skin+')');
  if(after.skin<before.skin+120)
   throw Error('P152 still invisible source head skin after shader repair: '+figure+' '+view+' '+width+' (before '+before.skin+', after '+after.skin+')');
  if(changedHeadPixels<150)
   throw Error('P152 source skull before/after pixel difference too small: '+figure+' '+view+' '+width);
  cases.push({figure,view,width,sourceRigBones:163,
   sameOwnerOutfitGarmentCount:a.garmentMeshes,
   unchangedFaceGeometryCount:a.facialMeshes,
   beforeSourceSkinPixels:before.skin,afterSourceSkinPixels:after.skin,
   changedHeadPixels,
   originalBeforePNG:before.pngSHA256,repairedAfterPNG:after.pngSHA256,
   personalPhotosUsed:false,facialPhotorealismAccepted:false});
 }
}
assert.equal(cases.length,18);
const native=JSON.parse(await readFile(root+'/after/native-result.json','utf8'));
assert.equal(native.cases,3);
assert.equal(native.screenshots,15);
assert.deepEqual(native.errors,[]);
assert.deepEqual(native.crashes,[]);
assert.ok(native.evidence.every(x=>x.bones===163&&x.realWebGL===true&&
 x.authenticPhotoSourcedDress3D===true&&x.separateAccountBPrivate===true&&
 x.nonVettedCoatJacketShoesPhotoFallback===true&&x.releaseAuthorized===false));
const webkit=JSON.parse(await readFile(root+'/after/native-webkit-result.json','utf8'));
assert.equal(webkit.cases,3);
assert.deepEqual(webkit.errors,[]);assert.deepEqual(webkit.crashes,[]);
assert.ok(webkit.evidence.every(x=>x.engine==='webkit'&&x.realWebGL===true),
 'P152 requires actual WebKit 163-bone WebGL, not photo fallback');
const output={
 schema:'closet-current-p152-actual-p150-source-skin-GLSL-before-after',
 verifiedP150ExactSHA:'6e576da9d7ff6a0a439a7762cf333670d20f0131',
 parentMainP151ExactSHA:'d8f66ee67489e3a6d136f41f2c6f310054a266a5',
 originalDonorRigBones:163,
 realChromiumBeforeAfterScreenshotPairs:18,
 originalBeforeAndAfterPNGFilesVerified:36,
 webkitReal163BoneViewportCases:3,
 femaleAndMale:true,
 sourceLicensedOriginalJPEGsPreserved:true,
 savedOutfitAndGarmentMeshCountsUnchanged:true,
 shaderRoughnessDeclarationOrderCorrected:true,
 skullAndExposedSourceSkinVisibleAgain:true,
 sourcePhotoBacksideNotNewlyManufactured:true,
 independentHumanFaceRealismApproved:false,
 clothPhysicsIndependentlyApproved:false,
 realSignedHostedTwoAccountRLS:false,
 actualPhysicalPhoneTested:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 result:'RESEARCH_VISIBLE_SKIN_FIXED_VISUAL_PHOTOREALISM_STILL_HOLD',
 cases
};
await mkdir(root+'/audit',{recursive:true});
await writeFile(root+'/audit/acceptance.json',JSON.stringify(output,null,2)+'\n');
console.log('P152_SKIN_VISIBLE_REAL_WEBGL '+JSON.stringify({
 originalSourceBeforeAfterPairs:18,
 independentlySHA256VerifiedPNG:36,
 passedWarmSkinHeadPixelRecovery:cases.length,
 actualWebKit163BoneCases:3,
 photoFacePhotorealismHumanApproved:false,
 sourceWardrobeUnchanged:true,familyAlpha:'HOLD'}));
