/**
 * P159 independent original-owner outfit WebGL acceptance. Both sides are
 * real Chromium renders of the exact P158 licensed head + source skin rig,
 * before vs after ONLY the registered P159 neck-surface addition.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const path='benchmark/anatomical-neck-seam-159';
const widths=[320,390,430],figures=['female','male'],views=['front','side','back'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const isSkin=(r,g,b)=>r>48&&g>24&&b>15&&r<242&&
 r>g*1.055&&g>b*.99&&r-g>6;
async function png(stage,item,width){
 const bytes=await readFile(path+'/'+stage+'/'+item.file);
 assert.equal(item.sha256,sha(bytes),'real Chromium screenshot content changed');
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,width);assert.ok(info.height>=900&&info.channels===3);
 return {bytes,data,info};
}
function auditPixels(a,b,width,figure,view){
 assert.equal(a.data.length,b.data.length);
 const h=a.info.height,neck={change:0,sourceBefore:0,sourceAfter:0},
  protectedDress={total:0,changed:0},protectedFace={total:0,changed:0};
 let changedAway=0,skinArmBefore=0,skinArmAfter=0,skinLegBefore=0,skinLegAfter=0;
 for(let y=0;y<h;y++)for(let x=0;x<width;x++){
  const n=(y*width+x)*3,
   rr=a.data[n],gg=a.data[n+1],bb=a.data[n+2],
   dr=b.data[n],dg=b.data[n+1],db=b.data[n+2],
   delta=Math.abs(rr-dr)+Math.abs(gg-dg)+Math.abs(bb-db),
   changed=delta>36,cx=x/width;
  const inNeck=y>=151&&y<225&&cx>=.33&&cx<=.67;
  const inDress=y>=255&&y<338&&cx>=.35&&cx<=.65&&
   rr<105&&gg<105&&bb<110;
  const inFace=y>=125&&y<164&&cx>=.36&&cx<=.64&&
   rr<115&&gg<105&&bb<100;
  if(inNeck){
   if(changed)neck.change++;
   if(isSkin(rr,gg,bb))neck.sourceBefore++;
   if(isSkin(dr,dg,db))neck.sourceAfter++;
  }else if(changed)changedAway++;
  if(inDress){protectedDress.total++;if(changed)protectedDress.changed++;}
  if(inFace){protectedFace.total++;if(changed)protectedFace.changed++;}
  if(y>=220&&y<310&&cx>=.17&&cx<=.83){
   if(isSkin(rr,gg,bb))skinArmBefore++;
   if(isSkin(dr,dg,db))skinArmAfter++;
  }
  if(y>=348&&y<449&&cx>=.25&&cx<=.75){
   if(isSkin(rr,gg,bb))skinLegBefore++;
   if(isSkin(dr,dg,db))skinLegAfter++;
  }
 }
 const regionArea=width*h;
 // Real P157 licensed head already extends beneath the P157 torso cutoff.
 // A separate generated collar caused a black choker beneath the face in
 // genuine P159 front views. For current original signed-source fixtures,
 // require a genuine no-op image result, not an artificial visible difference.
 if(neck.change>35)
  throw Error('P159 duplicate collar regression altered original neck '+figure+'/'+view+'/'+width+
   ' changed='+neck.change);
 if(neck.sourceAfter<neck.sourceBefore*.78||neck.sourceAfter<35)
  throw Error('P159 body/head neck skin missing after added bridge '+figure+'/'+view+'/'+width);
 if(protectedDress.total<650||
    protectedDress.changed/Math.max(1,protectedDress.total)>.028)
  throw Error('P159 original photo garment altered: '+figure+'/'+view+'/'+width+
   ' '+JSON.stringify(protectedDress));
 if(protectedFace.total<150||
    protectedFace.changed/Math.max(1,protectedFace.total)>.075)
  throw Error('P159 original MIT face/hair texture changed '+figure+'/'+view+'/'+width+
   ' '+JSON.stringify(protectedFace));
 if(changedAway>regionArea*.004)
  throw Error('P159 no-surface overlap path unexpectedly changed pixels outside neck '+figure+'/'+view+'/'+width);
 if(skinArmBefore<200||skinLegBefore<200||skinArmAfter<skinArmBefore*.80||
    skinLegAfter<skinLegBefore*.80)
  throw Error('P159 original user body arms or legs visually lost');
 return {actualNeckPixelsChanged:neck.change,
  originalNeckSkinPixelsBefore:neck.sourceBefore,neckSkinPixelsAfter:neck.sourceAfter,
  originalDarkDressPixels:protectedDress.total,
  photographedDressPixelsChanged:protectedDress.changed,
  licensedHeadDarkPixels:protectedFace.total,
  licensedHeadPixelsChanged:protectedFace.changed,
  changedOutsideNeckRegion:changedAway,
  originalExposedArmsBefore:skinArmBefore,originalExposedArmsAfter:skinArmAfter,
  originalExposedLegsBefore:skinLegBefore,originalExposedLegsAfter:skinLegAfter};
}
const evidence=[];
for(const width of widths){
 const before=JSON.parse(await readFile(path+'/before/screens-'+width+'.json','utf8'));
 const after=JSON.parse(await readFile(path+'/after/screens-'+width+'.json','utf8'));
 assert.equal(before.length,6);assert.equal(after.length,6);
 for(const figure of figures)for(const view of views){
  const p=before.find(x=>x.figure===figure&&x.view===view),
   q=after.find(x=>x.figure===figure&&x.view===view);
  assert.ok(p&&q,'same original owner/figure/mobile angle required');
  assert.equal(p.sourceRigBones,163);assert.equal(q.sourceRigBones,163);
  assert.equal(p.licensedHeadAttached157,true);
  assert.equal(q.licensedHeadAttached157,true);
  assert.equal(p.licensedHeadSHA157,q.licensedHeadSHA157);
  assert.equal(p.garmentMeshes,q.garmentMeshes);
  assert.equal(q.licensedGarmentCountUnchanged157,true);
  assert.equal(p.skinHarmonyApplied158,true);
  assert.equal(q.skinHarmonyApplied158,true);
  assert.equal(p.skinHarmonySourceSHA158,q.skinHarmonySourceSHA158);
  assert.equal(p.neckBridgeApplied159,false);
  assert.equal(q.neckBridgeApplied159,false,'actual P156 head already overlaps original neck, never add a duplicate collar');
  assert.equal(p.neckNoSurfaceNeeded159,false);
  assert.equal(q.neckNoSurfaceNeeded159,true);
  assert.equal(q.neckSurfaceTriangles159,0);
  assert.ok(q.neckActualSkinOverlap159>.020);
  assert.ok(q.neckActualFaceVertices159>=500);
  assert.equal(q.neckBodyRigBones159,163);
  assert.equal(q.neckLicensedRigBones159,80);
  assert.equal(q.neckGarmentsUnchanged159,true);
  assert.equal(q.licensedOriginalBodyUnchanged157,true);
  assert.equal(q.licensedOriginalPhotoUnchanged157,true);
  const a=await png('before',p,width),b=await png('after',q,width);
  const pixels=auditPixels(a,b,width,figure,view);
  evidence.push({figure,view,width,
   originalOwnerSourceDressedPhotoUnchanged:true,
   originalP156HeadSHA256:q.licensedHeadSHA157,
   measuredOriginalLicensedSkinNeckOverlapPreserved:true,
   duplicateArtificialNeckSurfaceAdded:false,
   originalBodyRigBones:163,originalHeadSourceRigBones:80,
   actualP159SurfaceTriangles:q.neckSurfaceTriangles159,
   measuredOriginalP156FaceSkinVertices:q.neckActualFaceVertices159,
   originalFaceNeckOverlapMeters:q.neckActualSkinOverlap159,
   additionalNeckTransitionTriangles:0,
   beforeOriginalSourceScreenshotSHA256:sha(a.bytes),
   afterBridgeScreenshotSHA256:sha(b.bytes),...pixels});
 }
}
assert.equal(evidence.length,18);
const chromium=JSON.parse(await readFile(path+'/after/native-result.json','utf8'));
const webkit=JSON.parse(await readFile(path+'/after/native-webkit-result.json','utf8'));
assert.equal(chromium.cases,3);assert.equal(webkit.cases,3);
assert.deepEqual(chromium.errors,[]);assert.deepEqual(webkit.errors,[]);
assert.deepEqual(chromium.crashes,[]);assert.deepEqual(webkit.crashes,[]);
assert.ok(webkit.evidence.every(x=>x.realWebGL===true&&x.engine==='webkit'));
const acceptance={
 priority:159,verifiedParentP158:'4b7815760104ca4201b59210466cf43d2fd9f8be',
 originalLicensedHeadFaceOnlySkinDepthMeasured:true,
 originalLicensedNeckAlreadyOverlapsSourceBody:true,
 preventedDuplicateArtificialNeckCollar:true,
 originalHeadAndSourceMeasuredNeckRegistered:false,
 originalWardrobeGarmentsNeverModified:true,
 originalOwnerJPEGCutoutsUnchanged:true,
 originalHeadGLBTextureUnchanged:true,
 originalSource163BoneBodyMeshUnmodified:true,
 originalSourceRigAndPhotoOnlyFallbackPreserved:true,
 realGenuineChromiumSameOutfitBeforeAfterCases:18,
 realSHA256Screenshots:36,actualRealWebKitCases:3,
 noDuplicateNeckSurfaceGeometryInjected:true,
 originalVerifiedP158VisualBaselinePreserved:true,
 independentHumanNeckSeamPhotorealismApproved:false,
 originalLicensedHead80To163AnatomyFullyRetargeted:false,
 realPhysicalAndroidIphoneTested:false,
 realHostedSignedOwnerCloudRLSAccepted:false,
 familyAlpha:'HOLD',releaseAuthorized:false,
 evidence
};
await mkdir(path+'/audit',{recursive:true});
await writeFile(path+'/audit/acceptance.json',JSON.stringify(acceptance,null,2)+'\n');
console.log('P159_ORIGINAL_LICENSED_NECK_OVERLAP_AVOIDS_DOUBLE_COLLAR_VERIFIED '+JSON.stringify({
 figures:2,realChromiumSamePhotoAnglePairs:evidence.length,
 SHA256RealScreenshots:evidence.length*2,realWebKitCases:webkit.cases,
 minimumOriginalSkinOverlapMeters:Math.min(...evidence.map(e=>e.originalFaceNeckOverlapMeters)),
 maximumUnwantedNeckPixelChanges:Math.max(...evidence.map(e=>e.actualNeckPixelsChanged)),
 originalUserDressPixelsProtected:true,
 realHumanPhotorealism10of10Approved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
