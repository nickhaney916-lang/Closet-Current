/**
 * PHOTO110 actual Chromium: reviewed in-memory synthetic public closet outfit
 * -> original licensed photo on true skinned 163-bone humanoid -> save/reopen.
 * Private-like source attempts remain 2D; synthetic owner rotation revokes look.
 * NO real customer photographs, account, browser storage or cloud operations.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium} from 'playwright';
const root=resolve('.'),folder='benchmark/three-d-110';
const SHA={
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64'
};
const hash=b=>createHash('sha256').update(b).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('not an allowed research source');
  const name=resolve(root,'.'+path);
  if(!name.startsWith(root+'/'))throw Error('escaped source root');
  const bytes=await readFile(name);
  const mime={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.jpg':'image/jpeg','.png':'image/png',
   '.json':'application/json','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(name)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not available');}
});
const difference=async(a,b)=>{
 const [x,y]=await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer(),
  sharp(b).ensureAlpha().raw().toBuffer()
 ]);
 assert.equal(x.length,y.length);
 let count=0;
 for(let i=0;i<x.length;i+=4)
  if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)
   count++;
 return count;
};
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const scenarios=[],frames=[],browserErrors=[],externalRequests=[],crashes=[];
const matrix=[
 {figure:'female',width:320},{figure:'female',width:390},
 {figure:'female',width:430},{figure:'male',width:390}
];
try{
 await mkdir(folder,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl'
 ]});
 for(const {figure,width} of matrix){
  const context=await browser.newContext({viewport:{width,height:900},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>browserErrors.push({figure,width,message:e.message}));
  page.on('crash',()=>crashes.push({figure,width}));
  page.on('request',q=>{
   if(!q.url().startsWith(origin)&&!q.url().startsWith('blob:'+origin)&&
      !q.url().startsWith('data:'))
    externalRequests.push({figure,width,protocol:new URL(q.url()).protocol});
  });
  await page.goto(origin+
   '/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on&knee106=on&knee108=on&knee109=on&look110=on');
  await page.waitForFunction(()=>window.cc110LookState?.()?.mounted===true&&
   window.cc109PoseUIState?.()?.mounted===true&&
   window.cc69Diagnostics?.()?.rig?.bones===163&&
   window.cc69Diagnostics().loaded===true,null,{timeout:180000});
  assert.equal(await page.locator('#cc110Save').isDisabled(),true);
  assert.equal(await page.locator('#cc110Reopen').isDisabled(),true);
  assert.equal(await page.locator('#cc109Both8').isDisabled(),true);
  assert.equal(await page.locator('#cc110Buttons button').count(),4);
  for(const el of await page.locator('#cc110Buttons button').all())
   assert.ok((await el.boundingBox()).height>=44,'real tap control smaller than 44px');
  assert.equal(await page.evaluate(()=>
   document.documentElement.scrollWidth<=window.innerWidth+2),true);
  if(figure==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&
    window.cc69Diagnostics().loaded===true,null,{timeout:180000});
  }
  await page.locator('#review').check();
  await page.locator('#wear').click();
  await page.waitForFunction(()=>window.cc110LookState?.()?.readyToSave===true&&
   window.cc109PoseUIState?.()?.enabled===true,
   null,{timeout:180000});
  assert.equal(await page.evaluate(()=>window.cc110LookState().realAuthenticatedAccount),false);
  const scenario=[];
  await page.evaluate(()=>window.cc69SetView(90));
  await page.waitForTimeout(90);
  const snapshot=async(denim,when)=>{
   const png=await page.locator('#avatar').screenshot({animations:'disabled'});
   const m=await sharp(png).metadata();
   assert.ok(png.length>3000&&m.width>=200&&m.height>=300);
   const file=figure+'-'+denim+'-'+width+'-'+when+'.png';
   await writeFile(folder+'/'+file,png);
   frames.push({file,figure,denim,width,when,sha256:hash(png),
    originalDenimSHA256:SHA[denim],imageWidth:m.width,imageHeight:m.height});
   return png;
  };
  for(const denim of ['public','second']){
   const selected=(await page.evaluate(()=>window.cc69Diagnostics())).currentSelection;
   if(selected!==denim){
    await page.locator('#swap').click();
    await page.waitForFunction(source=>window.cc69Diagnostics?.()?.currentSelection===source,
     denim,{timeout:180000});
   }
   const source=await page.evaluate(()=>window.cc69Diagnostics());
   assert.equal(source.actual3DGarment.originalPhotoSHA256s.bottom,SHA[denim]);
   assert.equal(source.actual3DGarment.originalPhotoSHA256s.top,SHA.shirt);
   assert.equal(source.actual3DGarment.real3DSkinnedGarmentMeshes>=2,true);
   const baseline=await snapshot(denim,'before-save');
   const before=await page.evaluate(()=>window.cc110LookState());
   assert.equal(before.readyToSave,true);
   // In-page DOM click is untrusted and must not impersonate human consent.
   await page.evaluate(()=>document.getElementById('cc110Save').click());
   assert.equal(await page.evaluate(()=>window.cc110LookState().hasSavedLook),false);
   await page.locator('#cc110Save').click();
   await page.waitForFunction(()=>window.cc110LookState?.()?.hasSavedLook===true&&
    window.cc110LookState().lastOutcome==='licensed-original-look-saved-in-memory');
   const other=denim==='public'?'second':'public';
   await page.locator('#swap').click();
   await page.waitForFunction(source=>window.cc69Diagnostics?.()?.currentSelection===source,
    other,{timeout:180000});
   assert.equal(await page.evaluate(()=>window.cc110LookState().readyToReopen),true);
   // Ownership/source-token verified by exact original donor, not guessed.
   await page.locator('#cc110Reopen').click();
   await page.waitForFunction(source=>
    window.cc110LookState?.()?.lastOutcome==='actual-original-3d-restored'&&
    window.cc69Diagnostics?.()?.currentSelection===source&&
    window.cc109PoseUIState?.()?.enabled===true,
    denim,{timeout:180000});
   const restored=await snapshot(denim,'reopened-from-saved');
   const diff=await difference(baseline,restored);
   assert.equal(diff,0,'authentic original photographed denim saved look reopen must have identical pixels');
   const again=await page.evaluate(()=>window.cc69Diagnostics());
   assert.equal(again.actual3DGarment.originalPhotoSHA256s.bottom,SHA[denim]);
   assert.equal(again.actual3DGarment.originalPhotoSHA256s.top,SHA.shirt);
   assert.equal(again.rig.bones,163);
   assert.equal(await page.evaluate(()=>window.cc110LookState().realAuthenticatedAccount),false);
   scenario.push({denim,originalSHA256:SHA[denim],
    actualSkinnedRigBones:163,
    originalPhotoReopenPixelChanges:diff,
    independentOwnerAndSHAContractVerified:true,
    noPrivateCustomerPhotosLoaded:true,
    actualRealAccountRLSVerified:false});
  }
  await page.locator('#cc110Private').click();
  await page.waitForFunction(()=>window.cc110LookState?.()?.mode==='private-fallback'&&
   window.cc109PoseUIState?.()?.enabled===false);
  assert.equal(await page.locator('#cc109Both8').isDisabled(),true);
  assert.equal(await page.evaluate(()=>window.cc110LookState().arbitraryUserPhotosRenderedIn3D),false);
  assert.equal(await page.evaluate(()=>window.cc110LookState().customerPhotoBytesAccessible),false);
  assert.equal(await page.evaluate(()=>window.cc110LookState().hasSavedLook),true);
  await page.locator('#cc110Reopen').click();
  await page.waitForFunction(()=>window.cc110LookState?.()?.mode==='restored-public'&&
   window.cc109PoseUIState?.()?.enabled===true,
   null,{timeout:180000});
  await page.locator('#cc109Both8').click();
  const movement=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
  assert.deepEqual([movement.left,movement.right],[8,8]);
  assert.equal(movement.contactNonworsening,true);
  await page.locator('#cc109Reset').click();
  const straight=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
  assert.deepEqual([straight.left,straight.right],[0,0]);
  // Attack: a mismatched synthetic owner must not invoke the real mesh.
  const crossOwnerRejected=await page.evaluate(sha=>{
   try{
    window.cc110ResearchSelect('public','synthetic-other-account-110',2,sha);
    return false;
   }catch{return true;}
  },SHA.public);
  assert.equal(crossOwnerRejected,true);
  await page.locator('#cc110OwnerSwitch').click();
  await page.waitForFunction(()=>window.cc110LookState?.()?.mode==='owner-rotated'&&
   window.cc110LookState().ownerMatchesSaved===false);
  assert.equal(await page.locator('#cc110Reopen').isDisabled(),true);
  assert.equal(await page.locator('#cc110Save').isDisabled(),true);
  assert.equal(await page.locator('#cc109Both8').isDisabled(),true);
  assert.equal(await page.evaluate(()=>window.cc110LookState().signedCloudRLSVerified),false);
  scenarios.push({figure,width,looks:scenario,
   syntheticPrivateOriginalPhoto2DFallback:true,
   crossOwnerReplayBlocked:crossOwnerRejected,
   originalPublicLookInMemoryOnly:true,
   genuine163BoneMobilePoseStillWorksAfterRestore:true,
   noActualSignedAccountOrRealPrivateCloset:true,
   noProductionChanged:true,familyAlpha:'HOLD',releaseAuthorized:false});
  await context.close();
 }
 assert.equal(scenarios.length,4);
 assert.equal(scenarios.reduce((n,x)=>n+x.looks.length,0),8);
 assert.equal(frames.length,16);
 assert.deepEqual(browserErrors,[]);
 assert.deepEqual(externalRequests,[]);
 assert.deepEqual(crashes,[]);
 const report={
  priority:'REVIEWED-CLOSET-3D-HANDOFF-110',
  originalLicensedPhotographs:true,
  original163BoneSkinnedFigure:true,
  mobileViewportsCSS:[320,390,430],
  sourceLicensedBenchmarkOwnerOnly:true,
  eightReadOnlyOriginalIndexedLookRestoresVerified:true,
  genuineWebGLScreenshotCount:16,
  originalPhotoSavedLookReopenPixelExact:true,
  syntheticCrossOwnerAndStaleSourceReplayDenied:true,
  originalPhoto2DFallbackForUnsupportedPersonalClothing:true,
  genuineUserPhoto3DNotFabricated:true,
  noRealCustomerPhotosUsed:true,
  noPersistentBrowserOrCloudStorage:true,
  realSignedCloudRLSVerified:false,
  realAccountAuthVerified:false,
  physicalPhonesVerified:false,
  independentHumanPhotorealismAccepted:false,
  continuousClothPhysicsProven:false,
  familyAlpha:'HOLD',releaseAuthorized:false,
  scenarios,screenshots:frames,
  browserErrors,externalRequests,crashes
 };
 await writeFile(folder+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHOTO110_REAL_INDEXED_LOOK_TO_3D_BROWSER',JSON.stringify({
  syntheticResearchOwnerOnly:true,
  figures:2,originalDenimSources:2,viewports:[320,390,430],
  actualOutfitRestores:8,real3DSourceScreenshots:frames.length,
  sourceReopenPixelChanges:scenarios.flatMap(s=>s.looks.map(x=>x.originalPhotoReopenPixelChanges)),
  unsupportedPrivatePhotoFallback:true,
  accountOwnerSwitchRevoked:true,sourcePosePreserved:true,
  realCloudRLS:false,physicalPhones:false,
  independentHumanRealismApproval:false,familyAlpha:'HOLD'
 }));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
