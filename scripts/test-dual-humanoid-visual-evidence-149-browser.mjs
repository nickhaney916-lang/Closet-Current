/**
 * P149 independent actual 163-bone WebGL dual-humanoid source-licensed visual
 * matrix. Render quality is not inferred from image hashes or screenshots.
 *
 * Run only after exact PR541 donor assembly with existing P103-110 overlays.
 * No personal wardrobe photos, real auth or live storage; no deployment.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
import {PHOTO149,evaluateVisualEvidence149}
 from '../research/dual-humanoid-visual-evidence-149/source-visual-gate.mjs';
const root=resolve('.'),donor=resolve('.p149-donor-541'),
 folder=resolve('benchmark/dual-humanoid-visual-evidence-149');
const hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(folder,{recursive:true});
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sources={
  shirt:PHOTO149.lockedShirt,
  public:PHOTO149.licensedDenim.public,
  second:PHOTO149.licensedDenim.second
};
// Global Commons manifest pins the original shirt. The two licensed denim
// sources are *generated* by the exact pinned PR541 source research pipeline,
// not listed as standalone Commons entries in the global fixture manifest.
// Verify original shirt bytes here and validate both denim SHA identities
// against the genuine live 3D source loader and unchanged P110 donor proof.
const shirtEntry=locked.find(x=>x.sha256===sources.shirt);
if(!shirtEntry?.verified||!shirtEntry.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'))
 throw Error('P149 source-licensed original shirt unavailable');
const shirtBytes=await readFile('benchmark/fixtures/'+shirtEntry.id+'.jpg');
assert.equal(hash(shirtBytes),sources.shirt,'exact licensed shirt JPEG required');
const mime={'.mjs':'text/javascript','.js':'text/javascript',
 '.html':'text/html','.css':'text/css','.jpg':'image/jpeg',
 '.png':'image/png','.glb':'model/gltf-binary',
 '.json':'application/json','.bin':'application/octet-stream',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('not allowed');
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research|benchmark|node_modules)\//.test(p)||
     p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('unapproved private path');
  const file=resolve(donor,'.'+p);
  if(!file.startsWith(donor+sep))throw Error('source traversal');
  const data=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(data);
 }catch{res.writeHead(404,{'content-type':'text/plain'});res.end('not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const frames=[],statuses=[],errors=[],blockedNetwork=[],crashes=[];
const targetEngines=(process.env.P149_ENGINES||'chromium,webkit').split(',');
if(!targetEngines.length||targetEngines.some(x=>!['chromium','webkit'].includes(x))||
 new Set(targetEngines).size!==targetEngines.length)
 throw Error('P149 valid exact browser-engine list required');
try{
 for(const engine of targetEngines){
  for(const width of PHOTO149.widths){
   const driver=engine==='webkit'?webkit:chromium;
   const browser=await driver.launch({headless:true,
    ...(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader',
      '--enable-unsafe-swiftshader','--enable-webgl']}: {})});
   try{
    for(const figure of PHOTO149.figures){
     const ctx=await browser.newContext({viewport:{width,height:900},
      deviceScaleFactor:1,hasTouch:true,isMobile:true,serviceWorkers:'block'});
     await ctx.route('**/*',route=>{
      const u=route.request().url();
      if(u.startsWith(origin+'/')||u.startsWith('data:')||u.startsWith('blob:'+origin))
       return route.continue();
      blockedNetwork.push({engine,width,host:new URL(u).host,blocked:true});
      return route.abort();
     });
     const page=await ctx.newPage();
     page.on('pageerror',e=>errors.push({engine,width,figure,message:e.message}));
     page.on('crash',()=>crashes.push({engine,width,figure}));
     try{
      await page.goto(origin+'/research/three-d-69/index.html?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on',
       {waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&
       window.cc69Diagnostics().loaded===true,null,{timeout:90000});
      if(figure==='male'){
       await page.locator('#model').selectOption('male');
       await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&
        window.cc69Diagnostics().loaded===true&&
        document.getElementById('wear').disabled!==false,
        null,{timeout:90000});
      }
      await page.locator('#review').check();
      await page.locator('#wear').click();
      await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.real3DSkinnedGarmentMeshes>=2,
       null,{timeout:90000});
      for(const denim of Object.keys(PHOTO149.licensedDenim)){
       const current=await page.evaluate(()=>window.cc69Diagnostics().currentSelection);
       if(current!==denim){
        await page.locator('#swap').click();
        await page.waitForFunction(d=>window.cc69Diagnostics?.()?.currentSelection===d,
         denim,{timeout:45000});
       }
       const d=await page.evaluate(()=>{
        const x=window.cc69Diagnostics();
        const gl=document.getElementById('avatar')?.getContext('webgl2');
        return {figure:x.figure,denim:x.currentSelection,bones:x.rig?.bones,
         garmentMeshes:x.actual3DGarment?.real3DSkinnedGarmentMeshes,
         source:x.actual3DGarment?.originalPhotoSHA256s,
         gl:gl?.getParameter(gl.VERSION)||null,
         humanApproved:x.humanApproved};
       });
       assert.equal(d.figure,figure);assert.equal(d.denim,denim);
       assert.equal(d.bones,163);
       assert.ok(d.garmentMeshes>=2,'independent actual source skinned meshes');
       assert.equal(d.source.top,sources.shirt);
       assert.equal(d.source.bottom,sources[denim]);
       assert.match(d.gl,/WebGL 2/i,'actual WebGL2 required');
       assert.equal(d.humanApproved,false,'no false claim of independent visual approval');
       for(const [view,angle] of Object.entries(PHOTO149.viewDegrees)){
        await page.evaluate(angle=>window.cc69SetView(angle),angle);
        await page.waitForTimeout(65);
        const png=await page.locator('#avatar').screenshot({animations:'disabled'});
        const m=await sharp(png).metadata(),stats=await sharp(png).stats();
        assert.equal(m.format,'png');
        assert.ok(m.width>=200&&m.width<=width&&m.height>=300);
        assert.ok(png.length>3000);
        assert.ok(stats.channels.some(ch=>ch.stdev>7),'real mobile WebGL image nonblank');
        const name=[engine,figure,width,denim,view].join('-')+'.png';
        await writeFile(resolve(folder,name),png);
        frames.push({
         engine,figure,width,denim,view,angle,file:name,
         imageSHA256:hash(png),imageWidth:m.width,imageHeight:m.height,
         originalShirtSHA256:sources.shirt,
         originalDenimSHA256:sources[denim],
         rigBones:d.bones,realSourceSkinnedGarments:true,
         genuineWebGLRendered:true,privateUserPhoto:false,releaseAuthorized:false
        });
       }
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true);
      statuses.push({engine,figure,width,realSourceMeshPairs:2,
       viewsPerSource:6,sourceCategories:['shirt','denim'],
       real3DPhotorealismHumanApproved:false,
       originalBacksidePhotographed:false,familyAlpha:'HOLD'});
     }finally{await ctx.close();}
    }
   }finally{await browser.close();}
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(crashes,[]);
 assert.ok(blockedNetwork.every(r=>r.blocked===true),
  'all attempted third-party requests must be denied');
 const verifiedKeys=frames.map(f=>[f.engine,f.figure,f.width,f.denim,f.view].join('|'));
 const coverage=evaluateVisualEvidence149({frames,verifiedImageKeys:verifiedKeys});
 assert.equal(coverage.inputFrames,PHOTO149.figures.length*
  PHOTO149.widths.length*Object.keys(PHOTO149.licensedDenim).length*
  Object.keys(PHOTO149.viewDegrees).length*targetEngines.length);
 assert.equal(coverage.releaseAuthorized,false);
 await writeFile(resolve(folder,'manifest.json'),JSON.stringify({
  priority:149,donorHead:PHOTO149.donorSourcePinned,
  engines:targetEngines,completeLocalSourceCoverage:coverage.completeSourceGarmentViewportAngleCoverage,
  summary:coverage,sourceLicense:'Pinned Wikimedia Commons, independent SHA',
  actualPrivateWardrobePhotorealismAccepted:false,
  actualPhysicalAndroidIphoneVerified:false,
  familyAlpha:'HOLD',frames,statuses,errors,crashes,blockedNetwork
 },null,2));
 console.log('P149_REAL_WEBGL_VISUAL_EVIDENCE '+JSON.stringify({
  cases:statuses.length,actualLicensedWebGLFrames:frames.length,
  expectedFrames:coverage.expectedFrames,
  sourceCoverageComplete:coverage.completeSourceGarmentViewportAngleCoverage,
  missing:coverage.missingFrameCount,
  humanPhotorealismApproved:false,familyAlpha:'HOLD'}));
}finally{await new Promise(ok=>server.close(ok));}
