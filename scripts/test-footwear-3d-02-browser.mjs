/** Actual Chromium/WebGL source-honest shoe research. No simulated canvas.
 * Captures exactly 2 rigs * 3 widths * 2 CC0 sources * 9 angles = 108 PNGs.
 */
import {chromium} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),folder='benchmark/footwear-3d-02',extensions={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURI(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+path);
  if(relative(root,file).startsWith('..')){res.writeHead(403);res.end();return;}
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':extensions[extname(file)]||'application/octet-stream','cache-control':'no-store','access-control-allow-origin':'none'});
  res.end(bytes);
 }catch(e){res.writeHead(404);res.end('Missing local evidence');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
await mkdir(folder,{recursive:true});
const digest=v=>createHash('sha256').update(v).digest('hex');
const widths=[320,390,430],figures=['female','male'],choices=['commons-0080','commons-0081'],angles=[0,45,90,135,180,225,270,315,360];
const cases=[],comparisons=[],external=[],errors=[],originals={};
for(const id of choices)originals[id]=digest(await readFile('benchmark/fixtures/'+id+'.jpg'));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:1});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='127.0.0.1'){external.push({url:route.request().url,method:route.request().method()});return route.abort();}
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(width+': '+e.message));
  await page.goto(host+'/research/footwear-3d-02/index.html?footwear02=research',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__footwear02Ready===true||!!window.__footwear02Error,{timeout:200000});
  const fatal=await page.evaluate(()=>window.__footwear02Error||null);if(fatal)throw Error('Original source rig load: '+fatal);
  for(const figure of figures){
   if(figure==='male'){
    await page.evaluate(async()=>window.__footwear02.load('male'));
   }
   const base=await page.evaluate(()=>window.__footwear02.state());
   assert.equal(base.stats.bones,163,'Actual original 163-bone rig');
   assert.equal(base.outfit.mode,'shirt-pants');
   assert.equal(base.outfit.pants.photoApplied,true,'Genuine photographed denim');
   // Before state: barefoot, not a generic substitute.
   const initial=await page.evaluate(()=>window.__footwear02.select(null));
   assert.equal(initial.status,'PHOTO_ONLY_FALLBACK');
   const bare=await page.screenshot({animations:'disabled'});
   await writeFile(folder+'/comparison-'+width+'-'+figure+'-bare.png',bare);
   for(const choice of choices){
    const beforeCamera=await page.evaluate(()=>{window.__footwear02.rotate(135);return window.__footwear02.state().cameraPosition;});
    const result=await page.evaluate(id=>window.__footwear02.select(id),choice);
    assert.equal(result.status,'PROVISIONAL_SOURCE_INFORMED_MESH');
    assert.equal(result.sourceAuthenticated,true);
    assert.equal(result.independentLeftRight,true);
    assert.ok(result.groundErrors.every(n=>n>=0&&n<=.012));
    const expected=originals[choice];assert.equal(result.originalSHA256,expected);
    const contact=await page.evaluate(()=>window.__footwear02.audit());
    assert.equal(contact.realTrianglesMeasured,true);
    assert.equal(contact.perSide.length,2);
    assert.ok(contact.perSide.every(x=>Number.isFinite(x.soleGroundClearanceM)));
    const live=await page.evaluate(()=>window.__footwear02.state());
    assert.equal(live.shoe.pairCount,2);assert.equal(live.shoe.meshCount,6);
    assert.deepEqual(live.cameraPosition,beforeCamera,'Shoe swap must preserve actual selected camera orientation');
    assert.equal(new Set(live.shoe.geometryIds).size,2);
    if(choice==='commons-0080'){
      await page.evaluate(()=>window.__footwear02.rotate(0));
      const after=await page.screenshot({animations:'disabled'});
      await writeFile(folder+'/comparison-'+width+'-'+figure+'-shoes.png',after);
    }
    for(const angle of angles){
     const rotated=await page.evaluate(deg=>window.__footwear02.rotate(deg),angle);
     assert.equal(rotated.stats.bones,163);
     const file=width+'-'+figure+'-'+choice+'-'+String(angle).padStart(3,'0')+'.png';
     await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
     const png=await page.locator('#view').screenshot({animations:'disabled',timeout:30000});
     assert.equal(png.subarray(1,4).toString(),'PNG');
     const stats=await sharp(png).stats(),meta=await sharp(png).metadata();
     assert.ok(png.byteLength>6500&&stats.channels.some(x=>x.stdev>15),'Actual rendered 3D cannot be blank');
     assert.equal(meta.width,width);
     await writeFile(folder+'/'+file,png);
     cases.push({file,sha256:digest(png),width,figure,source:choice,angle,webgl:true,
      originalSHA256:expected,bones:rotated.stats.bones,shoeMeshes:live.shoe.meshCount,
      actualDenim:base.outfit.pants.photoApplied,trueLeftRight:result.independentLeftRight,
      floorErrors:result.groundErrors,actualBodyCrossings:contact.actualSkinnedBodyTriangleCrossings,actualDenimCrossings:contact.actualPhotographedDenimTriangleCrossings,hemMeasured:contact.perSide,photoTexture:false,sourceNeutralMissingViews:true});
    }
   }
   // Unsupported photo fallback must not change shirt, jeans, or rig.
   const fallback=await page.evaluate(()=>window.__footwear02.select('photo:commons-0080'));
   const photoOnly=await page.screenshot({animations:'disabled'});
   await writeFile(folder+'/comparison-'+width+'-'+figure+'-photo-fallback.png',photoOnly);
   const trio=await Promise.all(['bare','photo-fallback','shoes'].map(k=>readFile(folder+'/comparison-'+width+'-'+figure+'-'+k+'.png')));
   const combined=await sharp({create:{width:width*3,height:950,channels:4,background:'#f4f3ef'}})
     .composite(trio.map((input,i)=>({input,top:0,left:i*width}))).png().toBuffer();
   await writeFile(folder+'/comparison-'+width+'-'+figure+'-contact-sheet.png',combined);
   comparisons.push({width,figure,bare:digest(trio[0]),photoOnly:digest(trio[1]),mesh:digest(trio[2]),
     contactSheet:'comparison-'+width+'-'+figure+'-contact-sheet.png'});
   assert.equal(fallback.status,'PHOTO_ONLY_FALLBACK');
   const after=await page.evaluate(()=>window.__footwear02.state());
   assert.equal(after.outfit.mode,'shirt-pants');assert.equal(after.shoe.pairCount,0);
  }
  await page.evaluate(()=>window.__footwear02.dispose());
  await context.close();
 }
 assert.equal(cases.length,108,'108 genuine WebGL captures, not inferred screenshots');
 assert.equal(external.length,0,'NO external network data including private JPEGs');
 assert.equal(errors.length,0,'No browser page errors');
 for(const id of choices)assert.equal(digest(await readFile('benchmark/fixtures/'+id+'.jpg')),originals[id],'source unchanged');
 const results={status:'REVIEW_VISUAL',realWebGL:true,count:cases.length,widths,figures,choices,angles,
  sources:originals,comparisons,sourcePhotoBytePreserved:true,independentShoes:true,staticFloorWithin12mm:true,
  externalRequests:external,errors,physicalAndroid:'NOT TESTED',physicalIPhone:'NOT TESTED',
  photoProjectedMesh:false,sourceNeutralSides:true,continuousPhysicsCertified:false,
  humanVisualCertified:false,productionModified:false,familyAlpha:'HOLD',cases};
 await writeFile(folder+'/results.json',JSON.stringify(results,null,2));
 console.log('FOOTWEAR02_ACTUAL_MOBILE_WEBGL',JSON.stringify({count:cases.length,widths,figures,choices,originals,verdict:results.status}));
}catch(e){
 await writeFile(folder+'/error.json',JSON.stringify({message:String(e),errors,external,completed:cases.length},null,2));
 throw e;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
