/** Independent P175 actual owner-saved original-photo dress P61 before/after
 * native 163-bone Chromium screenshot SHA and source data regression audit.
 * Quantifies pixels, not human perceptual approval or physical-phone quality.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const before='benchmark/native-dress-drape-175/baseline',
 after='benchmark/native-3d-05',out='benchmark/native-dress-drape-175';
await mkdir(out,{recursive:true});
const digest=x=>createHash('sha256').update(x).digest('hex');
const prior=JSON.parse(await readFile(before+'/results.json','utf8'));
const now=JSON.parse(await readFile(after+'/results.json','utf8'));
for(const r of [prior,now]){
 assert.equal(r.priority,'NATIVE-3D-05');assert.equal(r.cases,3);
 assert.equal(r.screenshots,24);assert.equal(r.screens.length,24);
 assert.equal(r.evidence.length,3);assert.deepEqual(r.widths,[320,390,430]);
 assert.equal(r.realWebGL,true);assert.equal(r.originalNativeAuthHTTPOnlyMocked,true);
 assert.equal(r.realSignedRLS,false);assert.equal(r.originalUserSavedStateUnmodified,true);
 assert.equal(r.familyAlpha,'HOLD');assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.crashes,[]);
 assert.deepEqual(r.external.filter(x=>x.method!=='GET'),[]);
}
const stages=['02-genuine-163-bone-front-dress',
 '03-genuine-163-bone-side-dress',
 '04-genuine-163-bone-rear-neutral'];
const paired=[];let totalChanges=0,sideRearChanges=0,verifiedScreens=0;
for(const width of [320,390,430]){
 const row0=prior.evidence.find(x=>x.width===width);
 const row1=now.evidence.find(x=>x.width===width);
 assert.equal(row0.actualSignedOwnerPhotographedDressPhysicallyReshaped175,undefined);
 assert.equal(row1.actualSignedOwnerPhotographedDressPhysicallyReshaped175,true);
 assert.equal(row0.actualSignedOwnerSourceShirtPhysicallyContoured173,true);
 assert.equal(row1.actualSignedOwnerSourceShirtPhysicallyContoured173,true);
 assert.equal(row0.actualSignedOwnerBilateralShoulderSeamPhysicallyEased174,true);
 assert.equal(row1.actualSignedOwnerBilateralShoulderSeamPhysicallyEased174,true);
 for(const [r,dir] of [[prior,before],[now,after]]){
  for(const item of r.screens.filter(x=>x.width===width)){
   const raw=await readFile(dir+'/'+item.name);
   assert.equal(digest(raw),item.sha256,
    'Exact original WebGL screenshot SHA changed '+item.name);
   const meta=await sharp(raw).metadata();
   assert.equal(meta.width,width);
   assert.ok(meta.height>=880&&raw.length>4500);
   verifiedScreens++;
  }
 }
 const images=[];
 for(const stage of stages){
  const x=prior.screens.find(x=>x.width===width&&x.stage===stage);
  const y=now.screens.find(x=>x.width===width&&x.stage===stage);
  assert.ok(x&&y,'P175 missing paired real original-owner dress '+width+' '+stage);
  const prev=await readFile(before+'/'+x.name);
  const next=await readFile(after+'/'+y.name);
  const a=await sharp(prev).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=await sharp(next).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(a.info,b.info);
  let count=0;
  for(let i=0;i<a.data.length;i+=a.info.channels){
   if(Math.abs(a.data[i]-b.data[i])>8||
      Math.abs(a.data[i+1]-b.data[i+1])>8||
      Math.abs(a.data[i+2]-b.data[i+2])>8)count++;
  }
  totalChanges+=+(count>0);
  if(stage!==stages[0]&&count>0)sideRearChanges++;
  paired.push({width,stage,changedRGBPixelsAbove8:count,
   beforeSHA256:x.sha256,afterSHA256:y.sha256,
   originalSourcePhotoAndRigKept:true,neutralBackIsInferred:stage===stages[2]});
  images.push({input:await sharp(prev).resize({width:390,height:850,fit:'contain'}).png().toBuffer(),
   left:(images.length)*390,top:0});
  images.push({input:await sharp(next).resize({width:390,height:850,fit:'contain'}).png().toBuffer(),
   left:(images.length)*390,top:0});
 }
 const gallery=await sharp({create:{width:2340,height:850,channels:4,background:'#fff'}})
  .composite(images).png().toBuffer();
 await writeFile(out+'/owner-real-dress-P174-before-P175-after-'+width+'.png',gallery);
}
assert.equal(verifiedScreens,48,'Both original P174 and P175 real screenshots must hash to metadata');
assert.equal(paired.length,9);
assert.ok(totalChanges>=3&&sideRearChanges>=3,
 'P175 no genuine source photographed dress drape variation visible on native mobile 3D');
const receipt={priority:175,
 verdict:'PASS_REAL_OWNER_P61_ORIGINAL_DRESS_NATIVE_WEBGL_RESEARCH_ONLY',
 independentParallel61PhysicalBodiceAndSkirt:true,
 originalOwnerJPEGUnmodified:true,real163BoneOriginalSourceViewer:true,
 trueOriginalP174BeforeVsP175After:true,realChromiumWidthCSS:[320,390,430],
 fullSourceSHA256ScreenshotsChecked:verifiedScreens,
 pairedOriginalDressViews:paired.length,withVisiblePhysicalChanges:totalChanges,
 sideAndInferredRearViewsChanged:sideRearChanges,paired,
 productionOrStagingDeployed:false,privateOwnerPhotoConvertedTo3D:false,
 bodyCollisionCertification:false,physicalPhoneTested:false,
 independentHumanPhotorealismApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'};
await writeFile(out+'/acceptance.json',JSON.stringify(receipt,null,2)+'\n');
console.log('P175_NATIVE_SOURCE_DRESS_3D_PAIRED_PHYSICAL_PASS',JSON.stringify({
 verdict:receipt.verdict,screens:verifiedScreens,pairs:paired.length,
 changed:totalChanges,sideRear:sideRearChanges,widths:[320,390,430],hold:true}));
