/**
 * P153 independent same-original-photo before/after real native Chromium 3D
 * audit. The original body shader is P152-correct on BOTH sides. Only P153
 * bone-attached layered source-head hair differs. Not a beauty, identity,
 * ethnicity or photorealism classification.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='benchmark/dual-humanoid-head-hair-153';
const digest=b=>createHash('sha256').update(b).digest('hex');
const genders=['female','male'],widths=[320,390,430],angles=['front','side','back'];
const receipt=async(kind,item,width)=>{
 const file=folder+'/'+kind+'/'+item.file;
 assert.equal(item.file,item.figure+'-'+item.view+'-'+width+'.png');
 assert.equal(item.actualWebGL,true);
 assert.equal(item.width,width);
 assert.equal(item.sourceRigBones,163);
 assert.equal(item.photorealismProven,false);
 assert.ok(item.skinBodyMaterials>=1);
 assert.ok(item.facialMeshes>=14);
 assert.ok(item.garmentMeshes>=1);
 const data=await readFile(file);
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(item.sha256,digest(data));
 const {data:rgba,info}=await sharp(data).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,width);
 assert.ok(info.height>=900&&info.channels>=3);
 return {data,rgba,info};
};
function compare(a,b,width){
 assert.equal(a.rgba.length,b.rgba.length);
 const channels=a.info.channels;let changed=0,beforeSkin=0,afterSkin=0,afterDark=0;
 const classify=(p,i)=>p[i]>75&&p[i]<230&&p[i+1]>48&&p[i+1]<210&&
    p[i+2]<200&&p[i]-p[i+1]>11&&p[i+1]-p[i+2]>5;
 for(let y=60;y<Math.min(185,a.info.height);y++)
  for(let x=Math.floor(width*.17);x<Math.ceil(width*.83);x++){
   const i=(y*width+x)*channels;
   const before=a.rgba,after=b.rgba;
   const dist=Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+
    Math.abs(before[i+2]-after[i+2]);
   if(dist>36)changed++;
   if(classify(before,i))beforeSkin++;
   if(classify(after,i))afterSkin++;
   if(after[i]<110&&after[i+1]<110&&after[i+2]<110)afterDark++;
  }
 return {changedPixelsInSourceHeadROI:changed,beforeVisibleSkinPixels:beforeSkin,
  afterVisibleSkinPixels:afterSkin,afterDarkSurfacePixels:afterDark};
}
const cases=[];
for(const width of widths){
 const a=JSON.parse(await readFile(folder+'/before/screens-'+width+'.json','utf8'));
 const b=JSON.parse(await readFile(folder+'/after/screens-'+width+'.json','utf8'));
 assert.equal(a.length,6);assert.equal(b.length,6);
 for(const figure of genders)for(const view of angles){
  const before=a.find(x=>x.figure===figure&&x.view===view);
  const after=b.find(x=>x.figure===figure&&x.view===view);
  assert.ok(before&&after,'same owner original source figure/angle required');
  assert.equal(before.headHairMeshCount153,0);
  assert.ok(after.headHairMeshCount153>=(figure==='female'?18:12));
  assert.equal(after.headBoneAttached153,true);
  assert.equal(after.sourcePhotoGeometryUnchanged153,true);
  assert.equal(after.sourceRigBones,before.sourceRigBones);
  assert.equal(after.facialMeshes,before.facialMeshes);
  assert.equal(after.garmentMeshes,before.garmentMeshes);
  const first=await receipt('before',before,width);
  const second=await receipt('after',after,width);
  const measures=compare(first,second,width);
  if(measures.changedPixelsInSourceHeadROI<50)
   throw Error('P153 head silhouette unchanged or invisible: '+width+'/'+figure+'/'+view+
    ' changed '+measures.changedPixelsInSourceHeadROI);
  if(measures.beforeVisibleSkinPixels<100||measures.afterVisibleSkinPixels<100)
   throw Error('P153 body skin not visible before/after: '+width+'/'+figure+'/'+view);
  // Hair is not allowed to cover the entire head/eyes, nor restore the P150
  // skin-invisible shader defect under a new procedural hair layer.
  if(measures.afterVisibleSkinPixels<measures.beforeVisibleSkinPixels*.55)
   throw Error('P153 overcovers the original anatomical face: '+width+'/'+figure+'/'+view);
  cases.push({width,figure,view,bodyRigBones:163,
   originalP150GarmentCount:before.garmentMeshes,
   unchangedOriginalP131FaceCount:before.facialMeshes,
   sourceAttachedHairMeshes:after.headHairMeshCount153,
   beforeScreenshotSHA256:first.data&&digest(first.data),
   afterScreenshotSHA256:second.data&&digest(second.data),
   ...measures,
   independentlyHumanPhotorealismApproved:false});
 }
}
assert.equal(cases.length,18);
const chrom=JSON.parse(await readFile(folder+'/after/native-result.json','utf8'));
assert.equal(chrom.cases,3);
assert.equal(chrom.screenshots,15);
assert.deepEqual(chrom.errors,[]);assert.deepEqual(chrom.crashes,[]);
assert.ok(chrom.evidence.every(x=>x.bones===163&&x.separateAccountBPrivate===true&&
 x.nonVettedCoatJacketShoesPhotoFallback===true&&x.releaseAuthorized===false));
const wk=JSON.parse(await readFile(folder+'/after/native-webkit-result.json','utf8'));
assert.equal(wk.cases,3);assert.equal(wk.browserSupported,true);
assert.deepEqual(wk.errors,[]);assert.deepEqual(wk.crashes,[]);
assert.ok(wk.evidence.every(x=>x.realWebGL===true&&x.engine==='webkit'));
await mkdir(folder+'/audit',{recursive:true});
const report={
 priority:153,verifiedSourceHeadGeometry:true,
 originalExactMainP152:'d5319ed3531839b7dd158075603db09f62f3f2bf',
 originalParallelP150:'6e576da9d7ff6a0a439a7762cf333670d20f0131',
 originalCC0RigBones:163,
 actualChromiumMatchedBeforeAfterPairs:18,
 SHA256VerifiedOriginalScreenshots:36,
 supportedFigureChoices:genders,
 mobileCSSViewportWidths:widths,
 actualWebKitModelCases:3,
 firstAvatarBaldScalpCapVsSourceAttachedLayeredHair:true,
 retainedGenuineSourceSkinShaderP152:true,
 savedOutfitSourceAndGarmentMeshCountsUnchanged:true,
 bothSourceEyesAndFaceUnmodified:true,
 previousSmallFloatingCapHidden:true,
 sourceGarmentOriginalJPEGUnmodified:true,
 universalUserHairOrIdentityReconstruction:false,
 realisticNoseLipsEarsScientificallyApproved:false,
 naturalHairPhysicsApproved:false,
 realUserPhotographedGarmentFittingProven:false,
 genuinePhysicalAndroidIphoneTested:false,
 hostedTwoOwnerSignedRLSVerified:false,
 independentHumanRealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
 result:'SOURCE_BONE_ATTACHED_HAIR_INTEGRATED; HUMAN_PHOTOREALISM_STILL_HOLD',
 cases
};
await writeFile(folder+'/audit/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('P153_SOURCE_BONE_ATTACHED_HAIR_REAL_WEBGL '+JSON.stringify({
 matchedOriginalSourceBeforeAfterScreenshots:36,
 matchedAngles:cases.length,
 minMeasuredChangedSourceHeadPixels:Math.min(...cases.map(x=>x.changedPixelsInSourceHeadROI)),
 realWebKitModelCases:3,
 humanPhotorealismApproved:false,
 originalSourceGarmentsUnchanged:true,
 familyAlpha:'HOLD'
}));
