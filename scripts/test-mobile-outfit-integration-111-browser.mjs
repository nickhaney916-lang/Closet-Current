/**
 * Priority 111 combined mobile acceptance: reviewed owner-bound saved outfit,
 * real source-photo WebGL, lifecycle revocation, fresh review and pose controls.
 * Synthetic research identity only; the licensed donor is not a user wardrobe.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {extname,resolve} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {chromium} from 'playwright';

const root=resolve('.'),out='benchmark/three-d-111';
const SOURCE={top:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'};
const widths=[320,390,430],views=[0,90,180];
const hash=b=>createHash('sha256').update(b).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
   path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))throw Error('blocked path');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('path escape');
  const bytes=await readFile(file),mime={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.json':'application/json',
   '.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const errors=[],external=[],crashes=[],screenshots=[];
const capture=async(page,width,angle,phase)=>{
 await page.evaluate(a=>window.cc69SetView(a),angle);
 await page.waitForFunction(a=>Math.abs(((Number(window.cc69Diagnostics()?.camera)-a+540)%360)-180)<.02,
  angle,{timeout:10000,polling:50});
 const diag=await page.evaluate(()=>window.cc69Diagnostics());
 assert.equal(diag.rig.bones,163);assert.equal(diag.actual3DGarment.realPhotoApplied,true);
 assert.equal(diag.actual3DGarment.originalPhotoSHA256s.top,SOURCE.top);
 assert.equal(diag.actual3DGarment.originalPhotoSHA256s.bottom,SOURCE.public);
 const rendering=await page.locator('#avatar').evaluate(el=>{
  const canvas=el.matches('canvas')?el:el.querySelector('canvas');
  const gl=canvas&&(canvas.getContext('webgl2')||canvas.getContext('webgl'));
  return {canvas:!!canvas,webgl:!!gl,renderer:gl?gl.getParameter(gl.RENDERER):null};
 });
 assert.equal(rendering.canvas,true);assert.equal(rendering.webgl,true);
 const png=await page.locator('#avatar').screenshot({animations:'disabled'});
 const meta=await sharp(png).metadata();
 assert.equal(meta.format,'png');assert.ok(meta.width>=180&&meta.height>=280&&png.length>3000);
 const file=`${phase}-w${width}-angle${angle}.png`;await writeFile(`${out}/${file}`,png);
 screenshots.push({file,widthCSS:width,cameraDegrees:angle,phase,sha256:hash(png),
  width:meta.width,height:meta.height,sourceSHA256s:diag.actual3DGarment.originalPhotoSHA256s,
  anatomicalRigBones:diag.rig.bones,webgl:true,renderer:rendering.renderer});
};
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl']});
 const context=await browser.newContext({viewport:{width:320,height:900},deviceScaleFactor:1,
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e.message)));
 page.on('crash',()=>crashes.push(true));
 page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'+origin)&&!r.url().startsWith('data:'))external.push(new URL(r.url()).protocol);});
 const url=()=>origin+'/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on&knee106=on&knee108=on&knee109=on&look110=on';
 await page.goto(url());
 await page.waitForFunction(()=>window.cc110LookState?.()?.mounted===true&&
  window.cc109PoseUIState?.()?.mounted===true&&window.cc69Diagnostics?.()?.loaded===true&&
  window.cc69Diagnostics().rig.bones===163,null,{timeout:180000});
 assert.equal(await page.locator('#cc110Save').isDisabled(),true);
 assert.equal(await page.locator('#cc110Reopen').isDisabled(),true);
 assert.equal(await page.locator('#cc109Both8').isDisabled(),true);
 const tap=await page.locator('#cc110Save').boundingBox();assert.ok(tap&&tap.height>=44);
 await page.locator('#review').check();await page.locator('#wear').click();
 await page.waitForFunction(()=>window.cc110LookState?.()?.readyToSave===true&&window.cc109PoseUIState?.()?.enabled===true,null,{timeout:180000});
 const initial=await page.evaluate(()=>window.cc69Diagnostics());
 assert.equal(initial.actual3DGarment.originalPhotoSHA256s.top,SOURCE.top);
 assert.equal(initial.actual3DGarment.originalPhotoSHA256s.bottom,SOURCE.public);
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,
  'private photo bytes or saved-look tokens must not persist in web storage');
 await page.locator('#cc110Save').click();
 await page.waitForFunction(()=>window.cc110LookState?.()?.hasSavedLook===true&&
  window.cc110LookState().savedSourceSHA256s?.bottom===
   'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c');
 await page.locator('#swap').click();
 await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',null,{timeout:180000});
 await page.locator('#cc110Reopen').click();
 await page.waitForFunction(()=>window.cc110LookState?.()?.lastOutcome==='actual-original-3d-restored'&&
  window.cc69Diagnostics?.()?.actual3DGarment?.originalPhotoSHA256s?.bottom===
   'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c'&&window.cc109PoseUIState?.()?.enabled===true,
  null,{timeout:180000});
 for(const width of widths){
  await page.setViewportSize({width,height:900});
  const rect=await page.locator('#avatar').boundingBox();
  assert.ok(rect&&rect.x>=0&&rect.x+rect.width<=width+1,`canvas overflow at ${width}px`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
  for(const angle of views)await capture(page,width,angle,'saved-look-reopened');
 }
 await page.locator('#cc109Left8').click();
 let pose=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
 assert.deepEqual([pose.left,pose.right],[8,0]);assert.ok(pose.leftKneeCalfVertices>=8);assert.equal(pose.rightKneeCalfVertices,0);
 await page.locator('#cc109Right8').click();pose=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
 assert.deepEqual([pose.left,pose.right],[0,8]);assert.equal(pose.leftKneeCalfVertices,0);assert.ok(pose.rightKneeCalfVertices>=8);
 await page.locator('#cc109Both16').click();pose=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
 assert.deepEqual([pose.left,pose.right],[16,16]);assert.ok(pose.leftKneeCalfVertices>=8&&pose.rightKneeCalfVertices>=8);
 assert.equal(pose.contactNonworsening,true);
 await page.locator('#cc109Reset').click();pose=(await page.evaluate(()=>window.cc109PoseUIState())).lastPose;
 assert.deepEqual([pose.left,pose.right],[0,0]);
 // The pinned headless mobile runner does not expose a real phone tab
 // scheduler, so dispatch the browser lifecycle event into the live WebGL
 // document. The separate P110 suite exercises a real second-tab switch.
 await page.evaluate(()=>document.dispatchEvent(new Event('freeze')));
 await page.waitForFunction(()=>window.cc109PoseUIState?.()?.lifecycleRevoked===true,null,{timeout:20000});
 await page.waitForFunction(()=>window.cc110LookState?.()?.hasSavedLook===false&&
  window.cc110LookState().lastOutcome==='mobile-lifecycle-source-revoked',null,{timeout:10000});
 assert.equal(await page.locator('#cc110Reopen').isDisabled(),true);
 assert.equal(await page.locator('#cc109Both8').isDisabled(),true);
 assert.equal(await page.evaluate(()=>window.cc109PoseUIState().sourceRenderConcealed),true);
 assert.equal(await page.evaluate(()=>window.cc110LookState().savedSourceSHA256s),null);
 assert.equal(await page.evaluate(()=>window.cc110LookState().realAuthenticatedAccount),false);
 // A same-document consent toggle and synthetic reopen cannot restore the stale look.
 await page.locator('#review').uncheck();await page.locator('#review').check();await page.locator('#wear').click();
 await page.evaluate(()=>document.getElementById('cc110Reopen').click());
 assert.equal(await page.locator('#cc110Reopen').isDisabled(),true);
 assert.equal(await page.evaluate(()=>window.cc109PoseUIState().lifecycleRevoked),true);
 assert.equal(await page.evaluate(()=>window.cc109PoseUIState().sourceRenderConcealed),true,
  'stale source remains concealed after same-document review and reopen attempts');
 await page.reload();
 await page.waitForFunction(()=>window.cc110LookState?.()?.mounted===true&&
  window.cc109PoseUIState?.()?.mounted===true&&window.cc69Diagnostics?.()?.loaded===true&&
  window.cc69Diagnostics().rig.bones===163,null,{timeout:180000});
 assert.equal(await page.locator('#cc109Both8').isDisabled(),true);
 assert.equal(await page.locator('#cc110Reopen').isDisabled(),true);
 assert.equal(await page.evaluate(()=>window.cc110LookState().hasSavedLook),false);
 // Only a new original photo review/wear grants a fresh source-bound session.
 await page.locator('#review').check();await page.locator('#wear').click();
 await page.waitForFunction(()=>window.cc109PoseUIState?.()?.enabled===true&&
  window.cc110LookState?.()?.readyToSave===true,null,{timeout:180000});
 await page.locator('#cc110Save').click();
 await page.waitForFunction(()=>window.cc110LookState?.()?.hasSavedLook===true,null,{timeout:10000});
 assert.equal(await page.evaluate(()=>window.cc110LookState().savedSourceSHA256s.bottom),SOURCE.public);
 await page.locator('#swap').click();await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',null,{timeout:180000});
 await page.locator('#cc110Reopen').click();
 await page.waitForFunction(()=>window.cc110LookState?.()?.lastOutcome==='actual-original-3d-restored'&&
  window.cc109PoseUIState?.()?.enabled===true,null,{timeout:180000});
 assert.equal(await page.evaluate(()=>window.cc69Diagnostics().actual3DGarment.originalPhotoSHA256s.bottom),SOURCE.public);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(crashes,[]);
 const report={priority:'INDEPENDENT-MOBILE-3D-OUTFIT-INTEGRATION-111',
  baselineCommit:'c5930d200b8bbd1632b188fb5216bc233cffae8d',
  donorCommit:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  owner:'synthetic licensed research identity only',signedRealAccount:false,cloudRLSVerified:false,
  originalPhotographs:{shirt:SOURCE.top,publicJeans:SOURCE.public,secondJeans:SOURCE.second},
  actualSavedLookReopen:true,originalPhotoIdentityVerified:true,anatomicalRigBones:163,
  responsiveCSSWidths:widths,viewsDegrees:views,screenshots,
  leftRightIndependentKneePose:true,bilateralKneePose:true,sourcePoseReset:true,
  lifecycleFreezeEventOnRealWebGL:true,sourceConcealedOnRevocation:true,
  sameDocumentReopenRejected:true,sameDocumentReviewToggleRejected:true,
  reloadRequiresFreshReview:true,freshReviewAllowsNewSaveAndReopen:true,
  persistentPhotoBytes:false,externalRequests:external,browserErrors:errors,crashes,
  softwareWebGL:true,physicalAndroidChrome:'NOT VERIFIED',physicalIphoneSafari:'NOT VERIFIED',
  arbitraryPrivatePhoto3DFit:'NOT VERIFIED',familyAlpha:'HOLD',releaseAuthorized:false};
 await writeFile(`${out}/acceptance.json`,JSON.stringify(report,null,2)+'\n');
 console.log('MOBILE_OUTFIT_INTEGRATION_111',JSON.stringify({widths,views,
  screenshots:screenshots.length,lifecycleRevoke:true,freshReview:true,
  rigBones:163,realAccountRLS:false,physicalPhones:false,familyAlpha:'HOLD'}));
 await context.close();
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
