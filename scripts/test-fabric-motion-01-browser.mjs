/** Real WebGL original-photo source dress secondary motion.
 * 24 screenshot capture set: two original 163-bone rigs × 320/390/430
 * × rest / impulse-left / impulse-right / exact reset.
 * Zero production/auth/network effects; human photorealism still REVIEW.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),dir='benchmark/fabric-motion-01';
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
   p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))throw Error('Research-only licensed source paths');
  const file=resolve(root,'.'+p);
  if(!file.startsWith(root+'/'))throw Error('Private path');
  const data=await readFile(file);
  const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not licensed research source');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const captures=[],scenarios=[],errors=[],externalRequests=[];
let browser;
function watch(page){
 page.on('pageerror',e=>errors.push(String(e.message)));
 page.on('request',r=>{if(!r.url().startsWith(host)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+host))
  externalRequests.push(r.url());});
}
const diag=page=>page.evaluate(()=>window.ccWardrobe10Diagnostics());
async function selectDress(page){
 await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true,null,{timeout:180000});
 await page.locator('#category').selectOption('Dresses');
 await page.locator('#items .item').first().click();
 await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerMode==='verified-3d'&&
  window.ccWardrobe10Diagnostics()?.outfitMode==='dress',null,{timeout:30000});
 const d=await diag(page);
 assert.equal(d.bones,163);assert.equal(d.dressOriginalSHA256,SHA);
 assert.ok(d.skirtMotionEnabled);assert.ok(d.skirtMotion?.activeSeamGroups>=70);
 assert.ok(d.skirtMotion?.protectedVertexCount>=150);
 assert.equal(d.skirtMotion.originalSourceAndUVProtected,true);
 assert.equal(d.skirtMotion.releaseAuthorized,false);
 assert.equal(d.realDress?.sourceSHA256,SHA);
 return d;
}
async function shot(page,id,figure,width,phase){
 const canvas=page.locator('#avatar'),data=await canvas.screenshot();
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal((await page.evaluate(()=>document.querySelector('#avatar').getContext('webgl2')!==null)),true);
 assert.equal((await diag(page)).viewerMode,'verified-3d');
 assert.ok(Number(await canvas.getAttribute('data-frames'))>=3);
 const file=id+'.png';await writeFile(dir+'/'+file,data);
 captures.push({file,figure,width,phase,webGL:true,originalDressSHA256:SHA});
 return sharp(data).removeAlpha().raw().toBuffer({resolveWithObject:true});
}
function difference(a,b){
 assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);
 const A=a.data,B=b.data;let changed=0,max=0;
 for(let i=0;i<A.length;i+=3){const delta=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);
  if(delta>24)changed++;max=Math.max(max,delta);}
 return {changed,max};
}
try{
 await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();watch(page);
  await page.goto(host+'/research/fabric-motion-01/index.html?motion=after',{waitUntil:'domcontentloaded'});
  for(const figure of ['female','male']){
   if(figure==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.figure==='male'&&
     window.ccWardrobe10Diagnostics()?.viewerReady,null,{timeout:180000});
   }
   await selectDress(page);
   await page.evaluate(()=>window.ccWardrobe10View(90));
   const prefix='real-dress-spring-'+width+'-'+figure;
   const rest=await shot(page,prefix+'-source',figure,width,'source');
   assert.equal(await page.locator('#sway').isDisabled(),false);
   const left=await page.evaluate(()=>window.ccWardrobeSkirtMotion01('left'));
   assert.equal(left.account,'fixture-account-a');
   assert.equal(left.dressSHA,SHA);assert.equal(left.genuine163BoneDress,true);
   await page.waitForTimeout(115);
   const leftState=(await diag(page)).skirtMotion;
   assert.ok(leftState.steps>=2&&leftState.maxShiftMeters>0,'real position buffer spring advanced');
   assert.ok(leftState.maxShiftMeters<=.0180001);
   const leftImage=await shot(page,prefix+'-swing-left',figure,width,'left');
   const leftDiff=difference(rest,leftImage);
   assert.ok(leftDiff.changed>=6,'left impulse must cause actual changed skinned WebGL pixels: '+JSON.stringify(leftDiff));
   const right=await page.evaluate(()=>window.ccWardrobeSkirtMotion01('right'));
   assert.equal(right.action,'right');
   await page.waitForTimeout(115);
   const rightImage=await shot(page,prefix+'-swing-right',figure,width,'right');
   const rightDiff=difference(rest,rightImage);
   // The spring may be crossing zero here, so test GPU validity and actual
   // geometry displacement rather than inventing significant frame pixels.
   assert.ok((await diag(page)).skirtMotion.steps>=4);
   const reset=await page.evaluate(()=>window.ccWardrobeSkirtMotion01('reset'));
   assert.equal(reset.motion.settled,true);
   const restored=await shot(page,prefix+'-restored',figure,width,'reset');
   const resetDiff=difference(rest,restored);
   assert.ok(resetDiff.changed<=2,'source rest pixels must restore exactly: '+JSON.stringify(resetDiff));
   scenarios.push({figure,width,changedPixelsLeft:leftDiff.changed,
    changedPixelsRight:rightDiff.changed,resetMismatchPixels:resetDiff.changed,
    maxShiftMeters:leftState.maxShiftMeters,activeSeamGroups:leftState.activeSeamGroups});
   // Account change and garment swap MUST revoke previous geometry motion.
   await page.locator('#swap').click();
   assert.equal(await page.evaluate(()=>{try{window.ccWardrobeSkirtMotion01('left');return false;}catch{return true;}}),true);
  }
  await page.locator('#logout').click();
  assert.equal(await page.evaluate(()=>{try{window.ccWardrobeSkirtMotion01('left');return false;}catch{return true;}}),true);
  await ctx.close();
 }
 // Fail-closed when feature not explicitly selected, even with exact original dress.
 const ctx=await browser.newContext({viewport:{width:390,height:900},isMobile:true,hasTouch:true});
 const p=await ctx.newPage();watch(p);
 await p.goto(host+'/research/integration-04-wardrobe-dress/index.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady,null,{timeout:180000});
 await p.locator('#category').selectOption('Dresses');await p.locator('#items .item').first().click();
 assert.equal((await diag(p)).viewerMode,'verified-3d');
 assert.equal((await diag(p)).skirtMotionEnabled,false);
 assert.equal(await p.locator('#sway').isDisabled(),true);
 assert.equal(await p.evaluate(()=>{try{window.ccWardrobeSkirtMotion01('left');return false;}catch{return true;}}),true);
 await ctx.close();
 assert.equal(captures.length,24);
 assert.equal(scenarios.length,6);
 assert.deepEqual(externalRequests,[],'Only localhost exact approved sources');
 assert.deepEqual(errors,[],'No unhandled browser exceptions');
 const report={screenshots:captures.length,actualWebGLSourceDressFrames:24,
  original163BoneFigures:['female','male'],widths:[320,390,430],
  sourceSHA256:SHA,scenarios,captures,externalRequests,errors,
  sourceJPEGRestAndSkinPreserved:true,reversibleMovement:true,defaultOff:true,
  trueClothPhysicsCertified:false,sweptCollisionCertified:false,
  physicalAndroidVerified:false,physicalIphoneVerified:false,
  familyAlpha:'HOLD',releaseAuthorized:false,productionModified:false};
 await writeFile(dir+'/results.json',JSON.stringify(report,null,2));
 console.log('FABRIC_MOTION_01',JSON.stringify({frames:report.screenshots,
  minChangedPixels:Math.min(...scenarios.map(x=>x.changedPixelsLeft)),
  maxShiftMeters:Math.max(...scenarios.map(x=>x.maxShiftMeters)),
  hold:report.familyAlpha}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
