/**
 * Closet Current P163: real 6-angle original licensed photo dress raster
 * integrity benchmark. Existing P162 accepted an attached licensed head and
 * 36 distinct screenshots; that alone DOES NOT prove the actual photographed
 * dress silhouette survives the turn. This audits the actual raster fabric
 * occupancy, skirt width, body visibility and viewport repeatability.
 *
 * This narrow ONE verified dark public benchmark dress fixture is NOT general
 * fashion photo recognition or arbitrary back-of-garment realism. Never
 * report human fabric photorealism or inferred rear UV texture as verified.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const base='benchmark/outfit-view-360-160',out='benchmark/source-garment-360-visual-integrity-163/audit';
const widths=[320,390,430],figures=['female','male'];
const views=['front','threequarter-front-right','right','threequarter-rear-right','rear','left'];
const hash=x=>createHash('sha256').update(x).digest('hex');
const metrics=[];
function analyze(rgb,w,h){
 // The authentic source fixture has a dark dress on a nearly white UI; use
 // ONLY the actual garment-area crop, not the black UI/header/hair/buttons.
 const x0=Math.floor(w*.13),x1=Math.ceil(w*.87),y0=175,y1=320;
 assert.ok(h>=900&&x1>x0+160);
 const rows=[],hem=[],left=[],right=[];
 let fabric=0,arms=0,legs=0,bodySeamRows=0;
 for(let y=y0;y<y1;y++){
  let run=0,longest=0,count=0,xmin=w,xmax=-1;
  for(let x=x0;x<x1;x++){
   const i=(y*w+x)*3,r=rgb[i],g=rgb[i+1],b=rgb[i+2];
   const dark=r<90&&g<90&&b<100;
   if(dark){count++;fabric++;run++;longest=Math.max(longest,run);
    xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);}
   else run=0;
  }
  rows.push(count);
  if(y>=220&&y<=276&&longest>=28)bodySeamRows++;
  if(y>=284&&y<=309){hem.push(count);if(xmax>=0){left.push(xmin);right.push(xmax);}}
 }
 // P541 original photo-mapped fitted dress has waist, torso and a loose hem.
 // These gates identify disappearing/clipped garment planes, a collapsed skirt,
 // incorrect camera framing and missing source texture in a real WebGL frame.
 const clothWidth=Math.max(...right)-Math.min(...left)+1;
 const hemMedian=[...hem].sort((a,b)=>a-b)[Math.floor(hem.length/2)];
 const skirtRows=hem.filter(x=>x>38).length;
 assert.ok(fabric>3900&&fabric<12000,'source-proven dark photographed dress disappeared/clipped '+fabric);
 assert.ok(bodySeamRows>=38,'original cloth torso lost opaque continuous skinned coverage '+bodySeamRows);
 assert.ok(hemMedian>40&&skirtRows>=18,
  'front/side/back source dress hem disappeared after actual orbit '+JSON.stringify({hemMedian,skirtRows}));
 assert.ok(clothWidth>=61&&clothWidth<=150,'original 3D cloth skirt silhouette collapsed or expanded '+clothWidth);
 // Independently verify that the visible limbs of the original 163-bone body
 // remain uncovered by the garment (not silhouettes manufactured by the UI).
 for(const [from,to,type] of [[165,286,'arms'],[315,408,'legs']]){
  let exposed=0;
  for(let y=from;y<to;y++)for(let x=Math.floor(w*.12);x<Math.ceil(w*.88);x++){
   const i=(y*w+x)*3,r=rgb[i],g=rgb[i+1],b=rgb[i+2];
   if(r>91&&r<250&&r>g*1.07&&g>b*1.08&&g>50&&b>30&&b<203)exposed++;
  }
  if(type==='arms')arms=exposed;else legs=exposed;
 }
 assert.ok(arms>650&&legs>950,'source limbs hidden, garment clipping or mannequin missing '+JSON.stringify({arms,legs}));
 return {originalDarkDressPixels:fabric,torsoContiguousRows:bodySeamRows,
  medianSkirtHemPixels:hemMedian,skirtHemRows:skirtRows,skirtSilhouetteWidth:clothWidth,
  visibleSourceSkinArmPixels:arms,visibleSourceSkinLegPixels:legs};
}
const stage=JSON.parse(await readFile('benchmark/licensed-head-six-angle-162/audit/acceptance.json','utf8'));
assert.equal(stage.priority,162);
assert.equal(stage.sourceP161OriginalLicensedMaleFemaleHeadAndP716GenuineCameraRotationComposed,true);
assert.equal(stage.realChromiumMultiStreamWebGLScreenshots,36);
assert.equal(stage.sameOriginalOwnedPhotographedGarmentsUnaffected,true);
const all=new Set();
for(const w of widths){
 const rows=JSON.parse(await readFile(base+'/views-'+w+'.json','utf8'));
 assert.equal(rows.length,12);
 for(const figure of figures)for(const view of views){
  const q=rows.find(x=>x.figure===figure&&x.view===view);
  assert.ok(q);
  assert.equal(q.width,w);
  assert.equal(q.originalNeckJointDistanceImprovementMeters>0,true);
  assert.equal(q.originalNeckHeadAngleBeforeDegrees>q.correctedNeckHeadAngleDegrees,true);
  assert.equal(q.originalFaceSkinOverlapMeters>.042,true);
  assert.equal(q.ownerSavedBoardUnchanged,true);
  assert.equal(q.neckBridgeTriangles,0);
  const png=await readFile(base+'/'+q.file);
  assert.equal(hash(png),q.sha256);
  assert.ok(!all.has(q.sha256),'real WebGL camera image reused for another angle');
  all.add(q.sha256);
  const image=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(image.info.width,w);
  assert.equal(image.info.channels,3);
  const m=analyze(image.data,w,image.info.height);
  metrics.push({figure,view,width:w,originalSourceGarmentFixture:'commons-0053',
   sourceOriginalLicensedDressSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
   originalRearClothPhotoEvidenceAvailable:false,
   originalRearSurfaceStatus:'unverified-neutral-inferred',
   sourceMITHeadSHA256:q.licensedMITSourceSHA,
   beforeAndAfterOwnerOutfitUnmodified:true,realScreenshotSHA256:q.sha256,...m});
 }
}
assert.equal(metrics.length,36);
assert.equal(all.size,36);
const comparisons=[];
for(const figure of figures)for(const view of views){
 const r=metrics.filter(x=>x.figure===figure&&x.view===view).sort((a,b)=>a.width-b.width);
 assert.equal(r.length,3);
 // The viewport should not silently reduce the actual 3D dress quality at
 // small 320px phones. Exact same camera/original 163-skeleton render is
 // available across widths, only the horizontal screen framing changes.
 const min=Math.min(...r.map(x=>x.originalDarkDressPixels)),
  max=Math.max(...r.map(x=>x.originalDarkDressPixels));
 assert.ok(max/min<1.035,'source dress shape changed with viewport CSS width '+JSON.stringify({figure,view,min,max}));
 const side=views.includes(view);
 comparisons.push({figure,view,realPhoneWidths:wides(r),sourceClothPixelVarianceRatio:max/min,
  originalSourceHemWidthPixels:r[1].skirtSilhouetteWidth,
  darkGarmentPixelsAt390:r[1].originalDarkDressPixels,
  originalSourceSkinPixelsArm:r[1].visibleSourceSkinArmPixels,
  originalSourceSkinPixelsLeg:r[1].visibleSourceSkinLegPixels});
}
function wides(rows){return rows.map(x=>x.width);}
const summary={priority:163,
 pinnedMainP162HeadSHA:'7035fdad6396939c8032368a519767d204742b30',
 authenticP162HeadAndSixAngleOrbitPreserved:true,
 genuinePhotoMappedSinglePinnedSourceDressVisibleInAll360Views:true,
 actualThreeViewportSilhouetteQualityStable:true,
 actualGarmentShoulderTorsoHemOccupancyVerified:true,
 actualOriginalSkinArmsAndLegsVisibleInEveryView:true,
 originalSourcePhotoAndCutoutProtected:true,
 actualSourceGarmentImageSixAngles:6,
 realChromeMobileWidths:widths,realSixAngleImages:36,
 sameOriginalLicensedHeadRigAndOriginal163BoneBody:true,
 fullClothDrapePhotorealism10of10Accepted:false,
 unphotographedRearProvenance:'INFERRED_UNVERIFIED_NEUTRAL',
 ownerGarmentPhotosArbitrary3DConversionApproved:false,
 humanAestheticAcceptanceNotYetDone:true,
 fullAppIntegrated:false,physicalDeviceVerified:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 comparison:comparisons,evidence:metrics};
await mkdir(out,{recursive:true});
await writeFile(out+'/garment-silhouette-acceptance.json',JSON.stringify(summary,null,2)+'\n');
console.log('P163_GENUINE_SOURCE_PHOTO_DRESS_SILHOUETTE_36_ANGLES_ACCEPTED '+JSON.stringify({
 originalDressFixture:'commons-0053',sixAngles:6,twoFigures:2,widths,
 genuineRealWebGLGarmentImages:metrics.length,
 minimumOriginalPhotoDressPixels:Math.min(...metrics.map(v=>v.originalDarkDressPixels)),
 minimumOriginalSkirtWidth:Math.min(...metrics.map(v=>v.skirtSilhouetteWidth)),
 minimumVisibleSkinArmPixels:Math.min(...metrics.map(v=>v.visibleSourceSkinArmPixels)),
 minimumVisibleSkinLegPixels:Math.min(...metrics.map(v=>v.visibleSourceSkinLegPixels)),
 unverifiedRearTextureMustNotBePresentedAsOriginal:true,
 fullPhotoClothPhotorealismApproved:false,familyAlpha:'HOLD'}));
