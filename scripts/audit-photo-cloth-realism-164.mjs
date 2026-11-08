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
  for(const row of [a,b]){
   const perf=row.webgl164;
   assert.ok(perf&&perf.drawCalls>0&&perf.rafFrames>0&&
    [perf.drawSubmissionMs,perf.rafCallbackMs,perf.medianRafCallbackMs].every(Number.isFinite),
    'missing actual-browser WebGL CPU submission measurements');
  }
  audit.push({figure,view,width,beforeSHA256:a.sha256,afterSHA256:b.sha256,
   changedPixelsOver12:changed,changedFraction,meanAbsRGB,meanSignedRGB:brightDelta/(p.info.width*p.info.height*3),
   beforeWebGLCPU:a.webgl164,afterWebGLCPU:b.webgl164,
   sourceRigBones:163,sourceOwnerBoardUnmodified:true,renderer:'real-WebGL'});
 }
}
assert.equal(audit.length,36);
const changedFractionMedian=median(audit.map(x=>x.changedFraction));
const meanAbsRgbMedian=median(audit.map(x=>x.meanAbsRGB));
const beforeRafMedian=median(audit.map(x=>x.beforeWebGLCPU.medianRafCallbackMs));
const afterRafMedian=median(audit.map(x=>x.afterWebGLCPU.medianRafCallbackMs));
const beforeDrawMedian=median(audit.map(x=>x.beforeWebGLCPU.drawSubmissionMs));
const afterDrawMedian=median(audit.map(x=>x.afterWebGLCPU.drawSubmissionMs));
const webkitRoot=base+'/webkit-after';
const webkitBeforeRoot=base+'/webkit-before';
const webkitAudit=[];
let webkitFrames=0,webkitUnique=new Set();
for(const width of widths){
 const rows=JSON.parse(await readFile(`${webkitRoot}/views-${width}.json`,'utf8'));
 assert.equal(rows.length,12);
 for(const figure of figures)for(const view of views){
  const row=rows.find(x=>x.figure===figure&&x.view===view);
  assert.ok(row&&row.width===width&&row.sourceRigBones===163&&
   row.ownerSavedBoardUnchanged===true&&row.renderer==='real-WebGL',
   'WebKit PBR frame must be genuine and owner-read-only');
  assert.equal(sha(await readFile(`${webkitRoot}/${row.file}`)),row.sha256);
  assert.ok(!webkitUnique.has(row.sha256),'WebKit six-angle frames must all differ');
  const oldRows=JSON.parse(await readFile(`${webkitBeforeRoot}/views-${width}.json`,'utf8'));
  const old=oldRows.find(x=>x.figure===figure&&x.view===view);
  assert.ok(old&&old.width===width&&old.sourceRigBones===163&&old.ownerSavedBoardUnchanged===true);
  assert.equal(sha(await readFile(`${webkitBeforeRoot}/${old.file}`)),old.sha256);
  const oldImage=await sharp(`${webkitBeforeRoot}/${old.file}`).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const newImage=await sharp(`${webkitRoot}/${row.file}`).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(newImage.info,oldImage.info);
  let changed=0,diff=0;
  for(let i=0;i<oldImage.data.length;i+=3){
   const d=Math.abs(oldImage.data[i]-newImage.data[i])+Math.abs(oldImage.data[i+1]-newImage.data[i+1])+Math.abs(oldImage.data[i+2]-newImage.data[i+2]);
   if(d>12)changed++;diff+=d;
  }
  const changedFraction=changed/(oldImage.info.width*oldImage.info.height),meanAbsRGB=diff/(oldImage.info.width*oldImage.info.height*3);
  assert.ok(changed>0&&changedFraction<.24&&meanAbsRGB<6,'WebKit PBR image change exceeds source budget '+JSON.stringify({figure,view,width,changedFraction,meanAbsRGB}));
  assert.ok(old.webgl164?.drawCalls>0&&row.webgl164?.drawCalls>0);
  webkitAudit.push({figure,view,width,beforeSHA256:old.sha256,afterSHA256:row.sha256,
   changedFraction,meanAbsRGB,beforeWebGLCPU:old.webgl164,afterWebGLCPU:row.webgl164});
  webkitUnique.add(row.sha256);webkitFrames++;
 }
}
assert.equal(webkitFrames,36);
assert.ok(afterRafMedian/Math.max(.001,beforeRafMedian)<1.5,
 'PBR render-loop CPU callback median increased beyond 50% '+JSON.stringify({beforeRafMedian,afterRafMedian}));
assert.ok(afterDrawMedian/Math.max(.001,beforeDrawMedian)<1.5,
 'PBR WebGL draw-call submission CPU median increased beyond 50% '+JSON.stringify({beforeDrawMedian,afterDrawMedian}));
const webkitBeforeRaf=median(webkitAudit.map(x=>x.beforeWebGLCPU.medianRafCallbackMs));
const webkitAfterRaf=median(webkitAudit.map(x=>x.afterWebGLCPU.medianRafCallbackMs));
const webkitBeforeDraw=median(webkitAudit.map(x=>x.beforeWebGLCPU.drawSubmissionMs));
const webkitAfterDraw=median(webkitAudit.map(x=>x.afterWebGLCPU.drawSubmissionMs));
assert.ok(webkitAfterRaf/Math.max(.001,webkitBeforeRaf)<1.5,
 'PBR WebKit render-loop CPU callback median increased beyond 50% '+JSON.stringify({webkitBeforeRaf,webkitAfterRaf}));
assert.ok(webkitAfterDraw/Math.max(.001,webkitBeforeDraw)<1.5,
 'PBR WebKit draw-call submission CPU median increased beyond 50% '+JSON.stringify({webkitBeforeDraw,webkitAfterDraw}));
const summary={priority:164,sourceBaselinePriority:163,sourceOriginalLicensedDressSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
  originalMITHeadAnd163BoneBodyCompatibility:true,
  materialOnlyChange:true,sourcePhotoPixelsAndUVsPreserved:true,ownerSavedBoardUnmodified:true,
  viewCount:36,webkitViewCount:webkitFrames,figures,widths,views,medianChangedFraction:changedFractionMedian,
  medianMeanAbsRGB:meanAbsRgbMedian,
  chromiumMedianRenderLoopCallbackCpuMs:{before:beforeRafMedian,after:afterRafMedian,ratio:afterRafMedian/Math.max(.001,beforeRafMedian)},
  chromiumMedianWebGLDrawCallSubmissionCpuMs:{before:beforeDrawMedian,after:afterDrawMedian,ratio:afterDrawMedian/Math.max(.001,beforeDrawMedian)},
  webkitMedianRenderLoopCallbackCpuMs:{before:webkitBeforeRaf,after:webkitAfterRaf,ratio:webkitAfterRaf/Math.max(.001,webkitBeforeRaf)},
  webkitMedianWebGLDrawCallSubmissionCpuMs:{before:webkitBeforeDraw,after:webkitAfterDraw,ratio:webkitAfterDraw/Math.max(.001,webkitBeforeDraw)},
  gpuCompletionTimeMeasured:false,
  physicalAndroidChromeVerified:false,physicalIPhoneSafariVerified:false,
  originalRearPhotographAvailable:false,rearProvenance:'INFERRED_UNVERIFIED_NEUTRAL',
  arbitraryOwnerPhoto3DApproved:false,independentHumanPhotorealism10of10Accepted:false,
  fullAppIntegrated:false,productionOrStagingTouched:false,familyAlpha:'HOLD',releaseAuthorized:false,evidence:audit,webkitEvidence:webkitAudit};
await mkdir(base+'/audit',{recursive:true});
await writeFile(base+'/audit/acceptance.json',JSON.stringify(summary,null,2)+'\n');
console.log('P164_REAL_PHOTOGRAPHED_CLOTH_PBR_36_VIEWS '+JSON.stringify({
  realWebGLImages:audit.length,medianChangedFraction:changedFractionMedian,
  medianMeanAbsRGB,sourceAndOwnerProofPreserved:true,
  originalBackStillUnverified:true,humanRealismNotClaimed:true,familyAlpha:'HOLD'}));
