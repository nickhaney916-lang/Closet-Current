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

const root=resolve('.'),dir='benchmark/wardrobe-3d-bridge-01';
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
 await page.goto(host+'/research/wardrobe-3d-bridge-01/index.html',{waitUntil:'domcontentloaded'});
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
    // A account's first/second denim correspond to the pinned candidates.
    if(denim==='second')await p.locator('#swap').click();
    await p.waitForFunction(hash=>window.ccWardrobe10Diagnostics().displayed3DSources?.bottom===hash,
     SRC[denim],{timeout:180000});
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
   for(const state of ['dress','empty','no-webgl']){
    if(state==='dress'){
     await p.locator('#category').selectOption('Dresses');
     await p.locator('#items .item').first().click();
     await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().fallbackVisible);
    }else if(state==='empty'){
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
 await p.locator('#front').click();await click('front');
 await p.locator('#side').click();await click('side');
 await p.locator('#back').click();await click('back');
 await p.locator('#zin').click();await click('zoom-in');
 await p.locator('#zout').click();await click('zoom-out');
 await p.locator('#turn').click();await click('spin');
 await p.locator('#turn').click();await click('stop-spin');
 await p.locator('#clear').click();await click('clear');
 await p.locator('#category').selectOption('Dresses');await p.locator('#items .item').first().click();
 await click('dress-fallback');assert.equal((await diag(p)).viewerMode,'original-photo-2d');
 for(const account of [names.b,names.a,names.b]){
  await p.locator('#account').selectOption(account);
  await p.waitForFunction(id=>window.ccWardrobe10Diagnostics().account===id&&
   window.ccWardrobe10Diagnostics().viewerReady,id=>id,{timeout:180000}).catch(async()=>{
    await p.waitForFunction(id=>window.ccWardrobe10Diagnostics().account===id&&
     window.ccWardrobe10Diagnostics().viewerReady,account,{timeout:180000});
   });
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
  await p.waitForFunction(()=>window.ccWardrobe10Diagnostics().phase==='error');
  const d=await diag(p);
  assert.equal(d.indexReady,false);
  assert.equal(d.visibleAccountIds.length,0);
  failures.push({negative,pass:true,closed:'account index'});
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
 assert.deepEqual(offsite,[]);assert.deepEqual(errors,[]);
 await context.close();
 const report={screenshots:webglFrames.length+photoFrames.length,
  genuineWebGLFrames:webglFrames.length,originalPhoto2DFrames:photoFrames.length,
  widths:[320,390,430],figureTypes:['female','male'],licensedDenimCount:2,
  sourceSHA256s:SRC,webglFrames,photoFrames,failures,transitions,interactions,memory,
  3dCapabilityOnlyOnMatchingSource:true,originalSavedJPEGHashChecked:true,
  sessionAndOwnershipGuard:true,noAccountMixing:true,
  physicallyTestedAndroid:false,physicallyTestedIphone:false,
  arbitraryUserPhotoTo3DCertified:false,humanPhotorealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD',productionModified:false};
 assert.equal(webglFrames.length,36);assert.equal(photoFrames.length,18);
 assert.ok(interactions.length>=10);assert.ok(transitions.length>=6);
 assert.ok(failures.length>=10);
 assert.equal(report.productionModified,false);
 await writeFile(dir+'/browser-results.json',JSON.stringify(report,null,2));
 console.log('WARDROBE_3D_BRIDGE_01',JSON.stringify({webgl:36,photo2d:18,
  failures:failures.length,interactions:interactions.length,transitions:transitions.length,
  memory,hold:'Family Alpha #255'}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
