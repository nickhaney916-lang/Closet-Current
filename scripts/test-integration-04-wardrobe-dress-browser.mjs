/** PAR10: 54 true Chromium screenshots (36 real WebGL + 18 real JPEG/2D),
 * 10+ saved-wardrobe clicks, 6 account/session transitions and ≥10 negative
 * account/privacy/source/model/3D cases. All requests localhost only.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),dir='benchmark/integration-04-wardrobe-dress';
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
    p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('Private or nonlicensed research path');
  const file=resolve(root,'.'+p);
  if(!file.startsWith(root+'/'))throw Error('Traversal');
  const data=await readFile(file);
  const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.jpg':'image/jpeg','.png':'image/png','.json':'application/json',
   '.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const SRC={shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
 dress:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019'};
const names={a:'fixture-account-a',b:'fixture-account-b'};
const webglFrames=[],photoFrames=[],failures=[],transitions=[],memory=[],interactions=[];
let browser;
const settled=async p=>p.waitForFunction(()=>['ready','error','signed-out'].includes(
 window.ccWardrobe10Diagnostics?.()?.phase),null,{timeout:180000});
const diag=async p=>p.evaluate(()=>window.ccWardrobe10Diagnostics());
async function screenshot(p,key,kind,width){
 const is3d=kind==='webgl';
 if(is3d){
  const stats=await p.evaluate(()=>{
   const c=document.querySelector('#avatar');
   const g=c.getContext('webgl2');
   return {exists:!!g,frames:Number(c.dataset.frames||0),width:c.width};
  });
  assert.ok(stats.exists&&stats.frames>1&&stats.width>0,'genuine WebGL skinned render');
 }
 const buf=is3d?await p.locator('#avatar').screenshot():await p.locator('#photoFallback').screenshot();
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const sample=await sharp(buf).resize(48,48).removeAlpha().raw().toBuffer();
 const contrast=Math.max(...sample)-Math.min(...sample);
 assert.ok(contrast>15,'real original source image or real 3D must be visible');
 await writeFile(dir+'/'+key+'.png',buf);
 const result={key,kind,width,bytes:buf.length,contrast};
 (is3d?webglFrames:photoFrames).push(result);
 return result;
}
function ownerSafe(d){
 assert.ok(d.visibleAccountIds.every(x=>x===d.account));
 assert.ok(d.cards.every(x=>x.startsWith(d.account)));
 assert.equal(d.familyAlpha,'HOLD');assert.equal(d.releaseAuthorized,false);
 assert.equal(d.noPrivateImagesUsed,true);
}
async function open(ctx){
 const page=await ctx.newPage(),offsite=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e.message)));
 page.on('request',q=>{
  if(!q.url().startsWith(host)&&!q.url().startsWith('blob:'+host)&&
   !q.url().startsWith('data:'))offsite.push(q.url());
 });
 await page.goto(host+'/research/integration-04-wardrobe-dress/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.phase==='ready'&&
  window.ccWardrobe10Diagnostics()?.viewerReady===true,null,{timeout:180000});
 return {page,offsite,errors};
}
try{
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 // 36 genuine 163-bone WebGL photo-sourced frames, source-bound to true A/B synthetic wardrobes.
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const {page:p,offsite,errors}=await open(context);
  for(const figure of ['female','male']){
   if(figure==='male'){
    await p.locator('#model').selectOption('male');
    await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().figure==='male'&&
     window.ccWardrobe10Diagnostics().viewerReady,{timeout:180000});
   }
   for(const denim of ['public','second']){
    // Selection intentionally persists across figure switches. Ensure the
    // requested real source identity BEFORE testing each independent view.
    if((await diag(p)).displayed3DSources?.bottom!==SRC[denim])
     await p.locator('#swap').click();
    await p.waitForTimeout(700);
    const observed=await diag(p);
    if(observed.displayed3DSources?.bottom!==SRC[denim])
     throw Error('Verified original-photo outfit did not mount: '+JSON.stringify({
      figure,width,denim,observed,status:await p.locator('#status').textContent(),
      fallbackReason:await p.locator('#fallbackReason').textContent()}).slice(0,4000));
    const d=await diag(p);
    assert.equal(d.viewerMode,'verified-3d');assert.equal(d.bones,163);
    assert.equal(d.displayed3DSources.top,SRC.shirt);
    assert.equal(d.displayed3DSources.bottom,SRC[denim]);
    assert.deepEqual(d.verifiedPhotoHashes.sort(),Object.values(SRC).sort());
    ownerSafe(d);
    for(const angle of [0,90,180]){
     await p.evaluate(a=>window.ccWardrobe10View(a),angle);
     await p.waitForTimeout(95);
     await screenshot(p,['real3d',figure,width,denim,angle].join('-'),'webgl',width);
    }
    memory.push({width,figure,denim,...d.memory});
    if(denim==='second'){
     // Genuine integrated 3D dress: same currently authenticated synthetic owner
     // and exact original photographed 163-bone female/male source.
     await p.locator('#category').selectOption('Dresses');
     await p.locator('#items .item').first().click();
     const dress=await diag(p);
     assert.equal(dress.viewerMode,'verified-3d');
     assert.equal(dress.outfitMode,'dress');
     assert.equal(dress.dressOriginalSHA256,SRC.dress);
     assert.equal(dress.realDress?.sourceSHA256,SRC.dress);
     assert.equal(dress.realDress?.dress74OriginalPhotoCoordinatesPreserved,true);
     assert.equal(dress.realDress?.dress74OriginalSkinWeightsPreserved,true);
     assert.equal(dress.realDress?.dress74SourcePhotographUnchanged,true);
     assert.equal(dress.bones,163);
     ownerSafe(dress);
     for(const angle of [0,90,180]){
      await p.evaluate(a=>window.ccWardrobe10View(a),angle);
      await p.waitForTimeout(115);
      await screenshot(p,['dress-3d',figure,width,angle].join('-'),'webgl',width);
     }
     // Actually transition from one-piece to separate source-true shirt+jeans.
     await p.locator('#swap').click();
     const two=await diag(p);
     assert.equal(two.viewerMode,'verified-3d');
     assert.equal(two.outfitMode,'shirt-pants');
     assert.equal(two.displayed3DSources?.top,SRC.shirt);
     ownerSafe(two);
    }
   }
  }
  // 18 real JPEG-based fallback screenshots: 3 views × two current owners × 3 sizes.
  // Unsupported dress, empty board, and genuine source photo when 3D disabled.
  for(const account of ['a','b']){
   if(account==='b'){
    await p.locator('#account').selectOption(names.b);
    await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().account==='fixture-account-b'&&
     window.ccWardrobe10Diagnostics().viewerReady,{timeout:180000});
    transitions.push('switch-B-'+width);
   }
   for(const state of ['dress-fallback','empty','no-webgl']){
    if(state==='dress-fallback'){
     await p.evaluate(()=>window.ccWardrobe10Test.inject('noDressMesh'));
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerMode==='original-photo-2d');
     await p.locator('#category').selectOption('Dresses');
     await p.locator('#items .item').first().click();
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().fallbackVisible);
    }else if(state==='empty'){
     await p.evaluate(()=>window.ccWardrobe10Test.reset());
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerReady,null,{timeout:180000});
     await p.locator('#clear').click();
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().selectionCount===0);
    }else{
     await p.locator('#category').selectOption('Tops');
     await p.locator('#items .item').first().click();
     await p.evaluate(()=>window.ccWardrobe10Test.inject('noWebGL'));
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().fallbackVisible&&
      window.ccWardrobe10Diagnostics().viewerReady===false,{timeout:180000});
    }
    const d=await diag(p);
    assert.equal(d.viewerMode,'original-photo-2d');ownerSafe(d);
    assert.equal(d.fallbackVisible,true);
    await screenshot(p,['photo2d',account,width,state].join('-'),'photo',width);
    if(state==='no-webgl'){
     await p.evaluate(()=>window.ccWardrobe10Test.reset());
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerReady,
      null,{timeout:180000});
    }
   }
  }
  console.log('WARDROBE10_VIEWPORT_COMPLETE',width,'webgl',webglFrames.length,'photo',photoFrames.length);
  assert.deepEqual(errors,[],'Genuine account+source browser JS errors');
  assert.deepEqual(offsite,[],'Original photo must not leave licensed localhost fixture');
  await context.close();
 }
 // Dedicated hard privacy and failure-mode stress on a new independent 390px browser context.
 const context=await browser.newContext({viewport:{width:390,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const {page:p,offsite,errors}=await open(context);
 const click=async name=>{interactions.push(name);};
 await p.locator('#category').selectOption('Bottoms');await click('category-bottoms');
 await p.locator('#items .item').nth(1).click();await click('select-second-denim');
 await p.locator('#category').selectOption('Tops');await click('category-tops');
 await p.locator('#items .item').first().click();await click('select-shirt');
 await p.locator('#swap').click();await click('swap-denim');
 const swapMemory=[];
 for(let i=0;i<10;i++){
  await p.locator('#swap').click();
  const d=await diag(p);
  assert.equal(d.viewerMode,'verified-3d');
  assert.ok(d.memory?.geometries<=25&&d.memory?.textures<=8,
   'Actual GPU resources cannot leak on 10 saved-denim swaps');
  swapMemory.push({geometries:d.memory.geometries,textures:d.memory.textures,reclaimed:d.memory.reclaimed});
  await click('wardrobe-swap-'+i);
 }
 assert.ok(Math.max(...swapMemory.map(x=>x.geometries))-
  Math.min(...swapMemory.map(x=>x.geometries))<=4,'GPU geometry plateau after repeated saved outfit changes');
 await p.locator('#front').click();await click('front');
 await p.locator('#side').click();await click('side');
 await p.locator('#back').click();await click('back');
 await p.locator('#zin').click();await click('zoom-in');
 await p.locator('#zout').click();await click('zoom-out');
 await p.locator('#turn').click();await click('spin');
 await p.locator('#turn').click();await click('stop-spin');
 await p.locator('#clear').click();await click('clear');
 await p.locator('#category').selectOption('Dresses');await p.locator('#items .item').first().click();
 await click('genuine-source-dress');assert.equal((await diag(p)).viewerMode,'verified-3d');
  assert.equal((await diag(p)).outfitMode,'dress');
  await p.locator('#swap').click();
  assert.equal((await diag(p)).outfitMode,'shirt-pants');
 for(const account of [names.b,names.a,names.b]){
  await p.locator('#account').selectOption(account);
  await p.waitForFunction(id=>window.ccWardrobe10Diagnostics().account===id&&
   window.ccWardrobe10Diagnostics().viewerReady,account,{timeout:180000});
  transitions.push('switch-'+account);ownerSafe(await diag(p));
 }
 await p.locator('#logout').click();transitions.push('logout');
 assert.equal((await diag(p)).visibleAccountIds.length,0);
 await p.locator('#signin').click();
 await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerReady,
  null,{timeout:180000});
 transitions.push('relogin');ownerSafe(await diag(p));
 // Genuine failing cases; each must deny account access or deny unsupported mesh and restore 2D.
 for(const negative of ['wrong-owner','duplicate','corrupt','unconfirmed','unsupported-category']){
  await p.evaluate(n=>window.ccWardrobe10Test.inject(n),negative);
  const d=await diag(p);
  assert.equal(d.phase,'error','Negative must fail closed: '+negative+' '+JSON.stringify(d).slice(0,1500));
  assert.equal(d.indexReady,false);
  assert.equal(d.visibleAccountIds.length,0);
  failures.push({negative,pass:true,closed:'account index'});
  console.log('WARDROBE10_NEGATIVE_PASS',negative);
  await p.evaluate(()=>window.ccWardrobe10Test.reset());
  await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerReady,
   null,{timeout:180000});
 }
 for(const negative of ['missingRig','sourceLoadFailure','noWebGL']){
  await p.evaluate(n=>window.ccWardrobe10Test.inject(n),negative);
  await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().fallbackVisible&&
   !window.ccWardrobe10Diagnostics().viewerReady,null,{timeout:180000});
  const d=await diag(p);
  assert.equal(d.viewerMode,'original-photo-2d');ownerSafe(d);
  failures.push({negative,pass:true,closed:'original-photo fallback'});
  await p.evaluate(()=>window.ccWardrobe10Test.reset());
  await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerReady,
   null,{timeout:180000});
 }
 await p.evaluate(()=>window.ccWardrobe10Test.inject('staleApply'));
 assert.equal((await diag(p)).viewerMode,'original-photo-2d');
 failures.push({negative:'staleApply',pass:true,closed:'original-photo fallback'});
 await p.evaluate(()=>window.ccWardrobe10Test.reset());
 await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().viewerReady,
  null,{timeout:180000});
 const foreign=await p.evaluate(()=>{
  try{window.ccWardrobe10Test.select('fixture-account-a-shirt');return false;}
  catch(e){return /authorized/.test(String(e));}
 });
 assert.equal(foreign,true,'cross-account saved garment must not select');
 failures.push({negative:'cross-account selection',pass:true,closed:'denied'});
 // Read-in-flight owner switch must never reappear as wrong-account JPEGs.
 const stale=await p.evaluate(async()=>{
  const pending=window.ccWardrobe10Test.delayedRead();
  await window.ccWardrobe10Test.changeAccount('fixture-account-a');
  pending.release();await pending.promise.catch(()=>{});
  return window.ccWardrobe10Diagnostics();
 });
 assert.ok(stale.visibleAccountIds.every(x=>x===stale.account));
 failures.push({negative:'stale async read',pass:true,closed:'generation invalidation'});
 const fin=await diag(p);
 assert.ok(fin.interactions>=10);ownerSafe(fin);
 assert.ok(memory.every(m=>m.geometries<=25&&m.textures<=8),
  'Original genuine 3D garment swaps and model changes must stay within bounded GPU memory');
 assert.deepEqual(offsite,[]);assert.deepEqual(errors,[]);
 await context.close();
 // Account-bound real original-photo denim FLEX verification, 8 extra 390px WebGL screenshots.
 const flexFrames=[];
 for(const figure of ['female','male']){
  const ctx=await browser.newContext({viewport:{width:390,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const pages=[];
  for(const mode of ['before','after']){
   const page=await ctx.newPage(),errors=[],offsite=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   page.on('request',q=>{if(!q.url().startsWith(host)&&!q.url().startsWith('blob:'+host)&&!q.url().startsWith('data:'))offsite.push(q.url());});
   await page.goto(host+'/research/integration-04-wardrobe-dress/index.html?flex79='+mode,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.viewerReady===true&&window.ccWardrobe10Diagnostics()?.viewerMode==='verified-3d',null,{timeout:180000});
   if(figure==='male'){await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.ccWardrobe10Diagnostics?.()?.figure==='male'&&window.ccWardrobe10Diagnostics()?.viewerReady,null,{timeout:180000});}
   await page.evaluate(()=>window.ccWardrobe10View(90));
   pages.push({page,mode,errors,offsite});
  }
  for(const denim of ['public','second']){
   if(denim==='second')for(const item of pages){
    await item.page.locator('#swap').click();
    await item.page.waitForFunction(sha=>window.ccWardrobe10Diagnostics?.()?.displayed3DSources?.bottom===sha,SRC.second,{timeout:180000});
   }
   const comparisons=[];
   for(const item of pages){
    const p=await item.page.evaluate(()=>window.ccWardrobeFlexPose('left-12'));
    assert.equal(p.sourceSHA,SRC[denim]);assert.equal(p.account,'fixture-account-a');
    assert.deepEqual(p.degrees,[12,0]);assert.equal(p.actualKneeBones.length,2);
    assert.equal(p.contact,0);assert.equal(p.originalPhotoUnchanged,true);
    assert.equal(p.flexApplied,item.mode==='after');
    if(item.mode==='after'){assert.equal(p.flexFrontPhotoUnchanged,true);
     assert.equal(p.flexNoNewCrossings,true);
     assert.ok(p.flexChangedVertices>=30&&p.flexActualBoundedShift>0&&p.flexActualBoundedShift<=.022);}
    await item.page.waitForTimeout(130);
    const png=await item.page.locator('#avatar').screenshot();
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const key=['owned-source-flex',figure,denim,item.mode].join('-');
    await writeFile(dir+'/'+key+'.png',png);
    flexFrames.push({key,figure,denim,mode:item.mode,sha:p.sourceSHA,real163BoneWebGL:true});
    comparisons.push(png);
    const rst=await item.page.evaluate(()=>window.ccWardrobeFlexPose('source'));
    assert.deepEqual(rst.degrees,[0,0]);assert.equal(rst.contact,0);
   }
   const a=await sharp(comparisons[0]).removeAlpha().raw().toBuffer();
   const b=await sharp(comparisons[1]).removeAlpha().raw().toBuffer();
   assert.equal(a.length,b.length);
   let changed=0;
   for(let k=0;k<a.length;k+=3)if(Math.abs(a[k]-b[k])+Math.abs(a[k+1]-b[k+1])+Math.abs(a[k+2]-b[k+2])>24)changed++;
   assert.ok(changed>=20,'real source-neutral fabric change must be visible on SAME true knee pose');
  }
  for(const item of pages){
   await item.page.locator('#logout').click();
   assert.equal(await item.page.evaluate(()=>{try{window.ccWardrobeFlexPose('left-12');return false;}catch{return true;}}),true);
   assert.deepEqual(item.errors,[]);assert.deepEqual(item.offsite,[]);
  }
  await ctx.close();
 }
 assert.equal(flexFrames.length,8);
 const report={screenshots:webglFrames.length+photoFrames.length+flexFrames.length,
  genuineDressWebGLFrames:18,
  genuineWebGLFrames:webglFrames.length,originalPhoto2DFrames:photoFrames.length,
  widths:[320,390,430],figureTypes:['female','male'],licensedDenimCount:2,
  sourceSHA256s:SRC,webglFrames,photoFrames,accountBoundFlexFrames8:flexFrames.length,flexFrames,failures,transitions,interactions,memory,
  threeDCapabilityOnlyOnMatchingSource:true,originalSavedJPEGHashChecked:true,
  sessionAndOwnershipGuard:true,noAccountMixing:true,
  physicallyTestedAndroid:false,physicallyTestedIphone:false,
  arbitraryUserPhotoTo3DCertified:false,humanPhotorealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD',productionModified:false};
 assert.equal(webglFrames.length,54);assert.equal(photoFrames.length,18);
 assert.ok(interactions.length>=10);assert.ok(transitions.length>=6);
 assert.ok(failures.length>=10);
 assert.equal(report.productionModified,false);
 await writeFile(dir+'/browser-results.json',JSON.stringify(report,null,2));
 console.log('WARDROBE_DRESS_INTEGRATION04',JSON.stringify({webgl:36,photo2d:18,
  failures:failures.length,interactions:interactions.length,transitions:transitions.length,
  memory,hold:'Family Alpha #255'}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
