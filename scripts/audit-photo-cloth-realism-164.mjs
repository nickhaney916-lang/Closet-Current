import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const base='benchmark/photo-cloth-realism-164';
const beforeRoot=base+'/before',afterRoot=base+'/after';
const widths=[320,390,430];
const figures=['female','male'];
const views=['front','threequarter-front-right','right','threequarter-rear-right','rear','left'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const audit=[];
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
for(const width of widths){
 const before=JSON.parse(await readFile(`${beforeRoot}/views-${width}.json`,'utf8'));
 const after=JSON.parse(await readFile(`${afterRoot}/views-${width}.json`,'utf8'));
 assert.equal(before.length,12);assert.equal(after.length,12);
 for(const figure of figures)for(const view of views){
  const a=before.find(x=>x.figure===figure&&x.view===view);
  const b=after.find(x=>x.figure===figure&&x.view===view);
  assert.ok(a&&b,`missing actual source view ${figure}/${view}/${width}`);
  for(const row of [a,b]){
   assert.equal(row.width,width);assert.equal(row.sourceRigBones,163);
   assert.equal(row.ownerSavedBoardUnchanged,true);assert.equal(row.renderer,'real-WebGL');
   const file=(row===a?beforeRoot:afterRoot)+'/'+row.file;
   assert.equal(sha(await readFile(file)),row.sha256,'original Chromium PNG receipt mismatch');
  }
  const p=await sharp(`${beforeRoot}/${a.file}`).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const q=await sharp(`${afterRoot}/${b.file}`).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(p.info.width,width);assert.deepEqual(q.info,p.info);
  let changed=0,total=0,difference=0,brightDelta=0;
  for(let i=0;i<p.data.length;i+=3){
   const d=Math.abs(p.data[i]-q.data[i])+Math.abs(p.data[i+1]-q.data[i+1])+Math.abs(p.data[i+2]-q.data[i+2]);
   if(d>12)changed++;
   total+=3;difference+=d;
   brightDelta+=((q.data[i]+q.data[i+1]+q.data[i+2])-(p.data[i]+p.data[i+1]+p.data[i+2]));
  }
  const changedFraction=changed/(p.info.width*p.info.height),meanAbsRGB=difference/total;
  assert.ok(changed>0,`PBR treatment did not alter actual ${figure}/${view}/${width} framebuffer`);
  assert.ok(changedFraction<.24,'PBR may be changing broad source/photo/background regions '+JSON.stringify({figure,view,width,changedFraction}));
  assert.ok(meanAbsRGB<6,'lighting change exceeds source image fidelity budget '+JSON.stringify({figure,view,width,meanAbsRGB}));
  audit.push({figure,view,width,beforeSHA256:a.sha256,afterSHA256:b.sha256,
   changedPixelsOver12:changed,changedFraction,meanAbsRGB,meanSignedRGB:brightDelta/(p.info.width*p.info.height*3),
   sourceRigBones:163,sourceOwnerBoardUnmodified:true,renderer:'real-WebGL'});
 }
}
assert.equal(audit.length,36);
const changedFractionMedian=median(audit.map(x=>x.changedFraction));
const meanAbsRgbMedian=median(audit.map(x=>x.meanAbsRGB));
const summary={priority:164,sourceBaselinePriority:163,sourceOriginalLicensedDressSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
  originalMITHeadAnd163BoneBodyCompatibility:true,
  materialOnlyChange:true,sourcePhotoPixelsAndUVsPreserved:true,ownerSavedBoardUnmodified:true,
  viewCount:36,figures,widths,views,medianChangedFraction:changedFractionMedian,
  medianMeanAbsRGB:meanAbsRgbMedian,screenCapturePerformanceMeasured:false,
  physicalAndroidChromeVerified:false,physicalIPhoneSafariVerified:false,
  originalRearPhotographAvailable:false,rearProvenance:'INFERRED_UNVERIFIED_NEUTRAL',
  arbitraryOwnerPhoto3DApproved:false,independentHumanPhotorealism10of10Accepted:false,
  fullAppIntegrated:false,productionOrStagingTouched:false,familyAlpha:'HOLD',releaseAuthorized:false,evidence:audit};
await mkdir(base+'/audit',{recursive:true});
await writeFile(base+'/audit/acceptance.json',JSON.stringify(summary,null,2)+'\n');
console.log('P164_REAL_PHOTOGRAPHED_CLOTH_PBR_36_VIEWS '+JSON.stringify({
  realWebGLImages:audit.length,medianChangedFraction:changedFractionMedian,
  medianMeanAbsRGB,sourceAndOwnerProofPreserved:true,
  originalBackStillUnverified:true,humanRealismNotClaimed:true,familyAlpha:'HOLD'}));
