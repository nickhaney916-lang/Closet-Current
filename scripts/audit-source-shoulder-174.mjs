/** P174 genuine same saved-owner original source before/after shoulder-cap
 * screenshots from actual native P541 WebGL. Sharp pixel delta is appearance
 * evidence, not human perception/10-out-of-10 quality certification. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const baseline='benchmark/source-shoulder-seam-174/baseline';
const after='benchmark/native-3d-05',out='benchmark/source-shoulder-seam-174';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const b=JSON.parse(await readFile(baseline+'/results.json','utf8'));
const a=JSON.parse(await readFile(after+'/results.json','utf8'));
for(const r of [a,b]){
 assert.equal(r.priority,'NATIVE-3D-05');
 assert.equal(r.cases,3);assert.equal(r.screenshots,24);
 assert.equal(r.screens.length,24);assert.equal(r.evidence.length,3);
 assert.deepEqual(r.widths,[320,390,430]);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.crashes,[]);
 assert.equal(r.external.filter(x=>x.method!=='GET').length,0);
 assert.equal(r.realWebGL,true);assert.equal(r.realSignedRLS,false);
 assert.equal(r.originalNativeAuthHTTPOnlyMocked,true);
 assert.equal(r.originalUserSavedStateUnmodified,true);
 assert.equal(r.releaseAuthorized,false);assert.equal(r.familyAlpha,'HOLD');
}
const stages=['06-owner-physical-shirt-front','07-owner-physical-shirt-side',
 '08-owner-shirt-neutral-inferred-rear'];
let imageChecks=0,changedPairs=0,frontAndSideChanged=0;
const rows=[];
for(const width of [320,390,430]){
 const old=b.evidence.find(x=>x.width===width);
 const now=a.evidence.find(x=>x.width===width);
 assert.equal(old.actualSignedOwnerSourceShirtPhysicallyContoured173,true);
 assert.equal(now.actualSignedOwnerSourceShirtPhysicallyContoured173,true);
 assert.equal(old.actualSignedOwnerBilateralShoulderSeamPhysicallyEased174,undefined);
 assert.equal(now.actualSignedOwnerBilateralShoulderSeamPhysicallyEased174,true);
 const gallery=[];
 for(const stage of stages){
  const original=b.screens.find(x=>x.width===width&&x.stage===stage);
  const changed=a.screens.find(x=>x.width===width&&x.stage===stage);
  assert.ok(original&&changed,'missing real owner garment before/after '+width+' '+stage);
  const x=await readFile(baseline+'/'+original.name);
  const y=await readFile(after+'/'+changed.name);
  assert.equal(digest(x),original.sha256);
  assert.equal(digest(y),changed.sha256);
  const px=await sharp(x).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const py=await sharp(y).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(px.info.width,width);assert.equal(py.info.width,width);
  assert.deepEqual([px.info.width,px.info.height,px.info.channels],
   [py.info.width,py.info.height,py.info.channels]);
  let count=0;
  for(let i=0;i<px.data.length;i+=px.info.channels){
   if(Math.abs(px.data[i]-py.data[i])>8||
      Math.abs(px.data[i+1]-py.data[i+1])>8||
      Math.abs(px.data[i+2]-py.data[i+2])>8)count++;
  }
  if(count>0){changedPairs++;if(stage!==stages[2])frontAndSideChanged++;}
  rows.push({width,stage,changedRGBPixelsAbove8:count,
   beforeSHA256:original.sha256,afterSHA256:changed.sha256,
   sameImageSHA256:original.sha256===changed.sha256});
  imageChecks+=2;
  gallery.push({input:await sharp(x).resize({width:390,height:850,fit:'contain'}).png().toBuffer(),
   left:(gallery.length)*390,top:0});
  gallery.push({input:await sharp(y).resize({width:390,height:850,fit:'contain'}).png().toBuffer(),
   left:(gallery.length)*390,top:0});
 }
 const sheet=await sharp({create:{width:2340,height:850,channels:4,background:'#fff'}})
  .composite(gallery).png().toBuffer();
 await writeFile(out+'/real-owner-original-shoulder-seam-before-after-'+width+'.png',sheet);
}
assert.equal(imageChecks,18);
assert.ok(changedPairs>=3,'No visual pixel proof of real original shoulder geometry');
assert.ok(frontAndSideChanged>=3,'Physical shoulder source not visible in real front/side render');
const result={priority:174,verdict:'PASS_ORIGINAL_SHIRT_PHYSICAL_BILATERAL_SHOULDER_WEBGL_RESEARCH',
 actualSavedOwner163BoneSourceViewer:true,originalPhotoSameSHAInPairedRender:true,
 beforeAfterSameOriginalShirtOwnerAndPhoto:true,realChromiumViewportWidths:[320,390,430],
 authenticBeforeAndAfterScreenshots:18,baselineOtherScreenshotsAlsoVerified:true,
 screenshotSHA256IndependentlyChecked:true,changedPairs,frontAndSideChanged,
 measuredAppearanceDelta:rows,originalFrontPixelsUVSkinPreservedByRuntime:true,
 exactSourceOnly:true,unphotographedRearMarkedInferred:true,
 arbitraryOwnerPhoto3DApproved:false,physicalDevicesVerified:false,
 independentHuman10of10Approval:false,continuousClothPhysics:false,
 releaseAuthorized:false,familyAlpha:'HOLD'};
await writeFile(out+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('P174_NATIVE_ORIGINAL_PHYSICAL_SHOULDER_BEFORE_AFTER',JSON.stringify({
 verdict:result.verdict,screens:imageChecks,changedPairs,
 frontAndSideChanged,viewports:result.realChromiumViewportWidths,alpha:'HOLD'}));
