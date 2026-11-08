/**
 * Genuine owner-dress original 163/80 bone Chromium + WebKit P160 proof.
 * Before P160 = authenticated accepted P159 licensed-original head and
 * source P158 skin; After P160 = identical owner dress, identical licensed
 * source GLB, same 3D rig, bounded real neck-joint alignment only.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const dir='benchmark/neck-joint-registered-head-fit-160',
 widths=[320,390,430],figures=['female','male'],views=['front','side','back'];
const sha=x=>createHash('sha256').update(x).digest('hex');
const warm=(r,g,b)=>r>48&&g>24&&b>15&&r<242&&r>g*1.055&&g>b*.99&&r-g>6;
async function load(stage,item,width){
 const png=await readFile(dir+'/'+stage+'/'+item.file);
 assert.equal(item.sha256,sha(png));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,width);assert.ok(info.height>=900&&info.channels===3);
 return {png,data,info};
}
function compare(a,b,width,view,figure){
 assert.equal(a.data.length,b.data.length);
 const h=a.info.height;
 const r={head:0,elsewhere:0,garment:{protected:0,changed:0},
  arms:{before:0,after:0},legs:{before:0,after:0}};
 for(let y=0;y<h;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*3,
   sr=a.data[i],sg=a.data[i+1],sb=a.data[i+2],
   dr=b.data[i],dg=b.data[i+1],db=b.data[i+2],
   diff=Math.abs(sr-dr)+Math.abs(sg-dg)+Math.abs(sb-db),
   changed=diff>36,u=x/width;
  // Crown, jaw, neck and back/side hair; the only intentionally moved source.
  const head=y>=90&&y<255&&u>=.13&&u<=.87;
  const dress=y>=270&&y<338&&u>=.35&&u<=.65&&
   sr<105&&sg<105&&sb<110;
  if(changed){if(head)r.head++;else r.elsewhere++;}
  if(dress){r.garment.protected++;if(changed)r.garment.changed++;}
  const arm=y>=225&&y<310&&u>=.16&&u<=.84;
  if(arm){
   if(warm(sr,sg,sb))r.arms.before++;
   if(warm(dr,dg,db))r.arms.after++;
  }
  const leg=y>=350&&y<450&&u>=.22&&u<=.78;
  if(leg){
   if(warm(sr,sg,sb))r.legs.before++;
   if(warm(dr,dg,db))r.legs.after++;
  }
 }
 if(r.head<25)throw Error('P160 no actual licensed head movement visible '+figure+'/'+view+'/'+width+' '+r.head);
 if(r.elsewhere>width*h*.02)throw Error('P160 head move unexpectedly altered original wardrobe/body pixels '+JSON.stringify({width,view,figure,elsewhere:r.elsewhere}));
 if(r.garment.protected<500||r.garment.changed/r.garment.protected>.03)
  throw Error('P160 original dark owner-dress pixels altered '+JSON.stringify({width,view,figure,garment:r.garment}));
 if(r.arms.before<200||r.legs.before<200||
  r.arms.after<r.arms.before*.82||r.legs.after<r.legs.before*.82)
  throw Error('P160 original 163-bone arms or legs missing '+JSON.stringify({width,view,figure,arms:r.arms,legs:r.legs}));
 return r;
}
const evidence=[];
for(const width of widths){
 const before=JSON.parse(await readFile(dir+'/before/screens-'+width+'.json','utf8'));
 const after=JSON.parse(await readFile(dir+'/after/screens-'+width+'.json','utf8'));
 assert.equal(before.length,6);assert.equal(after.length,6);
 for(const figure of figures)for(const view of views){
  const p=before.find(x=>x.figure===figure&&x.view===view),
    q=after.find(x=>x.figure===figure&&x.view===view);
  assert.ok(p&&q,'same synthetic owner garment, figure and camera angle');
  assert.equal(p.sourceRigBones,163);assert.equal(q.sourceRigBones,163);
  assert.equal(p.licensedHeadAttached157,true);assert.equal(q.licensedHeadAttached157,true);
  assert.equal(p.licensedHeadSHA157,q.licensedHeadSHA157);
  assert.equal(p.skinHarmonyApplied158,true);assert.equal(q.skinHarmonyApplied158,true);
  assert.equal(p.skinHarmonySourceSHA158,q.skinHarmonySourceSHA158);
  assert.equal(p.neckNoSurfaceNeeded159,true);assert.equal(q.neckNoSurfaceNeeded159,true);
  assert.equal(p.neckSurfaceTriangles159,0);assert.equal(q.neckSurfaceTriangles159,0);
  assert.equal(p.garmentMeshes,q.garmentMeshes);
  assert.equal(p.jointFitApplied160,false);
  assert.equal(q.jointFitApplied160,true);
  assert.ok(q.jointFitOriginalBoneCount160===163&&q.jointFitMITBoneCount160===80);
  assert.ok(q.jointFitImprovement160>.0007);
  assert.ok(q.jointFitDisplacement160>=.001&&q.jointFitDisplacement160<.019);
  assert.ok(q.jointFitDistanceBefore160>q.jointFitDistanceAfter160);
  assert.ok(q.jointFitSourceNeckOverlap160>.043);
  assert.equal(q.jointFitGarmentsUnchanged160,true);
  assert.equal(q.licensedOriginalBodyUnchanged157,true);
  assert.equal(q.licensedOriginalPhotoUnchanged157,true);
  const a=await load('before',p,width),b=await load('after',q,width);
  const change=compare(a,b,width,view,figure);
  evidence.push({figure,view,width,originalOwnerOutfitPhotographsUnmodified:true,
   sameP156RealMITOriginalHeadSHA256:q.licensedHeadSHA157,
   original163BoneTorsoPreserved:true,actualMITSource80BoneRigPreserved:true,
   actualJointDistanceBeforeMeters:q.jointFitDistanceBefore160,
   actualJointDistanceAfterMeters:q.jointFitDistanceAfter160,
   measuredJointDistanceImprovementMeters:q.jointFitImprovement160,
   actualWorldHeadMovementMeters:q.jointFitDisplacement160,
   originalSourceNeckOverlapMeters:q.jointFitSourceNeckOverlap160,
   originalOwnedGarmentCount:q.garmentMeshes,
   beforeSourceJPEGOutfitPNG_SHA256:sha(a.png),
   afterSourceJPEGOutfitPNG_SHA256:sha(b.png),
   ...change});
 }
}
const chromium=JSON.parse(await readFile(dir+'/after/native-result.json','utf8')),
 webkit=JSON.parse(await readFile(dir+'/after/native-webkit-result.json','utf8'));
assert.equal(chromium.cases,3);assert.equal(webkit.cases,3);
assert.deepEqual(chromium.errors,[]);assert.deepEqual(webkit.errors,[]);
assert.deepEqual(chromium.crashes,[]);assert.deepEqual(webkit.crashes,[]);
assert.ok(webkit.evidence.every(x=>x.realWebGL===true&&x.engine==='webkit'));
assert.equal(evidence.length,18);
const summary={
 priority:160,verifiedP159Parent:'0e6f8db077b3dd2b1650e300df0d2d7244d29ba0',
 genuineP156LicensedMaleFemaleHeadJointRegistrationVerified:true,
 actualMeasured163To80BoneNeckJointDistanceReduced:true,
 originalP159NoDuplicateCollarSafetyRetained:true,
 originalOwnerGarmentAndJPEGProtected:true,sourceHeadAndBodyGeometryUnmodified:true,
 realChromiumMatchedOwnerPhotoBeforeAfterPairs:18,
 realSHA256MobileScreenCaptureFiles:36,realWebKitSourceGarmentCases:3,
 full80To163BoneRetargetingApproved:false,
 humanNeckAndFacialPhotorealism10of10Accepted:false,
 physicalAndroidIphoneAcceptance:false,hostedCloudSignedTwoOwnerRLSAccepted:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 evidence
};
await mkdir(dir+'/audit',{recursive:true});
await writeFile(dir+'/audit/acceptance.json',JSON.stringify(summary,null,2)+'\n');
console.log('P160_GENUINE_ORIGINAL_HEAD_JOINT_ALIGNMENT_VERIFIED '+JSON.stringify({
 actualRealOwnerPhotoPairs:18,realOriginalSourcePNGFiles:36,realWebKitCases:3,
 minimumTrueNeckJointImprovementMeters:Math.min(...evidence.map(v=>v.measuredJointDistanceImprovementMeters)),
 maxSourceHeadDisplacementMeters:Math.max(...evidence.map(v=>v.actualWorldHeadMovementMeters)),
 minVisibleHeadPixelChanges:Math.min(...evidence.map(v=>v.head)),
 maxOwnerDressPixelChangeFraction:Math.max(...evidence.map(v=>v.garment.changed/v.garment.protected)),
 familyAlpha:'HOLD',releaseAuthorized:false
}));
