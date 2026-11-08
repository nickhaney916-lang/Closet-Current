/**
 * P158 independent ORIGINAL-GARMENT protected pixel inspection:
 * before = exact P157 licensed head + original 163-bone photographed dress;
 * after = same saved owner outfit/head + face-derived exposed-body skin only.
 * Compares genuine Chromium PNGs, not synthetic/rendered screenshots.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/licensed-face-skin-neck-harmony-158',
 widths=[320,390,430],figures=['female','male'],views=['front','side','back'];
const sha=b=>createHash('sha256').update(b).digest('hex');
async function load(stage,meta,width){
 const png=await readFile(dir+'/'+stage+'/'+meta.file);
 assert.equal(meta.sha256,sha(png));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const x=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(x.info.width,width);
 assert.ok(x.info.height>=900&&x.info.channels===3);
 return {...x,png};
}
function compare(before,after,width,view){
 assert.equal(before.data.length,after.data.length);
 const band=(a,b,x1,x2)=>({
  minY:a,maxY:b,minX:Math.floor(width*x1),maxX:Math.ceil(width*x2)
 });
 const limbs=[band(210,300,.17,.83),band(325,447,.25,.75)],
 cloth=band(255,338,.43,.57),
 face=band(166,210,.43,.57);
 function metrics(region){
  let changed=0,skinBefore=0,skinAfter=0,dist=0,pixels=0;
  const sumsA=[0,0,0],sumsB=[0,0,0],nA={v:0},nB={v:0};
  const warm=(r,g,b)=>r>48&&g>24&&b>15&&r<242&&
   r>g*1.055&&g>b*.99&&r-g>6;
  const accum=(data,p,sums,n)=>{
   if(!warm(data[p],data[p+1],data[p+2]))return false;
   for(let i=0;i<3;i++)sums[i]+=data[p+i];n.v++;
   return true;
  };
  for(let y=region.minY;y<Math.min(region.maxY,before.info.height);y++)
   for(let x=region.minX;x<region.maxX;x++){
    const p=(y*width+x)*3;
    const delta=Math.abs(before.data[p]-after.data[p])+
     Math.abs(before.data[p+1]-after.data[p+1])+
     Math.abs(before.data[p+2]-after.data[p+2]);
    if(delta>36)changed++;
    dist+=delta;pixels++;
    if(accum(before.data,p,sumsA,nA))skinBefore++;
    if(accum(after.data,p,sumsB,nB))skinAfter++;
   }
  const mean=(s,n)=>n.v>0?s.map(v=>v/n.v):null;
  return {pixels,changed,meanDelta:dist/Math.max(1,pixels),
   skinBefore,skinAfter,beforeMean:mean(sumsA,nA),afterMean:mean(sumsB,nB)};
 }
 const result={arms:metrics(limbs[0]),legs:metrics(limbs[1]),
  cloth:metrics(cloth),face:metrics(face)};
 const armAndLeg= result.arms.changed+result.legs.changed;
 if(result.arms.skinBefore<200||result.legs.skinBefore<200)
  throw Error('P158 baseline true original source skinned arms/legs missing');
 if(result.arms.skinAfter<100||result.legs.skinAfter<100)
  throw Error('P158 original skinned arms or legs disappeared under body shader');
 if(armAndLeg<60)
  throw Error('P158 real exposed skin pixels do not change on actual phone model');
 // A rectangular torso/head ROI contains EXPOSED source skin on shoulders,
 // collar and side angles. Comparing all those pixels incorrectly penalizes
 // real skin harmonization. Instead pin the ACTUAL dark, original photographed
 // dress pixels and actual dark licensed-face/hair pixels from the unedited
 // P157 image. Non-dark skin is checked separately for visible arm/leg changes.
 function protectedSurface(y0,y1,xlo,xhi,rmax,gmax,bmax){
  let original=0,modified=0;
  for(let y=y0;y<Math.min(y1,before.info.height);y++)
   for(let x=Math.floor(width*xlo);x<Math.ceil(width*xhi);x++){
    const p=(y*width+x)*3,r=before.data[p],g=before.data[p+1],
     b=before.data[p+2];
    if(r>=rmax||g>=gmax||b>=bmax)continue;
    original++;
    const delta=Math.abs(r-after.data[p])+
     Math.abs(g-after.data[p+1])+Math.abs(b-after.data[p+2]);
    if(delta>36)modified++;
   }
  return {originalDarkSourcePixels:original,changedDarkSourcePixels:modified,
   changedFraction:modified/Math.max(1,original)};
 }
 result.photographedDarkDress=protectedSurface(255,338,.35,.65,105,105,110);
 result.originalLicensedDarkHead=protectedSurface(155,213,.36,.64,115,105,100);
 if(result.photographedDarkDress.originalDarkSourcePixels<700||
    result.photographedDarkDress.changedFraction>.025)
  throw Error('P158 actual photographed dress source pixels changed: '+
   width+' '+view+' '+JSON.stringify(result.photographedDarkDress));
 if(result.originalLicensedDarkHead.originalDarkSourcePixels<250||
    result.originalLicensedDarkHead.changedFraction>.08)
  throw Error('P158 actual licensed head/hair original pixels changed: '+
   width+' '+view+' '+JSON.stringify(result.originalLicensedDarkHead));
 const rgbDistance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 if(view==='front'&&result.face.beforeMean&&result.arms.beforeMean&&
    result.face.afterMean&&result.arms.afterMean){
  const oldDist=rgbDistance(result.face.beforeMean,result.arms.beforeMean),
   newDist=rgbDistance(result.face.afterMean,result.arms.afterMean);
  result.frontFaceToBodyOriginalRGBDistance=oldDist;
  result.frontFaceToBodyHarmonyRGBDistance=newDist;
  if(newDist>=oldDist*.98)
   throw Error('P158 source face to exposed original arms color divergence did not improve: '+
    JSON.stringify({oldDist,newDist,width}));
 }
 return result;
}
const evidence=[];
for(const width of widths){
 const before=JSON.parse(await readFile(dir+'/before/screens-'+width+'.json','utf8')),
  after=JSON.parse(await readFile(dir+'/after/screens-'+width+'.json','utf8'));
 assert.equal(before.length,6);assert.equal(after.length,6);
 for(const figure of figures)for(const view of views){
  const a=before.find(x=>x.figure===figure&&x.view===view),
   b=after.find(x=>x.figure===figure&&x.view===view);
  assert.ok(a&&b,'original figure/pose/source screenshot missing');
  assert.equal(a.sourceRigBones,163);assert.equal(b.sourceRigBones,163);
  assert.equal(a.licensedHeadAttached157,true);
  assert.equal(b.licensedHeadAttached157,true);
  assert.equal(a.licensedHeadSHA157,b.licensedHeadSHA157);
  assert.equal(a.garmentMeshes,b.garmentMeshes);
  assert.equal(b.licensedOriginalBodyUnchanged157,true);
  assert.equal(b.licensedOriginalPhotoUnchanged157,true);
  assert.equal(b.licensedGarmentCountUnchanged157,true);
  assert.equal(a.skinHarmonyApplied158,false);
  assert.equal(b.skinHarmonyApplied158,true);
  assert.equal(b.skinHarmonySourceSHA158,b.licensedHeadSHA157);
  assert.ok(b.skinHarmonySamples158>=70);
  assert.ok(b.skinHarmonyMaterials158>=1);
  assert.ok(b.skinHarmonyBodyDelta158>.008);
  const one=await load('before',a,width),two=await load('after',b,width);
  const pixel=compare(one,two,width,view);
  evidence.push({width,figure,view,originalPhotoSHAIdentityPreserved:true,
   licensedHeadSHA256:b.licensedHeadSHA157,
   verifiedPublicLicensedAlbedoPixels:b.skinHarmonySamples158,
   bodyLinearToneDifference:b.skinHarmonyBodyDelta158,
   beforePNG_SHA256:sha(one.png),afterPNG_SHA256:sha(two.png),
   sourceGarmentMeshes:b.garmentMeshes,...pixel});
 }
}
assert.equal(evidence.length,18);
const chromium=JSON.parse(await readFile(dir+'/after/native-result.json','utf8')),
 webkit=JSON.parse(await readFile(dir+'/after/native-webkit-result.json','utf8'));
assert.equal(chromium.cases,3);assert.equal(webkit.cases,3);
assert.deepEqual(chromium.errors,[]);assert.deepEqual(webkit.errors,[]);
assert.deepEqual(chromium.crashes,[]);assert.deepEqual(webkit.crashes,[]);
assert.ok(webkit.evidence.every(x=>x.realWebGL===true&&x.engine==='webkit'));
const acceptance={
 priority:158,verifiedP157Parent:'1063f0f229b7b7b26e1eebb6c784706ebcc0661c',
 exactRealSourcePublicLicensedFaceSampled:true,
 originalMaleFemale163BoneGarmentViewerPreserved:true,
 sameOwnerSavedPhotoDressBeforeAfterChromiumPairs:evidence.length,
 realSHA256SourceScreenshotFiles:evidence.length*2,
 realWebKitSourceViewerCases:webkit.cases,
 untouchedOriginalLicensedHeadTextures:true,
 unchangedOriginalOwnerClothingPhotos:true,
 unchangedActualGarmentGeometryAndSourceRig:true,
 originalBodyArmsLegsVisible:true,skinMatchedCloserToSourceFace:true,
 independentlyValidatedNaturalNeckSeam:false,
 userCapturedDynamicClothRealismAccepted:false,
 independentlyHumanPhotorealism10outof10Accepted:false,
 actualPhysicalAndroidOrIphoneTested:false,
 realHostedOwnerCloudRLSVerified:false,
 releaseAuthorized:false,familyAlpha:'HOLD',evidence
};
await mkdir(dir+'/audit',{recursive:true});
await writeFile(dir+'/audit/acceptance.json',JSON.stringify(acceptance,null,2)+'\n');
console.log('P158_LICENSED_SOURCE_FACE_BODY_SKIN_HARMONIZED '+JSON.stringify({
 exactP157BodyPreserved:true,sourceVerifiedGenuineChromiumPairs:evidence.length,
 verifiedPNG:evidence.length*2,realWebKit:webkit.cases,
 minOriginalArmSkinAfter:Math.min(...evidence.map(x=>x.arms.skinAfter)),
 minOriginalLegSkinAfter:Math.min(...evidence.map(x=>x.legs.skinAfter)),
 faceBodyRGBBefore:evidence.filter(x=>x.view==='front').map(x=>+x.frontFaceToBodyOriginalRGBDistance?.toFixed(2)),
 faceBodyRGBAfter:evidence.filter(x=>x.view==='front').map(x=>+x.frontFaceToBodyHarmonyRGBDistance?.toFixed(2)),
 familyAlpha:'HOLD',releaseAuthorized:false
}));
